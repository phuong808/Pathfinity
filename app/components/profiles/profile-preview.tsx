import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/app/components/ui/card"
import { Badge } from "@/app/components/ui/badge"
import { Button } from "@/app/components/ui/button"

interface ProfilePreviewProps {
    career: string
    college: string
    program: string
    interests: string[]
    skills: string[]
    onEdit?: (step: number) => void
}

export default function ProfilePreview({
    career,
    college,
    program,
    interests,
    skills,
    onEdit,
}: ProfilePreviewProps) {
    return (
        <Card className="w-full h-full flex flex-col overflow-hidden">
            <CardHeader className="py-2 px-6 flex-shrink-0">
                <CardTitle className="text-lg font-semibold text-gray-900">{career}</CardTitle>
                <CardDescription className="text-sm text-gray-600 mt-1">
                    Preview your pathway before saving
                </CardDescription>
            </CardHeader>

            <CardContent className="flex-1">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
                    {/* Column 1: Education */}
                    <div className="space-y-3">
                        <div className="flex items-center justify-between gap-2 pb-1.5 border-b border-gray-200">
                            <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wide">Education</h3>
                            {onEdit && (
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => onEdit(2)}
                                    className="text-green-600 hover:text-green-700 hover:bg-green-50 h-6 px-2 text-xs"
                                >
                                    Edit
                                </Button>
                            )}
                        </div>

                        <div className="space-y-3">
                            <div>
                                <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Institution</p>
                                <p className="text-sm text-gray-900 leading-tight">{college}</p>
                            </div>

                            <div>
                                <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Program</p>
                                <p className="text-sm text-gray-900 leading-tight">{program}</p>
                            </div>
                        </div>
                    </div>

                    {/* Column 2: Interests */}
                    <div className="space-y-3">
                        {interests.length > 0 && (
                            <>
                                <div className="flex items-center justify-between gap-2 pb-1.5 border-b border-gray-200">
                                    <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wide">Interests</h3>
                                    {onEdit && (
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => onEdit(3)}
                                            className="text-green-600 hover:text-green-700 hover:bg-green-50 h-6 px-2 text-xs"
                                        >
                                            Edit
                                        </Button>
                                    )}
                                </div>
                                <div className="flex flex-wrap gap-1.5">
                                    {interests.map((interest, idx) => (
                                        <Badge
                                            key={idx}
                                            variant="secondary"
                                            className="!bg-green-600 !text-white !border-green-600 hover:!bg-green-700 active:!bg-green-800 focus-visible:!ring-2 focus-visible:!ring-green-300 px-2.5 py-0.5 text-xs font-medium"
                                        >
                                            {interest}
                                        </Badge>
                                    ))}
                                </div>
                            </>
                        )}
                    </div>

                    {/* Column 3: Skills */}
                    <div className="space-y-3">
                        {skills.length > 0 && (
                            <>
                                <div className="flex items-center justify-between gap-2 pb-1.5 border-b border-gray-200">
                                    <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wide">Skills</h3>
                                    {onEdit && (
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => onEdit(4)}
                                            className="text-green-600 hover:text-green-700 hover:bg-green-50 h-6 px-2 text-xs"
                                        >
                                            Edit
                                        </Button>
                                    )}
                                </div>
                                <div className="flex flex-wrap gap-1.5">
                                    {skills.map((skill, idx) => (
                                        <Badge
                                            key={idx}
                                            variant="secondary"
                                            className="!bg-green-600 !text-white !border-green-600 hover:!bg-green-700 active:!bg-green-800 focus-visible:!ring-2 focus-visible:!ring-green-300 px-2.5 py-0.5 text-xs font-medium"
                                        >
                                            {skill}
                                        </Badge>
                                    ))}
                                </div>
                            </>
                        )}
                    </div>
                </div>
            </CardContent>
        </Card>
    )
}