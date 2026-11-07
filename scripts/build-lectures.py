#!/usr/bin/env python3
"""Narrated lecture videos for the Ridge study guide. One-shot asset build."""

import json
import os
import subprocess
import textwrap
import urllib.request
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont

ROOT = Path("/workspace")
OUT = ROOT / "public" / "videos"
AUDIO = ROOT / "narration"
AUDIO.mkdir(parents=True, exist_ok=True)
OUT.mkdir(parents=True, exist_ok=True)

SERIF = "/usr/share/fonts/truetype/liberation/LiberationSerif-Bold.ttf"
SANS = "/usr/share/fonts/truetype/liberation/LiberationSans-Regular.ttf"
SANS_B = "/usr/share/fonts/truetype/liberation/LiberationSans-Bold.ttf"

PAPER = (243, 239, 230)
INK = (28, 25, 21)
MUTED = (109, 101, 92)
COPPER = (196, 81, 26)

# Spoken lectures. Slide lines are what is on screen while that third plays.
LESSONS = [
    {
        "id": "shift",
        "kicker": "Lesson 01",
        "title": "From training to the inference stack",
        "slides": [
            ["Inference, not training, is the bill.", "Training is paid once.", "Serving is paid on every query."],
            ["Four pillars, one stack.", "Architecture. Decoding.", "Compression. Hardware and systems."],
            ["Prefill is compute-bound.", "Decode is bandwidth-bound.", "Name the bottleneck, the loss, and the cost."],
        ],
        "text": """This is a narrated lecture on Efficient LLM Inference, the area exam survey by Chien Van Nguyen at the University of Oregon. Lesson one. From training to the inference stack.

The expensive part of large language models used to be training. That is no longer the bill that matters. Training is paid once, then spread across an enormous number of queries. What you pay every day is inference: actually serving the model. Real-time products, agent loops, and multi-step reasoning have pushed the total cost of ownership onto inference.

The survey's claim is that efficiency is not a bag of independent tricks. It is one co-designed stack, organized by where a method is inserted.

Pillar one is architecture. You change what the model is. Linear attention, state-space models such as Mamba, hybrid stacks, mixture of experts, and native ways to shrink the key-value cache: multi-query attention, grouped-query attention, and multi-head latent attention.

Pillar two is decoding. The weights stay put. You change how tokens are produced, so one read of the weights can emit more than one token. Speculative decoding, diffusion language models, Jacobi and consistency iteration, and dynamic early exit.

Pillar three is compression. Fewer bits, and fewer weights that actually fire. Quantization, cache quantization, sparsity, and distillation. You spend a quality budget.

Pillar four is hardware and systems. This is what turns a specification into wall-clock speed. FlashAttention, paged memory, continuous batching, and serving prefill on different machines from decode.

Hold onto the split between two phases. Prefill reads the whole prompt at once, fills the cache, and is rich in arithmetic per byte. It is compute-bound. Decode then emits one token at a time. For every token, billions of parameters move from high-bandwidth memory into on-chip memory. Decode is memory-bandwidth-bound.

The survey leaves out training parallelism, parameter-efficient fine-tuning such as LoRA, and test-time compute, unless those change a physical bottleneck.

How to study this exam. For every technique, name the bottleneck it attacks, say whether the output distribution is preserved exactly, and say what you pay. The payment is recall, quality, or engineering complexity. The key-value cache is the object that all four pillars touch.""",
    },
    {
        "id": "bottlenecks",
        "kicker": "Lesson 02",
        "title": "Bottlenecks and the roofline",
        "slides": [
            ["Intensity is work divided by bytes.", "The ridge is peak compute over bandwidth.", "Below it, memory sets the speed."],
            ["Batch-one decode is about one op per byte.", "Two comes from the multiply-accumulate.", "The other two is sixteen-bit storage."],
            ["Capacity: how many users fit.", "Bandwidth: how fast one user is served.", "Time to first token versus time per token."],
        ],
        "text": """Lesson two. Bottlenecks, the roofline, and the metrics that matter.

Operational intensity is floating-point work divided by bytes moved from main memory. Hardware gives you two peaks. Peak compute, called pi, in operations per second. Peak memory bandwidth, called beta, in bytes per second. Their ratio is the ridge point. It is the lowest intensity that can keep the compute units full.

Below the ridge, you are memory-bound. Performance follows bandwidth times intensity. At or above the ridge, you hit the flat compute ceiling. Prefill sits on or above the ridge. Decode at batch size one sits far below it.

Here is the number people misremember. At batch size one, in sixteen-bit floating point, a decode step does about two times the parameter count in floating-point operations. That two is the multiply-accumulate: two operations per parameter. The same step moves about two times the parameter count in bytes, because each weight is two bytes. Those two factors of two are unrelated. They happen to cancel, so intensity is about one operation per byte.

Eight-bit integers halve the bytes and double the intensity. Four-bit integers double it again. Modern accelerators have ridge points in the hundreds of operations per byte, so decode is orders of magnitude under the ceiling. Larger batches, fused kernels, and less traffic per step are how later pillars push decode toward the ridge.

Four physical bottlenecks. Memory capacity limits how many users fit on one accelerator. Memory bandwidth limits how fast one user is served. A rough ceiling on tokens per second is bandwidth divided by two times the parameter count, in sixteen-bit. Compute throughput limits prefill and large-batch decode, and it depends on the numeric format. Interconnect and numeric support limit sharding and splitting prefill from decode.

Who owns them. Capacity is pillars one, three, and four. Bandwidth is pillars one, two, and four. Compute is pillars two and three. Interconnect is pillar four.

Metrics. Aggregate tokens per second can hide a bad experience for one user. Goodput counts only tokens that meet a latency target. Time to first token is prefill plus queueing. Time per output token is decode, set by bandwidth and cache size. For speculation, track the mean number of accepted tokens per step. Speedup is about that length, minus the cost of checking the draft.""",
    },
    {
        "id": "kv",
        "kicker": "Lesson 03",
        "title": "The key-value cache",
        "slides": [
            ["The model factorizes the sequence.", "One new query attends over every past key.", "The cache stores that history."],
            ["Bytes equal two, times layers,", "times key-value heads, times head size,", "times length, times batch, times bytes each."],
            ["Grouped query cuts the head count.", "Quantization cuts the bytes.", "Latent attention stores one code, not keys and values."],
        ],
        "text": """Lesson three. Autoregression and the key-value cache.

A decoder-only language model factorizes a sequence with the chain rule. Each next token is conditioned on everything before it. At each layer, the hidden states are projected into queries, keys, and values. Causal softmax attention mixes them. During decoding, only one new query is formed, and it attends over every past key.

Recomputing keys and values from scratch every step would be quadratic. The engine instead appends the new key and the new value and reuses history. Per-step compute drops from quadratic in length to linear. Memory becomes linear in length. That stored history is the key-value cache. The weights do not grow. The cache does.

The footprint formula is the one to manipulate cold. Cache bytes equal two, times number of layers, times number of key-value heads, times head dimension, times sequence length, times batch size, times bytes per element. The leading two is keys versus values, stored as separate tensors. Bytes per element is two for sixteen-bit floats, one for eight-bit, and one half for four-bit.

Each pillar pulls a different term. Grouped-query attention and multi-query attention reduce the number of key-value heads. Quantization reduces bytes per element. Eviction and sliding windows reduce the effective length. A bigger batch multiplies the cache. That buys throughput and spends capacity.

Multi-head latent attention does not fit this formula. Used in DeepSeek, it stores one low-rank latent vector per token and reconstructs keys and values at attention time. The leading two disappears. The survey keeps the formula as the baseline and treats latent attention as a structural change.

Paging does not shrink the formula either. It stops you from reserving the maximum length up front and fragmenting the rest of memory.

Prefill writes the cache for the prompt in one compute-bound pass. Decode reads the whole history, attends, and appends one pair. Production blurs the textbook split. Chunked prefill slices a long prompt so decode can be interleaved. Continuous batching admits new requests at every step instead of waiting for a whole batch to finish. Both still use this same cache.""",
    },
    {
        "id": "architecture",
        "kicker": "Lesson 04",
        "title": "Architectural foundations",
        "slides": [
            ["Softmax keeps every past token.", "A fixed state does not.", "Recall is the price of a smaller cache."],
            ["Mamba steps in constant time.", "Jamba keeps about one attention layer", "for every seven Mamba layers."],
            ["Experts cut compute, not state.", "Grouped query is the production default.", "Linearization distills a softmax teacher."],
        ],
        "text": """Lesson four. Pillar one, architectural foundations.

This pillar changes the model itself. Every family here either deletes the cache, shrinks it, sparsifies access to it, or hybridizes so recall survives. The bill is always recall.

Softmax attention keeps a lossless history: one key and one value per token. You can point at a single buried fact. The cost is a cache that scales with length. Subquadratic mixers replace that history with a fixed-size state.

Linear attention drops the softmax and factors the mixer through a feature map. A summary matrix replaces the cache and updates independent of length. The persistent failure is recall. One summary cannot remember arbitrary content.

State-space models take the other route. Mamba makes the recurrence selective. The transition depends on the current input. The state has fixed size, so decoding is constant time per step. A hardware-aware scan keeps training competitive. Mamba two unifies state-space models with linear attention. RWKV arrives at a similar recurrent mixer from the transformer side.

Arora and colleagues make the tradeoff explicit. On associative retrieval, recall tracks state size, almost monotonically. No fixed-state model in the survey has matched softmax on heavy in-context retrieval.

Hybrids are the compromise. Keep a few real attention layers among many cheap ones. Jamba uses about one attention layer for every seven Mamba layers, plus mixture of experts. The cache then exists only on the attention layers.

Mixture of experts cuts per-token compute, not per-token state. A router sends each token to a few experts, so activated parameters split from total parameters. All experts must still live somewhere. DeepSeek scales to hundreds of billions of total parameters with only tens of billions activated.

Even inside a normal transformer, the cache can shrink. Multi-query attention uses one key-value head and loses quality. Grouped-query attention is the production default. Latent attention stores a small code and rebuilds keys and values. Eviction drops tokens that future attention will not use.

What this pillar buys: capacity and bandwidth. More concurrent users, and faster single-stream decode. The price is the recall-efficiency frontier, which the survey leaves open.""",
    },
    {
        "id": "decoding",
        "kicker": "Lesson 05",
        "title": "Decoding algorithms",
        "slides": [
            ["A draft proposes several tokens.", "The target checks them in one pass.", "A careful rule keeps the target's distribution."],
            ["Speedup tracks accepted length.", "Large batches erase the win.", "The target is already compute-bound."],
            ["Diffusion and sampled Jacobi are lossy.", "Layer Skip can draft, then verify.", "That pairing is lossless again."],
        ],
        "text": """Lesson five. Pillar two, decoding algorithms.

Leave the weights alone. Spend idle tensor cores so that one sequential read of the weights can emit more than one token. The dividing line is whether the output distribution stays exactly the target model's.

Speculative decoding is the production technique. A cheap draft proposes a short run of candidate tokens. The expensive target scores all of them in one parallel forward pass. An acceptance rule keeps a prefix whose conditionals match the target, and resamples at the first mismatch. Done carefully, the marginal distribution of the text is exactly the target's. The method is lossless. Lossless does not mean free. Rejected drafts are wasted work.

In the memory-bound regime, that parallel check costs about the same wall-clock time as a single token, because the weights were going to be loaded anyway. End-to-end speedup is about the mean accepted length, minus drafting and verification.

The first drafts were separate small models. Later methods draft from the target itself. Medusa hangs extra heads on the last hidden state. EAGLE drafts in feature space, where the next feature is less uncertain than the sampled token. Later EAGLE versions add dynamic trees. Prompt lookup is strong when the input and the output overlap, such as code edits.

A flat draft wastes the verifier if the first position is already wrong. Tree methods submit alternatives and take the longest valid path.

Speculation helps least when the batch is already large and the target is near compute-bound. Checking several tokens is no longer almost free. It is most attractive for low-batch, latency-sensitive work: chat, and code completion.

Diffusion language models abandon left-to-right generation. They denoise a masked sequence over a few steps. The cost is an independence assumption inside a parallel block. Errors drift on long reasoning. These methods are lossy.

Jacobi decoding updates several future positions together. For greedy decoding it can converge to the same answer as stepping one token at a time. Under sampling it is lossy. Early exit leaves before the last layer when the next token is already confident. Layer Skip uses that early exit as the drafter and the full model as the verifier. That combination is lossless again.

Pillar two buys bandwidth. It spends compute that was sitting idle. It does not shrink memory capacity.""",
    },
    {
        "id": "compression",
        "kicker": "Lesson 06",
        "title": "Compression and the quality budget",
        "slides": [
            ["Halving the bits halves the traffic.", "Outliers ruin a uniform grid.", "GPTQ and AWQ are weight-only."],
            ["KIVI: keys per channel, values per token.", "Do not swap them.", "Two-of-four sparsity is what the cores run."],
            ["Memory savings multiply.", "Quality errors do not add.", "Later calibration assumed the earlier model."],
        ],
        "text": """Lesson six. Pillar three, compression and the quality budget.

Production language models carry more precision than next-token prediction needs, and many weights can be skipped. Compression spends a quality budget to cut capacity, cut bandwidth, and, with the right kernels, raise usable compute. Most of these methods are post-training. You start from a finished checkpoint.

Halving the bytes per weight halves both the footprint and the traffic during decode. The catch is outliers. A few channels are orders of magnitude larger than the rest, and a naive uniform grid wastes its range on them.

Weight-only methods matter first, because decode traffic is mostly weights. GPTQ brings second-order error correction down to four bits at huge scale. AWQ protects the channels that activations say are salient. QuIP rotates the weights so outliers spread out. BitNet trains a tiny weight alphabet from scratch. That is training-aware, not a post-training recipe.

Activations are harder because they are computed online and they move. SmoothQuant rescales each channel so the difficulty moves from activations onto weights. The production point the survey highlights is four-bit weights with eight-bit activations, co-designed with the kernel.

The cache has its own quantization. KIVI is the one to remember. It is asymmetric and about two bits, with no extra tuning. Keys use per-channel quantization. Values use per-token quantization. Do not swap those. Cache quantization stacks with grouped-query attention because they touch different terms of the footprint.

Pruning removes structure rather than bits. Unstructured sparsity can zero half the weights, but ordinary hardware cannot accelerate arbitrary zeros. The practical pattern is two of every four weights kept. Sparse tensor cores run that pattern at about twice dense throughput.

Distillation builds a smaller student. Training on the teacher's text is mismatched, because the student later samples its own text. On-policy distillation trains on the student's own rollouts. The data distribution matters more than the exact divergence.

Deployed models are quantized and pruned and distilled. Memory savings often multiply. Quality errors do not add. Later calibration assumed the activations of the model that entered that stage. Change the architecture first, and a grid fit to the dense model can collapse.""",
    },
    {
        "id": "systems",
        "kicker": "Lesson 07",
        "title": "Hardware and systems",
        "slides": [
            ["FlashAttention is exact softmax.", "It never writes the big attention matrix.", "The win is memory traffic, not a new mixer."],
            ["Do not reserve the maximum length.", "Pages of about sixteen tokens.", "Outputs stay identical. Waste does not."],
            ["A long prefill stalls every decode.", "Split the phases onto different pools.", "Goodput is tokens that meet the latency target."],
        ],
        "text": """Lesson seven. Pillar four, hardware and systems.

The first three pillars specify a cheaper model. This pillar collects waste they cannot see: bytes that move more than once, and compute that stalls waiting. It is the only pillar that hits all four bottlenecks, and the only one that is mostly lossless. A request served by FlashAttention on a paged cache produces the same bits as a naive run. You pay engineering complexity, not perplexity.

Textbook softmax writes a full attention matrix into high-bandwidth memory. The bytes dominate the arithmetic. FlashAttention tiles queries, keys, and values through on-chip memory, runs softmax online, and writes only the output. It is exact, not an approximation, often two to four times faster. The third version adds eight-bit floats and reaches about three quarters of an H one hundred's peak.

Those kernels were shaped for training, where queries, keys, and values have similar lengths. Decode has one query against a long cache. FlashInfer targets serving: paged layouts, ragged batches, and the attention variants used in production.

The most important systems idea in the survey: manage the cache like virtual memory. Reserving one contiguous slot out to the maximum length fragments memory, because requests die early. PagedAttention allocates fixed pages, typically sixteen tokens, and a block table per request. The outputs do not change. Only the wasted reservation does.

Continuous batching is the matching scheduler. Do not wait for the longest request. Step everyone once, and admit new work at the boundary.

Shared prefixes should not be prefilled twice. System prompts, few-shot examples, and chat history. RadixAttention stores cache entries in a tree and evicts the cold ones.

A long prefill on the same GPU as in-flight decodes stalls every user and blows up time per output token. DistServe, Splitwise, and Mooncake split the phases onto different pools. DistServe optimizes goodput under a latency target. Splitwise puts compute-heavy GPUs on prefill and bandwidth-heavy GPUs on decode. Mooncake adds a global cache pool. Sarathi gets much of the benefit without a second pool, by chunking prefill and interleaving it with decode.

The open stacks have converged on paging, continuous batching, FlashAttention, and prefix caches. What still differs is scheduling, kernel quality, and how cleanly a stack joins a disaggregated topology.""",
    },
    {
        "id": "synthesis",
        "kicker": "Lesson 08",
        "title": "One cache, four axes",
        "slides": [
            ["Architecture shrinks a dimension.", "Decoding routes a draft tree.", "Compression shortens the word. Systems page it."],
            ["They stack. They are not alternatives.", "The friction is layout.", "Each new mix wants a new kernel."],
            ["Prefill wants wide compute formats.", "Decode wants narrow weights.", "Production does not yet split those formats."],
        ],
        "text": """Lesson eight. The cache and the phase split, seen across the whole stack.

You cannot optimize the layers in isolation. The survey's synthesis is two motifs.

First, the key-value cache is a ledger every pillar writes in. Pillar one reduces a structural dimension: fewer key-value heads, or a latent width. Pillar two routes validation: tree-shaped drafts, checked under a mask. Pillar three reduces word length, down to about two-bit asymmetric grids. Pillar four allocates physical blocks: page tables, and trees for shared prefixes.

These add. A real deployment can run grouped-query attention, speculative trees, a four-bit cache, and paged attention together. The friction is layout. Quantized caches used to be widened back to sixteen-bit before a stock attention kernel. Newer kernels attend directly in the low-bit layout. But every new combination of bit width, head sharing, and page size wants a new kernel. That co-design burden is the cost of the additive win.

Second, splitting prefill from decode changes which quantization and which decoder you even want.

On one GPU, a single numeric format has to serve two masters. Prefill wants eight-bit weights and eight-bit activations, or eight-bit floats, to fill the tensor cores. Decode wants narrow weights, four-bit or even two-bit, to cut bytes on the bus. Disaggregation makes different schemes per phase conceivable. SmoothQuant on the prefill pool. GPTQ on the decode pool. The survey is explicit that it does not know of a production system doing this yet. It is future work, not current practice. Do not over-claim it.

Speculation changes the machine mix. Heavy verification pushes decode toward a compute-bound envelope, so the right ratio of prefill nodes to decode nodes moves. The new bottleneck can be the link inside the node, rather than high-bandwidth memory. If you only memorize that speculation saves bandwidth, you miss this second-order effect.

When two techniques stack, say which term of the cache formula each one moves, or which side of the roofline. If you cannot, they are probably not as independent as the abstracts claim.""",
    },
    {
        "id": "frontiers",
        "kicker": "Lesson 09",
        "title": "Three open frontiers",
        "slides": [
            ["A fixed state cannot point at one fact.", "Hybrids rent attention back.", "The cache grows again. The Pareto stays open."],
            ["Speculation is lossless only if drafts match.", "If acceptance falls to zero, checking is waste.", "Diffusion chooses the lossy side on purpose."],
            ["Stacked compression is not a sum of errors.", "Each stage was calibrated on the last model.", "Co-design is the conclusion, not a finished stack."],
        ],
        "text": """Lesson nine. Three open frontiers, and the conclusion.

The stack is not finished. The survey names three problems that cut across the pillars. If you can state each one as a tradeoff, and say why it is still open, you have the last chapter of the exam.

First. Recall versus efficiency, for subquadratic state. A fixed recurrent state is an information bottleneck. Unlike the key-value cache, it cannot keep a lossless history. Needle in a haystack retrieval, long multi-turn logs, and hard in-context learning degrade. Hybrids such as Jamba rent back a little attention, and with it they reintroduce a cache that still grows with context. They do not close the tradeoff. The open problem is how to bound memory without losing non-local associative recall.

Second. The lossless versus lossy line in parallel decoding. Speculation stays lossless only while the draft is aligned with the target. If the draft distribution drifts, the mean accepted length falls toward zero, and verification is pure waste. Newer drafters move toward the verifier offline or in batches. A principled realignment on each request is still open. Diffusion and consistency models sit on the lossy side on purpose. They trade exact left-to-right conditionals for wide parallel blocks. Can the draft width, or the number of denoising steps, track live bandwidth? And can a small deviation from the autoregressive distribution be acceptable, because the memory bus is the scarce resource?

Third. Error under composed compression. A plausible pipeline prunes structure, linearizes the remaining attention by distillation, then quantizes. Each stage was calibrated on the model that entered it. Total error can be much larger than the sum of the three pieces. A composition theory with predictable bounds is still open, especially off the datacenter.

The conclusion restates the co-design claim. Key-value layout has to work with virtual memory. Speculative loops have to meet low-precision kernels. Compression has to know which phase of a split network it is serving. These three frontiers are what still blocks cheap, real-time inference at global scale.

That is the survey. Four pillars. Four bottlenecks. One cache. Three open problems.""",
    },
]


def wrap(draw, text, font, width):
    words = text.split()
    lines, cur = [], ""
    for w in words:
        trial = w if not cur else cur + " " + w
        if draw.textlength(trial, font=font) <= width:
            cur = trial
        else:
            if cur:
                lines.append(cur)
            cur = w
    if cur:
        lines.append(cur)
    return lines


def slide(path, kicker, title, lines, index, total):
    img = Image.new("RGB", (1280, 720), PAPER)
    d = ImageDraw.Draw(img)
    d.rectangle((0, 0, 16, 720), fill=COPPER)
    d.rectangle((0, 680, 1280, 720), fill=(28, 25, 21))
    kicker_f = ImageFont.truetype(SANS_B, 22)
    title_f = ImageFont.truetype(SERIF, 54)
    body_f = ImageFont.truetype(SANS, 36)
    foot_f = ImageFont.truetype(SANS, 20)
    d.text((56, 48), kicker.upper(), font=kicker_f, fill=COPPER)
    y = 96
    for line in wrap(d, title, title_f, 1120)[:2]:
        d.text((56, y), line, font=title_f, fill=INK)
        y += 64
    y = max(y + 36, 280)
    for line in lines:
        d.ellipse((56, y + 14, 74, y + 32), fill=COPPER)
        d.text((96, y), line, font=body_f, fill=INK)
        y += 72
    d.text((56, 692), "Ridge  ·  narrated lecture", font=foot_f, fill=PAPER)
    d.text((1100, 692), f"{index} / {total}", font=foot_f, fill=PAPER)
    img.save(path, quality=90)


def tts(text, dest: Path):
    key = os.environ["XAI_API_KEY"]
    body = json.dumps({"text": text, "voice_id": "orion", "language": "en"}).encode()
    req = urllib.request.Request(
        "https://api.x.ai/v1/tts",
        data=body,
        headers={"Authorization": f"Bearer {key}", "Content-Type": "application/json"},
    )
    with urllib.request.urlopen(req, timeout=180) as r:
        data = r.read()
    dest.write_bytes(data)
    if not data.startswith(b"\xff"):
        raise SystemExit(f"not mp3: {dest} {data[:80]!r}")


def duration(path: Path) -> float:
    proc = subprocess.run(
        ["ffmpeg", "-i", str(path)],
        capture_output=True,
        text=True,
    )
    blob = proc.stderr
    for token in blob.split():
        if token.count(":") == 2 and token[0].isdigit():
            h, m, s = token.split(":")
            return int(h) * 3600 + int(m) * 60 + float(s.rstrip(","))
    raise RuntimeError(blob[-400:])


def mux(lesson):
    lid = lesson["id"]
    audio = AUDIO / f"{lid}.mp3"
    if not audio.exists() or audio.stat().st_size < 1000:
        print("tts", lid)
        tts(lesson["text"], audio)
    dur = duration(audio)
    work = AUDIO / lid
    work.mkdir(exist_ok=True)
    n = len(lesson["slides"])
    seg = dur / n
    parts = []
    for i, lines in enumerate(lesson["slides"], start=1):
        png = work / f"s{i}.png"
        slide(png, lesson["kicker"], lesson["title"], lines, i, n)
        if i == 1:
            png_out = OUT / f"lecture-{lid}.jpg"
            Image.open(png).save(png_out, quality=88)
        part = work / f"p{i}.mp4"
        subprocess.check_call(
            [
                "ffmpeg", "-y", "-loop", "1", "-t", f"{seg:.3f}", "-i", str(png),
                "-r", "24", "-c:v", "libx264", "-tune", "stillimage", "-pix_fmt", "yuv420p",
                "-an", str(part),
            ],
            stdout=subprocess.DEVNULL,
            stderr=subprocess.DEVNULL,
        )
        parts.append(part)
    concat = work / "concat.txt"
    concat.write_text("".join(f"file '{p}'\n" for p in parts))
    silent = work / "silent.mp4"
    subprocess.check_call(
        ["ffmpeg", "-y", "-f", "concat", "-safe", "0", "-i", str(concat), "-c", "copy", str(silent)],
        stdout=subprocess.DEVNULL,
        stderr=subprocess.DEVNULL,
    )
    final = OUT / f"lecture-{lid}.mp4"
    subprocess.check_call(
        [
            "ffmpeg", "-y", "-i", str(silent), "-i", str(audio),
            "-c:v", "copy", "-c:a", "aac", "-b:a", "128k", "-shortest",
            "-movflags", "+faststart", str(final),
        ],
        stdout=subprocess.DEVNULL,
        stderr=subprocess.DEVNULL,
    )
    print(f"{lid} {dur:.1f}s {final.stat().st_size/1e6:.1f}MB")


def main():
    for lesson in LESSONS:
        mux(lesson)


if __name__ == "__main__":
    main()
