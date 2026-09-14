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
- Same-concept retry variants with regenerated values, prompts, and distractors
- First-attempt accuracy that retries cannot overwrite
- Concept-level mastery and weak-topic weighting
- Generated particle diagrams
- An in-session reference-tools panel
- A complete searchable periodic table available from a floating chemistry-tools control
- Complete active-session persistence in `localStorage`
- A session report separating first-try success, misses, and recovered questions
- A locally saved report history with full question-level review and storage-pressure fallback
- Responsible self-assessment controls for skipping or marking known material outside audit accuracy
- A Perfectionist achievement for completing a session without misses or skips
- Print-optimized reports that can be printed or saved as PDF with no export dependency

No account, server, database, or external AI call is required for the current experience. That remains valuable for instant practice and offline use, but local-only storage cannot make a learner's reports available on another device.

## Product principles

1. **First attempts are the honest metric.** A learner may retry until the method clicks, but retries never rewrite the original result.
2. **Trust responsible learners.** Learners may skip or mark familiar material as known; those decisions remain visible in reports and do not distort audited accuracy.
3. **Feedback should resolve the misconception.** A wrong answer explains the correct concept and, where available, contrasts it with the selected term.
4. **Master concepts, not sentences.** Alternate wording and randomized values reduce answer memorization.
5. **Source material is authoritative.** Generated questions should remain inside the uploaded material’s scope and terminology.
6. **Practice begins immediately.** Product architecture should not delay a usable learning loop.

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
- `app/data/periodicTable.ts` — typed periodic-table dataset and chemistry category metadata
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
| `chem-grind-progress` | Concept mastery and lifetime correct/attempted totals |
| `chem-grind-active-session` | Mode, generated questions, current position, submitted state, first attempts, retries |
| `quiz-taker-reports-v1` | Versioned completed-session reports, original answers, retry trails, and question explanations |

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

### Contextual study tools

- Register tools by quiz subject instead of placing subject logic in the generic renderer.
- Keep the periodic table, chemistry equations, and conversion references available for chemistry quizzes.
- Provide subject-appropriate equivalents for other quiz packages, such as timelines, formula sheets, maps, calculators, vocabulary references, or approved source excerpts.
- Allow quiz creators to decide which registered tools are permitted during practice and test simulations.

### Platform capabilities

- Quiz sharing and instructor-managed collections
- Accessible keyboard and screen-reader workflows
- Import review, source citations, and question approval queues
- Analytics by quiz, concept, first attempt, recovery, and retention over time

### Accounts and cross-device continuity

The next persistence milestone should be **optional Supabase accounts and cross-device synchronization**. A student should be able to start a practice test on a laptop, continue it on a phone or tablet, and later review or print the same detailed report from any signed-in device.

This solves a real limitation of the current prototype: `localStorage` belongs to one browser profile on one device. Signing into Chrome, Safari, or Firefox does not give an ordinary website a portable database. Chrome does provide synchronized storage to browser extensions, but Quiz Taker is a web application, the extension store is quota-limited, and tying study history to one browser vendor would be the wrong product boundary.

The recommended architecture is **local-first with Supabase backup and sync**:

- Keep the quiz-taking loop local and immediate. Answer selection, grading, retries, and question navigation must never wait for the network.
- Let students use the app without an account. Present sign-in as the way to back up progress and continue on another device, not as a gate before studying.
- Offer low-friction Supabase Auth methods such as email magic link and Google sign-in.
- Store durable user data in Supabase Postgres: quiz-library membership, concept mastery, active sessions, completed reports, achievements, and sync metadata.
- Protect every user-owned table with Row Level Security so authenticated users can access only rows belonging to their own user ID.
- Continue caching the current session locally for offline use and crash recovery, then synchronize mutations when connectivity returns.
- Preserve immutable first-attempt facts. Sync must never convert a retry, “I know this,” or skip into an audited first-try success.
- Use stable UUIDs, `schema_version`, `created_at`, `updated_at`, and a client-generated mutation ID so repeated uploads are idempotent instead of creating duplicate reports.
- Treat completed reports as immutable snapshots. If the same active session changes on two devices, merge append-only attempt events where possible and ask the learner which session to keep when the histories truly conflict.
- Show sync state plainly: saved on this device, syncing, synced, offline, or action required. Never imply cloud backup before the server confirms it.
- On first sign-in, offer to attach existing local quizzes, mastery, active sessions, and reports to the new account. Do not silently discard or overwrite either side.
- Provide export and account deletion controls. Study history belongs to the learner.

A practical initial cloud schema would separate `profiles`, `quiz_packages`, `user_quizzes`, `mastery`, `practice_sessions`, and append-only `attempts`. Completed report views should be derived from session data or stored as versioned snapshots for faithful historical printing. Large uploaded source files belong in object storage; their metadata and ownership belong in Postgres.

Roll this out in stages:

1. Version the existing local quiz, session, mastery, and report schemas and replace chemistry-specific storage keys.
2. Introduce a persistence interface so quiz code reads and writes through one contract rather than calling `localStorage` directly.
3. Add Supabase Auth and user-owned tables with tested Row Level Security policies.
4. Build one-time local-data migration, background sync, offline queueing, conflict handling, and visible sync status.
5. Add cross-device resume and report history before synchronizing source uploads or collaborative quiz libraries.
6. Test account deletion, sign-out behavior, duplicate prevention, offline recovery, and two-device conflicts before calling cloud sync production-ready.

Supabase Realtime is optional rather than foundational here. Normal database synchronization when the app opens, resumes, completes a question, or finishes a session is enough for the first release. Realtime becomes useful later for instructor dashboards or genuinely simultaneous use; it should not add a permanent connection to a quiz experience that is currently fast and quiet.

## Product decisions and constraints

- **Do not treat retry success as first-pass mastery.** It produces misleading reports and weakens adaptive targeting.
- **Do not generate questions without source traceability.** Fluent but unsupported questions are worse than incomplete coverage.
- **Do not design the platform around chemistry-specific rendering.** Particle models are one visual type within a general question schema.
- **Do not add an AI runtime dependency to the answering experience.** Generation may occur during quiz creation; taking a saved quiz should remain fast and deterministic.
- **Do not introduce accounts before the quiz-package and persistence schemas are versioned.** Otherwise migration work will be unnecessarily risky.
- **Do not replace local persistence with network-dependent persistence.** Cloud accounts should add backup and continuity without making the answering loop slower or breaking offline study.

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
