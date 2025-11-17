"use client"

import { useParams, useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { Spinner } from "@/app/components/ui/spinner"
import { Card, CardContent, CardHeader, CardTitle } from "@/app/components/ui/card"
import { Button } from "@/app/components/ui/button"
import { ArrowLeft } from "lucide-react"

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

    if (loading) {
        return (
            <div className="container mx-auto py-8 px-4 max-w-7xl">
                <div className="flex flex-col items-center justify-center py-12">
                    <Spinner className="w-10 h-10" />
                    <div className="text-gray-500 pt-10">Loading your personalized roadmap...</div>
                </div>
            </div>
        )
    }

    if (error || !profile) {
        return (
            <div className="container mx-auto py-8 px-4 max-w-7xl">
                <div className="flex items-center justify-center py-12">
                    <div className="text-red-500">Error: {error || "Profile not found"}</div>
                </div>
            </div>
        )
    }

    return (
        <div className="container mx-auto py-8 px-4 max-w-7xl">
            {/* Back Button */}
            <Button
                variant="ghost"
                size="sm"
                onClick={() => router.back()}
                className="mb-4 text-gray-600 hover:text-gray-900"
            >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Roadmaps
            </Button>

            {/* Personalized Roadmap Data */}
            <Card className="w-full">
                <CardHeader>
                    <CardTitle>Pathway Data</CardTitle>
                </CardHeader>
                <CardContent>
                    {profile.roadmap ? (
                        <div className="bg-gray-50 p-4 rounded-lg overflow-auto max-h-[600px]">
                            <pre className="text-xs text-gray-800 whitespace-pre-wrap">
                                {JSON.stringify(profile.roadmap, null, 2)}
                            </pre>
                        </div>
                    ) : (
                        <div className="text-center py-8 text-gray-500">
                            No roadmap data available for this profile yet.
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    )
}
