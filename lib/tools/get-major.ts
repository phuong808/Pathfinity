import { tool } from 'ai';
import { z } from 'zod';
import { db } from '@/app/db/index';
import { major as m, campus as cam } from '@/app/db/schema';
import { sql, eq } from 'drizzle-orm';
import { normalizeHawaiian } from '@/lib/normalize-hawaiian';

async function tablesReady(): Promise<boolean> {
    try {
        const res = await db.execute(sql`SELECT to_regclass('public.majors') AS majors, to_regclass('public.campuses') AS campuses`);
        const first: any = Array.isArray(res) ? res[0] : (res as any).rows?.[0];
        return !!(first?.majors && first?.campuses);
    } catch {
        return false;
    }
}

export const getMajor = tool({
    description: "Search for majors by keyword or list all majors at a campus. Use when asked about majors, programs, or degrees of study.",
    inputSchema: z.object({
        query: z.string().optional().describe("Major name or keyword (e.g., 'computer', 'business', 'engineering')"),
        campus: z.string().optional().describe("Filter by campus name (e.g., 'UH Manoa', 'Leeward CC')"),
        limit: z.number().optional().default(30),
    }),
    execute: async ({ query, campus, limit = 30 }) => {
        try {
            // Gracefully handle environments where tables haven't been created yet
            const ready = await tablesReady();
            if (!ready) {
                return {    
                    found: false,
                    message: 'Majors data is not available yet in this environment. Try asking about courses or campuses, or come back after data is loaded.',
                };
            }

            const conditions = [];
            if (query?.trim()) {
                conditions.push(sql`${m.title} ILIKE ${`%${query}%`}`);
            }
            if (campus) {
                // Normalize Hawaiian characters for matching (ā→a, ʻ removed, etc.)
                // Also check aliases field which includes common abbreviations like "UH Manoa"
                conditions.push(sql`(
                    translate(LOWER(${cam.name}), 'āēīōūʻ''''', 'aeiou') LIKE ${`%${normalizeHawaiian(campus)}%`} OR
                    ${cam.aliases}::text ILIKE ${`%${campus}%`}
                )`);
            }

            const majors = await db
                .select({
                    id: m.id,
                    title: m.title,
                    campus: cam.name,
                })
                .from(m)
                .leftJoin(cam, eq(m.campusId, cam.id))
                .where(conditions.length ? sql`${sql.join(conditions, sql` AND `)}` : undefined)
                .orderBy(m.title)
                .limit(limit);

            if (!majors?.length) {
                return {
                    found: false,
                    message: `No majors found${query ? ` matching "${query}"` : ''}${campus ? ` at ${campus}` : ''}. Try different keywords or check the campus name.`,
                };
            }

            const list = majors.map((m, i) => 
                `${i + 1}. **${m.title}**${m.campus ? ` @ ${m.campus}` : ''}`
            ).join('\n');

            return {
                found: true,
                count: majors.length,
                majors: majors,
                formatted: `Found ${majors.length} major${majors.length > 1 ? 's' : ''}:\n\n${list}`,
            };
        } catch (error) {
            console.error('getMajor error:', error);
            return {
                found: false,
                error: true,
                message: 'I\'m having trouble searching for majors right now. Please try again in a moment.',
            };
        }
    }
});
