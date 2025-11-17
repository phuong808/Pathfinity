import { CourseDetails } from "@/lib/course-mapper";

// Course type from API (different from pathway Course)
export interface CourseCatalog {
  course_prefix: string;
  course_number: string;
  course_title: string;
  course_desc: string;
  num_units: string;
  dept_name: string;
  inst_ipeds: number;
  metadata: string;
}

// Types for timeline data
export interface TimelineItem {
  id: string;
  category: string;
  name: string;
  startYear: number;
  startMonth: number; // 0-11 (January = 0)
  endYear: number;
  endMonth: number; // 0-11
  description?: string;
  courseDetails?: CourseDetails;
  credits?: number; // Credits from pathway data
}

// Types for pathway structure
export interface Course {
  name: string;
  credits: number;
}

export interface Semester {
  semester_name: string;
  credits: number;
  courses: Course[];
  activities?: string[];
  internships?: string[];
  milestones?: string[];
}

export interface Year {
  year_number: number;
  semesters: Semester[];
}

export interface PathwayData {
  program_name: string;
  institution: string;
  total_credits: number;
  years: Year[];
}

export interface PathwayRecord {
  id: number;
  programName: string;
  institution: string;
  totalCredits: string;
  pathwayData?: PathwayData;
  createdAt: Date;
  updatedAt: Date;
}

// View mode type
export type ViewMode = 'courses' | 'majors';
