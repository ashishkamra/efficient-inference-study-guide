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
                "say": "Training is paid once, and that one bill is then amortized across billions of queries. For a decade it was the expensive part of a large language model, but it is no longer the bill that decides whether a product is viable. Serving is paid on every query, because inference runs again each time someone asks the model anything, and the total grows with usage rather than with the training run. Real time products, agent loops, and multi step reasoning have moved the cost from the checkpoint to the request.",
            },
            {
                "head": "Prefill and decode are different machines.",
                "bullets": ["Prefill reads the prompt once.", "Decode reads the weights for every token."],
                "fig": "prefill_decode",
                "say": "Prefill reads the prompt once, fills the key value cache, and performs a great deal of arithmetic for every byte it loads. That work is parallel across the prompt, so the phase is compute bound and the tensor cores are the limit. Decode reads the weights for every token, streaming billions of parameters from high bandwidth memory into on chip memory one step at a time. Those repeated reads make decode bandwidth bound, which is why the two phases behave like different machines.",
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
                "say": "The survey's central claim is that efficiency is not a bag of independent tricks, but a property of where each technique is inserted into the stack. Each pillar is defined by where it is inserted, which is why the same idea can be cheap in one layer and useless in another. Architecture changes what the model is, decoding changes how tokens are produced, and compression changes the bits and the density of what is stored. They compose rather than compete as alternatives, because hardware and systems turn the specification into wall clock throughput.",
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
                "say": "The first pillar edits the model itself, changing the computation rather than the way it is served. Linear attention and Mamba trade recall for state: linear attention replaces the growing cache with a fixed state, and Mamba makes that state selective so it can decide what to keep. Hybrids and mixture of experts soften the trade, because hybrids keep a few real attention layers among many cheap ones, and routing activates only a few experts per token. Multi query, grouped query, and latent attention shrink the cache without leaving the transformer at all.",
            },
            {
                "head": "Decoding buys tokens with idle compute.",
                "bullets": ["A draft proposes; the target checks.", "One weight read can emit several tokens."],
                "fig": "spec_timeline",
                "say": "The second pillar leaves the weights alone and changes how tokens are produced, spending compute that would otherwise sit idle. A draft proposes and the target checks, which is the shape of every method in this pillar. Speculative decoding has a cheap draft propose a run of tokens, and then the target model checks all of them in a single parallel pass. One weight read can emit several tokens, and diffusion language models or Jacobi iteration push the same idea further at the cost of exactness.",
            },
            {
                "head": "Compression spends a quality budget.",
                "bullets": ["Fewer bits, fewer live weights.", "Capacity and bandwidth, paid in accuracy."],
                "fig": "bytes_bars",
                "say": "The third pillar spends a quality budget, accepting some loss in exchange for a smaller and cheaper model. Fewer bits and fewer live weights is the short version: quantization stores weights and caches in fewer bits, while sparsity keeps only some of the weights alive. Distillation trains a smaller student to imitate the larger teacher, which buys capacity and bandwidth but is paid for in accuracy. These methods buy both capacity and bandwidth, and because they are paid for in accuracy the survey treats compression as a budget rather than a free win.",
            },
            {
                "head": "Systems turn a specification into speed.",
                "bullets": ["Fewer bytes moved, less memory reserved.", "Mostly lossless: same outputs, less waste."],
                "fig": "system_flow",
                "say": "The fourth pillar is where a cheaper model becomes a faster server, because the specification only matters once it runs. Fewer bytes moved and less memory reserved is the theme: FlashAttention moves fewer bytes, and paged attention stops the engine from reserving memory it will never use. Continuous batching admits new requests at every step, and disaggregation puts prefill and decode on different machines. These changes are mostly lossless, with the same outputs and less waste.",
            },
            {
                "head": "One object ties the pillars together.",
                "bullets": ["Every method moves a term of the cache.", "Name the term and the paper has a place."],
                "fig": "cache_hub",
                "say": "Hold on to one object through the whole course, because the key value cache is the ledger every pillar writes in. Every method moves a term of that cache, and naming the term is usually enough to place the paper. Architecture reduces a dimension of it, decoding validates against it in parallel, compression shortens each entry, and systems decides where the entries physically live. Name the term and the paper has a place, which is the habit this course is trying to teach.",
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
                "say": "Operational intensity is work divided by bytes moved from main memory, and it decides which resource a kernel can actually use. Hardware gives you two peaks, compute per second and bandwidth per second, and the ridge is peak compute over bandwidth. That ratio is the ridge point, the lowest intensity that can keep the compute units full, so it separates the memory bound regime from the compute bound one. Below the ridge you are memory bound, and at or above it you hit the flat compute ceiling.",
            },
            {
                "head": "Batch-one decode sits near one operation per byte.",
                "bullets": ["Two operations per parameter, two bytes.", "The factors cancel; the ridge does not."],
                "fig": "intensity_bars",
                "say": "Here is the number people misremember, because two operations per parameter and two bytes per parameter are easy to confuse. At batch one, in sixteen bit floating point, a decode step performs about two operations per parameter and moves about two bytes per parameter. Those two factors of two are unrelated, but they cancel, so intensity is about one operation per byte. Eight bit halves the bytes and four bit halves them again, but the factors cancel and the ridge does not, which is why modern accelerators have ridge points in the hundreds.",
            },
            {
                "head": "Four physical bottlenecks, four ceilings.",
                "bullets": ["Capacity caps how many users fit.", "Bandwidth caps how fast one user is served."],
                "fig": "layered_bottlenecks",
                "layout": "wide",
                "say": "Four resources bound serving, and each one sets a different ceiling on what a deployment can do. Capacity caps how many users fit on one accelerator, because the key value cache for every live request has to stay in memory. Bandwidth caps how fast one user is served, because every generated token reads the weights from high bandwidth memory. Compute throughput limits prefill and large batch decode, while interconnect and numeric support limit sharding and the split between prefill and decode, and every pillar attacks a subset of these four.",
            },
            {
                "head": "Aggregate throughput can hide a bad user.",
                "bullets": ["Goodput counts only tokens inside the target.", "Time to first token is not time per token."],
                "fig": "measure_map",
                "layout": "wide",
                "say": "The metrics matter as much as the physics, because a good average can hide a bad experience. Aggregate tokens per second can look excellent while one user waits, and that is usually the user who notices. Goodput counts only the tokens inside the target, so it measures useful work rather than raw throughput. Time to first token is not time per token: the first is queueing plus prefill, and the second is decode, set by bandwidth and cache size, so report the metric that matches the claim you are making.",
            },
            {
                "head": "Latency is a timeline, not a number.",
                "bullets": ["TTFT: queue plus prefill.", "TPOT: the gap between decode steps."],
                "fig": "latency_timeline",
                "say": "Picture one request on a timeline, because latency is not a single number but a sequence of waits. Time to first token is queue plus prefill: the request waits in the queue, prefill runs, and then the first token appears. Time per output token is the gap between decode steps, because decode then emits one token per step and that gap is what a user feels. A long prefill on the same GPU as in flight decodes stalls every user, and that stall shows up directly in time per output token.",
            },
            {
                "head": "Fast tokens outside the target are waste.",
                "bullets": ["Throughput counts everything.", "Goodput counts what met the SLO."],
                "fig": "goodput_bars",
                "say": "Suppose a server reports a hundred thousand tokens per second, but only sixty two thousand arrive inside the latency target. Throughput counts everything, including the tokens that miss the target, so the headline number flatters the machine. Goodput counts what met the SLO, which is the only number that corresponds to work the product can use. Goodput is the honest number and the one a scheduler should optimize, which is why disaggregated serving papers phrase their results as goodput under a target.",
            },
            {
                "head": "Batching buys throughput until memory runs out.",
                "bullets": ["The curve flattens at the compute roof.", "The cache keeps growing with the batch."],
                "fig": "batch_curve",
                "say": "Increasing the batch turns a memory bound decode into a compute bound one, because each weight read is amortized over more tokens. The curve flattens at the compute roof as the tensor cores saturate, so extra requests stop buying proportionally more throughput. The cache keeps growing with the batch, which means memory capacity becomes the next wall. At some point capacity, not arithmetic, is the limit, and that is why batching, cache compression, and paging are studied together.",
            },
            {
                "head": "Three questions place any technique.",
                "bullets": ["Which bottleneck does it attack?", "Is the output exact, and what do you pay?"],
                "fig": "method",
                "say": "Every technique should answer three questions, and together they turn a pile of papers into a map. The first is which bottleneck it attacks, and that answer should come before anything else. The second is whether the output is exact and what you pay, where the price is usually recall, quality, or engineering complexity. Those three questions are the ones the rest of this course keeps asking, so practice stating them for every method you meet.",
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
                "say": "A decoder only model factorizes a sequence with the chain rule, so each next token is conditioned on everything before it. At every layer the hidden state is projected into a query, a key, and a value, and causal attention mixes them to produce the next representation. During decoding only one new query is formed, but it attends over every past key, which is the asymmetry that makes the cache useful. Recompute is quadratic while reuse is linear, so recomputing history at every step would be quadratic and the engine stores it instead.",
            },
            {
                "head": "The cache has a formula you can manipulate cold.",
                "bullets": ["Six factors, one for each lever.", "The leading two is keys versus values."],
                "fig": "formula",
                "params": {
                    "expr": "bytes = 2  x  layers  x  kv_heads\n     x  head_dim  x  length\n     x  batch  x  bytes_per_element",
                    "caption": "S_kv, equation 5 of the survey. Every pillar pulls one factor.",
                },
                "say": "Cache bytes equal two times the number of layers, times the number of key value heads, times head dimension, times sequence length, times batch size, times bytes per element. Six factors, one for each lever, which is why the formula is worth memorizing even though the arithmetic is simple. The leading two is keys versus values, because every token stores one of each for every layer and head. Bytes per element is two for sixteen bit floats, one for eight bit, and one half for four bit, so learning the formula turns every method into a lever on one term.",
            },
            {
                "head": "Every pillar pulls a different term.",
                "bullets": ["GQA moves the head count.", "Quantization moves the bytes."],
                "fig": "cache_levers",
                "say": "Every pillar pulls a different term, which is the cleanest way to compare methods that look unrelated. Grouped query attention moves the head count, and multi query attention moves it further by sharing one key and value across all heads. Quantization moves the bytes, with fewer bytes per element and sometimes fewer bits per cache entry. Eviction and sliding windows reduce the effective length, and a bigger batch multiplies the cache and spends capacity. Multi head latent attention does not fit the formula at all, because it stores one low rank code per token and rebuilds keys and values at attention time.",
            },
            {
                "head": "A worked example makes the size real.",
                "bullets": ["32 layers, 8 KV heads, 128-dim heads.", "The weights never change; the users do."],
                "fig": "kv_workload",
                "say": "A worked example makes the size real, because the formula is easy to read and easy to underestimate. Take 32 layers, 8 KV heads, and 128 dim heads in sixteen bit: at four thousand tokens and batch one the cache is about half a gigabyte. At batch eight it is four gigabytes, and at batch thirty two it reaches sixteen gigabytes on a single model. The weights never change; the users do, and that is why the cache rather than the checkpoint decides how many people a GPU can serve.",
            },
            {
                "head": "Latent attention stores a code, not a pair.",
                "bullets": ["One low-rank vector per token.", "Keys and values are rebuilt in the kernel."],
                "fig": "mla",
                "say": "DeepSeek's multi head latent attention compresses the cache before it is written, so the saving happens at the source rather than in a serving trick. One low rank vector per token is the idea: each token produces a single latent vector instead of a separate key and value. Keys and values are rebuilt in the kernel on the fly, which is why the leading factor of two disappears and the stored width is much smaller than a full head. The survey keeps the classic formula as the baseline and treats latent attention as a structural change to what the cache holds.",
            },
            {
                "head": "Prefill writes; decode reads and appends.",
                "bullets": ["Prefill fills every prompt position at once.", "Each decode step adds one pair."],
                "fig": "cache_timeline",
                "say": "Prefill fills every prompt position at once, in one compute bound pass that writes the cache for the whole prompt. Each decode step adds one pair, because decode reads the history, attends over it, and appends one new key and value per layer. Production blurs the textbook split in two ways: chunked prefill slices a long prompt so decode can be interleaved, and continuous batching admits new requests at every step. Both still use this same cache, so the distinction is about scheduling rather than about a different data structure.",
            },
            {
                "head": "Eviction is a recall decision.",
                "bullets": ["A window caps the length term.", "The dropped token cannot be recovered."],
                "fig": "window",
                "say": "The simplest way to cut the length term is to forget, and that is a recall decision rather than a free saving. A sliding window caps the length term by keeping only the most recent tokens, so the cache stops growing at the window size. The dropped token cannot be recovered, even though streaming systems add eviction policies that score each entry. Once a fact scrolls out of the window, no later attention head can point at it, which is why eviction should be judged by what the model forgets.",
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
                "say": "Every family in this pillar either deletes the cache, shrinks it, sparsifies access to it, or hybridizes so that recall survives. Softmax keeps a lossless history, with one key and one value per token at every layer, so you can point at a single buried fact with full precision. The cost is memory that grows with length, and that is the bill this pillar is trying to reduce. A fixed state cannot keep that history, because subquadratic mixers replace it with a fixed size state whose size does not grow.",
            },
            {
                "head": "Linear attention keeps a summary.",
                "bullets": ["A d by d matrix replaces the cache.", "The update cost ignores sequence length."],
                "fig": "linear_summary",
                "say": "Linear attention drops the softmax and factors the mixer through a feature map, which changes the shape of what has to be stored. A d by d matrix replaces the cache, and because that matrix has a fixed size, the state does not grow with the prompt. The update cost ignores sequence length entirely, so decode is cheap, but one summary cannot remember arbitrary content. The persistent failure is recall, because the model can capture a distribution but not a specific fact it saw a thousand tokens ago.",
            },
            {
                "head": "Mamba makes the recurrence selective.",
                "bullets": ["The transition depends on the input.", "Constant time per decode step."],
                "fig": "mamba",
                "say": "State space models take the other route, replacing attention with a recurrence that carries a hidden state forward. The transition depends on the input, because Mamba makes the recurrence selective so the state can choose what to keep and what to drop. That gives constant time per decode step, since the state has a fixed size and the work does not grow with context. A hardware aware scan keeps training competitive, Mamba two unifies state space models with linear attention, and RWKV arrives at a similar recurrent mixer from the transformer side.",
            },
            {
                "head": "Recall tracks state size, almost monotonically.",
                "bullets": ["The gap narrows but does not close.", "No fixed-state model matches softmax."],
                "fig": "recall_curve",
                "say": "Arora and colleagues make the tradeoff explicit by measuring recall against state size on associative retrieval. Recall tracks state size almost monotonically, so give the model a bigger state and it remembers more of what it saw. The gap narrows but does not close, which is the important part of the result. No fixed state model in the survey matches softmax attention on heavy in context retrieval, and that curve is the pillar's central result.",
            },
            {
                "head": "Put the families side by side.",
                "bullets": ["State per token is the axis that matters.", "Every family sits somewhere on it."],
                "fig": "family_map",
                "layout": "wide",
                "say": "Line the families up by what they store per token, because that is the axis that predicts both memory and recall. State per token is the axis that matters, and each family occupies a different point on it. Softmax attention stores a key and a value at every layer and keeps recall exactly, linear attention stores a matrix, and a selective state space model stores a fixed hidden state. Every family sits somewhere on it, and a hybrid stores attention entries only on its attention layers, so the table is the pillar in one glance.",
            },
            {
                "head": "Experts cut compute, not state.",
                "bullets": ["A router activates a few experts.", "Every expert still occupies memory."],
                "fig": "moe",
                "say": "Mixture of experts cuts per token compute, not per token state, which is a distinction that decides where it helps. A router activates a few experts, so activated parameters separate from total parameters and the arithmetic per token stays small. DeepSeek scales to hundreds of billions of total parameters with only tens of billions active, which is the clearest example of the gap. Every expert still occupies memory, because all experts must live somewhere and the cache for a token is unchanged, so it is a compute lever rather than a capacity lever.",
            },
            {
                "head": "The cache can shrink inside a transformer.",
                "bullets": ["MQA saves the most and costs quality.", "GQA is the production default."],
                "fig": "kv_heads",
                "say": "Even inside a normal transformer, the cache can shrink, and the methods differ in how much recall they give up. MQA saves the most and costs quality, because it uses a single key value head for every query head. GQA is the production default, with grouped query attention sitting between full sharing and full duplication, so it keeps most of the saving with much less damage. Latent attention stores a small code and rebuilds keys and values, and each of these is a different answer to how much history we keep per token.",
            },
            {
                "head": "The recall-efficiency frontier is still open.",
                "bullets": ["Cheaper memory moves left.", "Lossless recall moves right."],
                "fig": "frontier",
                "say": "What this pillar buys is capacity and bandwidth: more concurrent users, and faster single stream decode. The price is the recall efficiency frontier, because every saving in state is paid for somewhere in what the model can remember. Cheaper memory moves left, toward Mamba and linear attention, while lossless recall moves right toward full attention, and hybrids or latent attention sit between them. The survey is explicit that this frontier is not closed, which is why it returns as an open problem at the end.",
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
                "say": "Leave the weights alone, and spend idle tensor cores so that one sequential read of the weights can emit more than one token. Draft cheaply and verify in parallel, because the expensive part is the target pass and it can score many candidates at once. Speculative decoding is the production technique: a cheap draft proposes a short run of candidate tokens, and the expensive target scores all of them in one parallel forward pass. The sequential chain becomes a batch, and the dividing line for every method in this pillar is whether the output distribution stays exactly the target model's.",
            },
            {
                "head": "Keep the longest valid prefix.",
                "bullets": ["Accept until the first mismatch.", "Resample at that position."],
                "fig": "spec_tree",
                "say": "An acceptance rule keeps a prefix whose conditionals match the target, so the accepted run is the part the target agrees with. Accept until the first mismatch, because that is the longest prefix the verifier can defend. Then resample at that position, which is the correction that keeps the procedure exact. Done carefully, the marginal distribution of the text is exactly the target's, so the method is lossless even though the draft is cheap. Lossless does not mean free, because rejected drafts are wasted work, which is why tree methods submit several alternatives and take the longest valid path.",
            },
            {
                "head": "The acceptance rule is what makes it exact.",
                "bullets": ["Accept with probability min(1, p/q).", "Otherwise sample from the residual."],
                "fig": "formula",
                "params": {
                    "expr": "accept x  with  min(1, p(x) / q(x))\notherwise  sample  from  (p - q)+\n\nE[accepted] = tau",
                    "caption": "Rejection sampling restores the target distribution exactly.",
                },
                "say": "The rule is rejection sampling, and it is the reason speculation can be exact rather than approximate. Accept with probability min of one and p over q, where p is the target probability and q is the draft probability. Otherwise sample from the residual, which is the part of the target distribution that the draft did not cover. That correction is what makes speculation exact, because the marginal distribution of the emitted text is the target's rather than an approximation of it.",
            },
            {
                "head": "Speculation wins in the latency regime.",
                "bullets": ["Speedup tracks accepted length.", "Large batches erase the win."],
                "fig": "spec_batch",
                "say": "End to end speedup is about the mean accepted length, minus the cost of drafting and verification, so the method is a bet on the draft being right. Speedup tracks accepted length, which is why a better drafter matters more than a faster verifier. At batch one the check costs almost the same as a single token, because the weights were going to be loaded anyway, so the extra candidates are nearly free. Large batches erase the win because the target is already near compute bound, and that is why speculation is most attractive for low batch, latency sensitive work such as chat and code completion.",
            },
            {
                "head": "Drafters differ in where they get the draft.",
                "bullets": ["The target can draft from itself.", "Lookup wins when input and output overlap."],
                "fig": "draft_sources",
                "layout": "wide",
                "say": "The first drafters were separate small models, trained to imitate the target and cheap enough to run alongside it. The target can draft from itself, which removes the second model and much of the training problem. Medusa hangs extra heads on the last hidden state, while EAGLE drafts in feature space where the next feature is less uncertain than the sampled token, and later versions add dynamic trees. Lookup wins when input and output overlap, as it does in code edits or retrieval, because then the draft can copy instead of predict.",
            },
            {
                "head": "Diffusion denoises a block in parallel.",
                "bullets": ["No left-to-right order.", "Independence assumptions make it lossy."],
                "fig": "diffusion",
                "say": "Diffusion language models abandon left to right generation, denoising a masked sequence over a few steps instead. No left to right order is the defining choice: the model produces a whole block at once, which is what buys the parallelism. Independence assumptions make it lossy, because the block assumes its tokens are independent and that assumption is wrong whenever the text is tightly coupled. Errors drift on long reasoning, so these methods trade exact conditionals for wide parallel blocks, which is sometimes the right trade on a memory bound machine.",
            },
            {
                "head": "Early exit can become a drafter.",
                "bullets": ["Leave before the last layer when confident.", "Layer Skip verifies with the full model."],
                "fig": "early_exit",
                "say": "Jacobi decoding updates several future positions together, and for greedy decoding it can converge to the same answer as stepping one token at a time. Early exit is the observation that you can leave before the last layer when the model is confident, which saves the remaining work. Layer Skip verifies with the full model, using that early exit as the drafter, so the cheap path proposes and the full path checks. That combination is lossless again, which is the pattern to remember whenever a method claims both speed and exactness.",
            },
            {
                "head": "Sort decoders by exactness first.",
                "bullets": ["Exact methods keep the target distribution.", "Approximate methods buy parallelism."],
                "fig": "decoder_trade",
                "say": "Pillar two buys bandwidth by spending compute that was sitting idle, and it does not shrink memory capacity. Sort decoders by exactness first, because that is the property that decides whether a method is safe to use. Exact methods keep the target distribution, and speculation with rejection sampling and Layer Skip both preserve the target. Approximate methods buy parallelism, and diffusion, sampled Jacobi, and skeleton of thought do not preserve the target, so both groups are useful but only one is safe to describe as lossless.",
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
                "say": "Production language models carry more precision than next token prediction needs, and many weights can be skipped without changing the output much. Halving the bits halves the traffic, which is the simplest way to see why compression attacks the bandwidth bottleneck. Weight bytes dominate decode, because every generated token streams the weights, so that is the most direct target. Cache bytes follow the same rule, with fewer bits per entry meaning a smaller cache and less traffic, and most of these methods are post training: you start from a finished checkpoint and spend a budget.",
            },
            {
                "head": "Outliers ruin a uniform grid.",
                "bullets": ["A few channels are orders of magnitude larger.", "A naive 4-bit grid crushes the rest."],
                "fig": "quant_grid",
                "say": "The catch is outliers, because a few channels are orders of magnitude larger than the rest and they dominate the range. A naive 4-bit grid crushes the rest, spending its levels on the outliers while the small weights collapse into a handful of values. Every serious quantization method is a response to that histogram: protect the outliers, rotate them away, or give them their own scale. Quantization is mostly the study of a few extreme values, and the method you choose is really a choice about how to treat them.",
            },
            {
                "head": "Three formats, three different pressures.",
                "bullets": ["Weights, activations, and cache.", "The production point is W4A8."],
                "fig": "quant_matrix",
                "layout": "wide",
                "say": "Separate the formats, because weights, activations, and cache are three different pressures with different statistics. Weight only quantization matters first, because decode traffic is mostly weights and the weights do not change at run time. Activations are harder, because they are computed online and they move through the network, so their range depends on the input. SmoothQuant rescales each channel so the difficulty moves from activations onto weights. The production point is W4A8: four bit weights with eight bit activations, co designed with the kernel.",
            },
            {
                "head": "Weight-only methods fix different failures.",
                "bullets": ["GPTQ corrects error after rounding.", "AWQ protects salient channels."],
                "fig": "weight_methods",
                "say": "Weight only methods fix different failures, and they are not interchangeable even when they report the same bit width. GPTQ corrects error after rounding with second order information, which is how it reaches four bits at huge scale. AWQ protects salient channels, the ones that activations say matter, while QuIP rotates the weights so outliers spread out. BitNet trains a tiny weight alphabet from scratch, which makes it training aware rather than post training, and each of these assumes a different source of error and a different budget.",
            },
            {
                "head": "SmoothQuant moves the difficulty.",
                "bullets": ["Activation outliers become weight outliers.", "The kernel is designed with the format."],
                "fig": "smoothquant",
                "say": "Activations are harder than weights because they are produced at run time and their range depends on the input. Activation outliers become weight outliers when SmoothQuant rescales each channel, so the hard part moves onto the weights. The weights can absorb it because they are fixed and can be calibrated once, which leaves the activations easy to quantize. That single trick is what makes four bit weights with eight bit activations practical. The kernel is designed with the format rather than retrofitted to it, which is why the pair ships together.",
            },
            {
                "head": "The cache has its own quantization.",
                "bullets": ["KIVI: two bits, no extra tuning.", "Keys per channel, values per token."],
                "fig": "kivi",
                "say": "The cache has its own quantization, because keys and values have different outlier structure and need different rules. KIVI is the one to remember: two bits, asymmetric, and no extra tuning or calibration pass. Keys use per channel quantization, because outlier channels line up across tokens, while values use per token quantization, because their outliers line up within a token. Do not swap those two, and note that cache quantization stacks with grouped query attention because they touch different terms of the footprint.",
            },
            {
                "head": "Sparsity needs a hardware pattern.",
                "bullets": ["Arbitrary zeros do not speed up dense cores.", "2:4 is the pattern the silicon runs."],
                "fig": "two_four",
                "say": "Pruning removes structure rather than bits, and the structure is what decides whether the hardware can use it. Unstructured sparsity can zero half the weights, but arbitrary zeros do not speed up dense cores because the zeros do not line up with the hardware's datapath. 2:4 is the pattern the silicon runs, keeping two of every four weights and skipping the rest. Sparse tensor cores run that pattern at about twice dense throughput, and the lesson generalizes: a compression scheme only pays when the kernel and the hardware agree on its shape.",
            },
            {
                "head": "Stacked compression does not add up.",
                "bullets": ["Memory savings multiply.", "Quality errors interact."],
                "fig": "compression_stack",
                "say": "Deployed models are quantized and pruned and distilled, and the memory savings multiply because each stage removes bytes. Quality errors interact, because each stage was calibrated on the model that entered it, so the errors do not simply add. Change the architecture first and a grid fit to the dense model can collapse, which is why the order of the pipeline matters. That is why the survey keeps compression budgets separate, and why composed error is one of its three open problems.",
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
                "say": "Textbook softmax writes a full attention matrix into high bandwidth memory, and those bytes dominate the arithmetic. Tiling queries, keys, and values through SRAM is the fix, because the tile stays on chip and the matrix never has to be materialized. FlashAttention does exactly that, so the matrix never reaches high bandwidth memory. Softmax runs online, exactly, and the result is identical to the textbook computation. It is not an approximation and is often two to four times faster, and the third version adds eight bit floats and reaches about three quarters of an H one hundred's peak.",
            },
            {
                "head": "The win is traffic, not a new mixer.",
                "bullets": ["Same math, fewer HBM round trips.", "Four times less traffic in the usual case."],
                "fig": "hbm_bars",
                "say": "The point of the kernel is memory traffic, not a new mixing rule. The same math with fewer HBM round trips is the whole idea: the arithmetic is unchanged, but the attention matrix never reaches high bandwidth memory. Four times less traffic in the usual case is what buys the speed, which is why the technique is mostly about data movement. FlashInfer then targets serving rather than training, with paged layouts, ragged batches, and the attention variants production actually uses. Those kernels were shaped for training where queries, keys, and values have similar lengths, while decode has one query against a long cache.",
            },
            {
                "head": "Do not reserve the maximum length.",
                "bullets": ["Contiguous slots fragment memory.", "Pages are allocated on demand."],
                "fig": "paging",
                "say": "Manage the cache like virtual memory, because reserving one contiguous slot out to the maximum length wastes space whenever a request finishes early. Contiguous slots fragment memory, and the fragmentation gets worse as the batch grows and requests have different lifetimes. Pages are allocated on demand: PagedAttention allocates fixed pages, typically sixteen tokens, and keeps a block table per request. The outputs do not change; only the wasted reservation does, and that single idea is why a serving engine can hold many more concurrent requests than a naive allocator.",
            },
            {
                "head": "Continuous batching fills the gaps.",
                "bullets": ["Step everyone once per iteration.", "Admit new work at the boundary."],
                "fig": "batching",
                "say": "Continuous batching is the matching scheduler, because it treats the batch as a stream rather than a fixed job. Step everyone once per iteration instead of waiting for the longest request, so a finished sequence leaves and its slot is refilled immediately. Admit new work at the boundary, which keeps the GPU busy while old requests continue decoding. Static batching leaves the GPU idle while a short request waits behind a long one. Continuous batching keeps the batch full and raises throughput without changing any model output, so it is a scheduling win rather than an approximation.",
            },
            {
                "head": "Shared prefixes should not be prefilled twice.",
                "bullets": ["System prompts repeat across users.", "A radix tree caches and evicts them."],
                "fig": "radix",
                "say": "Shared prefixes should not be prefilled twice, because system prompts repeat across users and so do few shot examples and chat history. Those prompts and histories repeat across users, so the same cache entries are recomputed thousands of times. A radix tree caches and evicts them: SGLang's RadixAttention stores cache entries in a tree and evicts the cold ones, so a new request that shares a prefix starts from the cached node instead of re prefilling. That is a pure capacity and latency win, and it is why prefix caching has become standard in open serving stacks.",
            },
            {
                "head": "A long prefill stalls every decode.",
                "bullets": ["Split the phases onto different pools.", "Prefill wants compute; decode wants bandwidth."],
                "fig": "disaggregate",
                "say": "A long prefill on the same GPU as in flight decodes stalls every user and blows up time per output token, which is the problem disaggregation solves. Split the phases onto different pools: DistServe, Splitwise, and Mooncake do exactly that by giving prefill and decode separate machines. Prefill wants compute while decode wants bandwidth, so the split lets each pool be sized and provisioned for its own bottleneck. DistServe optimizes goodput under a latency target, and Splitwise puts compute heavy GPUs on prefill and bandwidth heavy GPUs on decode. Mooncake adds a global cache pool, and Sarathi gets much of the benefit without a second pool by chunking prefill.",
            },
            {
                "head": "Goodput is the metric that survives the tail.",
                "bullets": ["Throughput counts the slow tail.", "An SLO turns latency into a budget."],
                "fig": "slo_curve",
                "say": "Any scheduler can look good on average, but the tail is what users feel. Throughput counts the slow tail and hides it in the mean, so a headline number can improve while the experience gets worse. An SLO turns latency into a budget: count only the requests that finish inside it, and that is goodput. Goodput is the right objective for a split topology, because moving work between pools changes the tail before it changes the mean.",
            },
            {
                "head": "The open stacks have converged.",
                "bullets": ["Paging, batching, FlashAttention, prefix cache.", "What differs is scheduling and kernel quality."],
                "fig": "stack_compare",
                "layout": "wide",
                "say": "The open stacks have converged, and the primitives are now shared across engines. Paging, batching, FlashAttention, and prefix cache are settled, which means they no longer explain the differences between systems. What differs is scheduling and kernel quality, and how cleanly a stack joins a disaggregated topology. That is the systems pillar in one sentence: the remaining gains come from co designing the primitives with the model and the hardware.",
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
                "say": "You cannot optimize the layers in isolation, because the key value cache is the ledger every pillar writes in. Architecture moves a dimension, by reducing key value heads or storing a latent width instead of a full pair. Decoding routes validation through tree shaped drafts that are checked under a mask. Compression shortens each entry down to about two bit asymmetric grids, and systems decides where the entries physically live by allocating pages and trees for shared prefixes.",
            },
            {
                "head": "The wins add; the layouts fight.",
                "bullets": ["A real deployment runs all four at once.", "Every combination wants a new kernel."],
                "fig": "layout",
                "say": "The wins add, but the layouts fight, and that tension is the practical story of composition. A real deployment runs all four at once: grouped query attention, speculative trees, a four bit cache, and paged attention together. The friction is layout, because quantized caches used to be widened back to sixteen bit before a stock attention kernel could use them. Every combination wants its own kernel, because newer kernels attend directly in the low bit layout but each pairing still needs a specialized path. That co design burden is the cost of the additive win.",
            },
            {
                "head": "Prefill and decode want opposite formats.",
                "bullets": ["Prefill wants wide, compute-friendly formats.", "Decode wants narrow weights."],
                "fig": "phase_formats",
                "say": "On one GPU, a single numeric format has to serve two masters with opposite needs. Prefill wants wide, compute friendly formats such as eight bit weights and eight bit activations, or eight bit floats, to fill the tensor cores. Decode wants narrow weights, four bit or even two bit, to cut the bytes moving across the bus. One format is always a compromise for one of the two phases, and that compromise is measurable in latency and throughput.",
            },
            {
                "head": "Disaggregation makes two formats possible.",
                "bullets": ["Different schemes per phase become conceivable.", "No production system does it yet."],
                "fig": "disaggregate",
                "say": "Disaggregation makes two formats possible, because each pool can be optimized for its own phase. Different schemes per phase become conceivable: SmoothQuant on the prefill pool, GPTQ on the decode pool. No production system does it yet, and the survey is explicit that it does not know of one. It is future work rather than current practice, so do not overclaim it: the topology makes it possible, but the kernels and the scheduler still have to catch up.",
            },
            {
                "head": "Speculation moves the machine mix.",
                "bullets": ["Verification pushes decode toward compute.", "The node link can become the bottleneck."],
                "fig": "spec_machine",
                "say": "Speculation moves the machine mix, because verification changes what decode costs. Verification pushes decode toward compute: heavy verification makes decode compute bound, so the right ratio of prefill nodes to decode nodes moves. The node link can become the bottleneck rather than high bandwidth memory, since the extra draft and verification traffic crosses the network. If you only memorize that speculation saves bandwidth, you miss this second order effect and you will mis size the cluster.",
            },
            {
                "head": "Four levers multiply the win.",
                "bullets": ["Each lever is independent in theory.", "The product is what reaches production."],
                "fig": "additive",
                "say": "When two techniques stack, say which term of the cache formula each one moves, or which side of the roofline it attacks. Each lever is independent in theory, and that is why the savings multiply when the terms are different. If you cannot name the term, the methods are probably not as independent as the abstracts claim. Grouped query attention at four times, a four bit cache at four times, and paging at a small constant multiply into something none of them achieves alone. The product is what reaches production.",
            },
            {
                "head": "Name the term, or it is not independent.",
                "bullets": ["Bottleneck, exactness, price.", "That is the whole exam method."],
                "fig": "method",
                "say": "The synthesis is a habit rather than a formula, and it is the skill the exam is actually testing. For every paper, name the term of the cache it moves or the side of the roofline it attacks. Then say whether the output is exact and what the method pays, which gives you three labels: bottleneck, exactness, price. If two techniques touch the same term in incompatible ways they do not compose for free, while techniques on different terms multiply their savings. That is the whole exam method.",
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
                "say": "The stack is not finished, and the first open problem is recall versus efficiency for subquadratic state. A fixed recurrent state is an information bottleneck, because unlike the key value cache it cannot keep a lossless history. Recall falls as context grows, so needle in a haystack retrieval, long multi turn logs, and hard in context learning all degrade. The frontier is still open, and hybrids rent back a little attention along with a cache that still grows with context.",
            },
            {
                "head": "Hybrids rent attention back.",
                "bullets": ["One attention layer for every seven Mamba layers.", "The cache returns, and grows again."],
                "fig": "hybrid",
                "say": "Hybrids rent attention back, accepting a smaller cache in exchange for keeping some exact recall. Jamba is the clearest compromise, with one attention layer for every seven Mamba layers plus a mixture of experts. The cache returns and grows again, because it now exists on the attention layers, and it is smaller than full attention but still grows with sequence length. Hybrids do not close the tradeoff; they move along it, and the open problem is how to bound memory without losing non local associative recall.",
            },
            {
                "head": "Speculation is exact only while drafts match.",
                "bullets": ["Acceptance length drives the speedup.", "If it falls to zero, verification is waste."],
                "fig": "acceptance",
                "say": "The second frontier is the lossless versus lossy line in parallel decoding, where a method can be exact in theory and useless in practice. Speculation stays lossless only while the draft is aligned with the target, because the acceptance rule assumes the draft is a reasonable approximation. Acceptance length drives the speedup, so the draft has to stay close enough that the verifier accepts a useful prefix. If acceptance falls to zero, verification is waste because every proposed token is rejected, and although newer drafters move toward the verifier offline or in batches, a principled realignment on each request is still open.",
            },
            {
                "head": "Realignment is still an open loop.",
                "bullets": ["Offline and batched updates exist.", "Per-request alignment does not."],
                "fig": "realign",
                "say": "Realignment is still an open loop, and that is the gap between what speculation promises and what it can do today. Offline and batched updates exist: train the drafter against the verifier, refresh it periodically, and accept that it drifts between refreshes. Per request alignment does not exist in production, because it would be better but it costs the very compute speculation was meant to save. Diffusion and consistency models sit on the lossy side on purpose, trading exact left to right conditionals for wide parallel blocks, and the question is whether that trade is acceptable on a bandwidth bound machine.",
            },
            {
                "head": "Composed compression has no error bound.",
                "bullets": ["Each stage recalibrates on the last model.", "The total can exceed the sum of the parts."],
                "fig": "error_budget",
                "say": "The third frontier is error under composed compression, where each method is measured alone but deployed in a stack. A plausible pipeline prunes structure, linearizes the remaining attention by distillation, and then quantizes the result. Each stage recalibrates on the last model it sees, so the pipeline is a sequence of local fixes rather than a global optimum. The total error can exceed the sum of the parts, because errors interact and a later stage can amplify what an earlier one introduced. A composition theory with predictable bounds is still open, especially off the datacenter where the hardware mix is less controlled.",
            },
            {
                "head": "Three open questions, one shape.",
                "bullets": ["Recall, exactness, composition.", "Each one is a tradeoff, not a bug."],
                "fig": "open_questions",
                "say": "The survey names three problems that cut across the pillars, and they share a shape even though they live in different layers. Recall, exactness, and composition are the three: recall versus efficiency for fixed state, exactness versus parallelism for decoding, and error under composed compression. Each one is a tradeoff rather than a bug, which is why none of them has a clean production answer. If you can state each one as a tradeoff and say why it is still open, you have the last chapter of the exam.",
            },
            {
                "head": "Four pillars, four bottlenecks, one cache.",
                "bullets": ["Co-design is the conclusion.", "The cache is where the layers meet."],
                "fig": "cache_hub",
                "say": "Co design is the conclusion: key value layout has to work with virtual memory, speculative loops have to meet low precision kernels, and compression has to know which phase of a split network it is serving. The cache is where the layers meet, because every pillar changes it and no pillar can change it alone. These three frontiers are what still blocks cheap, real time inference at global scale. Four pillars, four bottlenecks, one cache, three open problems: that is the survey.",
            },
        ],
    },
]
