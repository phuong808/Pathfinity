/**
 * Normalize Hawaiian text for case-insensitive matching.
 * Removes diacritical marks (macrons and okina) to allow users to search
 * without special characters (e.g., "manoa" matches "Mānoa").
 * 
 * Handles:
 * - Macrons: ā, ē, ī, ō, ū (and uppercase variants)
 * - Okina: ʻ (and regular apostrophe variants)
 */

/**
 * Normalize a string by removing Hawaiian diacritical marks and converting to lowercase.
 * Use this for JavaScript-side normalization when filtering results.
 * 
 * @param text - The text to normalize
 * @returns Normalized lowercase string without Hawaiian diacritical marks
 * 
 * @example
 * normalizeHawaiian("Mānoa") // "manoa"
 * normalizeHawaiian("Hawaiʻi") // "hawaii"
 * normalizeHawaiian("Kapiʻolani") // "kapiolani"
 */
export function normalizeHawaiian(text: string): string {
  if (!text) return '';
  
  return text
    .toLowerCase()
    .replace(/[āĀ]/g, 'a')
    .replace(/[ēĒ]/g, 'e')
    .replace(/[īĪ]/g, 'i')
    .replace(/[ōŌ]/g, 'o')
    .replace(/[ūŪ]/g, 'u')
    .replace(/[ʻ'']/g, ''); // Remove okina and apostrophe variants
}

/**
 * Get the SQL fragment for PostgreSQL's translate() function to normalize Hawaiian text.
 * Use this in Drizzle queries for database-side normalization.
 * 
 * @param columnRef - The Drizzle column reference (e.g., `cam.name`)
 * @returns String to use in sql template literal
 * 
 * @example
 * import { sql } from 'drizzle-orm';
 * import { normalizeHawaiianSQL } from '@/lib/normalize-hawaiian';
 * 
 * const conditions = [];
 * if (campus) {
 *   conditions.push(sql`${normalizeHawaiianSQL(cam.name)} LIKE ${`%${normalizeHawaiian(campus)}%`}`);
 * }
 */
export function normalizeHawaiianSQL(columnRef: any): string {
  // PostgreSQL's translate() function signature: translate(string, from, to)
  // Removes characters by translating them to empty string
  return `translate(LOWER(${columnRef}), 'āēīōūʻ''''', 'aeiou')`;
}

/**
 * Check if a normalized database value matches a normalized search term.
 * Helper for filtering semantic search results by campus.
 * 
 * @param dbValue - The value from the database (e.g., campus name)
 * @param searchTerm - The user's search term
 * @returns True if the normalized values match
 * 
 * @example
 * matchesNormalized("University of Hawaiʻi at Mānoa", "manoa") // true
 * matchesNormalized("Kapiʻolani Community College", "kapiolani") // true
 */
export function matchesNormalized(dbValue: string | null | undefined, searchTerm: string): boolean {
  if (!dbValue) return false;
  const normalizedDb = normalizeHawaiian(dbValue);
  const normalizedSearch = normalizeHawaiian(searchTerm);
  return normalizedDb.includes(normalizedSearch);
}
