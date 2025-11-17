import { tool } from 'ai';
import { z } from 'zod';
import { db } from '@/app/db/index';
import { sql } from 'drizzle-orm';
import { campus as cam } from '@/app/db/schema';

export const getCampuses = tool({
    description: "List all campuses in the University of Hawaii system. Use when asked 'what campuses are there' or 'list UH campuses'.",
    inputSchema: z.object({}),
    execute: async () => {
        try {
            // Check if campuses table exists to avoid runtime errors on fresh DBs
            const res = await db.execute(sql`SELECT to_regclass('public.campuses') AS campuses`);
            const first: any = Array.isArray(res) ? res[0] : (res as any).rows?.[0];
            if (!first?.campuses) {
                return {
                    found: false,
                    message: 'Campus data is not available yet in this environment.',
                };
            }

            const campuses = await db
                .select({
                    name: cam.name,
                    type: cam.type,
                })
                .from(cam)
                .orderBy(cam.type, cam.name);

            if (!campuses?.length) {
                return {
                    found: false,
                    message: 'No campuses found in the system.',
                };
            }

            const unis = campuses.filter(c => c.type === 'university');
            const ccs = campuses.filter(c => c.type === 'community_college');
            const other = campuses.filter(c => c.type !== 'university' && c.type !== 'community_college');

            const lines = [`**${campuses.length} UH System Campuses:**\n`];
            
            if (unis.length) {
                lines.push('Universities:');
                unis.forEach(c => lines.push(`  • ${c.name}`));
                lines.push('');
            }
            
            if (ccs.length) {
                lines.push('Community Colleges:');
                ccs.forEach(c => lines.push(`  • ${c.name}`));
                lines.push('');
            }
            
            if (other.length) {
                lines.push('Other:');
                other.forEach(c => lines.push(`  • ${c.name}`));
            }

            return {
                found: true,
                count: campuses.length,
                campuses: campuses,
                formatted: lines.join('\n'),
            };
        } catch (error) {
            console.error('getCampuses error:', error);
            return {
                found: false,
                error: true,
                message: 'I\'m having trouble loading the campus list right now. Please try again in a moment.',
            };
        }
    }
});
