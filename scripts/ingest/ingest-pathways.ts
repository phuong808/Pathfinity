import { db } from "@/app/db";
import * as crypto from "crypto";
import { pathway } from "@/app/db/schema";
import { eq } from "drizzle-orm";
import * as fs from "fs";
import * as path from "path";

interface Course {
  name: string;
  credits: number;
}

interface Semester {
  semester_name: string;
  credits: number;
  courses: Course[];
  activities?: string[];
  internships?: string[];
  milestones?: string[];
}

interface Year {
  year_number: number;
  semesters: Semester[];
}

interface PathwayData {
  program_name: string;
  institution: string;
  total_credits: number;
  years: Year[];
}

async function ingestPathways() {
  console.log("🚀 Starting pathway ingestion...");

  // Path to the JSON file
  const dataPath = path.join(
    process.cwd(),
    "app",
    "db",
    "data",
    "manoa_degree_pathways.json"
  );

  // Check if file exists
  if (!fs.existsSync(dataPath)) {
    console.error(`❌ File not found: ${dataPath}`);
    console.log("Please create the file with your pathway data.");
    return;
  }

  // Read the JSON file
  const fileContent = fs.readFileSync(dataPath, "utf-8");
  let pathways: PathwayData[];

  try {
    const parsed = JSON.parse(fileContent);
    // Check if the JSON is an array or a single object
    pathways = Array.isArray(parsed) ? parsed : [parsed];
  } catch (error) {
    console.error("❌ Error parsing JSON:", error);
    return;
  }

  console.log(`📚 Found ${pathways.length} pathway(s) to ingest`);

  let successCount = 0;
  let errorCount = 0;

  for (const pathwayData of pathways) {
    try {
      // Check if pathway already exists
      const existing = await db.query.pathway.findFirst({
        where: (table, { eq }) => eq(table.programName, pathwayData.program_name),
      });

      if (existing) {
        console.log(`⚠️  Pathway already exists: ${pathwayData.program_name}`);
        console.log(`   Updating existing record...`);
        
        // Update existing pathway
        await db
          .update(pathway)
          .set({
            institution: pathwayData.institution,
            totalCredits: pathwayData.total_credits.toString(),
            pathwayData: pathwayData as unknown as Record<string, unknown>,
            updatedAt: new Date(),
          })
          .where(eq(pathway.programName, pathwayData.program_name));
        
        successCount++;
      } else {
        // Insert new pathway
        await db.insert(pathway).values({
          id: crypto.randomUUID(),
          programName: pathwayData.program_name,
          institution: pathwayData.institution,
          totalCredits: pathwayData.total_credits.toString(),
          pathwayData: pathwayData as unknown as Record<string, unknown>,
        });

        console.log(`✅ Ingested: ${pathwayData.program_name}`);
        successCount++;
      }
    } catch (error) {
      console.error(`❌ Error ingesting ${pathwayData.program_name}:`, error);
      errorCount++;
    }
  }

  console.log("\n📊 Ingestion Summary:");
  console.log(`   ✅ Successful: ${successCount}`);
  console.log(`   ❌ Failed: ${errorCount}`);
  console.log(`   📚 Total: ${pathways.length}`);
}

// Run the ingestion
ingestPathways()
  .then(() => {
    console.log("\n🎉 Pathway ingestion complete!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("\n💥 Fatal error during ingestion:", error);
    process.exit(1);
  });
