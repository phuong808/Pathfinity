import { NextResponse } from 'next/server'
import { db } from '@/app/db/index'
import { major, degree, majorDegree, campus } from '@/app/db/schema'
import { eq, and } from 'drizzle-orm'

// In-memory cache
const cache = new Map<string, { data: any[], timestamp: number }>()
const CACHE_TTL = 1000 * 60 * 30 // 30 minutes

/**
 * GET /api/degrees?majorTitle=...&campusName=...
 * Returns array of { id, code, name, level } for degrees available for that major at that campus
 */
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const majorTitle = searchParams.get('majorTitle')
    const campusName = searchParams.get('campusName')

    if (!majorTitle || !campusName) {
      return NextResponse.json(
        { error: 'Both majorTitle and campusName are required' },
        { status: 400 }
      )
    }

    const cacheKey = `${campusName}:${majorTitle}`

    // Check cache first
    const cached = cache.get(cacheKey)
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      return NextResponse.json(cached.data, {
        headers: {
          'Cache-Control': 'public, s-maxage=1800, stale-while-revalidate=3600',
        },
      })
    }

    // First, get the campus ID
    const campuses = await db
      .select()
      .from(campus)
      .where(eq(campus.name, campusName))
      .limit(1)

    if (campuses.length === 0) {
      return NextResponse.json([], { status: 200 })
    }

    const campusId = campuses[0].id

    // Then, find the major at this specific campus
    const majors = await db
      .select()
      .from(major)
      .where(
        and(
          eq(major.campusId, campusId),
          eq(major.title, majorTitle)
        )
      )
      .limit(1)

    if (majors.length === 0) {
      return NextResponse.json([], { status: 200 })
    }

    const targetMajorId = majors[0].id

    // join majorDegree -> degree
    const rows = await db
      .select({ id: degree.id, code: degree.code, name: degree.name, level: degree.level })
      .from(degree)
      .innerJoin(majorDegree, eq(degree.id, majorDegree.degreeId))
      .where(eq(majorDegree.majorId, targetMajorId))

    // Update cache
    cache.set(cacheKey, { data: rows, timestamp: Date.now() })

    return NextResponse.json(rows, {
      headers: {
        'Cache-Control': 'public, s-maxage=1800, stale-while-revalidate=3600',
      },
    })
  } catch (err) {
    console.error('Error fetching degrees', err)
    return NextResponse.json({ error: 'Failed to fetch degrees' }, { status: 500 })
  }
}
