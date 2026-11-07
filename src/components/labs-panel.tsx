import { useEffect, useMemo, useState, type ReactNode } from "react";
import {
  CartesianGrid,
  ComposedChart,
  Line,
  ReferenceDot,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
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

export function LabsPanel() {
  return (
    <div className="space-y-8">
      <header className="max-w-2xl">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-copper-deep">Labs</p>
        <h1 className="mt-2 font-serif text-4xl sm:text-5xl">Move the terms the survey names.</h1>
        <p className="mt-3 text-lg text-muted">
          Four teaching models. They follow equations (5)–(8) and the speculative acceptance model.
          They are not cluster simulators, and the cascade is qualitative on purpose.
        </p>
      </header>
      <KvLab />
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

  return (
    <section id="kv" className="scroll-mt-24 rounded-card border border-line bg-card p-4 sm:p-6">
      <h2 className="font-serif text-3xl">KV footprint</h2>
      <p className="mt-2 max-w-2xl text-sm text-muted">
        Equation (5). The leading 2 is K and V. MLA replaces both with one latent, so that factor
        drops out — the survey&rsquo;s note in §2.1, not a second copy of the same formula.
      </p>
      <div className="mt-5 flex flex-wrap gap-2">
        {PRESETS.map((p) => (
          <button
            key={p.id}
            type="button"
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
        <div className="rounded-2xl bg-paper px-4 py-4">
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

  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const data = useMemo(() => {
    const xs = [0.25, 0.5, 1, 2, 4, 8, 16, 32, 64, 128, 256, 512, 1024, 2048];
    return xs.map((oi) => ({
      oi,
      roof: Math.min(1, oi / ridge) * 100,
    }));
  }, [ridge]);

  return (
    <section id="roofline" className="scroll-mt-24 rounded-card border border-line bg-card p-4 sm:p-6">
      <h2 className="font-serif text-3xl">Roofline</h2>
      <p className="mt-2 max-w-2xl text-sm text-muted">
        An 8B GQA decode step. FLOPs are 2|θ| times batch. Bytes are the weights plus the KV cache
        from equation (5). The ridge defaults to 300 FLOP/byte, inside the &ldquo;hundreds&rdquo; the
        survey cites. The dot is your decode. Prefill would sit far to the right, on the ceiling.
      </p>
      <div className="mt-4 h-72 w-full">
        {mounted ? (
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={data} margin={{ top: 10, right: 12, left: 0, bottom: 8 }}>
              <CartesianGrid stroke="var(--color-line)" vertical={false} />
              <XAxis
                dataKey="oi"
                scale="log"
                domain={[0.2, 2200]}
                type="number"
                tick={{ fill: "var(--color-muted)", fontSize: 12 }}
                tickFormatter={(v: number) => String(v)}
                allowDataOverflow
              />
              <YAxis
                domain={[0, 100]}
                tick={{ fill: "var(--color-muted)", fontSize: 12 }}
                tickFormatter={(v: number) => `${v}%`}
                width={48}
              />
              <Tooltip
                formatter={(v) => [`${Number(v ?? 0).toFixed(1)}% of peak`, "Roofline"]}
                labelFormatter={(v) => `OI ${v} FLOP/byte`}
              />
              <Line
                type="monotone"
                dataKey="roof"
                stroke="var(--color-ink)"
                strokeWidth={2}
                dot={false}
                name="Roofline"
              />
              <ReferenceDot
                x={Math.min(2000, Math.max(point.oi, 0.25))}
                y={Math.min(100, point.attained * 100)}
                r={7}
                fill="var(--color-copper)"
                stroke="var(--color-card)"
              />
            </ComposedChart>
          </ResponsiveContainer>
        ) : (
          <div className="h-full rounded-2xl bg-paper" />
        )}
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
      <p className="mt-4 text-sm">
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

  return (
    <section id="speculative" className="scroll-mt-24 rounded-card border border-line bg-card p-4 sm:p-6">
      <h2 className="font-serif text-3xl">Speculative step</h2>
      <p className="mt-2 max-w-2xl text-sm text-muted">
        Independent acceptance with probability α, draft length γ. Expected tokens per target forward,
        including the correction sampled from the target, is (1 − α^(γ+1)) / (1 − α). Cost is γ times
        the draft&rsquo;s relative cost, plus one verification. This is the textbook reading of τ, not
        EAGLE&rsquo;s feature-level drafter.
      </p>
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
        <div>
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
    <section id="paging" className="scroll-mt-24 rounded-card border border-line bg-card p-4 sm:p-6">
      <h2 className="font-serif text-3xl">Pages versus reservations</h2>
      <p className="mt-2 max-w-2xl text-sm text-muted">
        Four live requests. A static allocator reserves each one out to a 2,048-token maximum.
        PagedAttention (§6.3) hands out fixed pages as the request grows. Outputs do not change.
        Only the wasted reservation does.
      </p>
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
      <dl className="mt-5 grid gap-3 sm:grid-cols-3">
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
    <section id="cascade" className="scroll-mt-24 rounded-card border border-line bg-card p-4 sm:p-6">
      <h2 className="font-serif text-3xl">Composed error</h2>
      <p className="mt-2 max-w-2xl text-sm text-muted">
        Figure 3 is qualitative: total error much greater than the sum. The bars below are a
        teaching sketch of that interaction, not a coefficient from the paper. Each slider is an
        isolated stage error. The copper bar adds a product term, the way calibration breaks once
        earlier stages have moved the activations.
      </p>
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
      <div className="mt-5 space-y-2">
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
