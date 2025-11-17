/**
 * College Scorecard API Client
 * https://collegescorecard.ed.gov/data/api-documentation/
 */

const API_KEY = process.env.COLLEGE_SCORECARD_API_KEY;
const BASE_URL = process.env.COLLEGE_SCORECARD_BASE || 'https://api.data.gov/ed/collegescorecard/v1/schools';

export interface CollegeInfo {
  id: number;
  name: string;
  website?: string;
  
  // Location
  city?: string;
  state?: string;
  zip?: string;
  latitude?: number;
  longitude?: number;
  
  // Institution type
  ownership?: number; // 1=Public, 2=Private nonprofit, 3=Private for-profit
  
  // Student info
  size?: number;
  undergradSize?: number;
  partTimeShare?: number;
  
  // Costs
  avgCostPerYear?: number;
  tuitionInState?: number;
  tuitionOutOfState?: number;
  
  // Admissions
  admissionRate?: number;
  satAverage?: number;
  actMedian?: number;
  
  // Outcomes
  completionRate?: number;
  retentionRate?: number;
  medianEarnings?: number;
  
  // Demographics
  percentWhite?: number;
  percentBlack?: number;
  percentHispanic?: number;
  percentAsian?: number;
  percentPacificIslander?: number;
  percentNativeAmerican?: number;
  percentTwoOrMore?: number;
}

/**
 * Search school by IPEDS ID (most precise lookup)
 */
export async function searchSchoolByIpeds(ipedsId: string): Promise<CollegeInfo | null> {
  if (!API_KEY) {
    console.error('COLLEGE_SCORECARD_API_KEY not set');
    return null;
  }

  try {
    const fields = [
      'id',
      'school.name',
      'school.school_url',
      'school.city',
      'school.state',
      'school.zip',
      'school.ownership',
      'location.lat',
      'location.lon',
      'latest.student.size',
      'latest.student.undergrad_size',
      'latest.student.part_time_share',
      'latest.cost.avg_net_price.overall',
      'latest.cost.tuition.in_state',
      'latest.cost.tuition.out_of_state',
      'latest.admissions.admission_rate.overall',
      'latest.admissions.sat_scores.average.overall',
      'latest.admissions.act_scores.midpoint.cumulative',
      'latest.completion.completion_rate_4yr_150nt',
      'latest.student.retention_rate_four_year.full_time',
      'latest.earnings.10_yrs_after_entry.median',
      'latest.student.demographics.race_ethnicity.white',
      'latest.student.demographics.race_ethnicity.black',
      'latest.student.demographics.race_ethnicity.hispanic',
      'latest.student.demographics.race_ethnicity.asian',
      'latest.student.demographics.race_ethnicity.nhpi',
      'latest.student.demographics.race_ethnicity.aian',
      'latest.student.demographics.race_ethnicity.two_or_more',
    ].join(',');

    const url = `${BASE_URL}?id=${ipedsId}&api_key=${API_KEY}&fields=${fields}`;
    const response = await fetch(url);

    if (!response.ok) {
      console.error(`College Scorecard API error: ${response.status}`);
      return null;
    }

    const data = await response.json();
    
    if (!data.results || data.results.length === 0) {
      return null;
    }

    const school = data.results[0];
    
    return {
      id: school.id,
      name: school['school.name'] || 'Unknown',
      website: school['school.school_url'],
      city: school['school.city'],
      state: school['school.state'],
      zip: school['school.zip'],
      ownership: school['school.ownership'],
      latitude: school['location.lat'],
      longitude: school['location.lon'],
      size: school['latest.student.size'],
      undergradSize: school['latest.student.undergrad_size'],
      partTimeShare: school['latest.student.part_time_share'],
      avgCostPerYear: school['latest.cost.avg_net_price.overall'],
      tuitionInState: school['latest.cost.tuition.in_state'],
      tuitionOutOfState: school['latest.cost.tuition.out_of_state'],
      admissionRate: school['latest.admissions.admission_rate.overall'],
      satAverage: school['latest.admissions.sat_scores.average.overall'],
      actMedian: school['latest.admissions.act_scores.midpoint.cumulative'],
      completionRate: school['latest.completion.completion_rate_4yr_150nt'],
      retentionRate: school['latest.student.retention_rate_four_year.full_time'],
      medianEarnings: school['latest.earnings.10_yrs_after_entry.median'],
      percentWhite: school['latest.student.demographics.race_ethnicity.white'],
      percentBlack: school['latest.student.demographics.race_ethnicity.black'],
      percentHispanic: school['latest.student.demographics.race_ethnicity.hispanic'],
      percentAsian: school['latest.student.demographics.race_ethnicity.asian'],
      percentPacificIslander: school['latest.student.demographics.race_ethnicity.nhpi'],
      percentNativeAmerican: school['latest.student.demographics.race_ethnicity.aian'],
      percentTwoOrMore: school['latest.student.demographics.race_ethnicity.two_or_more'],
    };
  } catch (error) {
    console.error('Error fetching from College Scorecard:', error);
    return null;
  }
}

/**
 * Format currency
 */
export function formatCurrency(value?: number): string | null {
  if (value == null) return null;
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(value);
}

/**
 * Format percentage
 */
export function formatPercent(value?: number): string | null {
  if (value == null) return null;
  return `${(value * 100).toFixed(1)}%`;
}

/**
 * Format number with commas
 */
export function formatNumber(value?: number): string | null {
  if (value == null) return null;
  return new Intl.NumberFormat('en-US').format(value);
}

/**
 * Get ownership type label
 */
export function getOwnershipLabel(ownership?: number): string | null {
  if (ownership == null) return null;
  const labels: Record<number, string> = {
    1: 'Public',
    2: 'Private nonprofit',
    3: 'Private for-profit',
  };
  return labels[ownership] || 'Unknown';
}
