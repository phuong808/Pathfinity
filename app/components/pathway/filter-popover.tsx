"use client"

import { useEffect, useState } from "react"
import { Popover, PopoverTrigger, PopoverContent } from "@/app/components/ui/popover"
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/app/components/ui/select"
import ControlButton from "@/app/components/pathway/control-button"
import { Button } from "@/app/components/ui/button"
import { Filter } from "lucide-react"

type Props = {
  filterInstitution: string
  setFilterInstitution: (v: string) => void
  filterCredits: string
  setFilterCredits: (v: string) => void
  filterDegree: string
  setFilterDegree: (v: string) => void
  className?: string
}

export default function FilterPopover({
  filterInstitution,
  setFilterInstitution,
  filterCredits,
  setFilterCredits,
  filterDegree,
  setFilterDegree,
  className,
}: Props) {
  const [campusList, setCampusList] = useState<string[]>([])

  useEffect(() => {
    let mounted = true

    fetch('/api/campuses')
      .then((res) => (res.ok ? res.json() : Promise.reject('Failed to fetch campuses')))
      .then((data: any[]) => {
        if (!mounted) return
        const names = data.map((c) => (c?.name ? c.name : String(c)))
        setCampusList(names)
      })

    return () => {
      mounted = false
    }
  }, [])

  return (
    <div className={className}>
      <Popover>
        <PopoverTrigger asChild>
          <ControlButton>
            <Filter className="size-4 mr-2" />
            Filters
          </ControlButton>
        </PopoverTrigger>

        <PopoverContent className="w-80">
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Institution</label>
              <div className="mt-1">
                <Select value={filterInstitution === '' ? '__any' : filterInstitution} onValueChange={(v) => setFilterInstitution(v === '__any' ? '' : v)}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Any" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__any" className="text-popover-foreground">Any</SelectItem>
                    {campusList.map((c) => (
                      <SelectItem key={c} value={c}>
                        {c}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Credits</label>
              <Select onValueChange={(v) => setFilterCredits(v)} value={filterCredits}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Any" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="any">Any</SelectItem>
                  <SelectItem value="lt30">Less than 30</SelectItem>
                  <SelectItem value="30to60">30–60</SelectItem>
                  <SelectItem value="gt60">More than 60</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Degree</label>
              <Select onValueChange={(v) => setFilterDegree(v)} value={filterDegree}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Any" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="any">Any</SelectItem>
                  <SelectItem value="certificate">Certificate</SelectItem>
                  <SelectItem value="associate">Associate</SelectItem>
                  <SelectItem value="bachelor">Bachelor</SelectItem>
                  <SelectItem value="master">Master</SelectItem>
                  <SelectItem value="doctoral">Doctoral</SelectItem>
                  <SelectItem value="postdoctoral">Postdoctoral</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex justify-between pt-2">
              <Button
                size="sm"
                variant="ghost"
                onClick={() => {
                  setFilterInstitution("")
                  setFilterCredits("any")
                  setFilterDegree("any")
                }}
              >
                Reset
              </Button>

              <Button size="sm">Apply</Button>
            </div>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  )
}
