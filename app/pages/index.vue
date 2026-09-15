<script setup lang="ts">
import { provideQuizEngine } from "../composables/quizEngineContext";
import { useQuizEngine } from "../composables/useQuizEngine";
provideQuizEngine(useQuizEngine());
</script>

<template><QuizTakerTemplate /></template>
