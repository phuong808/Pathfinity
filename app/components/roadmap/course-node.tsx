"use client"

import React from "react"
import type { Course } from "./types"

export function CourseLabelButton({
  course,
  id,
  onCourseClick,
  showMenu = true,
}: {
  course: Course
  id: string
  onCourseClick?: (course: Course, nodeId: string, ev: React.MouseEvent) => void
  showMenu?: boolean
}) {
  if (!showMenu) {
    return (
      <div
        onMouseDown={(e) => e.stopPropagation()}
        className={
          "w-full h-full flex items-center justify-center rounded text-center"
        }
        style={{ border: "none", background: "transparent", pointerEvents: "none" }}
        aria-hidden
      >
        <span className="truncate">{course.name}</span>
      </div>
    )
  }

  return (
    <button
      onClick={(e) => {
        e.stopPropagation()
        onCourseClick?.(course, id, e)
      }}
      onMouseDown={(e) => e.stopPropagation()}
      className={
        "w-full h-full flex items-center justify-center rounded hover:shadow-md transition-shadow duration-150 cursor-pointer text-center"
      }
      style={{ border: "none", background: "transparent" }}
    >
      <span className="truncate">{course.name}</span>
    </button>
  )
}

export default CourseLabelButton
