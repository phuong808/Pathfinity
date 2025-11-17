import { NextResponse } from 'next/server'
import { openai } from '@ai-sdk/openai'
import { generateText } from 'ai'

const FALLBACK_SKILLS = [
  'Problem Solving',
  'Communication',
  'Critical Thinking',
  'Teamwork',
  'Adaptability',
]

const MAX_SKILLS = 5

interface RequestBody {
  career: string
  college?: string
  program?: string
  interests?: string[]
  previousSkills?: string[]
  selectedSkills?: string[]
}

/**
 * POST /api/skills/generate
 * 
 * Generates relevant skills based on career path information and interests.
 * Uses GPT-4o-mini to analyze context and suggest 1-5 personalized skills.
 */
export async function POST(req: Request) {
  try {
    const body: RequestBody = await req.json()
    const { career, college, program, interests, previousSkills, selectedSkills } = body

    if (!career?.trim()) {
      return NextResponse.json(
        { error: 'Career is required' },
        { status: 400 }
      )
    }

    const skills = await generateSkillsFromLLM({ 
      career, 
      college, 
      program, 
      interests,
      previousSkills,
      selectedSkills 
    })
    return NextResponse.json({ skills })
    
  } catch (error) {
    console.error('Error generating skills:', error)
    return NextResponse.json(
      { 
        error: 'Failed to generate skills',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

async function generateSkillsFromLLM(context: RequestBody): Promise<string[]> {
  const { selectedSkills = [], previousSkills = [] } = context
  const numToGenerate = MAX_SKILLS - selectedSkills.length

  // If all items are selected, return them as-is (no regeneration possible)
  if (numToGenerate <= 0) {
    return selectedSkills
  }

  const contextLines = [
    `Career: ${context.career}`,
    context.college && `College: ${context.college}`,
    context.program && `Program: ${context.program}`,
    context.interests && context.interests.length > 0 && `Interests: ${context.interests.join(', ')}`,
  ].filter(Boolean).join('\n')

  const excludeSection = previousSkills.length > 0 
    ? `\n\nIMPORTANT: Do NOT include any of these previously suggested skills:\n${previousSkills.map(s => `- ${s}`).join('\n')}\n\nYou must suggest completely NEW and DIFFERENT skills that are still relevant to the career path.`
    : ''

  const prompt = `Based on the following career path information, generate exactly ${numToGenerate} NEW and DIFFERENT relevant skills that would be essential for this career. Return ONLY a JSON array of skill strings, nothing else.

${contextLines}${excludeSection}

Requirements:
- Use clear, simple language that a high school student would understand
- Skills should be specific but accessible (e.g., "Coding in Python", "Analyzing Data", "Leading Teams")
- Avoid overly technical jargon - use everyday terms when possible
- Mix hands-on technical skills, people skills, and subject-specific abilities
- Keep each skill 2-4 words maximum
- Focus on skills that employers value for this career path
- Include both basic building-block skills and specialized abilities
- Generate DIVERSE options to give the user fresh choices

Return format: ["Skill 1", "Skill 2", "Skill 3"]`

  try {
    const { text } = await generateText({
      model: openai('gpt-4o-mini'),
      prompt,
      temperature: 0.7,
    })

    const newSkills = parseSkillsFromResponse(text, numToGenerate)
    
    // Combine selected skills with newly generated ones
    return [...selectedSkills, ...newSkills]
  } catch (error) {
    console.error('LLM generation failed:', error)
    // Return selected skills plus fallback for remaining slots
    const fallbackNeeded = FALLBACK_SKILLS.slice(0, numToGenerate)
    return [...selectedSkills, ...fallbackNeeded]
  }
}

function parseSkillsFromResponse(text: string, maxItems: number = MAX_SKILLS): string[] {
  try {
    // Extract JSON array from response (handles cases where LLM adds extra text)
    const jsonMatch = text.match(/\[[\s\S]*\]/)
    const parsed = jsonMatch ? JSON.parse(jsonMatch[0]) : JSON.parse(text)

    if (!Array.isArray(parsed)) {
      throw new Error('Response is not an array')
    }

    // Validate, clean, and limit
    const skills = parsed
      .filter((item): item is string => typeof item === 'string' && item.trim().length > 0)
      .map((item) => item.trim())
      .slice(0, maxItems)

    return skills.length > 0 ? skills : FALLBACK_SKILLS.slice(0, maxItems)
    
  } catch (error) {
    console.error('Failed to parse LLM response:', text, error)
    return FALLBACK_SKILLS.slice(0, maxItems)
  }
}
