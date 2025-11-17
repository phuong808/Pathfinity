import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { sql, eq, and } from 'drizzle-orm';
import type OpenAI from 'openai';
import { degree, major, majorDegree, course, source, embedding, pathway } from '../../app/db/schema';
import { DATA_DIR, MAJORS_FILE, section, sourceId, embeddingContent, campusesMap, degreeDefaults, ensureCampus, hash } from './_shared';

export type SeedScope = {
  FORCE: boolean;
  ONLY_CAMPUSES?: string[];
};

export type CourseSeedConfig = SeedScope & {
  DO_EMBEDDINGS: boolean;
  LIMIT_COURSES_PER_CAMPUS: number | null;
  BATCH_SIZE: number;
  PAUSE_MS_BETWEEN_BATCHES: number;
};

function scopeLabel(only?: string[]) {
  if (!only || only.length === 0) return 'all campuses';
  if (only.length === 1) {
    const def = campusesMap[only[0] as keyof typeof campusesMap];
    return def ? def.name : 'selected campus';
  }
  return 'selected campuses';
}

export async function seedDegreesAndMajors(db: any, cfg: SeedScope) {
  section(`Degrees & Majors (${scopeLabel(cfg.ONLY_CAMPUSES)})`);
  if (!fs.existsSync(MAJORS_FILE)) { console.log('Majors JSON missing, skipping'); return; }
  const raw = JSON.parse(fs.readFileSync(MAJORS_FILE, 'utf8')) as Record<string, Record<string, string[]>>;

  const allDegreeCodes = new Set<string>();
  for (const campusKey of Object.keys(raw)) {
    for (const majorTitle of Object.keys(raw[campusKey] || {})) {
      (raw[campusKey][majorTitle] || []).forEach(code => allDegreeCodes.add(code.trim()));
    }
  }
  console.log(`Unique degree codes: ${allDegreeCodes.size}`);
  for (const code of Array.from(allDegreeCodes)) {
    const exists = await db.select().from(degree).where(eq(degree.code, code)).limit(1);
    if (!exists.length) {
      await db.insert(degree).values({ code, name: code, level: 'unknown' }).onConflictDoNothing();
    }
  }

  let majorsInserted = 0; let linksInserted = 0; let campusesProcessed = 0;
  const entries = Object.entries(campusesMap).filter(([prefix]) => !cfg.ONLY_CAMPUSES?.length || cfg.ONLY_CAMPUSES.includes(prefix));
  for (const [, def] of entries) {
    const majorsKey = def.majorsKey;
    if (!majorsKey || !raw[majorsKey]) { continue; }
    await ensureCampus(db, def);
    const subset = raw[majorsKey];
    for (const majorTitle of Object.keys(subset)) {
      const existingMajor = await db.select().from(major).where(and(eq(major.campusId, def.id), eq(major.title, majorTitle))).limit(1);
      let majorId: number;
      if (existingMajor.length && !cfg.FORCE) {
        majorId = existingMajor[0].id;
      } else if (existingMajor.length && cfg.FORCE) {
        // Update the existing major with the latest data (e.g., title)
        await db.update(major)
          .set({ title: majorTitle })
          .where(and(eq(major.campusId, def.id), eq(major.title, existingMajor[0].title)));
        majorId = existingMajor[0].id;
      } else {
        const [mRow] = await db.insert(major).values({ campusId: def.id, title: majorTitle }).returning();
        majorId = mRow.id; majorsInserted++;
      }
      const codes = Array.from(new Set(subset[majorTitle].map(c=>c.trim())));
      for (const code of codes) {
        const degRow = await db.select().from(degree).where(eq(degree.code, code)).limit(1);
        if (!degRow.length) continue;
        const linkExists = await db.select().from(majorDegree).where(and(eq(majorDegree.majorId, majorId), eq(majorDegree.degreeId, degRow[0].id))).limit(1);
        if (linkExists.length && !cfg.FORCE) continue;
        const defaults = degreeDefaults[code] || {};
        if (linkExists.length && cfg.FORCE) {
          // Update the existing link with new values
          await db.update(majorDegree)
            .set({
              requiredCredits: defaults.requiredCredits ?? null,
              typicalDuration: defaults.typicalDuration ?? null
            })
            .where(and(eq(majorDegree.majorId, majorId), eq(majorDegree.degreeId, degRow[0].id)));
        } else if (!linkExists.length) {
          await db.insert(majorDegree).values({ majorId, degreeId: degRow[0].id, requiredCredits: defaults.requiredCredits ?? null, typicalDuration: defaults.typicalDuration ?? null });
        }
        linksInserted++;
      }
    }
    campusesProcessed++;
  }
  console.log(`Majors inserted: ${majorsInserted}; major-degree links: ${linksInserted}; campuses covered: ${campusesProcessed}`);
}

export async function seedCoursesAll(db: any, openai: OpenAI | null, cfg: CourseSeedConfig) {
  section(`Courses (${scopeLabel(cfg.ONLY_CAMPUSES)})`);
  const entries = fs.readdirSync(DATA_DIR)
    .filter(f => f.endsWith('_courses.json'))
    .filter(f => !cfg.ONLY_CAMPUSES?.length || cfg.ONLY_CAMPUSES.some(prefix => f.startsWith(prefix)));
  let totalProcessed = 0; let totalEmbeddings = 0; let totalSkipped = 0;

  for (const file of entries) {
    const prefix = file.replace('_courses.json','');
    const def = campusesMap[prefix];
    if (!def) { console.log(`Skip ${file}: unknown campus mapping for prefix '${prefix}'`); continue; }
    await ensureCampus(db, def);

    const filePath = path.join(DATA_DIR, file);
    const raw = JSON.parse(fs.readFileSync(filePath, 'utf8')) as any[];
    const data = cfg.LIMIT_COURSES_PER_CAMPUS ? raw.slice(0, cfg.LIMIT_COURSES_PER_CAMPUS) : raw;
    console.log(`- ${def.name}: loaded ${raw.length}; processing ${data.length}${cfg.LIMIT_COURSES_PER_CAMPUS ? ' (limited)' : ''}`);
    const tScanStart = Date.now();

    const srcId = sourceId(file);
    const srcExists = await db.select().from(source).where(eq(source.id, srcId)).limit(1);
    if (!srcExists.length) {
      await db.insert(source).values({ id: srcId, name: file, url: filePath, type: 'json-file' });
    }

    let processed = 0; let skippedExisting = 0; let embeddingInserted = 0; let embeddingUpdated = 0;
    const pendingEmbedding: { courseData: any; courseId: number; content: string; contentHash: string; ref: string; title: string; metadata: any; existingId?: number }[] = [];

    for (const cRow of data) {
      const prefixCode = String(cRow.course_prefix).trim();
      const number = String(cRow.course_number).trim();
      let courseId: number;
      const existing = await db.select().from(course).where(and(eq(course.campusId, def.id), eq(course.coursePrefix, prefixCode), eq(course.courseNumber, number))).limit(1);
      if (existing.length && !cfg.FORCE) {
        courseId = existing[0].id; skippedExisting++;
      } else if (existing.length && cfg.FORCE) {
        courseId = existing[0].id;
      } else {
        const [row] = await db.insert(course).values({ campusId: def.id, coursePrefix: prefixCode, courseNumber: number, courseTitle: cRow.course_title || null, courseDesc: cRow.course_desc || null, numUnits: String(cRow.num_units||''), deptName: cRow.dept_name || null }).returning();
        courseId = row.id;
      }
      if (cfg.DO_EMBEDDINGS && openai) {
        const content = embeddingContent(cRow);
        const contentHash = hash(content);
        const embRow = await db
          .select({ id: embedding.id, vec: embedding.embedding })
          .from(embedding)
          .where(and(eq(embedding.sourceId, srcId), eq(embedding.contentHash, contentHash)))
          .limit(1);
        if (!embRow.length) {
          pendingEmbedding.push({ courseData: cRow, courseId, content, contentHash, ref: `${prefixCode} ${number}`, title: cRow.course_title, metadata: cRow });
        } else if (cfg.FORCE || embRow[0].vec === null) {
          pendingEmbedding.push({ courseData: cRow, courseId, content, contentHash, ref: `${prefixCode} ${number}`, title: cRow.course_title, metadata: cRow, existingId: embRow[0].id });
        }
      }
      processed++;
      if (processed % 500 === 0) {
        console.log(`  Scan progress: ${processed}/${data.length} courses...`);
      }
    }
    console.log(`  Scan complete: ${processed}/${data.length} in ${((Date.now()-tScanStart)/1000).toFixed(1)}s`);

    if (cfg.DO_EMBEDDINGS && openai) {
      const totalBatches = Math.ceil(pendingEmbedding.length / cfg.BATCH_SIZE) || 0;
      console.log(`  Embedding generation queued: ${pendingEmbedding.length} items in ${totalBatches} batches (size ${cfg.BATCH_SIZE}).`);
      for (let i = 0; i < pendingEmbedding.length; i += cfg.BATCH_SIZE) {
        const batchNum = Math.floor(i / cfg.BATCH_SIZE) + 1;
        const slice = pendingEmbedding.slice(i, i + cfg.BATCH_SIZE);
        const contents = slice.map(s => s.content);
        console.log(`  Requesting embeddings: batch ${batchNum}/${totalBatches} (items ${slice.length})...`);
        let resp;
        try {
          resp = await openai.embeddings.create({ model: 'text-embedding-3-small', input: contents });
        } catch (err) {
          console.error(`  Embedding API error on batch ${batchNum}:`, err);
          throw err;
        }
        const vectors = resp.data.map(d => d.embedding as number[]);
        const insertValues: any[] = [];
        for (let j = 0; j < slice.length; j++) {
          const s = slice[j];
          const vec = vectors[j];
          if (!Array.isArray(vec) || vec.length !== 1536) { console.warn(`  Bad embedding dimensions for ${s.ref}`); continue; }
          const vectorText = `[${vec.join(',')}]`;
          if (s.existingId) {
            await db.execute(sql`UPDATE "embeddings" SET "embedding" = ${vectorText}::vector WHERE "id" = ${s.existingId}`);
            embeddingUpdated += 1;
          } else {
            insertValues.push(
              sql`(${srcId}, ${s.ref}, ${s.title}, ${def.id}, ${s.courseId}, ${s.content}, ${JSON.stringify(s.metadata)}::jsonb, ${s.contentHash}, ${vectorText}::vector)`
            );
          }
        }
        if (insertValues.length) {
          await db.execute(sql`
            INSERT INTO "embeddings"
              ("source_id", "ref_id", "title", "campus_id", "course_id", "content", "metadata", "content_hash", "embedding")
            VALUES ${sql.join(insertValues, sql`, `)}
          `);
          embeddingInserted += insertValues.length; totalEmbeddings += insertValues.length;
        }
        console.log(`  Embedding batch ${batchNum}/${totalBatches}: inserted ${insertValues.length}; updated ${embeddingUpdated}`);
        if (i + cfg.BATCH_SIZE < pendingEmbedding.length && cfg.PAUSE_MS_BETWEEN_BATCHES > 0) {
          await new Promise(r => setTimeout(r, cfg.PAUSE_MS_BETWEEN_BATCHES));
        }
      }
    }

    totalProcessed += processed; totalSkipped += skippedExisting;
    console.log(`  ${def.id}: courses processed ${processed}; existing skipped ${skippedExisting}; embeddings inserted ${embeddingInserted}; embeddings updated ${embeddingUpdated}`);
  }

  console.log(`Courses total processed: ${totalProcessed}; skipped: ${totalSkipped}; embeddings inserted: ${totalEmbeddings}`);
}

export async function seedPathwaysAll(db: any, cfg: SeedScope) {
  section(`Pathways (${scopeLabel(cfg.ONLY_CAMPUSES)})`);
  const entries = fs.readdirSync(DATA_DIR)
    .filter(f => f.endsWith('_degree_pathways.json'))
    .filter(f => !cfg.ONLY_CAMPUSES?.length || cfg.ONLY_CAMPUSES.some(prefix => f.startsWith(prefix)));
  let inserted = 0; let updated = 0;
  for (const file of entries) {
    const filePath = path.join(DATA_DIR, file);
    const raw = JSON.parse(fs.readFileSync(filePath,'utf8'));
    const arr = Array.isArray(raw) ? raw : [raw];
    for (const p of arr) {
      const name = p.program_name;
      const existing = await db.select().from(pathway).where(eq(pathway.programName, name)).limit(1);
      if (existing.length && !cfg.FORCE) { updated++; continue; }
      if (existing.length && cfg.FORCE) {
        await db.update(pathway).set({ institution: p.institution, totalCredits: String(p.total_credits), pathwayData: p }).where(eq(pathway.programName, name));
        updated++; continue;
      }
      await db.insert(pathway).values({ id: crypto.randomUUID(), programName: name, institution: p.institution, totalCredits: String(p.total_credits), pathwayData: p });
      inserted++;
    }
  }
  console.log(`Pathways inserted: ${inserted}; updated/skipped: ${updated}`);
}
