import type { Section } from "./course";

/**
 * Extra depth appended to each lesson's written notes: a worked example, a
 * comparison table, and the figure that matches the narrated lecture. Kept
 * separate from the base lesson data so the writing can grow without touching
 * the original structure.
 */
export const enrichment: Record<string, Section[]> = {
  shift: [
    {
      heading: "A worked comparison: one query, two bills",
      figure: {
        src: "/figures/shift.png",
        alt: "Two panels comparing prefill and decode: prefill is compute-bound, decode is bandwidth-bound.",
        caption: "One request, two machines. Every later pillar relieves one of these two rows.",
      },
      paragraphs: [
        "Take one request with a 2,000-token prompt and a 200-token answer on a single H100. Prefill touches the prompt once: on the order of 2 × 8B parameters × 2,000 tokens of arithmetic, and it writes 2,000 cache entries. Decode then loops 200 times, and each iteration streams the entire weight set — about 16 GB in FP16 — through the memory bus.",
        "The asymmetry is the whole argument. Prefill’s cost scales with prompt length and is paid once. Decode’s cost scales with output length and is paid per token, against a bandwidth ceiling that no amount of tensor-core throughput can lift. That is why the later pillars attack bytes and state rather than FLOPs.",
      ],
      table: {
        columns: ["phase", "work", "bytes moved", "bound by", "user metric"],
        rows: [
          ["prefill", "prompt × parameters", "weights + cache writes", "tensor cores", "TTFT"],
          ["decode, batch 1", "one token × parameters", "weights + the whole cache", "HBM bandwidth", "TPOT"],
          ["decode, batch 32", "32 tokens × parameters", "weights once, 32 caches", "compute, then capacity", "goodput"],
        ],
        caption: "The same model behaves like three different machines. Naming the bound is the first exam question.",
      },
    },
  ],
  bottlenecks: [
    {
      heading: "A worked roofline on one accelerator",
      figure: {
        src: "/figures/bottlenecks.png",
        alt: "A roofline chart: a memory-bound slope meets a flat compute roof at the ridge point.",
        caption: "The ridge point is a hardware constant. The workload’s intensity is what you can move.",
      },
      paragraphs: [
        "Put real numbers on an H100 SXM: roughly 990 TFLOP/s of dense FP16 compute and 3.35 TB/s of HBM bandwidth. The ridge point is therefore near 295 FLOP/byte. Everything to the left of that vertical line is decided by memory, not arithmetic.",
        "Batch-1 FP16 decode has intensity near 1, so the roofline caps it at about 3.35 TFLOP/s — under half a percent of peak. At batch 64 the same decode reaches an intensity near 64 and about 214 TFLOP/s. That is why batching is the first throughput lever, and why it eventually stops helping: prefill already sits on the flat roof, limited by the tensor cores.",
      ],
      table: {
        columns: ["workload", "intensity (FLOP/byte)", "attainable (TFLOP/s)", "bound by"],
        rows: [
          ["decode, batch 1, FP16", "≈ 1", "≈ 3.35", "HBM bandwidth"],
          ["decode, batch 8", "≈ 8", "≈ 27", "HBM bandwidth"],
          ["decode, batch 64", "≈ 64", "≈ 214", "approaching compute"],
          ["prefill, 2k prompt", "≈ 1,000", "≈ 990", "tensor cores"],
        ],
        caption: "Numbers for one H100 SXM at FP16. The exact peaks vary by SKU; the shape does not.",
      },
    },
  ],
  kv: [
    {
      heading: "A worked footprint, and what each lever buys",
      figure: {
        src: "/figures/kv.png",
        alt: "A bar chart of KV cache size at batch 1, 8, and 32 for a 4k context.",
        caption: "Thirty-two layers, eight KV heads, 128-dim heads, FP16: the cache scales with users, not with weights.",
      },
      paragraphs: [
        "Use the shape of an 8B model: 32 layers, 8 KV heads, head dimension 128, an 8,192-token context, and FP16 storage. Equation (5) gives 2 × 32 × 8 × 128 × 8,192 × 2 bytes, which is exactly 1 GiB for a single sequence. The weights are about 16 GB. At batch 32 the cache alone is 32 GiB — twice the weights, spent on users rather than on knowledge.",
        "Now move one term at a time. Dropping to one KV head divides the cache by eight. INT8 divides it by two, INT4 by four. A 4,096-token window halves it again. A quantized grouped-query cache is small enough that the batch, not the weights, becomes the capacity planning problem.",
      ],
      table: {
        columns: ["variant", "KV heads", "bytes/element", "cache at 8k, batch 1"],
        rows: [
          ["MHA, FP16", "32", "2", "4 GiB"],
          ["GQA, FP16", "8", "2", "1 GiB"],
          ["MQA, FP16", "1", "2", "128 MiB"],
          ["GQA + INT8", "8", "1", "512 MiB"],
          ["GQA + INT4", "8", "0.5", "256 MiB"],
        ],
        caption: "The numbers are multiplicative because they touch different factors of the same product.",
      },
    },
  ],
  architecture: [
    {
      heading: "The recall bill, in numbers",
      figure: {
        src: "/figures/architecture.png",
        alt: "A chart of recall against state size: attention is flat and high, a fixed state rises but stays below it.",
        caption: "Recall improves with state size, but no fixed state in the survey reaches full attention.",
      },
      paragraphs: [
        "A useful back-of-envelope comparison: at 8,000 tokens, one attention layer in FP16 stores roughly 8,000 × 128 × 2 × 2 bytes, about 4 MiB of K and V. A Mamba-2 layer carries a fixed state on the order of a few hundred kilobytes regardless of length. That is the efficiency win, and it is also the information loss: the state has no addressable slot for token 3,417.",
        "This is why the pillar’s claims should always be stated as a pair. A method is not “better than attention”; it is cheaper at a measurable recall cost. The survey’s own framing is a frontier, not a winner, and the open problem at the end of the course is how to move that frontier rather than pick a point on it.",
      ],
      table: {
        columns: ["family", "state per token", "decode cost", "recall"],
        rows: [
          ["softmax attention", "K and V per layer", "grows with context", "lossless"],
          ["linear attention", "d × d summary", "constant", "bounded"],
          ["Mamba / SSM", "fixed hidden state", "constant", "bounded"],
          ["hybrid (Jamba)", "attention layers only", "constant on SSM layers", "near-lossless"],
          ["MLA", "one latent per token", "grows, but smaller", "near-lossless"],
        ],
        caption: "Read the last column first: it is the price, not an afterthought.",
      },
    },
  ],
  decoding: [
    {
      heading: "A worked speculative step",
      figure: {
        src: "/figures/decoding.png",
        alt: "A timeline showing sequential decoding next to a draft, verify, and accept sequence.",
        caption: "The verifier is one target pass. The draft is only worth it when the accepted prefix is long.",
      },
      paragraphs: [
        "Suppose the drafter proposes four tokens and the target accepts each proposed token with probability α = 0.7. The expected accepted prefix is α + α² + α³ + α⁴ ≈ 1.87 tokens. One target pass then produces those 1.87 plus the resampled token, so about 2.87 tokens of output per verification pass. The ideal speedup is therefore close to 2.9× — before paying for the drafter.",
        "The arithmetic explains the empirical shape. Raise α to 0.9 and the same four-token draft yields about 3.1 accepted tokens; drop it to 0.4 and the draft barely pays for itself. It also explains why speculation fades at large batch: once the target pass is compute-bound, verifying four tokens costs close to four times a single token, and the τ multiplier no longer maps to wall-clock time.",
      ],
      table: {
        columns: ["acceptance α", "expected accepted (k = 4)", "ideal speedup", "verdict"],
        rows: [
          ["0.9", "≈ 3.10", "≈ 4.1×", "strong"],
          ["0.7", "≈ 1.87", "≈ 2.9×", "good"],
          ["0.5", "≈ 0.94", "≈ 1.9×", "marginal"],
          ["0.3", "≈ 0.42", "≈ 1.4×", "usually not worth it"],
        ],
        caption: "Expected accepted length is the geometric sum; the extra token is the resample at the first rejection.",
      },
    },
  ],
  compression: [
    {
      heading: "A worked compression budget",
      figure: {
        src: "/figures/compression.png",
        alt: "A weight row with two large outliers and a uniform grid that crushes the ordinary weights.",
        caption: "Quantization is mostly the study of a few extreme values.",
      },
      paragraphs: [
        "A 70B model is about 140 GB in FP16, 70 GB in INT8, and 35 GB in INT4. On eight 80 GB accelerators those are all possible, but the margin decides what else fits: at INT4 there is room for a large KV cache and a bigger batch; at FP16 the cache is what gets squeezed. That trade is the entire compression pillar in one sentence.",
        "The cache budget is separate and often larger in production. A long-context server at batch 32 can spend more bytes on KV state than on weights. This is why weight-only quantization is not enough, why KIVI-style cache quantization matters, and why the survey treats the quality budget as something you allocate across three pools — weights, activations, and cache — rather than one global number.",
      ],
      table: {
        columns: ["precision", "70B weights", "relative traffic", "typical role"],
        rows: [
          ["FP16", "140 GB", "1×", "reference quality"],
          ["INT8", "70 GB", "0.5×", "safe default"],
          ["INT4", "35 GB", "0.25×", "production decode"],
          ["2-bit KV cache", "—", "0.125× cache", "capacity-bound serving"],
        ],
        caption: "Memory savings multiply across pools; quality errors do not add, which is the next chapter’s warning.",
      },
    },
  ],
  systems: [
    {
      heading: "A worked serving timeline",
      figure: {
        src: "/figures/systems.png",
        alt: "Side-by-side diagrams of contiguous reservation and paged allocation of the KV cache.",
        caption: "Paging does not shrink the cache. It stops the allocator from wasting the gap between reserved and used.",
      },
      paragraphs: [
        "A 2,000-token prompt takes about 40 ms of prefill on a loaded H100; a decode step takes about 25 ms at batch 1. Time to first token is therefore roughly 40 ms plus queueing, and 200 output tokens take 200 × 25 ms = 5 s. Time per output token is 25 ms, or 40 tokens/s for that one user.",
        "Now batch 32 requests. If the step time rises to 60 ms, each user sees 16.7 tokens/s — slower per user — while the server emits about 533 tokens/s in aggregate. Neither number is wrong; they answer different questions. Goodput asks how many of those tokens met the 25 ms target, and that is the number a scheduler is actually paid to improve.",
      ],
      table: {
        columns: ["configuration", "TPOT", "per-user rate", "aggregate rate"],
        rows: [
          ["batch 1", "25 ms", "40 tok/s", "40 tok/s"],
          ["batch 8", "35 ms", "28.6 tok/s", "229 tok/s"],
          ["batch 32", "60 ms", "16.7 tok/s", "533 tok/s"],
        ],
        caption: "Illustrative numbers. The direction is the point: batching trades per-user latency for aggregate throughput.",
      },
    },
  ],
  synthesis: [
    {
      heading: "Stacking four levers on one cache",
      figure: {
        src: "/figures/synthesis.png",
        alt: "A bar chart showing the cache shrinking from 100 percent to 25, 6, and 5 percent as levers stack.",
        caption: "Each lever moves a different factor, so the savings multiply instead of competing.",
      },
      paragraphs: [
        "Start with the 1 GiB cache from the KV lesson. Grouped-query attention with eight heads instead of 32 divides it by four. An INT4 cache divides the result by four again, to 64 MiB. A 4,096-token window halves it to 32 MiB. Paging does not change that number at all — it changes how much of the 32 MiB is actually resident and how many sequences fit beside it.",
        "That is the synthesis in one worked example. The levers are independent because they touch different factors: n_kv_heads, b_bytes, s, and allocation. When a paper claims two techniques compose, check whether they touch the same factor. If they do, the second one is often re-buying a saving the first already took.",
      ],
      table: {
        columns: ["step", "term moved", "factor", "cache"],
        rows: [
          ["baseline GQA", "—", "—", "1 GiB"],
          ["32 → 8 KV heads", "n_kv_heads", "÷ 4", "256 MiB"],
          ["FP16 → INT4", "b_bytes", "÷ 4", "64 MiB"],
          ["8k → 4k window", "s", "÷ 2", "32 MiB"],
          ["paging", "allocation", "size unchanged", "32 MiB, less wasted"],
        ],
        caption: "Four levers, four different terms. This is what “they stack” means precisely.",
      },
    },
  ],
  frontiers: [
    {
      heading: "How to answer the open-problem question",
      figure: {
        src: "/figures/frontiers.png",
        alt: "Three curves showing recall falling with context length for fixed-state, hybrid, and full attention models.",
        caption: "The gap is the frontier: cheaper state buys memory, and loses the ability to point at a fact.",
      },
      paragraphs: [
        "Exam questions on this material rarely ask you to name a paper. They ask you to place a technique, or to explain why two good properties cannot yet be had together. For each frontier, the safe answer has three parts: state the trade, name the mechanism that causes it, and say what evidence would count as closing it.",
        "For recall, the mechanism is an information bottleneck: a fixed state has no addressable slot for an arbitrary past token. For exactness, it is distribution drift between draft and target. For composition, it is calibration mismatch: each stage is tuned on the model that entered it, so the next stage sees activations the previous calibration never saw. None of these is a missing trick; each is a structural constraint.",
      ],
      table: {
        columns: ["frontier", "the trade", "why it is open", "what would close it"],
        rows: [
          ["recall vs state", "constant memory vs lossless history", "a fixed state cannot address one token", "bounded memory with exact associative recall"],
          ["exact vs parallel", "speculation speedup vs drift", "acceptance collapses when drafts drift", "per-request realignment cheaper than verification"],
          ["composed compression", "stacked savings vs compounded error", "each stage recalibrates on the last model", "a composition bound that predicts joint error"],
        ],
        caption: "Three frontiers, one shape: two properties that are individually easy and jointly unsolved.",
      },
    },
  ],
};
