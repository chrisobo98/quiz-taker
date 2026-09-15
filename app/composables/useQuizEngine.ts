import { computed, nextTick, onMounted, ref, watch } from 'vue'
import { findGlossaryEntry } from '../data/studyGlossary'
import { elementCategories, periodicTable, type ChemicalElement } from '../data/periodicTable'
import { concepts, freshMastery, type ConceptId } from '../data/concepts'
import { choice, conversionFactors, generateQuestion, pick, shuffle } from '../data/questionBank'
import type { AttemptRecord, MasteryMap, Mode, Question, Screen, SessionReport } from '../types/quiz'

function createPersistenceSnapshot<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T
}

export function useQuizEngine() {
const mode = ref<Mode>('learn')
const screen = ref<Screen>('home')
const mastery = ref<MasteryMap>(freshMastery())
const stats = ref({ attempted: 0, correct: 0 })
const current = ref<Question | null>(null)
const response = ref('')
const submitted = ref(false)
const wasCorrect = ref(false)
const examQuestions = ref<Question[]>([])
const examIndex = ref(0)
const sessionRecords = ref<AttemptRecord[]>([])
const recoveryRecordId = ref<string | null>(null)
const resumeAvailable = ref(false)
const reportHistory = ref<SessionReport[]>([])
const activeReport = ref<SessionReport | null>(null)
const recentIds = ref<string[]>([])
const showHint = ref(false)
const showTools = ref(false)
const toolsTab = ref<'reference' | 'periodic'>('reference')
const elementQuery = ref('')
const selectedElement = ref<ChemicalElement | null>(null)
const answerInput = ref<HTMLInputElement | null>(null)

// This context will come from the selected quiz package once My Quizzes exists.
// It keeps subject tools separate from the generic quiz engine.
const activeQuiz = { id: 'chm-1045c-exam-1', subject: 'chemistry', title: 'CHM 1045C Exam 1' } as const
const topicGroups = computed(() => {
  const groups: Record<string, typeof concepts[number][]> = {}
  concepts.forEach(c => (groups[c[2]] ||= []).push(c))
  return groups
})
const masteryPercent = computed(() => Math.round(Object.values(mastery.value).reduce((sum, x) => sum + x.score, 0) / concepts.length))
const modeTitle = computed(() => ({ learn: 'Learn mode', exam: 'Practice test', weak: 'Weak topics', grind: 'Quick grind' })[mode.value])
const sessionTarget = computed(() => ({ learn: 25, exam: 50, weak: 20, grind: 0 })[mode.value])
const questionPosition = computed(() => mode.value === 'exam' ? examIndex.value + 1 : sessionRecords.value.length + (recoveryRecordId.value || sessionRecords.value.some(r => r.question.id === current.value?.id) ? 0 : 1))
const progressText = computed(() => sessionTarget.value ? `${Math.min(questionPosition.value, sessionTarget.value)} / ${sessionTarget.value}` : `${sessionRecords.value.length} done`)
const reportRecords = computed(() => activeReport.value?.records || sessionRecords.value)
const auditedRecords = computed(() => reportRecords.value.filter(record => !record.excludedFromAudit))
const firstTryCorrect = computed(() => auditedRecords.value.filter(r => r.firstCorrect).length)
const recoveredCount = computed(() => auditedRecords.value.filter(r => !r.firstCorrect && r.solved).length)
const sessionAccuracy = computed(() => auditedRecords.value.length ? Math.round(firstTryCorrect.value / auditedRecords.value.length * 100) : 0)
const sessionAccuracyLabel = computed(() => auditedRecords.value.length ? String(sessionAccuracy.value) : '—')
const knownCount = computed(() => reportRecords.value.filter(record => record.disposition === 'known').length)
const skippedCount = computed(() => reportRecords.value.filter(record => record.disposition === 'skipped').length)
const earnedPerfectionist = computed(() => reportRecords.value.length > 0 && skippedCount.value === 0 && reportRecords.value.every(record => record.firstCorrect))
const currentAttempts = computed(() => sessionRecords.value.find(r => r.question.id === (recoveryRecordId.value || current.value?.id))?.attempts || 0)
const currentDisposition = computed(() => sessionRecords.value.find(r => r.question.id === (recoveryRecordId.value || current.value?.id))?.disposition)
const selectedDefinition = computed(() => findGlossaryEntry(response.value))
const correctDefinition = computed(() => findGlossaryEntry(current.value?.answer))
const matchingElementNumbers = computed(() => {
  const query = elementQuery.value.trim().toLowerCase()
  if (!query) return new Set(periodicTable.map(element => element.atomicNumber))
  return new Set(periodicTable.filter(element => element.name.toLowerCase().includes(query) || element.symbol.toLowerCase() === query || String(element.atomicNumber) === query).map(element => element.atomicNumber))
})
const reportWeakPoints = computed(() => {
  const counts = new Map<string, number>()
  auditedRecords.value.filter(record => !record.firstCorrect).forEach(record => counts.set(record.question.topic, (counts.get(record.question.topic) || 0) + 1))
  return [...counts.entries()].sort((a, b) => b[1] - a[1])
})
const modeLabels: Record<Mode, string> = { learn: 'Learn Mode', exam: 'Practice Test', weak: 'Weak Topics', grind: 'Quick Grind' }
const formatReportDate = (value: string) => new Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value))
const historicalAccuracy = (report: SessionReport) => {
  const audited = report.records.filter(record => !record.excludedFromAudit)
  return audited.length ? `${Math.round(audited.filter(record => record.firstCorrect).length / audited.length * 100)}%` : '—'
}

function generateFor(id: ConceptId) { return generateQuestion(id) }
function weightedConcept(): ConceptId {
  let candidates = concepts
  if (mode.value === 'weak') {
    const weak = concepts.filter(([id]) => mastery.value[id].score < 67 || mastery.value[id].wrong > 0)
    if (weak.length) candidates = weak as typeof concepts
  }
  if (mode.value === 'grind') return pick(candidates)[0]
  const pool = candidates.flatMap(c => Array(Math.max(1, 6 - Math.floor(mastery.value[c[0]].score / 20))).fill(c[0]))
  return pick(pool) as ConceptId
}
function nextQuestion() {
  submitted.value = false
  response.value = ''
  showHint.value = false
  recoveryRecordId.value = null
  let q: Question
  let tries = 0
  do { q = generateFor(weightedConcept()); tries++ } while (recentIds.value.includes(q.conceptId) && tries < 5)
  current.value = q
  recentIds.value = [...recentIds.value.slice(-3), q.conceptId]
  nextTick(() => answerInput.value?.focus())
  persistSession()
}
function buildPracticeTest(count: number) {
  const ids: ConceptId[] = []
  while (ids.length < count) ids.push(...shuffle(concepts.map(c => c[0])))
  return ids.slice(0, count).map(generateFor)
}
function start(selected: Mode) {
  mode.value = selected
  screen.value = 'quiz'
  examIndex.value = 0
  sessionRecords.value = []
  activeReport.value = null
  recoveryRecordId.value = null
  if (selected === 'exam') {
    examQuestions.value = buildPracticeTest(50)
    current.value = examQuestions.value[0]
    submitted.value = false
    response.value = ''
    persistSession()
  } else nextQuestion()
}
function normalize(v: string) { return v.trim().toLowerCase().replace(/,/g, '') }
function check(q: Question, value: string) {
  if (typeof q.answer === 'number') {
    const parsed = Number(value.replace(/×\s*10\^?/i, 'e').replace(/\s/g, ''))
    return Number.isFinite(parsed) && Math.abs(parsed - q.answer) <= (q.tolerance ?? .001)
  }
  return normalize(value) === normalize(q.answer)
}
function submit() {
  if (!current.value || !response.value || submitted.value) return
  wasCorrect.value = check(current.value, response.value)
  submitted.value = true
  let record = sessionRecords.value.find(r => r.question.id === (recoveryRecordId.value || current.value!.id))
  const isFirstAttempt = !record
  if (!record) {
    record = { question: current.value, attempts: 0, firstCorrect: wasCorrect.value, solved: false, firstResponse: response.value, retryResponses: [], disposition: 'answered' }
    sessionRecords.value.push(record)
  } else {
    record.retryResponses ||= []
    record.retryResponses.push(response.value)
  }
  record.attempts++
  if (wasCorrect.value) record.solved = true

  // Only the first answer changes scored accuracy and mastery. Retries remain visible
  // in the session report without rewriting the student's original result.
  if (isFirstAttempt) {
    stats.value.attempted++
    const m = mastery.value[current.value.conceptId]
    if (wasCorrect.value) {
      stats.value.correct++
      m.correct++
      m.score = Math.min(100, m.score + (m.score >= 67 ? 11 : 34))
    } else {
      m.wrong++
      m.score = Math.max(0, m.score - 25)
    }
  }
  persist()
  persistSession()
}
function markKnown() {
  if (!current.value || submitted.value) return
  const m = mastery.value[current.value.conceptId]
  const record: AttemptRecord = {
    question: current.value, attempts: 0, firstCorrect: true, solved: true,
    firstResponse: 'Marked “I know this”', retryResponses: [], excludedFromAudit: true,
    disposition: 'known', masteryBefore: m.score,
  }
  sessionRecords.value.push(record)
  stats.value.attempted++
  stats.value.correct++
  m.correct++
  m.score = Math.min(100, m.score + (m.score >= 67 ? 11 : 34))
  response.value = String(current.value.answer)
  wasCorrect.value = true
  submitted.value = true
  persist()
  persistSession()
}
function skipQuestion() {
  if (!current.value || submitted.value) return
  sessionRecords.value.push({
    question: current.value, attempts: 0, firstCorrect: false, solved: false,
    firstResponse: 'Skipped', retryResponses: [], excludedFromAudit: true, disposition: 'skipped',
  })
  persistSession()
  advanceQuestion()
}
function reconsiderKnown(useFreshVariant = false) {
  if (!current.value || currentDisposition.value !== 'known') return
  const recordIndex = sessionRecords.value.findIndex(record => record.question.id === current.value!.id)
  const record = sessionRecords.value[recordIndex]
  if (!record) return
  const m = mastery.value[current.value.conceptId]
  m.score = record.masteryBefore ?? Math.max(0, m.score - 34)
  m.correct = Math.max(0, m.correct - 1)
  stats.value.attempted = Math.max(0, stats.value.attempted - 1)
  stats.value.correct = Math.max(0, stats.value.correct - 1)
  sessionRecords.value.splice(recordIndex, 1)
  if (useFreshVariant) {
    const original = current.value
    const candidates = Array.from({ length: 10 }, () => generateFor(original.conceptId as ConceptId))
    current.value = candidates.find(candidate => candidate.prompt !== original.prompt) || candidates[0]!
  }
  response.value = ''
  wasCorrect.value = false
  submitted.value = false
  showHint.value = false
  persist()
  persistSession()
  nextTick(() => answerInput.value?.focus())
}
function retryQuestion() {
  if (!current.value) return
  const previousQuestion = current.value
  const previousResponse = response.value
  recoveryRecordId.value ||= previousQuestion.id

  // Generate several same-concept candidates so a retry exercises transfer,
  // not short-term recall of the answer that was just displayed.
  const candidates = Array.from({ length: 12 }, () => generateFor(previousQuestion.conceptId as ConceptId))
  const replacement = (candidates.find(candidate =>
    candidate.prompt !== previousQuestion.prompt
      && normalize(String(candidate.answer)) !== normalize(String(previousQuestion.answer))
      && normalize(String(candidate.answer)) !== normalize(previousResponse),
  ) || candidates.find(candidate => candidate.prompt !== previousQuestion.prompt) || candidates[0])!

  if (replacement.choices) {
    const distractorPool = candidates
      .flatMap(candidate => candidate.choices || [])
      .map(choice => choice.value)
      .filter(value => normalize(value) !== normalize(String(replacement.answer)) && normalize(value) !== normalize(previousResponse))
      .filter((value, index, values) => values.findIndex(other => normalize(other) === normalize(value)) === index)
    if (distractorPool.length >= 3) replacement.choices = choice(String(replacement.answer), shuffle(distractorPool).slice(0, 3))
    else replacement.choices = shuffle(replacement.choices)
  }

  current.value = replacement
  submitted.value = false
  wasCorrect.value = false
  response.value = ''
  showHint.value = false
  nextTick(() => answerInput.value?.focus())
  persistSession()
}
function advanceQuestion() {
  if (sessionTarget.value && sessionRecords.value.length >= sessionTarget.value) return finishSession()
  if (mode.value === 'exam') {
    examIndex.value++
    current.value = examQuestions.value[examIndex.value]
    recoveryRecordId.value = null
    submitted.value = false
    response.value = ''
    showHint.value = false
    nextTick(() => answerInput.value?.focus())
    persistSession()
  } else nextQuestion()
}
function finishSession() {
  if (!sessionRecords.value.length) return goHome()
  persist()
  const report: SessionReport = {
    id: `report-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    quizId: activeQuiz.id,
    quizTitle: activeQuiz.title,
    mode: mode.value,
    completedAt: new Date().toISOString(),
    records: createPersistenceSnapshot(sessionRecords.value),
  }
  activeReport.value = report
  reportHistory.value = [report, ...reportHistory.value]
  persistReports()
  localStorage.removeItem('chem-grind-active-session')
  resumeAvailable.value = false
  screen.value = 'summary'
}
function persistReports() {
  let reports = [...reportHistory.value]
  while (reports.length) {
    try {
      localStorage.setItem('quiz-taker-reports-v1', JSON.stringify(reports))
      reportHistory.value = reports
      return
    } catch {
      reports = reports.slice(0, -1)
    }
  }
}
function openReport(report: SessionReport) {
  activeReport.value = report
  screen.value = 'summary'
}
function printReport() { window.print() }
function resetProgress() {
  if (!confirm('Reset all mastery, statistics, and answer history?')) return
  mastery.value = freshMastery()
  stats.value = { attempted: 0, correct: 0 }
  localStorage.removeItem('chem-grind-progress')
  localStorage.removeItem('chem-grind-active-session')
  resumeAvailable.value = false
}
function persist() {
  localStorage.setItem('chem-grind-progress', JSON.stringify({ mastery: mastery.value, stats: stats.value }))
}
function persistSession() {
  if (screen.value !== 'quiz' || !current.value) return
  localStorage.setItem('chem-grind-active-session', JSON.stringify({
    mode: mode.value, current: current.value, examQuestions: examQuestions.value,
    examIndex: examIndex.value, sessionRecords: sessionRecords.value,
    recoveryRecordId: recoveryRecordId.value,
    submitted: submitted.value, wasCorrect: wasCorrect.value, response: response.value,
  }))
  resumeAvailable.value = true
}
function resumeSession() {
  const saved = localStorage.getItem('chem-grind-active-session')
  if (!saved) return
  try {
    const data = JSON.parse(saved)
    mode.value = data.mode
    current.value = data.current
    examQuestions.value = data.examQuestions || []
    examIndex.value = data.examIndex || 0
    sessionRecords.value = (data.sessionRecords || []).map((record: Partial<AttemptRecord>) => ({
      ...record,
      firstResponse: record.firstResponse || 'Not recorded in this earlier session',
      retryResponses: record.retryResponses || [],
    }))
    recoveryRecordId.value = data.recoveryRecordId || null
    submitted.value = Boolean(data.submitted)
    wasCorrect.value = Boolean(data.wasCorrect)
    response.value = data.response || ''
    screen.value = 'quiz'
    nextTick(() => answerInput.value?.focus())
  } catch {
    localStorage.removeItem('chem-grind-active-session')
    resumeAvailable.value = false
  }
}
function goHome() {
  persistSession()
  screen.value = 'home'
  current.value = null
}
function handleKey(e: KeyboardEvent) {
  if (e.key === 'Escape' && showTools.value) { showTools.value = false; return }
  if (showTools.value) return
  if (e.key === 'Enter' && screen.value === 'quiz') {
    if (submitted.value) wasCorrect.value ? advanceQuestion() : retryQuestion()
    else submit()
  }
}

onMounted(() => {
  const saved = localStorage.getItem('chem-grind-progress')
  if (saved) {
    try {
      const data = JSON.parse(saved)
      mastery.value = { ...freshMastery(), ...data.mastery }
      stats.value = { ...stats.value, ...data.stats }
    } catch { /* ignore corrupted progress */ }
  }
  const savedReports = localStorage.getItem('quiz-taker-reports-v1')
  if (savedReports) {
    try { reportHistory.value = JSON.parse(savedReports) } catch { localStorage.removeItem('quiz-taker-reports-v1') }
  }
  resumeAvailable.value = Boolean(localStorage.getItem('chem-grind-active-session'))
  window.addEventListener('keydown', handleKey)
})
watch(screen, persist)

  return {
    mode,
    screen,
    mastery,
    stats,
    current,
    response,
    submitted,
    wasCorrect,
    examQuestions,
    examIndex,
    sessionRecords,
    recoveryRecordId,
    resumeAvailable,
    reportHistory,
    activeReport,
    recentIds,
    showHint,
    showTools,
    toolsTab,
    elementQuery,
    selectedElement,
    answerInput,
    activeQuiz,
    topicGroups,
    masteryPercent,
    modeTitle,
    sessionTarget,
    questionPosition,
    progressText,
    reportRecords,
    auditedRecords,
    firstTryCorrect,
    recoveredCount,
    sessionAccuracy,
    sessionAccuracyLabel,
    knownCount,
    skippedCount,
    earnedPerfectionist,
    currentAttempts,
    currentDisposition,
    selectedDefinition,
    correctDefinition,
    matchingElementNumbers,
    reportWeakPoints,
    modeLabels,
    concepts,
    conversionFactors,
    periodicTable,
    elementCategories,
    formatReportDate,
    historicalAccuracy,
    start,
    submit,
    markKnown,
    skipQuestion,
    reconsiderKnown,
    retryQuestion,
    advanceQuestion,
    finishSession,
    openReport,
    printReport,
    resetProgress,
    resumeSession,
    goHome
  }
}

export type QuizEngine = ReturnType<typeof useQuizEngine>
