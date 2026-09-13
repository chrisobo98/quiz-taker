# Quiz Taker

> Adaptive practice that turns course material into measurable mastery.

[![Nuxt](https://img.shields.io/badge/Nuxt-4-00DC82?logo=nuxtdotjs&logoColor=white)](https://nuxt.com/)
[![Vue](https://img.shields.io/badge/Vue-3-42B883?logo=vuedotjs&logoColor=white)](https://vuejs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-enabled-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Status](https://img.shields.io/badge/status-prototype-E5B84E)](#product-status)

Quiz Taker is a browser-based adaptive practice platform. It presents one focused question at a time, scores the learner’s first response, permits retry-based recovery, and uses concept-level performance to bring weak material back more often.

The current content package is **CHM 1045C Exam 1**. Chemistry is the first validated use case, not the product boundary. The intended platform supports multiple subjects, courses, quizzes, and source-grounded question banks.

## Product status

The repository currently contains a working local-first prototype with:

- 25-question adaptive learning sessions
- 50-question practice tests
- 20-question weak-topic sessions
- Endless quick-grind practice
- Immediate answer feedback and retry tracking
- First-attempt accuracy that retries cannot overwrite
- Concept-level mastery and weak-topic weighting
- Generated particle diagrams
- An in-session reference-tools panel
- Complete active-session persistence in `localStorage`
- A session report separating first-try success, misses, and recovered questions

No account, server, database, or external AI call is required for the current experience.

## Product principles

1. **First attempts are the honest metric.** A learner may retry until the method clicks, but retries never rewrite the original result.
2. **Feedback should resolve the misconception.** A wrong answer explains the correct concept and, where available, contrasts it with the selected term.
3. **Master concepts, not sentences.** Alternate wording and randomized values reduce answer memorization.
4. **Source material is authoritative.** Generated questions should remain inside the uploaded material’s scope and terminology.
5. **Practice begins immediately.** Product architecture should not delay a usable learning loop.

## Technology

| Layer | Choice | Responsibility |
| --- | --- | --- |
| Application | Nuxt 4 | Build, server rendering, routing foundation |
| UI | Vue 3 Composition API | Reactive quiz and report experience |
| Language | TypeScript | Typed questions, diagrams, glossary, and attempts |
| Persistence | Browser `localStorage` | Mastery, lifetime statistics, and resumable sessions |
| Content | Local, template-generated bank | Course-grounded prompts and randomized calculations |

## Architecture

```text
Course source package
        │
        ▼
Question templates ─── conceptId ─── Mastery engine
        │                                  │
        ├── generated values               ├── adaptive weighting
        ├── visual particle models         └── weak-topic selection
        └── answer choices
                 │
                 ▼
          Attempt recorder
          ├── first answer (scored)
          └── retries (recovery only)
                 │
                 ▼
       Contrastive feedback + report
                 │
                 ▼
             localStorage
```

Important current files:

- `app/app.vue` — quiz engine, current chemistry templates, modes, reports, and interface
- `app/data/studyGlossary.ts` — subject-agnostic glossary contract and current chemistry definitions
- `course-materials/` — source documents used to validate the current question bank
- `RELEASE_NOTES.md` — implemented changes by release

The question engine and content still share `app/app.vue`. That is acceptable for the deadline-driven prototype, but content should move into versioned quiz packages before multiple quizzes are introduced.

## Local development

Requirements:

- Node.js 20 or newer
- npm 10 or newer

Install and start:

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

Production verification:

```bash
npm run build
npm run preview
```

## Local data

The prototype uses two browser keys:

| Key | Contents |
| --- | --- |
| `chem-grind-progress` | Concept mastery, lifetime correct/attempted totals, streaks |
| `chem-grind-active-session` | Mode, generated questions, current position, submitted state, first attempts, retries |

This schema is intentionally local-first. Before authentication or cloud sync, the keys should be migrated to product-neutral names and given explicit schema versions.

## Content authority for CHM 1045C Exam 1

When sources overlap, content follows this priority:

1. Professor Exam 1 study guide
2. Course learning objectives
3. Professor practice packets and answer keys
4. Supplemental study guides and reference tables

The app should not add adjacent General Chemistry topics merely because they are commonly taught elsewhere.

## Roadmap

### Quiz library

- Introduce **My Quizzes** with separate cards and progress for Exam 1, Exam 2, and other courses.
- Replace chemistry-specific storage keys with versioned user/library schemas.
- Package each quiz’s metadata, concepts, templates, glossary, source citations, and validation status independently.

### Create a quiz

- Add a guided upload flow for PDF, DOCX, slide, image, and pasted-note sources.
- Let the creator declare course, test scope, source priority, question count, allowed tools, and desired difficulty.
- Extract learning objectives and propose a concept map before generating questions.
- Require source-grounded answers and preserve traceability back to supplied material.
- Support manual authoring and editing alongside AI-assisted generation.

### Multi-subject generation

- Keep the question renderer subject-neutral.
- Add content adapters for numerical work, timelines, vocabulary, diagrams, passages, and multi-step reasoning.
- Generate a typed glossary for contrastive feedback in every subject—not only chemistry.
- Validate generated questions for duplicate wording, answer ambiguity, unsupported scope, and calculation correctness.

### Platform capabilities

- Accounts and cross-device synchronization
- Quiz sharing and instructor-managed collections
- Accessible keyboard and screen-reader workflows
- Import review, source citations, and question approval queues
- Analytics by quiz, concept, first attempt, recovery, and retention over time

## Product decisions and constraints

- **Do not treat retry success as first-pass mastery.** It produces misleading reports and weakens adaptive targeting.
- **Do not generate questions without source traceability.** Fluent but unsupported questions are worse than incomplete coverage.
- **Do not design the platform around chemistry-specific rendering.** Particle models are one visual type within a general question schema.
- **Do not add an AI runtime dependency to the answering experience.** Generation may occur during quiz creation; taking a saved quiz should remain fast and deterministic.
- **Do not introduce accounts before the quiz-package and persistence schemas are versioned.** Otherwise migration work will be unnecessarily risky.

## Quality checks

Before shipping a change:

```bash
npm run build
git diff --check
```

For content changes, additionally verify:

- Every question has a valid `conceptId`.
- Every choice set contains exactly one defensible answer.
- Numerical tolerances accept correctly rounded answers without accepting materially wrong work.
- Alternate wording preserves the scientific or factual claim.
- No question exceeds the authority of its source package.

## Contributing

Keep changes narrow and testable. UI work should preserve first-attempt scoring and resumability. Content work should identify its source package and validation authority. Larger platform changes should update the roadmap and release notes alongside implementation.
