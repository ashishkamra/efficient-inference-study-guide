import { createFileRoute } from "@tanstack/react-router";
import { Search } from "lucide-react";
import { useMemo, useState } from "react";
import { glossary } from "@/lib/course";

export const Route = createFileRoute("/glossary")({
  head: () => ({
    meta: [
      { title: "Glossary · Ridge" },
      {
        name: "description",
        content: "Definitions of the KV cache, roofline, speculation, quantization, paging, and serving terms in the survey.",
      },
    ],
  }),
  component: GlossaryPage,
});

function GlossaryPage() {
  const [query, setQuery] = useState("");
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return glossary;
    return glossary.filter(
      (entry) => entry.term.toLowerCase().includes(q) || entry.def.toLowerCase().includes(q),
    );
  }, [query]);

  return (
    <div className="mx-auto max-w-3xl">
      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-copper-deep">Reference</p>
      <h1 className="mt-2 font-serif text-4xl sm:text-5xl">Glossary</h1>
      <p className="mt-3 text-lg text-muted">
        Short definitions in the survey&rsquo;s own terms. Search by name or meaning.
      </p>
      <label className="mt-6 block">
        <span className="sr-only">Search the glossary</span>
        <span className="flex items-center gap-2 rounded-full border border-line bg-card px-4 py-2.5">
          <Search aria-hidden className="size-4 text-muted" />
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search terms and definitions"
            className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-muted"
          />
        </span>
      </label>
      <p className="mt-3 text-sm text-muted" role="status" aria-live="polite">
        {filtered.length} of {glossary.length} terms
      </p>
      <dl className="mt-4 divide-y divide-line overflow-hidden rounded-card border border-line bg-card">
        {filtered.map((entry) => (
          <div key={entry.term} id={entry.term.toLowerCase().replace(/[^a-z0-9]+/g, "-")} className="scroll-mt-24 px-4 py-4 sm:px-5">
            <dt className="font-serif text-2xl">{entry.term}</dt>
            <dd className="mt-1 text-muted">{entry.def}</dd>
          </div>
        ))}
      </dl>
      {filtered.length === 0 ? (
        <p className="mt-6 rounded-card border border-line bg-card px-4 py-4 text-muted">
          No term matches “{query}”.
        </p>
      ) : null}
    </div>
  );
}
