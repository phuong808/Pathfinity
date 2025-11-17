"use client"

import { useParams, useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { Button } from "@/app/components/ui/button"
import { ArrowLeft } from "lucide-react"
import CollegeRoadmap from "@/app/components/roadmap/college-roadmap"
import { normalizePathwayData } from "@/lib/pathway-json"

interface PathwayData {
    program_name: string
    institution?: string
    total_credits?: number
    years: any[]
}

export default function RoadmapViewerPage() {
    const params = useParams()
    const router = useRouter()
    const slug = params.slug as string
    const [pathwayData, setPathwayData] = useState<PathwayData | null>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        let mounted = true

        async function load() {
            setLoading(true)
            setError(null)

            try {
                // If slug === 'draft' try sessionStorage/localStorage draft handed from Chat
                if (slug === 'draft') {
                    let raw: string | null = null
                    try {
                        raw = sessionStorage.getItem('pathfinity.roadmapDraft')
                    } catch {}
                    if (!raw) {
                        try {
                            raw = localStorage.getItem('pathfinity.roadmapDraft')
                        } catch {}
                    }
                    if (!raw) throw new Error('No draft found in local storage')
                    const parsed = JSON.parse(raw)
                    const normalized = normalizePathwayData(parsed)
                    if (!normalized) throw new Error('Draft JSON is not a valid PathwayData')
                    if (!mounted) return
                    setPathwayData(normalized)
                    return
                }

                // Try public /roadmaps/{slug}.json first
                try {
                    const res = await fetch(`/roadmaps/${slug}.json`)
                    if (res.ok) {
                        const parsed = await res.json()
                        const normalized = normalizePathwayData(parsed)
                        if (!normalized) throw new Error('Downloaded JSON is not a valid PathwayData')
                        if (!mounted) return
                        setPathwayData(normalized)
                        return
                    }
                } catch (err) {
                    // fallthrough to localStorage
                }

                // Fallback: check localStorage key pathfinity.roadmap.<slug>
                let raw: string | null = null
                try {
                    raw = localStorage.getItem(`pathfinity.roadmap.${slug}`)
                } catch {}
                if (!raw) throw new Error('No roadmap found for this slug')
                const parsed = JSON.parse(raw)
                const normalized = normalizePathwayData(parsed)
                if (!normalized) throw new Error('Stored JSON is not a valid PathwayData')
                if (!mounted) return
                setPathwayData(normalized)
            } catch (err: any) {
                if (!mounted) return
                setPathwayData(null)
                setError(err?.message ?? 'Failed to load roadmap')
            } finally {
                if (!mounted) return
                setLoading(false)
            }
        }

        if (slug) load()

        return () => {
            mounted = false
        }
    }, [slug])

    return (
        <div className="min-h-screen w-screen relative bg-white">
            <div className="absolute top-4 left-16 md:left-4 z-50">
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => router.push('/Roadmaps')}
                    className="text-gray-600 hover:text-gray-900"
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
                                        {pathwayData.program_name}
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

                    <CollegeRoadmap program={pathwayData} loading={loading} error={error} />
                </div>
            </main>
        </div>
    )
}
