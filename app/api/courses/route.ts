import { NextRequest, NextResponse } from 'next/server';

// Import all course data at the top level for reliable access
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

// Cache for sorted courses by campus
const coursesCache = new Map<string, CourseCatalog[]>();

// Optimized sort function for courses
function sortCourses(courses: CourseCatalog[]): CourseCatalog[] {
  return courses.sort((a, b) => {
    // First sort by course prefix alphabetically
    const prefixCompare = a.course_prefix.localeCompare(b.course_prefix);
    if (prefixCompare !== 0) return prefixCompare;
    
    // Then sort by course number numerically (lowest to highest)
    const numA = parseInt(a.course_number, 10);
    const numB = parseInt(b.course_number, 10);
    return numA - numB;
  });
}

// Load and cache courses for a campus
function getCachedCourses(campus: string): CourseCatalog[] {
  // Check cache first
  if (coursesCache.has(campus)) {
    return coursesCache.get(campus)!;
  }

  const courses = CAMPUS_COURSE_DATA[campus];
  if (!courses) {
    throw new Error('Invalid campus ID');
  }

  // Sort courses
  const sortedCourses = sortCourses([...courses]); // Create a copy before sorting

  // Cache the sorted courses
  coursesCache.set(campus, sortedCourses);

  return sortedCourses;
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const campus = searchParams.get('campus');
    const department = searchParams.get('department');

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

    // Get cached sorted courses for the specific campus
    const sortedCourses = getCachedCourses(campus);

    // If department is specified, filter by department
    if (department) {
      const departmentCourses = sortedCourses.filter(
        (course) => course.dept_name === department
      );
      
      return NextResponse.json(
        { courses: departmentCourses },
        {
          headers: {
            'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400',
          },
        }
      );
    }

    // Otherwise return all courses
    return NextResponse.json(
      { courses: sortedCourses },
      {
        headers: {
          'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400',
        },
      }
    );
  } catch (error) {
    console.error('Error fetching courses:', error);
    return NextResponse.json(
      { error: 'Failed to fetch courses' },
      { status: 500 }
    );
  }
}
