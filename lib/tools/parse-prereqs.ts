import { tool } from 'ai';
import { z } from 'zod';

/**
 * Parses course prerequisite information from metadata strings.
 * Handles various formats like "Pre:", "Prerequisites:", etc.
 */
export const parsePrereqs = tool({
  description: `Parse and extract prerequisite information from course metadata. 
  Use this when asked about course prerequisites, requirements, or what's needed to take a course.
  Returns structured prerequisite data including courses and placement requirements.`,
  inputSchema: z.object({
    metadata: z.string().describe('The raw metadata string from a course that contains prerequisite information'),
  }),
  execute: async ({ metadata }) => {
    if (!metadata) {
      return {
        hasPrereqs: false,
        prerequisites: [],
        lectureHours: null,
        labHours: null,
        rawPrereqText: null,
      };
    }

    // Normalize the metadata string
    let normalized = metadata
      .replace(/\u201c|\u201d/g, '"')
      .replace(/\s+/g, ' ')
      .trim();

    // Extract prerequisites
    const preMatch = normalized.match(/\b(?:pre|prereq|prerequisite|prerequisites|coreq|corequisite)s?\b[:\-]?\s*([^;]+?)(?:;|\blecture\b|\blab\b|$)/i);
    const rawPrereqText = preMatch ? preMatch[0].trim() : null;
    
    let prerequisites: string[] = [];
    if (preMatch) {
      const prereqSection = preMatch[1]
        .replace(/\(.*?\)/g, ' ') // remove parenthetical notes
        .trim();

      // Split on common separators
      const parts = prereqSection
        .split(/\s+or\s+|,|\s+and\s+|\/|\n/gi)
        .map(p => p.trim())
        .filter(Boolean);

      // Normalize course codes and placement text
      prerequisites = parts.map(p => {
        let normalized = p
          .replace(/\bplacement in\b/i, 'placement in ')
          .replace(/\b([a-z]{2,6})\s*(\d+\w*)\b/gi, (_, subj, num) => 
            `${subj.toUpperCase()} ${num.toUpperCase()}`)
          .replace(/\s+/g, ' ')
          .trim();
        return normalized;
      });

      // Deduplicate
      prerequisites = Array.from(new Set(prerequisites)).filter(Boolean);
    }

    // Extract lecture hours
    const lectureMatch = normalized.match(/\blecture\s*hours?\s*[:\-]?\s*(\d+)/i);
    const lectureHours = lectureMatch ? parseInt(lectureMatch[1], 10) : null;

    // Extract lab hours
    const labMatch = normalized.match(/\blab\s*hours?\s*[:\-]?\s*(\d+)/i);
    const labHours = labMatch ? parseInt(labMatch[1], 10) : null;

    return {
      hasPrereqs: prerequisites.length > 0,
      prerequisites,
      lectureHours,
      labHours,
      rawPrereqText,
    };
  },
});
