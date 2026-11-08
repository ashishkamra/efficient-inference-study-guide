import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, Check, Clock, FlaskConical, Play } from "lucide-react";
import { glossary, lessons, SOURCE } from "@/lib/course";
import { assetUrl } from "@/lib/asset-url";
import { useProgress } from "@/lib/progress";
import { cn } from "@/lib/cn";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Ridge · Efficient LLM inference" },
      {
        name: "description",
        content:
          "A nine-lesson study companion to Efficient LLM Inference: A Survey — narrated lectures, written notes, interactive labs, and an exam.",
      },
    ],
  }),
  component: Home,
});

function Home() {
  const complete = useProgress((s) => s.complete);
  const lastLessonId = useProgress((s) => s.lastLessonId);
  const hydrated = useProgress((s) => s.hydrated);
  const lastLesson = lastLessonId ? lessons.find((l) => l.id === lastLessonId) : undefined;
  const next =
    lastLesson && !complete.includes(lastLesson.id)
      ? lastLesson
      : lessons.find((l) => !complete.includes(l.id));
  const allDone = complete.length === lessons.length;
  const pct = Math.round((complete.length / lessons.length) * 100);
  const totalMinutes = lessons.reduce((total, lesson) => total + lesson.minutes, 0);
  const labCount = lessons.filter((lesson) => lesson.lab).length;

  return (
    <div className="space-y-12">
      <section className="grid items-end gap-8 border-b border-line pb-8 lg:grid-cols-[1.4fr_0.8fr]">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-copper-deep">
            Area exam companion · {SOURCE.id}
          </p>
          <h1 className="mt-3 max-w-xl font-serif text-4xl font-semibold leading-[1.05] text-ink sm:text-5xl">
            Study the full stack of efficient LLM inference.
          </h1>
          <p className="mt-4 max-w-xl text-lg text-muted">
            {lessons.length} lessons, {lessons.filter((lesson) => lesson.video).length} narrated
            lectures, and {labCount} labs built from {SOURCE.author}&rsquo;s survey. The organizing
            idea is a four-pillar taxonomy aimed at four physical bottlenecks.
          </p>
          <p className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted">
            <span className="inline-flex items-center gap-1.5">
              <Clock aria-hidden className="size-4" />
              About {Math.round(totalMinutes / 60)}h {totalMinutes % 60}m of guided study
            </span>
            <span className="inline-flex items-center gap-1.5">
              <FlaskConical aria-hidden className="size-4" />
              {labCount} interactive labs
            </span>
          </p>
          <div className="mt-6 flex flex-wrap items-center gap-3">
            {allDone ? (
              <Link
                to="/exam"
                className="inline-flex min-h-11 items-center gap-2 rounded-full bg-copper px-5 text-sm font-semibold text-card"
              >
                Take the exam
                <ArrowRight aria-hidden className="size-4" />
              </Link>
            ) : (
              <Link
                to="/lesson/$id"
                params={{ id: next?.id ?? lessons[0].id }}
                className="inline-flex min-h-11 items-center gap-2 rounded-full bg-copper px-5 text-sm font-semibold text-card"
              >
                {complete.length === 0
                  ? "Start the path"
                  : `Continue · ${next?.title ?? lessons[0].title}`}
                <ArrowRight aria-hidden className="size-4" />
              </Link>
            )}
            <Link
              to="/labs"
              className="inline-flex min-h-11 items-center rounded-full border border-line bg-card px-5 text-sm font-semibold text-ink"
            >
              Open the labs
            </Link>
            <Link
              to="/review"
              className="inline-flex min-h-11 items-center rounded-full px-2 text-sm font-semibold text-copper-deep underline decoration-line underline-offset-4"
            >
              Review sheet
            </Link>
          </div>
        </div>
        <aside className="rounded-card border border-line bg-card p-5">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted">Source</p>
          <p className="mt-2 font-serif text-2xl leading-tight">{SOURCE.title}</p>
          <p className="mt-2 text-sm text-muted">
            {SOURCE.author}, {SOURCE.affiliation}. {SOURCE.kind}, {SOURCE.date}. Committee:{" "}
            {SOURCE.committee}.
          </p>
          <a
            href={SOURCE.url}
            target="_blank"
            rel="noreferrer"
            className="mt-3 inline-flex text-sm font-semibold text-copper-deep underline decoration-line underline-offset-4"
          >
            Read the area exam PDF
          </a>
          <div className="mt-5">
            <div className="flex items-baseline justify-between text-sm">
              <span className="text-muted">Path progress</span>
              <span className="tabular font-semibold" aria-label={`${complete.length} of ${lessons.length} lessons complete`}>
                {hydrated ? `${complete.length}/${lessons.length}` : "—/—"}
              </span>
            </div>
            <div
              className="mt-2 h-1.5 overflow-hidden rounded-full bg-paper-2"
              role="progressbar"
              aria-valuemin={0}
              aria-valuemax={lessons.length}
              aria-valuenow={complete.length}
              aria-label="Path progress"
            >
              <div className="h-full rounded-full bg-copper transition-[width] duration-300" style={{ width: `${pct}%` }} />
            </div>
          </div>
        </aside>
      </section>

      <section>
        <div className="flex items-end justify-between gap-4">
          <h2 className="font-serif text-3xl">Narrated lectures</h2>
          <p className="text-sm text-muted">Each lesson is read aloud. Press play and listen.</p>
        </div>
        <ul className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
          {lessons.map((l) => (
            <li key={l.id}>
              <Link
                to="/lesson/$id"
                params={{ id: l.id }}
                aria-label={`Lesson ${l.numeral}: ${l.title}`}
                className="group block overflow-hidden rounded-card border border-line bg-card"
              >
                <span className="relative block bg-ink">
                  <img
                    src={assetUrl(l.video?.src.replace(/\.mp4(\?.*)?$/, ".jpg") ?? "")}
                    alt=""
                    loading="lazy"
                    decoding="async"
                    className="aspect-video w-full object-cover"
                  />
                  <span className="absolute inset-0 flex items-center justify-center">
                    <span className="flex size-10 items-center justify-center rounded-full bg-ink/75 text-card shadow-sm backdrop-blur-[1px] transition group-hover:bg-ink">
                      <Play aria-hidden className="size-4" />
                    </span>
                  </span>
                </span>
                <span className="block px-3 py-3">
                  <span className="block text-xs font-semibold uppercase tracking-[0.12em] text-muted">
                    Lesson {l.numeral} · {l.minutes} min
                  </span>
                  <span className="mt-1 block text-sm font-medium leading-snug text-ink">{l.title}</span>
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <section>
        <h2 className="font-serif text-3xl">The path</h2>
        <p className="mt-2 max-w-2xl text-muted">
          {lessons.length} spoken lectures, in the survey&rsquo;s own order. Written notes and
          practice checks sit behind the Read and Practice tabs on each lesson.
        </p>
        <ol className="mt-5 divide-y divide-line overflow-hidden rounded-card border border-line bg-card">
          {lessons.map((l) => {
            const done = complete.includes(l.id);
            return (
              <li key={l.id}>
                <Link
                  to="/lesson/$id"
                  params={{ id: l.id }}
                  className="flex items-start gap-3 px-4 py-4 hover:bg-paper sm:items-center sm:gap-4 sm:px-5"
                >
                  <span
                    className={cn(
                      "mt-0.5 flex size-10 shrink-0 items-center justify-center rounded-full border font-mono text-xs sm:mt-0",
                      done
                        ? "border-moss bg-moss-soft text-moss"
                        : "border-line bg-paper text-muted",
                    )}
                  >
                    {done ? <Check aria-hidden className="size-4" /> : l.numeral}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-xs font-semibold uppercase tracking-[0.12em] text-muted">
                      {l.kicker}
                      {l.lab ? " · lab" : ""}
                    </span>
                    <span className="mt-0.5 block font-serif text-xl leading-snug">{l.title}</span>
                    <span className="mt-1 flex flex-wrap gap-x-3 text-xs text-muted sm:hidden">
                      <span>{l.checks.length} checks</span>
                      <span>{l.minutes} min</span>
                    </span>
                  </span>
                  <span className="hidden shrink-0 text-sm text-muted sm:inline">
                    {l.checks.length} checks
                  </span>
                  <span className="hidden shrink-0 text-sm text-muted sm:inline">{l.minutes} min</span>
                  <ArrowRight aria-hidden className="mt-2 size-4 shrink-0 text-muted sm:mt-0" />
                </Link>
              </li>
            );
          })}
        </ol>
      </section>

      <section className="grid gap-8 lg:grid-cols-[0.9fr_1.1fr]">
        <div>
          <h2 className="font-serif text-3xl">Four bottlenecks</h2>
          <p className="mt-2 text-muted">
            Table 1 of the survey. Every technique in the path is indexed by which of these it moves.
          </p>
          <ul className="mt-4 space-y-3">
            {[
              ["Capacity", "How many users fit", "Pillars 1, 3, 4"],
              ["Bandwidth", "How fast one user is served", "Pillars 1, 2, 4"],
              ["Compute", "Prefill and large-batch decode", "Pillars 2, 3"],
              ["Interconnect", "Sharding and phase splitting", "Pillar 4"],
            ].map(([name, line, who]) => (
              <li key={name} className="rounded-card border border-line bg-card px-4 py-3">
                <p className="font-serif text-xl">{name}</p>
                <p className="text-sm text-muted">{line}</p>
                <p className="mt-1 text-xs font-semibold uppercase tracking-[0.12em] text-copper-deep">
                  {who}
                </p>
              </li>
            ))}
          </ul>
        </div>
        <div>
          <div className="flex items-end justify-between gap-3">
            <h2 className="font-serif text-3xl">Glossary</h2>
            <Link to="/glossary" className="text-sm font-semibold text-copper-deep underline decoration-line underline-offset-4">
              All {glossary.length} terms
            </Link>
          </div>
          <p className="mt-2 text-muted">Short definitions in the survey&rsquo;s own terms.</p>
          <dl className="mt-4 max-h-[28rem] space-y-3 overflow-auto pr-1">
            {glossary.slice(0, 10).map((g) => (
              <div key={g.term} className="border-b border-line pb-3">
                <dt className="font-semibold">{g.term}</dt>
                <dd className="text-sm text-muted">{g.def}</dd>
              </div>
            ))}
          </dl>
        </div>
      </section>
    </div>
  );
}
