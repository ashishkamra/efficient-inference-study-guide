export type Check = {
  id: string;
  prompt: string;
  options: string[];
  answer: number;
  why: string;
};

export type Section = {
  heading: string;
  paragraphs: string[];
  formula?: { expr: string; caption: string };
  bullets?: string[];
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

export const lessons: Lesson[] = [
  {
    id: "shift",
    numeral: "01",
    kicker: "Introduction",
    title: "From training to the inference stack",
    minutes: 12,
    summary:
      "Training used to be the expensive part. Serving is now. This lesson is the survey’s argument: efficiency is a co-design problem across four layers, not a bag of tricks.",
    video: {
      src: "/videos/lecture-shift.mp4?v=3",
      title: "Narrated lecture",
      caption: "Press play. This lesson is read aloud. The picture follows the argument.",
      transcript: [
        "Start at the bottom. Hardware and systems decide whether a specification becomes wall-clock throughput. Memory rivers and silicon tiles are the substrate everything else sits on.",
        "The next slab is compression. The same model, fewer bits and fewer live weights. Density goes up; a quality budget is spent.",
        "Above that, decoding changes how tokens are produced. A draft proposes several futures. A verifier keeps a prefix and throws the rest away. One weight read can emit more than one token.",
        "The top slab is architecture. Softmax attention’s growing memory folds toward a fixed state — faster, but it can no longer point at every past token.",
        "The survey’s claim: these layers are interdependent. The KV cache, in particular, is touched by all four.",
      ],
    },
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
      src: "/videos/lecture-bottlenecks.mp4?v=3",
      title: "Narrated lecture",
      caption: "Press play. This lesson is read aloud. The picture follows the argument.",
      transcript: [
        "Left side is prefill. Every prompt token is available together, so the chip does a large parallel matmul. Arithmetic intensity is high. The cores stay busy. Time-to-first-token lives here, plus queueing.",
        "Right side is decode. The arithmetic per step is real, but the bytes that must move — weights, and a growing KV cache — dominate. The processor waits on the memory bus. Tokens come out serially. Time-per-output-token lives here.",
        "Chunked prefill and continuous batching blur the split in production, but they do not erase it. Section 6 returns to both.",
        "If a paper claims a speedup, ask which side of this picture it moves.",
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
      src: "/videos/lecture-kv.mp4?v=3",
      title: "Narrated lecture",
      caption: "Press play. This lesson is read aloud. The picture follows the argument.",
      transcript: [
        "A causal decoder factorizes the sequence with the chain rule. At each layer, queries, keys, and values are projections of the hidden states. Softmax attention is causal.",
        "Recomputing keys and values from scratch every step would be quadratic. The engine instead appends the new key and value and reuses history. Per-step compute drops from O(t²) to O(t). Memory becomes linear in length.",
        "Watch the shelf, not the chip. The model weights are static. The cache is the part that grows with context, batch, and layers. Capacity pressure is this shelf filling up.",
        "Equation (5) counts it: two tensors (K and V), times layers, KV heads, head dimension, sequence length, batch, and bytes per element.",
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
      src: "/videos/lecture-architecture.mp4?v=3",
      title: "Narrated lecture",
      caption: "Press play. This lesson is read aloud. The picture follows the argument.",
      transcript: [
        "Softmax attention keeps a lossless history: one key and value per token. Retrieval can point at a single buried fact. The cost is a cache that scales with length.",
        "Linear attention and selective state-space models replace that history with a fixed-size recurrent state. Decode becomes O(1) in sequence length. Training can still use a parallel scan.",
        "Arora et al. (2024) make the tradeoff empirical and almost monotone: associative recall tracks state size. No fixed-state model in the survey has matched softmax on heavy in-context retrieval.",
        "Hybrids are the compromise you should be able to name: keep a few real attention layers — Jamba uses about one attention layer per seven Mamba layers, plus MoE — and collapse the cache to only those layers.",
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
      src: "/videos/lecture-decoding.mp4?v=3",
      title: "Narrated lecture",
      caption: "Press play. This lesson is read aloud. The picture follows the argument.",
      transcript: [
        "A cheap draft proposes γ future tokens. The expensive target scores all of them in one parallel forward pass.",
        "In the memory-bound regime that pass costs about the same wall-clock time as a single token, because the weights were going to be loaded anyway.",
        "An acceptance rule keeps only a prefix whose conditionals match the target, and resamples at the first mismatch. Done carefully, the marginal distribution of the text is exactly the target’s. The method is lossless.",
        "End-to-end speedup is about the mean accepted length τ, minus the cost of drafting and verification. At large batch the target is already near compute-bound, and τ greater than 1 stops paying.",
        "Diffusion, vanilla Jacobi-under-sampling, and skeleton-of-thought do not make this lossless guarantee. That boundary is an open problem in §8.2.",
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
      src: "/videos/lecture-compression.mp4?v=3",
      title: "Narrated lecture",
      caption: "Press play. This lesson is read aloud. The picture follows the argument.",
      transcript: [
        "Halving the bits halves decode traffic. Outliers ruin a uniform grid.",
        "KIVI quantizes keys per channel and values per token. Do not swap them.",
        "Memory savings multiply. Quality errors do not add when the methods are stacked.",
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
      src: "/videos/lecture-systems.mp4?v=3",
      title: "Narrated lecture",
      caption: "Press play. This lesson is read aloud. The picture follows the argument.",
      transcript: [
        "FlashAttention is exact softmax. It avoids writing the big attention matrix.",
        "PagedAttention hands out sixteen-token pages instead of a max-length reservation.",
        "Split prefill and decode so a long prompt does not stall every user.",
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
      src: "/videos/lecture-synthesis.mp4?v=3",
      title: "Narrated lecture",
      caption: "Press play. This lesson is read aloud. The picture follows the argument.",
      transcript: [
        "Architecture, decoding, compression, and paging all write the same cache ledger.",
        "They stack. The friction is that each new layout wants a new kernel.",
        "Prefill and decode want different number formats. Production does not split them yet.",
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
      src: "/videos/lecture-frontiers.mp4?v=3",
      title: "Narrated lecture",
      caption: "Press play. This lesson is read aloud. The picture follows the argument.",
      transcript: [
        "Fixed state loses associative recall. Hybrids only rent attention back.",
        "Speculation stays lossless only while the draft matches the target.",
        "Stacked compression errors do not add. Co-design is the unfinished job.",
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
    prompt: "A decode step at batch 1 moves FP16 weights and performs one MAC per parameter. Operational intensity is about…",
    options: ["1 FLOP/byte", "The ridge point, roughly 300 FLOP/byte", "O(t²)", "2 bytes, regardless of FLOPs"],
    answer: 0,
    why: "§2.3. 2|θ| FLOPs over 2|θ| bytes. The two factors of two are a coincidence of MACs and FP16.",
  },
  {
    id: "e2",
    prompt: "Which bottleneck primarily caps per-user generation speed?",
    options: ["Memory capacity", "Memory bandwidth", "Interconnect only", "Calibration set size"],
    answer: 1,
    why: "§2.4.2. Capacity caps concurrent users. Bandwidth caps single-stream token rate, about bandwidth/(2|θ|) in FP16.",
  },
  {
    id: "e3",
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
