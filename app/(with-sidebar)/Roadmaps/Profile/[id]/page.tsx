"use client"

import { useParams, useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { Spinner } from "@/app/components/ui/spinner"
import { Button } from "@/app/components/ui/button"
import { ArrowLeft } from "lucide-react"
import CollegeRoadmap from "@/app/components/roadmap/college-roadmap"
import { normalizePathwayData } from "@/lib/pathway-json"

interface Profile {
    id: number
    userId: string
    career: string
    college: string
    major: string
    degree: string
    interests: string[]
    skills: string[]
    roadmap: any
    createdAt: Date
    updatedAt: Date
}

export default function PersonalizedRoadmapProfilePage() {
    const params = useParams()
    const router = useRouter()
    const profileId = params.id as string
    const [profile, setProfile] = useState<Profile | null>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [pathwayData, setPathwayData] = useState<any | null>(null)

    useEffect(() => {
        async function fetchProfile() {
            try {
                // Fetch all profiles
                const response = await fetch("/api/profiles")
                if (!response.ok) {
                    throw new Error("Failed to fetch profiles")
                }
                const data = await response.json()
                const profiles = data.profiles || []

                // Find the specific profile by ID
                const foundProfile = profiles.find((p: Profile) => p.id === parseInt(profileId))

                if (!foundProfile) {
                    throw new Error("Profile not found")
                }

                setProfile(foundProfile)

                // Try to normalize roadmap into PathwayData shape used by CollegeRoadmap
                try {
                    const normalized = normalizePathwayData(foundProfile?.roadmap)
                    setPathwayData(normalized)
                } catch (err) {
                    // ignore - we'll show raw JSON below if not normalized
                    setPathwayData(null)
                }
            } catch (err) {
                setError(err instanceof Error ? err.message : "An error occurred")
            } finally {
                setLoading(false)
            }
        }

        if (profileId) {
            fetchProfile()
        }
    }, [profileId])

    const canvasError = !loading
        ? (error ?? (pathwayData ? null : "No roadmap data available for this profile yet."))
        : null

    return (
        <div className="min-h-screen w-screen relative bg-white">
            <div className="absolute top-4 left-16 md:left-4 z-50">
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => router.push('/Roadmaps')}
                    className="text-gray-600 hover:text-gray-900 bg-white/90 backdrop-blur-sm rounded-md px-4 py-2 hover:cursor-pointer"
                >
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Back to Roadmaps
                </Button>
            </div>

            <main className="w-full h-screen">
                <div className="w-full h-full">
                    {pathwayData && (
                        <header className="absolute inset-x-0 top-12 z-40 pointer-events-none">
                            <div className="max-w-6xl mx-auto px-4 text-center">
                                <div className="inline-block pointer-events-auto bg-white/90 backdrop-blur-sm rounded-md px-4 py-2">
                                    <h1 className="text-lg md:text-2xl font-semibold text-gray-900">
                                        {pathwayData.program_name || `${profile?.college ?? ''} Roadmap`}
                                    </h1>
                                    <div className="mt-1 text-sm md:text-base text-gray-600">
                                        {pathwayData.total_credits != null && (
                                            <span className="mr-2">{pathwayData.total_credits} Total Credits</span>
                                        )}
                                        {pathwayData.institution && <span className="mx-2">•</span>}
                                        {pathwayData.institution && <span>{pathwayData.institution}</span>}
                                    </div>
                                </div>
                            </div>
                        </header>
                    )}

                    <CollegeRoadmap program={pathwayData ?? null} loading={loading} error={canvasError} />
                </div>
            </main>
        </div>
    )
}
