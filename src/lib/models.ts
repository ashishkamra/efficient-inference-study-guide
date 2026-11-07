/** Teaching models aligned with Nguyen (2026), §§2 and 4. Not fitted production simulators. */

export type KvInput = {
  layers: number;
  kvHeads: number;
  dHead: number;
  seq: number;
  batch: number;
  bytes: number;
  /** When set, cache stores one latent per token instead of K and V (MLA). */
  latentDim: number | null;
};

export function kvBytes(p: KvInput) {
  if (p.latentDim != null) {
    return p.layers * p.latentDim * p.seq * p.batch * p.bytes;
  }
  return 2 * p.layers * p.kvHeads * p.dHead * p.seq * p.batch * p.bytes;
}

export type RooflineInput = {
  params: number;
  weightBytes: number;
  batch: number;
  kvMoved: number;
  ridge: number;
};

export function decodeIntensity(p: RooflineInput) {
  const flops = 2 * p.params * p.batch;
  const bytes = p.params * p.weightBytes + p.kvMoved;
  const oi = bytes > 0 ? flops / bytes : 0;
  const attained = Math.min(1, p.ridge > 0 ? oi / p.ridge : 0);
  return { flops, bytes, oi, attained, bound: oi >= p.ridge ? "compute" : "memory" as const };
}

/** Independent-token acceptance model used to interpret speculative speedup. */
export function speculativeSpeedup(alpha: number, gamma: number, draftCost: number) {
  const a = Math.min(0.999, Math.max(0.001, alpha));
  const expected = (1 - a ** (gamma + 1)) / (1 - a);
  const cost = draftCost * gamma + 1;
  return { expected, cost, speedup: expected / cost };
}

export function formatBytes(n: number) {
  if (!Number.isFinite(n)) return "—";
  const units = ["B", "KB", "MB", "GB", "TB"];
  let v = n;
  let i = 0;
  while (v >= 1024 && i < units.length - 1) {
    v /= 1024;
    i += 1;
  }
  const digits = v >= 100 || i === 0 ? 0 : v >= 10 ? 1 : 2;
  return `${v.toFixed(digits)} ${units[i]}`;
}

export function formatCompact(n: number) {
  if (n >= 1e12) return `${(n / 1e12).toFixed(2)}T`;
  if (n >= 1e9) return `${(n / 1e9).toFixed(2)}B`;
  if (n >= 1e6) return `${(n / 1e6).toFixed(2)}M`;
  if (n >= 1e3) return `${(n / 1e3).toFixed(1)}k`;
  return n.toFixed(2);
}
