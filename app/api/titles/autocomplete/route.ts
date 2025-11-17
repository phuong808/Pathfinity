import { NextResponse } from 'next/server'
import { searchTitles } from '@/lib/lightcast-client'

/**
 * Lightcast Titles Autocomplete API
 * 
 * Provides job title suggestions using Lightcast's titles taxonomy.
 * Results are cached for 1 hour to reduce API calls.
 * 
 * Query params:
 *   - q: search query (min 2 characters)
 * 
 * Returns: Array of { id, name, displayName }
 */

// In-memory cache for autocomplete results
const cache = new Map<string, { ts: number; data: any }>()
const CACHE_TTL = 1000 * 60 * 30 // 30 minutes

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const query = searchParams.get('q') || searchParams.get('query') || ''

    // Validate input
    if (!query || query.length < 2) {
      return NextResponse.json({ 
        error: 'Query parameter "q" must be at least 2 characters' 
      }, { status: 400 })
    }

    // Check cache first
    const cacheKey = query.toLowerCase().trim()
    const cached = cache.get(cacheKey)
    if (cached && Date.now() - cached.ts < CACHE_TTL) {
      return NextResponse.json(cached.data)
    }

    // Fetch from Lightcast API
    const titles = await searchTitles(query, 10)
    
    // Transform to consistent format for frontend
    const results = titles.map(title => ({
      id: title.id,
      name: title.name,
      displayName: title.name,
    }))

    // Cache the results
    cache.set(cacheKey, { ts: Date.now(), data: results })

    return NextResponse.json(results)
  } catch (error) {
    console.error('Lightcast autocomplete error:', error)
    
    return NextResponse.json({ 
      error: 'Failed to fetch title suggestions',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}