"use client"

import { useParams, useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { Button } from "@/app/components/ui/button"
import { ArrowLeft } from "lucide-react"
import CollegeRoadmap from "@/app/components/roadmap/college-roadmap"

interface PathwayData {
    program_name: string
    institution: string
    total_credits: number
    years: any[]
}

export default function RoadmapCatalogDetailPage() {
    const params = useParams()
    const router = useRouter()
    const slug = params.slug as string
    const [pathwayData, setPathwayData] = useState<PathwayData | null>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        const controller = new AbortController()
        let mounted = true

        async function fetchPathwayData() {
            setLoading(true)
            try {
                const res = await fetch('/api/pathways', { signal: controller.signal })
                if (!res.ok) {
                    const text = await res.text().catch(() => '')
                    throw new Error(text || 'Failed to fetch pathways')
                }

                const pathways = await res.json()
                const pathway = pathways.find((p: any) => {
                    const pathwaySlug = p.programName
                        .toLowerCase()
                        .replace(/[^\w\s-]/g, '')
                        .replace(/\s+/g, '-')
                        .replace(/--+/g, '-')
                        .trim()
                    return pathwaySlug === slug
                })

                if (!pathway) {
                    if (!mounted) return
                    setPathwayData(null)
                    setError('Pathway not found')
                    return
                }

                if (!mounted) return
                setPathwayData(pathway.pathwayData)
                setError(null)
            } catch (err: any) {
                // ignore abort errors
                if (err?.name === 'AbortError') return
                if (!mounted) return
                setPathwayData(null)
                setError(err?.message ?? 'An error occurred')
            } finally {
                if (!mounted) return
                setLoading(false)
            }
        }

        if (slug) fetchPathwayData()

        return () => {
            mounted = false
            controller.abort()
        }
    }, [slug])

    return (
        <div className="min-h-screen w-screen relative bg-white">
            {/* Back Button - kept and positioned at top-left */}
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
