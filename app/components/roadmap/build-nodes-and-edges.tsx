"use client"

import React from "react"
import type { Node } from "@xyflow/react"
import { Position } from "@xyflow/react"
import type { Course, Program } from "./types"
import { NODE_WIDTH, NODE_HEIGHT, COLUMN_GAP, ROW_GAP } from "./types"
import CourseLabelButton from "./course-node"
import SemesterLabel from "./semester-label"
import YearLabel from "./YearLabel"

export function buildNodesAndEdges(
  program?: Program | null,
  onCourseClick?: (course: Course, nodeId: string, ev: React.MouseEvent) => void
) {
  if (!program) {
    return { nodes: [], edges: [] }
  }
  const nodes: Node[] = []

  let semIndex = 0
  const semesterCourseIds: string[][] = []

  const semesterMeta: {
    id: string
    semIndex: number
    courseCount: number
    x: number
    y: number
    semesterName?: string
    yearNumber?: number
    activityCount?: number
    milestoneCount?: number
    activities?: string[]
    milestones?: string[]
    credits?: number
  }[] = []

  const hasCareer = typeof (program as any).career_goal === "string" && (program as any).career_goal.trim().length > 0

  program.years.forEach((year) => {
    year.semesters.forEach((semester) => {
      const realCourseCount = semester.courses.length
      if (realCourseCount === 0) return

      const courseCount = realCourseCount
      const x = semIndex * COLUMN_GAP
      const y = -20

      semesterMeta.push({
        id: `sem-${semIndex}`,
        semIndex,
        courseCount,
        x,
        y,
        semesterName: semester.semester_name,
        yearNumber: year.year_number,
        credits:
          typeof (semester as any).credits === "number"
            ? (semester as any).credits
            : Array.isArray((semester as any).courses)
            ? (semester as any).courses.reduce(
                (acc: number, c: any) => acc + (typeof c?.credits === "number" ? c.credits : 0),
                0
              )
            : 0,
        activityCount: Array.isArray((semester as any).activities)
          ? (semester as any).activities.length
          : 0,
        milestoneCount: Array.isArray((semester as any).milestones)
          ? (semester as any).milestones.length
          : 0,
        activities: Array.isArray((semester as any).activities)
          ? (semester as any).activities.map((a: any) =>
              typeof a === "string" ? a : a?.text || String(a)
            )
          : [],
        milestones: Array.isArray((semester as any).milestones)
          ? (semester as any).milestones.map((m: any) =>
              typeof m === "string" ? m : m?.text || String(m)
            )
          : [],
      })
      semIndex += 1
    })
  })

  const semesterGroupNodes: Node[] = []
  const courseNodes: Node[] = []
  const yearGroupNodes: Node[] = []

  const semesterLabelNodes: Node[] = []

  // Compact badge component rendered inside node.data.label
  const Badge = ({
    label,
    count,
    id,
    items,
    childWidth,
  }: {
    label: string
    count: number
    id: string
    items?: string[]
    childWidth?: number
  }) => {
    const [open, setOpen] = React.useState(false)

    // close this badge when another badge opens
    React.useEffect(() => {
      const handler = (e: any) => {
        try {
          const detail = e?.detail || {}
          if (!detail.id) return
          if (detail.id !== id && detail.open) {
            setOpen(false)
          }
        } catch (err) {
          // ignore
        }
      }
      window.addEventListener("pathfinity:badge-open", handler as EventListener)
      return () => window.removeEventListener("pathfinity:badge-open", handler as EventListener)
    }, [id])

    const childW = childWidth ?? NODE_WIDTH
    const childH = 44

    const toggle = (e: React.MouseEvent) => {
      e.stopPropagation()
      const next = !open
      setOpen(next)
      try {
        window.dispatchEvent(
          new CustomEvent("pathfinity:badge-open", { detail: { id, open: next } })
        )
      } catch (err) {}
    }

    return (
      <div style={{ position: "relative", width: "100%", height: "100%", overflow: "visible" }}>
        <div
          onClick={toggle}
          onMouseDown={(e) => e.stopPropagation()}
          className={
            "w-full h-full flex items-center justify-center rounded-full hover:shadow-md transition-shadow duration-150 cursor-pointer text-center"
          }
          style={{ border: "none", background: "transparent" }}
          role="button"
          aria-pressed={open}
          aria-label={`${count} ${label}`}
        >
          <span className="truncate" style={{ textTransform: "capitalize" }}>
            {count} {label}
          </span>
        </div>

        {/* Child annotation badges that disperse horizontally when open */}
        {items && items.length > 0 && (
          <div
            style={{
              position: "absolute",
              left: "50%",
              top: `calc(100% + 8px)`,
              transform: "translateX(-50%)",
              pointerEvents: open ? "auto" : "none",
              zIndex: open ? 99999 : 0,
            }}
          >
            <div
              style={{
                position: "relative",
                height: childH,
                width: Math.max(childW, items.length * (childW + 8)),
              }}
            >
              {items.map((it, idx) => {
                const mid = (items.length - 1) / 2
                const offset = (idx - mid) * (childW + 12)
                const style: React.CSSProperties = {
                  position: "absolute",
                  left: `calc(50% + ${offset}px - ${childW / 2}px)`,
                  top: 0,
                  width: childW,
                  height: childH,
                  borderRadius: 8,
                  background: "var(--card)",
                  border: "1px solid var(--muted)",
                  boxShadow: open ? "0 8px 24px rgba(2,6,23,0.12)" : "0 1px 0 rgba(0,0,0,0.02)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  padding: "8px 12px",
                  transition: `transform .24s cubic-bezier(.2,.9,.2,1) ${idx * 30}ms, opacity .2s ${
                    idx * 20
                  }ms`,
                  transform: open ? `translateY(6px) scale(1)` : "translateY(0) scale(0.92)",
                  opacity: open ? 1 : 0,
                  zIndex: open ? 99999 : 0,
                  cursor: "default",
                }

                return (
                  <div key={idx} style={style}>
                    <span style={{ fontSize: 13, lineHeight: "16px", textAlign: "center" }}>
                      {it}
                    </span>
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </div>
    )
  }

  semesterMeta.forEach((s) => {
    const paddingX = 24
  const paddingY = 36
    const width = NODE_WIDTH + paddingX * 2
    const height = Math.max(s.courseCount * ROW_GAP + ROW_GAP, NODE_HEIGHT) + paddingY * 2

    semesterGroupNodes.push({
      id: `${s.id}-group`,
      type: "default",
      data: { label: null },
      position: { x: s.x - paddingX, y: s.y - paddingY },
      selectable: false,
      draggable: false,
      connectable: false,
      style: {
        width,
        height,
        borderRadius: 10,
        background: "transparent",
        border: "none",
        pointerEvents: "none",
      },
    })

    const rawName = (s.semesterName || "").toLowerCase()
    let semLabel = s.semesterName || ""
    if (rawName.includes("fall")) semLabel = "Fall Semester"
    else if (rawName.includes("spring")) semLabel = "Spring Semester"
    else if (rawName.includes("summer")) semLabel = "Summer Semester"

  const semLabelWidth = 150
  const semLabelHeight = 28
  const semLabelX = s.x - paddingX + (width - semLabelWidth) / 2
  const semLabelY = s.y - semLabelHeight + 7.5

    semesterLabelNodes.push({
      id: `${s.id}-sem-label`,
      type: "default",
      data: {
        label: (
          <div style={{ pointerEvents: "none", display: "flex", flexDirection: "column", alignItems: "center" }}>
            <SemesterLabel label={semLabel} />
            {typeof s.credits === "number" && (
              <div className="text-xs text-gray-600 mt-1">{s.credits} credits</div>
            )}
          </div>
        ),
      },
      position: { x: semLabelX, y: semLabelY },
      selectable: false,
      draggable: false,
      connectable: false,
      style: {
        width: semLabelWidth,
        height: semLabelHeight,
        background: "transparent",
        border: "none",
        pointerEvents: "none",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      },
    })
  })

  semIndex = 0
  program.years.forEach((year) => {
    year.semesters.forEach((semester) => {
      const thisSemesterIds: string[] = []

      if (semester.courses.length === 0) return

      semester.courses.forEach((course, cIdx) => {
        const id = `y${year.year_number}_s${semIndex}_c${cIdx}`
        thisSemesterIds.push(id)

        const label = <CourseLabelButton course={course} id={id} onCourseClick={onCourseClick} />
        const related = Array.isArray((course as any).isRelated) && (course as any).isRelated.length > 0
        const borderStyle = related ? "2px solid green" : "1px solid var(--muted)"

        courseNodes.push({
          id,
          type: "default",
          data: { label, course },
          sourcePosition: Position.Right,
          targetPosition: Position.Left,
          position: {
            x: semIndex * COLUMN_GAP,
            y: cIdx * ROW_GAP,
          },
          style: {
            width: NODE_WIDTH,
            height: NODE_HEIGHT,
            padding: 0,
            borderRadius: 8,
            background: "var(--background)",
            border: borderStyle,
            boxShadow: "0 1px 0 rgba(0,0,0,0.02)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          },
        })
      })

      semesterCourseIds.push(thisSemesterIds)
      semIndex += 1
    })
  })

  if (hasCareer) {
    const careerId = `postgrad-career`
    const careerCourse: any = { name: (program as any).career_goal || "Career", credits: 0, isRelated: [{ type: "career", value: (program as any).career_goal || "Career" }] }

    // place the career node in the next semester column (year + 1 style)
    courseNodes.push({
      id: careerId,
      type: "default",
      data: { label: <CourseLabelButton course={careerCourse} id={careerId} onCourseClick={onCourseClick} showMenu={false} />, course: careerCourse },
      sourcePosition: Position.Right,
      targetPosition: Position.Left,
      position: {
        x: semIndex * COLUMN_GAP,
        y: 0,
      },
      style: {
        width: NODE_WIDTH,
        height: NODE_HEIGHT,
        padding: 0,
        borderRadius: 8,
        background: "var(--background)",
        border: "1px solid var(--muted)",
        boxShadow: "0 1px 0 rgba(0,0,0,0.02)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      },
    })

    // treat it as its own semester column so edges connect into it
    semesterCourseIds.push([careerId])
  }

  // Create compact activity/milestone badge nodes centered under each semester group
  const badgeNodes: Node[] = []
  const BADGE_WIDTH = 140
  const BADGE_HEIGHT = 36
  const BADGE_GAP = 8

  semesterMeta.forEach((s) => {
    // compute the semester group's layout to fit badges inside
    const paddingX = 24
    const paddingY = 35
    const groupLeft = s.x - paddingX
    const groupWidth = NODE_WIDTH + paddingX * 2

    const centerX = groupLeft + groupWidth / 2

    // compute badge width so two badges + gap will always fit inside the group
    // make them slightly narrower than the default BADGE_WIDTH so they look compact
    const availableForBadges = Math.max(0, groupWidth - BADGE_GAP - 16)
    const perBadgeWidth = Math.min(
      BADGE_WIDTH - 20,
      Math.max(64, Math.floor(availableForBadges / 2) - 10)
    )
    const badgesTotalWidth = perBadgeWidth * 2 + BADGE_GAP
    const leftX = centerX - badgesTotalWidth / 2

    // place badges in the next 'row' below the last course so vertical spacing equals ROW_GAP
    // center the badge vertically within that row to match course node alignment
    const y = s.courseCount * ROW_GAP + (NODE_HEIGHT - BADGE_HEIGHT) / 2

    if (s.activityCount && s.activityCount > 0) {
      badgeNodes.push({
        id: `${s.id}-activities-badge`,
        type: "default",
        data: {
          label: (
            <Badge
              label="activities"
              count={s.activityCount ?? 0}
              id={`${s.id}-activities`}
              items={s.activities ?? []}
              childWidth={Math.min(320, NODE_WIDTH + 40)}
            />
          ),
        },
        position: { x: leftX, y },
        selectable: true,
        draggable: false,
        connectable: false,
        style: {
          width: perBadgeWidth,
          height: BADGE_HEIGHT,
          borderRadius: BADGE_HEIGHT / 2,
          background: "var(--background)",
          border: "1px solid var(--muted)",
          boxShadow: "0 1px 0 rgba(0,0,0,0.02)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: 0,
          boxSizing: "border-box",
          overflow: "visible",
        },
      })
    }

    if (s.milestoneCount && s.milestoneCount > 0) {
      badgeNodes.push({
        id: `${s.id}-milestones-badge`,
        type: "default",
        data: {
          label: (
            <Badge
              label="milestones"
              count={s.milestoneCount ?? 0}
              id={`${s.id}-milestones`}
              items={s.milestones ?? []}
              childWidth={Math.min(320, NODE_WIDTH + 40)}
            />
          ),
        },
        position: { x: leftX + perBadgeWidth + BADGE_GAP, y },
        selectable: true,
        draggable: false,
        connectable: false,
        style: {
          width: perBadgeWidth,
          height: BADGE_HEIGHT,
          borderRadius: BADGE_HEIGHT / 2,
          background: "var(--background)",
          border: "1px solid var(--muted)",
          boxShadow: "0 1px 0 rgba(0,0,0,0.02)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: 0,
          boxSizing: "border-box",
          overflow: "visible",
        },
      })
    }
  })

  const yearLabelNodes: Node[] = []

  const yearCount = program.years.length + (hasCareer ? 1 : 0)

  const lerp = (a: number, b: number, t: number) => a + (b - a) * t
  const lerpHue = (a: number, b: number, t: number) => {
    const diff = ((((b - a) % 360) + 540) % 360) - 180
    return (a + diff * t + 360) % 360
  }

  const interp = (a: { h: number; s: number; l: number }, b: { h: number; s: number; l: number }, t: number) => ({
    h: Math.round(lerpHue(a.h, b.h, t)),
    s: Math.round(lerp(a.s, b.s, t)),
    l: Math.round(lerp(a.l, b.l, t)),
  })

  program.years.forEach((year, yIdx) => {
    const semsForYear = semesterMeta.filter((m) => m.yearNumber === year.year_number)
    if (semsForYear.length === 0) return

    const startIndex = Math.min(...semsForYear.map((m) => m.semIndex))
    const endIndex = Math.max(...semsForYear.map((m) => m.semIndex))

  const paddingX = 24
  const paddingY = 48

    const x = startIndex * COLUMN_GAP - paddingX
    const width = (endIndex - startIndex) * COLUMN_GAP + NODE_WIDTH + paddingX * 2

    let maxCourses = 1
    maxCourses = Math.max(...semsForYear.map((m) => m.courseCount), maxCourses)

    const height = Math.max(maxCourses * ROW_GAP + ROW_GAP, NODE_HEIGHT) + paddingY

  const factor = yearCount > 1 ? yIdx / (yearCount - 1) : 0

  // Gradient control points (green palette): pale mint -> mid green -> deep green
  const startCP = { h: 140, s: 95, l: 92 }
  const midCP = { h: 150, s: 78, l: 80 }
  const endCP = { h: 140, s: 66, l: 56 }

  const cp = factor <= 0.5 ? interp(startCP, midCP, factor * 2) : interp(midCP, endCP, (factor - 0.5) * 2)

  const topColor = `hsl(${cp.h} ${cp.s}% ${cp.l}%)`
  const bottomColor = `hsl(${cp.h} ${Math.max(40, cp.s - 6)}% ${Math.max(30, cp.l - 8)}%)`
  const borderColor = `hsl(${cp.h} ${Math.max(30, cp.s - 10)}% ${Math.max(18, cp.l - 18)}%)`

    yearGroupNodes.push({
      id: `year-${year.year_number}-group`,
      type: "default",
      data: { label: null },
      position: { x, y: -paddingY - 6 },
      selectable: false,
      draggable: false,
      connectable: false,
      style: {
        width,
        height,
        borderRadius: 12,
        background: `linear-gradient(180deg, ${topColor} 0%, ${bottomColor} 100%)`,
        border: `1px solid ${borderColor}`,
        pointerEvents: "none",
      },
    })

    const labelWidth = 180
    const labelHeight = 0
    const labelX = x + (width - labelWidth) / 2
  const labelY = -paddingY - 6 - labelHeight - 42

    const yearCredits = year.semesters.reduce((acc, sem) => {
      if (typeof (sem as any).credits === "number") return acc + (sem as any).credits
      if (Array.isArray((sem as any).courses)) return (
        acc + (sem as any).courses.reduce((a: number, c: any) => a + (typeof c?.credits === "number" ? c.credits : 0), 0)
      )
      return acc
    }, 0)

    yearLabelNodes.push({
      id: `year-${year.year_number}-label`,
      type: "default",
      data: {
        label: (
          <div style={{ pointerEvents: "none", display: "flex", flexDirection: "column", alignItems: "center" }}>
            <YearLabel yearNumber={year.year_number} />
            <div className="text-sm text-gray-600 mt-1">{yearCredits} credits</div>
          </div>
        ),
      },
      position: { x: labelX, y: labelY },
      selectable: false,
      draggable: false,
      connectable: false,
      style: {
        width: labelWidth,
        height: labelHeight,
        background: "transparent",
        border: "none",
        pointerEvents: "none",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      },
    })
  })

  // Add Post Graduation year-group and label if career exists
  if (hasCareer) {
    const postIndex = program.years.length
    const startIndex = semIndex
    const endIndex = semIndex

    const paddingX = 24
    const paddingY = 48

    const x = startIndex * COLUMN_GAP - paddingX
    const width = NODE_WIDTH + paddingX * 2

    const maxCourses = 1
    const height = Math.max(maxCourses * ROW_GAP + ROW_GAP, NODE_HEIGHT) + paddingY

    const factor = yearCount > 1 ? postIndex / (yearCount - 1) : 0

    // Gradient control points (same as other years)
    const startCP = { h: 140, s: 95, l: 92 }
    const midCP = { h: 150, s: 78, l: 80 }
    const endCP = { h: 140, s: 66, l: 56 }
    const cp = factor <= 0.5 ? interp(startCP, midCP, factor * 2) : interp(midCP, endCP, (factor - 0.5) * 2)
    const topColor = `hsl(${cp.h} ${cp.s}% ${cp.l}%)`
    const bottomColor = `hsl(${cp.h} ${Math.max(40, cp.s - 6)}% ${Math.max(30, cp.l - 8)}%)`
    const borderColor = `hsl(${cp.h} ${Math.max(30, cp.s - 10)}% ${Math.max(18, cp.l - 18)}%)`

    yearGroupNodes.push({
      id: `year-postgrad-group`,
      type: "default",
      data: { label: null },
      position: { x, y: -paddingY - 6 },
      selectable: false,
      draggable: false,
      connectable: false,
      style: {
        width,
        height,
        borderRadius: 12,
        background: `linear-gradient(180deg, ${topColor} 0%, ${bottomColor} 100%)`,
        border: `1px solid ${borderColor}`,
        pointerEvents: "none",
      },
    })

    const labelWidth = 180
    const labelHeight = 0
    const labelX = x + (width - labelWidth) / 2
    const labelY = -paddingY - 6 - labelHeight - 42

    yearLabelNodes.push({
      id: `year-postgrad-label`,
      type: "default",
      data: {
        label: (
          <div style={{ pointerEvents: "none", display: "flex", flexDirection: "column", alignItems: "center" }}>
            <div className="text-2xl font-bold">Post Graduation</div>
          </div>
        ),
      },
      position: { x: labelX, y: labelY },
      selectable: false,
      draggable: false,
      connectable: false,
      style: {
        width: labelWidth,
        height: labelHeight,
        background: "transparent",
        border: "none",
        pointerEvents: "none",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      },
    })
  }

  nodes.push(
    ...yearGroupNodes,
    ...yearLabelNodes,
    ...semesterGroupNodes,
    ...semesterLabelNodes,
    ...courseNodes,
    ...badgeNodes
  )


  return { nodes, edges: [] }
}

export default buildNodesAndEdges
