"use client"

import { Input } from "@/app/components/ui/input"

type Props = {
    value: string
    onChange: (v: string) => void
    className?: string
}

export default function SearchBar({ value, onChange, className }: Props) {
    return (
        <div className={className}>
            <Input
                type="text"
                placeholder="Search pathways by program name or institution..."
                value={value}
                onChange={(e) => onChange(e.target.value)}
                className="w-full h-12"
            />
        </div>
    )
}
