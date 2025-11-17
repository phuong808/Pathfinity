#!/usr/bin/env tsx

/**
 * Script to regenerate roadmap for an existing profile
 * Clears existing roadmap and generates a new one
 * 
 * Usage: npx tsx scripts/regenerate-roadmap.ts <profile-id>
 * 
 * Features:
 * - Automatically detects major prefix from pathway template
 * - Replaces elective placeholders with actual courses
 * - Intelligently chooses from course options (e.g., "MATH 241 or 251A")
 * - Preserves Gen Ed codes (FW, DS, DA/DH/DL, etc.)
 * - Uses gpt-4o-mini for cost-effectiveness
 * - Matches courses to student's career goals and interests
 */

import { db } from '@/app/db';
import { profile } from '@/app/db/schema';
import { eq } from 'drizzle-orm';
import { generateAndSaveRoadmap } from '@/lib/roadmap-generator';

async function main() {
  const args = process.argv.slice(2);
  
  if (args.length === 0) {
    console.error('Error: Profile ID is required');
    console.log('Usage: npx tsx scripts/regenerate-roadmap.ts <profile-id>');
    console.log('\nExample: npx tsx scripts/regenerate-roadmap.ts 1');
    process.exit(1);
  }

  const profileId = parseInt(args[0], 10);
  
  if (isNaN(profileId)) {
    console.error('Error: Profile ID must be a number');
    console.log('Usage: npx tsx scripts/regenerate-roadmap.ts <profile-id>');
    process.exit(1);
  }

  console.log(`Clearing existing roadmap for profile ${profileId}...`);
  
  // Clear the existing roadmap
  await db
    .update(profile)
    .set({ 
      roadmap: null,
      updatedAt: new Date(),
    })
    .where(eq(profile.id, profileId));
  
  console.log('Existing roadmap cleared.\n');
  
  // Regenerate using the simplified pipeline
  await generateAndSaveRoadmap(profileId);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('\n❌ Error:', error);
    process.exit(1);
  });
