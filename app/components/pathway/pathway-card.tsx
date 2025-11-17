"use client"

import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/app/components/ui/card"
import { Button } from "@/app/components/ui/button"
import { useRouter } from "next/navigation"

interface PathwayCardProps {
    programName: string
    institution: string
    totalCredits: number
}

export default function PathwayCard({
    programName,
    institution,
    totalCredits,
}: PathwayCardProps) {
    const router = useRouter()
    
    // Create a URL-safe slug from the program name
    const createSlug = (name: string) => {
        return name
            .toLowerCase()
            .replace(/[^\w\s-]/g, '') // Remove special characters
            .replace(/\s+/g, '-')      // Replace spaces with hyphens
            .replace(/--+/g, '-')      // Replace multiple hyphens with single hyphen
            .trim()
    }

    const handleViewRoadmap = () => {
        const slug = createSlug(programName)
        router.push(`/Roadmaps/Catalog/${slug}`)
    }

    return (
        <Card className="w-full flex flex-col overflow-hidden hover:shadow-lg transition-shadow">
            <CardHeader className="py-3 px-5 flex-shrink-0">
                <CardTitle className="text-base font-semibold text-gray-900 leading-tight">
                    {programName}
                </CardTitle>
            </CardHeader>

            <CardContent className="flex-1 px-5">
                <div className="space-y-2">
                    <div>
                        <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">
                            Institution
                        </p>
                        <p className="text-sm text-gray-900 leading-tight">{institution}</p>
                    </div>

                    <div>
                        <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">
                            Total Credits
                        </p>
                        <p className="text-sm text-gray-900 leading-tight">{totalCredits}</p>
                    </div>
                </div>
            </CardContent>

            <CardFooter className="border-t flex justify-center items-center flex-shrink-0">
                <Button
                    variant="link"
                    size="sm"
                    className="text-green-600 hover:text-green-700 h-auto p-0 text-sm flex items-center gap-1"
                    onClick={handleViewRoadmap}
                >
                    View Roadmap
                </Button>
            </CardFooter>
        </Card>
    )
}
