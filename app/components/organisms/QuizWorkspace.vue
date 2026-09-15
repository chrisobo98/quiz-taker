<script setup lang="ts">
import { useQuizEngineContext } from "../../composables/quizEngineContext";
const {
  current,
  mode,
  examIndex,
  mastery,
  submitted,
  wasCorrect,
  response,
  answerInput,
  currentDisposition,
  currentAttempts,
  correctDefinition,
  selectedDefinition,
  showHint,
  sessionTarget,
  questionPosition,
  modeTitle,
  showTools,
  skipQuestion,
  markKnown,
  reconsiderKnown,
  advanceQuestion,
  submit,
  retryQuestion,
} = useQuizEngineContext();
</script>

<template>
  <main class="quiz-wrap">
    <button
      class="floating-tools"
      @click="showTools = true"
      aria-label="Open chemistry tools"
    >
      <span>⊞</span><b>Tools</b>
    </button>
    <section class="quiz-head">
      <div>
        <div class="kicker"><span /> {{ modeTitle.toUpperCase() }}</div>
        <h1>{{ current.topic }}</h1>
      </div>
      <div v-if="mode === 'exam'" class="exam-progress">
        <span>QUESTION {{ examIndex + 1 }} OF 50</span>
        <div><i :style="{ width: `${(examIndex + 1) * 2}%` }" /></div>
      </div>
      <div v-else class="concept-meter">
        <span>CONCEPT MASTERY</span
        ><b>{{ mastery[current.conceptId].score }}%</b>
        <div>
          <i :style="{ width: mastery[current.conceptId].score + '%' }" />
        </div>
      </div>
    </section>

    <section
      class="question-card"
      :class="{
        correct: submitted && wasCorrect,
        wrong: submitted && !wasCorrect,
      }"
    >
      <div class="question-number">
        {{ mode === "exam" ? String(examIndex + 1).padStart(2, "0") : "•" }}
      </div>
      <div class="question-body">
        <AppEyebrow>{{ current.eyebrow }}</AppEyebrow>
        <h2>{{ current.prompt }}</h2>
        <ParticleDiagram v-if="current.diagram" :diagram="current.diagram" />
        <div v-if="current.choices" class="choices">
          <button
            v-for="(c, i) in current.choices"
            :key="c.value"
            :disabled="submitted"
            :class="{
              selected: response === c.value,
              answer: submitted && c.value === current.answer,
              missed: submitted && response === c.value && !wasCorrect,
            }"
            @click="response = c.value"
          >
            <span>{{ String.fromCharCode(65 + i) }}</span
            ><b>{{ c.label }}</b>
          </button>
        </div>
        <div v-else class="number-answer">
          <label
            ><input
              ref="answerInput"
              v-model="response"
              :disabled="submitted"
              inputmode="decimal"
              autocomplete="off"
              placeholder="Type your answer"
            /><span v-if="current.unit">{{ current.unit }}</span></label
          >
          <small>Scientific notation accepted as 3.5e-4</small>
        </div>

        <div v-if="submitted" class="feedback">
          <div class="feedback-icon">{{ wasCorrect ? "✓" : "×" }}</div>
          <div>
            <strong>{{
              currentDisposition === "known"
                ? "Marked as known — excluded from audit accuracy."
                : wasCorrect
                  ? currentAttempts > 1
                    ? `Correct on attempt ${currentAttempts}.`
                    : "Correct."
                  : currentAttempts > 1
                    ? `Still incorrect — attempt ${currentAttempts}.`
                    : "Incorrect — first result recorded."
            }}</strong>
            <p>{{ current.explanation }}</p>
            <div v-if="!wasCorrect" class="answer-comparison">
              <div class="correct-concept">
                <small>CORRECT ANSWER</small
                ><b>{{ current.answer }} {{ current.unit }}</b
                ><span v-if="correctDefinition">{{
                  correctDefinition.definition
                }}</span>
              </div>
              <div
                v-if="
                  selectedDefinition &&
                  selectedDefinition.id !== correctDefinition?.id
                "
                class="selected-concept"
              >
                <small>YOUR CHOICE</small><b>{{ selectedDefinition.term }}</b
                ><span>{{ selectedDefinition.definition }}</span>
              </div>
            </div>
            <p v-if="!wasCorrect" class="attempt-note">
              Try a fresh version of this concept or move on. Your original
              first-attempt result stays in the report.
            </p>
          </div>
        </div>
        <div v-else-if="showHint && current.hint" class="hint">
          <b>Hint</b> {{ current.hint }}
        </div>

        <div class="actions">
          <div v-if="!submitted" class="self-assessment-actions">
            <button class="plain-action" @click="skipQuestion">Skip</button
            ><button class="plain-action know" @click="markKnown">
              I know this</button
            ><button
              v-if="mode !== 'exam' && current.hint"
              class="plain-action"
              @click="showHint = !showHint"
            >
              {{ showHint ? "Hide hint" : "Hint" }}
            </button>
          </div>
          <div
            v-else-if="currentDisposition === 'known'"
            class="self-assessment-actions"
          >
            <button class="plain-action" @click="reconsiderKnown(false)">
              Change my mind</button
            ><button class="plain-action" @click="advanceQuestion">
              Next question
            </button>
          </div>
          <button
            v-else-if="submitted && !wasCorrect"
            class="secondary"
            @click="advanceQuestion"
          >
            Next question
          </button>
          <span v-else />
          <button
            v-if="!submitted"
            class="primary"
            :disabled="!response"
            @click="submit"
          >
            Check answer <span>→</span>
          </button>
          <button
            v-else-if="currentDisposition === 'known'"
            class="primary retry"
            @click="reconsiderKnown(true)"
          >
            Test with new variant <span>↻</span>
          </button>
          <button
            v-else-if="!wasCorrect"
            class="primary retry"
            @click="retryQuestion"
          >
            Try new variant <span>↻</span>
          </button>
          <button v-else class="primary" @click="advanceQuestion">
            {{
              sessionTarget && questionPosition >= sessionTarget
                ? "Finish & see report"
                : "Next question"
            }}
            <span>→</span>
          </button>
        </div>
      </div>
    </section>
    <p class="key-tip">
      Press <kbd>Enter</kbd> to
      {{
        submitted && !wasCorrect
          ? "retry"
          : submitted
            ? "continue"
            : "check your answer"
      }}
    </p>
  </main>
</template>
