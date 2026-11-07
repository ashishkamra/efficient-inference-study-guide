import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, ArrowRight, Check, RotateCcw, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { exam, lessonById } from "@/lib/course";
import { useProgress } from "@/lib/progress";
import { cn } from "@/lib/cn";

export const Route = createFileRoute("/exam")({
  head: () => ({
    meta: [
      { title: "Exam · Ridge" },
      {
        name: "description",
        content: "A mixed exam over the four pillars, the roofline, and the KV-cache stack.",
      },
    ],
  }),
  component: ExamPage,
});

function ExamPage() {
  const answers = useProgress((s) => s.exam);
  const submitted = useProgress((s) => s.examSubmitted);
  const attempts = useProgress((s) => s.examAttempts);
  const answer = useProgress((s) => s.answerExam);
  const submit = useProgress((s) => s.submitExam);
  const reset = useProgress((s) => s.resetExam);
  const [cursor, setCursor] = useState(0);
  const headingRef = useRef<HTMLHeadingElement>(null);

  const q = exam[cursor];
  const score = exam.filter((item) => answers[item.id] === item.answer).length;
  const answered = exam.filter((item) => answers[item.id] !== undefined).length;
  const pct = exam.length ? Math.round((answered / exam.length) * 100) : 0;
  const scorePct = exam.length ? Math.round((score / exam.length) * 100) : 0;

  useEffect(() => {
    if (!submitted && headingRef.current) headingRef.current.focus();
  }, [cursor, submitted]);

  function retake() {
    reset();
    setCursor(0);
  }

  if (submitted) {
    return (
      <div className="mx-auto max-w-2xl">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-copper-deep">Exam result</p>
        <h1 className="mt-2 font-serif text-4xl sm:text-5xl">
          {score} / {exam.length}
          <span className="ml-3 align-middle font-sans text-lg font-normal text-muted">{scorePct}%</span>
        </h1>
        <p className="mt-3 text-muted">
          {scorePct >= 85
            ? "That is a working command of the taxonomy. Reread any miss against the section it cites."
            : scorePct >= 60
              ? "The spine is there. The misses are worth a second pass on the lesson they point at."
              : "Treat this as a map of what to reread, not a grade. Start with bottlenecks and the KV equation."}
        </p>

        {attempts.length > 1 ? (
          <div className="mt-5 rounded-card border border-line bg-card px-4 py-3">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted">Recent attempts</p>
            <ol className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm">
              {attempts.slice(-5).reverse().map((attempt) => (
                <li key={attempt.at} className="tabular text-ink/80">
                  {attempt.score}/{attempt.total}
                </li>
              ))}
            </ol>
          </div>
        ) : null}

        <ol className="mt-8 space-y-4">
          {exam.map((item, i) => {
            const chosen = answers[item.id];
            const ok = chosen === item.answer;
            const lesson = item.lessonId ? lessonById(item.lessonId) : undefined;
            return (
              <li key={item.id} className="rounded-card border border-line bg-card p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.12em] text-muted">
                  {i + 1} · {ok ? "Correct" : chosen === undefined ? "Unanswered" : "Review"}
                </p>
                <p className="mt-1 font-semibold">{item.prompt}</p>
                {!ok && chosen !== undefined ? (
                  <p className="mt-2 flex items-start gap-2 text-sm text-copper-deep">
                    <X aria-hidden className="mt-0.5 size-4 shrink-0" />
                    <span>You chose: {item.options[chosen]}</span>
                  </p>
                ) : null}
                <p className="mt-2 flex items-start gap-2 text-sm">
                  <Check aria-hidden className="mt-0.5 size-4 shrink-0 text-moss" />
                  <span>Answer: {item.options[item.answer]}</span>
                </p>
                <p className="mt-2 text-sm text-muted">{item.why}</p>
                {lesson ? (
                  <Link
                    to="/lesson/$id"
                    params={{ id: lesson.id }}
                    className="mt-3 inline-flex text-sm font-semibold text-copper-deep underline decoration-line underline-offset-4"
                  >
                    Review lesson {lesson.numeral}: {lesson.title}
                  </Link>
                ) : null}
              </li>
            );
          })}
        </ol>
        <div className="mt-6 flex flex-wrap gap-3">
          <button
            type="button"
            onClick={retake}
            className="inline-flex min-h-11 items-center gap-2 rounded-full bg-ink px-5 text-sm font-semibold text-paper"
          >
            <RotateCcw aria-hidden className="size-4" />
            Retake
          </button>
          <Link to="/" className="inline-flex min-h-11 items-center px-2 text-sm font-semibold text-muted">
            Return to the path
          </Link>
        </div>
      </div>
    );
  }

  if (!q) {
    return (
      <div className="mx-auto max-w-lg py-16 text-center">
        <h1 className="font-serif text-4xl">No exam questions</h1>
        <Link to="/" className="mt-4 inline-flex font-semibold text-copper-deep">
          Back to the path
        </Link>
      </div>
    );
  }

  const firstUnanswered = exam.findIndex((item) => answers[item.id] === undefined);

  return (
    <div className="mx-auto max-w-2xl">
      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-copper-deep">
        Exam · {cursor + 1} of {exam.length} · {answered} answered
      </p>
      <h1 ref={headingRef} tabIndex={-1} className="mt-2 font-serif text-4xl leading-tight outline-none">
        {q.prompt}
      </h1>
      <div
        className="mt-3 h-1.5 overflow-hidden rounded-full bg-paper-2"
        role="progressbar"
        aria-label={`${answered} of ${exam.length} questions answered`}
        aria-valuemin={0}
        aria-valuemax={exam.length}
        aria-valuenow={answered}
      >
        <div className="h-full bg-copper transition-[width] duration-300" style={{ width: `${pct}%` }} />
      </div>

      <div className="mt-6 space-y-2" role="group" aria-labelledby="exam-question">
        <p id="exam-question" className="sr-only">
          Choose one answer
        </p>
        {q.options.map((opt, i) => {
          const selected = answers[q.id] === i;
          return (
            <button
              key={opt}
              type="button"
              aria-pressed={selected}
              onClick={() => answer(q.id, i)}
              className={cn(
                "flex w-full items-start gap-3 rounded-card border px-4 py-3 text-left",
                selected ? "border-ink bg-ink text-paper" : "border-line bg-card hover:border-ink/30",
              )}
            >
              <span className="font-mono text-xs opacity-70">{String.fromCharCode(65 + i)}</span>
              <span>{opt}</span>
            </button>
          );
        })}
      </div>

      <nav aria-label="Question navigator" className="mt-6 grid grid-cols-6 gap-1.5 sm:grid-cols-9">
        {exam.map((item, i) => {
          const done = answers[item.id] !== undefined;
          const current = i === cursor;
          return (
            <button
              key={item.id}
              type="button"
              aria-label={`Question ${i + 1}${done ? ", answered" : ", unanswered"}${current ? ", current" : ""}`}
              aria-current={current ? "step" : undefined}
              onClick={() => setCursor(i)}
              className={cn(
                "inline-flex min-h-9 items-center justify-center rounded-lg border text-xs font-semibold tabular",
                current
                  ? "border-ink bg-ink text-paper"
                  : done
                    ? "border-moss bg-moss-soft text-moss"
                    : "border-line bg-card text-muted hover:border-ink/30",
              )}
            >
              {i + 1}
            </button>
          );
        })}
      </nav>

      <div className="mt-6 flex flex-wrap gap-3">
        <button
          type="button"
          disabled={cursor === 0}
          onClick={() => setCursor((c) => Math.max(0, c - 1))}
          className="inline-flex min-h-11 items-center gap-1 rounded-full border border-line bg-card px-5 text-sm font-semibold disabled:opacity-40"
        >
          <ArrowLeft aria-hidden className="size-4" />
          Back
        </button>
        {cursor < exam.length - 1 ? (
          <button
            type="button"
            onClick={() => setCursor((c) => Math.min(exam.length - 1, c + 1))}
            className="inline-flex min-h-11 items-center gap-1 rounded-full bg-ink px-5 text-sm font-semibold text-paper"
          >
            Next
            <ArrowRight aria-hidden className="size-4" />
          </button>
        ) : (
          <button
            type="button"
            disabled={answered < exam.length}
            onClick={() => submit(score, exam.length)}
            className="min-h-11 rounded-full bg-copper px-5 text-sm font-semibold text-card disabled:opacity-40"
          >
            {answered < exam.length ? `Answer all ${exam.length}` : "Submit"}
          </button>
        )}
        {firstUnanswered >= 0 && firstUnanswered !== cursor ? (
          <button
            type="button"
            onClick={() => setCursor(firstUnanswered)}
            className="min-h-11 rounded-full border border-line bg-card px-4 text-sm font-semibold text-muted"
          >
            First unanswered
          </button>
        ) : null}
        <Link to="/" className="inline-flex min-h-11 items-center px-2 text-sm font-semibold text-muted">
          Return to the path
        </Link>
      </div>
    </div>
  );
}
