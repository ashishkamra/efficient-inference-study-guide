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
        "Take one request with a 2,000-token prompt and a 200-token answer on a single H100. Prefill touches the prompt once, and the arithmetic is on the order of two operations per parameter per token, so an 8-billion-parameter model performs roughly thirty-two billion floating-point operations over the prompt, while writing 2,000 cache entries along the way. Decode then loops 200 times, and each iteration streams the entire weight set, about 16 gigabytes in FP16, through the memory bus before it can compute anything at all. The prompt is read once; the weights are re-read two hundred times.",
        "The asymmetry between those two rows is the whole argument for the course. Prefill’s cost scales with prompt length and is paid once, so it benefits from anything that raises tensor-core utilization. Decode’s cost scales with output length and is paid per token, against a bandwidth ceiling that no amount of arithmetic throughput can lift, because the accelerator is waiting on bytes rather than on math. This is why the later pillars attack bytes and state rather than floating-point operations, and why a technique that only removes arithmetic can leave a decode loop exactly as slow as it was.",
        "The table makes the same point as three different machines rather than three settings of one machine. Prefill is bound by tensor cores and shows up in time to first token. Batch-one decode is bound by HBM bandwidth and shows up in time per output token. A batched decode first gains by amortizing each weight read over more sequences, then becomes compute-bound, and eventually becomes a capacity problem because every concurrent sequence owns a share of the cache. Naming which of those regimes a workload is in, and therefore which metric it moves, is the first question the survey asks of any technique.",
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
        "Put real numbers on an H100 SXM: roughly 990 teraflops per second of dense FP16 compute and 3.35 terabytes per second of HBM bandwidth. The ridge point is the ratio of the two, near 295 floating-point operations per byte, and it is a property of the hardware rather than of the model. Everything to the left of that vertical line on the roofline is decided by memory, because the machine cannot be fed fast enough to reach its arithmetic ceiling; everything to the right is decided by the compute units themselves.",
        "Batch-one FP16 decode has an operational intensity near one, so the roofline caps it at about 3.35 teraflops per second, under half a percent of the chip’s peak. Raising the batch raises intensity almost linearly at first, because the same weight read now serves more sequences: at batch 64 the intensity is near 64 and the attainable rate is about 214 teraflops per second. That is why batching is the first throughput lever in any serving stack. It is also why the lever eventually stops paying: prefill already sits on the flat roof at an intensity around a thousand, limited by the tensor cores rather than by memory.",
        "Two lessons follow from the same chart. First, the ridge point does not move when you change the model, so the only way to climb the sloped line is to increase intensity or reduce bytes per operation, which is what quantization and batching do. Second, a measurement that reports only attained throughput without the intensity leaves you unable to say which bound you hit, and therefore unable to predict whether the next optimization will help.",
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
        "Use the shape of an 8-billion-parameter model: 32 layers, 8 key-value heads, a head dimension of 128, an 8,192-token context, and FP16 storage. The footprint equation gives two, for keys and values, times 32 layers, times 8 heads, times 128 dimensions, times 8,192 positions, times 2 bytes, which is exactly one gibibyte for a single sequence. The weights of the same model are about 16 gigabytes, so one user costs a sixteenth of the model in cache. At batch 32 the cache alone is 32 gibibytes, twice the weights and spent on users rather than on knowledge, which is the moment capacity planning stops being about the checkpoint.",
        "Now move one term at a time and watch the product rather than the prose. Dropping from 32 heads to one divides the cache by 32; stopping at 8 shares it across groups and divides by four. INT8 storage divides by two, INT4 by four. Halving the window from 8,192 to 4,096 tokens halves the result again. Each lever touches a different factor, so the savings multiply rather than compete, and a quantized grouped-query cache with a bounded window is small enough that batch size, not model size, becomes the constraint on how many users a node can hold.",
        "The ordering matters for interpretation. Architectural sharing is free at inference time once the model is trained but costs quality when the head count collapses too far. Quantization is post-training and cheap to apply but spends a quality budget. A sliding window saves memory by forgetting, which is a different kind of cost because the evicted positions cannot be attended to again. Paging, the systems lever, changes none of these numbers: it changes how much of the reserved space is actually resident, which is why it appears in the table as a note rather than as a factor.",
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
        "A useful back-of-envelope comparison: at 8,000 tokens, one attention layer in FP16 stores roughly 8,000 positions times 128 dimensions times two tensors times two bytes, about four mebibytes of keys and values. A Mamba-2 layer carries a fixed state on the order of a few hundred kilobytes regardless of how long the sequence grows. That difference is the efficiency win, and it is simultaneously the information loss, because the recurrent state has no addressable slot corresponding to token 3,417 and therefore no way to retrieve that token’s content exactly when a later query asks for it.",
        "This is why the pillar’s claims should always be stated as a pair. A method is not simply better than attention; it is cheaper at a measurable recall cost, and the cost grows with how non-local the retrieval task is. The survey’s own framing is a frontier rather than a winner, and the open problem at the end of the course is how to move that frontier outward, not how to pick a comfortable point on it. Hybrids are the current compromise: they keep a small number of full-attention layers so that the addressable history survives, and they pay linear cache growth on exactly those layers.",
        "Read the last column of the table first, because it is the price rather than an afterthought. Softmax attention keeps a lossless history and pays for it linearly. Linear attention and state-space models bound the state and bound the recall with it. Hybrids sit between the two, near-lossless on retrieval but with a cache that still grows, just more slowly. Latent attention is the outlier in the other direction: it keeps a per-token record and compresses its width, so it grows with context while remaining several times smaller than the baseline.",
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
        "Suppose the drafter proposes four tokens and the target accepts each proposed token independently with probability 0.7. The expected accepted prefix is the geometric sum 0.7 plus 0.49 plus 0.343 plus 0.2401, about 1.87 tokens. One target forward pass then produces those 1.87 tokens plus the token resampled at the first rejection, so a little under 2.9 tokens of output per verification pass. The ideal speedup is therefore close to 2.9 times, before paying for the drafter’s own forward passes and before any verification overhead.",
        "The arithmetic explains the empirical shape of the technique. Raise acceptance to 0.9 and the same four-token draft yields about 3.1 accepted tokens, so the multiplier approaches the draft length and the verifier is nearly always doing useful work. Drop acceptance to 0.4 and the expected prefix collapses toward a single token, at which point the draft has cost more than it saved. This is also why speculation fades as batch size grows: once the target pass is compute-bound rather than bandwidth-bound, verifying four tokens costs close to four single-token passes in wall-clock time, and the accepted-length multiplier no longer maps onto elapsed time.",
        "Two design consequences follow directly. The draft length is a tuning parameter whose optimum depends on acceptance, because a longer draft raises the ceiling but wastes verifier capacity when the first proposal is wrong; tree-structured drafting exists to recover that wasted capacity by submitting alternatives. And acceptance is not a fixed property of the drafter but a function of the traffic, which is why production stacks retrain or adapt drafters on observed request distributions rather than shipping one checkpoint forever.",
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
        "A 70-billion-parameter model is about 140 gigabytes in FP16, 70 gigabytes in INT8, and 35 gigabytes in INT4. On eight 80-gigabyte accelerators all three fit, so the interesting question is not whether the model runs but what else fits beside it. At INT4 there is room for a large cache and a correspondingly larger batch, which raises both throughput and the number of concurrent users; at FP16 the cache is the allocation that gets squeezed, and context length or batch size has to give. That trade, between precision on the weights and capacity for the dynamic state, is the compression pillar in one sentence.",
        "The cache budget is separate and often larger in production. A long-context server at batch 32 can spend more bytes on key-value state than on the weights themselves, because the cache scales with users and context while the weights do not. This is why weight-only quantization is not enough, why cache-specific schemes such as KIVI matter, and why the survey treats quality as a budget allocated across three pools, weights, activations, and cache, rather than as one global number attached to the model. Halving the width of every pool halves the memory bill, but the pools fail in different ways when pushed too far.",
        "The traffic column is where decode lives. A memory-bound decode step streams the weights once per token, so reducing weight precision reduces the time per output token almost proportionally, provided the kernel can consume the narrow format directly rather than dequantizing back to FP16 first. The capacity column is where prefill and long context live. Keeping the two effects separate prevents a common confusion, in which a method that saves memory is assumed to save latency, or the reverse.",
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
        "A 2,000-token prompt takes roughly 40 milliseconds of prefill on a loaded H100, and a decode step takes roughly 25 milliseconds at batch one. Time to first token is therefore about 40 milliseconds plus whatever queueing the request encountered, and 200 output tokens at 25 milliseconds each take five seconds. Time per output token is 25 milliseconds, or 40 tokens per second for that single user, which is a comfortable reading speed and a terrible utilization of the machine.",
        "Now batch 32 requests on the same device. If each step rises to 60 milliseconds because the kernel now processes 32 queries, every user sees about 16.7 tokens per second, noticeably slower than before, while the server emits roughly 533 tokens per second in aggregate. Neither number is wrong; they answer different questions, and a report that quotes only one of them is a report you cannot use to make a deployment decision. This is the same tension the survey formalizes with aggregate throughput, per-user throughput, and goodput.",
        "Goodput is the number a scheduler is actually paid to improve, because it counts only the tokens that satisfied a stated service-level objective, such as a bounded time per output token. Under a 25-millisecond target, a configuration that produces 533 tokens per second at 60 milliseconds each contributes nothing to goodput for the users who miss the target, no matter how impressive the aggregate looks. The same accounting explains why paged memory and continuous batching matter even though they change no arithmetic: they let the scheduler fit more sequences into the same capacity and admit work at every step, which is what keeps the tail from dominating the average.",
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
        "Start with the one-gibibyte cache from the KV lesson and apply the levers one at a time. Grouped-query attention with eight heads instead of 32 divides it by four. An INT4 cache divides the result by four again, to 64 mebibytes. A 4,096-token window halves it to 32 mebibytes. Paging does not change that number at all, because it does not touch the footprint equation; it changes how much of the reserved space is actually resident and therefore how many sequences can be packed beside each other before the allocator starts evicting.",
        "That is the synthesis in one worked example. The levers are independent because they touch different factors of the same product: the head count from architecture, the bytes per element from compression, the sequence length from eviction policy, and the allocation strategy from systems. Savings multiply because the factors multiply, which is what the survey means when it says the axes are additive rather than exclusionary, and why a system such as QServe can deploy all four at once rather than choosing among them.",
        "When a paper claims that two techniques compose, check whether they touch the same factor before accepting the claim. If both reduce the head count, or both reduce bit-width, the second is often re-buying a saving the first already took, and the reported combined gain will be smaller than the product suggests. The residual friction in genuine composition is layout: a quantized cache must be consumable by the attention kernel in its low-bit form, and each new combination of bit-width, head sharing, and page size tends to demand a new kernel rather than reusing the old one.",
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
        "Exam questions on this material rarely ask you to name a paper. They ask you to place a technique on the taxonomy, or to explain why two individually desirable properties cannot yet be had together. For each frontier, the safe answer has three parts: state the trade in the currency of memory, latency, or quality; name the mechanism that causes the trade rather than describing the symptom; and say what evidence would count as closing it. That structure is also how the survey’s own conclusion is written, which is a hint about what it considers understanding.",
        "For recall, the mechanism is an information bottleneck: a fixed state has no addressable slot for an arbitrary past token, so the model must compress its own history and loses the ability to retrieve a specific fact. For exactness, the mechanism is distribution drift between draft and target, which collapses acceptance and turns verification into pure waste. For composition, the mechanism is calibration mismatch: each stage is tuned on the model that entered it, so the next stage sees activations the previous calibration never observed. None of these is a missing engineering trick; each is a structural constraint that a better algorithm has to work around rather than patch.",
        "That is why the three frontiers share a shape. In each case one property is easy alone and the pair is unsolved: constant memory is easy if recall is allowed to decay, exact sampling is easy if no parallelism is used, and aggressive compression is easy if only one technique is applied. The table is the compressed form of the argument, and reproducing it from the mechanism rather than from memory is the exercise the lesson is asking for.",
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
