import { getCourseDetails } from "@/lib/course-mapper";
import { SEMESTER_COLORS, YEAR_COLOR_PALETTES, YEAR_TIMELINE_COLORS } from "./constants";
import { PathwayData, TimelineItem } from "./types";

// Function to generate a bold color for courses based on year and item ID
export function getItemColor(itemId: string, category: string, description?: string): string {
  if (category === 'Courses' && description) {
    // Extract year from description
    const yearMatch = description.match(/Year (\d+)/);
    if (yearMatch) {
      const year = parseInt(yearMatch[1]);
      const palette = YEAR_COLOR_PALETTES[year] || YEAR_COLOR_PALETTES[1];
      const index = parseInt(itemId) % palette.length;
      return palette[index];
    }
  }
  return SEMESTER_COLORS[category] || '#999';
}

// Function to get timeline color based on year and semester
export function getTimelineColor(period: string): string {
  const yearMatch = period.match(/Year (\d+)/);
  if (yearMatch) {
    const year = parseInt(yearMatch[1]);
    const palette = YEAR_TIMELINE_COLORS[year] || YEAR_TIMELINE_COLORS[1];
    
    // Different shade based on semester
    if (period.includes('Fall')) {
      return palette[0];
    } else if (period.includes('Spring')) {
      return palette[1];
    } else if (period.includes('Summer')) {
      return palette[2];
    }
  }
  return '#f9f9f9';
}

// Helper to get semester display name
export function getSemesterDisplayName(semesterName: string): string {
  const map: Record<string, string> = {
    'fall_semester': 'Fall Semester',
    'spring_semester': 'Spring Semester',
    'summer_semester': 'Summer Semester',
    'first_semester': 'Fall Semester',
    'second_semester': 'Spring Semester',
    'third_semester': 'Fall Semester',
    'fourth_semester': 'Spring Semester',
    'fifth_semester': 'Summer Semester',
    'sixth_semester': 'Summer Semester',
  };
  return map[semesterName] || semesterName;
}

// Convert pathway data to timeline format organized by semester periods
export function pathwayToTimeline(
  pathwayData: PathwayData, 
  campusId: string = 'manoa'
): { items: TimelineItem[], categories: string[], periods: string[] } {
  const items: TimelineItem[] = [];
  const categories = ['Courses', 'Internships', 'Clubs & Extra Curriculars', 'Part-Time Jobs'];
  const periods: string[] = [];
  let itemId = 1;
  const baseYear = 2025; // Starting year for the timeline

  pathwayData.years.forEach((year) => {
    year.semesters.forEach((semester, semesterIndex) => {
      // Skip empty summer semesters
      if (semester.courses.length === 0 && 
          (semester.semester_name === 'summer_semester' || 
           semester.semester_name === 'fifth_semester' || 
           semester.semester_name === 'sixth_semester')) {
        return;
      }

      // Determine start month based on semester name
      let startMonth = 0;
      let endMonth = 4;
      
      // Handle traditional semester names
      if (semester.semester_name === 'fall_semester' || semester.semester_name === 'first_semester' || semester.semester_name === 'third_semester') {
        startMonth = 8; // September
        endMonth = 11; // December
      } else if (semester.semester_name === 'spring_semester' || semester.semester_name === 'second_semester' || semester.semester_name === 'fourth_semester') {
        startMonth = 0; // January
        endMonth = 4; // May
      } else if (semester.semester_name === 'summer_semester' || semester.semester_name === 'fifth_semester' || semester.semester_name === 'sixth_semester') {
        startMonth = 5; // June
        endMonth = 7; // August
      } else {
        // Fallback: determine by position in year (odd=fall, even=spring)
        if (semesterIndex % 2 === 0) {
          startMonth = 8; // September (Fall)
          endMonth = 11; // December
        } else {
          startMonth = 0; // January (Spring)
          endMonth = 4; // May
        }
      }

      const actualYear = baseYear + year.year_number - 1;
      const semesterLabel = `Year ${year.year_number} - ${getSemesterDisplayName(semester.semester_name)}`;
      
      // Track periods for vertical timeline
      periods.push(semesterLabel);

      // Add each course to the "Courses" category
      semester.courses.forEach((course) => {
        // Get detailed course information from the selected campus courses.json
        const courseDetails = getCourseDetails(course.name, campusId);
        
        items.push({
          id: `${itemId++}`,
          category: 'Courses',
          name: course.name,
          startYear: actualYear,
          startMonth,
          endYear: actualYear,
          endMonth,
          description: `${course.credits} credits • ${semesterLabel}`,
          courseDetails,
          credits: course.credits, // Include credits from pathway data
        });
      });

      // Add activities to "Clubs & Extra Curriculars" category
      semester.activities?.forEach((activity) => {
        items.push({
          id: `${itemId++}`,
          category: 'Clubs & Extra Curriculars',
          name: activity,
          startYear: actualYear,
          startMonth,
          endYear: actualYear,
          endMonth,
          description: `Activity • ${semesterLabel}`,
        });
      });

      // Add internships to "Internships" category
      semester.internships?.forEach((internship) => {
        items.push({
          id: `${itemId++}`,
          category: 'Internships',
          name: internship,
          startYear: actualYear,
          startMonth,
          endYear: actualYear,
          endMonth,
          description: `Internship/Work Experience • ${semesterLabel}`,
        });
      });

      // Add milestones to appropriate categories
      semester.milestones?.forEach((milestone) => {
        items.push({
          id: `${itemId++}`,
          category: 'Part-Time Jobs',
          name: milestone,
          startYear: actualYear,
          startMonth,
          endYear: actualYear,
          endMonth,
          description: `Milestone • ${semesterLabel}`,
        });
      });
    });
  });

  return { items, categories, periods };
}
