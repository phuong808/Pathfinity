// lib/semantic-search.tsx
// Compute an embedding for the user query and perform a cosine-similarity
// lookup against the `embeddings` table using Drizzle ORM. Returns the top-N
// similar records (with similarity score and selected metadata) for RAG.
import { cosineDistance, desc, gt, sql, eq } from 'drizzle-orm';
import { db } from '@/app/db/index';
import { embedding as e, source as s, course as c, campus as cam } from '@/app/db/schema';
import { generateEmbedding } from './embeddings';

export async function semanticSearch(
    query: string,
    limit: number = 5,
    threshold: number = 0.3
) {
    const embedding = await generateEmbedding(query);

    const similarity = sql<number>`1 - (${cosineDistance(
        e.embedding,
        embedding
    )})`;

    const similarEmbeddings = await db
        .select({
            id: e.id,
            content: e.metadata,
            similarity,
            source: s.name,
            source_id: e.refId,
            title: e.title,
            coursePrefix: c.coursePrefix,
            courseNumber: c.courseNumber,
            courseTitle: c.courseTitle,
            courseDesc: c.courseDesc,
            numUnits: c.numUnits,
            deptName: c.deptName,
            campusId: cam.id,
            campusName: cam.name,
            campusType: cam.type,
        })
        .from(e)
        .leftJoin(s, sql`${e.sourceId} = ${s.id}`)
        .leftJoin(c, eq(e.courseId, c.id))
        .leftJoin(cam, eq(e.campusId, cam.id))
        .where(gt(similarity, threshold))
        .orderBy(desc(similarity))
        .limit(limit);

    return similarEmbeddings;
}