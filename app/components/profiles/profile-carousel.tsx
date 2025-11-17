"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import {
    Carousel,
    CarouselContent,
    CarouselItem,
    CarouselNext,
    CarouselPrevious,
    type CarouselApi
} from "@/app/components/ui/carousel"
import ProfileCard from "@/app/components/profiles/profile-card"
import { Card, CardContent } from "@/app/components/ui/card"
import { Button } from "@/app/components/ui/button"
import { Plus } from "lucide-react"

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

interface ProfileCarouselProps {
    profiles: Profile[]
}

export default function ProfileCarousel({ profiles }: ProfileCarouselProps) {
    const [api, setApi] = useState<CarouselApi>()
    const router = useRouter()

    if (profiles.length === 0) {
        return (
            <div className="w-full flex items-center justify-center min-h-[55vh]">
                <div className="w-full max-w-2xl">
                    <Card className="w-full h-full flex flex-col overflow-hidden border-dashed border-2 border-gray-200">
                        <CardContent className="flex-1 flex flex-col items-center justify-center p-6 text-center">
                            <h3 className="text-lg font-semibold text-gray-900 mb-2">No profiles yet</h3>
                            <Button
                                onClick={() => router.push('/CreatePathway')}
                                aria-label="Create new profile"
                                className="rounded-full w-14 h-14 flex items-center justify-center bg-green-600 hover:bg-green-700 text-white shadow-sm"
                            >
                                <Plus className="size-8" />
                            </Button>
                            <p className="text-sm text-gray-500 mt-4">Create your first profile to generate a personalized roadmap.</p>
                        </CardContent>
                    </Card>
                </div>
            </div>
        )
    }

    return (
        <div className="w-full flex items-center justify-center min-h-[55vh]">
            <Carousel
                setApi={setApi}
                opts={{
                    align: "center",
                    loop: false,
                }}
                className="w-full max-w-7xl mx-auto px-16"
            >
                <CarouselContent className="-ml-4">
                    {profiles.map((profile) => (
                        <CarouselItem
                            key={profile.id}
                            className="pl-4 basis-full sm:basis-1/2 lg:basis-1/3"
                        >
                            <div className="w-full">
                                <ProfileCard
                                    id={profile.id}
                                    career={profile.career}
                                    college={profile.college}
                                    program={profile.program}
                                    interests={profile.interests}
                                    skills={profile.skills}
                                />
                            </div>
                        </CarouselItem>
                    ))}

                    <CarouselItem
                        key="new-profile"
                        className="pl-4 basis-full sm:basis-1/2 lg:basis-1/3"
                    >
                        <div className="w-full h-full">
                            <Card className="w-full h-full flex flex-col overflow-hidden border-dashed border-2 border-gray-200">
                                <CardContent className="flex-1 flex flex-col items-center justify-center p-6">
                                    <Button
                                        onClick={() => router.push('/CreatePathway')}
                                        aria-label="Create new profile"
                                        className="rounded-full w-14 h-14 flex items-center justify-center bg-green-600 hover:bg-green-700 text-white shadow-sm"
                                    >
                                        <Plus className="size-8" />
                                    </Button>

                                    <div className="text-sm text-gray-500 mt-3">Create a new profile</div>
                                </CardContent>
                            </Card>
                        </div>
                    </CarouselItem>
                </CarouselContent>
                <CarouselPrevious className="left-0" />
                <CarouselNext className="right-0" />
            </Carousel>
        </div>
    )
}
