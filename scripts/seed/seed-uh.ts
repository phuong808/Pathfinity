import 'dotenv/config';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import OpenAI from 'openai';
import { sql } from 'drizzle-orm';
import { campus, degree, major, course, embedding, pathway } from '../../app/db/schema';
import { section, campusesMap, ensureCampus } from './_shared';
import { seedDegreesAndMajors, seedCoursesAll, seedPathwaysAll } from './_phases';

/*
  All-campus UH seeding script.
  -----------------------------
  Seeds:
    - Campuses (derived from data files + majors JSON)
    - Degrees & Majors (from uh_majors_colleges_specific_degrees.json)
    - Major-Degree links (simple defaults)
    - Courses for every *_courses.json with embeddings (requires OPENAI_API_KEY)
    - Pathways for any *degree_pathways.json files

  Run:
    npx tsx scripts/seed/seed-uh.ts

  Adjust behavior by editing CONFIG below (no CLI flags).
*/

const CONFIG = {
  DO_EMBEDDINGS: true,        // Generate embeddings for courses
  FORCE: false,               // Reprocess even if existing
  LIMIT_COURSES_PER_CAMPUS: null as number | null, // e.g., 300 for partial loads
  BATCH_SIZE: 25,             // Embedding batch size
  PAUSE_MS_BETWEEN_BATCHES: 500,
  // Phase toggles
  DO_DEGREES_MAJORS: true,
  DO_COURSES: true,
  DO_PATHWAYS: true,
  // Scope limiting
  ONLY_CAMPUSES: [] as (keyof typeof campusesMap)[], // e.g., ['manoa','leeward']
};

// Shared DATA_DIR and MAJORS_FILE imported from _shared

if (!process.env.DATABASE_URL) {
  console.error('DATABASE_URL missing');
  process.exit(1);
}

const sqlClient = neon(process.env.DATABASE_URL!);
const db = drizzle(sqlClient);
let openai: OpenAI | null = null;
if (CONFIG.DO_EMBEDDINGS) {
  if (!process.env.OPENAI_API_KEY) {
    console.error('OPENAI_API_KEY missing: embeddings required for seeding context. Set the OPENAI_API_KEY env var or set CONFIG.DO_EMBEDDINGS=false in scripts/seed/seed-uh.ts to bypass.');
    process.exit(1);
  }
  openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
}

process.on('uncaughtException', (err) => { console.error('Uncaught Exception:', err); process.exit(1); });
process.on('unhandledRejection', (reason) => { console.error('Unhandled Rejection:', reason); process.exit(1); });

// Common helpers and campus mappings are imported from _shared

// Phases implemented in _phases.ts

async function summary() {
  section('Summary');
  const degCount = await db.select({ c: sql<number>`COUNT(*)::int` }).from(degree);
  const campusCount = await db.select({ c: sql<number>`COUNT(*)::int` }).from(campus);
  const majorCount = await db.select({ c: sql<number>`COUNT(*)::int` }).from(major);
  const courseCount = await db.select({ c: sql<number>`COUNT(*)::int` }).from(course);
  const pathwayCount = await db.select({ c: sql<number>`COUNT(*)::int` }).from(pathway);
  const embCount = await db.select({ c: sql<number>`COUNT(*)::int` }).from(embedding);
  console.log(`Campuses: ${campusCount[0].c}`);
  console.log(`Degrees: ${degCount[0].c}`);
  console.log(`Majors: ${majorCount[0].c}`);
  console.log(`Courses: ${courseCount[0].c}`);
  console.log(`Pathways: ${pathwayCount[0].c}`);
  console.log(`Embeddings: ${embCount[0].c}`);
}

(async () => {
  const start = Date.now();
  console.log('Starting UH all-campus seeding...');
  console.log(`Embeddings: ${CONFIG.DO_EMBEDDINGS ? 'ENABLED' : 'DISABLED'}${CONFIG.DO_EMBEDDINGS ? ` (batch size ${CONFIG.BATCH_SIZE})` : ''}`);
  if (CONFIG.LIMIT_COURSES_PER_CAMPUS) console.log(`Course limit per campus: ${CONFIG.LIMIT_COURSES_PER_CAMPUS}`);
  if (CONFIG.ONLY_CAMPUSES.length) console.log(`Scope: campuses=[${CONFIG.ONLY_CAMPUSES.join(', ')}]`);
  console.log(`Phases: degreesMajors=${CONFIG.DO_DEGREES_MAJORS}, courses=${CONFIG.DO_COURSES}, pathways=${CONFIG.DO_PATHWAYS}`);

  // Ensure campuses present for any campus with data files
  for (const def of Object.values(campusesMap)) {
    await ensureCampus(db as any, def);
  }

  if (CONFIG.DO_DEGREES_MAJORS) await seedDegreesAndMajors(db, { FORCE: CONFIG.FORCE, ONLY_CAMPUSES: CONFIG.ONLY_CAMPUSES });
  if (CONFIG.DO_COURSES) await seedCoursesAll(db, openai, { DO_EMBEDDINGS: CONFIG.DO_EMBEDDINGS, FORCE: CONFIG.FORCE, LIMIT_COURSES_PER_CAMPUS: CONFIG.LIMIT_COURSES_PER_CAMPUS, BATCH_SIZE: CONFIG.BATCH_SIZE, PAUSE_MS_BETWEEN_BATCHES: CONFIG.PAUSE_MS_BETWEEN_BATCHES, ONLY_CAMPUSES: CONFIG.ONLY_CAMPUSES });
  if (CONFIG.DO_PATHWAYS) await seedPathwaysAll(db, { FORCE: CONFIG.FORCE, ONLY_CAMPUSES: CONFIG.ONLY_CAMPUSES });
  await summary();

  console.log(`\n✅ UH all-campus seeding complete in ${(Date.now()-start)/1000}s`);
  process.exit(0);
})().catch(e => {
  console.error('Fatal error:', e);
  process.exit(1);
});
