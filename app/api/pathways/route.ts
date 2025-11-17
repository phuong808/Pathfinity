import { NextResponse } from "next/server";
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

// GET all pathways or a specific pathway by program name
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const programName = searchParams.get("programName");

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
      return NextResponse.json(
        { error: "Pathway data file not found" },
        { status: 404 }
      );
    }

    // Read the JSON file
    const fileContent = fs.readFileSync(dataPath, "utf-8");
    let pathways: PathwayData[];

    try {
      const parsed = JSON.parse(fileContent);
      // Check if the JSON is an array or a single object
      pathways = Array.isArray(parsed) ? parsed : [parsed];
    } catch (error) {
      console.error("Error parsing JSON:", error);
      return NextResponse.json(
        { error: "Invalid JSON format" },
        { status: 500 }
      );
    }

    // If program name is provided, return specific pathway
    if (programName) {
      const pathway = pathways.find(
        (p) => p.program_name === programName
      );

      if (!pathway) {
        return NextResponse.json(
          { error: "Pathway not found" },
          { status: 404 }
        );
      }

      // Return with pathwayData structure to match the expected format
      return NextResponse.json({
        programName: pathway.program_name,
        institution: pathway.institution,
        totalCredits: pathway.total_credits.toString(),
        pathwayData: pathway,
      });
    }

    // Otherwise, return list of all pathways with full data
    const pathwayList = pathways.map((p, index) => ({
      id: index + 1,
      programName: p.program_name,
      institution: p.institution,
      totalCredits: p.total_credits.toString(),
      pathwayData: p, // Include the full pathway data
      createdAt: new Date(),
      updatedAt: new Date(),
    }));

    return NextResponse.json(pathwayList);
  } catch (error) {
    console.error("Error fetching pathways:", error);
    return NextResponse.json(
      { error: "Failed to fetch pathways" },
      { status: 500 }
    );
  }
}
