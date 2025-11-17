import { tool } from 'ai';
import { z } from 'zod';
import { db } from '@/app/db/index';
import { course as c, campus as cam, embedding as e } from '@/app/db/schema';
import { sql, eq, and } from 'drizzle-orm';
import { semanticSearch } from '@/lib/semantic-search';
import { normalizeHawaiian, matchesNormalized } from '@/lib/normalize-hawaiian';

export const getCourse = tool({
    description: "Search for courses by course code (e.g. 'ICS 211') or keywords (e.g. 'biology', 'lab courses'). Returns course details including metadata for prerequisite parsing. If campus is provided, filters results to that campus only.",
    inputSchema: z.object({
        query: z.string().optional().describe("Course code OR keyword OR empty"),
        campus: z.string().optional().describe("Filter by campus"),
        limit: z.number().optional().default(15),
    }),
    execute: async ({ query, campus, limit = 15 }) => {
        try {
            // Table readiness checks to avoid crashes on fresh environments
            const tables = await db.execute(sql`SELECT 
                to_regclass('public.courses') AS courses,
                to_regclass('public.campuses') AS campuses,
                to_regclass('public.embeddings') AS embeddings
            `);
            const first: any = Array.isArray(tables) ? tables[0] : (tables as any).rows?.[0];
            const hasCourses = !!first?.courses;
            const hasCampuses = !!first?.campuses;
            const hasEmbeddings = !!first?.embeddings;

            // Check if it's a course code
            const codeMatch = query?.trim().match(/^([A-Z]+)\s*(\d+[A-Z]*)$/i);
            
            if (codeMatch) {
                if (!hasCourses || !hasCampuses) {
                    return {
                        found: false,
                        message: 'Course lookup isn\'t available yet (database not ready). I can still help plan a roadmap from general knowledge if you\'d like.',
                    };
                }
                // Exact course lookup with metadata from embeddings
                const [, prefix, number] = codeMatch;
                const result = await db
                    .select({
                        prefix: c.coursePrefix,
                        number: c.courseNumber,
                        title: c.courseTitle,
                        desc: c.courseDesc,
                        credits: c.numUnits,
                        dept: c.deptName,
                        campus: cam.name,
                        metadata: e.metadata,
                    })
                    .from(c)
                    .leftJoin(cam, eq(c.campusId, cam.id))
                    .leftJoin(e, eq(e.courseId, c.id))
                    .where(sql`UPPER(${c.coursePrefix}) = ${prefix.toUpperCase()} AND UPPER(${c.courseNumber}) = ${number.toUpperCase()}`)
                    .limit(1);

                if (!result?.length) {
                    return {
                        message: `I couldn't find ${query}. Try checking the course code or searching by subject.`,
                        found: false,
                    };
                }

                const course = result[0];
                
                // Extract metadata string for prerequisites
                const metadataStr = course.metadata && typeof course.metadata === 'object' 
                    ? (course.metadata as any).metadata || ''
                    : '';
                
                return {
                    found: true,
                    code: `${course.prefix} ${course.number}`,
                    title: course.title || 'Untitled',
                    description: course.desc || 'No description available',
                    credits: course.credits || 'N/A',
                    department: course.dept || 'N/A',
                    campus: course.campus || 'N/A',
                    metadata: metadataStr,
                    formatted: [
                        `**${course.prefix} ${course.number}** - ${course.title || 'Untitled'}`,
                        course.campus && `Campus: ${course.campus}`,
                        course.dept && `Department: ${course.dept}`,
                        course.credits && `Credits: ${course.credits}`,
                        course.desc && `\n${course.desc}`,
                    ].filter(Boolean).join('\n'),
                };
            }

            // Keyword search or list
            // For keyword searches, use semantic search for relevance ranking
            if (query?.trim()) {
                // Use semantic search with embeddings for better relevance
                if (!hasEmbeddings) {
                    return {
                        found: false,
                        message: 'Semantic course search is not available yet here. Try a specific course code (e.g., ICS 211) or I can still craft a general roadmap.',
                    };
                }
                const results = await semanticSearch(query, limit, 0.3);
                
                // Filter by campus if specified using normalized matching
                let filteredResults = results;
                if (campus) {
                    filteredResults = results.filter(r => matchesNormalized(r.campusName, campus));
                }
                
                if (!filteredResults?.length) {
                    return {
                        message: `No courses found matching "${query}"${campus ? ` at ${campus}` : ''}. Try a different search term or check the spelling.`,
                        found: false,
                    };
                }

                const list = filteredResults.map((r, i) => 
                    `${i + 1}. **${r.coursePrefix} ${r.courseNumber}** - ${r.courseTitle}${r.numUnits ? ` (${r.numUnits} cr)` : ''}${r.campusName ? ` @ ${r.campusName}` : ''}`
                ).join('\n');

                return {
                    found: true,
                    count: filteredResults.length,
                    formatted: `Found ${filteredResults.length} relevant course${filteredResults.length > 1 ? 's' : ''}:\n\n${list}`,
                };
            }
            
            // List courses (no query) - require campus filter to avoid overwhelming results
            if (!campus) {
                return {
                    message: `To help you better, please either:\n- Search by keywords (e.g., "biology", "computer science", "lab courses")\n- Specify a campus to browse courses from (e.g., "UH Manoa", "Leeward CC")`,
                    found: false,
                };
            }
            
            // List courses for a specific campus
            if (!hasCourses || !hasCampuses) {
                return {
                    found: false,
                    message: `I can\'t browse courses for ${campus} yet (database not ready). I can still outline a reasonable semester plan based on typical curricula.`,
                };
            }
            const courses = await db
                .select({
                    prefix: c.coursePrefix,
                    number: c.courseNumber,
                    title: c.courseTitle,
                    credits: c.numUnits,
                    campus: cam.name,
                })
                .from(c)
                .leftJoin(cam, eq(c.campusId, cam.id))
                .where(sql`(
                    translate(LOWER(${cam.name}), 'āēīōūʻ''''', 'aeiou') LIKE ${`%${normalizeHawaiian(campus)}%`} OR
                    ${cam.aliases}::text ILIKE ${`%${campus}%`}
                )`)
                .orderBy(c.coursePrefix, c.courseNumber)
                .limit(limit);

            if (!courses?.length) {
                return {
                    message: `No courses found at ${campus}. Check the campus name or try a keyword search.`,
                    found: false,
                };
            }

            const list = courses.map((c, i) => 
                `${i + 1}. **${c.prefix} ${c.number}** - ${c.title}${c.credits ? ` (${c.credits} cr)` : ''}`
            ).join('\n');

            return {
                found: true,
                count: courses.length,
                formatted: `Showing ${courses.length} course${courses.length > 1 ? 's' : ''} from ${courses[0].campus}:\n\n${list}\n\nTip: Try searching with keywords to find specific subjects.`,
            };
        } catch (error) {
            console.error('getCourse error:', error);
            return {
                message: 'I\'m having trouble searching for courses right now. Please try again in a moment.',
                found: false,
                error: true,
            };
        }
    }
});
