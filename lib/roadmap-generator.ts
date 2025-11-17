'use server';

import { db } from '@/app/db';
import { profile, campus } from '@/app/db/schema';
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

// Define course from database
interface CourseRecord {
  coursePrefix: string;
  courseNumber: string;
  courseTitle: string;
  numUnits: string;
  metadata?: string;
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
 * Load all UH Manoa courses from manoa_courses.json
 */
function loadManoaCourses(): CourseRecord[] {
  const filePath = path.join(process.cwd(), 'app', 'db', 'data', 'manoa_courses.json');
  const fileContent = fs.readFileSync(filePath, 'utf-8');
  const courses = JSON.parse(fileContent);
  
  return courses.map((c: any) => ({
    coursePrefix: c.course_prefix,
    courseNumber: c.course_number,
    courseTitle: c.course_title,
    numUnits: c.num_units,
    metadata: c.metadata || '',
  }));
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
 * Extract major department prefix from pathway
 */
function extractMajorPrefix(pathwayTemplate: PathwayTemplate): string {
  // Look for most common course prefix in the pathway
  const prefixCounts = new Map<string, number>();
  
  pathwayTemplate.years.forEach(year => {
    year.semesters.forEach(semester => {
      semester.courses.forEach(course => {
        const match = course.name.match(/^([A-Z]+)/);
        if (match) {
          const prefix = match[1];
          // Skip gen-ed codes
          if (!['FW', 'FQ', 'FG', 'DS', 'DA', 'DH', 'DL', 'DB', 'DP', 'DY', 'HSL'].includes(prefix)) {
            prefixCounts.set(prefix, (prefixCounts.get(prefix) || 0) + 1);
          }
        }
      });
    });
  });
  
  // Return most common prefix
  let maxCount = 0;
  let majorPrefix = '';
  prefixCounts.forEach((count, prefix) => {
    if (count > maxCount) {
      maxCount = count;
      majorPrefix = prefix;
    }
  });
  
  return majorPrefix;
}

/**
 * Get relevant courses for elective replacement
 */
function getRelevantCourses(
  allCourses: CourseRecord[],
  majorPrefix: string
): { byLevel: Map<string, CourseRecord[]>, all: CourseRecord[] } {
  // Filter to major courses
  const majorCourses = allCourses.filter(c => c.coursePrefix === majorPrefix);
  
  // Organize by level
  const byLevel = new Map<string, CourseRecord[]>();
  byLevel.set('100-200', []);
  byLevel.set('300', []);
  byLevel.set('400+', []);
  
  majorCourses.forEach(course => {
    const num = parseInt(course.courseNumber);
    if (!isNaN(num)) {
      if (num < 300) {
        byLevel.get('100-200')!.push(course);
      } else if (num < 400) {
        byLevel.get('300')!.push(course);
      } else {
        byLevel.get('400+')!.push(course);
      }
    }
  });
  
  return { byLevel, all: majorCourses };
}

/**
 * Extract prerequisite information from course metadata
 */
function extractPrerequisites(metadata: string): string {
  if (!metadata) return '';
  
  const prereqMatch = metadata.match(/prerequisite[s]?:\s*([^;.]+)/i) || 
                      metadata.match(/pre:\s*([^;.]+)/i) ||
                      metadata.match(/prereq[s]?:\s*([^;.]+)/i);
  
  return prereqMatch ? prereqMatch[1].trim() : '';
}

/**
 * Simple function to process pathway and replace electives using AI
 */
async function processPathwayWithAI(
  pathwayTemplate: PathwayTemplate,
  relevantCourses: { byLevel: Map<string, CourseRecord[]>, all: CourseRecord[] },
  profileData: any,
  majorPrefix: string
): Promise<PathwayTemplate> {
  const level400 = relevantCourses.byLevel.get('400+')!.slice(0, 30);
  const level300 = relevantCourses.byLevel.get('300')!.slice(0, 20);
  
  const formatCourseWithPrereq = (c: CourseRecord) => {
    const prereq = extractPrerequisites(c.metadata || '');
    return prereq 
      ? `${c.coursePrefix} ${c.courseNumber}: ${c.courseTitle} [Prereq: ${prereq}]`
      : `${c.coursePrefix} ${c.courseNumber}: ${c.courseTitle}`;
  };
  
  const courseList = `
LEVEL 400+ COURSES (for "400+ Elective" replacements):
${level400.map(formatCourseWithPrereq).join('\n')}

LEVEL 300 COURSES (for "300+ Elective" replacements):
${level300.map(formatCourseWithPrereq).join('\n')}
`.trim();

  const prompt = `You are processing a college degree pathway. Your job is to resolve ambiguous course selections and replace electives.

STUDENT INFO:
- Program: ${profileData.program || 'Not specified'}
- Career Goal: ${profileData.career || 'Not specified'}
- Interests: ${profileData.interests?.join(', ') || 'Not specified'}

AVAILABLE COURSES (with prerequisites shown in [Prereq: ...]):
${courseList}

PATHWAY TEMPLATE (JSON):
${JSON.stringify(pathwayTemplate, null, 2)}

RULES:

1. **RESOLVE COURSE CHOICES**: When a course field contains multiple options (using "or", "/", "and", or commas), select EXACTLY ONE course.
   - Replace the entire field with only the chosen course code
   - Choose the option that best fits the student's career goals and interests
   - Consider course sequencing: if choosing between sequential courses (e.g., MATH 241 vs MATH 251), pick the one that makes sense based on what comes before and after
   
2. **REPLACE ELECTIVES**: Replace any course containing the word "Elective" with an actual course from the available courses list.
   - For "${majorPrefix} 400+" or "${majorPrefix} 300+" electives, choose from the corresponding level in the available courses
   - Select courses that align with the career goal and interests
   - Never use the same course twice

3. **REPLACE GENERIC NAMES**: If a course name is NOT a course code (no department prefix + number), it must be replaced.
   - Course codes have this format: DEPT NNN (e.g., MATH 241, ICS 111, BUS 312)
   - Generic names to replace: any text without a department code and number
   - Common patterns: "Calculus", "Statistics", "Writing", "Communication", "Computer Competency"
   - If a course doesn't match the DEPT+NUMBER pattern, find and use the appropriate course code

4. **RESPECT PREREQUISITES AND SEQUENCES**: When selecting courses, consider both prerequisites and logical progression.
   - Check the [Prereq: ...] information - only select courses if prerequisites appear in earlier semesters
   - Recognize sequential courses: courses with consecutive numbers often form sequences (e.g., MATH 241 to MATH 242)
   - If a higher-numbered course appears later (e.g., MATH 242 in spring), ensure you pick the appropriate lower-numbered prerequisite earlier (e.g., MATH 241 in fall)
   - If prerequisites aren't met, choose a different course

5. **PRESERVE GEN ED CODES**: Do NOT modify general education requirement codes.
   - Keep these unchanged: FW, FQ, FG, DS, DA, DH, DL, DB, DP, DY, HSL, and combinations like "DA/DH/DL"
   - Preserve exact spacing (e.g., "FG (A/B/C)" not "FG(A/B/C)")
   - Keep codes with level indicators like "DA/DH/DL 300+"

6. **CLEAN OUTPUT**: Use only course codes without annotations.
   - Remove any parenthetical notes or designations
   - Use official course codes only, never generic names

Return the COMPLETE modified pathway as valid JSON. Keep ALL years, ALL semesters, ALL courses.`;
  
  const { text } = await generateText({
    model: openai('gpt-4o-mini'),
    prompt,
    temperature: 0.2,
  });
  
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error('No JSON found in AI response');
  }
  
  return JSON.parse(jsonMatch[0]);
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
    campuses = allCampuses.filter(c => {
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
  const matchingPathway = findMatchingPathway(
    profileData.program,
    pathwayTemplates
  );

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

  const allCourses = loadManoaCourses();
  const majorPrefix = extractMajorPrefix(matchingPathway);
  const relevantCourses = getRelevantCourses(allCourses, majorPrefix);

  const processedRoadmap = await processPathwayWithAI(
    matchingPathway,
    relevantCourses,
    profileData,
    majorPrefix
  );

  const finalRoadmap = {
    ...processedRoadmap,
    career_goal: profileData.career || undefined,
    interests: profileData.interests as string[] || undefined,
    skills: profileData.skills as string[] || undefined,
  };

  await db
    .update(profile)
    .set({
      roadmap: finalRoadmap as any,
      updatedAt: new Date(),
    })
    .where(eq(profile.id, profileId));
}

/**
 * Test function to generate roadmap (for CLI testing)
 */
export async function testRoadmapGeneration(profileId: number) {
  await generateAndSaveRoadmap(profileId);
  
  const profiles = await db
    .select()
    .from(profile)
    .where(eq(profile.id, profileId))
    .limit(1);

  if (profiles.length > 0 && profiles[0].roadmap) {
    console.log(JSON.stringify(profiles[0].roadmap, null, 2));
  }
}
