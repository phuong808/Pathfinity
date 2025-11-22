'use server';

import { db } from '@/app/db';
import { profile, campus, course } from '@/app/db/schema';
import { eq } from 'drizzle-orm';
import { openai } from '@ai-sdk/openai';
import { generateText } from 'ai';
import fs from 'fs';
import path from 'path';

// Define pathway template type
interface PathwayTemplate {
  program_name: string;
  institution: string;
  total_credits: number;
  years: Array<{
    year_number: number;
    semesters: Array<{
      semester_name: 'fall_semester' | 'spring_semester' | 'summer_semester';
      credits: number;
      courses: Array<{
        name: string;
        credits: number;
      }>;
    }>;
  }>;
}

/**
 * Load pathway templates from manoa_degree_pathways.json
 */
function loadPathwayTemplates(): PathwayTemplate[] {
  const filePath = path.join(process.cwd(), 'app', 'db', 'data', 'manoa_degree_pathways.json');
  const fileContent = fs.readFileSync(filePath, 'utf-8');
  return JSON.parse(fileContent);
}


/**
 * Find matching pathway template by program name
 * The program name from the form (e.g., "Computer Science, B.S.")
 * should match against pathway template program_name
 */
function findMatchingPathway(
  programName: string,
  templates: PathwayTemplate[]
): PathwayTemplate | null {
  const normalized = programName.toLowerCase().trim();

  // Try exact match first
  for (const template of templates) {
    if (template.program_name.toLowerCase().trim() === normalized) {
      return template;
    }
  }

  // Try partial match - check if program name contains key terms
  for (const template of templates) {
    const templateName = template.program_name.toLowerCase();
    if (templateName.includes(normalized)) {
      return template;
    }
  }

  // Try reverse: check if our program name contains the template name
  for (const template of templates) {
    const templateName = template.program_name.toLowerCase();
    if (normalized.includes(templateName)) {
      return template;
    }
  }

  return null;
}

/**
 * Extract all unique course codes from pathway template
 */
function extractPathwayCourses(pathwayTemplate: PathwayTemplate): string[] {
  const courseCodes = new Set<string>();

  pathwayTemplate.years.forEach((year) => {
    year.semesters.forEach((semester) => {
      semester.courses.forEach((course) => {
        // Extract course codes from the name field
        // Handle cases like "ICS 111", "MATH 215 or 241", "FW (or FQ)", etc.
        const matches = course.name.match(/([A-Z]+)\s+(\d+[A-Z]*)/g);
        if (matches) {
          matches.forEach((match) => {
            courseCodes.add(match.trim());
          });
        }
      });
    });
  });

  return Array.from(courseCodes);
}

/**
 * Query database for course information based on course codes
 */
async function getPathwayCoursesFromDB(courseCodes: string[], campusId: string): Promise<Map<string, any>> {
  const courseMap = new Map<string, any>();

  if (courseCodes.length === 0) {
    return courseMap;
  }

  // Parse course codes into prefix and number
  const courseQueries = courseCodes.map((code) => {
    const match = code.match(/^([A-Z]+)\s+(\d+[A-Z]*)$/);
    if (match) {
      return { prefix: match[1], number: match[2] };
    }
    return null;
  }).filter(Boolean);

  if (courseQueries.length === 0) {
    return courseMap;
  }

  // Query database for all courses
  // Note: We need to query each course individually since we can't use OR conditions easily
  for (const query of courseQueries) {
    if (!query) continue;

    try {
      const courses = await db
        .select()
        .from(course)
        .where(
          eq(course.campusId, campusId)
        )
        .limit(1000); // Get a reasonable batch

      // Filter in memory for matching prefix and number
      const matchingCourses = courses.filter(
        (c) => c.coursePrefix === query.prefix && c.courseNumber === query.number
      );

      matchingCourses.forEach((c) => {
        const key = `${c.coursePrefix} ${c.courseNumber}`;
        courseMap.set(key, {
          code: key,
          title: c.courseTitle,
          description: c.courseDesc,
          units: c.numUnits,
        });
      });
    } catch (error) {
      console.error(`Error querying course ${query.prefix} ${query.number}:`, error);
    }
  }

  return courseMap;
}

/**
 * Process pathway with AI to resolve course choices and add activities/milestones
 */
async function processPathwayWithAI(
  pathwayTemplate: PathwayTemplate,
  courseData: Map<string, any>,
  profileData: any,
): Promise<PathwayTemplate> {
  // Format course data for the AI
  const courseList = Array.from(courseData.values())
    .map((c) => {
      const desc = c.description ? `\n  Description: ${c.description}` : '';
      return `${c.code}: ${c.title}${desc}`;
    })
    .join('\n\n');

  const prompt = `You are processing a college degree pathway for a UH Manoa student. Your job is to:
1. Resolve course choices (pick one option when there are multiple)
2. Identify which courses relate to the student's profile
3. Generate relevant activities and milestones for each semester

STUDENT PROFILE:
- Program: ${profileData.program || 'Not specified'}
- Career Goal: ${profileData.career || 'Not specified'}
- Interests: ${profileData.interests?.join(', ') || 'Not specified'}
- Skills: ${profileData.skills?.join(', ') || 'Not specified'}

COURSE CATALOG (courses in this pathway):
${courseList || 'No course data available'}

PATHWAY TEMPLATE (JSON):
${JSON.stringify(pathwayTemplate, null, 2)}

INSTRUCTIONS:

1. **RESOLVE COURSE CHOICES**: When a course field contains multiple options (using "or", "/", "and", or commas), select EXACTLY ONE course.
   - Example: "MATH 215 or 241 or 251A" → choose "MATH 241"
   - Choose the option that best fits the student's career goals, skills, and interests
   - Use the course catalog above to understand what each course covers
   - The final course name must be ONLY the course code with no "or", "and", "/", or other options remaining

2. **PRESERVE EVERYTHING ELSE**: 
   - Keep ALL electives as-is (e.g., "Elective", "ICS 400+", "Elective 300+")
   - Keep ALL general education codes unchanged (FW, FQ, FG, DS, DA, DH, DL, DB, DP, DY, HSL)
   - Keep ALL course codes that don't have choices
   - Preserve exact spacing and formatting

3. **MARK RELATED COURSES**: For EVERY course object, include an "isRelated" field.
   - Set to null if the course doesn't relate to the student's profile
   - Set to an array of objects if the course relates to skills, interests, or career
   - Each object must have: { type: 'skill'|'interest'|'career', value: 'exact text from profile' }
   - ONLY mark as related if:
     a) The course catalog description explicitly mentions the skill/interest/career term, OR
     b) The course is clearly relevant based on its title and the student's profile

4. **GENERATE ACTIVITIES**: For EVERY semester, create an "activities" array with at least 2 actionable items.
   - Make them specific to the courses being taken that semester
   - Align with the student's career goal and interests
   - Use complete, actionable sentences

5. **GENERATE MILESTONES**: For EVERY semester, create a "milestones" array with at least 2 specific achievements.
   - Make them measurable and semester-specific
   - Align with academic progress and career goals
   - Use complete sentences

CRITICAL REQUIREMENTS:
- EVERY semester must have both "activities" and "milestones" arrays
- EVERY course must have an "isRelated" field (null or array)
- ALL course choices must be resolved to a single course code
- Keep ALL years, ALL semesters, ALL courses
- DO NOT replace electives with specific courses

Return the COMPLETE modified pathway as valid JSON.`;

  const { text } = await generateText({
    model: openai('gpt-4o-mini'),
    prompt,
    temperature: 0.2,
  });

  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error('No JSON found in AI response');
  }

  const parsed: any = JSON.parse(jsonMatch[0]);

  // Normalize activities and milestones arrays: ensure they exist and contain only strings
  if (parsed && Array.isArray(parsed.years)) {
    for (const y of parsed.years) {
      for (const s of y.semesters || []) {
        s.activities = normalizeStringArray(s.activities) || [];
        s.milestones = normalizeStringArray(s.milestones) || [];
      }
    }
  }

  return parsed;
}

// Helper: normalize array entries that may be strings or objects like { text: '...' }
function normalizeStringArray(arr?: any): string[] | undefined {
  if (!arr) return undefined;
  try {
    return (arr || [])
      .map((it: any) => (typeof it === 'string' ? it : it && typeof it.text === 'string' ? it.text : String(it)))
      .filter((s: any) => typeof s === 'string' && s.trim().length > 0);
  } catch {
    return undefined;
  }
}

/**
 * Get campus information
 */
async function getCampusInfo(campusNameOrId: string) {
  let campuses = await db
    .select()
    .from(campus)
    .where(eq(campus.id, campusNameOrId))
    .limit(1);

  if (campuses.length === 0) {
    const allCampuses = await db.select().from(campus);
    campuses = allCampuses.filter((c) => {
      const nameMatch = c.name.toLowerCase() === campusNameOrId.toLowerCase();
      const aliases = Array.isArray(c.aliases) ? c.aliases : [];
      const aliasMatch = aliases.some((alias: string) => alias.toLowerCase() === campusNameOrId.toLowerCase());
      return nameMatch || aliasMatch;
    });
  }

  if (campuses.length === 0) {
    throw new Error(`Campus "${campusNameOrId}" not found`);
  }

  return campuses[0];
}

/**
 * Main function to generate and save roadmap for a profile
 */
export async function generateAndSaveRoadmap(profileId: number): Promise<void> {
  const profiles = await db
    .select()
    .from(profile)
    .where(eq(profile.id, profileId))
    .limit(1);

  if (profiles.length === 0) {
    throw new Error(`Profile ${profileId} not found`);
  }

  const profileData = profiles[0];

  if (!profileData.college || !profileData.program) {
    throw new Error('Profile is missing required fields: college or program');
  }

  const campusInfo = await getCampusInfo(profileData.college);

  if (campusInfo.id !== 'uh_manoa') {
    await db
      .update(profile)
      .set({
        roadmap: null,
        updatedAt: new Date(),
      })
      .where(eq(profile.id, profileId));

    return;
  }

  const pathwayTemplates = loadPathwayTemplates();
  const matchingPathway = findMatchingPathway(profileData.program, pathwayTemplates);

  if (!matchingPathway) {
    await db
      .update(profile)
      .set({
        roadmap: null,
        updatedAt: new Date(),
      })
      .where(eq(profile.id, profileId));

    return;
  }

  const pathwayCourses = extractPathwayCourses(matchingPathway);
  const courseData = await getPathwayCoursesFromDB(pathwayCourses, campusInfo.id);
  const processedRoadmap = await processPathwayWithAI(matchingPathway, courseData, profileData);

  const { years, ...otherFields } = processedRoadmap as any;

  const finalRoadmap = {
    program_name: processedRoadmap.program_name || matchingPathway.program_name,
    institution: processedRoadmap.institution || campusInfo.name,
    total_credits: processedRoadmap.total_credits || matchingPathway.total_credits,
    career_goal: profileData.career || undefined,
    interests: (profileData.interests as string[]) || undefined,
    skills: (profileData.skills as string[]) || undefined,
    ...otherFields,
    years: years || [],
  };

  await db
    .update(profile)
    .set({
      roadmap: finalRoadmap as any,
      updatedAt: new Date(),
    })
    .where(eq(profile.id, profileId));
}