"use client"

import { Check, AlertTriangle } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "../ui/alert"
import { Spinner } from "../ui/spinner"

type BaseProps = {
  title: string
  description?: React.ReactNode
  className?: string
}

export function SuccessAlert({ title, description, className }: BaseProps) {
  return (
    <div className="absolute top-6 left-1/2 z-50 w-full max-w-2xl -translate-x-1/2 px-4">
      <Alert className={`bg-green-50 border border-green-200 text-green-900 ${className ?? ""}`}>
        <Check className="size-4 text-green-600" />
        <AlertTitle className="text-green-800">{title}</AlertTitle>
        {description && <AlertDescription className="text-green-700">{description}</AlertDescription>}
      </Alert>
    </div>
  )
}

export function WarningAlert({ title, description, className }: BaseProps) {
  return (
    <div className="absolute top-6 left-1/2 z-50 w-full max-w-2xl -translate-x-1/2 px-4">
      <Alert className={`bg-yellow-50 border border-yellow-200 text-yellow-900 ${className ?? ""}`}>
        <AlertTriangle className="size-4 text-yellow-600" />
        <AlertTitle className="text-yellow-800">{title}</AlertTitle>
        {description && <AlertDescription className="text-yellow-700">{description}</AlertDescription>}
      </Alert>
    </div>
  )
}

export function LoadingAlert({ title, description, className }: BaseProps) {
  return (
    <div className="absolute top-6 left-1/2 z-50 w-full max-w-2xl -translate-x-1/2 px-4">
      <Alert className={`bg-blue-50 border border-blue-200 text-blue-900 ${className ?? ""}`}>
        <Spinner className="size-4 text-blue-600" />
        <AlertTitle className="text-blue-800">{title}</AlertTitle>
        {description && <AlertDescription className="text-blue-700">{description}</AlertDescription>}
      </Alert>
    </div>
  )
}

export default SuccessAlert
