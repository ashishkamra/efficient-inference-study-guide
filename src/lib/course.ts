import { enrichment } from "./enrichment";

export type Check = {
  id: string;
  prompt: string;
  options: string[];
  answer: number;
  why: string;
  /** The lesson this question belongs to, used for review links and score breakdowns. */
  lessonId?: string;
};

export type Section = {
  heading: string;
  paragraphs: string[];
  formula?: { expr: string; caption: string };
  bullets?: string[];
  table?: { columns: string[]; rows: string[][]; caption?: string };
  figure?: { src: string; alt: string; caption: string };
  aside?: { kicker: string; body: string };
};

export type Lesson = {
  id: string;
  numeral: string;
  kicker: string;
  title: string;
  minutes: number;
  summary: string;
  video?: { src: string; title: string; caption: string; transcript: string[] };
  lab?: { href: string; label: string };
  sections: Section[];
  papers: string[];
  checks: Check[];
};

export const SOURCE = {
  title: "Efficient LLM Inference: A Survey",
  author: "Chien Van Nguyen",
  affiliation: "University of Oregon",
  email: "chienn@uoregon.edu",
  kind: "Area exam",
  date: "June 2026",
  id: "AREA-202606-Nguyen",
  committee: "Thien Huu Nguyen (chair), Yu Wang, Thanh Nguyen",
  url: "https://www.cs.uoregon.edu/Reports/AREA-202606-Nguyen.pdf",
};

const baseLessons: Lesson[] = [
  {
    id: "shift",
    numeral: "01",
    kicker: "Introduction",
    title: "From training to the inference stack",
    minutes: 12,
    summary:
      "Training used to be the expensive part. Serving is now. This lesson is the survey’s argument: efficiency is a co-design problem across four layers, not a bag of tricks.",
    video: {
      src: "/videos/lecture-shift.mp4?v=10",
      title: "Narrated lecture",
      caption: "Press play. The lesson is read aloud: the point being discussed stays lit, and the words being spoken are captioned on the slide.",
      transcript: [
        "The bill moved from training to serving. Training is paid once. Serving is paid on every query.",
        "Prefill and decode are different machines. Prefill reads the prompt once. Decode reads the weights for every token.",
        "Four pillars, one co-designed stack. Each pillar is defined by where it is inserted. They compose; they are not alternatives.",
        "Architecture changes what the model is. Linear attention and Mamba trade recall for state. Hybrids and MoE soften the trade.",
        "Decoding buys tokens with idle compute. A draft proposes; the target checks. One weight read can emit several tokens.",
        "Compression spends a quality budget. Fewer bits, fewer live weights. Capacity and bandwidth, paid in accuracy.",
        "Systems turn a specification into speed. Fewer bytes moved, less memory reserved. Mostly lossless: same outputs, less waste.",
        "One object ties the pillars together. Every method moves a term of the cache. Name the term and the paper has a place.",
      ],
    },
    lab: { href: "/labs#phases", label: "Compare prefill with decode" },
    sections: [
      {
        heading: "Why inference ate the budget",
        paragraphs: [
          "The deployment paradigm of large language models has shifted from pre-training to serving. In the early era of generative AI, the computational problem that mattered was training: a single, extremely expensive run whose cost could be planned and whose hardware utilization could be tuned. That picture no longer describes where the money goes. Once a model is deployed behind a real-time product, an autonomous agent loop, or a multi-step reasoning system, the cost of executing it is paid again on every request, and the aggregate footprint of inference eclipses the footprint of the training run that produced the checkpoint. The total cost of ownership of a state-of-the-art model is therefore dominated by operational inference expenditure, not by the one-time training bill.",
          "Training and inference also stress the hardware in different ways. Pre-training is highly regular and predictable, and it is usually tuned to run in a compute-bound regime where the accelerator is kept full. Inference introduces severe execution asymmetries: a parallel prompt pass followed by a sequential generation loop that reloads the model’s parameters for every token it emits. Those two bottlenecks, memory capacity and memory bandwidth, bound the throughput of a serving system and motivate every technique in the survey. Optimizing inference is consequently a cross-disciplinary problem that sits between deep-learning theory, hardware design, and distributed systems engineering, which is why the survey insists on a full-stack view rather than a catalogue of isolated tricks.",
        ],
        aside: {
          kicker: "Out of scope",
          body: "The survey deliberately skips training-time architectures, pre-training parallelism, and PEFT such as LoRA. Test-time compute scaling, multi-agent orchestration, and multimodal inference appear only when they change a physical bottleneck.",
        },
      },
      {
        heading: "Prefill is not decode",
        paragraphs: [
          "The KV cache splits the life of a serving request into two phases with sharply different execution characteristics. Prefill, or context processing, consumes the entire prompt in a single forward pass. Because all prompt tokens are available at once, the attention matrix can be materialized in full, the work is parallel across the sequence, and the phase runs with a high ratio of arithmetic to memory traffic: it is compute-bound. Decode, or generation, is the opposite. The model receives one token at a time, reads the whole historical KV cache from high-bandwidth memory into on-chip SRAM, computes attention against it, appends the new key and value pair, and writes the updated cache back. Most of the bytes moved in that loop are used exactly once, so the phase is heavily memory-bandwidth-bound.",
          "The asymmetry, not the abstract goal of making a model smaller, is the reason a serving stack exists at all. A technique that removes arithmetic can leave a bandwidth-bound decode untouched, and a technique that reduces traffic can be irrelevant to a compute-bound prefill; some changes help one phase while actively hurting the other. Production systems soften the boundary without removing it. Chunked prefill splits a long prompt into smaller compute chunks that can be interleaved with ongoing decode steps, and continuous batching admits new requests at every step rather than at batch boundaries. Both are scheduling refinements over the same two-phase model, and the survey returns to them in the systems pillar.",
        ],
      },
      {
        heading: "Four pillars, one taxonomy",
        paragraphs: [
          "The survey organizes the field by the layer at which a method is inserted into the algorithmic and system stack, not by the paper that introduced it. That choice is what turns a fragmented literature into a taxonomy: two methods that look unrelated often turn out to pull the same lever, while two methods with similar names can act on different layers and compose without interference. Figure 1 of the survey draws the result as four pillars, and each pillar is defined by what it is allowed to change.",
          "The pillars are not a menu of alternatives. The KV cache is the clearest counter-example: native architectural changes such as grouped-query attention and multi-head latent attention shrink it, quantization changes the width of each entry, paged allocation changes where the entries live, and disaggregated routing moves them across a network. A modern deployment may use all of these at once. That is why the survey groups methods by insertion point and then, in its synthesis section, traces how the groups interact rather than treating them as separate toolboxes.",
        ],
        bullets: [
          "Pillar 1 — Architectural foundations. Change what the model is: linear attention, Mamba-style state-space models, hybrids, mixture-of-experts, and native KV reductions (MQA, GQA, MLA).",
          "Pillar 2 — Decoding algorithms. Change how it runs, weights untouched: speculative decoding, diffusion language models, Jacobi and consistency iteration, dynamic early exit.",
          "Pillar 3 — Model compression. Change the bits and the density: quantization, KV-cache quantization, sparsity, distillation.",
          "Pillar 4 — Hardware and systems. Make the specification fast on silicon: FlashAttention, paged memory, continuous batching, disaggregated prefill–decode.",
        ],
      },
      {
        heading: "What “good” looks like on this exam",
        paragraphs: [
          "The exam does not reward memorizing paper titles in isolation. For every technique the survey asks the same three questions. Which physical bottleneck does it attack, meaning capacity, bandwidth, compute, or interconnect? Does it preserve the output distribution exactly, or does it spend a quality budget? And what does it cost in recall, accuracy, or engineering complexity? A method that cannot be placed on that grid has not been understood, even if its abstract is familiar, because the grid is what lets you predict whether two techniques compose or interfere.",
          "The survey repeats the mapping at the end of every pillar, and the repetition is deliberate rather than editorial laziness: it is the reading habit the course is trying to install. Pillar 1 buys capacity and bandwidth at a measured recall cost, Pillar 2 buys bandwidth and compute at a losslessness budget, Pillar 3 buys capacity and bandwidth at a quality budget, and Pillar 4 buys every bottleneck at the price of engineering complexity. Once the four sentences are automatic, a new paper can be classified from its abstract alone, and its claimed speedup can be checked against the bottleneck it actually moves.",
          "When two techniques are stacked, the same habit asks a sharper question: which term of the cache equation, or which side of the roofline, does each one move? If the answer is the same term twice, the second technique is often re-buying a saving the first already took, and the reported combined gain will fall short of the product. If the answer is two different terms, the savings multiply, and the remaining cost is usually the engineering work of making the kernels accept the combined layout. That distinction between additive savings and genuine friction is the analytical core of the later lessons.",
        ],
      },
    ],
    papers: [
      "Vaswani et al. 2017 — the decoder the whole stack still assumes",
      "Yuan et al. 2024 — prefill/decode asymmetry and the roofline framing",
      "Kwon et al. 2023 — vLLM / PagedAttention, the systems baseline",
    ],
    checks: [
      {
        id: "shift-1",
        prompt: "According to the survey, what now dominates the total cost of ownership of frontier LLMs?",
        options: [
          "The one-time pre-training run",
          "Operational inference across deployed queries",
          "Human evaluation and red-teaming",
          "Parameter-efficient fine-tuning",
        ],
        answer: 1,
        why: "Training cost is amortized over billions of queries. The survey’s opening claim is that inference expenditures dominate TCO, which is why serving — not another pre-training trick — is the subject.",
      },
      {
        id: "shift-2",
        prompt: "Which statement matches the four-pillar taxonomy?",
        options: [
          "Each pillar is an independent trick that should be chosen instead of the others",
          "Pillars are layers of one co-designed stack, organized by where a method is inserted",
          "Only hardware matters; architecture is out of scope",
          "The pillars are data, model, and system — three levels",
        ],
        answer: 1,
        why: "Section 1.3 inserts methods by layer: architecture, decoding, compression, hardware/systems. They interact. A three-level data/model/system taxonomy is a different survey, not this one.",
      },
      {
        id: "shift-3",
        prompt: "Which set of topics does the survey explicitly put out of scope?",
        options: [
          "KV-cache layout and paged attention",
          "Speculative decoding and quantization",
          "Goodput and latency SLOs",
          "Pre-training parallelism, PEFT such as LoRA, and training-time architecture search",
        ],
        answer: 3,
        why: "§1.4. The survey is about operational inference. Pre-training recipes, training parallelism, and parameter-efficient fine-tuning are deliberately excluded; test-time compute and multimodality appear only where they move a physical serving bottleneck.",
      },
    ],
  },
  {
    id: "bottlenecks",
    numeral: "02",
    kicker: "Section 2",
    title: "Bottlenecks, roofline, and the metrics that matter",
    minutes: 16,
    summary:
      "Four physical resources bound serving. The roofline model tells you which one you are actually hitting. Metrics tell you whether a speedup is real for a user.",
    video: {
      src: "/videos/lecture-bottlenecks.mp4?v=10",
      title: "Narrated lecture",
      caption: "Press play. The lesson is read aloud: the point being discussed stays lit, and the words being spoken are captioned on the slide.",
      transcript: [
        "The roofline says which resource binds. Intensity is work divided by bytes. The ridge is peak compute over bandwidth.",
        "Batch-one decode sits near one operation per byte. Two operations per parameter, two bytes. The factors cancel; the ridge does not.",
        "Four physical bottlenecks, four ceilings. Capacity caps how many users fit. Bandwidth caps how fast one user is served.",
        "Aggregate throughput can hide a bad user. Goodput counts only tokens inside the target. Time to first token is not time per token.",
        "Latency is a timeline, not a number. TTFT: queue plus prefill. TPOT: the gap between decode steps.",
        "Fast tokens outside the target are waste. Throughput counts everything. Goodput counts what met the SLO.",
        "Batching buys throughput until memory runs out. The curve flattens at the compute roof. The cache keeps growing with the batch.",
        "Three questions place any technique. Which bottleneck does it attack? Is the output exact, and what do you pay?",
      ],
    },
    lab: { href: "/labs#roofline", label: "Move a workload on the roofline" },
    sections: [
      {
        heading: "Operational intensity and the ridge",
        paragraphs: [
          "The roofline model formalizes the difference between prefill and decode with a single ratio. Operational intensity is the floating-point work a kernel performs divided by the bytes it transfers from main memory. An accelerator is characterized by two peaks: peak compute throughput, written π and measured in floating-point operations per second, and peak memory bandwidth, written β and measured in bytes per second. Their ratio defines the ridge point, the minimum operational intensity required to saturate the compute units. The attained performance of any workload is bounded by the smaller of the compute ceiling and the bandwidth line, so the ridge divides execution into two regimes.",
          "Below the ridge point a workload is memory-bound: the processor stalls waiting for weights and cache tensors to cross the memory bus, and attained performance follows the sloped line β times intensity. At or above the ridge the workload is compute-bound, and performance flattens against the peak arithmetic throughput of the silicon. Prefill sits at or above the ridge because the prompt is processed in parallel. Decode at small batch sits far below it, which is why the two phases respond to different optimizations. Figure 2 of the survey draws this picture, and equations 6 through 8 state it compactly.",
        ],
        formula: {
          expr: "OI = FLOPs / bytes\nI_ridge = π / β\nP ≤ min(π, β · OI)",
          caption: "Equations (6)–(8). The picture in Figure 2 of the survey.",
        },
      },
      {
        heading: "Why batch-1 decode is about 1 FLOP/byte",
        paragraphs: [
          "The batch-one decode number is easy to misremember because two unrelated factors of two meet there. A decode step performs roughly two operations per parameter, since one multiply-accumulate counts as two floating-point operations. At the same time it moves roughly two bytes per parameter, because each FP16 weight is loaded once and occupies two bytes. The factors happen to cancel, giving an operational intensity near one operation per byte. One factor comes from the arithmetic of a MAC; the other comes from the storage width of FP16. They are not the same fact, and treating them as one is the usual mistake.",
          "Changing the numeric format moves only the byte side. At INT8 the byte cost halves and operational intensity doubles; at INT4 it doubles again, while the MAC count is unchanged. That still leaves decode orders of magnitude below the compute ceiling, because modern accelerators have ridge points in the hundreds of operations per byte. Closing the gap is the shared project of several pillars: raising the effective batch size amortizes each weight read over more tokens, fusing kernels removes redundant traffic, and reducing per-step bytes moves the workload up the sloped line. None of those changes the ridge itself.",
        ],
        aside: {
          kicker: "Do not mix the twos",
          body: "Students often treat “2 FLOPs and 2 bytes” as one fact. The survey explicitly separates them. Change the dtype and only the byte factor moves.",
        },
      },
      {
        heading: "Four bottlenecks, and who owns them",
        paragraphs: [
          "Four physical resources bound serving, and each one sets a different ceiling. Memory capacity determines the largest model and the largest concurrent batch that fit on an accelerator. When static parameters plus the dynamic KV cache exceed onboard memory, the serving instance either fails outright or offloads state to host RAM or disk, and throughput falls by orders of magnitude. Capacity is therefore the dominant constraint on how many users a deployment can serve at once. Architectural state reductions, weight and cache quantization, paged allocation, and offloading all attack this ceiling from different layers.",
          "Memory bandwidth bounds the other direction: the rate at which weights and cache tensors stream from high-bandwidth memory sets the latency of a single generated token, so it is the dominant constraint on per-user speed. Compute throughput bounds prefill and large-batch decode, and it is increasingly shaped by the numeric format rather than by the raw operation count, because low-precision and structured-sparse kernels expose higher peak rates. Interconnect bandwidth, whether NVLink inside a node or RDMA across nodes, limits sharding strategies and determines whether disaggregated prefill and decode are feasible. Numerical format support cuts across both, since accelerators expose their highest throughput only when the kernel matches the hardware’s data movement and layout requirements. Table 1 maps each bottleneck to the pillars that address it.",
        ],
        bullets: [
          "Memory capacity — Pillars 1, 3, 4. MLA, GQA, KV quantization, paged attention, host offload.",
          "Memory bandwidth — Pillars 1, 2, 4. MQA/GQA, speculative decoding, FlashAttention, fusion.",
          "Compute throughput — Pillars 2 and 3. Speculation spends idle tensor cores; quantization and 2:4 sparsity raise peak throughput.",
          "Interconnect and numerics — Pillar 4. Disaggregated prefill–decode, FP8 kernels, tensor and pipeline parallelism.",
        ],
      },
      {
        heading: "Metrics, in four families",
        paragraphs: [
          "A good average can hide a bad user experience, so the survey fixes a vocabulary before comparing techniques. Aggregate throughput counts every token produced across all concurrent streams; it measures deployment efficiency and can look healthy while individual requests wait. Per-user throughput is the generation rate a single request actually experiences, and the two can diverge sharply under heavy batching. Goodput, introduced by DistServe, counts only the tokens that satisfy a service-level objective, such as a bounded per-token latency, and is therefore the honest capacity metric. For latency, time to first token covers queueing plus prefill, while time per output token covers the decode loop and is dominated by memory bandwidth and cache size.",
          "The remaining families make the other pillars measurable. Speculative methods are judged by mean accepted length, the average number of draft tokens validated per target pass, together with the per-token acceptance rate; the end-to-end speedup is essentially accepted length minus verification overhead. Compression is judged by the KV compression ratio relative to an uncompressed FP16 baseline, parameter footprint, perplexity, and downstream accuracy. Prefix-aware systems add KV-cache hit rate, the fraction of prompt tokens whose state is reused rather than recomputed. Cost-efficiency in tokens per dollar or per joule has become common in industrial comparisons, and every lossy technique is ultimately judged against quality preservation.",
        ],
      },
    ],
    papers: [
      "Yuan et al. 2024 — roofline of LLM serving",
      "Zhong et al. 2024 — goodput under SLOs (DistServe)",
      "Zheng et al. 2024 — RadixAttention and prefix hit rate",
    ],
    checks: [
      {
        id: "bot-1",
        prompt: "At batch size 1 and FP16, decode operational intensity is about 1 FLOP/byte because…",
        options: [
          "Attention is skipped during decode",
          "≈2|θ| FLOPs (one MAC per parameter) meet ≈2|θ| bytes of FP16 weights, and the two factors of two are unrelated",
          "The KV cache is stored in SRAM",
          "The ridge point of an H100 is 1",
        ],
        answer: 1,
        why: "Section 2.3. One 2 is the MAC (two FLOPs). The other is the FP16 storage width. INT8/INT4 change only the byte side, so OI doubles each time you halve the width.",
      },
      {
        id: "bot-2",
        prompt: "Which metric is dominated by the decode phase?",
        options: [
          "Time-to-first-token",
          "Time-per-output-token",
          "Prefill FLOPs on the prompt",
          "Training tokens per day",
        ],
        answer: 1,
        why: "TTFT is prefill and queueing. TPOT is the per-token latency while generating, dominated by memory bandwidth and KV-cache size.",
      },
      {
        id: "bot-3",
        prompt: "Which metric counts only the tokens that actually meet a latency SLO?",
        options: [
          "Aggregate tokens per second",
          "Time to first token",
          "Mean accepted length τ",
          "Goodput",
        ],
        answer: 3,
        why: "§2.5, DistServe’s framing. Aggregate throughput can look healthy while most requests miss their deadline. Goodput discounts those, so it is the honest capacity metric. TTFT and τ measure one phase or one decoding trick, not delivered service.",
      },
    ],
  },
  {
    id: "kv",
    numeral: "03",
    kicker: "Section 2.1",
    title: "Autoregression and the KV cache",
    minutes: 14,
    summary:
      "The cache is the ledger of the whole survey. Equation (5) is the one formula to be able to manipulate cold: every later pillar pulls a different term.",
    video: {
      src: "/videos/lecture-kv.mp4?v=10",
      title: "Narrated lecture",
      caption: "Press play. The lesson is read aloud: the point being discussed stays lit, and the words being spoken are captioned on the slide.",
      transcript: [
        "Autoregression turns history into memory. One new query attends over every past key. Recompute is quadratic; reuse is linear.",
        "The cache has a formula you can manipulate cold. Six factors, one for each lever. The leading two is keys versus values.",
        "Every pillar pulls a different term. GQA moves the head count. Quantization moves the bytes.",
        "A worked example makes the size real. 32 layers, 8 KV heads, 128-dim heads. The weights never change; the users do.",
        "Latent attention stores a code, not a pair. One low-rank vector per token. Keys and values are rebuilt in the kernel.",
        "Prefill writes; decode reads and appends. Prefill fills every prompt position at once. Each decode step adds one pair.",
        "Eviction is a recall decision. A window caps the length term. The dropped token cannot be recovered.",
      ],
    },
    lab: { href: "/labs#kv", label: "Compute a cache footprint" },
    sections: [
      {
        heading: "The generation the cache exists to avoid",
        paragraphs: [
          "Standard foundation models are causal, decoder-only Transformers that factorize the probability of a token sequence with the chain rule. At every layer, multi-head attention projects the hidden states into queries, keys, and values with learned matrices, and causal softmax attention mixes them under a lower-triangular mask. During autoregressive decoding only one new query vector is produced per step, and that query attends over the keys and values of every preceding position. Recomputing those tensors from scratch at each step would cost quadratic work in the sequence length, because the whole history would be projected again for every new token.",
          "The KV cache removes that redundancy. The engine keeps the historical keys and values in high-bandwidth memory and appends the new pair at every step, which reduces the per-step complexity of the sequence mixer from quadratic to linear in the sequence length. The price is a spatial cost that grows without bound. For one sequence, the cache footprint is two times the number of layers, times the number of KV heads, times the head dimension, times the sequence length, times the batch size, times the storage width per element. The leading two accounts for the separate key and value tensors. The formula makes the survey’s two principal levers explicit: reduce the number of KV heads through architecture, or reduce the bytes per element through quantization.",
          "Multi-head latent attention does not fit that accounting, and the survey is careful about it. Instead of storing keys and values as separate tensors, DeepSeek-V2 and V3 store a single low-rank latent vector per token and reconstruct both tensors at attention time, so the head structure and effective storage width differ from the baseline formula. The survey keeps the standard equation as the canonical reference and treats latent attention as a structural modification analyzed in the architecture pillar. That is also why the cache is the right object to organize the course around: every pillar changes it in a different way.",
        ],
        formula: {
          expr: "S_kv = 2 · n_layers · n_kv_heads · d_head · s · b · b_bytes",
          caption:
            "Equation (5). The leading 2 is K versus V. b_bytes is 2 for FP16/BF16, 1 for FP8/INT8, 0.5 for INT4.",
        },
      },
      {
        heading: "Which pillar pulls which term",
        paragraphs: [
          "The sentence to remember from this section is that every pillar pulls a different term of the same ledger. Architectural head sharing reduces the number of key-value heads: multi-query attention collapses them to one and costs quality, grouped-query attention interpolates by sharing keys and values across groups of query heads, and latent attention replaces the stored tensors with a single low-rank vector per token. Quantization reduces the storage width per element, with cache-specific schemes pushing it down to two or three bits. Eviction and sliding windows reduce the effective sequence length by deciding which positions remain addressable. Batch size raises throughput but multiplies the cache, which is why capacity and scheduling are studied together rather than separately.",
          "The accounting is what makes the survey’s claim of additivity precise. Because the footprint is a product of independent factors, a factor touched by one pillar is untouched by the others, so four levers applied together yield roughly the product of their individual savings rather than the maximum of them. That is also the reason a technique’s layer matters more than its name: two methods that both reduce the head count will not compose as advertised, while a head-sharing scheme and a bit-width scheme always will, at least in the arithmetic.",
          "The one entry that does not fit is latent attention, and the survey is careful about it. It does not merely store the same tensors more narrowly; it stores a different object, a per-token latent from which keys and values are reconstructed at attention time, so its head structure and effective width do not map onto the baseline formula cleanly. It is therefore analyzed as an architectural modification rather than as a compression factor. The cache is nonetheless the right object to organize the course around, because every pillar changes it in a way that can be stated, and the differences between those statements are the taxonomy.",
        ],
        bullets: [
          "MQA sets n_kv_heads = 1. GQA sits between MQA and full multi-head attention. Both are Pillar 1.",
          "MLA (DeepSeek-V2/V3) stores one low-rank latent per token and reconstructs K and V at attention time. The factor-of-two layout no longer applies. The survey keeps equation (5) as the baseline and analyzes MLA in §3.",
          "Paging (Pillar 4) does not shrink the formula. It stops you from reserving the maximum s up front and fragmenting the rest.",
        ],
      },
      {
        heading: "Prefill, decode, and the blur",
        paragraphs: [
          "Prefill writes the cache for the whole prompt in one pass. Because all prompt tokens are processed together, the work is parallel and compute-bound, and the cache for every position is produced at once. Decode then reads the history back from high-bandwidth memory, computes attention for one new query, appends one key and value pair, and writes the updated cache. Almost every byte read in that loop is used once per step, which is exactly the definition of a bandwidth-bound workload. The cache is therefore both the reason decode is cheap in compute and the reason it is expensive in memory.",
          "Production systems blur the textbook split without changing the underlying object. Chunked prefill, introduced by Sarathi-Serve, slices a long prompt into smaller compute chunks so that decode steps from other requests can be interleaved. Continuous batching, introduced by Orca, admits new requests at every step instead of waiting for a batch boundary, and retires finished sequences immediately. Both are scheduling policies in the systems pillar, and both operate on the same cache described by the footprint equation. The blur matters for analysis: a measurement that mixes the phases can attribute a decode stall to prefill compute, or the reverse.",
        ],
      },
    ],
    papers: [
      "Shazeer 2019 — multi-query attention",
      "Ainslie et al. 2023 — grouped-query attention",
      "DeepSeek-AI 2024a — multi-head latent attention",
    ],
    checks: [
      {
        id: "kv-1",
        prompt: "In equation (5), the leading factor of 2 accounts for…",
        options: [
          "Two FLOPs per MAC",
          "Distinct key and value tensors",
          "Prefill and decode",
          "FP16’s two bytes",
        ],
        answer: 1,
        why: "K and V are stored separately in the standard MHA/GQA layout. The MAC’s factor of two and the FP16 byte width show up in the roofline discussion, not in this leading 2. MLA abandons the assumption.",
      },
      {
        id: "kv-2",
        prompt: "Switching from multi-head attention to grouped-query attention changes which term?",
        options: ["b_bytes", "n_kv_heads", "n_layers", "The ridge point π/β"],
        answer: 1,
        why: "GQA shares keys and values across groups of query heads, so fewer KV heads are stored. Quantization is what changes b_bytes. The ridge point is a hardware ratio, not a cache term.",
      },
      {
        id: "kv-3",
        prompt: "Eviction policies and sliding windows reduce which term of equation (5)?",
        options: ["n_layers", "b_bytes", "The effective sequence length s", "n_kv_heads"],
        answer: 2,
        why: "§2.1 and the architecture pillar. H2O, StreamingLLM, and sliding windows keep fewer past positions, so the cache behaves as if s were shorter. Paging does not change this count; it only changes how memory is allocated.",
      },
    ],
  },
  {
    id: "architecture",
    numeral: "04",
    kicker: "Pillar 1 · §3",
    title: "Architectural foundations",
    minutes: 18,
    summary:
      "Change the model itself. Every family here either deletes the cache, shrinks it, sparsifies access to it, or hybridizes so recall survives. The bill is always recall.",
    video: {
      src: "/videos/lecture-architecture.mp4?v=10",
      title: "Narrated lecture",
      caption: "Press play. The lesson is read aloud: the point being discussed stays lit, and the words being spoken are captioned on the slide.",
      transcript: [
        "Attention pays in memory; state pays in recall. Softmax keeps a lossless history. A fixed state cannot.",
        "Linear attention keeps a summary. A d by d matrix replaces the cache. The update cost ignores sequence length.",
        "Mamba makes the recurrence selective. The transition depends on the input. Constant time per decode step.",
        "Recall tracks state size, almost monotonically. The gap narrows but does not close. No fixed-state model matches softmax.",
        "Put the families side by side. State per token is the axis that matters. Every family sits somewhere on it.",
        "Experts cut compute, not state. A router activates a few experts. Every expert still occupies memory.",
        "The cache can shrink inside a transformer. MQA saves the most and costs quality. GQA is the production default.",
        "The recall-efficiency frontier is still open. Cheaper memory moves left. Lossless recall moves right.",
      ],
    },
    sections: [
      {
        heading: "Subquadratic mixers",
        paragraphs: [
          "Architectural foundations are the most fundamental lever in the survey, because a change here alters what the model is rather than how it is executed, compressed, or served, and it propagates into every other pillar. Softmax attention has two structural costs at inference: compute that is quadratic in the sequence length during prefill, and a KV cache whose state grows linearly with every token that is generated. Subquadratic sequence mixers attack both by replacing softmax with an operation whose state is bounded by a constant. The oldest line is linear attention, which removes the softmax nonlinearity and factors attention through a kernel feature map. The rewritten expression keeps a running d-by-d summary matrix and a d-dimensional normalizer, both of which update in quadratic time in the feature dimension per step, independently of the sequence length, so the KV cache is replaced by a fixed-size state. Performer chooses the feature map to approximate softmax in expectation, Linformer compresses the key and value dimensions, and RetNet adds a decay term that turns the summary into a proper recurrence. The persistent shortcoming is recall: a single summary cannot losslessly remember arbitrary content, and retrieval-heavy benchmarks consistently show a gap to softmax.",
          "State-space models approach the same goal from classical signal processing. S4 introduced structured state-space layers parameterized by a continuous-time recurrence that can be unrolled as a convolution during training and as a recurrence during autoregressive decoding; S5 simplified the construction to a single parallel scan. The decisive step was Mamba, which made the recurrence selective by letting the transition matrices depend on the current input. The state remains fixed in size, decoding costs constant time per step, and a hardware-aware parallel scan keeps training competitive with FlashAttention. Mamba-2 then unified state-space models and linear attention under a structured state-space duality, and RWKV reached a similar point by framing transformer-style mixing as a learned recurrent network.",
          "A cluster of recent architectures revisits the gated recurrent network through a modern lens. Gated linear attention and the delta-rule family expose data-dependent gates over the linear-attention state, while HGRN, xLSTM, and Griffin build gated recurrences with state expansion. TTT and Titans go further and treat the hidden state itself as a small model trained at test time on the current sequence. Their shared engineering target is a recurrent state large enough to support recall yet bounded in size, so that decoding stays constant-time. Arora and colleagues make the resulting tradeoff explicit: across architectures, recall accuracy on associative tasks tracks recurrent state size almost monotonically, and no fixed-state model in the survey matches softmax on heavy in-context retrieval. That gap is the central open problem of the pillar and the motivation for hybrid stacks.",
        ],
        formula: {
          expr: "h_t = Ā_t h_{t−1} + B̄_t x_t ,   y_t = C_t h_t",
          caption: "Mamba’s selective recurrence, equation (10). (Ā_t, B̄_t, C_t) depend on x_t. h_t has fixed size.",
        },
      },
      {
        heading: "Hybrids, MoE, and linearization",
        paragraphs: [
          "Pure subquadratic mixers solve the cost side of the ledger but underperform on recall, and hybrid stacks restore it by interleaving a small minority of full-attention layers among a majority of subquadratic ones. The design rests on an empirical finding: only a small fraction of attention layers carry the heads that matter for retrieval. Jamba uses one attention layer for every seven Mamba layers and adds mixture-of-experts; Samba, Hymba, Zamba, and Nemotron-H explore variants of the same recipe. Falcon-Mamba pushes in the attention-free direction, MiniMax-01 scales lightning attention with sparse softmax layers to 456 billion parameters, and StripedHyena substitutes Hyena convolutions for the subquadratic block. Taipan introduces selective attention layers that operate only on a learned subset of tokens, reaching Transformer-level recall with a constrained attention budget out to million-token contexts. The recurring result is that a small minority of attention layers is sufficient: hybrids retain near-Transformer quality while collapsing the cache to the few layers that still need it.",
          "Mixture-of-experts changes a different quantity: it reduces per-token compute rather than per-token state. Each feed-forward block is replaced by N parallel experts plus a router that selects the top-k experts for every token, which decouples the activated parameter count from the total parameter count. GShard and Switch Transformer established the modern formulation, GLaM demonstrated dense-quality scaling at a fraction of the inference FLOPs, and Mixtral 8×7B popularized the open-weights recipe. DeepSeekMoE introduced fine-grained experts with a shared-expert backbone, scaled in DeepSeek-V2 and V3 to 236 billion and 671 billion total parameters with 21 billion and 37 billion activated. Routing has evolved alongside the models: top-k token-choice routing needs auxiliary load-balancing losses, expert-choice routing inverts the assignment to bound each expert’s load, soft MoE replaces hard selection with weighted mixing, and later work removes the auxiliary loss by adjusting routing biases online. For inference, MoE introduces a capacity problem, because every parameter must still reside somewhere even though only a few experts run per token; Mixtral-Offload and pre-gated MoE use offloading and look-ahead expert prefetching, and PowerInfer exploits skewed activations by keeping hot experts on the GPU and cold ones on the CPU.",
          "Cross-architecture linearization avoids pretraining a subquadratic model from scratch by converting an existing Transformer through targeted distillation, typically on a small fraction of the original token budget. T2R first showed that pretrained Transformers could be finetuned into RNNs for translation, and SUPRA and LoLCATs scaled the idea to modern language models by replacing softmax with linear-attention variants and finetuning. Hedgehog learns a feature map that mimics softmax in expectation; MOHAWK distills a Transformer into a Mamba-style state-space model by aligning attention matrices and hidden states across a three-stage curriculum, and Llamba extends that to larger scale. Mamba-in-the-Llama produces hybrid Mamba-attention models from a Llama teacher, RADLADS converts 7B to 72B Qwen models into RWKV-variant linear-attention models with only 350 to 700 million distillation tokens, and Lizard adds a learnable gating module for adaptive memory control and constant-memory inference. The unresolved question across the line is how much of the teacher’s recall survives in the converted student, and at what token budget.",
        ],
      },
      {
        heading: "KV state, without leaving the Transformer",
        paragraphs: [
          "Even inside a standard Transformer, the cache can shrink by changing how it is shared, what it stores, and what it keeps. Multi-query attention collapses all key and value heads into one, reducing the head count in the footprint equation to one but causing measurable quality loss. Grouped-query attention interpolates between full multi-head attention and multi-query attention by sharing keys and values across groups of query heads, and it is now standard in Llama-2, Llama-3, and most production models. Multi-head latent attention goes further and replaces stored keys and values with a single low-rank latent vector per token, from which both are reconstructed at attention time; the cache stores only that vector, whose dimension is much smaller than heads times head dimension, yielding multi-fold compression with quality on par with full attention. Cross-layer variants share the cache across depth as well: Cross-Layer Attention shares keys and values between adjacent layers, YOCO caches once globally and reuses the result across upper decoder layers, Goldfinch combines RWKV-style prefill with extreme compression in a small attention head, and LCKV condenses cache layers through learnable interpolation.",
          "A second family observes that many cached tokens contribute almost nothing to future attention and can be dropped or selected dynamically. H2O keeps a small set of heavy-hitter tokens, SnapKV predicts the relevant prefix from observation windows, and StreamingLLM retains a few attention sinks, often the first tokens, plus a sliding window, which allows indefinitely long streams. Scissorhands exploits the persistence of high-importance positions, FastGen chooses an eviction policy per head, PyramidKV and PyramidInfer allocate a smaller budget to deeper layers because attention becomes more focused with depth, and Quest and MagicPIG make eviction query-aware by retrieving the relevant page or bucket on demand. RazorAttention and DuoAttention identify retrieval heads that must keep full state while compressing the rest, ThinK prunes individual key dimensions, and Ada-KV adapts the budget across heads. InfLLM and LM-Infinite extend pretrained context windows without retraining by combining sliding windows with attention sinks, and MInference accelerates million-token prefill with dynamic sparse patterns.",
          "These methods sit on top of an older line of sliding-window baselines. Longformer and BigBird restricted attention to a local window plus a few global tokens, Mistral ships a sliding window as its default, and LongNet dilates the window to subquadratic scales. The modern eviction policies inherit their intuitions but add a decision about which positions are worth keeping, sometimes per head and sometimes per query. What the whole family shares is the same price: once a fact has been evicted, no later attention head can recover it, so every saving in state has to be judged by what the model forgets.",
        ],
        formula: {
          expr: "c_t = W_DKV h_t\nk_t = W_UK c_t ,   v_t = W_UV c_t",
          caption: "MLA, equation (11). The cache stores c_t only.",
        },
        aside: {
          kicker: "What this pillar buys",
          body: "Capacity and bandwidth. A smaller KV state means more concurrent users and faster single-stream decode. Quantization and serving compose with it. The price is recall — the Pareto in §8.1.",
        },
      },
    ],
    papers: [
      "Gu & Dao 2024 — Mamba",
      "Lieber et al. 2025 — Jamba (attention:Mamba ≈ 1:7, plus MoE)",
      "Arora et al. 2024 — recall tracks recurrent state size",
      "Ainslie et al. 2023 / DeepSeek-AI 2024a — GQA and MLA",
    ],
    checks: [
      {
        id: "arch-1",
        prompt: "What is the central cost of replacing softmax attention with a fixed recurrent state?",
        options: [
          "Decode becomes quadratic",
          "Associative recall degrades as state size stops growing with context",
          "The KV cache must be stored twice",
          "Training can no longer be parallelized under any scan",
        ],
        answer: 1,
        why: "§3.1 and §8.1, via Arora et al.: recall on associative tasks tracks state size. Mamba’s scan keeps training competitive; the inference win is O(1) stepping. The loss is memory of arbitrary past content.",
      },
      {
        id: "arch-2",
        prompt: "DeepSeek-V2/V3 MoE is best summarized as…",
        options: [
          "A dense model with 4-bit weights",
          "Hundreds of billions of total parameters, tens of billions activated per token",
          "One shared KV head and no experts",
          "A diffusion language model",
        ],
        answer: 1,
        why: "The survey cites 236B and 671B total parameters at 21B and 37B activated, using fine-grained experts plus a shared expert. Activation sparsity is not the same thing as quantization or MQA.",
      },
      {
        id: "arch-3",
        prompt: "How does mixture-of-experts change the serving bill?",
        options: [
          "It shrinks the KV cache in proportion to the number of activated experts",
          "It removes the need for attention and therefore the cache",
          "It cuts per-token compute while per-token KV state and total parameter storage stay",
          "It guarantees a fixed-size recurrent state with full recall",
        ],
        answer: 2,
        why: "§3.3. A router activates top-k experts, so FLOPs per token fall, but all experts must still live somewhere and each token still has its KV state. MoE is a compute-side win, not a cache-side one.",
      },
    ],
  },
  {
    id: "decoding",
    numeral: "05",
    kicker: "Pillar 2 · §4",
    title: "Decoding algorithms",
    minutes: 16,
    summary:
      "Leave the weights alone. Spend idle tensor cores so that one sequential read of the weights can emit more than one token. The dividing line is whether the output distribution stays exactly the target’s.",
    video: {
      src: "/videos/lecture-decoding.mp4?v=10",
      title: "Narrated lecture",
      caption: "Press play. The lesson is read aloud: the point being discussed stays lit, and the words being spoken are captioned on the slide.",
      transcript: [
        "One weight read can emit several tokens. Draft cheaply, verify in parallel. The sequential chain becomes a batch.",
        "Keep the longest valid prefix. Accept until the first mismatch. Resample at that position.",
        "The acceptance rule is what makes it exact. Accept with probability min(1, p/q). Otherwise sample from the residual.",
        "Speculation wins in the latency regime. Speedup tracks accepted length. Large batches erase the win.",
        "Drafters differ in where they get the draft. The target can draft from itself. Lookup wins when input and output overlap.",
        "Diffusion denoises a block in parallel. No left-to-right order. Independence assumptions make it lossy.",
        "Early exit can become a drafter. Leave before the last layer when confident. Layer Skip verifies with the full model.",
        "Sort decoders by exactness first. Exact methods keep the target distribution. Approximate methods buy parallelism.",
      ],
    },
    lab: { href: "/labs#speculative", label: "Estimate a speculative speedup" },
    sections: [
      {
        heading: "Speculative decoding",
        paragraphs: [
          "Speculative decoding is the dominant production technique in the decoding pillar. A cheap draft model proposes a short sequence of candidate tokens, typically denoted gamma, and the expensive target model verifies all of them in a single parallel forward pass. The verifier accepts the longest prefix whose conditional distribution matches the target’s and resamples at the first mismatch. A carefully designed acceptance rule preserves the target’s output distribution exactly, so the technique is lossless in the sense that the marginal distribution of the generated text is unchanged. The end-to-end speedup is approximately the mean accepted length minus verification overhead. In the memory-bound regime the target’s parallel pass over the draft costs roughly the same wall-clock time as a single-token pass, so each successful draft amortizes one expensive weight read across several emitted tokens.",
          "The first generation of methods used a separately trained small model as the drafter, which works but requires maintaining a second checkpoint. Self-speculative methods eliminate it. Medusa attaches several lightweight prediction heads to the target’s final hidden state, Hydra makes those heads sequentially dependent, and EAGLE drafts at the feature level rather than the token level, exploiting the fact that the next-token feature is far less uncertain than the next-token sample. EAGLE-2 adds dynamic draft trees that adapt their depth to context difficulty, EAGLE-3 introduces training-time test to scale the technique, and Kangaroo achieves lossless self-speculation through double early exiting from the same model. Draft and Verify skips intermediate layers to obtain a free drafter, REST retrieves candidate continuations from a datastore, and prompt lookup drafting is the minimal version of the idea and remains a strong baseline when input and output overlap, as they do in code edits and summarization. Online speculative decoding continually adapts the drafter to the workload’s distribution.",
          "A flat draft wastes the verifier’s parallel capacity whenever the first mismatched position appears early, so tree-structured drafting submits multiple alternative continuations at each position and accepts the longest valid path. SpecInfer introduced token-level trees, Sequoia optimizes the tree topology to remain robust across acceptance rates and hardware budgets, and EAGLE-2 and EAGLE-3 use dynamic trees whose shape adapts at inference time. SpecExec pushes tree-structured speculation into the offload regime, making interactive 70B-class inference feasible on consumer GPUs, and lookahead decoding dispenses with an explicit drafter by maintaining an n-gram pool gathered from earlier steps. Speculation also interacts with batching in a way that decides where it is worth deploying: at large batch sizes the target is already closer to compute-bound, so the wall-clock savings from accepted length shrink. That makes the technique most attractive for low-batch, latency-sensitive workloads such as chat and code completion, and it explains why production stacks co-train drafters on observed traffic when the prompt distribution drifts.",
        ],
        aside: {
          kicker: "Production catch",
          body: "Large batches shrink the win, because verification is no longer “free” relative to a saturated target. Acceptance also falls when traffic drifts from the drafter’s data, which is why online speculative decoding keeps retraining the drafter on observed traffic.",
        },
      },
      {
        heading: "Diffusion, Jacobi, early exit",
        paragraphs: [
          "A more radical alternative abandons left-to-right autoregression during generation entirely. Diffusion language models produce text by iteratively denoising a fully masked sequence, treating the entire output as parallel positions that are refined over a small number of steps. The line runs from D3PM, which formalized discrete diffusion in absorbing-state spaces, and Diffusion-LM, which demonstrated controllable generation in a continuous latent space, through SEDD and MDLM, to LLaDA at 8B parameters and DiffuLLaMA, which adapts pretrained autoregressive checkpoints. Inception Labs’ Mercury shows the approach reaching production throughput on code generation. The appeal is that generation latency need not track sequence length, because the model updates a whole block in parallel. The cost is an architectural assumption: tokens inside an unmasked block do not condition on each other’s realized values during a parallel pass, so unmitigated diffusion can suffer compositional drift over long horizons, with compounding errors on reasoning-heavy tasks. Orthrus is the survey’s hybrid answer, pairing a trainable diffusion head with a frozen autoregressive backbone over a single shared KV cache and adding consensus verification.",
          "Jacobi decoding keeps the autoregressive structure but solves several future positions jointly through fixed-point iteration. All future positions are updated simultaneously from the current guesses, and for greedy decoding the iteration converges to the same fixed point as sequential decoding, typically in fewer steps than there are positions. The difficulty is that vanilla models are not trained for the iteration, so convergence is slow; consistency language models fix that by fine-tuning with a consistency objective that teaches the model to reach the fixed point in fewer iterations. Lookahead decoding uses a Jacobi-style update to populate an n-gram cache that then feeds speculative verification, and blockwise parallel decoding is the classical predecessor of the idea. Skeleton-of-Thought parallelizes at a higher level: the model generates an outline and then expands its points in parallel, trading some coherence for a large wall-clock reduction on structured answers. Jacobi-family methods are lossless when the iteration reaches the greedy fixed point but lossy in expectation under sampling.",
          "Dynamic early exit leaves the model before its final layer when the next-token prediction is already confident. Confident Adaptive Language Modeling attaches per-layer classifiers and exits at the earliest layer whose prediction passes a threshold, reporting roughly a 2× speedup with minimal quality loss at T5 scale. LayerSkip co-trains with stochastic layer dropout so that early-exit predictions are accurate by construction, then pairs the early exit as a drafter with the full model as a verifier, which makes the technique lossless while keeping the speedup. SkipDecode extends the idea to batched inference by assigning per-token exit depths in a way that preserves regular tensor shapes, and Kangaroo unifies double early exit with self-speculation. Early exit composes naturally with speculative decoding and with hybrid architectures, because both already expose shallow representations that make cheap drafters.",
        ],
      },
      {
        heading: "The bill",
        paragraphs: [
          "Pillar 2 attacks memory bandwidth by amortizing each sequential weight read across multiple emitted tokens, and it secondarily attacks compute throughput by putting otherwise idle tensor cores to work on verification. Capacity is essentially untouched, because the weights and the cache are the same size as before; a speculative decoder does not let you serve a larger model or a longer context, only a faster stream. That is why the pillar is described as a decoding lever rather than a model lever, and why it composes so cleanly with the compression and architecture work that does change capacity.",
          "The price is paid in two currencies. The first is additional compute: every rejected draft token is wasted work, and the verifier runs at draft-sequence length rather than at length one, so the arithmetic performed per accepted token rises even as the wall-clock time per token falls. The second is a losslessness budget. Speculative decoding and self-speculative schemes such as LayerSkip preserve the target’s output distribution exactly, while diffusion, sampled Jacobi iteration, and skeleton-of-thought methods produce different distributions and must be evaluated against task quality instead of against exactness.",
          "Identifying which workloads tolerate which kind of loss, and how that boundary moves as drafters improve, is a recurring open question in the survey. Chat and code completion tolerate a great deal if the latency improves, while structured reasoning and long-form factual work do not. The pillar’s overall verdict is therefore conditional: it is the cheapest large speedup available in the memory-bound regime, it becomes unattractive once batching pushes the target toward compute-bound, and its exactness claims have to be read per technique rather than per pillar.",
        ],
      },
    ],
    papers: [
      "Leviathan et al. 2023 / Chen et al. 2023 — speculative decoding",
      "Li et al. 2024c–2025 — EAGLE, EAGLE-2, EAGLE-3",
      "Kou et al. 2024 — consistency LLMs",
      "Elhoushi et al. 2024 — LayerSkip",
    ],
    checks: [
      {
        id: "dec-1",
        prompt: "Why can speculative decoding be called lossless?",
        options: [
          "The draft model is larger than the target",
          "A rejection rule makes the marginal distribution of output match the target exactly",
          "It never rejects a token",
          "It quantizes weights to 4 bits without perplexity loss",
        ],
        answer: 1,
        why: "§4.1. The target verifies a draft prefix and resamples mismatches so generated text has the target’s distribution. “Lossless” is about that distribution, not about zero extra compute.",
      },
      {
        id: "dec-2",
        prompt: "Speculative decoding helps least when…",
        options: [
          "Batch size is large and the target is already near compute-bound",
          "Batch size is 1 and decode is bandwidth-bound",
          "The drafter matches the traffic distribution",
          "You care about time-per-output-token for a single chat stream",
        ],
        answer: 0,
        why: "§4.1, production considerations. If the target forward is already compute-saturated, verifying γ tokens is no longer about as cheap as one token, and the wall-clock win collapses. Latency-sensitive low-batch work is the sweet spot.",
      },
      {
        id: "dec-3",
        prompt: "Which family is designed to preserve the target distribution?",
        options: [
          "Diffusion language models",
          "Sampled Jacobi decoding",
          "Skeleton-of-Thought",
          "Rejection-sampling speculation, including LayerSkip-as-speculation",
        ],
        answer: 3,
        why: "§4.2 and §4.5. Rejection sampling makes the marginal output distribution equal the target’s. Diffusion, sampled Jacobi, and Skeleton-of-Thought trade exact left-to-right conditionals for parallelism and are judged on task quality.",
      },
    ],
  },
  {
    id: "compression",
    numeral: "06",
    kicker: "Pillar 3 · §5",
    title: "Compression and the quality budget",
    minutes: 16,
    summary:
      "Weights carry more precision than next-token prediction needs, and many of them can be skipped. Compression spends a quality budget to cut capacity, bandwidth, and — with the right kernels — to raise usable compute.",
    video: {
      src: "/videos/lecture-compression.mp4?v=10",
      title: "Narrated lecture",
      caption: "Press play. The lesson is read aloud: the point being discussed stays lit, and the words being spoken are captioned on the slide.",
      transcript: [
        "Halving the bits halves the traffic. Weight bytes dominate decode. Cache bytes follow the same rule.",
        "Outliers ruin a uniform grid. A few channels are orders of magnitude larger. A naive 4-bit grid crushes the rest.",
        "Three formats, three different pressures. Weights, activations, and cache. The production point is W4A8.",
        "Weight-only methods fix different failures. GPTQ corrects error after rounding. AWQ protects salient channels.",
        "SmoothQuant moves the difficulty. Activation outliers become weight outliers. The kernel is designed with the format.",
        "The cache has its own quantization. KIVI: two bits, no extra tuning. Keys per channel, values per token.",
        "Sparsity needs a hardware pattern. Arbitrary zeros do not speed up dense cores. 2:4 is the pattern the silicon runs.",
        "Stacked compression does not add up. Memory savings multiply. Quality errors interact.",
      ],
    },
    lab: { href: "/labs#cascade", label: "See a composed-error cascade" },
    sections: [
      {
        heading: "Quantization, and why outliers ruin it",
        paragraphs: [
          "The compression pillar changes the bit-width and structural density of the model itself, leaving the architecture and the generation procedure alone. Its premise is that production language models are over-parameterized in two senses: their weights carry far more precision than next-token prediction requires, and a substantial fraction of their parameters can be removed or skipped without measurable quality loss. Quantization replaces high-precision floating-point values with low-bit integers or low-precision floats, and the savings are direct, because every halving of the storage width halves both the memory footprint and the bandwidth needed to stream the model through the accelerator during decode. Most of these methods are post-training: they start from a finished checkpoint and produce a smaller artifact, often within a few GPU-hours and without access to the original training data.",
          "The complication is that language-model tensors exhibit outliers: a small fraction of channels has magnitudes orders of magnitude larger than the rest, and a naive uniform grid spends most of its dynamic range on those channels while the small weights collapse into a handful of levels. The first wave of methods therefore quantized weights alone, since weights dominate memory traffic in memory-bound decode. GPTQ adapts second-order error correction from the Optimal Brain Quantizer to language-model scale and reaches 4-bit quantization with negligible perplexity loss on models up to 175 billion parameters. AWQ observes that not all weights matter equally and protects the salient channels identified by activation statistics, while SqueezeLLM uses non-uniform grids with a dense-and-sparse decomposition that keeps outlier weights in FP16. QuIP and QuIP# apply Hadamard rotations to redistribute outliers across channels and reach 2-bit quantization with theoretical guarantees, AQLM uses additive vector quantization with learned codebooks, HQQ is a calibration-free alternative, and QLoRA’s NF4 format became a widely used 4-bit storage type beyond its original fine-tuning context.",
          "Quantizing activations is harder, because they are computed online and their distributions shift with the input. LLM.int8() isolates outlier channels into a separate FP16 path, ZeroQuant introduces per-token activation quantization with group-wise weight quantization, and SmoothQuant migrates the difficulty from activations to weights through a per-channel rescaling, exposing INT8 throughput at near-FP16 quality. OmniQuant learns the rescaling and clipping parameters with a lightweight calibration, and the current production frontier is W4A8, four-bit weights with eight-bit activations, realized by Atom and QServe, which co-design the quantization scheme with the kernel that consumes it. FP8 is the closely related path on NVIDIA Hopper and Blackwell, using hardware-native low-precision formats rather than INT8. A more aggressive line removes outliers structurally by rotating the weight space before quantization, as QuaRot does with Hadamard transforms and SpinQuant with learned rotations. At the extreme, BitNet and BitNet b1.58 train weights restricted to minus one, zero, and one, but that is a training-aware design rather than a post-training recipe.",
        ],
      },
      {
        heading: "The cache, sparsity, distillation",
        paragraphs: [
          "Weight quantization shrinks the model; KV-cache quantization shrinks the dynamic state and is increasingly the binding capacity constraint as contexts grow into the hundreds of thousands of tokens. KIVI is a tuning-free asymmetric 2-bit scheme built on a structural difference between keys and values: keys benefit from per-channel quantization because outlier channels persist across tokens, while values benefit from per-token quantization because their outliers cluster within a token. KVQuant extends the idea with non-uniform datatypes and outlier isolation, pushing inference contexts to 10 million tokens at 4-bit cache precision, and GEAR combines a low-rank approximation of the bulk with sparse correction for outliers. These methods compose with grouped-query attention or latent attention because they touch different factors of the footprint, and swapping KIVI’s two policies is a reliable exam trap.",
          "Sparsity removes parameters rather than reducing their precision. Structured pruning removes coupled groups such as entire attention heads or feed-forward channels, producing a smaller dense model that runs on stock kernels: LLM-Pruner ranks groups with gradient-based importance, Sheared-LLaMA follows pruning with continued pretraining and shows that pruned 1.3B and 2.7B models can beat from-scratch baselines at the same size, and Minitron combines depth, width, and head pruning with distillation. Unstructured pruning zeros individual weights: SparseGPT adapts GPTQ’s second-order machinery to one-shot pruning and reaches 50 to 60 percent sparsity, while Wanda ranks weights by magnitude times the corresponding input-activation norm and zeroes the bottom fraction. Arbitrary zeros are hard to accelerate on commodity hardware, which is why N:M sparsity is the practical compromise: exactly N of every M contiguous weights are zero, usually 2:4, and NVIDIA’s sparse tensor cores execute that pattern at about twice dense throughput. Contextual sparsity extends the same observation to activations, with Deja Vu predicting which heads and neurons will fire and PowerInfer keeping hot neurons on the GPU and cold ones on the CPU.",
          "Distillation differs from quantization and pruning because it produces a new student model instead of modifying the original. The classical recipe is off-policy: train the student on a fixed corpus to match the teacher’s output distribution, usually with a token-level KL divergence. That is cheap but suffers a train-inference mismatch, because the student learns from teacher-generated sequences and then samples from its own distribution at inference time, so errors compound; MiniLLM reformulates the objective as reverse KL with a sequence-level estimator to mitigate it. The modern frontier is on-policy: Generalized Knowledge Distillation collects student-generated sequences and trains on them, showing that on-policy data closes most of the gap and that the choice of divergence matters less than the data distribution, while DistiLLM adds a skew Kullback-Leibler divergence. Every cross-architecture linearization in the previous pillar is secretly this problem, a student with a different inductive bias learning from a teacher.",
        ],
        aside: {
          kicker: "KIVI in one line",
          body: "Keys like per-channel quantization. Values like per-token quantization. The asymmetry is the whole paper, and it is a common exam trap to swap them.",
        },
      },
      {
        heading: "Composition is not addition",
        paragraphs: [
          "A deployed model is usually quantized and pruned and distilled at the same time, and the memory savings of those stages are roughly multiplicative: four times from bit-width and two times from sparsity multiply to about eight times. The quality losses do not behave the same way. Each lossy stage introduces a small error in the output distribution, and when the stages are stacked those errors interact, sometimes compounding over long generations and occasionally masking one another. The survey’s Figure 3 draws the failure mode as a plausible edge pipeline: prune structural channels to fit a hardware block shape, linearize the remaining attention with cross-architecture distillation, then quantize the result. Each stage is calibrated on the model that enters it, so the composed error can greatly exceed the sum of the errors measured in isolation.",
          "The mechanism is calibration drift. AWQ and SmoothQuant compute their scales from the activation patterns of a dense model; if linearization or layer skipping has already moved those patterns, the quantization grid no longer matches the tensors it is supposed to represent and can collapse. That is why the survey treats composition as an open problem rather than a recipe: which schemes compose, in which order, and at which quality budget is not yet predicted by a theory. Bit-width still stacks cleanly with the state reductions of architecture and the kernels of the systems pillar, but only when the kernel can consume the format directly. The pillar’s price is almost entirely this quality budget, and the composed case is where the budget is least understood.",
        ],
      },
    ],
    papers: [
      "Frantar et al. 2023 — GPTQ",
      "Lin et al. 2024a — AWQ",
      "Xiao et al. 2023 — SmoothQuant",
      "Liu et al. 2024d — KIVI",
      "Agarwal et al. 2024 — on-policy GKD",
    ],
    checks: [
      {
        id: "comp-1",
        prompt: "KIVI’s structural asymmetry is…",
        options: [
          "Keys use per-token quantization; values use per-channel",
          "Keys use per-channel quantization; values use per-token",
          "Both tensors are stored as FP16 outliers only",
          "Only values are cached",
        ],
        answer: 1,
        why: "§5.2. KIVI is tuning-free and asymmetric at 2 bits: per-channel keys, per-token values. Swapping the two is the usual miss.",
      },
      {
        id: "comp-2",
        prompt: "Why can stacked compression fail worse than the sum of its parts?",
        options: [
          "Quantization grids are often calibrated on activation statistics that earlier pruning or linearization have already shifted",
          "4-bit weights cannot be loaded from HBM",
          "Distillation always increases parameter count",
          "N:M sparsity is undefined for batch size 1",
        ],
        answer: 0,
        why: "§5.5 and §8.3, Figure 3. Each method looks mild alone. AWQ/SmoothQuant scales assume the dense model’s activations. Change the architecture first and the calibration no longer matches.",
      },
      {
        id: "comp-3",
        prompt: "The label W4A8 means…",
        options: [
          "8-bit weights, 4-bit activations",
          "4-bit KV cache, 8-bit weights",
          "4-bit weights, 8-bit activations",
          "Exactly 4 of every 8 weights are zero",
        ],
        answer: 2,
        why: "§5.1. The first number is weight width, the second activation width. Atom and QServe are the cited W4A8 examples. It is a weight–activation scheme, not a sparsity pattern or a KV-cache format.",
      },
    ],
  },
  {
    id: "systems",
    numeral: "07",
    kicker: "Pillar 4 · §6",
    title: "Hardware and systems",
    minutes: 18,
    summary:
      "The first three pillars specify a cheaper model. This one collects the waste they cannot see: bytes that move more than once, and compute that stalls. It is the only pillar that hits all four bottlenecks, and the only one that is mostly lossless.",
    video: {
      src: "/videos/lecture-systems.mp4?v=10",
      title: "Narrated lecture",
      caption: "Press play. The lesson is read aloud: the point being discussed stays lit, and the words being spoken are captioned on the slide.",
      transcript: [
        "FlashAttention never writes the big matrix. Tile queries, keys, and values through SRAM. Softmax runs online, exactly.",
        "The win is traffic, not a new mixer. Same math, fewer HBM round trips. Four times less traffic in the usual case.",
        "Do not reserve the maximum length. Contiguous slots fragment memory. Pages are allocated on demand.",
        "Continuous batching fills the gaps. Step everyone once per iteration. Admit new work at the boundary.",
        "Shared prefixes should not be prefilled twice. System prompts repeat across users. A radix tree caches and evicts them.",
        "A long prefill stalls every decode. Split the phases onto different pools. Prefill wants compute; decode wants bandwidth.",
        "Goodput is the metric that survives the tail. Throughput counts the slow tail. An SLO turns latency into a budget.",
        "The open stacks have converged. Paging, batching, FlashAttention, prefix cache. What differs is scheduling and kernel quality.",
      ],
    },
    lab: { href: "/labs#paging", label: "Compare reserved slots with pages" },
    sections: [
      {
        heading: "IO-aware attention",
        paragraphs: [
          "The first three pillars produce specifications for a cheaper model: a smaller state, a different generation procedure, a lower bit-width. Pillar 4 is what turns those specifications into wall-clock throughput on physical silicon, and its unifying observation is that inference is dominated by two forms of waste that are invisible at the model-definition layer. The first is redundant memory traffic, where the same bytes traverse the memory hierarchy several times because no kernel was written to keep them on chip. The second is idle compute, where the accelerator stalls waiting for inputs or scheduling decisions. The systems pillar attacks both, sometimes through low-level kernels that restructure how a single operator touches memory, sometimes through serving architectures that restructure how many requests share an accelerator.",
          "The textbook implementation of softmax attention materializes the full T-by-T attention matrix in high-bandwidth memory, an operation whose memory footprint and bandwidth cost dominate its floating-point cost by a wide margin. FlashAttention eliminates the materialization by tiling the computation: queries, keys, and values are loaded into on-chip SRAM in blocks, the softmax is computed incrementally with online normalization, and only the final output tensor is written back to HBM. The result is an exact attention operator rather than an approximation, running two to four times faster than the naive implementation while using a fraction of the memory and scaling to sequence lengths that were previously infeasible. FlashAttention-2 restructures the work partitioning across thread blocks and warps to better saturate H100-generation hardware, and FlashAttention-3 adds asynchrony and FP8 low-precision support to exploit the Hopper Tensor Memory Accelerator, reaching roughly seventy-five percent of the H100 peak FP8 throughput. The win in every version is traffic, not a change to the mixer: the same softmax is computed, with fewer round trips to HBM.",
          "Those kernels were shaped for training-style workloads in which queries, keys, and values all have similar lengths. Inference is different. Decode runs with a single query against a long historical cache, and production prefill must handle ragged batches of mixed-length requests sharing one kernel launch. FlashInfer addresses both by providing a customizable attention engine targeted at serving, supporting paged layouts, variable-length batches, and several attention variants behind a single JIT-compiled kernel. FlashDecoding++ attacks the decode case specifically by parallelizing across the KV sequence dimension, because standard FlashAttention parallelizes across queries and therefore underutilizes the hardware when there is only one query. For contexts that exceed a single GPU, attention itself must be sharded: Ring Attention partitions the sequence across a ring of devices and rotates blocks while overlapping computation with communication, and Striped Attention reorders the work so that causal masking does not leave half the ring idle.",
        ],
      },
      {
        heading: "Pages, prefixes, and MoE kernels",
        paragraphs: [
          "The single most impactful systems insight in LLM serving is that the KV cache should be managed like virtual memory rather than as one contiguous tensor per request. Pre-allocating a contiguous slot based on a request’s maximum possible length fragments memory severely, because most requests terminate far before their maximum and the reserved tail cannot be reused while the request is live. vLLM, built on PagedAttention, allocates cache memory in fixed-size pages, typically sixteen tokens, that are assigned to a request dynamically as it grows, with a small block table per request recording the mapping. Internal fragmentation collapses to near zero, which in turn makes high-throughput continuous batching feasible at sequence lengths and concurrency levels that were previously out of reach. The attention kernel has to become page-aware, which is precisely the role that FlashInfer and the inference-specific FlashAttention variants now play. A complementary line argues that user-space paging is unnecessary if the GPU’s own virtual-memory primitives are used directly: vAttention backs a logically contiguous tensor with physically non-contiguous pages, so stock kernels run unchanged, at the cost of driver-specific complexity instead of a kernel rewrite.",
          "Continuous batching is the scheduling complement to paged memory. Instead of waiting for every request in a batch to finish before admitting new ones, the scheduler advances each request one decode step at a time and admits new work at every step boundary. That removes the head-of-line blocking that destroys throughput when request lengths vary, and it is now the default in essentially every production serving system. Prefix sharing is the second virtualization opportunity. Many requests share a common prompt prefix in the form of system prompts, few-shot exemplars, or multi-turn chat history, and prefilling that shared text once per request is pure duplicated work. SGLang’s RadixAttention stores the cache in a radix tree keyed by prefix, deduplicating automatically across requests and freeing nodes only under memory pressure with LRU eviction. For chat and agentic workloads, where prefix overlap is the norm rather than the exception, the reduction in prefill work is substantial.",
          "Mixture-of-experts models need kernels of their own, because tokens are routed dynamically to varying numbers of experts and the resulting computation is irregular and sparse in a way that dense GEMM kernels cannot exploit. The naive implementation pads every expert to the worst-case batch size, wasting both memory and compute and all but erasing the parameter-efficiency that motivated the architecture. MegaBlocks reformulates MoE computation as block-sparse matrix multiplication, removing the padding entirely and processing variable-size expert assignments in a single kernel; ScatterMoE offers a lighter alternative built on grouped GEMM. When experts are sharded across devices, the all-to-all routing communication becomes the bottleneck, which is the problem FastMoE and Tutel address, with Tutel adding adaptive parallelism that reconfigures expert placement from observed traffic. Without this infrastructure, an MoE model with eight times the parameters of a dense counterpart can easily run at less than one eighth of its speed, which is why the kernels are treated as essential rather than optional.",
        ],
        aside: {
          kicker: "Lossless, by design",
          body: "FlashAttention-3 on a paged cache in a disaggregated topology is bit-identical to a naive run. You pay engineering complexity, not perplexity. That distinguishes Pillar 4 from Pillars 1 and 3.",
        },
      },
      {
        heading: "Split the phases",
        paragraphs: [
          "The prefill-decode dichotomy has a direct systems consequence: co-locating both phases on the same GPU makes them interfere. A long prefill request occupies the compute units for tens to hundreds of milliseconds, and during that window every in-flight decode request stalls, which blows up the time per output token for users who are already being served. Three independent lines of work converged around 2023 and 2024 on the same answer, splitting the two phases onto different hardware pools. DistServe formulates the problem as goodput optimization, meaning throughput conditional on service-level objectives, and shows that independently configured prefill and decode pools deliver substantially higher goodput than any co-located arrangement. Splitwise reaches the same architecture from a phase-splitting angle and demonstrates the practical benefit of heterogeneous hardware: compute-heavy GPUs for prefill and bandwidth-heavy GPUs for decode. Mooncake extends the design with a globally accessible distributed cache pool, into which the prefill pool writes state and from which the decode pool reads it, trading storage cost for recomputation and enabling multi-million-token contexts in production chat workloads.",
          "Sarathi-Serve achieves much of the same benefit without a second pool, by chunking long prefills into smaller pieces that interleave with decode steps inside the same batch. The approaches are not mutually exclusive, and production stacks increasingly chunk prefill inside the prefill pool of an already disaggregated deployment. When the model exceeds aggregate GPU memory, the hierarchy extends downward: FlexGen frames batch inference on a single consumer GPU as an optimization over the placement of weights, activations, and cache state across GPU, host memory, and disk; InfiniGen extends offloading to the cache specifically, predicting which pages the next decode step will touch and prefetching them; and AlpaServe addresses statistical multiplexing across a fleet, using model parallelism and careful placement so that a load spike on one model can be absorbed by accelerators nominally assigned to another.",
          "Beneath the kernels and the serving systems sits compiler infrastructure that determines how operator graphs are lowered to silicon. Triton provides a tiled programming model in which researchers write GPU kernels in Python-like syntax and still reach near-handwritten CUDA performance, and FlashAttention-style kernels are now routinely authored in it. Graph-level passes for operator fusion, common-subexpression elimination, and layout selection can collapse what would naively be dozens of launches per layer into a handful of fused ones, materially reducing the per-token overhead that dominates decode latency. The production stacks have largely converged on the same primitives: vLLM pairs PagedAttention with continuous batching, SGLang adds RadixAttention and tight FlashInfer integration, TensorRT-LLM supplies hand-optimized kernels for each hardware generation, and DeepSpeed-Inference, DeepSpeed-FastGen, and Hugging Face TGI cover large-model parallelism and lighter-weight serving. The survey observes that the differences have narrowed, and that competition now takes place at the level of scheduling sophistication, kernel quality on the newest hardware, and how cleanly a stack integrates with a disaggregated topology. Pillar 4 is also the only pillar that attacks all four bottlenecks and the only one that is largely lossless: the price is engineering complexity, not model quality.",
        ],
      },
    ],
    papers: [
      "Dao et al. 2022 / Dao 2024 / Shah et al. 2024 — FlashAttention 1–3",
      "Kwon et al. 2023 — PagedAttention",
      "Yu et al. 2022 — Orca, continuous batching",
      "Zhong et al. 2024 / Patel et al. 2024 / Qin et al. 2025 — DistServe, Splitwise, Mooncake",
    ],
    checks: [
      {
        id: "sys-1",
        prompt: "FlashAttention is…",
        options: [
          "An approximate attention that drops the softmax",
          "An exact attention algorithm that tiles through SRAM and avoids writing the T×T matrix to HBM",
          "A 4-bit quantization format",
          "A router for mixture-of-experts",
        ],
        answer: 1,
        why: "§6.1. Online softmax inside SRAM tiles. Exact, not a Performer-style approximation. The win is memory traffic. FA-3 later adds FP8 and asynchrony on Hopper.",
      },
      {
        id: "sys-2",
        prompt: "PagedAttention’s main target is…",
        options: [
          "Fragmentation from reserving each request a contiguous cache out to its maximum length",
          "The softmax approximation error",
          "Expert load imbalance in MoE",
          "Draft-model acceptance rate",
        ],
        answer: 0,
        why: "§6.3. Most requests end long before the maximum, so contiguous reservations waste and fragment HBM. Fixed-size pages (about 16 tokens) plus a block table fix allocation without changing outputs.",
      },
      {
        id: "sys-3",
        prompt: "Continuous batching’s main win is that it…",
        options: [
          "runs every live request once per step and admits or retires work at the boundary, removing head-of-line blocking",
          "shrinks the KV cache by quantizing it",
          "approximates softmax to save FLOPs",
          "moves prefill onto a separate GPU pool",
        ],
        answer: 0,
        why: "§6.3, Orca. Static batches wait for the longest request and leave the accelerator idle. Continuous batching refills the batch at every step. It is a scheduler change; quantization and disaggregation are separate pillars.",
      },
    ],
  },
  {
    id: "synthesis",
    numeral: "08",
    kicker: "Section 7",
    title: "The cache and the phase split, full stack",
    minutes: 12,
    summary:
      "Two motifs cut across the taxonomy. The KV cache is a ledger every pillar writes in. Disaggregation changes which quantization and which decoder you even want.",
    video: {
      src: "/videos/lecture-synthesis.mp4?v=10",
      title: "Narrated lecture",
      caption: "Press play. The lesson is read aloud: the point being discussed stays lit, and the words being spoken are captioned on the slide.",
      transcript: [
        "The cache is the ledger every pillar writes in. Architecture moves a dimension. Compression shortens the word.",
        "The wins add; the layouts fight. A real deployment runs all four at once. Every combination wants a new kernel.",
        "Prefill and decode want opposite formats. Prefill wants wide, compute-friendly formats. Decode wants narrow weights.",
        "Disaggregation makes two formats possible. Different schemes per phase become conceivable. No production system does it yet.",
        "Speculation moves the machine mix. Verification pushes decode toward compute. The node link can become the bottleneck.",
        "Four levers multiply the win. Each lever is independent in theory. The product is what reaches production.",
        "Name the term, or it is not independent. Bottleneck, exactness, price. That is the whole exam method.",
      ],
    },
    sections: [
      {
        heading: "One cache, four axes",
        paragraphs: [
          "Optimizing inference cannot be done by analyzing the layers of the execution stack in isolation, because as serving infrastructure matures the boundaries between architecture, execution semantics, numerical representation, and hardware systems blur. The first of the two cross-cutting motifs the survey traces is the KV cache as a shared resource ledger, the primary data substrate connecting all four pillars, whose optimization profile shows that a choice made in a compiler or kernel is intrinsically coupled to architectural and numerical abstractions. Table 2 states the synthesis in one grid. Architecture reduces a structural dimension, collapsing the head count through grouped-query attention or shrinking the projection space through latent attention. Decoding contributes a validation routing pattern, verifying tree-structured candidates through customized masked sequences. Compression reduces word length, pushing cache entries down to two-bit asymmetric grids. Systems allocates physical blocks, eliminating dynamic memory gaps with page tables and radix-indexed pools.",
          "The axes are additive rather than exclusionary, as cross-cutting systems such as QServe demonstrate. A modern deployment might simultaneously use grouped-query attention to shrink the nominal head dimension, speculative tree decoding to validate several tokens per memory pass, four-bit activation-aware scaling to compress the active states, and PagedAttention to lay the resulting low-bit chunks out in non-contiguous physical pages. The friction in that combined lifecycle is layout transformation overhead. Low-bit quantized caches historically had to be dequantized to FP16 before a standard FlashAttention kernel could consume them, and although FlashInfer and QServe now execute attention directly on quantized formats, the kernel-quantization co-design burden is real: every new combination of bit-width, head-sharing scheme, and page layout typically demands a fresh kernel. That burden, not any theorem about mutual exclusivity, is the cost of the additive win.",
        ],
      },
      {
        heading: "Disaggregation changes the other pillars",
        paragraphs: [
          "On a single serving node, quantization parameters must compromise between two masters. Prefill is compute-centric and favors formats such as W8A8 or FP8 that maximize tensor-core utilization, while decode is bandwidth-limited and favors weight-only schemes such as W4A16 or W2A16 that minimize the bytes transferred per step. Disaggregation in principle resolves the conflict by allowing a different scheme per phase, activation-heavy methods such as SmoothQuant on the compute-bound prefill pool and weight-only methods such as GPTQ on the bandwidth-bound decode pool. The survey is explicit that it is not aware of production deployments exploiting that freedom today, and flags it as an attractive direction for future co-design rather than as current practice.",
          "Speculation changes the machine mix in a second-order way that is easy to miss. Speculative decoding and parallel Jacobi iterations shift the decode phase toward a compute-bound execution envelope by validating several candidate tokens at once. In a disaggregated cluster, heavy verification heads such as Medusa or EAGLE can therefore alter the ratio of prefill to decode nodes that the distributed load balancer needs, and the bottleneck can migrate from HBM stalls to interconnect scaling inside a node. A reader who memorizes only that speculation saves bandwidth will miss the effect entirely, and will also mispredict the capacity plan. The habit the section teaches is general: when two techniques stack, say which term of the cache footprint equation or which roofline regime each one moves, and if that cannot be said, they are probably less independent than their abstracts claim.",
        ],
        aside: {
          kicker: "Exam habit",
          body: "When two techniques stack, say which term of equation (5) or which roofline regime each one moves. If you cannot, they are probably not as independent as the abstracts claim.",
        },
      },
    ],
    papers: [
      "Lin et al. 2024b — QServe, kernel-aware W4A8",
      "Ye et al. 2025 — FlashInfer on paged and quantized layouts",
      "Patel et al. 2024 — phase-specific hardware (Splitwise)",
    ],
    checks: [
      {
        id: "syn-1",
        prompt: "Which stacking does the survey treat as additive rather than exclusive?",
        options: [
          "GQA, speculative trees, 4-bit KV, and paged layout together",
          "Mamba replacing FlashAttention, GPTQ, and the roofline",
          "Training LoRA instead of any inference pillar",
          "Only one of capacity or bandwidth can be improved",
        ],
        answer: 0,
        why: "§7.1. The four axes touch different parts of the cache lifecycle. The obstacle is kernel/layout co-design, not a theorem that says you must pick one.",
      },
      {
        id: "syn-2",
        prompt: "On a single serving GPU, why is weight format a compromise?",
        options: [
          "Prefill prefers compute-friendly formats (W8A8, FP8); decode prefers narrow weights (W4A16) to cut bandwidth",
          "FP16 is illegal on Hopper",
          "Decode does not read weights",
          "The survey shows every production stack already uses different formats per phase",
        ],
        answer: 0,
        why: "§7.2. Disaggregation could split the compromise, but the survey says it is not aware of production deployments that actually quantize the two phases differently. Do not over-claim.",
      },
      {
        id: "syn-3",
        prompt: "In a disaggregated deployment, speculation can change the machine mix because…",
        options: [
          "it eliminates the prefill pool entirely",
          "it doubles the KV cache on both pools",
          "it removes the need for a numeric format on the decode pool",
          "verification pushes decode toward a compute-bound envelope, moving the right prefill-to-decode node ratio and possibly making interconnect the new bottleneck",
        ],
        answer: 3,
        why: "§7.2, second-order effect. “Speculation saves bandwidth” is only the first-order story. Once verification occupies compute, capacity planning shifts, and the bottleneck can move from HBM to interconnect inside a node.",
      },
    ],
  },
  {
    id: "frontiers",
    numeral: "09",
    kicker: "Sections 8–9",
    title: "Three open frontiers",
    minutes: 12,
    summary:
      "The conclusion is not “the stack is finished.” It names three cross-cutting problems. If you can state each one as a tradeoff with a reason it is still open, you have the exam’s last chapter.",
    video: {
      src: "/videos/lecture-frontiers.mp4?v=10",
      title: "Narrated lecture",
      caption: "Press play. The lesson is read aloud: the point being discussed stays lit, and the words being spoken are captioned on the slide.",
      transcript: [
        "A fixed state cannot point at one fact. Recall falls as context grows. The frontier is still open.",
        "Hybrids rent attention back. One attention layer for every seven Mamba layers. The cache returns, and grows again.",
        "Speculation is exact only while drafts match. Acceptance length drives the speedup. If it falls to zero, verification is waste.",
        "Realignment is still an open loop. Offline and batched updates exist. Per-request alignment does not.",
        "Composed compression has no error bound. Each stage recalibrates on the last model. The total can exceed the sum of the parts.",
        "Three open questions, one shape. Recall, exactness, composition. Each one is a tradeoff, not a bug.",
        "Four pillars, four bottlenecks, one cache. Co-design is the conclusion. The cache is where the layers meet.",
      ],
    },
    sections: [
      {
        heading: "Recall versus efficiency",
        paragraphs: [
          "The survey closes by naming three cross-cutting problems rather than declaring the stack finished, and the first is the recall-efficiency Pareto for subquadratic state. There is an intrinsic trade-off between the absolute memory footprint of a sequence mixer’s state and its mathematical recall capability on associative retrieval tasks. Mixers such as Mamba and RWKV reduce decoding complexity to constant time by compressing the entire history into a fixed-size recurrent tensor, but that fixed boundary is an information bottleneck. Unlike the Transformer cache, which scales linearly and preserves a lossless record of every prior activation, a fixed-size state forces the model to perform lossy compression on its own memory, and the constraint surfaces as severe degradation on needle-in-a-haystack retrieval, long multi-turn reasoning logs, and complex in-context learning.",
          "Hybrid stacks such as Jamba, Samba, and Taipan buy back some of that recall by keeping a minority of attention layers, but each retained layer reintroduces linear cache growth, so the compromise is a trade of one cost for another rather than a resolution. Closing the Pareto frontier requires either a formal theoretical account of how to bound memory state without losing non-local associative recall, or dynamic eviction mechanisms that choose retention bounds from the contextual information density of the sequence instead of from a constant window. The lesson ends where the pillar began: the size of the state is the currency, and every architecture in the family is spending it differently.",
        ],
      },
      {
        heading: "Lossless versus lossy parallel decoding",
        paragraphs: [
          "The second frontier is the lossless-lossy boundary in parallel decoding. Speculative variants remain mathematically lossless because they run candidate verification through strict rejection sampling against the target, but that guarantee depends on structural distribution alignment. If the draft model’s distribution drifts away from the target’s, the mean accepted length collapses toward zero and the verification pass becomes a net waste of hardware floating-point work, since every draft is rejected after being paid for. Recent work attacks the drift directly: EAGLE-3 introduces a training-time test scheme that adapts the drafter to the verifier under realistic scaling, and online speculative decoding continually updates the drafter on production traffic. Both improve draft quality offline or in batched updates, but a principled framework for online, per-request realignment between draft and target remains open.",
          "Non-autoregressive parallel methods sit deliberately on the lossy side. Consistency language models and language diffusion frameworks trade strict autoregressive alignment for large multi-token generation blocks, which is exactly where their speed comes from. The frontier questions the survey poses are operational rather than philosophical. Can a system adjust speculative draft-tree width or the number of denoising steps online, tracking real-time hardware bandwidth saturation instead of a fixed configuration? And can the field establish robust error-bounded decoding targets that tolerate a minor statistical deviation from the autoregressive distribution when doing so unlocks multi-fold speedups on standard memory buses? Both questions ask for a controlled account of the error budget, which is why the boundary is a research problem rather than a switch.",
        ],
      },
      {
        heading: "Composed compression, and the conclusion",
        paragraphs: [
          "The third frontier is error accumulation under composed compression, which appears as soon as compression techniques stop being evaluated one at a time. A typical production pipeline might take a foundation model, prune its structural channels to fit a hardware block shape, linearize the remaining quadratic attention layers into a subquadratic configuration through cross-architecture distillation, and then apply low-bit weight and activation quantization. Each layer can show minimal precision loss in isolation, yet their joint composition frequently triggers non-linear cascades. Figure 3 of the survey draws the failure as an inequality in which the total error greatly exceeds the sum of the distillation, sparsity, and quantization errors measured separately. The mechanism is calibration drift. Methods such as AWQ and SmoothQuant derive their quantization bounds from the activation patterns of a dense model, and if linearization or layer skipping has already moved those distributions, the calibration can collapse and reasoning metrics degrade severely.",
          "A unified composition theory, or predictable error bounds for stacked configurations, therefore remains a critical objective, and it matters most for edge deployments where every factor of compression is needed. The conclusion restates the co-design claim that organizes the whole survey. Architectural changes to the KV layout must interoperate with virtualized system memory, speculative and parallel decoding loops must be co-designed with low-precision tensor kernels, and compression strategies must be tailored to the execution phases of a disaggregated network. The future of inference efficiency lies at precisely those interfaces, and the three frontiers of recall, exactness, and composition are what still stand between the current stack and cheap real-time intelligence at global scale.",
        ],
        formula: {
          expr: "E_total  ≫  ε_dist + ε_sparse + ε_quant",
          caption: "Figure 3, qualitative. Not a fitted equation — the point is the interaction, not a coefficient.",
        },
      },
    ],
    papers: [
      "Arora et al. 2024 — the recall–state Pareto",
      "Li et al. 2025 — EAGLE-3 and draft/target drift",
      "Van Nguyen et al. 2025 — Lizard, linearization that shifts activations before quantization",
    ],
    checks: [
      {
        id: "front-1",
        prompt: "Which trio are the survey’s open frontiers?",
        options: [
          "Better web data, longer pre-training, and larger vocabularies",
          "Recall–efficiency of subquadratic state; the lossless–lossy line in parallel decoding; error cascades under composed compression",
          "Replacing Adam, scaling laws, and synthetic data",
          "Only the design of a faster all-reduce",
        ],
        answer: 1,
        why: "§8.1–8.3, repeated in the conclusion. Anything about pre-training recipes is outside the survey’s scope (§1.4).",
      },
      {
        id: "front-2",
        prompt: "Hybrids such as Jamba do not close the recall–efficiency Pareto because…",
        options: [
          "They contain no attention and therefore no recall",
          "Keeping some full attention layers reintroduces a cache that still grows with context",
          "They forbid MoE",
          "Their decode cost is quadratic in state size",
        ],
        answer: 1,
        why: "§8.1. A 1:7 mix restores retrieval by paying linear cache growth on the attention layers. It is a compromise, not a proof that fixed state can match softmax recall.",
      },
      {
        id: "front-3",
        prompt: "The composed-compression frontier is asking for…",
        options: [
          "a larger calibration set and nothing else",
          "a composition theory with predictable error bounds when compression stages are stacked",
          "a proof that 4-bit quantization is always lossless",
          "the removal of distillation from the serving stack",
        ],
        answer: 1,
        why: "§8.3. Each stage is calibrated on the model that entered it, so the stack can overshoot the sum of isolated errors. What is missing is an account that predicts the composite, especially off the datacenter — not a single better grid.",
      },
    ],
  },
];

export const glossary: { term: string; def: string }[] = [
  {
    term: "Prefill",
    def: "The compute-bound forward pass over the prompt that fills the KV cache. Sets TTFT together with queueing.",
  },
  {
    term: "Decode",
    def: "Token-at-a-time generation. At small batch, memory-bandwidth-bound. Sets TPOT.",
  },
  {
    term: "Operational intensity",
    def: "FLOPs performed divided by bytes moved from main memory. Compared with the ridge point π/β.",
  },
  {
    term: "Ridge point",
    def: "I_ridge = π/β. The lowest intensity that can saturate peak compute. Modern accelerators: hundreds of FLOPs/byte.",
  },
  {
    term: "Roofline",
    def: "The bound P ≤ min(π, β·OI). Below the ridge, memory bandwidth binds; at or above it, the compute ceiling does.",
  },
  {
    term: "MQA",
    def: "Multi-query attention. One KV head shared by every query head. The smallest cache in the MHA–GQA–MQA family, with the largest recall risk.",
  },
  {
    term: "KV cache",
    def: "Stored keys and values so decode does not recompute history. Footprint is equation (5). The survey’s full-stack ledger.",
  },
  {
    term: "GQA",
    def: "Grouped-query attention. Several query heads share one KV head group. The usual production point between MHA and MQA.",
  },
  {
    term: "MLA",
    def: "Multi-head latent attention. Cache a low-rank latent c_t and rebuild K and V. Breaks the factor-of-two in equation (5).",
  },
  {
    term: "Mamba",
    def: "Selective state-space model. Fixed-size recurrent state, input-dependent transitions, O(1) decode, parallel scan in training.",
  },
  {
    term: "Speculative decoding",
    def: "Draft γ tokens, verify with one target forward, reject so the output distribution matches the target. Lossless. Speedup tracks τ.",
  },
  {
    term: "τ",
    def: "Mean accepted tokens per speculation step. End-to-end speedup is about τ minus verification overhead.",
  },
  {
    term: "Goodput",
    def: "Throughput that actually meets a latency SLO. DistServe’s objective, not raw tokens/s.",
  },
  {
    term: "TTFT / TPOT",
    def: "Time to first token (prefill, queueing). Time per output token (decode bandwidth and KV size).",
  },
  {
    term: "W4A8",
    def: "4-bit weights, 8-bit activations. Atom and QServe. A current production quantization point, kernel-co-designed.",
  },
  {
    term: "KIVI",
    def: "Asymmetric KV quantization: per-channel keys, per-token values, about 2 bits, no extra tuning.",
  },
  {
    term: "2:4 sparsity",
    def: "Exactly 2 of every 4 weights zero. The N:M pattern Sparse Tensor Cores run at about 2× dense throughput.",
  },
  {
    term: "On-policy distillation",
    def: "Train the student on its own samples to match the teacher. Closes the train–inference mismatch. GKD, DistiLLM.",
  },
  {
    term: "PagedAttention",
    def: "KV memory in fixed pages (typically 16 tokens) with a block table, instead of one contiguous max-length reservation.",
  },
  {
    term: "FlashAttention",
    def: "Exact softmax attention tiled through SRAM, avoiding the T×T HBM write. IO-aware, not an approximation.",
  },
  {
    term: "Eviction",
    def: "Drop or sparsify cached KV entries (H2O, StreamingLLM, sliding windows). Shrinks the effective sequence length s; the history is gone, so recall is not free.",
  },
  {
    term: "Continuous batching",
    def: "Admit and retire requests at each decode step. Removes head-of-line blocking. Orca.",
  },
  {
    term: "RadixAttention",
    def: "Prefix KV stored in a radix tree so shared system prompts are not recomputed. SGLang.",
  },
  {
    term: "Disaggregation",
    def: "Prefill pool and decode pool on separate hardware, often different GPU shapes, with KV shipped between them.",
  },
  {
    term: "Chunked prefill",
    def: "Slice a long prefill and interleave it with decode so one pool can protect TPOT. Sarathi-Serve.",
  },
];

export const exam: Check[] = [
  {
    id: "e1",
    lessonId: "bottlenecks",
    prompt: "A decode step at batch 1 moves FP16 weights and performs one MAC per parameter. Operational intensity is about…",
    options: ["1 FLOP/byte", "The ridge point, roughly 300 FLOP/byte", "O(t²)", "2 bytes, regardless of FLOPs"],
    answer: 0,
    why: "§2.3. 2|θ| FLOPs over 2|θ| bytes. The two factors of two are a coincidence of MACs and FP16.",
  },
  {
    id: "e2",
    lessonId: "bottlenecks",
    prompt: "Which bottleneck primarily caps per-user generation speed?",
    options: ["Memory capacity", "Memory bandwidth", "Interconnect only", "Calibration set size"],
    answer: 1,
    why: "§2.4.2. Capacity caps concurrent users. Bandwidth caps single-stream token rate, about bandwidth/(2|θ|) in FP16.",
  },
  {
    id: "e3",
    lessonId: "kv",
    prompt: "Equation (5) does not directly describe MLA because…",
    options: [
      "MLA stores no cache at all",
      "MLA stores a single latent per token rather than separate K and V tensors",
      "MLA doubles n_layers",
      "MLA is a decoding algorithm, not an architecture",
    ],
    answer: 1,
    why: "§2.1 note and §3.4. The leading 2 assumes separate K and V. MLA’s c_t replaces both.",
  },
  {
    id: "e4",
    lessonId: "architecture",
    prompt: "Jamba’s hybrid ratio, as cited, is about…",
    options: [
      "1 attention layer per 7 Mamba layers, plus MoE",
      "7 attention layers per Mamba layer, dense FFN",
      "Pure Mamba, no attention, no experts",
      "1:1 attention and linear attention, no SSM",
    ],
    answer: 0,
    why: "§3.2. A small minority of attention layers restores recall; the cache then exists only on those layers.",
  },
  {
    id: "e5",
    lessonId: "decoding",
    prompt: "Speculative decoding preserves the target distribution. Diffusion language models generally…",
    options: [
      "Do too, via rejection sampling",
      "Do not — parallel blocks assume a conditional independence the survey calls compositional drift",
      "Are exact Jacobi fixed points under sampling",
      "Only change the tokenizer",
    ],
    answer: 1,
    why: "§4.2 and §4.5. Speculation and LayerSkip-as-speculation are the lossless family. Diffusion is judged on task quality.",
  },
  {
    id: "e6",
    lessonId: "decoding",
    prompt: "Mean accepted length τ falls toward zero when…",
    options: [
      "The draft distribution drifts away from the target",
      "You use FlashAttention",
      "Pages are 16 tokens",
      "The cache is in FP16",
    ],
    answer: 0,
    why: "§4.1 and §8.2. Verification then wastes FLOPs. EAGLE-3 and online speculation attack this drift; per-request realignment is open.",
  },
  {
    id: "e7",
    lessonId: "compression",
    prompt: "SmoothQuant’s move is to…",
    options: [
      "Migrate activation quantization difficulty onto weights with a per-channel rescale",
      "Prune attention heads with a gradient score",
      "Draft tokens from a datastore",
      "Page the KV cache",
    ],
    answer: 0,
    why: "§5.1. It is a weight–activation method aimed at INT8-class throughput, unlike GPTQ/AWQ which are weight-only.",
  },
  {
    id: "e8",
    lessonId: "compression",
    prompt: "Which pair is the right KIVI assignment?",
    options: [
      "Per-token keys, per-channel values",
      "Per-channel keys, per-token values",
      "Both per-tensor",
      "Keys in FP32, values dropped",
    ],
    answer: 1,
    why: "§5.2. Asymmetric 2-bit, tuning-free.",
  },
  {
    id: "e9",
    lessonId: "compression",
    prompt: "Unstructured 60% sparsity is less useful in production than 2:4 sparsity mainly because…",
    options: [
      "Unstructured sparsity increases parameter count",
      "Commodity tensor cores accelerate the structured N:M pattern and not arbitrary zeros",
      "2:4 sparsity is lossless by theorem",
      "Wanda cannot target 2:4",
    ],
    answer: 1,
    why: "§5.3. SparseGPT/Wanda hit high unstructured sparsity with small quality loss, but speed needs a hardware pattern. 2:4 is about 2× on Sparse Tensor Cores.",
  },
  {
    id: "e10",
    lessonId: "systems",
    prompt: "FlashAttention differs from linear attention because…",
    options: [
      "It is exact softmax attention with less HBM traffic, not a different mixer",
      "It replaces the state with a fixed RNN",
      "It is a 4-bit weight format",
      "It drops the causal mask",
    ],
    answer: 0,
    why: "§6.1 versus §3.1. Same math as standard attention, different memory schedule. Linear attention changes the math and loses recall.",
  },
  {
    id: "e11",
    lessonId: "systems",
    prompt: "DistServe’s objective, compared with raw throughput, is…",
    options: [
      "Goodput: tokens that meet an SLO, with prefill and decode in separate pools",
      "Minimizing training loss",
      "Maximizing draft acceptance at batch size 1 only",
      "Eliminating the KV cache",
    ],
    answer: 0,
    why: "§2.5 and §6.4. Co-locating a long prefill with decode inflates TPOT. Separate pools, each sized for its bottleneck, raise goodput.",
  },
  {
    id: "e12",
    lessonId: "compression",
    prompt: "Figure 3 warns that a pipeline of distillation, pruning, and quantization can…",
    options: [
      "Only fail if each stage fails on its own",
      "Compound non-linearly, because later calibration assumed statistics the earlier stages destroyed",
      "Always improve perplexity",
      "Replace the need for a serving system",
    ],
    answer: 1,
    why: "§5.5 and §8.3. Memory savings multiply. Quality errors do not add. The figure writes E_total much greater than the sum of the three epsilons.",
  },
  {
    id: "e13",
    lessonId: "frontiers",
    prompt: "A fixed-size recurrent state cannot match softmax attention on needle-in-a-haystack retrieval because…",
    options: [
      "its decode cost grows quadratically with context",
      "it has no learnable parameters",
      "it is an information bottleneck that cannot keep a lossless history of arbitrary past tokens",
      "it cannot be trained with a parallel scan",
    ],
    answer: 2,
    why: "§8.1. The state is a summary: constant memory but lossy. Hybrids rent attention back, which restores recall on those layers at the price of linear cache growth. The scan keeps training parallel.",
  },
  {
    id: "e14",
    lessonId: "kv",
    prompt: "Raising batch size b in equation (5) buys throughput but…",
    options: [
      "reduces n_layers proportionally",
      "changes the hardware ridge point",
      "shrinks the number of KV heads",
      "multiplies KV-cache memory and often worsens per-user TPOT",
    ],
    answer: 3,
    why: "§2.1 and §2.4. b is linear in the footprint. More concurrency raises aggregate tokens/s but pressures capacity and adds traffic per decode step, which can hurt per-user latency.",
  },
  {
    id: "e15",
    lessonId: "decoding",
    prompt: "Which method is lossless at the greedy fixed point but lossy in expectation under sampling?",
    options: [
      "Jacobi decoding",
      "Rejection-sampling speculative decoding",
      "Diffusion language modeling",
      "Skeleton-of-Thought",
    ],
    answer: 0,
    why: "§4.2. Jacobi updates several future positions together and converges to the same greedy fixed point as sequential decoding. Under sampling, the parallel update changes the distribution in expectation. Rejection-sampling speculation is the lossless construction.",
  },
  {
    id: "e16",
    lessonId: "systems",
    prompt: "Which system stores prefix KV in a radix tree so shared system prompts are not prefilled twice?",
    options: ["PagedAttention", "DistServe", "FlashInfer", "RadixAttention (SGLang)"],
    answer: 3,
    why: "§6.3. RadixAttention indexes the cache by prefix and evicts by recency, so common system prompts and few-shot exemplars are reused. PagedAttention targets allocation; DistServe targets goodput; FlashInfer is the kernel layer.",
  },
];

export const lessons: Lesson[] = baseLessons.map((lesson) => ({
  ...lesson,
  sections: [...lesson.sections, ...(enrichment[lesson.id] ?? [])],
}));

export type LessonStudy = {
  /** What the reader should be able to do after the lesson. */
  objectives: string[];
  /** The sentences worth carrying into the exam. */
  takeaways: string[];
  /** Where the survey supports the lesson. */
  survey: string;
};

export const lessonStudy: Record<string, LessonStudy> = {
  shift: {
    survey: "§1, Figure 1",
    objectives: [
      "Explain why operational inference, not pre-training, dominates total cost of ownership.",
      "Separate prefill from decode by the physical resource each one binds.",
      "Place an unfamiliar technique into the survey’s four-pillar taxonomy.",
    ],
    takeaways: [
      "Training cost is amortized; serving cost is paid on every deployed query.",
      "Prefill is compute-bound; batch-1 decode is memory-bandwidth-bound.",
      "The pillars are layers of one co-designed stack, not competing tricks.",
    ],
  },
  bottlenecks: {
    survey: "§2, Table 1, Figures 2–3",
    objectives: [
      "Compute operational intensity from FLOPs and bytes moved.",
      "Use a roofline to classify a workload as memory- or compute-bound.",
      "Choose the metric — TTFT, TPOT, goodput, or aggregate throughput — that matches a claim.",
    ],
    takeaways: [
      "OI = FLOPs / bytes; the ridge point is π / β.",
      "Batch-1 FP16 decode sits near 1 FLOP/byte because the MAC’s factor of two meets FP16’s two bytes.",
      "Capacity caps concurrency; bandwidth caps single-stream speed; compute caps prefill and large-batch decode; interconnect caps sharding.",
    ],
  },
  kv: {
    survey: "§2.1, Equation (5)",
    objectives: [
      "Derive the KV footprint from layers, KV heads, head dimension, sequence, batch, and bytes.",
      "Map each later pillar to the term of equation (5) it moves.",
      "Explain why MLA needs a different formula rather than a smaller n_kv_heads.",
    ],
    takeaways: [
      "S_kv = 2 · n_layers · n_kv_heads · d_head · s · b · b_bytes.",
      "GQA changes n_kv_heads, quantization changes b_bytes, eviction changes effective s, batching changes b.",
      "Paging does not shrink the cache; it changes how the cache is allocated.",
    ],
  },
  architecture: {
    survey: "§3, Equations (10)–(11)",
    objectives: [
      "Contrast linear attention, selective SSMs, hybrids, MoE, and KV-sharing methods.",
      "State the recall cost of a fixed-size recurrent state.",
      "Describe how MLA stores one latent per token and reconstructs K and V.",
    ],
    takeaways: [
      "A fixed state gives O(1) decode but cannot keep a lossless history.",
      "Hybrids rent attention back, so their cache still grows on the attention layers.",
      "MoE cuts per-token compute, not per-token KV state.",
    ],
  },
  decoding: {
    survey: "§4",
    objectives: [
      "Walk through draft, verify, reject, and resample in speculative decoding.",
      "State the condition under which speculation is lossless.",
      "Explain why the speedup collapses at large batch and which parallel decoders are lossy.",
    ],
    takeaways: [
      "Rejection sampling makes the marginal output distribution match the target exactly.",
      "End-to-end speedup tracks mean accepted length τ minus drafting and verification cost.",
      "Diffusion, sampled Jacobi, and Skeleton-of-Thought trade exactness for parallelism.",
    ],
  },
  compression: {
    survey: "§5, Figure 3",
    objectives: [
      "Distinguish weight-only, weight–activation, and KV-cache quantization.",
      "Explain why LLM outliers break uniform grids and how GPTQ, AWQ, SmoothQuant, and rotations respond.",
      "Explain why stacked compression errors can compound.",
    ],
    takeaways: [
      "Halving the bit width halves both footprint and decode traffic.",
      "KIVI uses per-channel keys and per-token values; swapping them is the classic miss.",
      "Memory savings multiply, but quality errors do not add linearly.",
    ],
  },
  systems: {
    survey: "§6",
    objectives: [
      "Explain how FlashAttention reduces HBM traffic without approximating softmax.",
      "Compare contiguous KV reservation with paged allocation.",
      "Explain continuous batching, prefix reuse, and disaggregated prefill–decode.",
    ],
    takeaways: [
      "FlashAttention is exact attention with a better memory schedule.",
      "PagedAttention fixes fragmentation; it does not change the number of KV bytes.",
      "Disaggregation protects TPOT by keeping long prefills off the decode pool.",
    ],
  },
  synthesis: {
    survey: "§7, Table 2",
    objectives: [
      "Combine architectural, decoding, compression, and systems techniques on one cache.",
      "Explain the kernel and layout friction that limits otherwise additive wins.",
      "Explain why disaggregation makes phase-specific numeric formats plausible.",
    ],
    takeaways: [
      "The four axes are additive in principle; the cost is kernel co-design.",
      "One GPU forces one weight format to serve both prefill and decode.",
      "Speculation can shift the bottleneck from HBM toward compute and interconnect.",
    ],
  },
  frontiers: {
    survey: "§8–9",
    objectives: [
      "State the survey’s three open problems as tradeoffs rather than slogans.",
      "Explain why hybrids do not close the recall–efficiency Pareto frontier.",
      "Explain why composed compression needs a composition theory.",
    ],
    takeaways: [
      "Fixed state trades associative recall for constant memory.",
      "Lossless parallel decoding depends on draft–target alignment.",
      "Co-design across layout, kernel, and phase is the unfinished job.",
    ],
  },
};

/** Glossary anchors shared by the glossary page and lesson cross-links. */
export function glossarySlug(term: string) {
  const greek: Record<string, string> = {
    τ: "tau",
    π: "pi",
    β: "beta",
    ε: "epsilon",
    α: "alpha",
  };
  if (greek[term]) return greek[term];
  const base = term
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
  return base || `term-${term.codePointAt(0) ?? 0}`;
}

export const glossaryLessonIds: Record<string, string[]> = {
  Prefill: ["shift", "bottlenecks", "kv", "systems"],
  Decode: ["shift", "bottlenecks", "kv"],
  "Operational intensity": ["bottlenecks"],
  "Ridge point": ["bottlenecks"],
  Roofline: ["bottlenecks"],
  MQA: ["kv", "architecture"],
  "KV cache": ["shift", "kv", "architecture", "synthesis"],
  GQA: ["kv", "architecture"],
  MLA: ["kv", "architecture"],
  Mamba: ["architecture"],
  "Speculative decoding": ["decoding"],
  τ: ["decoding"],
  Goodput: ["bottlenecks", "systems"],
  "TTFT / TPOT": ["shift", "bottlenecks"],
  W4A8: ["compression", "synthesis"],
  KIVI: ["compression"],
  "2:4 sparsity": ["compression"],
  "On-policy distillation": ["compression"],
  PagedAttention: ["systems"],
  FlashAttention: ["systems"],
  Eviction: ["architecture", "kv"],
  "Continuous batching": ["kv", "systems"],
  RadixAttention: ["systems"],
  Disaggregation: ["systems", "synthesis"],
  "Chunked prefill": ["kv", "systems"],
};

export type Formula = {
  name: string;
  expr: string;
  note: string;
  lessonId: string;
};

export const formulas: Formula[] = [
  {
    name: "KV footprint",
    expr: "S_kv = 2 · n_layers · n_kv_heads · d_head · s · b · b_bytes",
    note: "Equation (5). The leading 2 is K versus V. MLA replaces the layout.",
    lessonId: "kv",
  },
  {
    name: "MLA latent cache",
    expr: "c_t = W_DKV h_t\nk_t = W_UK c_t ,   v_t = W_UV c_t",
    note: "Equation (11). Store c_t only; reconstruct K and V at attention time.",
    lessonId: "architecture",
  },
  {
    name: "Mamba recurrence",
    expr: "h_t = Ā_t h_{t−1} + B̄_t x_t ,   y_t = C_t h_t",
    note: "Equation (10). Input-dependent transitions, fixed-size state.",
    lessonId: "architecture",
  },
  {
    name: "Operational intensity",
    expr: "OI = FLOPs / bytes moved from main memory",
    note: "The roofline’s x-axis. Decode at batch 1 is about 1 FLOP/byte in FP16.",
    lessonId: "bottlenecks",
  },
  {
    name: "Ridge point",
    expr: "I_ridge = π / β",
    note: "Lowest intensity that can saturate peak compute π at bandwidth β.",
    lessonId: "bottlenecks",
  },
  {
    name: "Roofline bound",
    expr: "P ≤ min(π, β · OI)",
    note: "Below the ridge, performance tracks bandwidth; above it, the compute ceiling binds.",
    lessonId: "bottlenecks",
  },
  {
    name: "Single-stream decode limit",
    expr: "TPOT ≈ 2|θ| / β",
    note: "Weight bytes divided by bandwidth in FP16. KV traffic and overheads push it higher.",
    lessonId: "bottlenecks",
  },
  {
    name: "Expected speculative tokens",
    expr: "E[tokens] = (1 − α^(γ+1)) / (1 − α)",
    note: "Independent acceptance α over a draft of length γ, plus one corrected token.",
    lessonId: "decoding",
  },
  {
    name: "Speculative speedup",
    expr: "S = E[tokens] / (1 + c · γ)",
    note: "c is draft cost relative to one target forward. Large batch raises the effective c.",
    lessonId: "decoding",
  },
  {
    name: "Composed compression error",
    expr: "E_total  ≫  ε_dist + ε_sparse + ε_quant",
    note: "Figure 3, qualitative. Later calibration assumed statistics earlier stages moved.",
    lessonId: "frontiers",
  },
];

export type Trap = {
  trap: string;
  fix: string;
  lessonId: string;
};

export const traps: Trap[] = [
  {
    trap: "“The 2 FLOPs and 2 bytes are the same factor of two.”",
    fix: "One 2 is the multiply-accumulate; the other is FP16’s byte width. Changing dtype moves only the byte side, so OI changes.",
    lessonId: "bottlenecks",
  },
  {
    trap: "“KIVI quantizes keys per token and values per channel.”",
    fix: "It is the reverse: per-channel keys, per-token values. The asymmetry is the whole paper.",
    lessonId: "compression",
  },
  {
    trap: "“MLA is just GQA with fewer heads.”",
    fix: "MLA caches one low-rank latent per token and reconstructs K and V. Equation (5)’s leading 2 no longer applies.",
    lessonId: "architecture",
  },
  {
    trap: "“FlashAttention approximates softmax.”",
    fix: "It is exact attention with an IO-aware schedule. Linear attention changes the math; FlashAttention does not.",
    lessonId: "systems",
  },
  {
    trap: "“Speculative decoding is always lossless.”",
    fix: "Only the rejection-sampling construction preserves the target distribution. Diffusion, sampled Jacobi, and Skeleton-of-Thought are judged on task quality.",
    lessonId: "decoding",
  },
  {
    trap: "“Paging shrinks the KV cache.”",
    fix: "Paging fixes allocation and fragmentation. The number of live KV bytes is still equation (5).",
    lessonId: "systems",
  },
  {
    trap: "“Hybrids eliminate the KV cache.”",
    fix: "They keep a minority of attention layers, so the cache still grows with context on those layers.",
    lessonId: "frontiers",
  },
  {
    trap: "“A larger batch always improves the user experience.”",
    fix: "It raises aggregate throughput and can lower cost per token, but it multiplies KV memory and often worsens TPOT.",
    lessonId: "bottlenecks",
  },
  {
    trap: "“Compression savings and quality errors both add linearly.”",
    fix: "Memory savings usually multiply. Quality errors can compound because later stages calibrate on a model earlier stages changed.",
    lessonId: "compression",
  },
  {
    trap: "“Training still dominates the cost of a deployed model.”",
    fix: "Once a model serves many queries, operational inference dominates TCO. That is the survey’s opening claim.",
    lessonId: "shift",
  },
];

export type OralPrompt = {
  prompt: string;
  sketch: string;
  lessonId: string;
};

export const oralPrompts: OralPrompt[] = [
  {
    prompt: "Derive the KV-cache footprint and say which term each pillar moves.",
    sketch:
      "Start from stored K and V per layer, head, token, and batch. Then: GQA/MLA move n_kv_heads or the layout; quantization moves b_bytes; eviction moves effective s; batching moves b; paging changes allocation, not the count.",
    lessonId: "kv",
  },
  {
    prompt: "Why is prefill compute-bound while batch-1 decode is bandwidth-bound?",
    sketch:
      "Prefill has the whole prompt and large parallel matmuls, so arithmetic intensity is high. Decode moves all weights plus the KV cache to emit one token, so bytes dominate. At batch 1 in FP16 the two factors of two cancel to OI ≈ 1.",
    lessonId: "bottlenecks",
  },
  {
    prompt: "Compare MQA, GQA, and MLA on what they store and what they cost.",
    sketch:
      "MQA stores one KV head, cheap but lossy. GQA stores a group per query-head group and is the production default. MLA stores a latent per token and reconstructs K and V; smaller cache, more compute and a different kernel.",
    lessonId: "architecture",
  },
  {
    prompt: "When is speculative decoding lossless, and when does it stop paying?",
    sketch:
      "Lossless when the verifier rejects and resamples so the marginal distribution matches the target. It pays when decode is bandwidth-bound and τ is high; at large batch verification is no longer nearly free, and drift lowers τ.",
    lessonId: "decoding",
  },
  {
    prompt: "Explain KIVI and why the key/value asymmetry exists.",
    sketch:
      "Keys are quantized per channel because a few channels carry outliers across tokens; values are quantized per token because their distribution varies token by token. About 2 bits, tuning-free.",
    lessonId: "compression",
  },
  {
    prompt: "What does PagedAttention fix, and what does it not fix?",
    sketch:
      "It replaces max-length contiguous reservations with fixed pages and a block table, removing internal fragmentation and enabling sharing. It does not reduce the live KV footprint or improve the attention math.",
    lessonId: "systems",
  },
  {
    prompt: "Why disaggregate prefill and decode, and what does it change about quantization?",
    sketch:
      "A long prefill stalls in-flight decodes and inflates TPOT. Separate pools size each phase for its bottleneck. In principle each pool could use a different numeric format; the survey says production examples of that are still missing.",
    lessonId: "synthesis",
  },
  {
    prompt: "State the survey’s three open problems and the tradeoff behind each.",
    sketch:
      "Recall versus constant state; lossless versus lossy parallel decoding; predictable composition of compression errors. Each is a frontier because the naive combination loses something the survey cannot yet bound.",
    lessonId: "frontiers",
  },
];

export function lessonById(id: string) {

  return lessons.find((l) => l.id === id);
}

export function neighbors(id: string) {
  const i = lessons.findIndex((l) => l.id === id);
  return {
    prev: i > 0 ? lessons[i - 1] : undefined,
    next: i >= 0 && i < lessons.length - 1 ? lessons[i + 1] : undefined,
  };
}
