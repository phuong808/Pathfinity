"use client"

import { Button } from '@/app/components/ui/button'
import { cn } from '@/lib/utils'

type SelectProps = {
  label: string
  selected?: boolean
  onToggle?: (label: string) => void
  className?: string
}

export default function CustomSelect({ label, selected = false, onToggle, className = "" }: SelectProps) {
  return (
    <Button
      asChild={false}
      onClick={() => onToggle?.(label)}
      aria-pressed={selected}
      variant="ghost"
      size="sm"
      className={cn(
        'inline-flex items-center justify-center rounded-full px-3 py-1 text-sm font-medium transition-all border',
        selected
          ? '!bg-green-600 !text-white !border-green-600 hover:!bg-green-700 active:!bg-green-800 focus-visible:!ring-2 focus-visible:!ring-green-300'
          : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50 active:scale-95',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2',
        className
      )}
    >
      {label}
    </Button>
  )
}
