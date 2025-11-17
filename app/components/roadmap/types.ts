export type Course = { name: string; credits: number }
export type Semester = { semester_name: string; credits: number; courses: Course[]; activities?: (string | { text?: string })[]; milestones?: (string | { text?: string })[] }
export type Year = { year_number: number; semesters: Semester[] }

export type Program = {
  program_name: string
  institution?: string
  total_credits?: number
  years: Year[]
}
export const NODE_WIDTH = 220
export const NODE_HEIGHT = 52
export const COLUMN_GAP = 340
export const ROW_GAP = 75
