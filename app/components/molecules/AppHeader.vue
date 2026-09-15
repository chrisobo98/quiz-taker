<script setup lang="ts">
import { useQuizEngineContext } from '../../composables/quizEngineContext'
const { screen, progressText, masteryPercent, showTools, finishSession, goHome } = useQuizEngineContext()
</script>

<template>
<header class="topbar">
      <button class="brand" @click="goHome" aria-label="Go home">
        <span class="brand-mark">Q</span>
        <span>CHEM <b>GRIND</b></span>
      </button>
      <nav v-if="screen !== 'home'" class="session-stats">
        <span><i class="dot teal" /> Progress <b>{{ progressText }}</b></span>
        <span><i class="dot gold" /> Mastery <b>{{ masteryPercent }}%</b></span>
      </nav>
      <button class="tools-button" @click="showTools = true"><span>⊞</span> Tools</button>
      <button v-if="screen === 'quiz'" class="exit-button" @click="finishSession">End session</button>
      <button v-else-if="screen !== 'home'" class="exit-button" @click="goHome">Exit report</button>
    </header>
</template>

