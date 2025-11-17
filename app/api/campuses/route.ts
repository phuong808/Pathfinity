import { NextResponse } from 'next/server'
import { db } from '@/app/db/index'
import { campus } from '@/app/db/schema'

// In-memory cache
let cachedCampuses: { data: any[], timestamp: number } | null = null
const CACHE_TTL = 1000 * 60 * 30 // 30 minutes

export async function GET(req: Request) {
  try {
    // Check cache first
    if (cachedCampuses && Date.now() - cachedCampuses.timestamp < CACHE_TTL) {
      return NextResponse.json(cachedCampuses.data, {
        headers: {
          'Cache-Control': 'public, s-maxage=1800, stale-while-revalidate=3600',
        },
      })
    }

    const rows = await db.select().from(campus).orderBy(campus.name)
    // Filter out 'pcatt' campus (no majors) and return id and name
    const results = rows
      .filter((r: any) => r.id?.toLowerCase() !== 'pcatt' && r.name?.toLowerCase() !== 'pcatt')
      .map((r: any) => ({ id: r.id, name: r.name }))
    
    // Update cache
    cachedCampuses = { data: results, timestamp: Date.now() }

    return NextResponse.json(results, {
      headers: {
        'Cache-Control': 'public, s-maxage=1800, stale-while-revalidate=3600',
      },
    })
  } catch (err) {
    console.error('Error fetching campuses', err)
    return NextResponse.json({ error: 'Failed to fetch campuses' }, { status: 500 })
  }
}
