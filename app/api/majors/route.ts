import { NextResponse } from 'next/server'
import { db } from '@/app/db/index'
import { campus, major } from '@/app/db/schema'
import { eq, sql } from 'drizzle-orm'
import { normalizeHawaiian } from '@/lib/normalize-hawaiian'

// In-memory cache
const cache = new Map<string, { data: any[], timestamp: number }>()
const CACHE_TTL = 1000 * 60 * 30 // 30 minutes

/**
 * GET /api/majors?campusId=... or ?campusName=...
 * Returns array of { id, title }
 */
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const campusId = searchParams.get('campusId')
    const campusName = searchParams.get('campusName')

    let targetCampusId = campusId
    const cacheKey = campusId || campusName || ''

    // Check cache first
    const cached = cache.get(cacheKey)
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      return NextResponse.json(cached.data, {
        headers: {
          'Cache-Control': 'public, s-maxage=1800, stale-while-revalidate=3600',
        },
      })
    }

    if (!targetCampusId && campusName) {
      // Use centralized normalization + alias matching for campus lookup
      const found = await db
        .select()
        .from(campus)
        .where(sql`(
          translate(LOWER(${campus.name}), 'āēīōūʻ''''', 'aeiou') LIKE ${`%${normalizeHawaiian(campusName)}%`} OR
          ${campus.aliases}::text ILIKE ${`%${campusName}%`}
        )`)
        .limit(1)
      if (found.length === 0) {
        return NextResponse.json([], { status: 200 })
      }
      targetCampusId = found[0].id
    }

    if (!targetCampusId) {
      return NextResponse.json({ error: 'campusId or campusName required' }, { status: 400 })
    }

    const majors = await db.select().from(major).where(eq(major.campusId, targetCampusId)).orderBy(major.title)
    const results = majors.map((m: any) => ({ id: m.id, title: m.title }))
    
    // Update cache
    cache.set(cacheKey, { data: results, timestamp: Date.now() })

    return NextResponse.json(results, {
      headers: {
        'Cache-Control': 'public, s-maxage=1800, stale-while-revalidate=3600',
      },
    })
  } catch (err) {
    console.error('Error fetching majors', err)
    return NextResponse.json({ error: 'Failed to fetch majors' }, { status: 500 })
  }
}
