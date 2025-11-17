/**
 * Shared helpers for extracting and validating PathwayData JSON
 * from assistant text and normalizing stored/pasted objects.
 */
import type { PathwayData } from '@/app/(with-sidebar)/Catalog/types';

/**
 * Basic validation: ensure object resembles PathwayData.
 * Loosely checks required top-level keys and that years is an array.
 */
export function isValidPathwayData(obj: any): obj is PathwayData {
  if (!obj || typeof obj !== 'object') return false;
  if (!Array.isArray((obj as any).years)) return false;
  // Soft checks to avoid being overly strict during generation
  // program_name/institution/total_credits may be filled later; years is critical
  return true;
}

/**
 * Normalize various shapes into a PathwayData object, or null if unrecognized.
 * Accepts:
 * - PathwayData
 * - { pathwayData: PathwayData }
 * - [PathwayData, ...]
 */
export function normalizePathwayData(raw: any): PathwayData | null {
  try {
    if (!raw) return null;
    const candidate = (raw as any);

    if (candidate?.pathwayData) {
      if (isValidPathwayData(candidate.pathwayData)) return candidate.pathwayData as PathwayData;
    }

    if (Array.isArray(candidate) && candidate.length > 0) {
      const first = candidate[0];
      if (isValidPathwayData(first)) return first as PathwayData;
    }

    if (isValidPathwayData(candidate)) return candidate as PathwayData;
  } catch {
    // ignore
  }
  return null;
}

/**
 * Extract the first fenced JSON code block from assistant text and
 * return a stringified, normalized PathwayData JSON if valid.
 * Only considers completed fenced blocks to avoid partial streaming issues.
 */
export function extractPathwayJsonFromText(text: string): string | null {
  if (!text) return null;
  const fenceGlobal = /```(json)?\s*([\s\S]*?)```/gi;
  const candidates: string[] = [];
  let match: RegExpExecArray | null;
  while ((match = fenceGlobal.exec(text)) !== null) {
    candidates.push(match[2]);
  }

  const tryParse = (raw: string): string | null => {
    if (!raw) return null;
    const cleaned = raw
      .split('\n')
      .filter(line => !/^\s*(?:\/\/|#)/.test(line))
      .join('\n')
      .trim();
    const startIdx = cleaned.indexOf('{');
    const endIdx = cleaned.lastIndexOf('}');
    if (startIdx === -1 || endIdx === -1 || endIdx <= startIdx) return null;
    const jsonSlice = cleaned.slice(startIdx, endIdx + 1);
    try {
      const parsed = JSON.parse(jsonSlice);
      const normalized = normalizePathwayData(parsed);
      if (normalized) return JSON.stringify(normalized, null, 2);
      return null;
    } catch {
      return null;
    }
  };

  for (const c of candidates) {
    const parsed = tryParse(c);
    if (parsed) return parsed;
  }
  return null;
}
