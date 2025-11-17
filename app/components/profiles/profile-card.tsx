"use client"

import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/app/components/ui/card"
import { Button } from "@/app/components/ui/button"
import { Popover, PopoverContent, PopoverTrigger } from "@/app/components/ui/popover"
import { Plus, Minus } from "lucide-react"
import { useState } from "react"
import { useRouter } from "next/navigation"
import ProfileCardOptions from "@/app/components/profiles/profile-card-options"
import DeleteProfileDialog from "@/app/components/profiles/delete-profile"

interface ProfileCardProps {
    id: number
    career: string
    college: string
    program: string
    interests: string[]
    skills: string[]
}

export default function ProfileCard({
    id,
    career,
    college,
    program,
    interests,
    skills,
}: ProfileCardProps) {
    const [isOpen, setIsOpen] = useState(false)
    const [isDeleting, setIsDeleting] = useState(false)
    const [deleteOpen, setDeleteOpen] = useState(false)
    const router = useRouter()

    const handleViewRoadmap = () => {
        // Use the profile ID for personalized roadmap routing under Roadmaps/Profile
        router.push(`/Roadmaps/Profile/${id}`)
    }

    const handleDelete = async () => {
        try {
            setIsDeleting(true)
            const res = await fetch(`/api/profiles`, {
                method: "DELETE",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ id }),
            })

            if (!res.ok) {
                const data = await res.json().catch(() => ({}))
                const message = data?.error || `Failed to delete profile (status ${res.status})`
                throw new Error(message)
            }

            // Close dialog and refresh the current route so lists update
            setDeleteOpen(false)
            window.location.reload()
        } catch (e) {
            console.error("Error deleting profile:", e)
            alert(e instanceof Error ? e.message : "Failed to delete profile")
        } finally {
            setIsDeleting(false)
        }
    }

    return (
        <Card className="w-full flex flex-col overflow-hidden">
            <CardHeader className="py-2 px-6 flex-shrink-0">
                <div className="flex items-center justify-between w-full">
                    <CardTitle className="text-lg font-semibold text-gray-900">
                        {career}
                    </CardTitle>
                    <ProfileCardOptions
                        onEdit={() => console.log("edit profile", id)}
                        onDelete={() => setDeleteOpen(true)}
                    />
                </div>
            </CardHeader>

            <CardContent className="flex-1">
                <div className="space-y-3">
                    <div className="space-y-2">
                        <div className="flex items-center justify-between gap-2 pb-1.5 border-b border-gray-200">
                            <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wide">Education</h3>
                        </div>

                        <div>
                            <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Institution</p>
                            <p className="text-sm text-gray-900 leading-tight">{college}</p>
                        </div>
                        <div>
                            <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Program</p>
                            <p className="text-sm text-gray-900 leading-tight truncate">{program}</p>
                        </div>
                    </div>

                        {/* Interests & Skills Popover Trigger as Text Row */}
                        {(interests.length > 0 || skills.length > 0) && (
                            <Popover open={isOpen} onOpenChange={setIsOpen}>
                                <PopoverTrigger asChild>
                                    <div
                                        className="flex items-center cursor-pointer select-none justify-between gap-2 pb-1.5 border-gray-200"
                                        tabIndex={0}
                                        role="button"
                                        aria-label="Show Interests and Skills"
                                        onClick={() => setIsOpen(true)}
                                        onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') setIsOpen(true) }}
                                    >
                                        <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wide">Interests & Skills</h3>
                                        {isOpen ? (
                                            <Minus className="ml-auto h-4 w-4 text-gray-700" />
                                        ) : (
                                            <Plus className="ml-auto h-4 w-4 text-gray-700" />
                                        )}
                                    </div>
                                </PopoverTrigger>
                                <PopoverContent className="w-80 p-4" align="start">
                                    <div className="space-y-4">
                                        {/* Interests */}
                                        {interests.length > 0 && (
                                            <div className="space-y-2">
                                                <h4 className="text-xs font-semibold text-gray-900 uppercase tracking-wide pb-1.5 border-b border-gray-200">
                                                    Interests
                                                </h4>
                                                <div className="flex flex-col gap-1.5">
                                                    {interests.map((interest, idx) => (
                                                        <span key={idx} className="text-sm text-gray-900">
                                                            {interest}
                                                        </span>
                                                    ))}
                                                </div>
                                            </div>
                                        )}

                                        {/* Skills */}
                                        {skills.length > 0 && (
                                            <div className="space-y-2">
                                                <h4 className="text-xs font-semibold text-gray-900 uppercase tracking-wide pb-1.5 border-b border-gray-200">
                                                    Skills
                                                </h4>
                                                <div className="flex flex-col gap-1.5">
                                                    {skills.map((skill, idx) => (
                                                        <span key={idx} className="text-sm text-gray-900">
                                                            {skill}
                                                        </span>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </PopoverContent>
                            </Popover>
                        )}
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
            <DeleteProfileDialog
                open={deleteOpen}
                onOpenChange={setDeleteOpen}
                profile={{ id, career }}
                onConfirm={handleDelete}
                confirmLabel={isDeleting ? 'Deleting...' : 'Delete'}
            />
        </Card>
    )
}
