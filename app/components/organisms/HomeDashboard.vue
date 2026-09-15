<script setup lang="ts">
import { useQuizEngineContext } from '../../composables/quizEngineContext'
const { masteryPercent, stats, concepts, resumeAvailable, topicGroups, mastery, reportHistory, modeLabels, historicalAccuracy, formatReportDate, start, resumeSession, resetProgress, openReport } = useQuizEngineContext()
</script>

<template>
<main class="home">
      <section class="hero">
        <div class="hero-copy">
          <div class="kicker"><span /> CHM 1045C · EXAM 1</div>
          <h1>Less rereading.<br><em>More reps.</em></h1>
          <p>An adaptive chemistry grinder that brings back what you miss—until it sticks.</p>
          <div class="hero-actions">
            <button class="primary big" @click="start('learn')">Start 25-question session <span>→</span></button>
            <button v-if="resumeAvailable" class="resume-button" @click="resumeSession"><b>Resume saved session</b><small>Your exact question and attempts are saved</small></button>
          </div>
        </div>
        <div class="mastery-card">
          <div class="ring" :style="{ '--progress': `${masteryPercent * 3.6}deg` }">
            <div><strong>{{ masteryPercent }}%</strong><span>mastered</span></div>
          </div>
          <div class="mastery-copy">
            <small>OVERALL PROGRESS</small>
            <h2>{{ masteryPercent ? 'Keep the momentum.' : 'Ready when you are.' }}</h2>
            <p>{{ stats.attempted }} questions answered across {{ concepts.length }} concepts.</p>
          </div>
          <div class="molecule one" /><div class="molecule two" />
        </div>
      </section>

      <section class="mode-section">
        <div class="section-heading"><div><span>CHOOSE YOUR SESSION</span><h2>How do you want to practice?</h2></div><p>Your progress saves automatically in this browser.</p></div>
        <div class="mode-grid">
          <button class="mode-card featured" @click="start('learn')">
            <span class="tag">RECOMMENDED</span><span class="mode-icon">↗</span>
            <h3>Learn mode</h3><p>Adaptive practice that targets weak concepts and fades mastered ones.</p>
            <footer><span>25 questions</span><b>Start →</b></footer>
          </button>
          <button class="mode-card" @click="start('exam')">
            <span class="mode-icon">50</span><h3>Practice test</h3><p>A full 50-question mixed test with immediate results and first-attempt scoring.</p>
            <footer><span>50 questions</span><b>Begin →</b></footer>
          </button>
          <button class="mode-card" @click="start('weak')">
            <span class="mode-icon">◎</span><h3>Weak topics</h3><p>Focus your time on concepts with misses or low mastery.</p>
            <footer><span>20 questions</span><b>Target →</b></footer>
          </button>
          <button class="mode-card dark" @click="start('grind')">
            <span class="mode-icon">∞</span><h3>Quick grind</h3><p>Endless, fast mixed questions with immediate feedback.</p>
            <footer><span>No finish line</span><b>Grind →</b></footer>
          </button>
        </div>
      </section>

      <section class="topics">
        <div class="section-heading"><div><span>YOUR CONCEPT MAP</span><h2>Mastery by topic</h2></div><button class="text-button" @click="resetProgress">Reset progress</button></div>
        <div class="topic-grid">
          <article v-for="(items, group) in topicGroups" :key="group">
            <h3>{{ group }}</h3>
            <div v-for="item in items" :key="item[0]" class="concept-row">
              <div><span>{{ item[1] }}</span><small>{{ mastery[item[0]].correct }} right · {{ mastery[item[0]].wrong }} missed</small></div>
              <MasteryProgress :value="mastery[item[0]].score" />
              <b>{{ mastery[item[0]].score }}%</b>
            </div>
          </article>
        </div>
      </section>
      <section class="report-history">
        <div class="section-heading"><div><span>SAVED LOCALLY</span><h2>Previous reports</h2></div><p>Completed sessions stay on this device while browser storage is available.</p></div>
        <div v-if="reportHistory.length" class="report-history-grid">
          <button v-for="report in reportHistory" :key="report.id" @click="openReport(report)">
            <span>{{ modeLabels[report.mode] }}</span>
            <strong>{{ historicalAccuracy(report) }}</strong>
            <small>{{ formatReportDate(report.completedAt) }} · {{ report.records.length }} questions</small>
            <b>Review report →</b>
          </button>
        </div>
        <div v-else class="empty-reports"><b>No saved reports yet.</b><span>Your next completed or ended session will appear here automatically.</span></div>
      </section>
    </main>
</template>
