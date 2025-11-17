import 'dotenv/config';
import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import { sql } from 'drizzle-orm';
import { pathway } from '../../app/db/schema';
import { section } from './_shared';
import { seedPathwaysAll } from './_phases';

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

  section('Pathways (all campuses with files)');
  await seedPathwaysAll(db, { FORCE: CONFIG.FORCE });

  section('Summary');
  const pathwayCount = await db.select({ c: sql<number>`COUNT(*)::int` }).from(pathway);
  console.log(`Total pathways in DB: ${pathwayCount[0].c}`);
}

main().catch(e => { console.error('Fatal error:', e); process.exit(1); });
