"use client"

import React, { useMemo, useState, useCallback, useEffect, useRef } from "react"
import { Canvas } from "@/app/components/roadmap/canvas"
import type { Node, Edge } from "@xyflow/react"
import { Position } from "@xyflow/react"
import { Spinner } from "@/app/components/ui/spinner"

import type { Course, Program } from "./types"
import buildNodesAndEdges from "./build-nodes-and-edges"
import CourseMenu from "./course-menu"

export default function CollegeRoadmap({ program, loading, error }: { program?: Program | null; loading?: boolean; error?: string | null }) {
  const [menuCourse, setMenuCourse] = useState<Course | null>(null)
  const [menuPos, setMenuPos] = useState<{ x: number; y: number } | null>(null)
  const [menuNodeId, setMenuNodeId] = useState<string | null>(null)
  const menuRef = useRef<HTMLDivElement | null>(null)

  const handleCourseClick = useCallback((course: Course, nodeId: string, ev: React.MouseEvent) => {
    if (menuNodeId === nodeId) {
      setMenuCourse(null)
      setMenuNodeId(null)
      setMenuPos(null)
      return
    }
    
    setMenuCourse(course)
    setMenuNodeId(nodeId)
    
    
    const nodeEl = document.querySelector(`.react-flow__node[data-id="${nodeId}"]`) as HTMLElement | null
    const containerEl = document.querySelector(".roadmap-canvas") as HTMLElement | null
    if (nodeEl) {
      const r = nodeEl.getBoundingClientRect()
      const c = containerEl?.getBoundingClientRect()
      const left = c ? Math.round(r.left - c.left) : Math.round(r.left)
      const top = c ? Math.round(r.bottom - c.top + 8) : Math.round(r.bottom + 8)
      
      setMenuPos({ x: left, y: top })
    } else {
      const c = containerEl?.getBoundingClientRect()
      setMenuPos({ x: c ? Math.round(ev.clientX - c.left) : ev.clientX, y: c ? Math.round(ev.clientY - c.top) : ev.clientY })
    }
  }, [menuNodeId])

  
  useEffect(() => {
    let raf = 0
    function tick() {
      if (!menuNodeId) return
      const nodeEl = document.querySelector(`.react-flow__node[data-id="${menuNodeId}"]`) as HTMLElement | null
      const containerEl = document.querySelector(".roadmap-canvas") as HTMLElement | null
      if (nodeEl) {
        const r = nodeEl.getBoundingClientRect()
        const c = containerEl?.getBoundingClientRect()
        const left = c ? Math.round(r.left - c.left) : Math.round(r.left)
        const top = c ? Math.round(r.bottom - c.top + 8) : Math.round(r.bottom + 8)
        
        setMenuPos({ x: left, y: top })
        raf = requestAnimationFrame(tick)
      }
    }
    if (menuNodeId) raf = requestAnimationFrame(tick)
    return () => {
      if (raf) cancelAnimationFrame(raf)
    }
  }, [menuNodeId])
  
  useEffect(() => {
    function onDocMouse(e: MouseEvent) {
      const target = e.target as any
      if (menuRef.current && menuRef.current.contains(target)) return
      const nodeEl = menuNodeId ? document.querySelector(`[data-id="${menuNodeId}"]`) as HTMLElement | null : null
      if (nodeEl && nodeEl.contains(target)) return
      setMenuCourse(null)
      setMenuNodeId(null)
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") {
        setMenuCourse(null)
        setMenuNodeId(null)
      }
    }
    document.addEventListener("mousedown", onDocMouse)
    window.addEventListener("keydown", onKey)
    return () => {
      document.removeEventListener("mousedown", onDocMouse)
      window.removeEventListener("keydown", onKey)
    }
  }, [menuNodeId])

  const { nodes, edges } = useMemo(() => buildNodesAndEdges(program, handleCourseClick), [program, handleCourseClick])

  return (
    <div
      className="roadmap-canvas relative w-full h-full rounded-md border bg-white overflow-hidden"
      onMouseDown={() => {
        if (menuCourse) setMenuCourse(null)
      }}
    >
      <Canvas
        nodes={nodes}
        edges={edges}
        nodesDraggable={true}
        nodesConnectable={false}
        panOnDrag={true}
        panOnScroll={false}
        zoomOnScroll={true}
        zoomOnPinch={true}
        minZoom={0.25}
        maxZoom={2}
        style={{ width: "100%", height: "100%" }}
      >
      </Canvas>

      {/* overlays for loading / error — rendered above the canvas */}
      {(loading || error) && (
        <div className="absolute inset-0 z-40 flex items-center justify-center pointer-events-auto">
          {loading ? (
            <Spinner className="w-14 h-14" />
          ) : (
            <div className="bg-white/90 text-red-600 px-6 py-4 rounded shadow">
              Error: {error}
            </div>
          )}
        </div>
      )}

      {/* course detail menu (positioned at click) */}
  {menuCourse && menuPos && <CourseMenu ref={menuRef} course={menuCourse} pos={menuPos} onClose={() => setMenuCourse(null)} />}
    </div>
  )
}
