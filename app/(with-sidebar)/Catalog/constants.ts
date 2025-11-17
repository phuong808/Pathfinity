// Semester and course category colors
export const SEMESTER_COLORS: Record<string, string> = {
  'Courses': '#3498db',
  'Internships': '#e67e22',
  'Clubs & Extra Curriculars': '#9b59b6',
  'Part-Time Jobs': '#16a085',
  'Fall Semester': '#E57A44',
  'Spring Semester': '#6B9B6E',
  'Summer Semester': '#F4D47C',
  'Year 1': '#3498db',
  'Year 2': '#9b59b6',
  'Year 3': '#e67e22',
  'Year 4': '#16a085',
};

// Bold color palettes organized by year
export const YEAR_COLOR_PALETTES: Record<number, string[]> = {
  1: [ // Year 1 - Blues
    '#0066CC', // Strong Blue
    '#0080FF', // Bright Blue
    '#1E90FF', // Dodger Blue
    '#4169E1', // Royal Blue
    '#0047AB', // Cobalt Blue
  ],
  2: [ // Year 2 - Greens
    '#00A86B', // Jade Green
    '#00AA55', // Emerald
    '#228B22', // Forest Green
    '#32CD32', // Lime Green
    '#2E8B57', // Sea Green
  ],
  3: [ // Year 3 - Oranges & Reds
    '#FF6347', // Tomato
    '#FF4500', // Orange Red
    '#FF8C00', // Dark Orange
    '#FFA500', // Orange
    '#FF7F50', // Coral
  ],
  4: [ // Year 4 - Purples & Magentas
    '#9370DB', // Medium Purple
    '#8A2BE2', // Blue Violet
    '#9932CC', // Dark Orchid
    '#BA55D3', // Medium Orchid
    '#DA70D6', // Orchid
  ],
};

// Bold timeline colors by year
export const YEAR_TIMELINE_COLORS: Record<number, string[]> = {
  1: [ // Year 1 - Light Blues
    '#B3D9FF', // Light Blue
    '#CCE5FF', // Pale Blue
    '#E6F2FF', // Very Light Blue
  ],
  2: [ // Year 2 - Light Greens
    '#B3E6CC', // Light Green
    '#CCF2E0', // Pale Green
    '#E6F9F0', // Very Light Green
  ],
  3: [ // Year 3 - Light Oranges
    '#FFD9B3', // Light Orange
    '#FFE6CC', // Pale Orange
    '#FFF2E6', // Very Light Orange
  ],
  4: [ // Year 4 - Light Purples
    '#E6CCFF', // Light Purple
    '#F0E0FF', // Pale Purple
    '#F7F0FF', // Very Light Purple
  ],
};

// Visible categories in the timeline
export const VISIBLE_CATEGORIES = ['Courses'];
