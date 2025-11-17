import 'dotenv/config';
import fs from 'fs';
import path from 'path';
import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import OpenAI from 'openai';
import { sql, eq, and } from 'drizzle-orm';
import { course, source, embedding } from '../../app/db/schema';
import { section, DATA_DIR } from './_shared';
import { seedCoursesAll } from './_phases';

const CONFIG = {
  DO_EMBEDDINGS: true,
  FORCE: false,
  LIMIT_COURSES_PER_CAMPUS: null as number | null,
  BATCH_SIZE: 25,
  PAUSE_MS_BETWEEN_BATCHES: 500,
  ONLY_CAMPUSES: [] as string[], // e.g., ['manoa','leeward']
};

if (!process.env.DATABASE_URL) {
  console.error('DATABASE_URL missing');
  process.exit(1);
}

let openai: OpenAI | null = null;
if (CONFIG.DO_EMBEDDINGS) {
  if (!process.env.OPENAI_API_KEY) {
    console.error('OPENAI_API_KEY missing: set it or set CONFIG.DO_EMBEDDINGS=false in scripts/seed/seed-courses-all.ts');
    process.exit(1);
  }
  openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
}

async function main() {
  const sqlClient = neon(process.env.DATABASE_URL!);
  const db = drizzle(sqlClient);

  section('Courses (all campuses, selectable)');
  await seedCoursesAll(db, openai, {
    DO_EMBEDDINGS: CONFIG.DO_EMBEDDINGS,
    FORCE: CONFIG.FORCE,
    LIMIT_COURSES_PER_CAMPUS: CONFIG.LIMIT_COURSES_PER_CAMPUS,
    BATCH_SIZE: CONFIG.BATCH_SIZE,
    PAUSE_MS_BETWEEN_BATCHES: CONFIG.PAUSE_MS_BETWEEN_BATCHES,
    ONLY_CAMPUSES: CONFIG.ONLY_CAMPUSES as any,
  });

  section('Summary');
  const embCount = await (async () => {
    const r = await db.select({ c: sql<number>`COUNT(*)::int` }).from(embedding);
    return r[0].c;
  })();
  console.log(`Total embeddings in DB: ${embCount}`);
}

main().catch(e => { console.error('Fatal error:', e); process.exit(1); });
