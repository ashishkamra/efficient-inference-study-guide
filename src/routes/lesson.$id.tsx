import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  Check,
  CheckCircle2,
  Clock,
  FlaskConical,
  ListChecks,
  Play,
  RotateCcw,
  XCircle,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import {
  glossary,
  glossaryLessonIds,
  glossarySlug,
  lessonById,
  lessonStudy,
  lessons,
  neighbors,
  SOURCE,
  type Section,
} from "@/lib/course";
import { useProgress } from "@/lib/progress";
import { assetUrl } from "@/lib/asset-url";
import { cn } from "@/lib/cn";

export const Route = createFileRoute("/lesson/$id")({
  head: ({ params }) => {
    const lesson = lessonById(params.id);
    return {
      meta: [
        { title: `${lesson?.title ?? "Lesson"} · Ridge` },
        { name: "description", content: lesson?.summary ?? "A lesson in the Ridge study guide." },
      ],
    };
  },
  component: LessonPage,
  notFoundComponent: () => (
    <div className="mx-auto max-w-lg py-16 text-center">
      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-copper-deep">404</p>
      <h1 className="mt-2 font-serif text-4xl">No lesson here</h1>
      <p className="mt-3 text-muted">That lesson id is not part of the path.</p>
      <Link to="/" className="mt-6 inline-flex min-h-11 items-center rounded-full bg-ink px-5 text-sm font-semibold text-paper">
        Back to the path
      </Link>
    </div>
  ),
});

type Mode = "watch" | "read" | "practice";

function slug(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function LessonPage() {
  const { id } = Route.useParams();
  const lesson = lessonById(id);
  const [mode, setMode] = useState<Mode>(lesson?.video ? "watch" : "read");
  const completeIds = useProgress((s) => s.complete);
  const complete = lesson ? completeIds.includes(lesson.id) : false;
  const completeLesson = useProgress((s) => s.completeLesson);
  const toggleLesson = useProgress((s) => s.toggleLesson);
  const checks = useProgress((s) => s.checks);
  const answer = useProgress((s) => s.answerCheck);
  const resetCheck = useProgress((s) => s.resetCheck);
  const setLastLesson = useProgress((s) => s.setLastLesson);
  const savedVideoTime = useProgress((s) => s.videoProgress[id] ?? 0);
  const setVideoProgress = useProgress((s) => s.setVideoProgress);
  const videoRef = useRef<HTMLVideoElement>(null);
  const lastSaved = useRef(0);
  const [readerScale, setReaderScale] = useState(1);

  useEffect(() => {
    try {
      const stored = Number(localStorage.getItem("ridge-reader-scale"));
      if (Number.isFinite(stored) && stored >= 0.9 && stored <= 1.35) setReaderScale(stored);
    } catch {
      // A blocked storage API leaves the default size.
    }
  }, []);

  function changeReaderScale(delta: number) {
    const next = Math.min(1.35, Math.max(0.9, Math.round((readerScale + delta) * 100) / 100));
    setReaderScale(next);
    try {
      localStorage.setItem("ridge-reader-scale", String(next));
    } catch {
      // Size still applies for this session.
    }
  }

  useEffect(() => {
    setLastLesson(id);
  }, [id, setLastLesson]);

  useEffect(() => {
    setMode(lesson?.video ? "watch" : "read");
  }, [lesson?.id, lesson?.video]);

  if (!lesson) throw notFound();

  const { prev, next } = neighbors(lesson.id);
  const index = lessons.findIndex((l) => l.id === lesson.id);
  const answered = lesson.checks.filter((c) => checks[c.id] !== undefined).length;
  const study = lessonStudy[lesson.id];
  const keyTerms = glossary.filter((g) => (glossaryLessonIds[g.term] ?? []).includes(lesson.id));

  const modes: { id: Mode; label: string; icon: typeof Play }[] = [
    ...(lesson.video ? [{ id: "watch" as const, label: "Watch", icon: Play }] : []),
    { id: "read", label: "Read", icon: BookOpen },
    { id: "practice", label: "Practice", icon: ListChecks },
  ];

  return (
    <article className="grid gap-10 lg:grid-cols-[minmax(0,46rem)_16rem]">
      <div className="min-w-0">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-copper-deep">
          Lesson {lesson.numeral} · {lesson.kicker}
        </p>
        <h1 className="mt-2 font-serif text-4xl leading-[1.08] sm:text-5xl">{lesson.title}</h1>
        <p className="mt-4 text-lg text-muted">{lesson.summary}</p>

        <dl className="mt-5 flex flex-wrap gap-x-6 gap-y-2 text-sm text-muted">
          <div className="flex items-center gap-1.5">
            <Clock aria-hidden className="size-4" />
            <dt className="sr-only">Estimated time</dt>
            <dd>{lesson.minutes} min</dd>
          </div>
          <div className="flex items-center gap-1.5">
            <ListChecks aria-hidden className="size-4" />
            <dt className="sr-only">Checks</dt>
            <dd>{lesson.checks.length} checks</dd>
          </div>
          {lesson.lab ? (
            <div className="flex items-center gap-1.5">
              <FlaskConical aria-hidden className="size-4" />
              <dt className="sr-only">Lab</dt>
              <dd>
                <Link to="/labs" hash={lesson.lab.href.split("#")[1]} className="underline decoration-line underline-offset-4 hover:text-ink">
                  {lesson.lab.label}
                </Link>
              </dd>
            </div>
          ) : null}
          {study ? (
            <div className="flex items-center gap-1.5">
              <BookOpen aria-hidden className="size-4" />
              <dt className="sr-only">Survey reference</dt>
              <dd>{study.survey}</dd>
            </div>
          ) : null}
        </dl>

        <div
          role="tablist"
          aria-label="Lesson mode"
          className="mt-7 flex flex-wrap gap-1 rounded-full border border-line bg-card p-1"
        >
          {modes.map((m) => {
            const Icon = m.icon;
            const active = mode === m.id;
            return (
              <button
                key={m.id}
                type="button"
                role="tab"
                id={`tab-${m.id}`}
                aria-selected={active}
                aria-controls={`panel-${m.id}`}
                onClick={() => setMode(m.id)}
                className={cn(
                  "inline-flex min-h-10 flex-1 items-center justify-center gap-2 rounded-full px-4 text-sm font-semibold sm:flex-none",
                  active ? "bg-ink text-paper" : "text-muted hover:bg-paper-2 hover:text-ink",
                )}
              >
                <Icon aria-hidden className="size-4" />
                {m.label}
              </button>
            );
          })}
        </div>

        {mode === "watch" ? (
          <section id="panel-watch" role="tabpanel" aria-labelledby="tab-watch" className="mt-6">
            {lesson.video ? (
              <figure className="overflow-hidden rounded-card border border-line bg-ink">
                <video
                  key={lesson.video.src}
                  ref={videoRef}
                  className="aspect-video w-full bg-ink"
                  controls
                  playsInline
                  preload="metadata"
                  poster={assetUrl(lesson.video.src.replace(/\.mp4/, ".jpg"))}
                  src={assetUrl(lesson.video.src)}
                  onLoadedMetadata={(event) => {
                    const video = event.currentTarget;
                    if (savedVideoTime > 2 && savedVideoTime < video.duration - 2) {
                      video.currentTime = savedVideoTime;
                    }
                  }}
                  onTimeUpdate={(event) => {
                    const video = event.currentTarget;
                    if (Math.abs(video.currentTime - lastSaved.current) < 5) return;
                    lastSaved.current = video.currentTime;
                    setVideoProgress(lesson.id, video.currentTime);
                  }}
                />
                <figcaption className="space-y-3 bg-card px-4 py-4 sm:px-5">
                  <p className="font-semibold">{lesson.video.title}</p>
                  <p className="text-sm text-muted">{lesson.video.caption}</p>
                  <details>
                    <summary className="cursor-pointer text-sm font-semibold">Lecture outline</summary>
                    <ol className="mt-3 space-y-2 text-sm">
                      {lesson.video.transcript.map((line, i) => (
                        <li key={i} className="grid grid-cols-[1.5rem_1fr] gap-2">
                          <span className="font-mono text-xs text-copper-deep">{i + 1}</span>
                          <span>{line}</span>
                        </li>
                      ))}
                    </ol>
                  </details>
                </figcaption>
              </figure>
            ) : (
              <p className="rounded-card border border-line bg-card p-5 text-muted">
                This lesson has no narrated lecture. Switch to Read for the notes.
              </p>
            )}
          </section>
        ) : null}

        {mode === "read" ? (
          <section id="panel-read" role="tabpanel" aria-labelledby="tab-read" className="mt-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 className="font-serif text-2xl">Written notes</h2>
              <div className="flex flex-wrap items-center gap-2">
                <div
                  role="group"
                  aria-label="Reader text size"
                  className="flex items-center gap-1 rounded-full border border-line bg-card px-1"
                >
                  <button
                    type="button"
                    onClick={() => changeReaderScale(-0.05)}
                    disabled={readerScale <= 0.9}
                    aria-label="Decrease text size"
                    className="inline-flex min-h-9 min-w-9 items-center justify-center rounded-full text-sm font-semibold disabled:opacity-40"
                  >
                    A−
                  </button>
                  <button
                    type="button"
                    onClick={() => setReaderScale(1)}
                    aria-label="Reset text size to 100 percent"
                    className="min-h-9 min-w-12 rounded-full text-xs font-semibold tabular text-muted hover:text-ink"
                  >
                    {Math.round(readerScale * 100)}%
                  </button>
                  <button
                    type="button"
                    onClick={() => changeReaderScale(0.05)}
                    disabled={readerScale >= 1.35}
                    aria-label="Increase text size"
                    className="inline-flex min-h-9 min-w-9 items-center justify-center rounded-full text-sm font-semibold disabled:opacity-40"
                  >
                    A+
                  </button>
                </div>
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="inline-flex min-h-10 items-center gap-2 rounded-full border border-line bg-card px-4 text-sm font-semibold"
                >
                  <BookOpen aria-hidden className="size-4" />
                  Print notes
                </button>
              </div>
            </div>

            {study ? (
              <section
                aria-labelledby="objectives-heading"
                className="mt-4 rounded-card border border-line bg-card px-4 py-4"
              >
                <h2
                  id="objectives-heading"
                  className="text-xs font-semibold uppercase tracking-[0.14em] text-muted"
                >
                  After this lesson you can
                </h2>
                <ul className="mt-2 space-y-2 text-sm">
                  {study.objectives.map((objective) => (
                    <li key={objective} className="grid grid-cols-[0.6rem_1fr] gap-3">
                      <span className="mt-2 size-1.5 rounded-full bg-copper" />
                      <span>{objective}</span>
                    </li>
                  ))}
                </ul>
              </section>
            ) : null}

            <nav aria-label="On this page" className="mt-4 rounded-card border border-line bg-card px-4 py-4">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted">On this page</p>
              <ol className="mt-2 space-y-1 text-sm">
                {lesson.sections.map((section, i) => (
                  <li key={section.heading}>
                    <a
                      href={`#${slug(section.heading)}-${i}`}
                      className="text-ink/80 underline decoration-line underline-offset-4 hover:text-ink"
                    >
                      {section.heading}
                    </a>
                  </li>
                ))}
              </ol>
            </nav>

            <div
              className="mt-8 space-y-10"
              style={{ fontSize: `${(1.0625 * readerScale).toFixed(3)}rem` }}
            >
              {lesson.sections.map((section, i) => (
                <NoteSection key={section.heading} section={section} index={i} />
              ))}
            </div>

            {study ? (
              <section
                aria-labelledby="takeaways-heading"
                className="mt-8 rounded-card border border-line bg-warn-soft/50 px-4 py-4"
              >
                <h2 id="takeaways-heading" className="font-serif text-2xl">
                  Takeaways
                </h2>
                <ul className="mt-3 space-y-2 text-sm">
                  {study.takeaways.map((takeaway) => (
                    <li key={takeaway} className="flex gap-2">
                      <Check aria-hidden className="mt-0.5 size-4 shrink-0 text-moss" />
                      <span>{takeaway}</span>
                    </li>
                  ))}
                </ul>
              </section>
            ) : null}

            {keyTerms.length > 0 ? (
              <section aria-labelledby="terms-heading" className="mt-4 rounded-card border border-line bg-card px-4 py-4">
                <h2 id="terms-heading" className="text-xs font-semibold uppercase tracking-[0.14em] text-muted">
                  Key terms
                </h2>
                <ul className="mt-3 flex flex-wrap gap-2">
                  {keyTerms.map((entry) => (
                    <li key={entry.term}>
                      <Link
                        to="/glossary"
                        hash={glossarySlug(entry.term)}
                        className="inline-flex min-h-9 items-center rounded-full border border-line bg-paper px-3 text-sm font-medium hover:border-ink/30 hover:text-ink"
                      >
                        {entry.term}
                      </Link>
                    </li>
                  ))}
                </ul>
              </section>
            ) : null}

            <div className="mt-8 flex flex-wrap gap-3">
              <button
                type="button"
                onClick={() => setMode("practice")}
                className="inline-flex min-h-11 items-center gap-2 rounded-full bg-copper px-5 text-sm font-semibold text-card"
              >
                <ListChecks aria-hidden className="size-4" />
                Practice this lesson
              </button>
            </div>
          </section>
        ) : null}

        {mode === "practice" ? (
          <section id="panel-practice" role="tabpanel" aria-labelledby="tab-practice" className="mt-6">
            <div className="flex flex-wrap items-baseline justify-between gap-3">
              <h2 className="font-serif text-3xl">Check yourself</h2>
              <p className="text-sm text-muted">
                {answered} of {lesson.checks.length} answered
              </p>
            </div>
            <div className="mt-4 space-y-5">
              {lesson.checks.map((c) => {
                const chosen = checks[c.id]?.choice;
                const revealed = chosen !== undefined;
                const isCorrect = chosen === c.answer;
                return (
                  <fieldset key={c.id} className="rounded-card border border-line bg-card p-4">
                    <legend className="px-1 font-semibold">{c.prompt}</legend>
                    <div className="mt-3 space-y-2">
                      {c.options.map((opt, i) => {
                        const selected = chosen === i;
                        const correct = i === c.answer;
                        return (
                          <button
                            key={opt}
                            type="button"
                            aria-pressed={selected}
                            onClick={() => answer(c.id, i, i === c.answer)}
                            className={cn(
                              "flex w-full items-start gap-3 rounded-xl border px-3 py-3 text-left text-sm",
                              !revealed && "border-line hover:border-ink/30",
                              revealed && selected && correct && "border-moss bg-moss-soft",
                              revealed && selected && !correct && "border-copper bg-warn-soft",
                              revealed && !selected && correct && "border-moss",
                              revealed && !selected && !correct && "border-line opacity-70",
                            )}
                          >
                            <span className="mt-0.5 font-mono text-xs text-muted">{String.fromCharCode(65 + i)}</span>
                            <span>{opt}</span>
                          </button>
                        );
                      })}
                    </div>
                    {revealed ? (
                      <div role="status" aria-live="polite" className="mt-4 rounded-xl bg-paper px-3 py-3">
                        <p
                          className={cn(
                            "flex items-center gap-2 text-sm font-semibold",
                            isCorrect ? "text-moss" : "text-copper-deep",
                          )}
                        >
                          {isCorrect ? (
                            <CheckCircle2 aria-hidden className="size-4" />
                          ) : (
                            <XCircle aria-hidden className="size-4" />
                          )}
                          {isCorrect ? "Correct" : "Not quite"}
                        </p>
                        <p className="mt-1 text-sm text-muted">{c.why}</p>
                        <button
                          type="button"
                          onClick={() => resetCheck(c.id)}
                          className="mt-2 inline-flex items-center gap-1.5 text-xs font-semibold text-copper-deep"
                        >
                          <RotateCcw aria-hidden className="size-3.5" />
                          Try again
                        </button>
                      </div>
                    ) : null}
                  </fieldset>
                );
              })}
            </div>

            {lesson.lab ? (
              <Link
                to="/labs"
                hash={lesson.lab.href.split("#")[1]}
                className="mt-6 flex items-center gap-3 rounded-card border border-line bg-card px-4 py-4"
              >
                <FlaskConical aria-hidden className="size-5 text-copper-deep" />
                <span>
                  <span className="block text-xs font-semibold uppercase tracking-[0.12em] text-muted">Lab</span>
                  <span className="font-semibold">{lesson.lab.label}</span>
                </span>
                <ArrowRight aria-hidden className="ml-auto size-4" />
              </Link>
            ) : null}
          </section>
        ) : null}

        <section aria-labelledby="sources-heading" className="mt-10 rounded-card border border-line bg-card px-4 py-4 sm:px-5">
          <h2 id="sources-heading" className="font-serif text-2xl">
            Sources and further reading
          </h2>
          <ul className="mt-3 space-y-2 text-sm text-ink/90">
            {lesson.papers.map((p) => (
              <li key={p} className="flex gap-2">
                <span aria-hidden className="mt-2 size-1.5 shrink-0 rounded-full bg-copper" />
                <span>{p}</span>
              </li>
            ))}
          </ul>
          <a
            href={SOURCE.url}
            target="_blank"
            rel="noreferrer"
            className="mt-4 inline-flex text-sm font-semibold text-copper-deep underline decoration-line underline-offset-4"
          >
            Read the full survey PDF
          </a>
        </section>

        <div className="mt-8 flex flex-wrap items-center gap-3">
          <button
            type="button"
            aria-pressed={complete}
            onClick={() => toggleLesson(lesson.id)}
            className={cn(
              "inline-flex min-h-11 items-center gap-2 rounded-full px-5 text-sm font-semibold",
              complete ? "bg-moss text-card" : "bg-ink text-paper",
            )}
          >
            <Check aria-hidden className="size-4" />
            {complete ? "Completed · undo" : "Mark complete"}
          </button>
          {next ? (
            <Link
              to="/lesson/$id"
              params={{ id: next.id }}
              onClick={() => {
                if (!complete) completeLesson(lesson.id);
              }}
              className="inline-flex min-h-11 items-center gap-2 rounded-full bg-copper px-5 text-sm font-semibold text-card"
            >
              Next lesson
              <ArrowRight aria-hidden className="size-4" />
            </Link>
          ) : (
            <Link
              to="/exam"
              onClick={() => {
                if (!complete) completeLesson(lesson.id);
              }}
              className="inline-flex min-h-11 items-center gap-2 rounded-full bg-copper px-5 text-sm font-semibold text-card"
            >
              Take the exam
              <ArrowRight aria-hidden className="size-4" />
            </Link>
          )}
        </div>

        <nav aria-label="Lesson navigation" className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-line pt-5">
          {prev ? (
            <Link
              to="/lesson/$id"
              params={{ id: prev.id }}
              className="inline-flex min-h-11 items-center gap-1 text-sm font-semibold text-copper-deep"
            >
              <ArrowLeft aria-hidden className="size-4" />
              <span>
                <span className="block text-xs font-normal text-muted">Previous</span>
                {prev.title}
              </span>
            </Link>
          ) : (
            <span />
          )}
          {next ? (
            <Link
              to="/lesson/$id"
              params={{ id: next.id }}
              className="inline-flex min-h-11 items-center gap-1 text-right text-sm font-semibold text-copper-deep"
            >
              <span>
                <span className="block text-xs font-normal text-muted">Next</span>
                {next.title}
              </span>
              <ArrowRight aria-hidden className="size-4" />
            </Link>
          ) : (
            <Link to="/exam" className="inline-flex min-h-11 items-center gap-1 text-sm font-semibold text-copper-deep">
              Take the exam
              <ArrowRight aria-hidden className="size-4" />
            </Link>
          )}
        </nav>

        <p className="mt-10 text-xs leading-relaxed text-muted">
          Companion notes to {SOURCE.author}, <em>{SOURCE.title}</em>, {SOURCE.affiliation}{" "}
          {SOURCE.kind.toLowerCase()} ({SOURCE.date}). Not a substitute for the paper.
        </p>
      </div>

      <aside className="hidden lg:block">
        <div className="sticky top-24 space-y-5">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted">
            {index + 1} of {lessons.length}
          </p>
          <ul className="space-y-1">
            {lessons.map((l) => {
              const done = completeIds.includes(l.id);
              return (
                <li key={l.id}>
                  <Link
                    to="/lesson/$id"
                    params={{ id: l.id }}
                    className={cn(
                      "flex items-start gap-2 rounded-lg px-2 py-1.5 text-sm",
                      l.id === lesson.id ? "bg-ink text-paper" : "text-muted hover:bg-paper-2 hover:text-ink",
                    )}
                  >
                    <span className="mt-0.5 font-mono text-xs opacity-70">
                      {done ? <Check aria-label="Completed" className="size-3.5" /> : l.numeral}
                    </span>
                    <span>{l.title}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
          <div className="rounded-card border border-line bg-card px-3 py-3">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted">Lesson facts</p>
            <ul className="mt-2 space-y-1 text-sm text-ink/90">
              <li>{lesson.minutes} min estimated</li>
              <li>{lesson.checks.length} practice checks</li>
              <li>{lesson.lab ? "Includes a lab" : "No lab"}</li>
            </ul>
          </div>
          {prev ? (
            <Link
              to="/lesson/$id"
              params={{ id: prev.id }}
              className="inline-flex items-center gap-1 text-sm font-semibold text-copper-deep"
            >
              <ArrowLeft aria-hidden className="size-4" />
              {prev.title}
            </Link>
          ) : null}
        </div>
      </aside>
    </article>
  );
}

function NoteSection({ section, index }: { section: Section; index: number }) {
  const id = `${slug(section.heading)}-${index}`;
  return (
    <section id={id} className="scroll-mt-24">
      <h2 className="font-serif text-3xl">{section.heading}</h2>
      {section.paragraphs.map((p, i) => (
        <p key={i} className="mt-3 text-ink/90">
          {p}
        </p>
      ))}
      {section.figure ? (
        <figure className="mt-5 overflow-hidden rounded-card border border-line bg-card">
          <a
            href={assetUrl(section.figure.src)}
            target="_blank"
            rel="noreferrer"
            aria-label={`Open full-size figure: ${section.figure.alt}`}
            className="block overflow-x-auto bg-paper-2/40"
          >
            <img
              src={assetUrl(section.figure.src)}
              alt={section.figure.alt}
              loading="lazy"
              className="w-full min-w-[36rem]"
            />
          </a>
          <figcaption className="border-t border-line px-4 py-3 text-sm text-muted">
            {section.figure.caption}
          </figcaption>
        </figure>
      ) : null}
      {section.table ? (
        <div className="mt-5 overflow-x-auto rounded-card border border-line">
          <table className="w-full border-collapse text-left text-sm">
            <thead>
              <tr className="bg-ink text-paper">
                {section.table.columns.map((column) => (
                  <th key={column} scope="col" className="whitespace-nowrap px-4 py-2.5 font-semibold">
                    {column}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {section.table.rows.map((row, rowIndex) => (
                <tr key={rowIndex} className={rowIndex % 2 === 0 ? "bg-card" : "bg-paper-2/40"}>
                  {row.map((cell, cellIndex) => (
                    <td key={cellIndex} className="border-t border-line px-4 py-2.5 align-top">
                      {cell}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
          {section.table.caption ? (
            <p className="border-t border-line bg-card px-4 py-2.5 text-sm text-muted">{section.table.caption}</p>
          ) : null}
        </div>
      ) : null}
      {section.formula ? (
        <div className="mt-4 overflow-x-auto rounded-card border border-line bg-paper-2/70 px-4 py-4">
          <pre className="font-mono text-sm leading-relaxed text-ink">{section.formula.expr}</pre>
          <p className="mt-2 text-sm text-muted">{section.formula.caption}</p>
        </div>
      ) : null}
      {section.bullets ? (
        <ul className="mt-4 space-y-2">
          {section.bullets.map((b, i) => (
            <li key={i} className="grid grid-cols-[0.6rem_1fr] gap-3 text-ink/90">
              <span className="mt-2 size-1.5 rounded-full bg-copper" />
              <span>{b}</span>
            </li>
          ))}
        </ul>
      ) : null}
      {section.aside ? (
        <aside className="mt-4 rounded-card border border-line bg-warn-soft px-4 py-3">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-copper-deep">{section.aside.kicker}</p>
          <p className="mt-1 text-sm">{section.aside.body}</p>
        </aside>
      ) : null}
    </section>
  );
}
