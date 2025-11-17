import manoaCoursesData from '@/app/db/data/manoa_courses.json';
import hawaiiccCoursesData from '@/app/db/data/hawaiicc_courses.json';
import hiloCoursesData from '@/app/db/data/hilo_courses.json';
import honoluluccCoursesData from '@/app/db/data/honolulucc_courses.json';
import kapiolaniCoursesData from '@/app/db/data/kapiolani_courses.json';
import kauaiCoursesData from '@/app/db/data/kauai_courses.json';
import leewardCoursesData from '@/app/db/data/leeward_courses.json';
import mauiCoursesData from '@/app/db/data/maui_courses.json';
import pcattCoursesData from '@/app/db/data/pcatt_courses.json';
import westoahuCoursesData from '@/app/db/data/west_oahu_courses.json';
import windwardCoursesData from '@/app/db/data/windward_courses.json';
import manoaDegreePathways from '@/app/db/data/manoa_degree_pathways.json';
import kapiolaniDegreePathways from '@/app/db/data/kapiolani_degree_pathways.json';

export interface CourseDetails {
  course_prefix: string;
  course_number: string;
  course_title: string;
  course_desc: string;
  num_units: string;
  dept_name: string;
  inst_ipeds: number;
  metadata: string;
}

export interface PathwayData {
  program_name: string;
  institution: string;
  total_credits: number;
  years: Array<{
    year_number: number;
    semesters: Array<{
      semester_name: string;
      credits: number;
      courses: Array<{
        name: string;
        credits: number;
      }>;
      activities?: string[];
      internships?: string[];
      milestones?: string[];
    }>;
  }>;
}

export interface MajorData {
  majorName: string;
  degrees: string[];
  institution: string;
  pathwayData?: PathwayData; // Include pathway data for Mānoa
}

export interface Campus {
  id: string;
  name: string;
  displayName: string;
}

// Available campuses based on _courses.json files
export const CAMPUSES: Campus[] = [
  { id: 'manoa', name: 'manoa', displayName: 'UH Mānoa' },
  { id: 'hawaiicc', name: 'hawaiicc', displayName: 'Hawaiʻi CC' },
  { id: 'hilo', name: 'hilo', displayName: 'UH Hilo' },
  { id: 'honolulucc', name: 'honolulucc', displayName: 'Honolulu CC' },
  { id: 'kapiolani', name: 'kapiolani', displayName: 'Kapiʻolani CC (KCC)' },
  { id: 'kauai', name: 'kauai', displayName: 'Kauaʻi CC' },
  { id: 'leeward', name: 'leeward', displayName: 'Leeward CC' },
  { id: 'maui', name: 'maui', displayName: 'UH Maui College' },
  { id: 'pcatt', name: 'pcatt', displayName: 'PCATT' },
  { id: 'westoahu', name: 'westoahu', displayName: 'UH West Oʻahu' },
  { id: 'windward', name: 'windward', displayName: 'Windward CC' },
];

// Course data map by campus
const CAMPUS_COURSE_DATA: Record<string, CourseDetails[]> = {
  manoa: manoaCoursesData as CourseDetails[],
  hawaiicc: hawaiiccCoursesData as CourseDetails[],
  hilo: hiloCoursesData as CourseDetails[],
  honolulucc: honoluluccCoursesData as CourseDetails[],
  kapiolani: kapiolaniCoursesData as CourseDetails[],
  kauai: kauaiCoursesData as CourseDetails[],
  leeward: leewardCoursesData as CourseDetails[],
  maui: mauiCoursesData as CourseDetails[],
  pcatt: pcattCoursesData as CourseDetails[],
  westoahu: westoahuCoursesData as CourseDetails[],
  windward: windwardCoursesData as CourseDetails[],
};

/**
 * Maps a course name (e.g., "ICS 111", "MATH 241", "CINE 255 (DH)") to detailed course information
 * from the specified campus courses database
 * 
 * @param courseName - The course name/code (e.g., "ICS 111", "MATH 241", "CINE 255 (DH)")
 * @param campusId - The campus identifier (e.g., "manoa", "hilo", "honolulucc")
 * @returns CourseDetails object if found, undefined otherwise
 */
export function getCourseDetails(courseName: string, campusId: string = 'manoa'): CourseDetails | undefined {
  if (!courseName) return undefined;
  
  // Get the course data for the specified campus
  const campusCourses = CAMPUS_COURSE_DATA[campusId] || CAMPUS_COURSE_DATA.manoa;
  
  // Remove anything in parentheses (like focus areas: "CINE 255 (DH)" -> "CINE 255")
  let cleanedName = courseName.replace(/\s*\([^)]*\)/g, '').trim();

  // Create a list of candidate tokens to try, in order
  // Handle common composite patterns: "ICS 311 or 314", "PHYS 170/170L", "CHEM 161 & 161L", "ENG 100, 200"
  const candidates: string[] = [];

  const pushCandidate = (s: string) => {
    const t = s.trim();
    if (t && !candidates.includes(t)) candidates.push(t);
  };

  // Start with the original cleaned
  pushCandidate(cleanedName);

  // Replace connectors with a common delimiter then split
  const connectorVariants = [
    ' or ', ' and ', ' & ', '/', ',', ';'
  ];
  let unified = cleanedName;
  for (const conn of connectorVariants) {
    unified = unified.split(conn).join(' | ');
  }
  unified.split('|').forEach(part => pushCandidate(part));

  // If pattern like "CINE 315 or 321" where second token lacks prefix, expand with prefix
  const prefixNumber = (s: string): string | null => {
    const up = s.toUpperCase().trim();
    // 1) Exact entire-string match like "ICS 111" or "ICS-111" or "ICS111"
    let m = up.match(/^([A-Z]{2,})\s*[-]?\s*(\d{2,3}[A-Z]?)$/);
    if (m) return `${m[1]} ${m[2]}`;
    // 2) Embedded match anywhere in the string (e.g., "ICS 111 - Intro ...")
    m = up.match(/([A-Z]{2,})\s*[-]?\s*(\d{2,3}[A-Z]?)/);
    if (m) return `${m[1]} ${m[2]}`;
    // 3) If just a number-like token, try to recover prefix from the original cleanedName
    const pfxMatch = cleanedName.toUpperCase().match(/^([A-Z]{2,})/);
    const pfx = pfxMatch ? pfxMatch[1] : undefined;
    const num = up.match(/^(\d{2,3}[A-Z]?)$/)?.[1];
    if (pfx && num) return `${pfx} ${num}`;
    return null;
  };

  const normalizedCandidates = candidates
    .map(s => prefixNumber(s))
    .filter((s): s is string => !!s);

  // Try each candidate until a match is found
  for (const cand of normalizedCandidates) {
    const normalizedName = cand.toUpperCase();
    const match = normalizedName.match(/^([A-Z]+)\s*[-]?\s*(\d+[A-Z]?)$/);
    if (!match) continue;
    const [, prefix, number] = match;
    const found = campusCourses.find(
      c => c.course_prefix.toUpperCase() === prefix &&
           c.course_number.toUpperCase() === number
    );
    if (found) return found;
  }

  return undefined;
}

/**
 * Gets a formatted course code from prefix and number
 */
export function formatCourseCode(prefix: string, number: string): string {
  return `${prefix} ${number}`;
}

/**
 * Extracts prerequisites from metadata string
 */
export function extractPrerequisites(metadata: string): string {
  const prereqMatch = metadata.match(/Prerequisites?:\s*([^;.]+)/i);
  return prereqMatch ? prereqMatch[1].trim() : 'None';
}

/**
 * Extracts grade option from metadata string
 */
export function extractGradeOption(metadata: string): string {
  const gradeMatch = metadata.match(/Grade Option:\s*([^;.]+)/i);
  return gradeMatch ? gradeMatch[1].trim() : 'Not specified';
}

/**
 * Checks if a course is repeatable
 */
export function isRepeatable(metadata: string): boolean {
  return /Repeatable/i.test(metadata);
}

/**
 * Extracts major restrictions from metadata
 */
export function extractMajorRestrictions(metadata: string): string {
  const restrictionMatch = metadata.match(/Major Restrictions?:\s*([^;.]+)/i);
  return restrictionMatch ? restrictionMatch[1].trim() : 'None';
}

/**
 * Get all majors for a specific campus
 */
export function getMajorsByCampus(campusId: string): MajorData[] {
  const campus = CAMPUSES.find(c => c.id === campusId);
  
  // Special handling for Mānoa - use degree pathways data
  if (campusId === 'manoa') {
    const pathways = manoaDegreePathways as PathwayData[];
    return pathways.map(pathway => ({
      majorName: pathway.program_name,
      degrees: [extractDegreeType(pathway.program_name)],
      institution: campus?.displayName || 'UH Mānoa',
      pathwayData: pathway,
    }));
  }
  
  // Special handling for Kapiʻolani CC - use degree pathways data
  if (campusId === 'kapiolani') {
    const pathways = kapiolaniDegreePathways as PathwayData[];
    const mappedPathways = pathways.map(pathway => ({
      majorName: pathway.program_name,
      degrees: [extractDegreeType(pathway.program_name)],
      institution: campus?.displayName || 'Kapiʻolani CC (KCC)',
      pathwayData: pathway,
    }));
    
    // Sort: pathways with year data first
    return mappedPathways.sort((a, b) => {
      const aHasYears = a.pathwayData?.years && a.pathwayData.years.length > 0;
      const bHasYears = b.pathwayData?.years && b.pathwayData.years.length > 0;
      if (aHasYears && !bHasYears) return -1;
      if (!aHasYears && bHasYears) return 1;
      return 0;
    });
  }
  
  // For other campuses, return empty array for now
  // (will be populated when data is scraped)
  return [];
}

/**
 * Extract degree type from program name (e.g., "Bachelor of Arts (BA)" -> "BA")
 */
function extractDegreeType(programName: string): string {
  const match = programName.match(/\(([A-Z]+)\)/);
  return match ? match[1] : 'Degree';
}

/**
 * Get all campuses that have majors data
 */
export function getCampusesWithMajors(): Campus[] {
  // Mānoa and Kapiʻolani have pathway data
  return CAMPUSES.filter(campus => campus.id === 'manoa' || campus.id === 'kapiolani');
}

/**
 * Search majors by keyword across all campuses or a specific campus
 */
export function searchMajors(keyword: string, campusId?: string): MajorData[] {
  const searchTerm = keyword.toLowerCase();
  const campusesToSearch = campusId 
    ? CAMPUSES.filter(c => c.id === campusId)
    : getCampusesWithMajors();

  const results: MajorData[] = [];
  
  campusesToSearch.forEach(campus => {
    const majors = getMajorsByCampus(campus.id);
    const matchingMajors = majors.filter(major => 
      major.majorName.toLowerCase().includes(searchTerm)
    );
    results.push(...matchingMajors);
  });

  return results;
}
