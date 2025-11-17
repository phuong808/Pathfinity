"use client"

import { useState, useEffect } from 'react'
import { Button } from '@/app/components/ui/button'
import { Spinner } from '@/app/components/ui/spinner'
import { RotateCcw, CheckSquare, Square } from 'lucide-react'
import CustomSelect from './custom-select'

type Props = {
  form: {
    career: string
    college: string
    program: string
    interests: string[]
  }
  setForm: (form: any) => void
  interests?: string[]
  onInterestsChange?: (interests: string[]) => void
}

const FALLBACK_INTERESTS = [
  'Problem Solving',
  'Innovation',
  'Leadership',
  'Communication',
  'Critical Thinking',
]

export default function Interests({ form, setForm, interests: initialInterests, onInterestsChange }: Props) {
  const [interests, setInterests] = useState<string[]>(initialInterests || [])
  const [isGenerating, setIsGenerating] = useState(false)
  
  const allSelected = interests.length > 0 && interests.every((interest) => form.interests.includes(interest))

  // Sync with parent's interests state when provided
  useEffect(() => {
    if (initialInterests && initialInterests.length > 0) {
      setInterests(initialInterests)
    }
  }, [initialInterests])

  // Generate interests on initial mount if none provided
  useEffect(() => {
    if ((!initialInterests || initialInterests.length === 0) && interests.length === 0) {
      generateInterests()
    }
  }, [])

  async function generateInterests() {
    setIsGenerating(true)
    const previousInterests = [...interests]
    const selectedInterests = form.interests
    
    setInterests([])
    
    try {
      const response = await fetch('/api/interests/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          career: form.career,
          college: form.college,
          program: form.program,
          previousInterests,
          selectedInterests,
        }),
      })

      if (!response.ok) {
        throw new Error(`Failed to generate interests: ${response.statusText}`)
      }

      const data = await response.json()
      const newInterests = data.interests || FALLBACK_INTERESTS
      
      setInterests(newInterests)
      onInterestsChange?.(newInterests)
    } catch (error) {
      console.error('Error generating interests:', error)
      setInterests(FALLBACK_INTERESTS)
      onInterestsChange?.(FALLBACK_INTERESTS)
    } finally {
      setIsGenerating(false)
    }
  }

  function toggleAllInterests() {
    setForm({ 
      ...form, 
      interests: allSelected ? [] : [...interests] 
    })
  }

  function toggleInterest(interest: string) {
    const isSelected = form.interests.includes(interest)
    setForm({
      ...form,
      interests: isSelected 
        ? form.interests.filter((i) => i !== interest)
        : [...form.interests, interest],
    })
  }

  const showLoading = isGenerating && interests.length === 0

  return (
    <div>
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-2xl font-semibold">{form.career}</h2>
          <p className="text-sm text-gray-600 mt-1">
            Select the interests that apply to you.
          </p>
        </div>

        <div className="relative">
          {allSelected && (
            <p className="absolute right-0 -top-6 text-xs text-red-600 whitespace-nowrap">
              Tip: Deselect some interests to regenerate options.
            </p>
          )}
          <div className="flex gap-2">
            <Button
              className="inline-flex items-center px-3 py-1.5 rounded text-sm !bg-green-600 !text-white !border-green-600 hover:!bg-green-700 active:!bg-green-800 focus-visible:!ring-2 focus-visible:!ring-green-300"
              onClick={toggleAllInterests}
              aria-pressed={allSelected}
            >
              {allSelected ? (
                <CheckSquare className="w-4 h-4 mr-2" />
              ) : (
                <Square className="w-4 h-4 mr-2" />
              )}
              Select all
            </Button>

            <Button 
              variant="outline" 
              className="inline-flex items-center px-3 py-1.5" 
              onClick={generateInterests}
              disabled={allSelected}
            >
              <RotateCcw className="w-4 h-4 mr-2" />
              Regenerate
            </Button>
          </div>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap gap-2 max-w-[40rem]">
        {showLoading ? (
          <div className="flex items-center justify-center w-full py-8 text-gray-500">
            <Spinner className="w-6 h-6 mr-2" />
            <span>Generating personalized interests...</span>
          </div>
        ) : (
          interests.map((interest) => (
            <CustomSelect
              key={interest}
              label={interest}
              selected={form.interests.includes(interest)}
              onToggle={toggleInterest}
            />
          ))
        )}
      </div>
    </div>
  )
}
