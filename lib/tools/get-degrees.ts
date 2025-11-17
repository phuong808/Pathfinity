import { tool } from 'ai';
import { z } from 'zod';
import { db } from '@/app/db/index';
import { degree as d } from '@/app/db/schema';
import { eq, sql } from 'drizzle-orm';

export const getDegrees = tool({
    description: "List all degree and certificate types available in the UH system (B.S., B.A., M.A., Ph.D., Associate, Certificate, etc.). Use when asked about degree types or credential levels.",
    inputSchema: z.object({
        level: z.string().optional().describe("Filter by level: 'baccalaureate', 'associate', 'graduate', 'doctorate', 'certificate'"),
    }),
    execute: async ({ level }) => {
        try {
            // Guard for missing degrees table
            const res = await db.execute(sql`SELECT to_regclass('public.degrees') AS degrees`);
            const first: any = Array.isArray(res) ? res[0] : (res as any).rows?.[0];
            if (!first?.degrees) {
                return {
                    found: false,
                    message: 'Degree types are not available yet in this environment.',
                };
            }
            let query = db.select({
                code: d.code,
                name: d.name,
                level: d.level,
            }).from(d).orderBy(d.level, d.code);

            if (level) {
                query = query.where(eq(d.level, level)) as any;
            }

            const degrees = await query;
            
            if (!degrees?.length) {
                return {
                    found: false,
                    message: level ? `No ${level} degrees found in the system.` : 'No degree types found in the system.',
                };
            }

            const byLevel = degrees.reduce((acc, deg) => {
                const lvl = deg.level || 'Other';
                if (!acc[lvl]) acc[lvl] = [];
                acc[lvl].push(deg);
                return acc;
            }, {} as Record<string, typeof degrees>);

            const lines = [`**${degrees.length} Degree Types:**\n`];
            Object.entries(byLevel).forEach(([lvl, degs]) => {
                lines.push(`**${lvl.toUpperCase()}:**`);
                degs.forEach(d => lines.push(`  • ${d.code}${d.name ? ` - ${d.name}` : ''}`));
                lines.push('');
            });

            return {
                found: true,
                count: degrees.length,
                degrees: degrees,
                formatted: lines.join('\n'),
            };
        } catch (error) {
            console.error('getDegrees error:', error);
            return {
                found: false,
                error: true,
                message: 'I\'m having trouble loading degree types right now. Please try again in a moment.',
            };
        }
    }
});
