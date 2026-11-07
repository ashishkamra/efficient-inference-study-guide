import { useMemo, useState, type ReactNode } from "react";
import { ArrowDown, RotateCcw } from "lucide-react";
import { decodeIntensity, formatBytes, kvBytes, speculativeSpeedup } from "@/lib/models";

const PRESETS = [
  { id: "mha", label: "8B MHA", layers: 32, kvHeads: 32, dHead: 128, params: 8e9 },
  { id: "gqa", label: "8B GQA", layers: 32, kvHeads: 8, dHead: 128, params: 8e9 },
  { id: "mqa", label: "8B MQA", layers: 32, kvHeads: 1, dHead: 128, params: 8e9 },
  { id: "70", label: "70B GQA", layers: 80, kvHeads: 8, dHead: 128, params: 70e9 },
] as const;

const BYTES = [
  { id: 2, label: "FP16" },
  { id: 1, label: "INT8" },
  { id: 0.5, label: "INT4" },
];

const LAB_LINKS = [
  { id: "kv", label: "KV footprint" },
  { id: "phases", label: "Phase split" },
  { id: "roofline", label: "Roofline" },
  { id: "speculative", label: "Speculation" },
  { id: "paging", label: "Paging" },
  { id: "cascade", label: "Composed error" },
];

function Field({ label, value, children }: { label: string; value: string; children: ReactNode }) {
  return (
    <label className="block">
      <span className="flex items-baseline justify-between gap-3 text-sm">
        <span className="text-muted">{label}</span>
        <span className="tabular font-semibold">{value}</span>
      </span>
      {children}
    </label>
  );
}

function ResetButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex min-h-10 items-center gap-1.5 rounded-full border border-line bg-card px-3 text-xs font-semibold text-muted hover:text-ink"
    >
      <RotateCcw aria-hidden className="size-3.5" />
      Reset
    </button>
  );
}

function LabHeading({ id, title, children }: { id: string; title: string; children: ReactNode }) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-3">
      <div>
        <h2 id={`${id}-title`} className="font-serif text-3xl">
          {title}
        </h2>
        <div className="mt-2 max-w-2xl text-sm text-muted">{children}</div>
      </div>
    </div>
  );
}

export function LabsPanel() {
  return (
    <div className="space-y-8">
      <header className="max-w-2xl">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-copper-deep">Labs</p>
        <h1 className="mt-2 font-serif text-4xl sm:text-5xl">Move the terms the survey names.</h1>
        <p className="mt-3 text-lg text-muted">
          Six teaching models. They follow equations (5)–(8), a bandwidth-and-compute phase model,
          and the speculative acceptance model. They are not cluster simulators, and the cascade is
          qualitative on purpose.
        </p>
      </header>

      <nav aria-label="Labs" className="flex flex-wrap gap-2">
        {LAB_LINKS.map((link) => (
          <a
            key={link.id}
            href={`#${link.id}`}
            className="inline-flex min-h-10 items-center rounded-full border border-line bg-card px-3 text-sm font-medium text-muted hover:text-ink"
          >
            {link.label}
            <ArrowDown aria-hidden className="ml-1 size-3.5" />
          </a>
        ))}
      </nav>

      <KvLab />
      <PhaseLab />
      <RooflineLab />
      <SpecLab />
      <PagingLab />
      <CascadeLab />
    </div>
  );
}

function KvLab() {
  const [preset, setPreset] = useState<(typeof PRESETS)[number]["id"]>("gqa");
  const base = PRESETS.find((p) => p.id === preset) ?? PRESETS[1];
  const [seq, setSeq] = useState(8192);
  const [batch, setBatch] = useState(8);
  const [bytes, setBytes] = useState(2);
  const [mla, setMla] = useState(false);
  const [latent, setLatent] = useState(512);

  const bytesOut = kvBytes({
    layers: base.layers,
    kvHeads: base.kvHeads,
    dHead: base.dHead,
    seq,
    batch,
    bytes,
    latentDim: mla ? latent : null,
  });
  const hbm = 80 * 1024 ** 3;
  const pct = (bytesOut / hbm) * 100;

  function reset() {
    setPreset("gqa");
    setSeq(8192);
    setBatch(8);
    setBytes(2);
    setMla(false);
    setLatent(512);
  }

  return (
    <section
      id="kv"
      aria-labelledby="kv-title"
      className="scroll-mt-24 rounded-card border border-line bg-card p-4 sm:p-6"
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <LabHeading id="kv" title="KV footprint">
          Equation (5). The leading 2 is K and V. MLA replaces both with one latent, so that factor
          drops out — the survey&rsquo;s note in §2.1, not a second copy of the same formula.
        </LabHeading>
        <ResetButton onClick={reset} />
      </div>
      <div className="mt-5 flex flex-wrap gap-2">
        {PRESETS.map((p) => (
          <button
            key={p.id}
            type="button"
            aria-pressed={preset === p.id}
            onClick={() => setPreset(p.id)}
            className={
              preset === p.id
                ? "min-h-11 rounded-full bg-ink px-4 text-sm font-semibold text-paper"
                : "min-h-11 rounded-full border border-line px-4 text-sm font-semibold"
            }
          >
            {p.label}
          </button>
        ))}
        <button
          type="button"
          aria-pressed={mla}
          onClick={() => setMla((v) => !v)}
          className={
            mla
              ? "min-h-11 rounded-full bg-copper px-4 text-sm font-semibold text-card"
              : "min-h-11 rounded-full border border-line px-4 text-sm font-semibold"
          }
        >
          {mla ? "MLA latent on" : "Use MLA latent"}
        </button>
      </div>
      <div className="mt-5 grid gap-6 lg:grid-cols-[1fr_16rem]">
        <div className="space-y-3">
          <Field label="Sequence length" value={seq.toLocaleString()}>
            <input type="range" min={256} max={131072} step={256} value={seq} onChange={(e) => setSeq(Number(e.target.value))} />
          </Field>
          <Field label="Batch" value={String(batch)}>
            <input type="range" min={1} max={64} value={batch} onChange={(e) => setBatch(Number(e.target.value))} />
          </Field>
          {mla ? (
            <Field label="Latent width d_c" value={String(latent)}>
              <input type="range" min={128} max={4096} step={64} value={latent} onChange={(e) => setLatent(Number(e.target.value))} />
            </Field>
          ) : null}
          <div className="flex flex-wrap gap-2 pt-1">
            {BYTES.map((b) => (
              <button
                key={b.label}
                type="button"
                aria-pressed={bytes === b.id}
                onClick={() => setBytes(b.id)}
                className={
                  bytes === b.id
                    ? "min-h-11 rounded-full bg-ink px-4 text-sm font-semibold text-paper"
                    : "min-h-11 rounded-full border border-line px-4 text-sm"
                }
              >
                {b.label}
              </button>
            ))}
          </div>
        </div>
        <div className="rounded-2xl bg-paper px-4 py-4" aria-live="polite">
          <p className="text-xs uppercase tracking-[0.14em] text-muted">Cache</p>
          <p className="mt-1 font-serif text-4xl tabular">{formatBytes(bytesOut)}</p>
          <p className="mt-2 text-sm text-muted">
            {pct.toFixed(1)}% of an illustrative 80 GB accelerator, cache only — weights not included.
          </p>
          <p className="mt-3 font-mono text-xs leading-relaxed text-muted">
            {mla
              ? `${base.layers} · ${latent} · ${seq} · ${batch} · ${bytes}`
              : `2 · ${base.layers} · ${base.kvHeads} · ${base.dHead} · ${seq} · ${batch} · ${bytes}`}
          </p>
        </div>
      </div>
    </section>
  );
}

function PhaseLab() {
  const [prompt, setPrompt] = useState(2048);
  const [output, setOutput] = useState(512);
  const [batch, setBatch] = useState(1);
  const params = 8e9;
  const layers = 32;
  const kvHeads = 8;
  const dHead = 128;
  const peakFlops = 1000e12;
  const bandwidth = 3.35e12;
  const weightBytes = 2;

  const prefillFlops = 2 * params * prompt * batch;
  const prefillTime = prefillFlops / peakFlops;
  const kv = kvBytes({ layers, kvHeads, dHead, seq: prompt + output, batch, bytes: weightBytes, latentDim: null });
  const decodeBytes = params * weightBytes + kv;
  const decodeTime = decodeBytes / bandwidth;
  const total = prefillTime + decodeTime * output;
  const max = Math.max(prefillTime, decodeTime * output, 0.001);

  function reset() {
    setPrompt(2048);
    setOutput(512);
    setBatch(1);
  }

  return (
    <section
      id="phases"
      aria-labelledby="phases-title"
      className="scroll-mt-24 rounded-card border border-line bg-card p-4 sm:p-6"
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <LabHeading id="phases" title="Prefill versus decode">
          An 8B GQA model on illustrative hardware: 1,000 TFLOP/s FP16 peak and 3.35 TB/s HBM.
          Prefill is charged at compute peak; each decode step moves the weights plus the live KV
          cache. The constants are teaching values, not a benchmark.
        </LabHeading>
        <ResetButton onClick={reset} />
      </div>
      <div className="mt-5 grid gap-4 sm:grid-cols-3">
        <Field label="Prompt tokens" value={prompt.toLocaleString()}>
          <input type="range" min={128} max={16384} step={128} value={prompt} onChange={(e) => setPrompt(Number(e.target.value))} />
        </Field>
        <Field label="Output tokens" value={output.toLocaleString()}>
          <input type="range" min={1} max={2048} step={1} value={output} onChange={(e) => setOutput(Number(e.target.value))} />
        </Field>
        <Field label="Batch" value={String(batch)}>
          <input type="range" min={1} max={64} value={batch} onChange={(e) => setBatch(Number(e.target.value))} />
        </Field>
      </div>
      <div className="mt-5 space-y-3" aria-live="polite">
        <PhaseBar
          label={`Prefill · ${(prefillTime * 1000).toFixed(1)} ms`}
          width={prefillTime / max}
          tone="copper"
        />
        <PhaseBar
          label={`Decode · ${(decodeTime * 1000).toFixed(1)} ms/token · ${(decodeTime * output * 1000).toFixed(0)} ms total`}
          width={(decodeTime * output) / max}
          tone="ink"
        />
      </div>
      <dl className="mt-4 grid gap-3 sm:grid-cols-3">
        <Stat k="TTFT" v={`${(prefillTime * 1000).toFixed(1)} ms`} />
        <Stat k="TPOT" v={`${(decodeTime * 1000).toFixed(1)} ms`} />
        <Stat k="End-to-end" v={`${(total * 1000).toFixed(0)} ms`} />
      </dl>
      <p className="mt-3 text-sm text-muted">
        Raise the batch and prefill grows roughly linearly with compute while decode amortizes the
        weight read across the batch — until KV traffic and the compute ceiling take over. Raise the
        prompt and watch prefill, then the KV term inside decode, both climb.
      </p>
    </section>
  );
}

function PhaseBar({ label, width, tone }: { label: string; width: number; tone: "ink" | "copper" }) {
  return (
    <div>
      <div className="mb-1 flex justify-between text-sm">
        <span>{label}</span>
      </div>
      <div className="h-3 overflow-hidden rounded-full bg-paper-2">
        <div
          className={tone === "ink" ? "h-full rounded-full bg-ink" : "h-full rounded-full bg-copper"}
          style={{ width: `${Math.max(1, Math.min(100, width * 100))}%` }}
        />
      </div>
    </div>
  );
}

function RooflineLab() {
  const [batch, setBatch] = useState(1);
  const [weightBytes, setWeightBytes] = useState(2);
  const [ridge, setRidge] = useState(300);
  const [seq, setSeq] = useState(4096);
  const params = 8e9;
  const kv = kvBytes({
    layers: 32,
    kvHeads: 8,
    dHead: 128,
    seq,
    batch,
    bytes: Math.min(weightBytes, 2),
    latentDim: null,
  });
  const point = decodeIntensity({ params, weightBytes, batch, kvMoved: kv, ridge });

  const chart = useMemo(() => {
    const width = 640;
    const height = 280;
    const pad = { left: 52, right: 18, top: 18, bottom: 42 };
    const xMin = 0.25;
    const xMax = 2048;
    const logMin = Math.log10(xMin);
    const logMax = Math.log10(xMax);
    const x = (value: number) =>
      pad.left +
      ((Math.log10(Math.min(xMax, Math.max(xMin, value))) - logMin) / (logMax - logMin)) *
        (width - pad.left - pad.right);
    const y = (value: number) =>
      pad.top + (1 - Math.min(100, Math.max(0, value)) / 100) * (height - pad.top - pad.bottom);
    const xs = [0.25, 0.5, 1, 2, 4, 8, 16, 32, 64, 128, 256, 512, 1024, 2048];
    const roof = xs.map((oi) => ({ oi, value: Math.min(1, oi / ridge) * 100 }));
    const path = roof
      .map((p, i) => `${i === 0 ? "M" : "L"}${x(p.oi).toFixed(1)},${y(p.value).toFixed(1)}`)
      .join(" ");
    const markerX = x(point.oi);
    const markerY = y(point.attained * 100);
    return { width, height, pad, x, y, roof, path, markerX, markerY };
  }, [ridge, point.oi, point.attained]);

  function reset() {
    setBatch(1);
    setWeightBytes(2);
    setRidge(300);
    setSeq(4096);
  }

  return (
    <section
      id="roofline"
      aria-labelledby="roofline-title"
      className="scroll-mt-24 rounded-card border border-line bg-card p-4 sm:p-6"
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <LabHeading id="roofline" title="Roofline">
          An 8B GQA decode step. FLOPs are 2|θ| times batch. Bytes are the weights plus the KV cache
          from equation (5). The ridge defaults to 300 FLOP/byte, inside the &ldquo;hundreds&rdquo; the
          survey cites. The dot is your decode. Prefill would sit far to the right, on the ceiling.
        </LabHeading>
        <ResetButton onClick={reset} />
      </div>
      <div className="mt-4 w-full overflow-hidden rounded-2xl bg-paper px-2 py-2">
        <RooflineChart chart={chart} point={point} />
      </div>
      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <Field label="Batch" value={String(batch)}>
          <input type="range" min={1} max={64} value={batch} onChange={(e) => setBatch(Number(e.target.value))} />
        </Field>
        <Field label="Context in the cache" value={seq.toLocaleString()}>
          <input type="range" min={128} max={32768} step={128} value={seq} onChange={(e) => setSeq(Number(e.target.value))} />
        </Field>
        <Field label="Ridge (FLOP/byte)" value={String(ridge)}>
          <input type="range" min={50} max={800} step={10} value={ridge} onChange={(e) => setRidge(Number(e.target.value))} />
        </Field>
        <div>
          <p className="text-sm text-muted">Weight dtype</p>
          <div className="mt-2 flex gap-2">
            {BYTES.map((b) => (
              <button
                key={b.label}
                type="button"
                aria-pressed={weightBytes === b.id}
                onClick={() => setWeightBytes(b.id)}
                className={
                  weightBytes === b.id
                    ? "min-h-11 flex-1 rounded-full bg-ink text-sm font-semibold text-paper"
                    : "min-h-11 flex-1 rounded-full border border-line text-sm"
                }
              >
                {b.label}
              </button>
            ))}
          </div>
        </div>
      </div>
      <p className="mt-4 text-sm" aria-live="polite">
        <span className="font-semibold tabular">{point.oi.toFixed(2)} FLOP/byte</span>
        <span className="text-muted">
          {" "}
          · {point.bound === "memory" ? "memory-bound, under the ridge" : "compute-bound, on the ceiling"} ·{" "}
          {(point.attained * 100).toFixed(1)}% of peak compute. At FP16 and batch 1 with a short cache
          this sits near 1, matching §2.3. A long cache pulls it even lower because KV bytes join the
          weight traffic.
        </span>
      </p>
    </section>
  );
}

type RooflineChartData = {
  width: number;
  height: number;
  pad: { left: number; right: number; top: number; bottom: number };
  x: (value: number) => number;
  y: (value: number) => number;
  roof: { oi: number; value: number }[];
  path: string;
  markerX: number;
  markerY: number;
};

function RooflineChart({
  chart,
  point,
}: {
  chart: RooflineChartData;
  point: ReturnType<typeof decodeIntensity>;
}) {
  const xTicks = [0.25, 1, 10, 100, 1000];
  const yTicks = [0, 50, 100];
  const plotRight = chart.width - chart.pad.right;
  const plotBottom = chart.height - chart.pad.bottom;
  return (
    <svg
      viewBox={`0 0 ${chart.width} ${chart.height}`}
      role="img"
      aria-labelledby="roofline-chart-title roofline-chart-desc"
      className="h-auto w-full"
    >
      <title id="roofline-chart-title">Roofline for the current decode step</title>
      <desc id="roofline-chart-desc">
        A log-scale plot of attained compute as a fraction of peak against operational intensity.
        The current point sits at {point.oi.toFixed(2)} FLOP per byte and{" "}
        {(point.attained * 100).toFixed(1)} percent of peak, on the{" "}
        {point.bound === "memory" ? "memory-bound" : "compute-bound"} side of the ridge.
      </desc>

      {yTicks.map((tick) => (
        <g key={`y-${tick}`}>
          <line
            x1={chart.pad.left}
            x2={plotRight}
            y1={chart.y(tick)}
            y2={chart.y(tick)}
            stroke="var(--color-line)"
            strokeDasharray={tick === 0 ? undefined : "3 4"}
          />
          <text x={chart.pad.left - 8} y={chart.y(tick) + 4} textAnchor="end" fill="var(--color-muted)" fontSize="11">
            {tick}%
          </text>
        </g>
      ))}
      {xTicks.map((tick) => (
        <g key={`x-${tick}`}>
          <line
            x1={chart.x(tick)}
            x2={chart.x(tick)}
            y1={chart.pad.top}
            y2={plotBottom}
            stroke="var(--color-line)"
            strokeDasharray="3 4"
          />
          <text x={chart.x(tick)} y={plotBottom + 18} textAnchor="middle" fill="var(--color-muted)" fontSize="11">
            {tick}
          </text>
        </g>
      ))}
      <text x={(chart.pad.left + plotRight) / 2} y={chart.height - 4} textAnchor="middle" fill="var(--color-muted)" fontSize="11">
        Operational intensity (FLOP/byte, log scale)
      </text>
      <text
        x={14}
        y={(chart.pad.top + plotBottom) / 2}
        textAnchor="middle"
        fill="var(--color-muted)"
        fontSize="11"
        transform={`rotate(-90 14 ${(chart.pad.top + plotBottom) / 2})`}
      >
        % of peak compute
      </text>

      <path d={chart.path} fill="none" stroke="var(--color-ink)" strokeWidth="2.5" />
      <circle
        cx={chart.markerX}
        cy={chart.markerY}
        r="6.5"
        fill="var(--color-copper)"
        stroke="var(--color-card)"
        strokeWidth="2"
      />
    </svg>
  );
}

function SpecLab() {
  const [alpha, setAlpha] = useState(0.7);
  const [gamma, setGamma] = useState(4);
  const [draftCost, setDraftCost] = useState(0.15);
  const [run, setRun] = useState<("hit" | "miss" | "fix")[]>([]);
  const model = speculativeSpeedup(alpha, gamma, draftCost);

  function simulate() {
    const tiles: ("hit" | "miss" | "fix")[] = [];
    for (let i = 0; i < gamma; i += 1) {
      if (Math.random() < alpha) tiles.push("hit");
      else {
        tiles.push("miss");
        tiles.push("fix");
        setRun(tiles);
        return;
      }
    }
    tiles.push("fix");
    setRun(tiles);
  }

  function reset() {
    setAlpha(0.7);
    setGamma(4);
    setDraftCost(0.15);
    setRun([]);
  }

  return (
    <section
      id="speculative"
      aria-labelledby="speculative-title"
      className="scroll-mt-24 rounded-card border border-line bg-card p-4 sm:p-6"
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <LabHeading id="speculative" title="Speculative step">
          Independent acceptance with probability α, draft length γ. Expected tokens per target
          forward, including the correction sampled from the target, is (1 − α^(γ+1)) / (1 − α).
          Cost is γ times the draft&rsquo;s relative cost, plus one verification. This is the
          textbook reading of τ, not EAGLE&rsquo;s feature-level drafter.
        </LabHeading>
        <ResetButton onClick={reset} />
      </div>
      <div className="mt-5 grid gap-4 sm:grid-cols-3">
        <Field label="Acceptance α" value={alpha.toFixed(2)}>
          <input type="range" min={0.05} max={0.95} step={0.01} value={alpha} onChange={(e) => setAlpha(Number(e.target.value))} />
        </Field>
        <Field label="Draft length γ" value={String(gamma)}>
          <input type="range" min={1} max={8} step={1} value={gamma} onChange={(e) => setGamma(Number(e.target.value))} />
        </Field>
        <Field label="Draft cost / target" value={draftCost.toFixed(2)}>
          <input type="range" min={0} max={1} step={0.01} value={draftCost} onChange={(e) => setDraftCost(Number(e.target.value))} />
        </Field>
      </div>
      <div className="mt-4 flex flex-wrap items-end justify-between gap-4">
        <div aria-live="polite">
          <p className="text-xs uppercase tracking-[0.14em] text-muted">Expected speedup</p>
          <p className="font-serif text-4xl tabular">{model.speedup.toFixed(2)}×</p>
          <p className="text-sm text-muted">
            {model.expected.toFixed(2)} tokens / {model.cost.toFixed(2)} target-equivalents
          </p>
        </div>
        <button
          type="button"
          onClick={simulate}
          className="min-h-11 rounded-full bg-copper px-5 text-sm font-semibold text-card"
        >
          Run one step
        </button>
      </div>
      <ul className="mt-4 flex flex-wrap gap-2" aria-live="polite">
        {run.length === 0 ? (
          <li className="text-sm text-muted">A row of draft tiles will appear here.</li>
        ) : (
          run.map((t, i) => (
            <li
              key={`${t}-${i}`}
              className={
                t === "hit"
                  ? "flex h-12 min-w-12 items-center justify-center rounded-xl bg-moss-soft px-3 text-xs font-semibold text-moss"
                  : t === "miss"
                    ? "flex h-12 min-w-12 items-center justify-center rounded-xl bg-paper-2 px-3 text-xs font-semibold text-muted line-through"
                    : "flex h-12 min-w-12 items-center justify-center rounded-xl bg-warn-soft px-3 text-xs font-semibold text-copper-deep"
              }
            >
              {t === "hit" ? "kept" : t === "miss" ? "drop" : "resample"}
            </li>
          ))
        )}
      </ul>
    </section>
  );
}

const REQUESTS = [
  { name: "A", tokens: 48 },
  { name: "B", tokens: 180 },
  { name: "C", tokens: 920 },
  { name: "D", tokens: 64 },
];

function PagingLab() {
  const [page, setPage] = useState(16);
  const max = 2048;
  const reserved = REQUESTS.length * max;
  const used = REQUESTS.reduce((s, r) => s + r.tokens, 0);
  const paged = REQUESTS.reduce((s, r) => s + Math.ceil(r.tokens / page) * page, 0);

  return (
    <section
      id="paging"
      aria-labelledby="paging-title"
      className="scroll-mt-24 rounded-card border border-line bg-card p-4 sm:p-6"
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <LabHeading id="paging" title="Pages versus reservations">
          Four live requests. A static allocator reserves each one out to a 2,048-token maximum.
          PagedAttention (§6.3) hands out fixed pages as the request grows. Outputs do not change.
          Only the wasted reservation does.
        </LabHeading>
        <ResetButton onClick={() => setPage(16)} />
      </div>
      <Field label="Page size (tokens)" value={String(page)}>
        <input type="range" min={8} max={64} step={8} value={page} onChange={(e) => setPage(Number(e.target.value))} />
      </Field>
      <div className="mt-4 space-y-3">
        {REQUESTS.map((r) => (
          <div key={r.name}>
            <div className="mb-1 flex justify-between text-sm">
              <span>Request {r.name}</span>
              <span className="tabular text-muted">{r.tokens} tokens used</span>
            </div>
            <div className="h-3 overflow-hidden rounded-full bg-paper-2">
              <div className="h-full rounded-full bg-copper" style={{ width: `${(r.tokens / max) * 100}%` }} />
            </div>
          </div>
        ))}
      </div>
      <dl className="mt-5 grid gap-3 sm:grid-cols-3" aria-live="polite">
        <Stat k="Reserved contiguous" v={reserved.toLocaleString()} />
        <Stat k="Actually used" v={used.toLocaleString()} />
        <Stat k="Paged allocation" v={paged.toLocaleString()} />
      </dl>
      <p className="mt-3 text-sm text-muted">
        Contiguous reservation holds {((1 - used / reserved) * 100).toFixed(0)}% empty. Paging cuts
        that hole to {((1 - used / paged) * 100).toFixed(0)}% internal fragmentation.
      </p>
    </section>
  );
}

function Stat({ k, v }: { k: string; v: string }) {
  return (
    <div className="rounded-2xl bg-paper px-3 py-3">
      <dt className="text-xs uppercase tracking-[0.12em] text-muted">{k}</dt>
      <dd className="font-serif text-2xl tabular">{v}</dd>
    </div>
  );
}

function CascadeLab() {
  const [dist, setDist] = useState(0.4);
  const [sparse, setSparse] = useState(0.35);
  const [quant, setQuant] = useState(0.45);
  const sum = dist + sparse + quant;
  const total = sum + 6 * dist * sparse * quant;

  return (
    <section
      id="cascade"
      aria-labelledby="cascade-title"
      className="scroll-mt-24 rounded-card border border-line bg-card p-4 sm:p-6"
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <LabHeading id="cascade" title="Composed error">
          Figure 3 is qualitative: total error much greater than the sum. The bars below are a
          teaching sketch of that interaction, not a coefficient from the paper. Each slider is an
          isolated stage error. The copper bar adds a product term, the way calibration breaks once
          earlier stages have moved the activations.
        </LabHeading>
        <ResetButton
          onClick={() => {
            setDist(0.4);
            setSparse(0.35);
            setQuant(0.45);
          }}
        />
      </div>
      <div className="mt-4 space-y-3">
        <Field label="Distillation ε" value={dist.toFixed(2)}>
          <input type="range" min={0} max={1} step={0.01} value={dist} onChange={(e) => setDist(Number(e.target.value))} />
        </Field>
        <Field label="Sparsity ε" value={sparse.toFixed(2)}>
          <input type="range" min={0} max={1} step={0.01} value={sparse} onChange={(e) => setSparse(Number(e.target.value))} />
        </Field>
        <Field label="Quantization ε" value={quant.toFixed(2)}>
          <input type="range" min={0} max={1} step={0.01} value={quant} onChange={(e) => setQuant(Number(e.target.value))} />
        </Field>
      </div>
      <div className="mt-5 space-y-2" aria-live="polite">
        <Bar label="Sum of isolated errors" width={sum / 4} tone="ink" />
        <Bar label="Stacked pipeline" width={total / 4} tone="copper" />
      </div>
      <p className="mt-3 text-sm text-muted">
        Turn any stage down to zero and the extra term vanishes — one compression, evaluated alone,
        is exactly the story each paper reports.
      </p>
    </section>
  );
}

function Bar({ label, width, tone }: { label: string; width: number; tone: "ink" | "copper" }) {
  return (
    <div>
      <div className="mb-1 flex justify-between text-sm">
        <span>{label}</span>
      </div>
      <div className="h-3 overflow-hidden rounded-full bg-paper-2">
        <div
          className={tone === "ink" ? "h-full rounded-full bg-ink" : "h-full rounded-full bg-copper"}
          style={{ width: `${Math.min(100, width * 100)}%` }}
        />
      </div>
    </div>
  );
}
