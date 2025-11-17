import 'dotenv/config';
import fs from 'fs';
import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import { sql, eq, and } from 'drizzle-orm';
import { campus, degree, major, majorDegree } from '../../app/db/schema';
import { section } from './_shared';
import { seedDegreesAndMajors } from './_phases';

const CONFIG = {
  FORCE: false,
};

if (!process.env.DATABASE_URL) {
  console.error('DATABASE_URL missing');
  process.exit(1);
}

async function main() {
  const sqlClient = neon(process.env.DATABASE_URL!);
  const db = drizzle(sqlClient);

  section('Degrees & Majors (all campuses)');
  await seedDegreesAndMajors(db, { FORCE: CONFIG.FORCE });

  section('Summary');
  const degCount = await db.select({ c: sql<number>`COUNT(*)::int` }).from(degree);
  const majCount = await db.select({ c: sql<number>`COUNT(*)::int` }).from(major);
  console.log(`Degrees: ${degCount[0].c}`);
  console.log(`Majors: ${majCount[0].c}`);
}

main().catch(e => { console.error('Fatal error:', e); process.exit(1); });
