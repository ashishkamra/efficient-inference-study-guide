"""Storyboards for the Ridge narrated lectures.

Each slide pairs one idea, one diagram, and the exact words spoken while it is on
screen. Narration is synthesised per slide, so the picture and the voice cannot
drift apart.
"""

LESSONS = [
    {
        "id": "shift",
        "kicker": "Lesson 01 · From training to the inference stack",
        "title": "From training to the inference stack",
        "slides": [
            {
                "head": "The bill moved from training to serving.",
                "bullets": ["Training is paid once.", "Serving is paid on every query."],
                "fig": "cost_curve",
                "say": "For a decade, the expensive part of a large language model was training. That is no longer the bill that matters. Training is paid once, then amortized across billions of queries. Inference is paid every time someone asks the model anything. Real time products, agent loops, and multi step reasoning have moved the cost.",
            },
            {
                "head": "Prefill and decode are different machines.",
                "bullets": ["Prefill reads the prompt once.", "Decode reads the weights for every token."],
                "fig": "prefill_decode",
                "say": "A serving request has two lives. Prefill reads the whole prompt at once, fills the key value cache, and does a lot of arithmetic for every byte it loads. It is compute bound. Decode then emits one token at a time. For every token, billions of parameters stream from high bandwidth memory into on chip memory. Decode is bandwidth bound.",
            },
            {
                "head": "Four pillars, one co-designed stack.",
                "bullets": ["Each pillar is defined by where it is inserted.", "They compose; they are not alternatives."],
                "fig": "stack",
                "params": {
                    "layers": [
                        {"label": "Architecture", "note": "linear attention · Mamba · MoE · GQA / MLA", "tint": (247, 227, 213), "accent": (196, 81, 26)},
                        {"label": "Decoding", "note": "speculation · diffusion · Jacobi · early exit", "tint": (248, 239, 216), "accent": (176, 122, 22)},
                        {"label": "Compression", "note": "INT4 · KV quantization · 2:4 sparsity · distillation", "tint": (226, 240, 234), "accent": (31, 107, 86)},
                        {"label": "Hardware & systems", "note": "FlashAttention · paging · continuous batching", "tint": (222, 232, 243), "accent": (54, 102, 158)},
                    ]
                },
                "say": "The survey's central claim is that efficiency is not a bag of independent tricks. It is one co designed stack, organized by where a method is inserted. Architecture changes what the model is. Decoding changes how tokens are produced. Compression changes the bits and the density. Hardware and systems turn the specification into wall clock throughput.",
            },
            {
                "head": "Architecture changes what the model is.",
                "bullets": ["Linear attention and Mamba trade recall for state.", "Hybrids and MoE soften the trade."],
                "fig": "tree",
                "params": {
                    "root": "the model itself",
                    "children": ["linear attention", "state-space", "hybrid", "MoE", "KV sharing"],
                    "grandchildren": [
                        ["Performer, RetNet", "constant-time update"],
                        ["Mamba 2, RWKV", "selective gate"],
                        ["Jamba: 1 in 8", "plus MoE"],
                        ["top-2 routing", "compute only"],
                        ["MQA, GQA, MLA", "smaller cache"],
                    ],
                },
                "say": "The first pillar edits the model itself. Linear attention and state space models such as Mamba replace the growing cache with a fixed state. Hybrids keep a few real attention layers among many cheap ones. Mixture of experts cuts the compute each token spends. And multi query, grouped query, and latent attention shrink the cache without leaving the transformer.",
            },
            {
                "head": "Decoding buys tokens with idle compute.",
                "bullets": ["A draft proposes; the target checks.", "One weight read can emit several tokens."],
                "fig": "spec_timeline",
                "say": "The second pillar leaves the weights alone. It changes how tokens are produced, so that one read of the weights can emit more than one token. Speculative decoding has a cheap draft propose a run of tokens, and the target model check them all in a single pass. Diffusion language models and Jacobi iteration push the same idea further, at the cost of exactness.",
            },
            {
                "head": "Compression spends a quality budget.",
                "bullets": ["Fewer bits, fewer live weights.", "Capacity and bandwidth, paid in accuracy."],
                "fig": "bytes_bars",
                "say": "The third pillar spends a quality budget. Quantization stores weights and caches in fewer bits. Sparsity keeps only some of the weights alive. Distillation trains a smaller student. These methods buy capacity and bandwidth, and they pay in accuracy, which is why the survey treats compression as a budget rather than a free win.",
            },
            {
                "head": "Systems turn a specification into speed.",
                "bullets": ["Fewer bytes moved, less memory reserved.", "Mostly lossless: same outputs, less waste."],
                "fig": "system_flow",
                "say": "The fourth pillar is where a cheaper model becomes a faster server. FlashAttention moves fewer bytes. Paged attention stops the engine from reserving memory it will never use. Continuous batching admits new requests at every step. Disaggregation puts prefill and decode on different machines. This pillar is mostly lossless: same outputs, less waste.",
            },
            {
                "head": "One object ties the pillars together.",
                "bullets": ["Every method moves a term of the cache.", "Name the term and the paper has a place."],
                "fig": "cache_hub",
                "say": "Hold on to one object through the whole course: the key value cache. Architecture reduces a dimension of it. Decoding validates against it in parallel. Compression shortens each entry. Systems decides where the entries physically live. If you can say which part of the cache a technique moves, you can place almost any paper in this survey.",
            },
        ],
    },
    {
        "id": "bottlenecks",
        "kicker": "Lesson 02 · Bottlenecks and the roofline",
        "title": "Bottlenecks, roofline, and the metrics that matter",
        "slides": [
            {
                "head": "The roofline says which resource binds.",
                "bullets": ["Intensity is work divided by bytes.", "The ridge is peak compute over bandwidth."],
                "fig": "roofline",
                "say": "Operational intensity is floating point work divided by bytes moved from main memory. Hardware gives you two peaks: compute per second, and bandwidth per second. Their ratio is the ridge point, the lowest intensity that can keep the compute units full. Below the ridge you are memory bound. At or above it, you hit the flat compute ceiling.",
            },
            {
                "head": "Batch-one decode sits near one operation per byte.",
                "bullets": ["Two operations per parameter, two bytes.", "The factors cancel; the ridge does not."],
                "fig": "intensity_bars",
                "say": "Here is the number people misremember. At batch one, in sixteen bit floating point, a decode step does about two times the parameter count in operations. The same step moves about two times the parameter count in bytes. Those two factors of two are unrelated, but they cancel, so intensity is about one operation per byte. Eight bit halves the bytes. Four bit halves them again. Modern accelerators have ridge points in the hundreds.",
            },
            {
                "head": "Four physical bottlenecks, four ceilings.",
                "bullets": ["Capacity caps how many users fit.", "Bandwidth caps how fast one user is served."],
                "fig": "layered_bottlenecks",
                "layout": "wide",
                "say": "Four resources bound serving. Memory capacity limits how many users fit on one accelerator. Memory bandwidth limits how fast one user is served. Compute throughput limits prefill and large batch decode, and it depends on the numeric format. Interconnect and numeric support limit sharding, and splitting prefill from decode. Every pillar attacks a subset of these four.",
            },
            {
                "head": "Aggregate throughput can hide a bad user.",
                "bullets": ["Goodput counts only tokens inside the target.", "Time to first token is not time per token."],
                "fig": "measure_map",
                "layout": "wide",
                "say": "The metrics matter as much as the physics. Aggregate tokens per second can look excellent while one user waits. Goodput counts only the tokens that meet a latency target. Time to first token is queueing plus prefill. Time per output token is decode, set by bandwidth and cache size. Report the metric that matches the claim you are making.",
            },
            {
                "head": "Latency is a timeline, not a number.",
                "bullets": ["TTFT: queue plus prefill.", "TPOT: the gap between decode steps."],
                "fig": "latency_timeline",
                "say": "Picture one request on a timeline. It waits in the queue. Prefill runs, and the first token appears: that is time to first token. Then decode emits one token per step. The gap between those tokens is time per output token. A long prefill on the same GPU as in flight decodes stalls every user, and that shows up in TPOT.",
            },
            {
                "head": "Fast tokens outside the target are waste.",
                "bullets": ["Throughput counts everything.", "Goodput counts what met the SLO."],
                "fig": "goodput_bars",
                "say": "Suppose a server reports a hundred thousand tokens per second, but only sixty two thousand arrive inside the latency target. The rest are fast but useless to the product. Goodput is the honest number. It is also the number a scheduler should optimize, which is why disaggregated serving papers phrase their results as goodput under a target.",
            },
            {
                "head": "Batching buys throughput until memory runs out.",
                "bullets": ["The curve flattens at the compute roof.", "The cache keeps growing with the batch."],
                "fig": "batch_curve",
                "say": "Increasing the batch turns a memory bound decode into a compute bound one. Throughput rises, then flattens as the tensor cores saturate, while the cache keeps growing with every extra request. At some point capacity, not arithmetic, is the limit. That curve is the reason batching, cache compression, and paging are studied together.",
            },
            {
                "head": "Three questions place any technique.",
                "bullets": ["Which bottleneck does it attack?", "Is the output exact, and what do you pay?"],
                "fig": "method",
                "say": "How to study this exam. For every technique, name the bottleneck it attacks. Say whether the output distribution is preserved exactly. And say what you pay: recall, quality, or engineering complexity. Those three questions turn a pile of papers into a map, and they are the questions the rest of this course keeps asking.",
            },
        ],
    },
    {
        "id": "kv",
        "kicker": "Lesson 03 · The key-value cache",
        "title": "The key-value cache",
        "slides": [
            {
                "head": "Autoregression turns history into memory.",
                "bullets": ["One new query attends over every past key.", "Recompute is quadratic; reuse is linear."],
                "fig": "attention_mask",
                "say": "A decoder only model factorizes a sequence with the chain rule. Each next token is conditioned on everything before it. At every layer, the hidden state is projected into a query, a key, and a value, and causal attention mixes them. During decoding only one new query is formed, but it attends over every past key. Recomputing that history at every step would be quadratic, so the engine stores it.",
            },
            {
                "head": "The cache has a formula you can manipulate cold.",
                "bullets": ["Six factors, one for each lever.", "The leading two is keys versus values."],
                "fig": "formula",
                "params": {
                    "expr": "bytes = 2  x  layers  x  kv_heads\n     x  head_dim  x  length\n     x  batch  x  bytes_per_element",
                    "caption": "S_kv, equation 5 of the survey. Every pillar pulls one factor.",
                },
                "say": "Cache bytes equal two, times the number of layers, times the number of key value heads, times head dimension, times sequence length, times batch size, times bytes per element. The leading two is keys versus values. Bytes per element is two for sixteen bit floats, one for eight bit, and one half for four bit. Learn the formula, and every method becomes a lever on one term.",
            },
            {
                "head": "Every pillar pulls a different term.",
                "bullets": ["GQA moves the head count.", "Quantization moves the bytes."],
                "fig": "cache_levers",
                "say": "Grouped query and multi query attention reduce the number of key value heads. Quantization reduces bytes per element. Eviction and sliding windows reduce the effective length. A bigger batch multiplies the cache, which buys throughput and spends capacity. Multi head latent attention does not fit the formula at all: it stores one low rank code per token and rebuilds keys and values at attention time.",
            },
            {
                "head": "A worked example makes the size real.",
                "bullets": ["32 layers, 8 KV heads, 128-dim heads.", "The weights never change; the users do."],
                "fig": "kv_workload",
                "say": "Take a model with thirty two layers, eight key value heads, and a head dimension of one hundred and twenty eight, in sixteen bit. At four thousand tokens and batch one, the cache is about half a gigabyte. At batch eight it is four gigabytes. At batch thirty two it reaches sixteen gigabytes. The weights have not changed. Only the number of users has.",
            },
            {
                "head": "Latent attention stores a code, not a pair.",
                "bullets": ["One low-rank vector per token.", "Keys and values are rebuilt in the kernel."],
                "fig": "mla",
                "say": "DeepSeek's multi head latent attention compresses the cache before it is written. Each token produces one low rank latent vector, and the kernel reconstructs keys and values on the fly. The leading factor of two disappears, and the stored width is much smaller than a full head. The survey keeps the classic formula as the baseline and treats latent attention as a structural change.",
            },
            {
                "head": "Prefill writes; decode reads and appends.",
                "bullets": ["Prefill fills every prompt position at once.", "Each decode step adds one pair."],
                "fig": "cache_timeline",
                "say": "Prefill writes the cache for the whole prompt in one compute bound pass. Decode then reads the history, attends, and appends one new pair per layer. Production blurs the textbook split. Chunked prefill slices a long prompt so decode can be interleaved, and continuous batching admits new requests at every step. Both still use this same cache.",
            },
            {
                "head": "Eviction is a recall decision.",
                "bullets": ["A window caps the length term.", "The dropped token cannot be recovered."],
                "fig": "window",
                "say": "The simplest way to cut the length term is to forget. A sliding window keeps only the most recent tokens, and the cache stops growing. Streaming systems add eviction policies that score each entry. The saving is real, but it is not free: once a fact scrolls out of the window, no later attention head can point at it. Eviction is a recall decision wearing a memory costume.",
            },
        ],
    },
    {
        "id": "architecture",
        "kicker": "Lesson 04 · Architectural foundations",
        "title": "Architectural foundations",
        "slides": [
            {
                "head": "Attention pays in memory; state pays in recall.",
                "bullets": ["Softmax keeps a lossless history.", "A fixed state cannot."],
                "fig": "cache_growth",
                "say": "Every family in this pillar either deletes the cache, shrinks it, sparsifies access to it, or hybridizes so that recall survives. Softmax attention keeps a lossless history: one key and one value per token, and you can point at a single buried fact. The cost is memory that grows with length. Subquadratic mixers replace that history with a fixed size state, and the state cannot grow.",
            },
            {
                "head": "Linear attention keeps a summary.",
                "bullets": ["A d by d matrix replaces the cache.", "The update cost ignores sequence length."],
                "fig": "linear_summary",
                "say": "Linear attention drops the softmax and factors the mixer through a feature map. A summary matrix replaces the cache and updates independently of length. That makes decode cheap, but one summary cannot remember arbitrary content. The persistent failure is recall: the model can capture a distribution, not a specific fact it saw a thousand tokens ago.",
            },
            {
                "head": "Mamba makes the recurrence selective.",
                "bullets": ["The transition depends on the input.", "Constant time per decode step."],
                "fig": "mamba",
                "say": "State space models take the other route. Mamba makes the recurrence selective: the transition depends on the current input, so the state can choose what to keep. The state has a fixed size, which makes decoding constant time per step, and a hardware aware scan keeps training competitive. Mamba two unifies state space models with linear attention. RWKV arrives at a similar recurrent mixer from the transformer side.",
            },
            {
                "head": "Recall tracks state size, almost monotonically.",
                "bullets": ["The gap narrows but does not close.", "No fixed-state model matches softmax."],
                "fig": "recall_curve",
                "say": "Arora and colleagues make the tradeoff explicit. On associative retrieval, recall tracks state size, almost monotonically. Give the model a bigger state and it remembers more. But no fixed state model in the survey matches softmax attention on heavy in context retrieval. The gap narrows; it does not close. That curve is the pillar's central result.",
            },
            {
                "head": "Put the families side by side.",
                "bullets": ["State per token is the axis that matters.", "Every family sits somewhere on it."],
                "fig": "family_map",
                "layout": "wide",
                "say": "Line the families up by what they store per token. Softmax attention stores a key and a value at every layer and keeps recall exactly. Linear attention stores a matrix. A selective state space model stores a fixed hidden state. A hybrid stores attention entries only on its attention layers. The table is the pillar in one glance.",
            },
            {
                "head": "Experts cut compute, not state.",
                "bullets": ["A router activates a few experts.", "Every expert still occupies memory."],
                "fig": "moe",
                "say": "Mixture of experts cuts per token compute, not per token state. A router sends each token to a few experts, so activated parameters separate from total parameters. DeepSeek scales to hundreds of billions of total parameters with only tens of billions active. But all experts must still live somewhere, and the cache for a token is unchanged. It is a compute lever, not a capacity lever.",
            },
            {
                "head": "The cache can shrink inside a transformer.",
                "bullets": ["MQA saves the most and costs quality.", "GQA is the production default."],
                "fig": "kv_heads",
                "say": "Even inside a normal transformer, the cache can shrink. Multi query attention uses one key value head and loses quality. Grouped query attention is the production default, because it sits between full sharing and full duplication. Latent attention stores a small code and rebuilds keys and values. Each of these is a different answer to the same question: how much history do we keep per token?",
            },
            {
                "head": "The recall-efficiency frontier is still open.",
                "bullets": ["Cheaper memory moves left.", "Lossless recall moves right."],
                "fig": "frontier",
                "say": "What this pillar buys is capacity and bandwidth: more concurrent users, and faster single stream decode. The price is the recall efficiency frontier. Full attention sits at one corner. Mamba and linear attention sit at the other. Hybrids and latent attention sit between them. The survey is explicit that this frontier is not closed, which is why it returns as an open problem at the end.",
            },
        ],
    },
    {
        "id": "decoding",
        "kicker": "Lesson 05 · Decoding algorithms",
        "title": "Decoding algorithms",
        "slides": [
            {
                "head": "One weight read can emit several tokens.",
                "bullets": ["Draft cheaply, verify in parallel.", "The sequential chain becomes a batch."],
                "fig": "spec_timeline",
                "say": "Leave the weights alone, and spend idle tensor cores so that one sequential read of the weights can emit more than one token. The dividing line is whether the output distribution stays exactly the target model's. Speculative decoding is the production technique: a cheap draft proposes a short run of candidate tokens, and the expensive target scores all of them in one parallel forward pass.",
            },
            {
                "head": "Keep the longest valid prefix.",
                "bullets": ["Accept until the first mismatch.", "Resample at that position."],
                "fig": "spec_tree",
                "say": "An acceptance rule keeps a prefix whose conditionals match the target, and resamples at the first mismatch. Done carefully, the marginal distribution of the text is exactly the target's, so the method is lossless. Lossless does not mean free. Rejected drafts are wasted work, and a flat draft wastes the verifier if the first position is already wrong. Tree methods submit alternatives and take the longest valid path.",
            },
            {
                "head": "The acceptance rule is what makes it exact.",
                "bullets": ["Accept with probability min(1, p/q).", "Otherwise sample from the residual."],
                "fig": "formula",
                "params": {
                    "expr": "accept x  with  min(1, p(x) / q(x))\notherwise  sample  from  (p - q)+\n\nE[accepted] = tau",
                    "caption": "Rejection sampling restores the target distribution exactly.",
                },
                "say": "The rule is rejection sampling. For a proposed token, accept it with probability equal to the target probability divided by the draft probability, capped at one. If the token is rejected, sample from the residual, the part of the target the draft did not cover. That correction is what makes speculation exact. The marginal distribution of the emitted text is the target's, not an approximation of it.",
            },
            {
                "head": "Speculation wins in the latency regime.",
                "bullets": ["Speedup tracks accepted length.", "Large batches erase the win."],
                "fig": "spec_batch",
                "say": "End to end speedup is about the mean accepted length, minus the cost of drafting and verification. At batch one, the check costs almost the same as a single token, because the weights were going to be loaded anyway. Speculation helps least when the batch is already large and the target is near compute bound. It is most attractive for low batch, latency sensitive work: chat, and code completion.",
            },
            {
                "head": "Drafters differ in where they get the draft.",
                "bullets": ["The target can draft from itself.", "Lookup wins when input and output overlap."],
                "fig": "draft_sources",
                "layout": "wide",
                "say": "The first drafters were separate small models. Later methods draft from the target itself. Medusa hangs extra heads on the last hidden state. EAGLE drafts in feature space, where the next feature is less uncertain than the sampled token, and later versions add dynamic trees. Prompt lookup is strong when the input and the output overlap, such as code edits or retrieval.",
            },
            {
                "head": "Diffusion denoises a block in parallel.",
                "bullets": ["No left-to-right order.", "Independence assumptions make it lossy."],
                "fig": "diffusion",
                "say": "Diffusion language models abandon left to right generation. They denoise a masked sequence over a few steps, producing a whole block at once. The cost is an independence assumption inside the parallel block. Errors drift on long reasoning. These methods are lossy by design: they trade exact conditionals for wide parallel blocks, which is sometimes the right trade on a memory bound machine.",
            },
            {
                "head": "Early exit can become a drafter.",
                "bullets": ["Leave before the last layer when confident.", "Layer Skip verifies with the full model."],
                "fig": "early_exit",
                "say": "Jacobi decoding updates several future positions together. For greedy decoding it can converge to the same answer as stepping one token at a time. Early exit leaves before the last layer when the next token is already confident. Layer Skip uses that early exit as the drafter and the full model as the verifier. That combination is lossless again, which is the pattern to remember.",
            },
            {
                "head": "Sort decoders by exactness first.",
                "bullets": ["Exact methods keep the target distribution.", "Approximate methods buy parallelism."],
                "fig": "decoder_trade",
                "say": "Pillar two buys bandwidth. It spends compute that was sitting idle, and it does not shrink memory capacity. The clean way to compare decoders is exactness first. Speculation with rejection sampling and Layer Skip preserve the target. Diffusion, sampled Jacobi, and skeleton of thought do not. Both groups are useful, but only one of them is safe to describe as lossless.",
            },
        ],
    },
    {
        "id": "compression",
        "kicker": "Lesson 06 · Compression and the quality budget",
        "title": "Compression and the quality budget",
        "slides": [
            {
                "head": "Halving the bits halves the traffic.",
                "bullets": ["Weight bytes dominate decode.", "Cache bytes follow the same rule."],
                "fig": "bytes_bars",
                "say": "Production language models carry more precision than next token prediction needs, and many weights can be skipped. Halving the bytes per weight halves both the footprint and the traffic during decode. That is why compression is the most direct attack on the bandwidth bottleneck. Most of these methods are post training: you start from a finished checkpoint and spend a budget.",
            },
            {
                "head": "Outliers ruin a uniform grid.",
                "bullets": ["A few channels are orders of magnitude larger.", "A naive 4-bit grid crushes the rest."],
                "fig": "quant_grid",
                "say": "The catch is outliers. A few channels are orders of magnitude larger than the rest, and a naive uniform grid wastes its range on them. The small weights collapse into a handful of levels. Every serious quantization method is a response to that histogram: protect the outliers, rotate them away, or give them their own scale. Quantization is mostly the study of a few extreme values.",
            },
            {
                "head": "Three formats, three different pressures.",
                "bullets": ["Weights, activations, and cache.", "The production point is W4A8."],
                "fig": "quant_matrix",
                "layout": "wide",
                "say": "Separate the formats. Weight only quantization matters first, because decode traffic is mostly weights. Activations are harder, because they are computed online and they move. SmoothQuant rescales each channel so the difficulty moves from activations onto weights. The production point the survey highlights is four bit weights with eight bit activations, co designed with the kernel.",
            },
            {
                "head": "Weight-only methods fix different failures.",
                "bullets": ["GPTQ corrects error after rounding.", "AWQ protects salient channels."],
                "fig": "weight_methods",
                "say": "GPTQ brings second order error correction down to four bits at huge scale. AWQ protects the channels that activations say are salient. QuIP rotates the weights so outliers spread out. BitNet trains a tiny weight alphabet from scratch, which is training aware rather than post training. They are not interchangeable: each one assumes a different source of error and a different budget.",
            },
            {
                "head": "SmoothQuant moves the difficulty.",
                "bullets": ["Activation outliers become weight outliers.", "The kernel is designed with the format."],
                "fig": "smoothquant",
                "say": "Activations are harder than weights because they are produced at run time. SmoothQuant rescales each channel so that the hard part moves from the activations onto the weights. The weights can absorb it, and the activations become easy to quantize. That single trick is what makes four bit weights with eight bit activations practical, and it only works because the kernel was built for that layout.",
            },
            {
                "head": "The cache has its own quantization.",
                "bullets": ["KIVI: two bits, no extra tuning.", "Keys per channel, values per token."],
                "fig": "kivi",
                "say": "The cache has its own quantization. KIVI is the one to remember: asymmetric, about two bits, with no extra tuning. Keys use per channel quantization, because outlier channels line up across tokens. Values use per token quantization, because their outliers line up within a token. Do not swap those. Cache quantization stacks with grouped query attention because they touch different terms of the footprint.",
            },
            {
                "head": "Sparsity needs a hardware pattern.",
                "bullets": ["Arbitrary zeros do not speed up dense cores.", "2:4 is the pattern the silicon runs."],
                "fig": "two_four",
                "say": "Pruning removes structure rather than bits. Unstructured sparsity can zero half the weights, but ordinary hardware cannot accelerate arbitrary zeros. The practical pattern is two of every four weights kept. Sparse tensor cores run that pattern at about twice dense throughput. The lesson generalizes: a compression scheme only pays when the kernel and the hardware agree on its shape.",
            },
            {
                "head": "Stacked compression does not add up.",
                "bullets": ["Memory savings multiply.", "Quality errors interact."],
                "fig": "compression_stack",
                "say": "Deployed models are quantized and pruned and distilled. Memory savings often multiply, but quality errors do not add. Each stage was calibrated on the model that entered it. Change the architecture first, and a grid fit to the dense model can collapse. That is why the survey keeps compression budgets separate, and why composed error is one of its three open problems.",
            },
        ],
    },
    {
        "id": "systems",
        "kicker": "Lesson 07 · Hardware and systems",
        "title": "Hardware and systems",
        "slides": [
            {
                "head": "FlashAttention never writes the big matrix.",
                "bullets": ["Tile queries, keys, and values through SRAM.", "Softmax runs online, exactly."],
                "fig": "flash_tiles",
                "say": "Textbook softmax writes a full attention matrix into high bandwidth memory, and those bytes dominate the arithmetic. FlashAttention tiles queries, keys, and values through on chip memory, runs softmax online, and writes only the output. It is exact, not an approximation, and often two to four times faster. The third version adds eight bit floats and reaches about three quarters of an H one hundred's peak.",
            },
            {
                "head": "The win is traffic, not a new mixer.",
                "bullets": ["Same math, fewer HBM round trips.", "Four times less traffic in the usual case."],
                "fig": "hbm_bars",
                "say": "The point of the kernel is memory traffic. The arithmetic is unchanged, but the attention matrix never reaches high bandwidth memory. FlashInfer then targets serving rather than training: paged layouts, ragged batches, and the attention variants production actually uses. Those kernels were shaped for training, where queries, keys, and values have similar lengths. Decode has one query against a long cache.",
            },
            {
                "head": "Do not reserve the maximum length.",
                "bullets": ["Contiguous slots fragment memory.", "Pages are allocated on demand."],
                "fig": "paging",
                "say": "Manage the cache like virtual memory. Reserving one contiguous slot out to the maximum length fragments memory, because requests die early. PagedAttention allocates fixed pages, typically sixteen tokens, and keeps a block table per request. The outputs do not change. Only the wasted reservation does. That single idea is why a serving engine can hold many more concurrent requests than a naive allocator.",
            },
            {
                "head": "Continuous batching fills the gaps.",
                "bullets": ["Step everyone once per iteration.", "Admit new work at the boundary."],
                "fig": "batching",
                "say": "Continuous batching is the matching scheduler. Do not wait for the longest request. Step everyone once, and admit new work at the boundary. Static batching leaves the GPU idle while a short request waits behind a long one. Continuous batching keeps the batch full, which raises throughput without changing any model output. It is a scheduling win, not an approximation.",
            },
            {
                "head": "Shared prefixes should not be prefilled twice.",
                "bullets": ["System prompts repeat across users.", "A radix tree caches and evicts them."],
                "fig": "radix",
                "say": "System prompts, few shot examples, and chat history repeat across requests. SGLang's RadixAttention stores cache entries in a tree and evicts the cold ones. A new request that shares a prefix starts from the cached node instead of re prefilling. That is a pure capacity and latency win, and it is why prefix caching has become standard in open serving stacks.",
            },
            {
                "head": "A long prefill stalls every decode.",
                "bullets": ["Split the phases onto different pools.", "Prefill wants compute; decode wants bandwidth."],
                "fig": "disaggregate",
                "say": "A long prefill on the same GPU as in flight decodes stalls every user and blows up time per output token. DistServe, Splitwise, and Mooncake split the phases onto different pools. DistServe optimizes goodput under a latency target. Splitwise puts compute heavy GPUs on prefill and bandwidth heavy GPUs on decode. Mooncake adds a global cache pool. Sarathi gets much of the benefit without a second pool, by chunking prefill.",
            },
            {
                "head": "Goodput is the metric that survives the tail.",
                "bullets": ["Throughput counts the slow tail.", "An SLO turns latency into a budget."],
                "fig": "slo_curve",
                "say": "Any scheduler can look good on average. The tail is what users feel. A latency target turns the distribution into a budget: count only the requests that finish inside it. That is goodput, and it is the right objective for a split topology, because moving work between pools changes the tail before it changes the mean.",
            },
            {
                "head": "The open stacks have converged.",
                "bullets": ["Paging, batching, FlashAttention, prefix cache.", "What differs is scheduling and kernel quality."],
                "fig": "stack_compare",
                "layout": "wide",
                "say": "The open stacks have converged on paging, continuous batching, FlashAttention, and prefix caches. What still differs is scheduling policy, kernel quality, and how cleanly a stack joins a disaggregated topology. That is the systems pillar in one sentence: the primitives are settled, and the remaining gains come from co designing them with the model and the hardware.",
            },
        ],
    },
    {
        "id": "synthesis",
        "kicker": "Lesson 08 · One cache, four axes",
        "title": "One cache, four axes",
        "slides": [
            {
                "head": "The cache is the ledger every pillar writes in.",
                "bullets": ["Architecture moves a dimension.", "Compression shortens the word."],
                "fig": "ledger",
                "layout": "wide",
                "params": {
                    "columns": ["pillar", "moves", "example"],
                    "rows": [
                        ["Architecture", "n_kv_heads", "GQA 8 -> 1"],
                        ["Decoding", "draft tree", "EAGLE-2"],
                        ["Compression", "bytes/element", "2-bit KIVI"],
                        ["Systems", "allocation", "16-token pages"],
                    ],
                },
                "say": "You cannot optimize the layers in isolation. First, the key value cache is a ledger every pillar writes in. Architecture reduces a structural dimension: fewer key value heads, or a latent width. Decoding routes validation: tree shaped drafts, checked under a mask. Compression reduces word length, down to about two bit asymmetric grids. Systems allocates physical blocks: page tables, and trees for shared prefixes.",
            },
            {
                "head": "The wins add; the layouts fight.",
                "bullets": ["A real deployment runs all four at once.", "Every combination wants a new kernel."],
                "fig": "layout",
                "say": "These add. A real deployment can run grouped query attention, speculative trees, a four bit cache, and paged attention together. The friction is layout. Quantized caches used to be widened back to sixteen bit before a stock attention kernel. Newer kernels attend directly in the low bit layout. But every new combination of bit width, head sharing, and page size wants a new kernel. That co design burden is the cost of the additive win.",
            },
            {
                "head": "Prefill and decode want opposite formats.",
                "bullets": ["Prefill wants wide, compute-friendly formats.", "Decode wants narrow weights."],
                "fig": "phase_formats",
                "say": "On one GPU, a single numeric format has to serve two masters. Prefill wants eight bit weights and eight bit activations, or eight bit floats, to fill the tensor cores. Decode wants narrow weights, four bit or even two bit, to cut bytes on the bus. One format is always a compromise for one of the two phases, and that compromise is measurable.",
            },
            {
                "head": "Disaggregation makes two formats possible.",
                "bullets": ["Different schemes per phase become conceivable.", "No production system does it yet."],
                "fig": "disaggregate",
                "say": "Disaggregation makes different schemes per phase conceivable. SmoothQuant on the prefill pool. GPTQ on the decode pool. The survey is explicit that it does not know of a production system doing this yet. It is future work, not current practice. Do not overclaim it. The topology makes it possible, but the kernels and the scheduler have to catch up.",
            },
            {
                "head": "Speculation moves the machine mix.",
                "bullets": ["Verification pushes decode toward compute.", "The node link can become the bottleneck."],
                "fig": "spec_machine",
                "say": "Speculation changes the machine mix. Heavy verification pushes decode toward a compute bound envelope, so the right ratio of prefill nodes to decode nodes moves. The new bottleneck can be the link inside the node, rather than high bandwidth memory. If you only memorize that speculation saves bandwidth, you miss this second order effect, and you will mis size the cluster.",
            },
            {
                "head": "Four levers multiply the win.",
                "bullets": ["Each lever is independent in theory.", "The product is what reaches production."],
                "fig": "additive",
                "say": "When two techniques stack, say which term of the cache formula each one moves, or which side of the roofline. If you cannot, they are probably not as independent as the abstracts claim. Grouped query attention at four times, a four bit cache at four times, and paging at a small constant multiply into something none of them achieves alone. The product is the story.",
            },
            {
                "head": "Name the term, or it is not independent.",
                "bullets": ["Bottleneck, exactness, price.", "That is the whole exam method."],
                "fig": "method",
                "say": "The synthesis is a habit, not a formula. For every paper, name the term of the cache it moves or the side of the roofline it attacks. Then say whether the output is exact, and what the method pays. If two techniques touch the same term in incompatible ways, they do not compose for free. If they touch different terms, the savings multiply. That is how to read the rest of the literature.",
            },
        ],
    },
    {
        "id": "frontiers",
        "kicker": "Lesson 09 · Three open frontiers",
        "title": "Three open frontiers",
        "slides": [
            {
                "head": "A fixed state cannot point at one fact.",
                "bullets": ["Recall falls as context grows.", "The frontier is still open."],
                "fig": "recall_gap",
                "say": "The stack is not finished. The first open problem is recall versus efficiency for subquadratic state. A fixed recurrent state is an information bottleneck. Unlike the key value cache, it cannot keep a lossless history. Needle in a haystack retrieval, long multi turn logs, and hard in context learning degrade. Hybrids rent back a little attention, and with it a cache that still grows with context.",
            },
            {
                "head": "Hybrids rent attention back.",
                "bullets": ["One attention layer for every seven Mamba layers.", "The cache returns, and grows again."],
                "fig": "hybrid",
                "say": "Jamba is the clearest compromise: about one attention layer for every seven Mamba layers, plus mixture of experts. The cache then exists only on the attention layers, so it is smaller than full attention, but it still grows with sequence length. Hybrids do not close the tradeoff. They move along it. The open problem is how to bound memory without losing non local associative recall.",
            },
            {
                "head": "Speculation is exact only while drafts match.",
                "bullets": ["Acceptance length drives the speedup.", "If it falls to zero, verification is waste."],
                "fig": "acceptance",
                "say": "The second frontier is the lossless versus lossy line in parallel decoding. Speculation stays lossless only while the draft is aligned with the target. If the draft distribution drifts, the mean accepted length falls toward zero, and verification is pure waste. Newer drafters move toward the verifier offline or in batches. A principled realignment on each request is still open.",
            },
            {
                "head": "Realignment is still an open loop.",
                "bullets": ["Offline and batched updates exist.", "Per-request alignment does not."],
                "fig": "realign",
                "say": "The practical fixes are offline and batched. Train the drafter against the verifier, refresh it periodically, and accept that it drifts between refreshes. A per request realignment would be better, but it costs the very compute speculation was meant to save. Diffusion and consistency models sit on the lossy side on purpose. They trade exact left to right conditionals for wide parallel blocks, and the question is whether that trade is acceptable on a bandwidth bound machine.",
            },
            {
                "head": "Composed compression has no error bound.",
                "bullets": ["Each stage recalibrates on the last model.", "The total can exceed the sum of the parts."],
                "fig": "error_budget",
                "say": "The third frontier is error under composed compression. A plausible pipeline prunes structure, linearizes the remaining attention by distillation, then quantizes. Each stage was calibrated on the model that entered it. Total error can be much larger than the sum of the three pieces. A composition theory with predictable bounds is still open, especially off the datacenter, where the hardware mix is less controlled.",
            },
            {
                "head": "Three open questions, one shape.",
                "bullets": ["Recall, exactness, composition.", "Each one is a tradeoff, not a bug."],
                "fig": "open_questions",
                "say": "The survey names three problems that cut across the pillars. Recall versus efficiency for fixed state. Exactness versus parallelism for decoding. Error under composed compression. If you can state each one as a tradeoff, and say why it is still open, you have the last chapter of the exam. None of them is a missing trick. Each is a frontier where two good properties cannot yet be had at once.",
            },
            {
                "head": "Four pillars, four bottlenecks, one cache.",
                "bullets": ["Co-design is the conclusion.", "The cache is where the layers meet."],
                "fig": "cache_hub",
                "say": "The conclusion restates the co design claim. Key value layout has to work with virtual memory. Speculative loops have to meet low precision kernels. Compression has to know which phase of a split network it is serving. These three frontiers are what still blocks cheap, real time inference at global scale. Four pillars. Four bottlenecks. One cache. Three open problems. That is the survey.",
            },
        ],
    },
]
