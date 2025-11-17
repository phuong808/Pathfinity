import fs from "fs";
import path from "path";
import crypto from "crypto";

const CACHE_DIR = path.resolve(process.cwd(), ".cache", "tts");
if (!fs.existsSync(CACHE_DIR)) fs.mkdirSync(CACHE_DIR, { recursive: true });

const INDEX_PATH = path.join(CACHE_DIR, "index.json");

// In-memory map of controllers for aborting in-progress requests.
const controllers = new Map<string, AbortController>();

// Cache retention config from env (with defaults)
const MAX_BYTES = Number(process.env.TTS_CACHE_MAX_BYTES || 1_000_000_000); // 1GB
const MAX_FILES = Number(process.env.TTS_CACHE_MAX_FILES || 5_000);
const MAX_AGE_DAYS = Number(process.env.TTS_CACHE_MAX_AGE_DAYS || 90);

type CacheEntry = {
  key: string;
  path: string;
  size: number;
  createdAt: number;
  lastAccessed: number;
};

function sha256Hex(input: string) {
  return crypto.createHash("sha256").update(input).digest("hex");
}

export function normalizeTextForCache(text: string) {
  // aggressive but safe normalization to maximize cache hits:
  // - trim, collapse whitespace
  // - lowercase
  // - remove punctuation except apostrophes (keeps contractions)
  // - remove repeated punctuation
  const t = text
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();

  // remove common punctuation
  const nopunct = t.replace(/[\"\-—–\(\)\[\]\{\}\*\+=<>\/\\^%$#@!;,?:~`|]/g, "");

  // collapse repeated characters (e.g., !!!!! -> !)
  const collapsed = nopunct.replace(/(.)\1{3,}/g, "$1");

  return collapsed;
}

export function makeCacheKey(text: string, voice = "default", model = "openai-tts") {
  const normalized = normalizeTextForCache(text);
  return sha256Hex(`${model}::${voice}::${normalized}`);
}

export function getCachePath(key: string) {
  return path.join(CACHE_DIR, `${key}.mp3`);
}

export function hasCache(key: string) {
  const p = getCachePath(key);
  return fs.existsSync(p);
}

function loadIndex(): CacheEntry[] {
  if (!fs.existsSync(INDEX_PATH)) return [];
  try {
    const data = fs.readFileSync(INDEX_PATH, "utf-8");
    return JSON.parse(data);
  } catch {
    return [];
  }
}

function saveIndex(entries: CacheEntry[]) {
  try {
    fs.writeFileSync(INDEX_PATH, JSON.stringify(entries, null, 2), "utf-8");
  } catch (err) {
    console.error("Failed to save cache index", err);
  }
}

function touchEntry(key: string) {
  const index = loadIndex();
  const entry = index.find((e) => e.key === key);
  if (entry) {
    entry.lastAccessed = Date.now();
    saveIndex(index);
  }
}

function ensureCacheLimits() {
  let index = loadIndex();
  const now = Date.now();
  const maxAgeMs = MAX_AGE_DAYS * 24 * 60 * 60 * 1000;

  // Remove entries older than MAX_AGE_DAYS
  if (MAX_AGE_DAYS > 0) {
    const before = index.length;
    index = index.filter((e) => {
      if (now - e.createdAt > maxAgeMs) {
        try {
          if (fs.existsSync(e.path)) fs.unlinkSync(e.path);
        } catch {}
        return false;
      }
      return true;
    });
    if (index.length < before) {
      saveIndex(index);
    }
  }

  // Compute totals
  let totalBytes = index.reduce((acc, e) => acc + e.size, 0);
  let totalFiles = index.length;

  // Evict oldest (by lastAccessed) until under limits
  while ((MAX_BYTES > 0 && totalBytes > MAX_BYTES) || (MAX_FILES > 0 && totalFiles > MAX_FILES)) {
    if (index.length === 0) break;
    // sort by lastAccessed ascending (oldest first)
    index.sort((a, b) => a.lastAccessed - b.lastAccessed);
    const victim = index.shift();
    if (victim) {
      try {
        if (fs.existsSync(victim.path)) fs.unlinkSync(victim.path);
      } catch {}
      totalBytes -= victim.size;
      totalFiles--;
    }
  }

  saveIndex(index);
}

export function readCacheBuffer(key: string) {
  const p = getCachePath(key);
  if (!fs.existsSync(p)) return null;
  const buf = fs.readFileSync(p);
  // touch lastAccessed in background (async)
  setImmediate(() => touchEntry(key));
  return buf;
}

export function saveCacheBuffer(key: string, buffer: Buffer) {
  const p = getCachePath(key);
  const tempPath = `${p}.tmp`;
  // atomic write: write to temp, rename
  fs.writeFileSync(tempPath, buffer);
  fs.renameSync(tempPath, p);

  // update index
  const index = loadIndex();
  const existing = index.find((e) => e.key === key);
  const now = Date.now();
  if (existing) {
    existing.size = buffer.length;
    existing.lastAccessed = now;
  } else {
    index.push({
      key,
      path: p,
      size: buffer.length,
      createdAt: now,
      lastAccessed: now,
    });
  }
  saveIndex(index);

  // prune if needed
  ensureCacheLimits();
}

export function registerController(key: string, ctrl: AbortController) {
  controllers.set(key, ctrl);
}

export function clearController(key: string) {
  controllers.delete(key);
}

export function abortController(key: string) {
  const c = controllers.get(key);
  if (c) c.abort();
  controllers.delete(key);
}

export function listControllers() {
  return Array.from(controllers.keys());
}

export function getCacheStats() {
  const index = loadIndex();
  const totalBytes = index.reduce((acc, e) => acc + e.size, 0);
  const totalFiles = index.length;
  const oldestAccess = index.length > 0 ? Math.min(...index.map((e) => e.lastAccessed)) : 0;
  const newestAccess = index.length > 0 ? Math.max(...index.map((e) => e.lastAccessed)) : 0;
  return {
    totalBytes,
    totalFiles,
    maxBytes: MAX_BYTES,
    maxFiles: MAX_FILES,
    maxAgeDays: MAX_AGE_DAYS,
    oldestAccessTime: oldestAccess,
    newestAccessTime: newestAccess,
  };
}

export function pruneCacheNow() {
  ensureCacheLimits();
  return getCacheStats();
}

const cacheApi = {
  makeCacheKey,
  getCachePath,
  hasCache,
  readCacheBuffer,
  saveCacheBuffer,
  registerController,
  clearController,
  abortController,
  listControllers,
  getCacheStats,
  pruneCacheNow,
};

export default cacheApi;
