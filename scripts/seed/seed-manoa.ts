import 'dotenv/config';
import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import OpenAI from 'openai';
import { sql, eq } from 'drizzle-orm';
import { degree, major, course, pathway, embedding } from '../../app/db/schema';
import { section, campusesMap, ensureCampus } from './_shared';
import { seedDegreesAndMajors, seedCoursesAll, seedPathwaysAll } from './_phases';

/*
  UH Mānoa-only seeding script (uses shared phases).
  -------------------------------------------------
  Seeds UH Mānoa campus data only:
    - Degrees & Majors (Mānoa subset)
    - Courses (manoa_courses.json) + embeddings
    - Pathways (manoa_degree_pathways.json)

  Run:
    npx tsx scripts/seed/seed-manoa.ts

  Adjust behavior by editing CONFIG below (no CLI flags).
*/

const CONFIG = {
  DO_EMBEDDINGS: true,
  FORCE: true,
  LIMIT_COURSES_PER_CAMPUS: null as number | null, // default to 300 for quicker iterations
  BATCH_SIZE: 25,
  PAUSE_MS_BETWEEN_BATCHES: 100,
  DO_DEGREES_MAJORS: true,
  DO_COURSES: true,
  DO_PATHWAYS: true,
};

if (!process.env.DATABASE_URL) {
  console.error('DATABASE_URL missing');
  process.exit(1);
}

if (CONFIG.DO_EMBEDDINGS && !process.env.OPENAI_API_KEY) {
  console.error('OPENAI_API_KEY missing: embeddings required. Set the env var or set CONFIG.DO_EMBEDDINGS=false.');
  process.exit(1);
}

const sqlClient = neon(process.env.DATABASE_URL!);
const db = drizzle(sqlClient);
const openai: OpenAI | null = CONFIG.DO_EMBEDDINGS ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY }) : null;

process.on('uncaughtException', (err) => { console.error('Uncaught Exception:', err); process.exit(1); });
process.on('unhandledRejection', (reason) => { console.error('Unhandled Rejection:', reason); process.exit(1); });

async function summary() {
  section('Summary');
  const degCount = await db.select({ c: sql<number>`COUNT(*)::int` }).from(degree);
  const majorCount = await db.select({ c: sql<number>`COUNT(*)::int` }).from(major).where(eq(major.campusId, campusesMap.manoa.id));
  const courseCount = await db.select({ c: sql<number>`COUNT(*)::int` }).from(course).where(eq(course.campusId, campusesMap.manoa.id));
  const pathwayCount = await db.select({ c: sql<number>`COUNT(*)::int` }).from(pathway);
  const embCount = await db.select({ c: sql<number>`COUNT(*)::int` }).from(embedding).where(eq(embedding.campusId, campusesMap.manoa.id));
  console.log(`Degrees: ${degCount[0].c}`);
  console.log(`Majors (UH Mānoa): ${majorCount[0].c}`);
  console.log(`Courses (UH Mānoa): ${courseCount[0].c}`);
  console.log(`Pathways (all): ${pathwayCount[0].c}`);
  console.log(`Embeddings (UH Mānoa): ${embCount[0].c}`);
}

(async () => {
  const start = Date.now();
  console.log('Starting UH Mānoa seeding...');
  console.log(`Embeddings: ${CONFIG.DO_EMBEDDINGS ? 'ENABLED' : 'DISABLED'}${CONFIG.DO_EMBEDDINGS ? ` (batch size ${CONFIG.BATCH_SIZE})` : ''}`);
  if (CONFIG.LIMIT_COURSES_PER_CAMPUS) console.log(`Course limit: ${CONFIG.LIMIT_COURSES_PER_CAMPUS}`);

  await ensureCampus(db as any, campusesMap.manoa);

  const ONLY_CAMPUSES = ['manoa'] as const;
  if (CONFIG.DO_DEGREES_MAJORS) await seedDegreesAndMajors(db, { FORCE: CONFIG.FORCE, ONLY_CAMPUSES: ONLY_CAMPUSES as any });
  if (CONFIG.DO_COURSES) await seedCoursesAll(db, openai, { DO_EMBEDDINGS: CONFIG.DO_EMBEDDINGS, FORCE: CONFIG.FORCE, LIMIT_COURSES_PER_CAMPUS: CONFIG.LIMIT_COURSES_PER_CAMPUS, BATCH_SIZE: CONFIG.BATCH_SIZE, PAUSE_MS_BETWEEN_BATCHES: CONFIG.PAUSE_MS_BETWEEN_BATCHES, ONLY_CAMPUSES: ONLY_CAMPUSES as any });
  if (CONFIG.DO_PATHWAYS) await seedPathwaysAll(db, { FORCE: CONFIG.FORCE, ONLY_CAMPUSES: ONLY_CAMPUSES as any });
  await summary();

  console.log(`\n✅ UH Mānoa seeding complete in ${(Date.now()-start)/1000}s`);
  process.exit(0);
})().catch(e => { console.error('Fatal error:', e); process.exit(1); });
