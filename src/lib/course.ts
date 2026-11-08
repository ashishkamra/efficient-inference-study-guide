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
      src: "/videos/lecture-shift.mp4?v=9",
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
          "Early generative-AI engineering was about pre-training: regular, predictable, compute-bound work, tuned to keep the accelerator full. Once a model is deployed, that training cost is amortized over a huge number of queries. Total cost of ownership flips. Operational inference dominates.",
          "The workloads that flipped it are real-time apps, agent loops, and multi-step reasoning. Executing the model now costs more, in aggregate, than training it. Efficiency sits between deep-learning theory, hardware, and distributed systems.",
        ],
        aside: {
          kicker: "Out of scope",
          body: "The survey deliberately skips training-time architectures, pre-training parallelism, and PEFT such as LoRA. Test-time compute scaling, multi-agent orchestration, and multimodal inference appear only when they change a physical bottleneck.",
        },
      },
      {
        heading: "Prefill is not decode",
        paragraphs: [
          "A serving query has two lives. Prefill reads the whole prompt at once, fills the KV cache, and is rich in arithmetic per byte moved — compute-bound. Decode then emits one token at a time. For every token the engine loads billions of parameters from high-bandwidth memory into on-chip SRAM. That phase is memory-bandwidth-bound.",
          "The survey treats this asymmetry, not “make the model smaller,” as the reason a full stack exists. Tricks that help one phase can be irrelevant, or harmful, in the other.",
        ],
      },
      {
        heading: "Four pillars, one taxonomy",
        paragraphs: [
          "Figure 1 of the survey organizes the literature by where a method is inserted, not by which paper it came from.",
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
          "Do not memorize paper titles in isolation. For every technique, name the bottleneck it attacks, whether it is lossless, and what it costs (recall, quality, or engineering complexity). The survey repeats that mapping at the end of every pillar.",
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
      src: "/videos/lecture-bottlenecks.mp4?v=9",
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
          "The roofline’s central ratio is operational intensity: floating-point work divided by bytes transferred from main memory. Hardware gives you two peaks — compute throughput π in FLOP/s, and memory bandwidth β in byte/s. Their ratio is the ridge point, the lowest intensity that can saturate the compute units.",
          "Below the ridge you are memory-bound: attained performance tracks β times intensity. At or above it you hit the flat compute ceiling. Prefill sits on or above the ridge. Decode at batch size one sits far below it.",
        ],
        formula: {
          expr: "OI = FLOPs / bytes\nI_ridge = π / β\nP ≤ min(π, β · OI)",
          caption: "Equations (6)–(8). The picture in Figure 2 of the survey.",
        },
      },
      {
        heading: "Why batch-1 decode is about 1 FLOP/byte",
        paragraphs: [
          "At batch size 1 in FP16, a decode step does about 2|θ| FLOPs — two FLOPs per multiply-accumulate, one MAC per parameter — and moves about 2|θ| bytes of weights. Those two factors of two are unrelated. One is the MAC. The other is FP16’s two bytes. They happen to cancel, so OI is about 1 FLOP/byte.",
          "INT8 halves the bytes and doubles OI. INT4 doubles it again. Accelerator ridge points are in the hundreds of FLOPs/byte, so decode is orders of magnitude under the ceiling. Raising effective batch size, fusing kernels, and cutting per-step traffic are how later pillars push decode toward the ridge.",
        ],
        aside: {
          kicker: "Do not mix the twos",
          body: "Students often treat “2 FLOPs and 2 bytes” as one fact. The survey explicitly separates them. Change the dtype and only the byte factor moves.",
        },
      },
      {
        heading: "Four bottlenecks, and who owns them",
        paragraphs: [
          "Table 1 is the index for the rest of the exam. Capacity limits how many users fit. Bandwidth limits how fast one user is served. Compute limits prefill and large-batch decode, and is increasingly about numeric format. Interconnect and numerics limit sharding and disaggregated topologies.",
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
          "Aggregate tokens/s can hide a bad per-user experience. Goodput (DistServe) counts only tokens that meet a latency SLO. TTFT is prefill plus queueing. TPOT is decode, set by bandwidth and KV size.",
          "For speculative methods, track mean accepted length τ and per-token acceptance rate. The speedup is essentially τ minus verification overhead. For compression, track KV compression ratio, parameter bytes, perplexity, and downstream accuracy. Prefix-aware systems add KV-cache hit rate (SGLang RadixAttention, Mooncake).",
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
      src: "/videos/lecture-kv.mp4?v=9",
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
          "Decoder-only Transformers factorize P(x₁:T) as a product of next-token conditionals. Each layer projects hidden states into Q, K, and V. Causal softmax attention mixes them. During decoding only one new query is formed, and it attends over every past key.",
          "Without a cache, K and V would be rebuilt every step. The KV cache appends the new pair instead. That is a systems object and an algorithmic one: it is why decode is linear in t rather than quadratic, and why long context is a memory problem.",
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
          "This is the sentence to remember from §2.1. Architectural head-sharing reduces n_kv_heads. Quantization reduces b_bytes. Eviction and sliding windows reduce the effective s. Batching raises b, which is throughput, but it multiplies the cache. MLA does not fit the formula cleanly — it replaces the K and V tensors.",
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
          "Prefill writes the cache for the prompt in one compute-bound pass. Decode reads the whole history from HBM, attends, and appends one pair. Most of those bytes are used once per step, which is why bandwidth binds.",
          "Production blurs the textbook split. Chunked prefill (Sarathi-Serve) slices a long prompt so decode can be interleaved. Continuous batching (Orca) admits new requests at every step instead of at batch boundaries. Both are Pillar 4, and both still use this same cache.",
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
      src: "/videos/lecture-architecture.mp4?v=9",
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
          "Linear attention (Katharopoulos et al.) drops the softmax and factors the mixer through a feature map. A d×d summary and a normalizer replace the KV cache and update in O(d²), independent of t. Performer, Linformer, and RetNet are variations. The persistent failure is recall: one summary cannot remember arbitrary content.",
          "State-space models take the other classical route. S4 unrolls a continuous-time recurrence as a convolution in training and a recurrence at decode. Mamba makes that recurrence selective — the transition depends on the current input — with a hardware-aware scan. Mamba-2 unifies SSMs and linear attention (structured state-space duality). RWKV arrives at a similar RNN-style mixer from the transformer side.",
          "Gated linear attention, xLSTM, Griffin, TTT, and Titans all chase the same engineering target: a recurrent state large enough for recall and still O(1) to step.",
        ],
        formula: {
          expr: "h_t = Ā_t h_{t−1} + B̄_t x_t ,   y_t = C_t h_t",
          caption: "Mamba’s selective recurrence, equation (10). (Ā_t, B̄_t, C_t) depend on x_t. h_t has fixed size.",
        },
      },
      {
        heading: "Hybrids, MoE, and linearization",
        paragraphs: [
          "Hybrid stacks interleave a minority of full attention among subquadratic layers, on the finding that few heads actually do retrieval. Jamba, Samba, Hymba, Zamba, Nemotron-H, MiniMax-01, and Taipan are the names. Taipan’s selective attention runs only on a learned token subset and is discussed out to million-token contexts. Falcon-Mamba is the attention-free push in the other direction.",
          "Mixture-of-experts cuts per-token compute, not per-token state. A router sends each token to top-k of N experts, so activated parameters split from total parameters. All experts must still live somewhere. Mixtral 8×7B popularized the open recipe. DeepSeekMoE’s fine-grained experts plus a shared expert scale to 236B and 671B total parameters with 21B and 37B activated. Hot/cold expert offload (PowerInfer, Mixtral-Offload, pre-gated MoE) is how that fits on commodity machines.",
          "Linearization avoids pretraining the student from scratch. SUPRA, LoLCATs, Hedgehog, MOHAWK, Mamba-in-the-Llama, RADLADS, and Lizard distill a quadratic teacher into a subquadratic or hybrid student, sometimes on a tiny fraction of the original token budget. The open question is how much recall survives.",
        ],
      },
      {
        heading: "KV state, without leaving the Transformer",
        paragraphs: [
          "Head sharing: MQA (one KV head, quality loss), GQA (the production default in Llama 2/3), MLA (store c_t = W_DKV h_t, reconstruct K and V, d_c much smaller than heads times head dim). Cross-layer variants — CLA, YOCO, LCKV — share or condense cache across depth.",
          "Eviction: H2O keeps heavy hitters. StreamingLLM keeps attention sinks plus a sliding window so streams can be unbounded. SnapKV, FastGen, PyramidKV, Quest, RazorAttention, and DuoAttention decide what is worth keeping, sometimes per head, sometimes per query. Longformer, BigBird, Mistral’s sliding window, and LongNet are the older local-plus-global baselines underneath that line.",
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
      src: "/videos/lecture-decoding.mp4?v=9",
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
          "Leviathan et al. and Chen et al. (both 2023) introduced the same idea: a draft of γ tokens, one target verification, rejection sampling so the distribution matches. The first drafts were separate small models. Self-speculation removes the second checkpoint.",
          "Medusa hangs extra heads off the target’s last hidden state. Hydra makes those heads sequential. EAGLE drafts in feature space, where the next feature is less uncertain than the sampled token; EAGLE-2 and EAGLE-3 add dynamic trees and a training-time test. Kangaroo double-early-exits the same model. Draft & Verify skips layers. REST retrieves continuations from a datastore. PLD, prompt lookup, is the minimal baseline and is strong when input and output overlap — code edits, summarization.",
          "A flat draft wastes the verifier if position 1 is already wrong. SpecInfer, Sequoia, and EAGLE’s dynamic trees submit alternatives and take the longest valid path. SpecExec pushes trees into the offload regime. Lookahead decoding keeps an n-gram pool instead of a learned drafter.",
        ],
        aside: {
          kicker: "Production catch",
          body: "Large batches shrink the win, because verification is no longer “free” relative to a saturated target. Acceptance also falls when traffic drifts from the drafter’s data, which is why online speculative decoding keeps retraining the drafter on observed traffic.",
        },
      },
      {
        heading: "Diffusion, Jacobi, early exit",
        paragraphs: [
          "Diffusion language models denoise a fully masked sequence over a few steps, so latency need not track length token by token. The line runs D3PM and Diffusion-LM, through SEDD and MDLM, to LLaDA at 8B, DiffuLLaMA (adapted from an autoregressive checkpoint), and Mercury. The cost is a conditional-independence assumption inside a parallel block: compositional drift on long reasoning. Orthrus is the survey’s hybrid answer — a trainable diffusion head beside a frozen autoregressive backbone, one shared KV cache, consensus verification.",
          "Jacobi decoding updates n future positions together and, for greedy decoding, converges to the same fixed point as stepping one token at a time, usually in fewer than n iterations. Consistency LLMs fine-tune so that fixed point arrives sooner. Jacobi is lossless at the greedy fixed point and lossy in expectation under sampling. Skeleton-of-Thought parallelizes at outline level instead, trading coherence for a large wall-clock cut on structured answers.",
          "CALM exits at the first layer whose classifier is confident. LayerSkip trains with stochastic layer dropout so early exits are actually good, then uses the early exit as a drafter and the full model as a verifier — lossless again. SkipDecode keeps batched shapes regular. Early exit composes with speculation and with hybrids, because both already expose a cheap shallow representation.",
        ],
      },
      {
        heading: "The bill",
        paragraphs: [
          "Pillar 2 buys bandwidth: each weight read covers multiple emitted tokens. It secondarily spends compute throughput that was sitting idle. It does not shrink capacity. You pay extra FLOPs on rejected drafts, and you pay a losslessness budget. Speculation and LayerSkip-as-speculation preserve the target distribution. Diffusion, sampled Jacobi, and skeleton-of-thought do not, and are judged on task quality instead.",
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
      src: "/videos/lecture-compression.mp4?v=9",
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
          "Halving b_bytes halves both the footprint and the decode traffic. LLM tensors spoil naive uniform grids: a few channels are orders of magnitude larger than the rest, and the grid wastes its range on them.",
          "Weight-only methods matter first because decode traffic is mostly weights. GPTQ brings second-order error correction (Optimal Brain Quantizer) to 4-bit at huge scale. AWQ protects channels that activations say are salient. SqueezeLLM and SpQR keep outliers in a sparse high-precision residual. QuIP and QuIP# rotate with a Hadamard so outliers spread out, with 2-bit guarantees. AQLM uses additive codebooks. HQQ needs no calibration set. QLoRA’s NF4 became a default 4-bit storage type even outside fine-tuning.",
          "Activations are harder because they move and are computed online. LLM.int8() isolates outlier channels in FP16. SmoothQuant rescales per channel so difficulty moves from activations onto weights. OmniQuant learns the scales. The production point the survey highlights is W4A8 — Atom and QServe — co-designed with the kernel. FP8 is the Hopper/Blackwell-native cousin. QuaRot and SpinQuant rotate pairs of weights and activations so a uniform 4-bit grid works on both. BitNet b1.58 trains weights in {−1, 0, 1}; that is training-aware, not a post-training recipe.",
        ],
      },
      {
        heading: "The cache, sparsity, distillation",
        paragraphs: [
          "KV quantization shrinks S_kv through b_bytes, which binds once contexts hit hundreds of thousands of tokens. KIVI is a tuning-free asymmetric 2-bit scheme: per-channel for keys, per-token for values. KVQuant adds non-uniform types and outlier isolation (the survey cites 10M-token contexts at 4-bit cache). GEAR is low-rank plus a sparse residual. These stack with GQA or MLA because they touch different factors of the footprint.",
          "Pruning removes structure rather than bits. LLM-Pruner, Sheared-LLaMA, and Minitron drop heads, channels, or depth and often distill afterward; the result stays dense and runs on ordinary kernels. SparseGPT and Wanda zero individual weights (Wanda’s score is magnitude times activation norm). Unstructured zeros are hard to accelerate. N:M sparsity, usually 2:4, is the hardware compromise: Sparse Tensor Cores do that pattern at about 2× dense throughput.",
          "Distillation builds a new student. Off-policy KL on a fixed corpus is cheap and mismatched: the student trains on the teacher’s sequences, then samples its own, and errors compound. MiniLLM uses reverse KL and a sequence-level estimator. On-policy methods (GKD, DistiLLM) train on the student’s own rollouts. The survey’s claim: the data distribution matters more than the exact divergence. Every linearization in §3.5 is secretly this problem — a student with a different inductive bias.",
        ],
        aside: {
          kicker: "KIVI in one line",
          body: "Keys like per-channel quantization. Values like per-token quantization. The asymmetry is the whole paper, and it is a common exam trap to swap them.",
        },
      },
      {
        heading: "Composition is not addition",
        paragraphs: [
          "Deployed models are quantized and pruned and distilled. Memory savings often multiply — 4× from bits times 2× from sparsity is about 8× — but quality errors do not add linearly. Figure 3 draws the failure mode: distillation, then sparsity, then low-bit quantization, with total error much larger than the sum, because each step’s calibration assumed the previous model.",
          "AWQ and SmoothQuant scales are fit to activation patterns. Linearize or skip layers first and those patterns move; the grid can collapse. Which recipes compose, in which order, is left open in §8.3. The pillar’s price is almost entirely this quality budget. Bit-width still stacks cleanly with Pillar 1’s state reductions and Pillar 4’s kernels when the kernels can consume the format directly.",
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
      src: "/videos/lecture-systems.mp4?v=9",
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
          "Textbook softmax materializes a T×T matrix in HBM. The bytes dominate the FLOPs. FlashAttention tiles Q, K, and V through SRAM, runs softmax online, and writes only the output. The result is exact — not an approximation — often 2–4× faster and much lighter, which is what made long sequences practical. FlashAttention-2 retunes the parallel schedule for H100-class chips. FlashAttention-3 adds asynchrony and FP8 and reaches about 75% of H100 peak FP8.",
          "Those kernels were shaped for training, where Q, K, and V have similar lengths. Decode has a single query against a long cache, and serving batches are ragged. FlashInfer targets that: paged KV, variable lengths, sliding windows, MQA/GQA/MLA, one JIT kernel. FlashDecoding++ parallelizes across the KV sequence, which standard FlashAttention does not, because it parallelizes across queries. Ring Attention and Striped Attention shard a context that does not fit on one GPU, overlapping the rotation with compute; Striped Attention reorders work so the causal mask does not idle half the ring.",
        ],
      },
      {
        heading: "Pages, prefixes, and MoE kernels",
        paragraphs: [
          "The most important systems idea in the survey: manage the KV cache like virtual memory. Reserving a contiguous slot out to the maximum length fragments memory, because requests die early. PagedAttention (vLLM) allocates fixed pages — typically 16 tokens — and a block table per request. Internal fragmentation collapses. The kernel must understand pages; that is FlashInfer’s job. vAttention instead backs a logically contiguous tensor with CUDA virtual memory so stock kernels still work.",
          "Continuous batching (Orca) is the scheduler that matches paging. Do not wait for the longest request in a static batch. Step everyone once and admit new work at the boundary. That kills head-of-line blocking and is now the default everywhere.",
          "Shared prefixes — system prompts, few-shot exemplars, chat history — should not be prefilled twice. SGLang’s RadixAttention stores KV in a radix tree and evicts with LRU. MoE needs its own kernels: padding every expert to the worst-case batch wastes the 8× parameter win. MegaBlocks uses block-sparse GEMM; ScatterMoE uses grouped GEMM; Tutel and FastMoE attack the all-to-all when experts are sharded.",
        ],
        aside: {
          kicker: "Lossless, by design",
          body: "FlashAttention-3 on a paged cache in a disaggregated topology is bit-identical to a naive run. You pay engineering complexity, not perplexity. That distinguishes Pillar 4 from Pillars 1 and 3.",
        },
      },
      {
        heading: "Split the phases",
        paragraphs: [
          "A long prefill on the same GPU as in-flight decodes stalls every user and blows up TPOT. DistServe, Splitwise, and Mooncake, independently, split the phases onto different pools. DistServe optimizes goodput under SLOs. Splitwise puts compute-heavy GPUs on prefill and bandwidth-heavy GPUs on decode. Mooncake adds a global KV pool: prefill writes it, decode reads it, and recomputation is traded for storage. Sarathi-Serve gets much of the benefit without a second pool by chunking prefill and interleaving it with decode. Production stacks increasingly chunk inside the prefill pool of a disaggregated deployment.",
          "When the model does not fit, FlexGen places weights, activations, and KV across GPU, CPU, and disk for throughput-oriented batch inference. InfiniGen prefetches the KV pages a decode step will touch. AlpaServe multiplexes a fleet of models. Underneath, Triton is how many of these kernels get written, and fusion collapses a dozen launches per layer into a few — the overhead that dominates single-token latency.",
          "vLLM, SGLang, TensorRT-LLM, DeepSpeed-FastGen, and Hugging Face TGI have converged on the same primitives: paging, continuous batching, FlashAttention, prefix caches. The survey says the remaining competition is scheduling, kernel quality on the newest hardware, and how cleanly a stack joins a disaggregated topology.",
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
      src: "/videos/lecture-synthesis.mp4?v=9",
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
          "Table 2 is the synthesis to be able to redraw. Pillar 1 reduces a structural dimension: fewer KV heads, or a latent width d_c. Pillar 2 routes validation: tree-shaped drafts verified under a custom mask. Pillar 3 reduces word length, down to 2-bit asymmetric grids. Pillar 4 allocates physical blocks: page tables and radix pools.",
          "They add. A real deployment can run GQA, speculative trees, 4-bit cache, and PagedAttention together. QServe is the survey’s example of axes that are not alternatives. The friction is layout. Quantized caches used to be dequantized to FP16 before a stock attention kernel. FlashInfer and QServe now attend in the low-bit layout, but every new combination of bit-width, head sharing, and page size wants a new kernel. That co-design burden is the cost of the additive win.",
        ],
      },
      {
        heading: "Disaggregation changes the other pillars",
        paragraphs: [
          "On one GPU, a single numeric format has to serve two masters. Prefill wants W8A8 or FP8 to fill tensor cores. Decode wants W4A16 or even W2A16 to cut bytes on the bus. Splitwise and DistServe make different schemes per phase conceivable — SmoothQuant on the prefill pool, GPTQ on the decode pool. The survey is explicit that it does not know of a production system doing this yet. It is flagged as future co-design, not as current practice.",
          "Speculation changes the machine mix. Medusa or EAGLE validation pushes decode toward a compute-bound envelope, so the right ratio of prefill nodes to decode nodes moves, and the new bottleneck can be interconnect inside the node rather than HBM. If you only memorize “speculation saves bandwidth,” you miss this second-order effect in §7.2.",
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
      src: "/videos/lecture-frontiers.mp4?v=9",
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
          "A fixed state h_t is an information bottleneck. Unlike the KV cache, it cannot keep a lossless history, so needle-in-a-haystack retrieval, long multi-turn logs, and hard in-context learning degrade. Hybrids (Jamba, Samba, Taipan) rent back a little attention and, with it, linear cache growth. The open problem is a real account of how to bound memory without losing non-local associative recall — or an eviction policy that sets the retention budget from the information density of the sequence, rather than from a constant window.",
        ],
      },
      {
        heading: "Lossless versus lossy parallel decoding",
        paragraphs: [
          "Speculation stays lossless only while the draft is aligned with the target. If the draft distribution drifts, τ falls toward zero and verification is pure waste. EAGLE-3 and online speculative decoding move the drafter toward the verifier, offline or in batches. A principled per-request realignment is still open.",
          "Consistency models and diffusion sit on the lossy side on purpose, trading exact left-to-right conditionals for wide parallel blocks. The survey’s frontier questions are operational: can draft-tree width or the number of denoising steps track live bandwidth saturation, and can we state an error budget where a small deviation from the autoregressive distribution is acceptable because the bus is the scarce resource?",
        ],
      },
      {
        heading: "Composed compression, and the conclusion",
        paragraphs: [
          "A plausible edge pipeline prunes structure to a hardware block, linearizes remaining attention by distillation, then quantizes. Each stage was calibrated on the model that entered it. Figure 3’s inequality is the warning: total error much greater than ε_dist + ε_sparse + ε_quant. A composition theory with predictable bounds is the open objective, especially off the datacenter.",
          "The conclusion restates the co-design claim. KV layout has to work with virtual memory. Speculative loops have to meet low-precision kernels. Compression has to know which phase of a disaggregated network it is serving. The field is converging on hardware–software co-design, and these three frontiers are what still blocks cheap real-time inference at global scale.",
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
