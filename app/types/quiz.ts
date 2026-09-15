export type Mode = 'learn' | 'exam' | 'weak' | 'grind'
export type Screen = 'home' | 'quiz' | 'summary'
export type Choice = { label: string; value: string }
export type ParticleDiagram = { molecules: string[]; caption?: string }

export type Question = {
  id: string
  conceptId: string
  topic: string
  eyebrow: string
  prompt: string
  choices?: Choice[]
  answer: string | number
  tolerance?: number
  unit?: string
  explanation: string
  hint?: string
  diagram?: ParticleDiagram
}

export type AttemptRecord = {
  question: Question
  attempts: number
  firstCorrect: boolean
  solved: boolean
  firstResponse: string
  retryResponses: string[]
  excludedFromAudit?: boolean
  disposition?: 'answered' | 'known' | 'skipped'
  masteryBefore?: number
}

export type SessionReport = {
  id: string
  quizId: string
  quizTitle: string
  mode: Mode
  completedAt: string
  records: AttemptRecord[]
}

export type MasteryMap = Record<string, { score: number; correct: number; wrong: number }>

