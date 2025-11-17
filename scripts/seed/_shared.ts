import path from 'path';
import crypto from 'crypto';
import { sql, eq } from 'drizzle-orm';
import { campus as cam } from '../../app/db/schema';
import type { NeonHttpDatabase } from 'drizzle-orm/neon-http';

export const DATA_DIR = path.join(process.cwd(), 'app', 'db', 'data');
export const MAJORS_FILE = path.join(DATA_DIR, 'uh_majors_colleges_specific_degrees.json');

export function section(title: string) { console.log(`\n===== ${title} =====`); }
export function hash(content: string) { return crypto.createHash('sha256').update(content).digest('hex'); }
export function sourceId(fileName: string) { const h = hash(fileName).slice(0,8); return `source_${fileName.replace(/\W+/g,'_').toLowerCase()}_${h}`; }
export function embeddingContent(c: any) {
  const code = `${c.course_prefix} ${c.course_number}`;
  return `Course: ${code} - ${c.course_title}\nDepartment: ${c.dept_name}\nUnits: ${c.num_units}\nDescription: ${c.course_desc}\nAdditional Info: ${c.metadata}`;
}

export type CampusDef = { id: string; name: string; majorsKey?: string; aliases?: string[] };

export const campusesMap: Record<string, CampusDef> = {
  manoa: { id: 'uh_manoa', name: 'UNIVERSITY OF HAWAIʻI AT MĀNOA', majorsKey: 'University of Hawaiʻi at Mānoa' },
  hilo: { id: 'uh_hilo', name: 'UNIVERSITY OF HAWAIʻI AT HILO', majorsKey: 'University of Hawaiʻi at Hilo' },
  west_oahu: { id: 'uh_west_oahu', name: 'UNIVERSITY OF HAWAIʻI–WEST OʻAHU', majorsKey: 'University of Hawaiʻi–West Oʻahu', aliases: ['UH West Oʻahu', 'UH West Oahu'] },
  hawaiicc: { id: 'hawaii_cc', name: 'HAWAIʻI COMMUNITY COLLEGE', majorsKey: 'Hawaiʻi Community College' },
  honolulucc: { id: 'honolulu_cc', name: 'HONOLULU COMMUNITY COLLEGE', majorsKey: 'Honolulu Community College' },
  kapiolani: { id: 'kapiolani_cc', name: 'KAPIʻOLANI COMMUNITY COLLEGE', majorsKey: 'Kapiʻolani Community College' },
  kauai: { id: 'kauai_cc', name: 'KAUAʻI COMMUNITY COLLEGE', majorsKey: 'Kauaʻi Community College' },
  leeward: { id: 'leeward_cc', name: 'LEEWARD COMMUNITY COLLEGE', majorsKey: 'Leeward Community College' },
  maui: { id: 'maui_college', name: 'MAUI COLLEGE', majorsKey: 'Maui College', aliases: ['UH Maui College', 'University of Hawaiʻi Maui College'] },
  windward: { id: 'windward_cc', name: 'WINDWARD COMMUNITY COLLEGE', majorsKey: 'Windward Community College' },
  pcatt: { id: 'pcatt', name: 'PACIFIC CENTER FOR ADVANCED TECHNOLOGICAL TRAINING', aliases: ['PCATT'] },
};

export const degreeDefaults: Record<string, { requiredCredits?: number|null; typicalDuration?: number|null }> = {
  BA: { requiredCredits: 120, typicalDuration: 48 },
  BS: { requiredCredits: 120, typicalDuration: 48 },
  BFA: { requiredCredits: 120, typicalDuration: 48 },
  BMus: { requiredCredits: 120, typicalDuration: 48 },
  BBA: { requiredCredits: 120, typicalDuration: 48 },
  BEd: { requiredCredits: 120, typicalDuration: 48 },
  BAS: { requiredCredits: 120, typicalDuration: 48 },
  MA: { requiredCredits: 30, typicalDuration: 24 },
  MS: { requiredCredits: 30, typicalDuration: 24 },
  MFA: { requiredCredits: 30, typicalDuration: 36 },
  PhD: { requiredCredits: null, typicalDuration: 60 },
  JD: { requiredCredits: 89, typicalDuration: 36 },
  MEd: { requiredCredits: 30, typicalDuration: 24 },
  MPH: { requiredCredits: 30, typicalDuration: 24 },
  MBA: { requiredCredits: 30, typicalDuration: 24 },
};

export async function ensureCampus(db: NeonHttpDatabase<any>, def: CampusDef) {
  const existing = await db.select().from(cam).where(eq(cam.id, def.id)).limit(1);
  if (existing.length) return;
  await db.insert(cam).values({ id: def.id, name: def.name, aliases: def.aliases ?? null }).onConflictDoNothing();
}
