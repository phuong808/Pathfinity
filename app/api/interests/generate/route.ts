import { NextResponse } from 'next/server'
import { openai } from '@ai-sdk/openai'
import { generateText } from 'ai'

const FALLBACK_INTERESTS = [
  'Problem Solving',
  'Innovation',
  'Leadership',
  'Communication',
  'Critical Thinking',
]

const MAX_INTERESTS = 5

interface RequestBody {
  career: string
  college?: string
  program?: string
  previousInterests?: string[]
  selectedInterests?: string[]
}

/**
 * POST /api/interests/generate
 * 
 * Generates relevant interests based on career path information.
 * Uses GPT-4o-mini to analyze context and suggest 1-5 personalized interests.
 */
export async function POST(req: Request) {
  try {
    const body: RequestBody = await req.json()
    const { career, college, program, previousInterests, selectedInterests } = body

    if (!career?.trim()) {
      return NextResponse.json(
        { error: 'Career is required' },
        { status: 400 }
      )
    }

    const interests = await generateInterestsFromLLM({ 
      career, 
      college, 
      program, 
      previousInterests,
      selectedInterests 
    })
    return NextResponse.json({ interests })
    
  } catch (error) {
    console.error('Error generating interests:', error)
    return NextResponse.json(
      { 
        error: 'Failed to generate interests',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

async function generateInterestsFromLLM(context: RequestBody): Promise<string[]> {
  const { selectedInterests = [], previousInterests = [] } = context
  const numToGenerate = MAX_INTERESTS - selectedInterests.length

  // If all items are selected, return them as-is (no regeneration possible)
  if (numToGenerate <= 0) {
    return selectedInterests
  }

  const contextLines = [
    `Career: ${context.career}`,
    context.college && `College: ${context.college}`,
    context.program && `Program: ${context.program}`,
  ].filter(Boolean).join('\n')

  const excludeSection = previousInterests.length > 0 
    ? `\n\nIMPORTANT: Do NOT include any of these previously suggested interests:\n${previousInterests.map(i => `- ${i}`).join('\n')}\n\nYou must suggest completely NEW and DIFFERENT interests that are still relevant to the career path.`
    : ''

  const prompt = `Based on the following career path information, generate exactly ${numToGenerate} NEW and DIFFERENT relevant interests that would align with this career and academic background. Return ONLY a JSON array of interest strings, nothing else.

${contextLines}${excludeSection}

Requirements:
- Use clear, simple language that a high school student would understand
- Interests should be specific but accessible (e.g., "Building Apps", "City Planning", "Creating Charts and Graphs")
- Avoid overly technical jargon - use everyday terms when possible
- Mix practical activities, subject areas, and related fields
- Keep each interest 2-4 words maximum
- Focus on areas that would benefit someone pursuing this career
- Include both fundamental concepts and exciting modern topics
- Generate DIVERSE options to give the user fresh choices

Return format: ["Interest 1", "Interest 2", "Interest 3"]`

  try {
    const { text } = await generateText({
      model: openai('gpt-4o-mini'),
      prompt,
      temperature: 0.7,
    })

    const newInterests = parseInterestsFromResponse(text, numToGenerate)
    
    // Combine selected interests with newly generated ones
    return [...selectedInterests, ...newInterests]
  } catch (error) {
    console.error('LLM generation failed:', error)
    // Return selected interests plus fallback for remaining slots
    const fallbackNeeded = FALLBACK_INTERESTS.slice(0, numToGenerate)
    return [...selectedInterests, ...fallbackNeeded]
  }
}

function parseInterestsFromResponse(text: string, maxItems: number = MAX_INTERESTS): string[] {
  try {
    // Extract JSON array from response (handles cases where LLM adds extra text)
    const jsonMatch = text.match(/\[[\s\S]*\]/)
    const parsed = jsonMatch ? JSON.parse(jsonMatch[0]) : JSON.parse(text)

    if (!Array.isArray(parsed)) {
      throw new Error('Response is not an array')
    }

    // Validate, clean, and limit
    const interests = parsed
      .filter((item): item is string => typeof item === 'string' && item.trim().length > 0)
      .map((item) => item.trim())
      .slice(0, maxItems)

    return interests.length > 0 ? interests : FALLBACK_INTERESTS.slice(0, maxItems)
    
  } catch (error) {
    console.error('Failed to parse LLM response:', text, error)
    return FALLBACK_INTERESTS.slice(0, maxItems)
  }
}
