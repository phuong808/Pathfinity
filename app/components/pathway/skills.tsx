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
    skills: string[]
  }
  setForm: (form: any) => void
  skills?: string[]
  onSkillsChange?: (skills: string[]) => void
}

const FALLBACK_SKILLS = [
  'Problem Solving',
  'Communication',
  'Critical Thinking',
  'Teamwork',
  'Adaptability',
]

export default function Skills({ form, setForm, skills: initialSkills, onSkillsChange }: Props) {
  const [skills, setSkills] = useState<string[]>(initialSkills || [])
  const [isGenerating, setIsGenerating] = useState(false)
  
  const allSelected = skills.length > 0 && skills.every((skill) => form.skills.includes(skill))

  // Sync with parent's skills state when provided
  useEffect(() => {
    if (initialSkills && initialSkills.length > 0) {
      setSkills(initialSkills)
    }
  }, [initialSkills])

  // Generate skills on initial mount if none provided
  useEffect(() => {
    if ((!initialSkills || initialSkills.length === 0) && skills.length === 0) {
      generateSkills()
    }
  }, [])

  async function generateSkills() {
    setIsGenerating(true)
    const previousSkills = [...skills]
    const selectedSkills = form.skills
    
    setSkills([])
    
    try {
      const response = await fetch('/api/skills/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          career: form.career,
          college: form.college,
          program: form.program,
          interests: form.interests,
          previousSkills,
          selectedSkills,
        }),
      })

      if (!response.ok) {
        throw new Error(`Failed to generate skills: ${response.statusText}`)
      }

      const data = await response.json()
      const newSkills = data.skills || FALLBACK_SKILLS
      
      setSkills(newSkills)
      onSkillsChange?.(newSkills)
    } catch (error) {
      console.error('Error generating skills:', error)
      setSkills(FALLBACK_SKILLS)
      onSkillsChange?.(FALLBACK_SKILLS)
    } finally {
      setIsGenerating(false)
    }
  }

  function toggleAllSkills() {
    setForm({ 
      ...form, 
      skills: allSelected ? [] : [...skills] 
    })
  }

  function toggleSkill(skill: string) {
    const isSelected = form.skills.includes(skill)
    setForm({
      ...form,
      skills: isSelected 
        ? form.skills.filter((s) => s !== skill)
        : [...form.skills, skill],
    })
  }

  const showLoading = isGenerating && skills.length === 0

  return (
    <div>
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-2xl font-semibold">{form.career}</h2>
          <p className="text-sm text-gray-600 mt-1">
            Select the skills that apply to you.
          </p>
        </div>

        <div className="relative">
          {allSelected && (
            <p className="absolute right-0 -top-6 text-xs text-red-600 whitespace-nowrap">
              Tip: Deselect some skills to regenerate options.
            </p>
          )}
          <div className="flex gap-2">
            <Button
              className="inline-flex items-center px-3 py-1.5 rounded text-sm !bg-green-600 !text-white !border-green-600 hover:!bg-green-700 active:!bg-green-800 focus-visible:!ring-2 focus-visible:!ring-green-300"
              onClick={toggleAllSkills}
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
              onClick={generateSkills}
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
            <span>Generating personalized skills...</span>
          </div>
        ) : (
          skills.map((skill) => (
            <CustomSelect
              key={skill}
              label={skill}
              selected={form.skills.includes(skill)}
              onToggle={toggleSkill}
            />
          ))
        )}
      </div>
    </div>
  )
}
