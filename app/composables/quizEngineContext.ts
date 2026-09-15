import type { InjectionKey } from 'vue'
import { inject, provide } from 'vue'
import type { QuizEngine } from './useQuizEngine'

const quizEngineKey: InjectionKey<QuizEngine> = Symbol('quiz-engine')

export function provideQuizEngine(engine: QuizEngine) {
  provide(quizEngineKey, engine)
  return engine
}

export function useQuizEngineContext(): QuizEngine {
  const engine = inject(quizEngineKey)
  if (!engine) throw new Error('Quiz engine context is unavailable.')
  return engine
}

