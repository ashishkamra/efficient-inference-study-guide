import { createFileRoute, Link } from "@tanstack/react-router";
import { AlertTriangle, ArrowRight, Mic, Printer, Sigma } from "lucide-react";
import { formulas, lessonById, oralPrompts, traps } from "@/lib/course";

export const Route = createFileRoute("/review")({
  head: () => ({
    meta: [
      { title: "Review sheet · Ridge" },
      {
        name: "description",
        content:
          "One-page review for the Efficient LLM Inference area exam: formulas, common traps, and oral-exam prompts with answer sketches.",
      },
    ],
  }),
  component: ReviewPage,
});

function ReviewPage() {
  return (
    <div className="mx-auto max-w-4xl">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-copper-deep">
            Reference · exam week
          </p>
          <h1 className="mt-2 font-serif text-4xl sm:text-5xl">The one-page version</h1>
          <p className="mt-3 max-w-2xl text-lg text-muted">
            The formulas to be able to write cold, the traps that cost marks, and oral prompts with
            answer sketches. Every item links back to the lesson that supports it.
          </p>
        </div>
        <button
          type="button"
          onClick={() => window.print()}
          className="inline-flex min-h-11 items-center gap-2 rounded-full border border-line bg-card px-4 text-sm font-semibold"
        >
          <Printer aria-hidden className="size-4" />
          Print
        </button>
      </div>

      <nav aria-label="Review sections" className="mt-6 flex flex-wrap gap-2 text-sm">
        <a
          href="#formulas"
          className="inline-flex min-h-10 items-center gap-2 rounded-full border border-line bg-card px-4 font-semibold"
        >
          <Sigma aria-hidden className="size-4 text-copper-deep" />
          Formulas
        </a>
        <a
          href="#traps"
          className="inline-flex min-h-10 items-center gap-2 rounded-full border border-line bg-card px-4 font-semibold"
        >
          <AlertTriangle aria-hidden className="size-4 text-copper-deep" />
          Common traps
        </a>
        <a
          href="#oral"
          className="inline-flex min-h-10 items-center gap-2 rounded-full border border-line bg-card px-4 font-semibold"
        >
          <Mic aria-hidden className="size-4 text-copper-deep" />
          Oral prompts
        </a>
      </nav>

      <section id="formulas" className="mt-10 scroll-mt-24">
        <h2 className="font-serif text-3xl">Formulas</h2>
        <p className="mt-2 text-sm text-muted">
          Write the expression first, then say which term a technique moves. A formula with no
          interpretation is half a mark.
        </p>
        <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
          {formulas.map((formula) => {
            const lesson = lessonById(formula.lessonId);
            return (
              <article key={formula.name} className="min-w-0 rounded-card border border-line bg-card p-4">
                <h3 className="font-semibold">{formula.name}</h3>
                <pre className="mt-2 max-w-full whitespace-pre-wrap break-words rounded-xl bg-paper-2/70 px-3 py-3 font-mono text-sm leading-relaxed">
                  {formula.expr}
                </pre>
                <p className="mt-2 text-sm text-muted">{formula.note}</p>
                {lesson ? (
                  <Link
                    to="/lesson/$id"
                    params={{ id: lesson.id }}
                    className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-copper-deep"
                  >
                    Lesson {lesson.numeral}
                    <ArrowRight aria-hidden className="size-3.5" />
                  </Link>
                ) : null}
              </article>
            );
          })}
        </div>
      </section>

      <section id="traps" className="mt-12 scroll-mt-24">
        <h2 className="font-serif text-3xl">Common traps</h2>
        <p className="mt-2 text-sm text-muted">
          Each item states the wrong sentence first, then the correction. Read them as flashcards.
        </p>
        <ol className="mt-4 space-y-3">
          {traps.map((item) => {
            const lesson = lessonById(item.lessonId);
            return (
              <li key={item.trap} className="rounded-card border border-line bg-card p-4">
                <p className="flex items-start gap-2 font-semibold">
                  <AlertTriangle aria-hidden className="mt-0.5 size-4 shrink-0 text-copper-deep" />
                  <span>{item.trap}</span>
                </p>
                <p className="mt-2 pl-6 text-sm text-muted">{item.fix}</p>
                {lesson ? (
                  <Link
                    to="/lesson/$id"
                    params={{ id: lesson.id }}
                    className="mt-2 ml-6 inline-flex items-center gap-1 text-xs font-semibold text-copper-deep"
                  >
                    Review lesson {lesson.numeral}: {lesson.title}
                    <ArrowRight aria-hidden className="size-3.5" />
                  </Link>
                ) : null}
              </li>
            );
          })}
        </ol>
      </section>

      <section id="oral" className="mt-12 scroll-mt-24">
        <h2 className="font-serif text-3xl">Oral prompts</h2>
        <p className="mt-2 text-sm text-muted">
          Say the answer out loud before opening the sketch. The sketch is a skeleton, not a script.
        </p>
        <ol className="mt-4 space-y-3">
          {oralPrompts.map((item, i) => {
            const lesson = lessonById(item.lessonId);
            return (
              <li key={item.prompt} className="rounded-card border border-line bg-card">
                <details>
                  <summary className="flex cursor-pointer items-start gap-3 px-4 py-4 font-semibold">
                    <span className="mt-0.5 font-mono text-xs text-copper-deep">
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    <span className="flex-1">{item.prompt}</span>
                  </summary>
                  <div className="border-t border-line px-4 py-4">
                    <p className="text-sm text-muted">{item.sketch}</p>
                    {lesson ? (
                      <Link
                        to="/lesson/$id"
                        params={{ id: lesson.id }}
                        className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-copper-deep"
                      >
                        Lesson {lesson.numeral}: {lesson.title}
                        <ArrowRight aria-hidden className="size-3.5" />
                      </Link>
                    ) : null}
                  </div>
                </details>
              </li>
            );
          })}
        </ol>
      </section>
    </div>
  );
}
