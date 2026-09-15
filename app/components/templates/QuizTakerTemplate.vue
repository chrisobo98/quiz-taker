<script setup lang="ts">
import { useQuizEngineContext } from '../../composables/quizEngineContext'
const { screen, current } = useQuizEngineContext()
</script>

<template>
  <div class="app-shell"><AppHeader /><HomeDashboard v-if="screen === 'home'" /><QuizWorkspace v-else-if="screen === 'quiz' && current" /><SessionReport v-else /><StudyToolsModal /></div>
</template>

