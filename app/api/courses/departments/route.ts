import { NextRequest, NextResponse } from 'next/server';

// Import all course data at the top level
import manoaCoursesData from '@/app/db/data/manoa_courses.json';
import hiloCoursesData from '@/app/db/data/hilo_courses.json';
import westoahuCoursesData from '@/app/db/data/west_oahu_courses.json';
import honoluluccCoursesData from '@/app/db/data/honolulucc_courses.json';
import kapiolaniCoursesData from '@/app/db/data/kapiolani_courses.json';
import kauaiCoursesData from '@/app/db/data/kauai_courses.json';
import leewardCoursesData from '@/app/db/data/leeward_courses.json';
import windwardCoursesData from '@/app/db/data/windward_courses.json';
import mauiCoursesData from '@/app/db/data/maui_courses.json';
import hawaiiccCoursesData from '@/app/db/data/hawaiicc_courses.json';
import pcattCoursesData from '@/app/db/data/pcatt_courses.json';

interface CourseCatalog {
  course_prefix: string;
  course_number: string;
  course_title: string;
  course_desc: string;
  num_units: string;
  dept_name: string;
  inst_ipeds: number;
  metadata: string;
}

// Map campus IDs to their course data
const CAMPUS_COURSE_DATA: Record<string, CourseCatalog[]> = {
  'manoa': manoaCoursesData as CourseCatalog[],
  'hilo': hiloCoursesData as CourseCatalog[],
  'westoahu': westoahuCoursesData as CourseCatalog[],
  'honolulucc': honoluluccCoursesData as CourseCatalog[],
  'kapiolani': kapiolaniCoursesData as CourseCatalog[],
  'kauai': kauaiCoursesData as CourseCatalog[],
  'leeward': leewardCoursesData as CourseCatalog[],
  'windward': windwardCoursesData as CourseCatalog[],
  'maui': mauiCoursesData as CourseCatalog[],
  'hawaiicc': hawaiiccCoursesData as CourseCatalog[],
  'pcatt': pcattCoursesData as CourseCatalog[],
};

// Cache for departments by campus
const departmentsCache = new Map<string, string[]>();

// Load and cache departments for a campus
function getCachedDepartments(campus: string): string[] {
  // Check cache first
  if (departmentsCache.has(campus)) {
    return departmentsCache.get(campus)!;
  }

  const courses = CAMPUS_COURSE_DATA[campus];
  if (!courses) {
    throw new Error('Invalid campus ID');
  }

  // Extract unique department names using Set for O(1) lookups
  const departmentSet = new Set<string>();
  for (const course of courses) {
    if (course.dept_name) {
      departmentSet.add(course.dept_name);
    }
  }

  // Convert to sorted array
  const departments = Array.from(departmentSet).sort();

  // Cache the departments
  departmentsCache.set(campus, departments);

  return departments;
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const campus = searchParams.get('campus');

    if (!campus) {
      return NextResponse.json(
        { error: 'Campus parameter is required' },
        { status: 400 }
      );
    }

    if (!CAMPUS_COURSE_DATA[campus]) {
      return NextResponse.json(
        { error: 'Invalid campus ID' },
        { status: 400 }
      );
    }

    // Get cached departments for the specific campus
    const departments = getCachedDepartments(campus);

    return NextResponse.json(
      { departments },
      {
        headers: {
          'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400',
        },
      }
    );
  } catch (error) {
    console.error('Error fetching departments:', error);
    return NextResponse.json(
      { error: 'Failed to fetch departments' },
      { status: 500 }
    );
  }
}
