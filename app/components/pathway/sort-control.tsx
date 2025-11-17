"use client"

import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from "@/app/components/ui/dropdown-menu"
import ControlButton from "@/app/components/pathway/control-button"
import { ArrowUpDown } from "lucide-react"
import { useState } from "react"

type Props = {
  sortBy: string
  sortDir: "asc" | "desc"
  onChange: (sortBy: string, sortDir: "asc" | "desc") => void
  className?: string
}

export default function SortControl({ sortBy, sortDir, onChange, className }: Props) {
  const [open, setOpen] = useState(false)

  function select(kind: string) {
    if (kind === sortBy) {
      const nextDir = sortDir === "asc" ? "desc" : "asc"
      onChange(kind, nextDir)
    } else {
      onChange(kind, "asc")
    }
  }

  return (
    <div className={className}>
      <DropdownMenu open={open} onOpenChange={setOpen}>
        <DropdownMenuTrigger asChild>
          <ControlButton>
            <ArrowUpDown className="size-4 mr-2" />
            <span>Sort</span>
          </ControlButton>
        </DropdownMenuTrigger>

        <DropdownMenuContent sideOffset={8} className="w-48">
          <DropdownMenuItem onSelect={(e: Event) => { e.preventDefault(); select("credits") }}>Credits {sortBy === "credits" ? (sortDir === "asc" ? "↑" : "↓") : null}</DropdownMenuItem>
          <DropdownMenuItem onSelect={(e: Event) => { e.preventDefault(); select("alpha") }}>Alphabetical {sortBy === "alpha" ? (sortDir === "asc" ? "↑" : "↓") : null}</DropdownMenuItem>
          <DropdownMenuItem onSelect={(e: Event) => { e.preventDefault(); select("degree") }}>Degree {sortBy === "degree" ? (sortDir === "asc" ? "↑" : "↓") : null}</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}
