"use client"

import { useEffect, useState } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/app/components/ui/tabs"
import { Spinner } from "@/app/components/ui/spinner"
import SearchBar from "@/app/components/pathway/search-bar"
import FilterPopover from "@/app/components/pathway/filter-popover"
import SortControl from "@/app/components/pathway/sort-control"
import ProfileCarousel from "@/app/components/profiles/profile-carousel"
import PathwayCard from "@/app/components/pathway/pathway-card"

interface Profile {
    id: number
    userId: string
    career: string
    college: string
    program: string
    interests: string[]
    skills: string[]
    roadmap: any
    createdAt: Date
    updatedAt: Date
}

interface Pathway {
    id: number
    programName: string
    institution: string
    totalCredits: string
    pathwayData: any
}

export default function RoadmapsPage() {
    const [profiles, setProfiles] = useState<Profile[]>([])
    const [activeTab, setActiveTab] = useState<string>("my-roadmaps")
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    
    // Catalog tab states
    const [pathways, setPathways] = useState<Pathway[]>([])
    const [catalogLoading, setCatalogLoading] = useState(false)
    const [catalogError, setCatalogError] = useState<string | null>(null)
    const [searchTerm, setSearchTerm] = useState("")
    const [filterInstitution, setFilterInstitution] = useState("")
    const [filterCredits, setFilterCredits] = useState<string>("any")
    const [filterDegree, setFilterDegree] = useState<string>("any")
    const [sortBy, setSortBy] = useState<string>("")
    const [sortDir, setSortDir] = useState<"asc" | "desc">("asc")

    useEffect(() => {
        async function fetchProfiles() {
            try {
                const response = await fetch("/api/profiles")
                if (!response.ok) {
                    throw new Error("Failed to fetch profiles")
                }
                const data = await response.json()
                setProfiles(data.profiles || [])
            } catch (err) {
                setError(err instanceof Error ? err.message : "An error occurred")
            } finally {
                setLoading(false)
            }
        }

        fetchProfiles()
    }, [])

    useEffect(() => {
        async function fetchPathways() {
            setCatalogLoading(true)
            try {
                const response = await fetch("/api/pathways")
                if (!response.ok) {
                    throw new Error("Failed to fetch pathways")
                }
                const data = await response.json()
                setPathways(data)
            } catch (err) {
                setCatalogError(err instanceof Error ? err.message : "An error occurred")
            } finally {
                setCatalogLoading(false)
            }
        }

        fetchPathways()
    }, [])

    // Filter pathways based on search term
    const normalize = (s?: any) =>
        String(s || '')
            .normalize?.('NFKD')
            .replace(/\p{Diacritic}/gu, '')
            .toLowerCase()
            .replace(/[^\w\s]/g, ' ')
            .replace(/\s+/g, ' ')
            .trim()

    const normalizedSearch = normalize(searchTerm)

    let filteredPathways = pathways.filter((pathway) =>
        normalize(pathway.programName).includes(normalizedSearch) ||
        normalize(pathway.institution).includes(normalizedSearch)
    )

    // Apply additional filters
    if (filterInstitution.trim() !== "") {
        const normalizedInstitution = normalize(filterInstitution)
        filteredPathways = filteredPathways.filter((p) =>
            normalize(p.institution).includes(normalizedInstitution)
        )
    }

    if (filterCredits !== "any") {
        filteredPathways = filteredPathways.filter((p) => {
            const credits = Number(p.totalCredits) || 0
            if (filterCredits === "lt30") return credits < 30
            if (filterCredits === "30to60") return credits >= 30 && credits <= 60
            if (filterCredits === "gt60") return credits > 60
            return true
        })
    }


    // Sorting

    filteredPathways = [...filteredPathways]
    filteredPathways.sort((a, b) => {
        if (sortBy === "credits") {
            const aCredits = Number((a as any).totalCredits) || 0
            const bCredits = Number((b as any).totalCredits) || 0
            return sortDir === "asc" ? aCredits - bCredits : bCredits - aCredits
        }
        if (sortBy === "alpha") {
            return sortDir === "asc" ? a.programName.localeCompare(b.programName) : b.programName.localeCompare(a.programName)
        }
        return 0
    })

    return (
        <div className="container mx-auto py-8 px-4 max-w-7xl">
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-gray-900 mb-2">Roadmaps</h1>
                <p className="text-gray-600">Manage your pathway profiles and explore the roadmap catalog.</p>
                <div className="text-sm text-gray-500 mt-2">{profiles.length} profiles · {pathways.length} catalog items</div>
            </div>

            <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v)} className="w-full">
                <div className="flex justify-center mb-6">
                    <TabsList>
                        <TabsTrigger value="my-roadmaps">My Roadmaps</TabsTrigger>
                        <TabsTrigger value="catalog">Roadmap Catalog</TabsTrigger>
                    </TabsList>
                </div>

                <TabsContent value="my-roadmaps" className="space-y-6">
                    {loading ? (
                        <div className="flex flex-col items-center justify-center py-12">
                            <Spinner className="w-10 h-10" />
                            <div className="text-gray-500 pt-10">Loading your roadmaps...</div>
                        </div>
                    ) : error ? (
                        <div className="flex items-center justify-center py-12">
                            <div className="text-red-500">Error: {error}</div>
                        </div>
                    ) : (
                        <ProfileCarousel
                            profiles={profiles}
                        />
                    )}
                </TabsContent>

                <TabsContent value="catalog" className="space-y-6">
                    {/* Sort, Search and Filters row */}
                    <div className="w-full">
                        <div className="flex items-center gap-4">
            
                            <div className="flex-1">
                                <SearchBar value={searchTerm} onChange={setSearchTerm} />
                            </div>
                            <div className="flex-shrink-0">
                                    <SortControl
                                        sortBy={sortBy}
                                        sortDir={sortDir}
                                        onChange={(by, dir) => { setSortBy(by); setSortDir(dir) }}
                                    />
                            </div>
                            <div className="flex-shrink-0">
                                <FilterPopover
                                    filterInstitution={filterInstitution}
                                    setFilterInstitution={setFilterInstitution}
                                    filterCredits={filterCredits}
                                    setFilterCredits={setFilterCredits}
                                    filterDegree={filterDegree}
                                    setFilterDegree={setFilterDegree}
                                />
                            </div>
                        </div>
                    </div>

                    {catalogLoading ? (
                        <div className="flex flex-col items-center justify-center py-12">
                            <Spinner className="w-10 h-10" />
                            <div className="text-gray-500 pt-10">Loading pathways...</div>
                        </div>
                    ) : catalogError ? (
                        <div className="flex items-center justify-center py-12">
                            <div className="text-red-500">Error: {catalogError}</div>
                        </div>
                    ) : filteredPathways.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-12 text-center">
                            <div className="text-gray-500 mb-2">
                                {searchTerm ? "No pathways match your search." : "No pathways available."}
                            </div>
                            {searchTerm && (
                                <p className="text-sm text-gray-400">Try adjusting your search or filters.</p>
                            )}
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                            {filteredPathways.map((pathway) => (
                                <PathwayCard
                                    key={pathway.id}
                                    programName={pathway.programName}
                                    institution={pathway.institution}
                                    totalCredits={parseInt(pathway.totalCredits)}
                                />
                            ))}
                        </div>
                    )}
                </TabsContent>
            </Tabs>
        </div>
    )
}
