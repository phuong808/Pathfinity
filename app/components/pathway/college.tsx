"use client"

import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/app/components/ui/select'
import { motion, AnimatePresence } from 'framer-motion'
import { useEffect, useState } from 'react'

interface CampusItem {
  id: string
  name: string
}

type Props = {
  form: any
  setForm: any
  colleges?: string[]
}
type CacheType = {
  campuses: string[] | null
  programs: Map<string, string[]>
}

// In-memory cache for API responses (persists across component re-renders)
const cache: CacheType = {
  campuses: null,
  programs: new Map(),
}

export default function College({ form, setForm, colleges }: Props) {
  const [campusList, setCampusList] = useState<string[]>(cache.campuses || colleges || [])
  const [programList, setProgramList] = useState<string[]>([])

  useEffect(() => {
    const controller = new AbortController()

    // Load campuses once
    if (!cache.campuses) {
      fetch('/api/campuses', { signal: controller.signal })
        .then(res => res.ok ? res.json() : Promise.reject())
        .then((data: CampusItem[]) => {
          const names = data.map(c => c.name)
          cache.campuses = names
          setCampusList(names)
        })
        .catch((err) => {
          if (err?.name !== 'AbortError') console.error('Failed to fetch campuses:', err)
        })
    }

    // When a college is selected, fetch program names from the pathways API and cache them per college.
    // If no college selected yet, clear program list and skip fetching programs.
    if (!form.college) {
      setProgramList([])
      // keep any in-flight campus fetch; just skip program fetch
      return () => controller.abort()
    }

    const normalize = (s?: any) =>
      String(s || '')
        .normalize?.('NFKD')
        .replace(/\p{Diacritic}/gu, '')
        .toLowerCase()
        .replace(/[^\w\s]/g, ' ')
        .replace(/\s+/g, ' ')
        .trim()

    const target = normalize(form.college)

    if (cache.programs.has(form.college)) {
      setProgramList(cache.programs.get(form.college)!)
    } else {
      fetch('/api/pathways', { signal: controller.signal })
        .then(res => res.ok ? res.json() : Promise.reject('Failed to fetch pathways'))
        .then((data: any[]) => {
          const programs = data
            .filter(p => p.institution && normalize(p.institution).includes(target))
            .map(p => p.programName || p.program_name)
            .filter(Boolean)

          const uniq = Array.from(new Set(programs)).sort((a, b) => a.localeCompare(b))
          cache.programs.set(form.college, uniq)
          setProgramList(uniq)
        })
        .catch((err) => {
          if (err?.name !== 'AbortError') console.error('Failed to fetch programs:', err)
          setProgramList([])
        })
    }

    return () => controller.abort()
  }, [form.college])

  return (
    <div>
      <h2 className="text-2xl font-semibold">{form.career}</h2>
  <p className="text-sm text-gray-600 mt-1">Select the college and program that best align with your chosen career.</p>

      <label className="block mt-3">
        <span className="text-sm">College</span>
        <div className="mt-1">
          <Select value={form.college} onValueChange={(v) => {
            // Update selected college and reset program field
            setForm({ ...form, college: v, program: "" })
          }}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select a college" />
            </SelectTrigger>
            <SelectContent>
              {campusList.filter((c) => c !== "Select...").map((c) => (
                <SelectItem key={c} value={c}>
                  {c}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </label>

      <AnimatePresence initial={false}>
        {form.college && (
          <motion.div
            key="program"
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.20 }}
            layout
          >
            <label className="block mt-3">
              <span className="text-sm">Program</span>
              <div className="mt-1">
                <Select value={form.program} onValueChange={(v) => {
                  // selecting a program sets the program value
                  setForm({ ...form, program: v })
                }}>
                  <SelectTrigger className="w-full" disabled={!form.college}>
                    <SelectValue placeholder={form.college ? "Select a program" : "Select a college first"} />
                  </SelectTrigger>
                  <SelectContent className="max-h-[20rem]">
                    {programList.length > 0 ? (
                      programList.map((p) => (
                        <SelectItem key={p} value={p}>
                          {p}
                        </SelectItem>
                      ))
                    ) : (
                      <div className="py-6 text-center text-sm text-gray-500">
                        No programs available
                      </div>
                    )}
                  </SelectContent>
                </Select>
              </div>
            </label>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
