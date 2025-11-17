import { tool } from 'ai';
import { z } from 'zod';
import { db } from '@/app/db/index';
import { embedding as e, course as c, campus as cam } from '@/app/db/schema';
import { sql, desc, gt, eq } from 'drizzle-orm';
import { generateEmbedding } from '@/lib/embeddings';

/**
 * Dynamic semantic retrieval for RAG.
 * Steps:
 * 1. Embed query
 * 2. Search with initial threshold; if few results, relax threshold down to minThreshold
 * 3. Return top-N with similarity and aggregated context (trimmed by approximate token budget)
 */
export const retrieveContext = tool({
  description: 'Unified retrieval: always pull semantically relevant course & campus snippets (default UH Manoa) for any academic query or roadmap planning before answering.',
  inputSchema: z.object({
    query: z.string().min(2, 'Query too short').describe('User natural language query'),
    campus: z.string().optional().describe('Campus ID or name filter (defaults to UH Manoa)'),
    limit: z.number().optional().default(12).describe('Max results to return'),
    initialThreshold: z.number().optional().default(0.38).describe('Starting similarity threshold (0-1)'),
    minThreshold: z.number().optional().default(0.12).describe('Lowest similarity threshold allowed'),
    minResults: z.number().optional().default(6).describe('Ensure at least this many results if possible'),
    maxContextTokens: z.number().optional().default(800).describe('Approximate max tokens for aggregated context'),
  }),
  execute: async ({ query, campus, limit = 12, initialThreshold = 0.38, minThreshold = 0.12, minResults = 6, maxContextTokens = 800 }) => {
    try {
      // Ensure tables exist (embeddings required; courses/campuses optional)
      const tables = await db.execute(sql`SELECT 
        to_regclass('public.embeddings') AS embeddings,
        to_regclass('public.courses') AS courses,
        to_regclass('public.campuses') AS campuses
      `);
      const first: any = Array.isArray(tables) ? tables[0] : (tables as any).rows?.[0];
      const hasEmbeddings = !!first?.embeddings;
      const hasCourses = !!first?.courses;
      const hasCampuses = !!first?.campuses;
      if (!hasEmbeddings) {
        return {
          found: false,
          message: 'Retrieval data unavailable (embeddings table missing). Seed embeddings to enable contextual answers.',
        };
      }

      const queryEmbedding = await generateEmbedding(query);
      // Use cosine distance operator (<=>); similarity = 1 - distance. Cast parameterized vector text to ::vector
      const vectorText = `[${queryEmbedding.join(',')}]`;
      const similarityExpr = sql<number>`1 - ( embedding <=> ${vectorText}::vector )`;

      // Roadmap / planning queries expand recall
      const isRoadmapQuery = /roadmap|4[-\s]?year|semester|plan|schedule|sequence|curriculum|pathway/i.test(query);
      if (isRoadmapQuery) {
        limit = Math.max(limit, 18);
        minResults = Math.max(minResults, 10);
        maxContextTokens = Math.max(maxContextTokens, 1200);
      }

  const targetCampus = campus || 'uh_manoa';
  // If campuses table missing, skip filter (treat all as matching)
  const campusFilter = hasCampuses ? sql`(${cam.id} = ${targetCampus} OR ${cam.name} ILIKE ${`%${targetCampus}%`})` : sql`TRUE`;

      let threshold = initialThreshold;
      let rows: any[] = [];
      while (threshold >= minThreshold) {
        const selectBase = db
          .select({
            id: e.id,
            title: e.title,
            metadata: e.metadata,
            content: e.content,
            similarity: similarityExpr,
            coursePrefix: hasCourses ? c.coursePrefix : sql`NULL`,
            courseNumber: hasCourses ? c.courseNumber : sql`NULL`,
            courseTitle: hasCourses ? c.courseTitle : sql`NULL`,
            campusName: hasCampuses ? cam.name : sql`NULL`,
          })
          .from(e);

        const joined = hasCourses && hasCampuses
          ? selectBase.leftJoin(c, eq(e.courseId, c.id)).leftJoin(cam, eq(e.campusId, cam.id))
          : hasCourses
            ? selectBase.leftJoin(c, eq(e.courseId, c.id))
            : hasCampuses
              ? selectBase.leftJoin(cam, eq(e.campusId, cam.id))
              : selectBase;

        rows = await joined
          .where(sql`${gt(similarityExpr, threshold)} AND ${campusFilter}`)
          .orderBy(desc(similarityExpr))
          .limit(limit);
        if (rows.length >= minResults || threshold <= minThreshold) break;
        threshold = parseFloat((threshold - 0.05).toFixed(2));
      }

      if (!rows.length) {
        return {
          found: false,
          message: `No relevant records found for "${query}" even after lowering threshold to ${threshold}. Try a different phrasing or be more specific.`,
        };
      }

      // Build formatted list
      const formattedList = rows.map((r, i) => {
        const code = r.coursePrefix && r.courseNumber ? `${r.coursePrefix} ${r.courseNumber}` : '';
        const label = code ? `${code} - ${r.courseTitle || r.title || 'Untitled'}` : (r.courseTitle || r.title || 'Untitled');
        const campus = r.campusName ? ` @ ${r.campusName}` : (!hasCampuses ? '' : '');
        return `${i + 1}. **${label}${campus}** (similarity ${(r.similarity ?? 0).toFixed(2)})`;
      }).join('\n');

      // Approximate token limit: assume ~4 chars per token; build aggregated context
      const maxChars = maxContextTokens * 4;
      let contextAccumulator = '';
      for (const r of rows) {
        const header = r.coursePrefix && r.courseNumber ? `${r.coursePrefix} ${r.courseNumber}` : (r.courseTitle || r.title || 'Entry');
        const snippet = r.content || JSON.stringify(r.metadata || {});
        const chunk = `\n### ${header}\n${snippet}\n`;
        if ((contextAccumulator + chunk).length > maxChars) break;
        contextAccumulator += chunk;
      }

      return {
        found: true,
        thresholdUsed: threshold,
        campusApplied: hasCampuses ? targetCampus : 'no-campus-table',
        count: rows.length,
        context: contextAccumulator.trim(),
        formatted: `Retrieved ${rows.length} records (threshold ${threshold.toFixed(2)}${hasCampuses ? `, campus ${targetCampus}` : ''}).\n\n${formattedList}`,
      };
    } catch (error) {
      console.error('retrieveContext error:', error);
      return {
        found: false,
        message: 'Context retrieval failed; I can still provide a general answer. (Embeddings join may be unavailable in this environment.)',
        error: true,
      };
    }
  }
});
