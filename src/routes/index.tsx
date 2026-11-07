import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, Check, Play } from "lucide-react";
import { glossary, lessons, SOURCE } from "@/lib/course";
import { useProgress } from "@/lib/progress";
import { cn } from "@/lib/cn";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [{ title: "Ridge · Efficient LLM inference" }],
  }),
  component: Home,
});

const tutorials = lessons.filter((l) => l.video);

function Home() {
  const complete = useProgress((s) => s.complete);
  const next = lessons.find((l) => !complete.includes(l.id)) ?? lessons[0];
  const pct = Math.round((complete.length / lessons.length) * 100);

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
            Nine lessons, five visual tutorials, and four labs built from {SOURCE.author}&rsquo;s survey.
            The organizing idea is a four-pillar taxonomy aimed at four physical bottlenecks.
          </p>
          <div className="mt-6 flex flex-wrap items-center gap-3">
            <Link
              to="/lesson/$id"
              params={{ id: next.id }}
              className="inline-flex min-h-11 items-center gap-2 rounded-full bg-copper px-5 text-sm font-semibold text-card"
            >
              {complete.length === 0 ? "Start the path" : `Continue · ${next.title}`}
              <ArrowRight aria-hidden className="size-4" />
            </Link>
            <Link
              to="/labs"
              className="inline-flex min-h-11 items-center rounded-full border border-line bg-card px-5 text-sm font-semibold text-ink"
            >
              Open the labs
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
            className="mt-3 inline-flex text-sm font-semibold text-copper-deep underline decoration-line underline-offset-4"
          >
            Read the area exam PDF
          </a>
          <div className="mt-5">
            <div className="flex items-baseline justify-between text-sm">
              <span className="text-muted">Path progress</span>
              <span className="tabular font-semibold">
                {complete.length}/{lessons.length}
              </span>
            </div>
            <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-paper-2">
              <div className="h-full rounded-full bg-copper" style={{ width: `${pct}%` }} />
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
          {tutorials.map((l) => (
            <li key={l.id}>
              <Link
                to="/lesson/$id"
                params={{ id: l.id }}
                className="group block overflow-hidden rounded-card border border-line bg-card"
              >
                <span className="relative block bg-ink">
                  <img
                    src={l.video?.src.replace(/\.mp4(\?.*)?$/, ".jpg")}
                    alt=""
                    className="aspect-video w-full object-cover"
                  />
                  <span className="absolute bottom-2 left-2 flex size-8 items-center justify-center rounded-full bg-ink/80 text-card">
                    <Play aria-hidden className="size-3.5" />
                  </span>
                </span>
                <span className="block px-3 py-3 text-sm font-medium text-ink">
                  {l.video?.title.replace("Visual tutorial · ", "")}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <section>
        <h2 className="font-serif text-3xl">The path</h2>
        <p className="mt-2 max-w-2xl text-muted">
          Nine spoken lectures, in the survey&rsquo;s own order. Written notes sit under each player
          if you want to scan. Each lesson ends with two checks.
        </p>
        <ol className="mt-5 divide-y divide-line overflow-hidden rounded-card border border-line bg-card">
          {lessons.map((l) => {
            const done = complete.includes(l.id);
            return (
              <li key={l.id}>
                <Link
                  to="/lesson/$id"
                  params={{ id: l.id }}
                  className="flex items-center gap-4 px-4 py-4 hover:bg-paper sm:px-5"
                >
                  <span
                    className={cn(
                      "flex size-10 shrink-0 items-center justify-center rounded-full border font-mono text-xs",
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
                    </span>
                    <span className="block truncate font-serif text-xl">{l.title}</span>
                  </span>
                  <span className="hidden text-sm text-muted sm:inline">{l.minutes} min</span>
                  <ArrowRight aria-hidden className="size-4 text-muted" />
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
          <h2 className="font-serif text-3xl">Glossary</h2>
          <p className="mt-2 text-muted">Short definitions in the survey&rsquo;s own terms.</p>
          <dl className="mt-4 max-h-[28rem] space-y-3 overflow-auto pr-1">
            {glossary.map((g) => (
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
