import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { exam } from "@/lib/course";
import { useProgress } from "@/lib/progress";
import { cn } from "@/lib/cn";

export const Route = createFileRoute("/exam")({
  head: () => ({ meta: [{ title: "Exam · Ridge" }] }),
  component: ExamPage,
});

function ExamPage() {
  const answers = useProgress((s) => s.exam);
  const submitted = useProgress((s) => s.examSubmitted);
  const answer = useProgress((s) => s.answerExam);
  const submit = useProgress((s) => s.submitExam);
  const reset = useProgress((s) => s.resetExam);
  const [cursor, setCursor] = useState(0);
  const q = exam[cursor];
  const score = exam.filter((item) => answers[item.id] === item.answer).length;
  const answered = exam.filter((item) => answers[item.id] !== undefined).length;

  if (submitted) {
    return (
      <div className="mx-auto max-w-2xl">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-copper-deep">Exam</p>
        <h1 className="mt-2 font-serif text-4xl sm:text-5xl">
          {score} / {exam.length}
        </h1>
        <p className="mt-3 text-muted">
          {score >= 10
            ? "That is a working command of the taxonomy. Reread any miss against the section it cites."
            : score >= 7
              ? "The spine is there. The misses are worth a second pass on the lesson they point at."
              : "Treat this as a map of what to reread, not a grade. Start with bottlenecks and the KV equation."}
        </p>
        <ol className="mt-8 space-y-4">
          {exam.map((item, i) => {
            const chosen = answers[item.id];
            const ok = chosen === item.answer;
            return (
              <li key={item.id} className="rounded-card border border-line bg-card p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.12em] text-muted">
                  {i + 1} · {ok ? "Correct" : "Review"}
                </p>
                <p className="mt-1 font-semibold">{item.prompt}</p>
                <p className="mt-2 text-sm">
                  {ok ? item.options[item.answer] : `Answer: ${item.options[item.answer]}`}
                </p>
                <p className="mt-2 text-sm text-muted">{item.why}</p>
              </li>
            );
          })}
        </ol>
        <button
          type="button"
          onClick={reset}
          className="mt-6 min-h-11 rounded-full border border-line bg-card px-5 text-sm font-semibold"
        >
          Retake
        </button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl">
      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-copper-deep">
        Exam · {cursor + 1} of {exam.length}
      </p>
      <h1 className="mt-2 font-serif text-4xl leading-tight">{q.prompt}</h1>
      <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-paper-2">
        <div className="h-full bg-copper" style={{ width: `${(answered / exam.length) * 100}%` }} />
      </div>
      <div className="mt-6 space-y-2">
        {q.options.map((opt, i) => {
          const selected = answers[q.id] === i;
          return (
            <button
              key={opt}
              type="button"
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
      <div className="mt-6 flex flex-wrap gap-3">
        <button
          type="button"
          disabled={cursor === 0}
          onClick={() => setCursor((c) => Math.max(0, c - 1))}
          className="min-h-11 rounded-full border border-line bg-card px-5 text-sm font-semibold disabled:opacity-40"
        >
          Back
        </button>
        {cursor < exam.length - 1 ? (
          <button
            type="button"
            onClick={() => setCursor((c) => c + 1)}
            className="min-h-11 rounded-full bg-ink px-5 text-sm font-semibold text-paper"
          >
            Next
          </button>
        ) : (
          <button
            type="button"
            disabled={answered < exam.length}
            onClick={submit}
            className="min-h-11 rounded-full bg-copper px-5 text-sm font-semibold text-card disabled:opacity-40"
          >
            {answered < exam.length ? `Answer all ${exam.length}` : "Submit"}
          </button>
        )}
        <Link to="/" className="inline-flex min-h-11 items-center px-2 text-sm font-semibold text-muted">
          Return to the path
        </Link>
      </div>
    </div>
  );
}
