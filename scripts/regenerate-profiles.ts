import { db } from '@/app/db';
import { profile } from '@/app/db/schema';
import { generateAndSaveRoadmap } from '@/lib/roadmap-generator';

async function main() {
  const arg = process.argv[2];
  if (!arg) {
    console.error('Usage: npx tsx scripts/regenerate-profiles.ts <profileId|all>');
    process.exit(1);
  }

  if (arg === 'all') {
    console.log('Starting regeneration of roadmaps for all profiles...');
    const profiles = await db.select().from(profile);
    console.log(`Found ${profiles.length} profiles`);

    for (const p of profiles) {
      try {
        console.log(`Regenerating roadmap for profile id=${p.id} name=${p.program || ''}`);
        await generateAndSaveRoadmap(p.id);
        console.log(` -> success for id=${p.id}`);
      } catch (err: any) {
        console.error(` -> failed for id=${p.id}:`, err?.message || err);
      }
    }

    console.log('Done.');
    process.exit(0);
  }

  // Attempt to parse the provided profile id
  const id = parseInt(arg, 10);
  if (isNaN(id)) {
    console.error('Invalid profile id. Provide a numeric id or "all".');
    process.exit(1);
  }

  try {
    console.log(`Regenerating roadmap for profile id=${id}...`);
    await generateAndSaveRoadmap(id);
    console.log('Done.');
    process.exit(0);
  } catch (err: any) {
    console.error(`Failed to regenerate profile ${id}:`, err?.message || err);
    process.exit(1);
  }
}

main();
