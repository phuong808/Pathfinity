"use client"

import React, { useMemo } from "react"
import type { Course } from "./types"
import {
  getCourseDetails,
  extractPrerequisites,
  extractGradeOption,
  extractMajorRestrictions,
  CAMPUSES,
} from '@/lib/course-mapper'

type Props = { course: Course; pos: { x: number; y: number } | null; onClose: () => void }

const CourseMenu = React.forwardRef<HTMLDivElement, Props>(function CourseMenu({ course, pos, onClose }, ref) {
  if (!course || !pos) return null

  const { courseDetails, campus } = useMemo(() => {
    for (const c of CAMPUSES) {
      const details = getCourseDetails(course.name, c.id)
      if (details) return { courseDetails: details, campus: c }
    }
    return { courseDetails: undefined, campus: CAMPUSES.find(c => c.id === 'manoa') }
  }, [course.name])

  return (
    <div
      ref={ref}
      className="absolute z-50"
      style={{ left: pos.x, top: pos.y, transform: "translateY(8px)" }}
      onMouseDown={(e) => e.stopPropagation()}
    >
      <div className="bg-white border rounded shadow-lg p-4 w-80">
        <div className="flex justify-between items-start">
          <div>
            <div className="font-semibold">{course.name}</div>
            {Array.isArray((course as any).isRelated) && (course as any).isRelated.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-2">
                {(course as any).isRelated.map((r: any, idx: number) => (
                  <div
                    key={idx}
                    className="text-xs px-2 py-1 rounded bg-emerald-50 border border-emerald-200 text-emerald-800"
                    title={`${r.type}: ${r.value}`}
                  >
                    <span className="font-medium capitalize mr-1">{r.type}:</span>
                    <span className="truncate">{r.value}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
          <button
            aria-label="Close"
            className="text-gray-500 hover:text-gray-700 cursor-pointer"
            onClick={(e) => {
              e.stopPropagation()
              onClose()
            }}
          >
            ✕
          </button>
        </div>

        
        {courseDetails ? (
          <div className="mt-3 text-sm text-gray-700 space-y-2">
            <div className="font-semibold text-gray-800">{courseDetails.course_title}</div>
            <div className="text-gray-700">{courseDetails.course_desc}</div>

            <div className="flex gap-4 mt-2 text-sm">
              <div className="text-gray-600">Dept: {courseDetails.dept_name}</div>
              <div className="text-gray-600">Credits: {courseDetails.num_units}</div>
            </div>

            {courseDetails.metadata && (
              <div className="mt-2 text-xs text-gray-700 bg-gray-50 p-2 rounded">
                <div className="font-medium">Prerequisites</div>
                <div className="text-sm">{extractPrerequisites(courseDetails.metadata)}</div>

                <div className="mt-2 font-medium">Grade Option</div>
                <div className="text-sm">{extractGradeOption(courseDetails.metadata)}</div>

                {extractMajorRestrictions(courseDetails.metadata) !== 'None' && (
                  <div className="mt-2 font-medium text-red-700">Major Restrictions</div>
                )}
                {extractMajorRestrictions(courseDetails.metadata) !== 'None' && (
                  <div className="text-sm text-red-700">{extractMajorRestrictions(courseDetails.metadata)}</div>
                )}
              </div>
            )}

            <div className="mt-3 text-xs text-blue-800 bg-blue-50 p-2 rounded border border-blue-100">
              Course information from {campus?.displayName}
            </div>
          </div>
        ) : (
          <div className="mt-3 text-sm text-gray-700">More details about this course is currently unavailable in the catalog.</div>
        )}
      </div>
    </div>
  )
})

export default CourseMenu
