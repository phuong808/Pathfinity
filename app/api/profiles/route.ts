import { NextRequest, NextResponse } from "next/server"
import { db } from "@/app/db"
import { profile } from "@/app/db/schema"
import { auth } from "@/lib/auth"
import { generateRoadmapForProfile } from "@/app/db/actions"
import { sql, eq } from "drizzle-orm"

/**
 * GET - Fetch all profiles for the authenticated user
 */
export async function GET(req: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: req.headers })

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const profiles = await db
      .select()
      .from(profile)
      .where(eq(profile.userId, session.user.id))
      .orderBy(profile.createdAt)

    return NextResponse.json({ profiles }, { status: 200 })
  } catch (error) {
    console.error("Error fetching profiles:", error)
    return NextResponse.json(
      { error: "Failed to fetch profiles" },
      { status: 500 }
    )
  }
}

/**
 * Find the lowest available ID in the profiles table
 */
async function findLowestAvailableId(): Promise<number> {
  // Get all existing IDs
  const existingProfiles = await db
    .select({ id: profile.id })
    .from(profile)
    .orderBy(profile.id)

  const existingIds = new Set(existingProfiles.map(p => p.id))

  // Find the first gap in the sequence starting from 1
  let lowestId = 1
  while (existingIds.has(lowestId)) {
    lowestId++
  }

  return lowestId
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: req.headers })

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await req.json()
    const { career, college, program, interests, skills } = body

    // Find the lowest available ID
    const nextId = await findLowestAvailableId()

    // Insert the profile into the database with explicit ID
    const [newProfile] = await db
      .insert(profile)
      .values({
        id: nextId,
        userId: session.user.id,
        career,
        college,
        program,
        interests,
        skills,
        roadmap: null,
      })
      .returning()

    // Generate roadmap synchronously to know if it succeeded
    try {
      await generateRoadmapForProfile(newProfile.id)
      
      // Fetch the profile again to check if roadmap was generated
      const [updatedProfile] = await db
        .select()
        .from(profile)
        .where(sql`${profile.id} = ${newProfile.id}`)
        .limit(1)
      
      const hasRoadmap = updatedProfile?.roadmap !== null
      
      return NextResponse.json({ 
        success: true, 
        profile: updatedProfile || newProfile,
        hasRoadmap 
      }, { status: 201 })
    } catch (roadmapError) {
      console.error(`Roadmap generation failed for profile ${newProfile.id}:`, roadmapError)
      return NextResponse.json({ 
        success: true, 
        profile: newProfile,
        hasRoadmap: false,
        roadmapError: "Failed to generate roadmap"
      }, { status: 201 })
    }
  } catch (error) {
    console.error("Error creating profile:", error)
    return NextResponse.json(
      { error: "Failed to create profile" },
      { status: 500 }
    )
  }
}

/**
 * DELETE - Remove a profile owned by the authenticated user.
 * Accepts either ?id= query param or JSON body { id }
 */
export async function DELETE(req: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: req.headers })

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Try query param first
    const url = new URL(req.url)
    const idParam = url.searchParams.get("id")

    let id: number | null = null

    if (idParam) {
      id = parseInt(idParam, 10)
    } else {
      try {
        const body = await req.json()
        id = typeof body?.id === "number" ? body.id : parseInt(body?.id, 10)
      } catch (e) {
        // ignore, handled below
      }
    }

    if (!id || Number.isNaN(id)) {
      return NextResponse.json({ error: "Missing or invalid profile id" }, { status: 400 })
    }

    // Verify ownership
    const [existing] = await db.select().from(profile).where(sql`${profile.id} = ${id}`).limit(1)

    if (!existing) {
      return NextResponse.json({ error: "Profile not found" }, { status: 404 })
    }

    if (existing.userId !== session.user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    // Delete the profile
    await db.delete(profile).where(sql`${profile.id} = ${id}`)

    return NextResponse.json({ success: true }, { status: 200 })
  } catch (error) {
    console.error("Error deleting profile:", error)
    return NextResponse.json({ error: "Failed to delete profile" }, { status: 500 })
  }
}
