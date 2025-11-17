"use client"

import React from "react"
import { Button } from "@/app/components/ui/button"
import { cn } from "@/lib/utils"

type Props = React.ComponentProps<typeof Button> & {
  children?: React.ReactNode
}

export default function ControlButton({ className, children, ...props }: Props) {
  return (
    <Button size="sm" variant="outline" className={cn("h-12 px-3 flex items-center gap-2", className)} {...props}>
      {children}
    </Button>
  )
}
