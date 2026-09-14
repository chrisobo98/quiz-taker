# Release Notes

## Unreleased

### Added

- Typed, reusable glossary data for misconception-aware feedback.
- Contrastive wrong-answer feedback defining both the correct concept and the learner’s selected concept when available.
- Complete 118-element periodic table with atomic number, symbol, name, atomic mass, group, period, category coloring, search, and element detail views.
- Touch-friendly floating Tools control beside the active quiz.
- Chemistry-aware tool tabs that establish the subject-tool pattern for future quiz packages.
- Same-concept retry generation that replaces the revealed question with a fresh variant.
- Retry-specific distractor regeneration that reshuffles choices and avoids the learner’s previous wrong selection when enough valid alternatives exist.
- Product documentation covering architecture, persistence, content authority, quality controls, and the multi-subject roadmap.

### Changed

- Wrong answers now provide the reasoning needed to distinguish closely related concepts while preserving retry and first-attempt metrics.
- Increased selected-element details, category legend, and periodic-table reference-note typography for readability at 100% zoom.
- Retry attempts now exercise concept transfer with new wording or numerical values while remaining attached to the original scored miss.

## 0.3.0 — Resumable practice sessions

### Added

- Full active-session persistence through browser `localStorage`.
- Dashboard action for resuming the exact saved question and attempt state.
- Session reports for every finite practice mode.
- Separate first-try correct, first-try miss, and recovered-question metrics.

### Changed

- Practice Test expanded from 25 to 50 questions.
- Learn Mode standardized at 25 questions and Weak Topics at 20 questions.
- Header score replaced with visible session progress and a defined finish line.
- Retry answers no longer overwrite first-attempt accuracy or concept mastery.

## 0.2.0 — Course-grounded content audit

### Added

- Course-material audit against the professor study guide, objectives, Unit 2/3 packets, answer keys, and supplemental guides.
- Coverage for measurement uncertainty, accuracy and precision, multistep significant figures, state transitions, mixture separation, conservation of mass, nomenclature, and formula reasoning.
- Generated particle-model questions with a dedicated mastery concept.
- In-session Tools panel with metric prefixes, equations, unit-cancellation guidance, and metric-English conversion factors.

### Changed

- Temperature conversions aligned with the course reference equation `K = °C + 273`.
- Scientist questions narrowed to supported course figures and evidence.
- Dimensional-analysis questions expanded to area, volume, chained, metric, and English conversions.

### Removed

- Unsupported Fahrenheit, Millikan, and Chadwick question variants.

## 0.1.0 — Initial adaptive prototype

### Added

- Nuxt/Vue browser application with Learn, Exam, Weak Topics, and Quick Grind modes.
- Concept-level mastery weighting, immediate grading, explanations, streaks, and local progress.
- Static and randomized CHM 1045C Exam 1 question templates.
