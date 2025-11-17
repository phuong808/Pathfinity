"use client"

import { useEffect, useRef, useState } from 'react'
import { Input } from '@/app/components/ui/input'
import { Spinner } from '@/app/components/ui/spinner'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandList,
} from '@/app/components/ui/command'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/app/components/ui/popover'

interface CareerFormData {
  career: string
  careerId?: string | null
  careerCode?: string | null // O*NET-SOC code
  careerValidated?: boolean
}

type Props = {
  form: CareerFormData
  setForm: (form: any) => void
}

interface TitleSuggestion {
  id: string
  code: string
  name: string
  displayName: string
  isAlternate?: boolean
}

export default function Career({ form, setForm }: Props) {
  const [query, setQuery] = useState(form.career || '')
  const [suggestions, setSuggestions] = useState<TitleSuggestion[]>([])
  const [isOpen, setIsOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const timer = useRef<NodeJS.Timeout | null>(null)
  const abortRef = useRef<AbortController | null>(null)

  // Debounced autocomplete
  useEffect(() => {
    if (timer.current) clearTimeout(timer.current)
    if (abortRef.current) abortRef.current.abort()

    if (!query || query.length < 2) {
      setSuggestions([])
      setLoading(false)
      setIsOpen(false)
      return
    }

    setLoading(true)
    timer.current = setTimeout(async () => {
      try {
        abortRef.current = new AbortController()
        const res = await fetch(
          `/api/titles/autocomplete?q=${encodeURIComponent(query)}`,
          { signal: abortRef.current.signal }
        )

        if (!res.ok) {
          setSuggestions([])
          setLoading(false)
          setIsOpen(true)
          return
        }

        const data = await res.json()
        setSuggestions(Array.isArray(data) ? data : [])
        setLoading(false)
        setIsOpen(true)
      } catch (err) {
        if (err instanceof Error && err.name !== 'AbortError') {
          console.error('Autocomplete error:', err)
        }
        setSuggestions([])
        setLoading(false)
      }
    }, 350)

    return () => {
      if (timer.current) clearTimeout(timer.current)
      if (abortRef.current) abortRef.current.abort()
    }
  }, [query])

  function selectSuggestion(suggestion: TitleSuggestion) {
    setQuery(suggestion.name)
    setIsOpen(false)

    setForm({
      ...form,
      career: suggestion.name,
      careerId: suggestion.id,
      careerCode: suggestion.code, // Store O*NET-SOC code
      careerValidated: true,
    })
  }

  function handleOpenChange(open: boolean) {
    // Only allow opening when the user has typed >= 2 chars and not loading
    if (open && query.length >= 2 && !loading) {
      setIsOpen(true)
    } else {
      setIsOpen(false)
    }
  }

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-semibold">What Is Your Desired Career?</h2>
      <div className="space-y-2">
        <Popover open={isOpen} onOpenChange={handleOpenChange}>
          
          <PopoverTrigger asChild>
            <div className="relative">
              <Input
                aria-label="Career"
                value={query}
                onChange={(e) => {
                  const val = e.target.value
                  setQuery(val)
                  setIsOpen(false)
                  setForm({ 
                    ...form, 
                    career: val, 
                    careerId: null,
                    careerCode: null, 
                    careerValidated: false 
                  })
                }}
                onFocus={() => {
                  if (suggestions.length > 0) setIsOpen(true)
                }}
                className="h-12 text-lg px-4"
                placeholder="e.g. Software Engineer, Registered Nurse, Teacher"
              />
              {loading && (
                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                  <Spinner className="h-4 w-4 text-gray-500" />
                </div>
              )}
            </div>
          </PopoverTrigger>

          <PopoverContent
            className="w-[var(--radix-popover-trigger-width)] p-0"
            align="start"
            onOpenAutoFocus={(e) => e.preventDefault()}
          >
             
            <Command shouldFilter={false}>
              <CommandList className="max-h-[18rem]">
                <CommandEmpty>
                  {query.length >= 2 && !loading && (
                    <div className="py-6 text-center text-sm">
                      No careers found matching "{query}"
                      <br />
                      Please select a valid career to proceed
                    </div>
                  )}
                </CommandEmpty>

                {suggestions.length > 0 && (
                  <CommandGroup heading="Select a Career">
                    {suggestions.map((suggestion, index) => (
                      <CommandItem
                        key={`${suggestion.id}-${index}`}
                        value={suggestion.name}
                        onSelect={() => selectSuggestion(suggestion)}
                        className="cursor-pointer"
                      >
                        {suggestion.displayName}
                      </CommandItem>
                    ))}
                  </CommandGroup>
                )}
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>
      </div>
    </div>
  )
}
