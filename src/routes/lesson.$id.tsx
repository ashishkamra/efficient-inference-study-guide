import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, ArrowRight, Check, FlaskConical } from "lucide-react";
import { lessonById, lessons, neighbors, SOURCE } from "@/lib/course";
import { useProgress } from "@/lib/progress";
import { cn } from "@/lib/cn";

export const Route = createFileRoute("/lesson/$id")({
  head: ({ params }) => ({
    meta: [{ title: `${lessonById(params.id)?.title ?? "Lesson"} · Ridge` }],
  }),
  component: LessonPage,
});

function LessonPage() {
  const { id } = Route.useParams();
  const lesson = lessonById(id);
  if (!lesson) {
    return (
      <div className="mx-auto max-w-lg py-16 text-center">
        <h1 className="font-serif text-4xl">No lesson here</h1>
        <Link to="/" className="mt-4 inline-flex font-semibold text-copper-deep">
          Back to the path
        </Link>
      </div>
    );
  }
  const { prev, next } = neighbors(lesson.id);
  const index = lessons.findIndex((l) => l.id === lesson.id);
  const complete = useProgress((s) => s.complete.includes(lesson.id));
  const mark = useProgress((s) => s.completeLesson);
  const checks = useProgress((s) => s.checks);
  const answer = useProgress((s) => s.answerCheck);

  return (
    <article className="grid gap-10 lg:grid-cols-[minmax(0,42rem)_16rem]">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-copper-deep">
          Lesson {lesson.numeral} · {lesson.kicker}
        </p>
        <h1 className="mt-2 font-serif text-4xl leading-[1.08] sm:text-5xl">{lesson.title}</h1>
        <p className="mt-4 text-lg text-muted">{lesson.summary}</p>

        {lesson.video ? (
          <figure className="mt-8 overflow-hidden rounded-card border border-line bg-ink">
            <video
              key={lesson.video.src}
              className="aspect-video w-full bg-ink"
              controls
              playsInline
              preload="metadata"
              poster={lesson.video.src.replace(/\.mp4(\?.*)?$/, ".jpg")}
              src={lesson.video.src}
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
        ) : null}

        <details className="mt-8 rounded-card border border-line bg-card px-4 py-4 sm:px-5">
          <summary className="cursor-pointer font-serif text-2xl">Written notes</summary>
          <div className="mt-6 space-y-9">
          {lesson.sections.map((section) => (
            <section key={section.heading}>
              <h2 className="font-serif text-3xl">{section.heading}</h2>
              {section.paragraphs.map((p) => (
                <p key={p.slice(0, 48)} className="mt-3 text-ink/90">
                  {p}
                </p>
              ))}
              {section.formula ? (
                <div className="mt-4 overflow-x-auto rounded-card border border-line bg-paper-2/70 px-4 py-4">
                  <pre className="font-mono text-sm leading-relaxed text-ink">{section.formula.expr}</pre>
                  <p className="mt-2 text-sm text-muted">{section.formula.caption}</p>
                </div>
              ) : null}
              {section.bullets ? (
                <ul className="mt-4 space-y-2">
                  {section.bullets.map((b) => (
                    <li key={b.slice(0, 40)} className="grid grid-cols-[0.6rem_1fr] gap-3 text-ink/90">
                      <span className="mt-2 size-1.5 rounded-full bg-copper" />
                      <span>{b}</span>
                    </li>
                  ))}
                </ul>
              ) : null}
              {section.aside ? (
                <aside className="mt-4 rounded-card border border-line bg-warn-soft px-4 py-3">
                  <p className="text-xs font-semibold uppercase tracking-[0.14em] text-copper-deep">
                    {section.aside.kicker}
                  </p>
                  <p className="mt-1 text-sm">{section.aside.body}</p>
                </aside>
              ) : null}
            </section>
          ))}
          </div>
        </details>

        {lesson.lab ? (
          <Link
            to="/labs"
            hash={lesson.lab.href.split("#")[1]}
            className="mt-8 flex items-center gap-3 rounded-card border border-line bg-card px-4 py-4"
          >
            <FlaskConical aria-hidden className="size-5 text-copper-deep" />
            <span>
              <span className="block text-xs font-semibold uppercase tracking-[0.12em] text-muted">
                Lab
              </span>
              <span className="font-semibold">{lesson.lab.label}</span>
            </span>
            <ArrowRight aria-hidden className="ml-auto size-4" />
          </Link>
        ) : null}

        <section className="mt-10">
          <h2 className="font-serif text-3xl">Check yourself</h2>
          <div className="mt-4 space-y-5">
            {lesson.checks.map((c) => {
              const chosen = checks[c.id];
              const revealed = chosen !== undefined;
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
                          onClick={() => answer(c.id, i)}
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
                  {revealed ? <p className="mt-3 text-sm text-muted">{c.why}</p> : null}
                </fieldset>
              );
            })}
          </div>
        </section>

        <div className="mt-8 flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={() => mark(lesson.id)}
            className={cn(
              "inline-flex min-h-11 items-center gap-2 rounded-full px-5 text-sm font-semibold",
              complete ? "bg-moss text-card" : "bg-ink text-paper",
            )}
          >
            <Check aria-hidden className="size-4" />
            {complete ? "Marked complete" : "Mark complete"}
          </button>
          {next ? (
            <Link
              to="/lesson/$id"
              params={{ id: next.id }}
              onClick={() => mark(lesson.id)}
              className="inline-flex min-h-11 items-center gap-2 rounded-full bg-copper px-5 text-sm font-semibold text-card"
            >
              Next lesson
              <ArrowRight aria-hidden className="size-4" />
            </Link>
          ) : (
            <Link
              to="/exam"
              className="inline-flex min-h-11 items-center gap-2 rounded-full bg-copper px-5 text-sm font-semibold text-card"
            >
              Take the exam
              <ArrowRight aria-hidden className="size-4" />
            </Link>
          )}
        </div>

        <p className="mt-10 text-xs leading-relaxed text-muted">
          Companion notes to {SOURCE.author}, <em>{SOURCE.title}</em>, {SOURCE.affiliation}{" "}
          {SOURCE.kind.toLowerCase()} ({SOURCE.date}). Not a substitute for the paper.
        </p>
      </div>

      <aside className="hidden lg:block">
        <div className="sticky top-24 space-y-4">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted">
            {index + 1} of {lessons.length}
          </p>
          <ul className="space-y-1">
            {lessons.map((l) => (
              <li key={l.id}>
                <Link
                  to="/lesson/$id"
                  params={{ id: l.id }}
                  className={cn(
                    "block rounded-lg px-2 py-1.5 text-sm",
                    l.id === lesson.id ? "bg-ink text-paper" : "text-muted hover:bg-paper-2 hover:text-ink",
                  )}
                >
                  <span className="font-mono text-xs opacity-70">{l.numeral}</span> {l.title}
                </Link>
              </li>
            ))}
          </ul>
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted">Names</p>
            <ul className="mt-2 space-y-2 text-sm text-ink/90">
              {lesson.papers.map((p) => (
                <li key={p}>{p}</li>
              ))}
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
