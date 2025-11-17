import { tool } from 'ai';
import { z } from 'zod';
import { db } from '@/app/db/index';
import { major as m, campus as cam, degree as d, majorDegree as md } from '@/app/db/schema';
import { sql, eq } from 'drizzle-orm';
import { normalizeHawaiian } from '@/lib/normalize-hawaiian';

// Lightweight table existence check to handle environments where migrations haven't run.
async function ensureMajorsTable(): Promise<boolean> {
    try {
        // Query pg_catalog to see if the majors table exists
        const rows = await db.execute(sql`SELECT to_regclass('public.majors') AS reg`);
        const first: any = Array.isArray(rows) ? rows[0] : (rows as any).rows?.[0];
        if (!first) return false;
        const value = first.reg ?? first.to_regclass; // fallback variations
        return value !== null;
    } catch {
        return false;
    }
}

export const getMajorDetails = tool({
    description: "Get full details about a major: degrees offered, credits, duration. Use ONLY when user wants deep details about ONE major.",
    inputSchema: z.object({
        majorName: z.string().describe("The exact major name from getMajor results"),
        campus: z.string().optional().describe("Campus name if known"),
    }),
    execute: async ({ majorName, campus }) => {
        // Guard: verify majors table exists to avoid confusing "relation does not exist" errors.
        const hasMajors = await ensureMajorsTable();
        if (!hasMajors) {
            return {
                found: false,
                message: 'Major details are not available yet in this environment. You can still ask me to draft a basic roadmap based on general knowledge.',
            };
        }
        try {
            const conditions = [sql`${m.title} ILIKE ${`%${majorName}%`}`];
            if (campus) {
                // Normalize Hawaiian characters for matching + check aliases
                conditions.push(sql`(
                    translate(LOWER(${cam.name}), 'āēīōūʻ''''', 'aeiou') LIKE ${`%${normalizeHawaiian(campus)}%`} OR
                    ${cam.aliases}::text ILIKE ${`%${campus}%`}
                )`);
            }

            const result = await db
                .select({
                    majorTitle: m.title,
                    campusName: cam.name,
                    degreeCode: d.code,
                    degreeName: d.name,
                    credits: md.requiredCredits,
                    duration: md.typicalDuration,
                })
                .from(m)
                .leftJoin(cam, eq(m.campusId, cam.id))
                .leftJoin(md, eq(md.majorId, m.id))
                .leftJoin(d, eq(md.degreeId, d.id))
                .where(sql`${sql.join(conditions, sql` AND `)}`)
                .limit(10);

            if (!result?.length) {
                return {
                    found: false,
                    message: `Couldn't find "${majorName}". Try listing majors first, or I can still draft a general roadmap if you'd like.`,
                };
            }

            const major = result[0];
            const lines = [
                `**${major.majorTitle}**`,
                major.campusName && `📍 ${major.campusName}`,
                ''
            ];

            const degrees = result.filter(r => r.degreeCode);
            if (degrees.length) {
                lines.push(`**Degrees Offered (${degrees.length}):**`);
                degrees.forEach(deg => {
                    const years = deg.duration ? (deg.duration / 12).toFixed(1) : '?';
                    lines.push(`  • **${deg.degreeCode}** - ${deg.degreeName || deg.degreeCode}`);
                    if (deg.credits) lines.push(`    ${deg.credits} credits, ~${years} years`);
                });
            } else {
                lines.push('No degree information available.');
            }

            return {
                found: true,
                formatted: lines.filter(Boolean).join('\n'),
            };
        } catch (error: any) {
            // If the error still leaks a missing relation, surface a clearer message.
            const msg = String(error?.message || '');
            if (/relation.*majors.*does not exist/i.test(msg)) {
                return {
                    found: false,
                    message: 'Major details are unavailable right now (database not migrated). I can still provide a general overview or create a basic roadmap.'
                };
            }
            console.error('getMajorDetails error:', error);
            return {
                found: false,
                error: true,
                message: 'I\'m having trouble getting major details right now. Please try again later.'
            };
        }
    }
});
