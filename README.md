# Ridge

A study studio for **Efficient LLM Inference: A Survey** (Nguyen, 2026). Ridge turns the
survey into nine spoken lectures with written notes, interactive models, a one-page review
sheet, a glossary, and a mixed practice exam.

The app is a TanStack Start site. Progress is stored in the browser with `localStorage`:
there are no accounts, no server-side profiles, and nothing to sign in to.

## What is inside

- **Nine lessons** in the survey's order: the inference stack, bottlenecks and rooflines,
  the KV cache, architecture, decoding, compression, systems, full-stack synthesis, and the
  open frontiers.
- **Watch / Read / Practice tabs** per lesson. Each lesson carries objectives, written notes,
  takeaways, survey references, narrated video, and at least three checks.
- **Six labs**: KV footprint, prefill-versus-decode timing, an accessible SVG roofline,
  speculative acceptance, paged versus contiguous allocation, and composed compression error.
- **Review sheet** at `/review`: formulas, common traps, and oral-exam prompts with sketches.
- **Glossary** at `/glossary`, with search, deep links, and cross-links back to the lessons
  that teach each term.
- **Exam** at `/exam`: mixed questions, a question navigator, answer review after submission,
  percentage scoring, and attempt history.
- **Command palette** with `Cmd/Ctrl+K`, plus dark mode and a reader text-size control.
- Keyboard navigation, visible focus, reduced-motion support, print styles for notes and the
  review sheet, and a layout that works at mobile width.

## Quick start

Node 22 is required.

```sh
npm install
npm run dev
```

The development server listens on `http://0.0.0.0:8080/`. `startup.sh` probes that port and
restarts the server only when it is not already healthy.

## Scripts

| Script | Purpose |
| --- | --- |
| `npm run dev` | Start Vite with the app environment wrapper on port 8080. |
| `npm run build` | Production build, then best-effort database migration. |
| `npm run preview:restart` | Serve the built output on `127.0.0.1:8081`. |
| `npm run typecheck` | TypeScript with no emit. |
| `npm run lint` | ESLint over the repository. |
| `npm test` | Script tests plus the app-data, auth, preview-path, and course-content suites. |
| `npm run format` | Prettier write. |

There is no test watcher; run `npm test` directly. The content suite lives in
`src/lib/course.test.ts` and runs under Node's type-stripping flag, like the other TypeScript
tests.

## Content model

All study content lives in `src/lib/course.ts`:

| Export | Shape | Used by |
| --- | --- | --- |
| `lessons` | `Lesson[]` with sections, video, papers, checks | Home list, lesson pages, search |
| `lessonStudy` | Objectives, takeaways, and survey reference per lesson id | Lesson Read tab |
| `exam` | `Check[]` with a `lessonId` per question | Exam page and review links |
| `glossary` | `{ term, def }[]` | Glossary page and palette |
| `glossaryLessonIds` | `Record<term, lessonId[]>` | Glossary cross-links |
| `formulas` | Review formulas with a source lesson | Review sheet |
| `traps` | Wrong sentence plus correction | Review sheet |
| `oralPrompts` | Prompt plus answer sketch | Review sheet |

`lessonStudy` must cover every lesson, `glossaryLessonIds` must cover every glossary term,
and every check, formula, trap, and oral prompt must point at a real lesson. The content
suite enforces those invariants, along with unique ids, unique glossary anchors, and valid
answer indices. Add content in `course.ts` and the test will tell you what is missing.

Glossary anchors are derived by `glossarySlug()`; keep new terms unique after slugging.

## Design and accessibility

The visual system is defined once in `src/styles.css` with CSS custom properties for paper,
ink, copper, moss, and line colors. Dark mode overrides the same tokens under `.dark`; an
inline bootstrap in `src/routes/__root.tsx` applies the stored theme before first paint.

There is no charting dependency. The roofline is a hand-built SVG with a title and
description for screen readers, so the production bundle does not carry a chart runtime.
Sliders are native range inputs inside labelled fields, feedback uses `role="status"`, and
the exam moves focus to its result heading after submission.

## Quality checks

Before shipping a change:

```sh
npm run typecheck
npm run lint
npm test
npm run build
npm run preview:restart
```

Then exercise the app in a browser at both desktop and mobile widths. The important flows are
the lesson tabs, a practice answer and its feedback, the labs' sliders and reset buttons, an
exam submission and retake, glossary search, the review sheet, dark mode, and the command
palette. `screenshots/` is for local QA captures and is not part of the app bundle.

## Deployment

The production target is Vercel. `vercel.json` installs with `--omit=dev`, so anything needed
at build or runtime must be a regular dependency. Database environment variables are injected
by the platform; a build without `DATABASE_URL` skips the migration step and uses the local
PGlite fallback. This app does not use the database or auth routes.

Generated output (`.vercel/`, build caches, preview logs) is ignored by Git. `public/` is the
only directory whose files are served as static assets.

## Layout

```text
src/
  components/       app shell, labs, command palette, theme toggle
  lib/              course content, teaching models, progress store, utilities
  routes/           home, lesson, labs, review, glossary, exam
  styles.css        design tokens, dark mode, print rules
scripts/            app environment, preview, QA, content/video tooling
public/             favicon, share card, lecture videos
```
