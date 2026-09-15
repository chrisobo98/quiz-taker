<script setup lang="ts">
import { useQuizEngineContext } from '../../composables/quizEngineContext'
const { activeReport, modeLabels, sessionAccuracyLabel, auditedRecords, sessionAccuracy, firstTryCorrect, knownCount, skippedCount, recoveredCount, earnedPerfectionist, reportWeakPoints, reportRecords, formatReportDate, printReport, start, goHome } = useQuizEngineContext()
</script>

<template>
<main class="summary">
      <div class="summary-card">
        <div class="report-heading"><div><AppEyebrow>SESSION REPORT · FIRST ATTEMPTS</AppEyebrow><p v-if="activeReport">{{ activeReport.quizTitle }} · {{ modeLabels[activeReport.mode] }} · {{ formatReportDate(activeReport.completedAt) }}</p></div><button class="print-button" @click="printReport">Print / Save PDF</button></div>
        <h1>{{ sessionAccuracyLabel }}<small v-if="auditedRecords.length">%</small></h1>
        <h2>{{ !auditedRecords.length ? 'No audited answers this session.' : sessionAccuracy >= 80 ? 'Strong first-pass accuracy.' : 'Now we know what to hit.' }}</h2>
        <p>{{ firstTryCorrect }} of {{ auditedRecords.length }} audited questions correct on the first try · {{ knownCount }} marked known · {{ skippedCount }} skipped.</p>
        <div class="report-metrics">
          <div><strong>{{ firstTryCorrect }}</strong><span>First-try correct</span></div>
          <div><strong>{{ auditedRecords.length - firstTryCorrect }}</strong><span>First-try misses</span></div>
          <div><strong>{{ recoveredCount }}</strong><span>Recovered</span></div>
          <div><strong>{{ knownCount }}</strong><span>Marked known</span></div>
          <div><strong>{{ skippedCount }}</strong><span>Skipped</span></div>
        </div>
        <div v-if="earnedPerfectionist" class="achievement"><span>◆</span><div><small>ACHIEVEMENT UNLOCKED</small><strong>Perfectionist</strong><p>Every question was correct or responsibly marked known, with nothing skipped.</p></div></div>
        <section v-if="reportWeakPoints.length" class="weak-summary">
          <h3>Weak points from first attempts</h3>
          <div><span v-for="point in reportWeakPoints" :key="point[0]">{{ point[0] }} <b>{{ point[1] }} miss{{ point[1] === 1 ? '' : 'es' }}</b></span></div>
        </section>
        <section class="detailed-review">
          <h3>Question review</h3>
          <article v-for="(record, index) in reportRecords" :key="record.question.id" :class="record.disposition === 'skipped' ? 'skipped' : record.firstCorrect ? 'pass' : 'fail'">
            <header><b>{{ record.disposition === 'skipped' ? '—' : record.disposition === 'known' ? '◆' : record.firstCorrect ? '✓' : '×' }}</b><span>Question {{ index + 1 }} · {{ record.question.topic }}</span><small>{{ record.disposition === 'known' ? 'Marked known · excluded from audit' : record.disposition === 'skipped' ? 'Skipped · excluded from audit' : record.firstCorrect ? 'Correct first try' : record.solved ? `Recovered in ${record.attempts} attempts` : 'Needs review' }}</small></header>
            <h4>{{ record.question.prompt }}</h4>
            <div class="answer-lines"><p><span>Your first answer</span><b>{{ record.firstResponse || 'Not recorded' }} {{ record.question.unit }}</b></p><p><span>Correct answer</span><b>{{ record.question.answer }} {{ record.question.unit }}</b></p></div>
            <p class="report-explanation">{{ record.question.explanation }}</p>
            <p v-if="record.retryResponses?.length" class="retry-trail"><span>Retry answers</span> {{ record.retryResponses.join(' → ') }}</p>
          </article>
        </section>
        <div class="report-actions">
          <button class="primary big" @click="start('weak')">Practice weak topics <span>→</span></button>
          <button class="text-button" @click="goHome">Back to dashboard</button>
        </div>
      </div>
    </main>
</template>
