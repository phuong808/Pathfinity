"use client"

import React from "react"

export function YearLabel({ yearNumber }: { yearNumber: number }) {
  return (
    <div className="text-2xl font-bold" style={{ pointerEvents: "none" }}>
      {`Year ${yearNumber}`}
    </div>
  )
}

export default YearLabel
