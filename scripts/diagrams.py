"""Named diagram definitions for the Ridge lecture slides.

Each entry maps a short name used in the lesson script to a drawing function that
takes a Pillow draw context and a pixel box.
"""

from __future__ import annotations

import math

from slidekit import (
    BLUE,
    BLUE_SOFT,
    CARD,
    COPPER,
    COPPER_DEEP,
    COPPER_SOFT,
    INK,
    LINE,
    MOSS,
    MOSS_SOFT,
    MUTED,
    PAPER,
    SAND,
    WARN,
    WARN_SOFT,
    arrow,
    d_badge,
    d_bars,
    d_blocks,
    d_compare,
    d_curve,
    d_flow,
    d_formula,
    d_grid,
    d_hub,
    d_ledger,
    d_scatter,
    d_stack,
    d_timeline,
    d_tree,
    font,
    fmt,
    rounded,
    text,
    wrap,
)


def legend(d, xy, items, vertical=False, anchor="la", size=14):
    """Colour key. anchor "ra" right-aligns the whole row on x."""
    f = font("sans", size, 500)
    x, y = xy
    if anchor == "ra" and not vertical:
        total = sum(30 + d.textlength(label, font=f) + 18 for label, _ in items) - 18
        x -= total
    for label, colour in items:
        d.rounded_rectangle((x, y + 4, x + 22, y + 12), radius=4, fill=colour)
        text(d, (x + 30, y), label, f, MUTED)
        if vertical:
            y += size + 12
        else:
            x += 30 + d.textlength(label, font=f) + 18


def cost_curve(d, box, **kw):
    d_curve(
        d,
        box,
        [
            {"points": [(0, 8), (100, 8)], "colour": MOSS, "width": 4},
            {"points": [(0, 0.5), (100, 100)], "colour": COPPER, "width": 4},
        ],
        "queries served", "cumulative cost",
        xticks=[0, 25, 50, 75, 100],
        yticks=[0, 25, 50, 75, 100],
        markers=[{"x": 8, "y": 8, "label": "break-even", "dx": 12, "dy": -34, "colour": INK}],
    )
    x0, y0, x1, y1 = box
    text(d, (x0 + 300, y1 - 112), "training, paid once", font("sans", 14, 600), MOSS)
    text(d, (x0 + 74, y0 + 42), "inference, paid per query", font("sans", 14, 600), COPPER_DEEP)


def prefill_decode(d, box, **kw):
    d_compare(
        d,
        box,
        {
            "title": "Prefill",
            "tone": BLUE,
            "soft": BLUE_SOFT,
            "items": ["whole prompt in one pass", "fills the KV cache", "high arithmetic per byte", "bound by tensor cores"],
            "foot": "compute bound",
        },
        {
            "title": "Decode",
            "tone": COPPER,
            "soft": COPPER_SOFT,
            "items": ["one token per step", "reads the whole cache", "weights stream from HBM", "bound by memory bandwidth"],
            "foot": "bandwidth bound",
        },
    )


def cache_hub(d, box, **kw):
    d_hub(
        d,
        box,
        "KV\ncache",
        [
            ("Architecture", "shrink a dimension", 0, -1.05),
            ("Decoding", "validate in parallel", 1.0, 0),
            ("Compression", "fewer bits per entry", 0, 1.05),
            ("Systems", "page and schedule", -1.0, 0),
        ],
    )


def roofline(d, box, pi=990.0, beta=3.35, **kw):
    ridge = pi / beta
    xs = [0.5, 1, 2, 4, 8, 16, 32, 64, 128, 200, ridge]
    mem = [(x, min(pi, x * beta)) for x in xs]
    roof = [(ridge, pi), (1400, pi)]
    d_curve(
        d, box,
        [
            {"points": mem, "colour": COPPER, "width": 4},
            {"points": roof, "colour": COPPER, "width": 4},
        ],
        "arithmetic intensity   (FLOP / byte)", "TFLOP/s",
        xticks=[0.5, 1, 4, 16, 64, 256, 1024],
        yticks=[1, 10, 100, 1000],
        logx=True, logy=True,
        xtick_fmt=lambda t: f"{t:g}",
        markers=[
            {"x": 1, "y": beta, "label": "batch-1 decode", "dx": 12, "dy": -4},
        ],
    )
    x0, y0, x1, y1 = box
    ax0, ax1 = x0 + 62, x1 - 22
    ay0, ay1 = y0 + 34, y1 - 58

    def px(v):
        lo, hi = math.log10(0.5), math.log10(1024)
        return ax0 + (math.log10(v) - lo) / (hi - lo) * (ax1 - ax0)

    def py(v):
        lo, hi = math.log10(1), math.log10(1000)
        return ay1 - (math.log10(v) - lo) / (hi - lo) * (ay1 - ay0)

    # segment labels sit in the empty wedge, next to the line they describe
    text(d, (ax1 - 6, py(pi) - 24), "compute roof: peak FLOP/s", font("sans", 13, 600), MUTED, anchor="ra")
    text(d, (px(1.15), ay1 - 40), "memory roof: bandwidth x intensity", font("sans", 13, 600), MUTED, anchor="la")
    # ridge annotation, below the roof in the empty right-hand wedge
    rx = px(ridge)
    d.line([(rx, ay0), (rx, ay1)], fill=LINE, width=1)
    text(d, (rx - 12, ay1 - 104), f"ridge  {ridge:.0f}", font("sans", 14, 700), COPPER_DEEP, anchor="ra")
    text(d, (rx - 12, ay1 - 86), "peak compute / bandwidth", font("sans", 13), MUTED, anchor="ra")
    text(d, (rx - 12, ay1 - 68), "decode sits far to the left", font("sans", 13), MUTED, anchor="ra")


def bytes_bars(d, box, **kw):
    d_bars(
        d, box,
        [
            ("FP16", 16, COPPER),
            ("INT8", 8, COPPER),
            ("INT4", 4, COPPER),
            ("2-bit", 2, MOSS),
        ],
        unit=" bits",
    )
    text(d, ((box[0] + box[2]) / 2, box[3] - 6), "bytes per weight set the decode traffic", font("sans", 14), MUTED, anchor="ma")


def system_flow(d, box, **kw):
    d_flow(
        d, box,
        ["Flash-\nAttention", "paged\nKV cache", "continuous\nbatching", "prefill / decode\ndisaggregation"],
        note="same outputs, less wasted memory and time",
    )


def spec_timeline(d, box, **kw):
    rows = [
        {"label": "sequential", "start": 0, "end": 1, "colour": LINE, "text": "t1"},
        {"label": "", "start": 1, "end": 2, "colour": LINE, "text": "t2"},
        {"label": "", "start": 2, "end": 3, "colour": LINE, "text": "t3"},
        {"label": "", "start": 3, "end": 4, "colour": LINE, "text": "t4"},
        {"label": "draft", "start": 0, "end": 4, "colour": WARN, "text": "cheap model proposes 4 tokens"},
        {"label": "verify", "start": 4.2, "end": 6.2, "colour": COPPER, "text": "one target pass"},
        {"label": "accept", "start": 4.2, "end": 5.6, "colour": MOSS, "text": "3 accepted"},
    ]
    d_timeline(d, box, rows, "wall-clock time  →")
    text(d, ((box[0] + box[2]) / 2, box[1] + 4), "one weight read can emit several tokens", font("sans", 14, 600), INK, anchor="ma")


def spec_tree(d, box, **kw):
    d_tree(d, box, "target verifies the whole draft in parallel", ["draft A", "draft B", "draft C", "draft D"],
           [["ok"], ["ok"], ["reject -> resample"], ["discard"]])


def quant_grid(d, box, **kw):
    """One weight row before and after a uniform 4-bit grid."""
    x0, y0, x1, y1 = box
    values = [0.4, 0.55, 0.62, 3.9, 0.5, 0.44, 0.71, 4.6, 0.49, 0.58, 0.66, 0.52]
    vmax = max(values)
    levels = [i * vmax / 15 for i in range(16)]

    def snap(v):
        return min(levels, key=lambda lv: abs(lv - v))

    gap = 30
    w = (x1 - x0 - gap) / 2
    base = y1 - 82
    plot_h = base - (y0 + 56)

    for panel, (title, vals) in enumerate([
        ("exact weights", values),
        ("after a 4-bit uniform grid", [snap(v) for v in values]),
    ]):
        px0 = x0 + panel * (w + gap)
        text(d, (px0, y0), title, font("sans", 14, 700), INK if panel == 0 else COPPER_DEEP)
        if panel == 1:
            for lv in levels:
                yy = base - plot_h * (lv / vmax)
                d.line([(px0, yy), (px0 + w, yy)], fill=LINE, width=1)
            text(d, (px0, y0 + 20), "16 levels, evenly spaced", font("sans", 12), MUTED)
        cell_w = (w - 14) / len(vals)
        for i, v in enumerate(vals):
            left = px0 + 7 + i * cell_w
            h = plot_h * (v / vmax)
            colour = COPPER if v > 2 else MOSS
            d.rounded_rectangle((left + 3, base - h, left + cell_w - 3, base), radius=3, fill=colour)
        d.line([(px0, base), (px0 + w, base)], fill=INK, width=2)

    text(d, (x0, y1 - 54), "two outliers stretch the range, so ten ordinary weights snap onto three levels",
         font("sans", 13, 500), MUTED)
    text(d, (x0, y1 - 30), "that is the whole story of quantization: a few extreme values, and everything else",
         font("sans", 13, 700), COPPER_DEEP)


def kivi(d, box, **kw):
    d_compare(
        d, box,
        {"title": "Keys", "tone": BLUE, "soft": BLUE_SOFT, "items": ["quantize per channel", "outliers line up across tokens", "one scale per head dimension"], "foot": "per-channel"},
        {"title": "Values", "tone": MOSS, "soft": MOSS_SOFT, "items": ["quantize per token", "outliers line up within a token", "one scale per position"], "foot": "per-token, do not swap"},
    )


def two_four(d, box, **kw):
    x0, y0, x1, y1 = box
    cols, rows = 12, 6
    cw = (x1 - x0 - 40) / cols
    ch = (y1 - y0 - 90) / rows
    for r in range(rows):
        for c in range(cols):
            keep = (c % 4) in (0, 1)
            left = x0 + 20 + c * cw
            top = y0 + 40 + r * ch
            d.rounded_rectangle((left, top, left + cw - 4, top + ch - 4), radius=3, fill=(COPPER if keep else SAND))
    text(d, (x0, y0 + 4), "2:4 structured sparsity", font("sans", 15, 700), INK)
    d.rounded_rectangle((x0 + 20, y1 - 38, x0 + 44, y1 - 26), radius=3, fill=COPPER)
    text(d, (x0 + 52, y1 - 42), "kept", font("sans", 14), MUTED)
    d.rounded_rectangle((x0 + 110, y1 - 38, x0 + 134, y1 - 26), radius=3, fill=SAND)
    text(d, (x0 + 142, y1 - 42), "zeroed", font("sans", 14), MUTED)
    text(d, (x1 - 10, y1 - 42), "every group of 4 keeps exactly 2", font("sans", 14), MUTED, anchor="ra")


def flash_tiles(d, box, **kw):
    x0, y0, x1, y1 = box
    text(d, (x0, y0), "attention, tiled through on-chip SRAM", font("sans", 15, 700), INK)
    top = y0 + 34
    # Q on the left, K/V on top, tiles highlighted on the diagonal
    qx, qy = x0 + 16, top + 46
    kw_ = x1 - x0 - 70
    size = min(kw_, y1 - top - 60)
    cell = size / 4
    for i in range(4):
        for j in range(4):
            left = qx + j * cell
            tt = qy + i * cell
            fill = COPPER_SOFT if i == j else CARD
            outline = COPPER if i == j else LINE
            d.rectangle((left, tt, left + cell - 2, tt + cell - 2), fill=fill, outline=outline, width=2)
    text(d, (qx + size / 2, qy - 22), "keys / values", font("sans", 13, 600), MUTED, anchor="ma")
    text(d, (qx - 10, qy + size / 2), "queries", font("sans", 13, 600), MUTED, anchor="rm")
    d_badge(d, (qx + size + 18, qy + size / 2 - 20), "tile", COPPER_DEEP, COPPER_SOFT, font("sans", 13, 700))
    text(d, (qx + size + 18, qy + size / 2 + 14), "never\nmaterialized", font("sans", 12), MUTED)


def paging(d, box, **kw):
    """Reservation waste vs. a page pool with a block table."""
    x0, y0, x1, y1 = box
    w, h = x1 - x0, y1 - y0
    stacked = w < 760
    if stacked:
        panels = [(x0, y0, x1, y0 + h * 0.46), (x0, y0 + h * 0.54, x1, y1)]
    else:
        panels = [(x0, y0, x0 + w * 0.46, y1), (x0 + w * 0.54, y0, x1, y1)]

    tones = [(COPPER_SOFT, COPPER), (WARN_SOFT, WARN), (MOSS_SOFT, MOSS)]
    names = ["A", "B", "C"]
    need = [5, 3, 7]
    cap = 12

    # left: one contiguous slot per request, reserved to the maximum length
    ax0, ay0, ax1, ay1 = panels[0]
    text(d, (ax0, ay0), "contiguous reservation", font("sans", 15, 700), COPPER_DEEP)
    label_w = 62 if not stacked else 72
    strip0 = ax0 + label_w
    strip1 = ax1 - 8
    cw = (strip1 - strip0) / cap
    avail = ay1 - ay0 - 78
    row_h = max(34, min(64, (avail - 44) / 3))
    block = 3 * row_h + 2 * 14 + 44
    start_y = ay0 + 38 + max(0, (avail - block) / 2)
    for i in range(3):
        top = start_y + i * (row_h + 14)
        text(d, (ax0, top + row_h / 2), f"req {names[i]}", font("sans", 13, 600), MUTED, anchor="lm")
        for c in range(cap):
            left = strip0 + c * cw
            used = c < need[i]
            fill, outline = tones[i] if used else (CARD, LINE)
            d.rounded_rectangle((left, top, left + cw - 3, top + row_h), radius=4, fill=fill,
                                outline=outline, width=2 if used else 1)
    waste_y = start_y + 3 * (row_h + 14)
    arrow(d, (strip0, waste_y + 20), (strip1, waste_y + 20), COPPER, 2, 7)
    text(d, ((strip0 + strip1) / 2, waste_y), "reserved to the maximum length", font("sans", 12.5), COPPER_DEEP, anchor="ma")
    text(d, ((strip0 + strip1) / 2, waste_y + 34), "the tail is wasted when a request ends early",
         font("sans", 12.5), MUTED, anchor="ma")

    # right: fixed pages packed on demand, plus a block table
    bx0, by0, bx1, by1 = panels[1]
    text(d, (bx0, by0), "paged allocation", font("sans", 15, 700), MOSS)
    mapping = []
    page = 0
    for i in range(3):
        mapping.append((names[i], page, page + need[i] - 1, need[i], i))
        page += need[i]
    pool_total = 18
    cols = 6
    rows = (pool_total + cols - 1) // cols
    gap = 5
    pw = (bx1 - bx0 - gap * (cols - 1)) / cols
    ph = max(26, min(92, (by1 - by0 - 190) / rows))
    grid_top = by0 + 38
    for idx in range(pool_total):
        r, c = divmod(idx, cols)
        left = bx0 + c * (pw + gap)
        top = grid_top + r * (ph + gap)
        fill, outline = CARD, LINE
        for name, start, end, count, tone_i in mapping:
            if start <= idx <= end:
                fill, outline = tones[tone_i]
        d.rounded_rectangle((left, top, left + pw, top + ph), radius=4, fill=fill, outline=outline, width=1)
        text(d, (left + 5, top + 4), str(idx), font("mono", 10, 500), MUTED)
    grid_bottom = grid_top + rows * (ph + gap) - gap
    text(d, (bx0, grid_bottom + 8), "one fixed-size page, 16 tokens", font("sans", 12.5), MUTED)
    # block table
    ty = grid_bottom + 34
    text(d, (bx0, ty), "block table", font("sans", 12, 700), INK)
    ty += 20
    lh = min(22, max(16, (by1 - ty) / 3))
    for name, start, end, count, tone_i in mapping:
        text(d, (bx0, ty), f"{name}", font("mono", 12, 700), tones[tone_i][1])
        rng = f"{start}" if start == end else f"{start}-{end}"
        text(d, (bx0 + 26, ty), f"-> pages {rng}", font("mono", 12, 500), INK)
        ty += lh


def batching(d, box, **kw):
    rows = [
        {"label": "static", "start": 0, "end": 6, "colour": LINE, "text": "waits for the longest request"},
        {"label": "continuous", "start": 0, "end": 2.2, "colour": COPPER, "text": "A"},
        {"label": "", "start": 2.2, "end": 4.6, "colour": MOSS, "text": "B"},
        {"label": "", "start": 4.6, "end": 7.2, "colour": BLUE, "text": "C"},
        {"label": "", "start": 7.2, "end": 9.0, "colour": WARN, "text": "D"},
    ]
    d_timeline(d, box, rows, "decode steps  →")
    text(d, ((box[0] + box[2]) / 2, box[1] - 18), "admit a new request at the step boundary", font("sans", 14, 600), INK, anchor="ma")


def disaggregate(d, box, **kw):
    x0, y0, x1, y1 = box
    mid = (x1 - x0) / 2
    blocks = [
        {"x": 0.02, "y": 0.10, "w": 0.34, "h": 0.34, "label": "prefill pool", "sub": "compute-heavy\n8-bit weights", "fill": BLUE_SOFT, "outline": BLUE},
        {"x": 0.64, "y": 0.10, "w": 0.34, "h": 0.34, "label": "decode pool", "sub": "bandwidth-heavy\n4-bit weights", "fill": COPPER_SOFT, "outline": COPPER},
        {"x": 0.02, "y": 0.56, "w": 0.34, "h": 0.30, "label": "global KV cache", "sub": "paged, shared prefixes", "fill": MOSS_SOFT, "outline": MOSS},
        {"x": 0.64, "y": 0.56, "w": 0.34, "h": 0.30, "label": "scheduler", "sub": "goodput under SLO", "fill": WARN_SOFT, "outline": WARN},
    ]
    d_blocks(d, box, blocks)
    arrows = [
        ((x0 + 0.36 * (x1 - x0), y0 + 0.27 * (y1 - y0)), (x0 + 0.64 * (x1 - x0), y0 + 0.27 * (y1 - y0))),
        ((x0 + 0.19 * (x1 - x0), y0 + 0.44 * (y1 - y0)), (x0 + 0.19 * (x1 - x0), y0 + 0.56 * (y1 - y0))),
        ((x0 + 0.36 * (x1 - x0), y0 + 0.71 * (y1 - y0)), (x0 + 0.64 * (x1 - x0), y0 + 0.71 * (y1 - y0))),
        ((x0 + 0.72 * (x1 - x0), y0 + 0.56 * (y1 - y0)), (x0 + 0.72 * (x1 - x0), y0 + 0.44 * (y1 - y0))),
    ]
    for a, b in arrows:
        arrow(d, a, b, COPPER, 2, 8)


def hybrid(d, box, **kw):
    """Layer strip on top, cache-per-token comparison underneath."""
    x0, y0, x1, y1 = box
    h = y1 - y0
    n = 16
    gap = 4
    w = (x1 - x0 - gap * (n - 1)) / n
    text(d, (x0, y0), "Jamba-style stack: 1 attention layer for every 7 Mamba layers",
         font("sans", 14, 700), INK)
    top = y0 + 46
    th = max(30, min(96, 0.19 * h))
    for i in range(n):
        left = x0 + i * (w + gap)
        attn = i in (0, 8)
        d.rounded_rectangle((left, top, left + w, top + th), radius=4, fill=(COPPER if attn else SAND))
        if attn:
            text(d, (left + w / 2, top + th / 2), "A", font("mono", 13, 700), PAPER, anchor="mm")
    text(d, (x0, top + th + 14), "the cache exists only on the copper layers", font("sans", 13.5), MUTED)

    # cache per token, as a share of a full-attention cache
    label_y = top + th + max(0.10 * h, 40)
    d.line([(x0, label_y - 18), (x1, label_y - 18)], fill=LINE, width=1)
    text(d, (x0, label_y), "cache per token", font("sans", 13, 700), INK)
    rows = [("full attention", 100, COPPER, COPPER_SOFT), ("hybrid stack", 12.5, MOSS, MOSS_SOFT)]
    bx = x0 + 150
    avail = x1 - bx - 92
    bar_h = 30
    for i, (label, pct, tone, soft) in enumerate(rows):
        ry = label_y + 30 + i * 66
        text(d, (x0, ry + bar_h / 2), label, font("sans", 13.5, 500), MUTED, anchor="lm")
        d.rounded_rectangle((bx, ry, bx + max(6, avail * pct / 100), ry + bar_h), radius=5,
                            fill=soft, outline=tone, width=2)
        text(d, (bx + max(6, avail * pct / 100) + 10, ry + bar_h / 2), f"{pct:g}%",
             font("mono", 13, 700), tone, anchor="lm")
    text(d, (x0, label_y + 30 + 2 * 66 + 6), "attention layers restore recall, and with it a cache that grows again",
         font("sans", 13), MUTED)


def moe(d, box, **kw):
    """A router picks two experts; every expert still sits in memory."""
    x0, y0, x1, y1 = box
    h = y1 - y0
    text(d, (x0, y0), "mixture of experts", font("sans", 15, 700), INK)

    cy = y0 + 0.40 * h
    bh = min(0.26 * h, 108)
    rx0, rx1 = x0, x0 + 92
    rounded(d, (rx0, cy - 24, rx1, cy + 24), radius=9, fill=INK, outline=INK)
    text(d, ((rx0 + rx1) / 2, cy), "router", font("sans", 13, 700), PAPER, anchor="mm")

    bx0 = rx1 + 34
    gap = 14
    bw = (x1 - bx0 - 3 * gap) / 4
    active = {1, 3}
    for i in range(4):
        left = bx0 + i * (bw + gap)
        on = i in active
        rounded(d, (left, cy - bh / 2, left + bw, cy + bh / 2), radius=9,
                fill=(COPPER_SOFT if on else CARD), outline=(COPPER if on else LINE), width=2)
        text(d, (left + bw / 2, cy), f"E{i + 1}", font("sans", 17, 700), INK, anchor="mm")
        text(d, (left + bw / 2, cy + bh / 2 + 16), "active" if on else "idle",
             font("sans", 12, 700 if on else 500), COPPER_DEEP if on else MUTED, anchor="ma")
        if on:
            bus = cy - bh / 2 - 34
            d.line([(rx1 + 6, cy - 18), (rx1 + 6, bus)], fill=COPPER, width=2)
            d.line([(rx1 + 6, bus), (left + bw / 2, bus)], fill=COPPER, width=2)
            arrow(d, (left + bw / 2, bus), (left + bw / 2, cy - bh / 2 - 3), COPPER, 2, 8)

    text(d, (x0, y1 - 62), "total parameters: all experts", font("sans", 13.5), MUTED)
    text(d, (x0, y1 - 40), "activated parameters: two experts per token", font("sans", 13.5), MUTED)
    text(d, (x0, y1 - 18), "state per token is unchanged", font("sans", 13.5, 700), COPPER_DEEP)


def recall_curve(d, box, **kw):
    xs = [1, 2, 4, 8, 16, 32, 64, 128]
    full = [(x, 97 + 2 * math.log(x + 1) / math.log(129)) for x in xs]
    fixed = [(x, 100 - 46 / (1 + x / 6)) for x in xs]
    d_curve(
        d, box,
        [
            {"points": full, "colour": MOSS, "width": 4},
            {"points": fixed, "colour": COPPER, "width": 4},
        ],
        "state size / cache budget", "recall on associative retrieval",
        xticks=[1, 4, 16, 64, 128], yticks=[40, 60, 80, 100],
        logx=True, xtick_fmt=lambda t: f"{t:g}",
        spans=[{"x": 8, "y0": 72.6, "y1": 97.9, "label": "the gap", "colour": INK, "dy": -30}],
    )
    legend(d, (box[2] - 16, box[1] + 2), [("softmax attention", MOSS), ("fixed state", COPPER)], anchor="ra")


def cache_growth(d, box, **kw):
    n = [1, 2, 4, 8, 16, 32, 64, 128]
    d_curve(
        d, box,
        [
            {"points": [(x, x) for x in n], "colour": COPPER, "width": 4},
            {"points": [(x, 1) for x in n], "colour": MOSS, "width": 4},
            {"points": [(x, math.sqrt(x)) for x in n], "colour": BLUE, "width": 3, "dashed": True},
        ],
        "sequence length", "memory",
        xticks=[1, 4, 16, 64, 128], yticks=[1, 4, 16, 64, 128],
        logx=True, logy=True, xtick_fmt=lambda t: f"{t:g}", ytick_fmt=lambda t: f"{t:g}",
    )
    legend(d, (box[2] - 16, box[1] + 2), [("KV cache", COPPER), ("fixed state", MOSS), ("hybrid", BLUE)], anchor="ra")


def frontier(d, box, **kw):
    pts = [
        {"x": 0.16, "y": 0.88, "label": "full attention", "colour": MOSS},
        {"x": 0.42, "y": 0.64, "label": "hybrid / Jamba", "colour": WARN},
        {"x": 0.66, "y": 0.40, "label": "MLA", "colour": BLUE},
        {"x": 0.84, "y": 0.24, "label": "Mamba", "colour": COPPER},
    ]
    d_scatter(d, box, pts, "memory per token", "recall",
              curve=[(p["x"], p["y"]) for p in pts])
    text(d, (box[2] - 10, box[1] + 18), "open frontier: no point dominates", font("sans", 12.5, 600), COPPER_DEEP, anchor="ra")


def quant_matrix(d, box, **kw):
    cols = ["weights", "activations", "KV cache", "format"]
    rows = [
        ["FP16", "FP16", "FP16", "baseline"],
        ["INT8", "FP8", "INT8", "W8A8"],
        ["INT4", "FP8", "INT4", "W4A8"],
        ["2-bit", "FP16", "2-bit", "W2 / KIVI"],
    ]
    d_ledger(d, box, cols, rows)


def compression_stack(d, box, **kw):
    x0, y0, x1, y1 = box
    text(d, (x0, y0), "each stage is calibrated on the model that enters it", font("sans", 14, 700), INK)
    stages = [
        ("prune 2:4", "dense baseline"),
        ("distill attention", "pruned model"),
        ("quantize INT4", "linearized model"),
        ("serve", "quantized model"),
    ]
    n = len(stages)
    gap = 18
    w = (x1 - x0 - gap * (n - 1)) / n
    flow_h = 76
    for i, (label, note) in enumerate(stages):
        left = x0 + i * (w + gap)
        rounded(d, (left, y0 + 34, left + w, y0 + 34 + flow_h), radius=8, fill=CARD, outline=LINE, width=2)
        text(d, (left + w / 2, y0 + 56), label, font("sans", 13.5, 700), INK, anchor="ma")
        text(d, (left + w / 2, y0 + 78), note, font("sans", 11.5), MUTED, anchor="ma")
        if i < n - 1:
            arrow(d, (left + w + 3, y0 + 34 + flow_h / 2), (left + w + gap - 3, y0 + 34 + flow_h / 2), COPPER, 2, 6)

    # error grows with each stage, drawn to scale in the space below the pipeline
    label_y = y0 + 34 + flow_h + 46
    text(d, (x0, label_y), "error vs the original model", font("sans", 13), MUTED)
    base = y1 - 46
    max_h = base - (label_y + 30)
    heights = [0.18, 0.34, 0.52, 0.78]
    bw = min(64, w * 0.44)
    for i, hgt in enumerate(heights):
        cx = x0 + i * (w + gap) + w / 2
        d.rectangle((cx - bw / 2, base - hgt * max_h, cx + bw / 2, base),
                    fill=COPPER_SOFT, outline=COPPER, width=2)
        text(d, (cx, base - hgt * max_h - 18), f"{hgt * 4:.1f}x", font("mono", 12.5, 600), COPPER_DEEP, anchor="ma")
    d.line([(x0 + 8, base), (x1 - 8, base)], fill=INK, width=2)
    text(d, (x1 - 8, y1 - 16), "not a sum: interactions compound", font("sans", 13.5, 700), COPPER_DEEP, anchor="ra")


def phase_formats(d, box, **kw):
    d_compare(
        d, box,
        {"title": "Prefill pool", "tone": BLUE, "soft": BLUE_SOFT, "items": ["wide formats fill tensor cores", "8-bit weights, 8-bit activations", "compute is the scarce resource"], "foot": "W8A8 / FP8"},
        {"title": "Decode pool", "tone": COPPER, "soft": COPPER_SOFT, "items": ["narrow weights cut bytes on the bus", "4-bit, even 2-bit", "bandwidth is the scarce resource"], "foot": "W4 / W2"},
    )


def spec_batch(d, box, **kw):
    bs = [1, 2, 4, 8, 16, 32, 64]
    speed = [(b, 1 + 2.6 / (1 + b / 4)) for b in bs]
    d_curve(
        d, box,
        [{"points": speed, "colour": COPPER, "width": 4}],
        "batch size", "speculative speedup",
        xticks=[1, 2, 4, 8, 16, 32, 64], yticks=[1, 2, 3, 4],
        logx=True, xtick_fmt=lambda t: f"{t:g}",
        markers=[{"x": 1, "y": 3.1, "label": "latency regime", "dx": 10, "dy": -18, "colour": MOSS},
                 {"x": 64, "y": 1.15, "label": "throughput regime", "dx": -12, "dy": -36, "colour": INK}],
    )


def acceptance(d, box, **kw):
    xs = [0, 0.2, 0.4, 0.6, 0.8, 1.0]
    speed = [(x, 1 + 2.8 * x - 0.8) for x in xs]
    d_curve(
        d, box,
        [{"points": [(x, max(0.2, v)) for x, v in speed], "colour": COPPER, "width": 4}],
        "mean accepted length  (tau)", "net speedup",
        xticks=[0, 0.2, 0.4, 0.6, 0.8, 1.0], yticks=[0, 1, 2, 3],
        markers=[{"x": 0.33, "y": 1.0, "label": "break-even", "dx": 10, "dy": -30, "colour": INK}],
    )


def cache_levers(d, box, **kw):
    x0, y0, x1, y1 = box
    text(d, (x0, y0), "bytes = 2 x layers x heads x head_dim x length x batch x element",
         font("mono", 13, 600), INK)
    levers = [
        ("GQA / MLA", "heads", "8 KV heads instead of 32", COPPER, COPPER_SOFT),
        ("quantize the cache", "bytes", "FP16 to INT4 is 4x", MOSS, MOSS_SOFT),
        ("evict or window", "length", "a 4k window halves an 8k cache", BLUE, BLUE_SOFT),
        ("batching", "batch", "32 users means 32 caches", WARN, WARN_SOFT),
    ]
    gap = 16
    top = y0 + 40
    w = (x1 - x0 - gap) / 2
    avail = y1 - top - 34
    h = max(52, min(160, (avail - gap) / 2))
    for i, (label, term, example, colour, soft) in enumerate(levers):
        r, c = divmod(i, 2)
        left = x0 + c * (w + gap)
        tt = top + r * (h + gap)
        rounded(d, (left, tt, left + w, tt + h), radius=9, fill=soft, outline=colour, width=2)
        text(d, (left + 16, tt + 14), label, font("sans", 16, 700), colour)
        text(d, (left + 16, tt + 40), f"moves  {term}", font("mono", 12, 600), INK)
        text(d, (left + 16, tt + h - 26), example, font("sans", 13, 500), MUTED)
    text(d, (x0, top + 2 * (h + gap) + 10), "every pillar pulls one term of the same product",
         font("sans", 13, 600), COPPER_DEEP)


def measure_map(d, box, **kw):
    d_ledger(
        d, box,
        ["metric", "what it measures", "what it hides"],
        [
            ["tokens/s", "aggregate throughput", "one slow user"],
            ["TTFT", "queue + prefill", "decode stalls"],
            ["TPOT", "per-token decode", "first-token wait"],
            ["goodput", "tokens inside SLO", "nothing -- use this"],
        ],
    )


def layered_bottlenecks(d, box, **kw):
    d_ledger(
        d, box,
        ["bottleneck", "caps", "pillars"],
        [
            ["capacity", "users per GPU", "1, 3, 4"],
            ["bandwidth", "tokens per second", "1, 2, 4"],
            ["compute", "prefill and big batches", "2, 4"],
            ["interconnect", "sharding and split", "4"],
        ],
    )


def frontier_trade(d, box, **kw):
    d_compare(
        d, box,
        {"title": "Lossless", "tone": MOSS, "soft": MOSS_SOFT, "items": ["speculation with exact rejection", "FlashAttention", "paging and batching"], "foot": "same distribution"},
        {"title": "Lossy by design", "tone": COPPER, "soft": COPPER_SOFT, "items": ["diffusion LMs", "sampled Jacobi", "aggressive quantization"], "foot": "trades exactness"},
    )


def scope(d, box, **kw):
    d_compare(
        d, box,
        {"title": "In scope", "tone": MOSS, "soft": MOSS_SOFT, "items": ["serving efficiency", "four pillars", "prefill / decode split"], "foot": "this survey"},
        {"title": "Out of scope", "tone": MUTED, "soft": CARD, "items": ["pre-training parallelism", "LoRA and PEFT", "test-time compute"], "foot": "unless a bottleneck moves"},
    )


def method(d, box, **kw):
    d_flow(
        d, box,
        ["name the\nbottleneck", "is the output\nexact?", "what do\nyou pay?"],
        note="the question that unlocks every paper in the survey", vertical=True,
    )


def intensity_bars(d, box, **kw):
    """A log number line: batch-one decode sits two orders below the ridge."""
    x0, y0, x1, y1 = box
    h = y1 - y0
    text(d, (x0, y0), "operations per byte of weight traffic", font("sans", 14, 700), INK)

    lo, hi = 1.0, 1000.0
    ax0, ax1 = x0 + 34, x1 - 34
    ay = y0 + 0.52 * h

    def px(v):
        return ax0 + (math.log10(v) - math.log10(lo)) / (math.log10(hi) - math.log10(lo)) * (ax1 - ax0)

    d.line([(ax0, ay), (ax1, ay)], fill=INK, width=2)
    for tick in (1, 2, 4, 10, 100, 300, 1000):
        tx = px(tick)
        d.line([(tx, ay - 5), (tx, ay + 5)], fill=INK, width=2)
        text(d, (tx, ay + 14), f"{tick:g}", font("mono", 13, 500), MUTED, anchor="ma")

    dots = [
        ("FP16", 1, COPPER, "1 op / byte", 1),
        ("INT8", 2, COPPER, "2", 2),
        ("INT4", 4, MOSS, "4", 3),
    ]
    for label, v, tone, note, level in dots:
        tx = px(v)
        d.ellipse((tx - 7, ay - 7, tx + 7, ay + 7), fill=tone, outline=PAPER, width=2)
        text(d, (tx, ay - 32 - (level - 1) * 26), label, font("sans", 13.5, 700), tone, anchor="ma")

    rx = px(300)
    d.ellipse((rx - 8, ay - 8, rx + 8, ay + 8), fill=CARD, outline=COPPER_DEEP, width=3)
    text(d, (rx, ay - 34), "the ridge", font("sans", 14, 700), COPPER_DEEP, anchor="ma")

    # the gap between decode and the ridge
    gy = ay + 52
    d.line([(px(4) + 10, gy), (rx - 10, gy)], fill=COPPER_DEEP, width=2)
    d.line([(px(4) + 10, gy - 6), (px(4) + 10, gy + 6)], fill=COPPER_DEEP, width=2)
    d.line([(rx - 10, gy - 6), (rx - 10, gy + 6)], fill=COPPER_DEEP, width=2)
    text(d, (((px(4) + rx) / 2), gy + 10), "roughly two orders of magnitude",
         font("sans", 13.5, 600), COPPER_DEEP, anchor="ma")

    text(d, (x0, y1 - 44), "quantization moves the operating point by factors of two.",
         font("sans", 13), MUTED)
    text(d, (x0, y1 - 22), "It cannot close a gap that is measured in hundreds.",
         font("sans", 13, 700), INK)


def latency_timeline(d, box, **kw):
    rows = [
        {"label": "queue", "start": 0, "end": 1.4, "colour": LINE, "text": "wait"},
        {"label": "prefill", "start": 1.4, "end": 3.2, "colour": BLUE, "text": "compute-bound"},
        {"label": "decode", "start": 3.2, "end": 4.4, "colour": COPPER, "text": "t1"},
        {"label": "", "start": 4.4, "end": 5.6, "colour": COPPER, "text": "t2"},
        {"label": "", "start": 5.6, "end": 6.8, "colour": COPPER, "text": "t3"},
        {"label": "", "start": 6.8, "end": 8.0, "colour": COPPER, "text": "t4"},
    ]
    d_timeline(d, box, rows)
    x0, y0, x1, y1 = box
    yq = y0 + (y1 - y0) * 0.10
    arrow(d, (x0 + 118, yq - 26), (x0 + 118 + (x1 - x0 - 134) * (3.2 / 8), yq - 26), MUTED, 1, 6)
    text(d, ((x0 + 118 + x0 + 118 + (x1 - x0 - 134) * 0.4) / 2, yq - 48), "TTFT", font("sans", 13, 700), BLUE, anchor="ma")
    text(d, (x1 - 10, y0 - 4), "TPOT = the gap between decode tokens", font("sans", 13, 600), COPPER_DEEP, anchor="ra")


def goodput_bars(d, box, **kw):
    d_bars(
        d, box,
        [("throughput", 100, LINE), ("inside the SLO", 62, MOSS)],
        unit="k tok/s",
        value_fmt=lambda v: f"{v:g}",
        pad_b=64,
    )
    text(d, ((box[0] + box[2]) / 2, box[3] - 14), "the user-relevant number is the smaller bar", font("sans", 13.5), MUTED, anchor="ma")


def batch_curve(d, box, **kw):
    bs = [1, 2, 4, 8, 16, 32, 64, 128]
    d_curve(
        d, box,
        [{"points": [(b, 100 * b / (b + 8)) for b in bs], "colour": COPPER, "width": 4}],
        "batch size", "tokens / second",
        xticks=[4, 16, 64, 128], yticks=[0, 25, 50, 75, 100],
        markers=[{"x": 8, "y": 50, "label": "half the ceiling", "dx": 12, "dy": -12, "colour": MOSS}],
    )


def kv_heads(d, box, **kw):
    """Query heads fan into fewer key/value heads; the column chart fills the card."""
    x0, y0, x1, y1 = box
    modes = [("MHA", 8, "8 KV heads"), ("GQA", 2, "2 KV heads"),
             ("MQA", 1, "1 KV head"), ("MLA", 1, "1 latent code")]
    text(d, (x0, y0), "query heads stay; key/value heads shrink", font("sans", 14, 700), INK)

    colw = (x1 - x0) / 4
    head_top = y0 + 54
    avail = (y1 - 46) - head_top
    gap = 7
    tile = max(9, min(30, (avail - gap * 7) / 8))
    total_h = tile * 8 + gap * 7
    top = head_top + max(0, (avail - total_h) / 2)

    for i, (name, kv, foot) in enumerate(modes):
        cx = x0 + colw * (i + 0.5)
        text(d, (cx, y0 + 24), name, font("sans", 16, 700), COPPER_DEEP, anchor="ma")
        qx = cx - tile - 16
        kx = cx + 16
        # query head stack
        for q in range(8):
            qy = top + q * (tile + gap)
            d.rounded_rectangle((qx, qy, qx + tile, qy + tile), radius=3,
                                fill=COPPER_SOFT, outline=COPPER, width=1)
        # key/value head stack, centred against the query stack
        kv_h = kv * tile + (kv - 1) * gap
        ktop = top + (total_h - kv_h) / 2
        for k in range(kv):
            ky = ktop + k * (tile + gap)
            d.rounded_rectangle((kx, ky, kx + tile, ky + tile), radius=3,
                                fill=MOSS_SOFT, outline=MOSS, width=1)
        # fan-in lines, one per query head
        per = 8 / kv
        for q in range(8):
            qy = top + q * (tile + gap) + tile / 2
            group = min(kv - 1, int(q / per))
            ky = ktop + group * (tile + gap) + tile / 2
            d.line([(qx + tile + 2, qy), (kx - 2, ky)], fill=LINE, width=1)
        text(d, (cx, top + total_h + 22), foot, font("sans", 12.5, 600), MUTED, anchor="ma")

    text(d, (x0, y1 - 16), "fewer key/value heads means less cache per token", font("sans", 13), MUTED)


def mla(d, box, **kw):
    x0, y0, x1, y1 = box
    text(d, (x0, y0), "multi-head latent attention", font("sans", 15, 700), INK)
    # tokens -> latent c -> K,V, centred in the card
    ty = y0 + ((y1 - y0) - 3 * 52) / 2
    for i in range(3):
        left = x0 + 16
        top = ty + i * 52
        d.rounded_rectangle((left, top, left + 96, top + 34), radius=6, fill=CARD, outline=LINE, width=2)
        text(d, (left + 48, top + 17), f"token {i+1}", font("sans", 12, 600), INK, anchor="mm")
        d.rounded_rectangle((left + 130, top + 4, left + 202, top + 30), radius=6, fill=COPPER_SOFT, outline=COPPER, width=2)
        text(d, (left + 166, top + 17), "latent c", font("mono", 11, 600), COPPER_DEEP, anchor="mm")
        arrow(d, (left + 98, top + 17), (left + 128, top + 17), COPPER, 2, 6)
        d.rounded_rectangle((left + 236, top - 2, left + 292, top + 16), radius=4, fill=MOSS_SOFT, outline=MOSS, width=2)
        text(d, (left + 264, top + 7), "K", font("mono", 10, 700), MOSS, anchor="mm")
        d.rounded_rectangle((left + 236, top + 18, left + 292, top + 36), radius=4, fill=MOSS_SOFT, outline=MOSS, width=2)
        text(d, (left + 264, top + 27), "V", font("mono", 10, 700), MOSS, anchor="mm")
        arrow(d, (left + 204, top + 17), (left + 234, top + 17), COPPER, 2, 6)
    text(d, (x0, y1 - 34), "store one code per token, rebuild K and V at attention time", font("sans", 13), MUTED)
    text(d, (x0, y1 - 14), "the leading factor of two disappears", font("sans", 13, 700), COPPER_DEEP)


def linear_summary(d, box, **kw):
    """Tokens fold into one fixed-size state, which is read in constant time."""
    x0, y0, x1, y1 = box
    h = y1 - y0
    text(d, (x0, y0), "linear attention keeps a summary, not a history", font("sans", 14, 700), INK)

    n = 6
    tw = 62
    gap = ((x1 - x0) - n * tw) / (n - 1)
    top = y0 + 0.20 * h
    for i in range(n):
        left = x0 + i * (tw + gap)
        d.rounded_rectangle((left, top, left + tw, top + tw), radius=8, fill=CARD, outline=LINE, width=2)
        text(d, (left + tw / 2, top + tw / 2), f"x{i + 1}", font("mono", 14, 500), INK, anchor="mm")

    sx, sy = x0 + 0.44 * (x1 - x0), y0 + 0.62 * h
    bw, bh = 150, 104
    for i in range(n):
        left = x0 + i * (tw + gap) + tw / 2
        tx = sx - 44 + (i / (n - 1)) * 88
        arrow(d, (left, top + tw + 8), (tx, sy - bh / 2 - 2), LINE, 1, 5)
    rounded(d, (sx - bw / 2, sy - bh / 2, sx + bw / 2, sy + bh / 2), radius=10, fill=COPPER_SOFT, outline=COPPER, width=2)
    text(d, (sx, sy - 12), "d x d", font("mono", 18, 700), COPPER_DEEP, anchor="mm")
    text(d, (sx, sy + 14), "state", font("sans", 13), COPPER_DEEP, anchor="mm")

    arrow(d, (sx + bw / 2 + 8, sy), (x1 - 54, sy), COPPER, 2, 8)
    text(d, (x1 - 48, sy), "read", font("sans", 13, 600), COPPER_DEEP, anchor="lm")

    text(d, (x0, y1 - 54), "update cost is independent of sequence length", font("sans", 13), MUTED)
    text(d, (x0, y1 - 32), "but one summary cannot point at an arbitrary past token", font("sans", 13, 700), COPPER_DEEP)


def mamba(d, box, **kw):
    x0, y0, x1, y1 = box
    h = y1 - y0
    w = x1 - x0
    text(d, (x0, y0), "a selective state-space layer", font("sans", 14, 700), INK)

    bw = 0.20 * w
    gap = (w - 4 * bw) / 3
    top = y0 + 0.26 * h
    bh = min(0.30 * h, 130)
    boxes = [
        ("x_t", "token", CARD, LINE),
        ("selective\ngate", "input-dependent", COPPER_SOFT, COPPER),
        ("state\nh_t", "fixed size", MOSS_SOFT, MOSS),
        ("y_t", "output", CARD, LINE),
    ]
    centers = []
    for i, (label, note, fill, outline) in enumerate(boxes):
        left = x0 + i * (bw + gap)
        centers.append(left + bw / 2)
        rounded(d, (left, top, left + bw, top + bh), radius=10, fill=fill, outline=outline, width=2)
        lines = label.split("\n")
        ty = top + bh / 2 - 16 - (len(lines) - 1) * 11
        for line in lines:
            text(d, (left + bw / 2, ty), line, font("sans", 15, 700), INK, anchor="mm")
            ty += 22
        text(d, (left + bw / 2, top + bh / 2 + 24), note, font("sans", 11.5), MUTED, anchor="mm")
        if i < 3:
            arrow(d, (left + bw + 4, top + bh / 2), (left + bw + gap - 4, top + bh / 2), COPPER, 2, 8)

    # recurrence loop from state back into the gate
    sx0, sx1 = centers[2] - bw / 2, centers[2] + bw / 2
    d.arc((sx0, top - 34, sx1, top + bh), 200, 340, fill=MOSS, width=2)
    text(d, (centers[2], top - 54), "carry the state forward", font("sans", 11.5, 600), MOSS, anchor="ma")

    fy = top + bh + 0.12 * h
    text(d, (x0, fy), "h_t  =  A(x_t) h_(t-1)  +  B(x_t) x_t", font("mono", 15, 600), INK)
    text(d, (x0, fy + 26), "the transition itself depends on the current token", font("sans", 12.5), MUTED)

    text(d, (x0, y1 - 44), "state size is fixed, so decode is constant time per step", font("sans", 13), MUTED)
    text(d, (x0, y1 - 22), "no growing cache, but no lossless history either", font("sans", 13, 700), COPPER_DEEP)


def diffusion(d, box, **kw):
    x0, y0, x1, y1 = box
    text(d, (x0, y0), "diffusion denoises a whole block at once", font("sans", 14, 700), INK)
    steps = 4
    cols = 8
    cw = (x1 - x0 - 40) / cols
    for s in range(steps):
        top = y0 + 42 + s * ((y1 - y0 - 90) / steps)
        text(d, (x0, top + 18), f"step {s+1}", font("mono", 11, 500), MUTED)
        for c in range(cols):
            left = x0 + 50 + c * cw
            hidden = (c + s * 3) % 5 != 0 and s < steps - 1
            fill = SAND if hidden else CARD
            d.rounded_rectangle((left, top, left + cw - 6, top + 30), radius=4, fill=fill, outline=LINE, width=1)
            if not hidden:
                text(d, (left + (cw - 6) / 2, top + 15), "tok", font("mono", 9, 500), INK, anchor="mm")
    text(d, (x0, y1 - 30), "parallel, but it assumes positions are independent", font("sans", 13), MUTED)
    text(d, (x0, y1 - 10), "long reasoning drifts -- the method is lossy", font("sans", 13, 700), COPPER_DEEP)


def decoder_trade(d, box, **kw):
    d_compare(
        d, box,
        {"title": "Exact", "tone": MOSS, "soft": MOSS_SOFT, "items": ["speculation with rejection sampling", "Layer Skip: draft, then verify", "greedy Jacobi can converge"], "foot": "same distribution"},
        {"title": "Approximate", "tone": COPPER, "soft": COPPER_SOFT, "items": ["diffusion language models", "sampled Jacobi", "skeleton-of-thought"], "foot": "buys parallelism"},
    )


def weight_methods(d, box, **kw):
    d_ledger(
        d, box,
        ["method", "idea", "cost"],
        [
            ["GPTQ", "second-order error fix", "calibration set"],
            ["AWQ", "protect salient channels", "activation stats"],
            ["QuIP", "rotate outliers away", "extra rotation"],
            ["BitNet", "train a tiny alphabet", "training from scratch"],
        ],
    )


def smoothquant(d, box, **kw):
    """One outlier channel, before and after the rescale."""
    x0, y0, x1, y1 = box
    h = y1 - y0
    text(d, (x0, y0), "one outlier channel, moved from activations into weights",
         font("sans", 14, 700), INK)

    n = 8
    bx0 = x0 + 118
    slot = (x1 - bx0 - 46) / n
    bw = slot * 0.52
    max_h = min(0.24 * h, 120)
    rows = [
        (y0 + 0.16 * h, "activations", [0.22, 0.26, 0.2, 1.0, 0.24, 0.3, 0.2, 0.24], COPPER, COPPER_SOFT),
        (y0 + 0.50 * h, "weights", [0.34, 0.38, 0.3, 0.62, 0.36, 0.42, 0.3, 0.36], MOSS, MOSS_SOFT),
    ]
    for base_top, label, vals, tone, soft in rows:
        base = base_top + max_h
        text(d, (x0, base - 8), label, font("sans", 13, 700), tone)
        for i, v in enumerate(vals):
            cx = bx0 + slot * (i + 0.5)
            out = v == max(vals)
            d.rectangle((cx - bw / 2, base - v * max_h, cx + bw / 2, base),
                        fill=tone if out else soft)
        d.line([(bx0 - 6, base), (x1 - 34, base)], fill=INK, width=2)
        text(d, (x1 - 34, base + 10), "channels", font("sans", 11.5), MUTED, anchor="ra")

    # the rescale arrow between the two rows
    ax = (bx0 + x1 - 46) / 2
    ay0 = rows[0][0] + max_h + 20
    ay1 = rows[1][0] - 26
    arrow(d, (ax, ay0), (ax, ay1), COPPER, 2, 8)
    text(d, (ax + 12, (ay0 + ay1) / 2), "rescale", font("sans", 12.5, 700), COPPER_DEEP, anchor="lm")

    text(d, (x0, y1 - 44), "the activation outlier is absorbed into the weights, where calibration sees it",
         font("sans", 13), MUTED)
    text(d, (x0, y1 - 22), "4-bit weights with 8-bit activations become practical", font("sans", 13, 700), INK)


def radix(d, box, **kw):
    x0, y0, x1, y1 = box
    d_tree(d, box, "shared prefix tree", ["system prompt", "few-shot block", "chat history"],
           [["reused by every request"], ["cached once"], ["forked per turn"]])


def layout(d, box, **kw):
    """Each lever alone is simple; together they need a new memory layout."""
    x0, y0, x1, y1 = box
    w, h = x1 - x0, y1 - y0
    text(d, (x0, y0), "the cache grows dense when every lever fires at once", font("sans", 14, 700), INK)

    groups = [("GQA", COPPER_SOFT, COPPER), ("spec tree", WARN_SOFT, WARN),
              ("INT4", MOSS_SOFT, MOSS), ("pages", BLUE_SOFT, BLUE)]
    gap = 26
    bw = (w - 3 * gap) / 4
    bh = min(0.40 * h, 220)
    top = y0 + 0.16 * h
    for i, (label, fill, outline) in enumerate(groups):
        left = x0 + i * (bw + gap)
        d.rounded_rectangle((left, top, left + bw, top + bh), radius=10, fill=fill, outline=outline, width=2)
        text(d, (left + bw / 2, top + 18), label, font("sans", 15, 700), INK, anchor="ma")
        cell = min(22, (bw - 48) / 5)
        gx = left + (bw - (3 * cell + 2 * 8)) / 2
        gy = top + 46
        for r in range(3):
            for c in range(3):
                d.rectangle((gx + c * (cell + 8), gy + r * (cell + 8),
                             gx + c * (cell + 8) + cell, gy + r * (cell + 8) + cell),
                            fill=outline)
        if i < 3:
            arrow(d, (left + bw + 5, top + bh / 2), (left + bw + gap - 5, top + bh / 2), COPPER, 2, 7)

    text(d, (x0, y1 - 46), "a new combination of bit width, head sharing, and page size",
         font("sans", 13), MUTED)
    text(d, (x0, y1 - 24), "usually wants a new kernel -- that is the friction", font("sans", 13, 700), COPPER_DEEP)


def spec_machine(d, box, **kw):
    """Three machines on the inference path, plus the ratio that has to follow."""
    x0, y0, x1, y1 = box
    w, h = x1 - x0, y1 - y0
    text(d, (x0, y0), "verification moves decode toward compute", font("sans", 14, 700), INK)

    top = y0 + 0.16 * h
    bh = min(0.30 * h, 130)
    bw = 0.26 * w
    xs = [x0 + 0.02 * w, x0 + 0.37 * w, x0 + 0.72 * w]
    boxes = [
        ("prefill", "compute nodes", BLUE_SOFT, BLUE),
        ("decode", "verifies trees", COPPER_SOFT, COPPER),
        ("link", "new bottleneck", WARN_SOFT, WARN),
    ]
    for i, (label, sub, fill, outline) in enumerate(boxes):
        left = xs[i]
        rounded(d, (left, top, left + bw, top + bh), radius=10, fill=fill, outline=outline, width=2)
        text(d, (left + bw / 2, top + 26), label, font("sans", 16, 700), INK, anchor="ma")
        text(d, (left + bw / 2, top + 50), sub, font("sans", 12.5), MUTED, anchor="ma")
        if i < 2:
            arrow(d, (left + bw + 6, top + bh / 2), (xs[i + 1] - 6, top + bh / 2), COPPER, 2, 8)

    # the ratio sits under decode and feeds it
    ry = top + bh + 0.14 * h
    rw = bw * 1.0
    rleft = xs[1] + (bw - rw) / 2
    rh = min(0.20 * h, 90)
    rounded(d, (rleft, ry, rleft + rw, ry + rh), radius=10, fill=MOSS_SOFT, outline=MOSS, width=2)
    text(d, (rleft + rw / 2, ry + 22), "ratio", font("sans", 15, 700), INK, anchor="ma")
    text(d, (rleft + rw / 2, ry + 44), "moves toward compute", font("sans", 12.5), MUTED, anchor="ma")
    arrow(d, (xs[1] + bw / 2, ry - 4), (xs[1] + bw / 2, top + bh + 4), MOSS, 2, 8)

    text(d, (x0, y1 - 20), "speculation shifts the cluster mix; the interconnect has to keep up",
         font("sans", 13), MUTED)


def error_budget(d, box, **kw):
    d_compare(
        d, box,
        {"title": "Memory", "tone": MOSS, "soft": MOSS_SOFT, "items": ["savings multiply", "4x bits x 4x sparsity", "capacity adds up cleanly"], "foot": "predictable"},
        {"title": "Quality", "tone": COPPER, "soft": COPPER_SOFT, "items": ["errors interact", "each stage recalibrates", "no sum-of-parts bound"], "foot": "still open"},
    )


def kv_workload(d, box, **kw):
    d_bars(
        d, box,
        [("1 x 4k", 512, COPPER), ("8 x 4k", 4096, COPPER), ("32 x 4k", 16384, COPPER_DEEP)],
        unit=" MB",
        value_fmt=lambda v: f"{v:g}",
        pad_b=64,
    )
    text(d, ((box[0] + box[2]) / 2, box[3] - 14), "32 layers, 8 KV heads, 128-dim heads, FP16", font("sans", 13.5), MUTED, anchor="ma")


def attention_mask(d, box, **kw):
    x0, y0, x1, y1 = box
    text(d, (x0, y0), "causal attention, one new query per step", font("sans", 14, 700), INK)
    size = min(x1 - x0 - 80, y1 - y0 - 80)
    left = x0 + 30
    top = y0 + 48
    n = 6
    cell = size / n
    for r in range(n):
        for c in range(n):
            seen = c <= r
            fill = (COPPER_SOFT if r < n - 1 else COPPER) if seen else CARD
            d.rectangle((left + c * cell, top + r * cell, left + (c + 1) * cell - 2, top + (r + 1) * cell - 2), fill=fill, outline=LINE, width=1)
    text(d, (left + size / 2, top - 18), "keys already in the cache", font("sans", 12, 600), MUTED, anchor="ma")
    text(d, (left - 10, top + size / 2), "queries", font("sans", 12, 600), MUTED, anchor="rm")
    text(d, (left + size + 12, top + size - cell / 2), "new row", font("sans", 12, 700), COPPER_DEEP, anchor="lm")
    text(d, (x0, y1 - 14), "only the last row is computed; every older key is reused", font("sans", 13), MUTED)


def cache_timeline(d, box, **kw):
    x0, y0, x1, y1 = box
    h = y1 - y0
    text(d, (x0, y0), "prefill writes the prompt; decode appends one pair", font("sans", 14, 700), INK)
    top = y0 + 0.16 * h
    cellw = 34
    step = min(0.20 * h, 96)
    ch = min(34, step * 0.46)
    for r in range(4):
        yy = top + r * step
        if r == 0:
            for c in range(8):
                d.rounded_rectangle((x0 + 110 + c * cellw, yy, x0 + 110 + c * cellw + cellw - 4, yy + ch),
                                    radius=3, fill=BLUE_SOFT, outline=BLUE)
            text(d, (x0, yy + ch / 2), "prefill", font("sans", 13, 700), BLUE, anchor="lm")
            text(d, (x0 + 110 + 8 * cellw + 10, yy + ch / 2), "8 pairs in one pass", font("sans", 12), MUTED, anchor="lm")
        else:
            for c in range(8 + r - 1):
                fill = MOSS_SOFT if c < 7 + r else COPPER_SOFT
                outline = MOSS if c < 7 + r else COPPER
                d.rounded_rectangle((x0 + 110 + c * cellw, yy, x0 + 110 + c * cellw + cellw - 4, yy + ch),
                                    radius=3, fill=fill, outline=outline)
            text(d, (x0, yy + ch / 2), f"decode {r}", font("sans", 13, 700), COPPER, anchor="lm")
            text(d, (x0 + 110 + (7 + r) * cellw + 6, yy + ch / 2), "+1", font("sans", 12, 700), COPPER_DEEP, anchor="lm")
    text(d, (x0, y1 - 42), "the prompt is compute bound; each append is bandwidth bound", font("sans", 13), MUTED)
    text(d, (x0, y1 - 20), "production interleaves them with chunked prefill", font("sans", 13, 600), INK)


def window(d, box, **kw):
    x0, y0, x1, y1 = box
    h = y1 - y0
    text(d, (x0, y0), "a sliding window drops the oldest tokens", font("sans", 14, 700), INK)
    n = 14
    cut = 6
    cw = (x1 - x0 - 20) / n
    ch = min(0.30 * h, 120)
    top = y0 + 0.20 * h
    for i in range(n):
        left = x0 + 10 + i * cw
        keep = i >= cut
        d.rounded_rectangle((left, top, left + cw - 5, top + ch), radius=5,
                            fill=(COPPER_SOFT if keep else SAND),
                            outline=(COPPER if keep else LINE), width=2)
        if not keep:
            text(d, (left + (cw - 5) / 2, top + ch / 2), "x", font("mono", 14, 500), MUTED, anchor="mm")
        else:
            text(d, (left + (cw - 5) / 2, top + ch / 2), f"t{8 - (n - 1 - i)}",
                 font("mono", 12, 600), COPPER_DEEP, anchor="mm")
    # cutoff marker
    bx = x0 + 10 + cut * cw
    d.line([(bx, top - 16), (bx, top + ch + 16)], fill=COPPER_DEEP, width=2)
    text(d, (bx + 8, top - 22), "window start", font("sans", 12.5, 700), COPPER_DEEP, anchor="la")
    text(d, (x0 + 10, top + ch + 22), "evicted, not recoverable", font("sans", 12.5, 600), MUTED)
    text(d, (bx + 8, top + ch + 22), "retained in the cache", font("sans", 12.5, 600), COPPER_DEEP, anchor="la")

    text(d, (x0, y1 - 44), "the cache stops growing past the window", font("sans", 13), MUTED)
    text(d, (x0, y1 - 24), "the model can no longer point at a fact that scrolled out", font("sans", 13, 700), COPPER_DEEP)
    text(d, (x0, y1 - 4), "eviction is a recall decision, not a memory trick", font("sans", 13, 700), INK)


def draft_sources(d, box, **kw):
    d_ledger(
        d, box,
        ["drafter", "where it comes from", "when it wins"],
        [
            ["small model", "separate checkpoint", "easy text"],
            ["Medusa", "extra heads on the target", "general chat"],
            ["EAGLE", "target features, not tokens", "high acceptance"],
            ["prompt lookup", "the input itself", "code edits, RAG"],
        ],
    )


def early_exit(d, box, **kw):
    x0, y0, x1, y1 = box
    w, h = x1 - x0, y1 - y0
    text(d, (x0, y0), "leave early, then verify with the full model", font("sans", 15, 700), INK)

    n = 6
    gap = 10
    lw = (w - gap * (n - 1)) / n
    top = y0 + 0.18 * h
    lh = min(64, 0.13 * h)
    for i in range(n):
        left = x0 + i * (lw + gap)
        early = i < 3
        d.rounded_rectangle((left, top, left + lw, top + lh), radius=7,
                            fill=COPPER_SOFT if early else CARD,
                            outline=COPPER if early else LINE, width=2)
        text(d, (left + lw / 2, top + lh / 2), f"L{i + 1}", font("mono", 14, 600), INK, anchor="mm")
    text(d, (x0, top + lh + 10), "confident after layer 3", font("sans", 12.5, 600), COPPER_DEEP)

    # the pipeline underneath
    flow_top = top + lh + 0.20 * h
    bw = (w - 2 * 34) / 3
    bh = min(96, 0.24 * h)
    boxes = [
        ("draft", "one token early", COPPER_SOFT, COPPER),
        ("verify", "full model, one pass", MOSS_SOFT, MOSS),
        ("output", "target distribution", CARD, LINE),
    ]
    for i, (label, note, fill, outline) in enumerate(boxes):
        left = x0 + i * (bw + 34)
        rounded(d, (left, flow_top, left + bw, flow_top + bh), radius=9, fill=fill, outline=outline, width=2)
        text(d, (left + bw / 2, flow_top + 22), label, font("sans", 13, 700), INK, anchor="ma")
        text(d, (left + bw / 2, flow_top + 44), note, font("sans", 12), MUTED, anchor="ma")
        if i < 2:
            arrow(d, (left + bw + 6, flow_top + bh / 2), (left + bw + 28, flow_top + bh / 2), COPPER, 2, 7)

    text(d, (x0, y1 - 42), "Layer Skip uses the early exit as the drafter and the full model as the verifier",
         font("sans", 12.5), MUTED)
    text(d, (x0, y1 - 20), "the combination is lossless again", font("sans", 13, 700), MOSS)


def hbm_bars(d, box, **kw):
    d_bars(
        d, box,
        [("naive softmax", 100, COPPER), ("FlashAttention", 28, MOSS)],
        unit="% traffic",
        value_fmt=lambda v: f"{v:g}",
        pad_b=64,
    )
    text(d, ((box[0] + box[2]) / 2, box[3] - 14), "same math; the attention matrix never reaches HBM", font("sans", 13.5), MUTED, anchor="ma")


def slo_curve(d, box, **kw):
    xs = [0, 20, 40, 60, 80, 100, 120, 140]
    d_curve(
        d, box,
        [
            {"points": [(x, min(100, 4 + x * 0.9)) for x in xs], "colour": COPPER, "width": 4},
            {"points": [(100, 0), (100, 100)], "colour": COPPER_DEEP, "width": 2, "dashed": True},
        ],
        "latency per token  (ms)", "requests served  (%)",
        xticks=[0, 40, 80, 120, 140], yticks=[0, 25, 50, 75, 100],
    )
    # place the SLO label just right of its line, inside the axes
    x0, y0, x1, y1 = box
    ax0, ax1 = x0 + 62, x1 - 22
    ay0 = y0 + 34
    px = ax0 + (100 / 140) * (ax1 - ax0)
    text(d, (px - 8, ay0 + 10), "SLO 100 ms", font("sans", 12.5, 700), COPPER_DEEP, anchor="ra")
    text(d, (px + 10, y1 - 56), "tail beyond the SLO", font("sans", 12.5), MUTED)


def stack_compare(d, box, **kw):
    d_ledger(
        d, box,
        ["stack", "scheduler", "distinctive"],
        [
            ["vLLM", "paged + continuous", "PagedAttention"],
            ["SGLang", "radix prefix cache", "RadixAttention"],
            ["TensorRT-LLM", "in-flight batching", "kernel fusion"],
            ["DeepSpeed", "split prefill/decode", "disaggregation"],
        ],
    )


def additive(d, box, **kw):
    d_bars(
        d, box,
        [("baseline", 100, LINE), ("GQA", 25, COPPER), ("+ INT4 KV", 6, MOSS), ("+ paging", 5, BLUE)],
        unit="%",
        value_fmt=lambda v: f"{v:g}",
        pad_b=64,
    )
    text(d, ((box[0] + box[2]) / 2, box[3] - 14), "share of the baseline cache; each lever multiplies", font("sans", 13.5), MUTED, anchor="ma")


def family_map(d, box, **kw):
    d_ledger(
        d, box,
        ["family", "state per token", "recall"],
        [
            ["softmax attention", "K and V per layer", "lossless"],
            ["linear attention", "d x d matrix", "bounded"],
            ["Mamba / SSM", "fixed h", "bounded"],
            ["hybrid", "attention layers only", "near-lossless"],
        ],
    )


def recall_gap(d, box, **kw):
    xs = [1, 2, 4, 8, 16, 32, 64, 128]
    d_curve(
        d, box,
        [
            {"points": [(x, 100) for x in xs], "colour": MOSS, "width": 4},
            {"points": [(x, 96 - 30 * math.log(x) / math.log(128)) for x in xs], "colour": WARN, "width": 4},
            {"points": [(x, 90 - 52 * math.log(x) / math.log(128)) for x in xs], "colour": COPPER, "width": 4},
        ],
        "context length", "recall on a buried fact",
        xticks=[1, 4, 16, 64, 128], yticks=[20, 40, 60, 80, 100],
        logx=True, xtick_fmt=lambda t: f"{t:g}",
    )
    legend(d, (box[2] - 16, box[1] + 2), [("softmax", MOSS), ("hybrid", WARN), ("fixed state", COPPER)], anchor="ra")


def realign(d, box, **kw):
    d_flow(
        d, box,
        ["draft drifts\nfrom target", "acceptance\nfalls", "verify becomes\npure waste", "realign offline\nor in batches"],
        note="a principled per-request realignment is still open",
    )


def open_questions(d, box, **kw):
    x0, y0, x1, y1 = box
    h = y1 - y0
    items = [
        ("Recall", "bound memory without losing non-local facts", COPPER_SOFT, COPPER),
        ("Exactness", "keep drafts aligned at every request", WARN_SOFT, WARN),
        ("Composition", "predict error when techniques stack", MOSS_SOFT, MOSS),
    ]
    gap = 16
    w = (x1 - x0 - 2 * gap) / 3
    ch = min(0.52 * h, 210)
    top = y0 + (h - ch) / 2
    for i, (label, note, fill, outline) in enumerate(items):
        left = x0 + i * (w + gap)
        rounded(d, (left, top, left + w, top + ch), radius=10, fill=fill, outline=outline, width=2)
        text(d, (left + w / 2, top + 26), f"0{i + 1}", font("mono", 13, 700), outline, anchor="ma")
        text(d, (left + w / 2, top + 56), label, font("serif", 25, 650), INK, anchor="ma")
        d.line([(left + w / 2 - 16, top + 92), (left + w / 2 + 16, top + 92)], fill=outline, width=2)
        ty = top + 110
        for line in wrap(d, note, font("sans", 13, 500), int(w - 28)):
            text(d, (left + w / 2, ty), line, font("sans", 13, 500), INK, anchor="ma")
            ty += 18


def stack(d, box, layers):
    d_stack(d, box, layers)


def formula(d, box, expr, caption=None):
    d_formula(d, box, expr, caption)


def tree(d, box, root, children, grandchildren=None):
    d_tree(d, box, root, children, grandchildren)


def ledger(d, box, columns, rows):
    d_ledger(d, box, columns, rows)


DRAW = {

    "cost_curve": cost_curve,
    "prefill_decode": prefill_decode,
    "cache_hub": cache_hub,
    "roofline": roofline,
    "bytes_bars": bytes_bars,
    "system_flow": system_flow,
    "spec_timeline": spec_timeline,
    "spec_tree": spec_tree,
    "quant_grid": quant_grid,
    "kivi": kivi,
    "two_four": two_four,
    "flash_tiles": flash_tiles,
    "paging": paging,
    "batching": batching,
    "disaggregate": disaggregate,
    "hybrid": hybrid,
    "moe": moe,
    "recall_curve": recall_curve,
    "cache_growth": cache_growth,
    "frontier": frontier,
    "quant_matrix": quant_matrix,
    "compression_stack": compression_stack,
    "phase_formats": phase_formats,
    "spec_batch": spec_batch,
    "acceptance": acceptance,
    "cache_levers": cache_levers,
    "measure_map": measure_map,
    "layered_bottlenecks": layered_bottlenecks,
    "frontier_trade": frontier_trade,
    "scope": scope,
    "method": method,
    "intensity_bars": intensity_bars,
    "latency_timeline": latency_timeline,
    "goodput_bars": goodput_bars,
    "batch_curve": batch_curve,
    "kv_heads": kv_heads,
    "mla": mla,
    "linear_summary": linear_summary,
    "mamba": mamba,
    "diffusion": diffusion,
    "decoder_trade": decoder_trade,
    "weight_methods": weight_methods,
    "smoothquant": smoothquant,
    "radix": radix,
    "layout": layout,
    "spec_machine": spec_machine,
    "error_budget": error_budget,
    "kv_workload": kv_workload,
    "attention_mask": attention_mask,
    "cache_timeline": cache_timeline,
    "window": window,
    "draft_sources": draft_sources,
    "early_exit": early_exit,
    "hbm_bars": hbm_bars,
    "slo_curve": slo_curve,
    "stack_compare": stack_compare,
    "additive": additive,
    "family_map": family_map,
    "recall_gap": recall_gap,
    "realign": realign,
    "open_questions": open_questions,
    "stack": stack,
    "formula": formula,
    "tree": tree,
    "ledger": ledger,
}


CAPTIONS = {
    "cost_curve": "Training is a step paid once. Inference is a line whose slope is your query volume.",
    "prefill_decode": "One GPU, two workloads with opposite appetites: tensor cores for prefill, bandwidth for decode.",
    "cache_hub": "Every pillar in the survey touches the same object from a different side.",
    "roofline": "Below the bend, bytes set the speed. Above it, arithmetic does. Decode lives far to the left.",
    "bytes_bars": "Precision is the most direct lever on decode traffic: half the bits, half the bytes.",
    "system_flow": "The systems pillar is a chain of waste removals, each one output-preserving.",
    "spec_timeline": "The draft runs ahead cheaply; one target pass validates the whole run at once.",
    "spec_tree": "Alternatives are verified together, so a branch that fails does not sink the whole draft.",
    "quant_grid": "Two outliers stretch the range; ten ordinary weights pay for it.",
    "kivi": "Keys and values have different outlier geometry, so they need different quantization axes.",
    "two_four": "Hardware only accelerates sparsity it can see: exactly two live weights in every group of four.",
    "flash_tiles": "Tiles are streamed through SRAM and discarded; only the output goes back to HBM.",
    "paging": "Reservation wastes the gap between the maximum and the actual length; pages close it.",
    "batching": "A free slot at a step boundary is throughput the scheduler would otherwise lose.",
    "disaggregate": "Prefill and decode stop competing for the same silicon, at the cost of moving the cache.",
    "hybrid": "Attention layers restore recall, and with them a cache that grows again.",
    "moe": "The router decides which parameters a token touches; memory still holds every expert.",
    "recall_curve": "More state buys more recall, but the curve never reaches what full attention gets.",
    "cache_growth": "The cache is linear in length; a fixed state is flat, and a hybrid sits between them.",
    "frontier": "Every architecture family is a point on the same recall-versus-memory plane.",
    "quant_matrix": "Weights, activations, and cache are three separate budgets, often spent differently.",
    "compression_stack": "Each stage is tuned on its input model, so the errors do not simply add.",
    "phase_formats": "A split topology is what lets each phase use the numeric format it actually wants.",
    "spec_batch": "The win is largest exactly where latency matters most, and it fades as the batch grows.",
    "acceptance": "Below break-even, the verifier costs more than the tokens it accepts.",
    "cache_levers": "Six factors, and a different pillar reaches for each one.",
    "measure_map": "Every aggregate metric hides a distribution; pick the one that matches the claim.",
    "layered_bottlenecks": "Capacity, bandwidth, compute, interconnect: each ceiling belongs to a different set of pillars.",
    "frontier_trade": "Exactness is a design choice, not a quality label.",
    "scope": "The survey follows the physical bottleneck and ignores everything that does not move it.",
    "method": "Three questions turn a paper into a position on the map.",
    "intensity_bars": "Decode sits two orders of magnitude below the ridge; quantization moves it by factors of two.",
    "latency_timeline": "TTFT and TPOT measure different halves of the same request.",
    "goodput_bars": "The gap between throughput and goodput is the traffic that missed its deadline.",
    "batch_curve": "Throughput approaches the compute roof, but the cache grows with every extra request.",
    "kv_heads": "Query heads stay fixed; the number of key and value heads is the memory dial.",
    "mla": "One latent code per token replaces a full key and value pair at every layer.",
    "linear_summary": "A fixed-size summary updates in constant time and forgets everything it cannot hold.",
    "mamba": "The state is selective: the input decides what the recurrence keeps.",
    "diffusion": "Many positions are denoised at once, under an independence assumption that can drift.",
    "decoder_trade": "Exact methods preserve the distribution; approximate methods buy parallelism.",
    "weight_methods": "Each weight-only method targets a different source of quantization error.",
    "smoothquant": "Move the outlier from the activation into the weight, where calibration can absorb it.",
    "radix": "Shared prefixes are cached once and forked, instead of being prefilled per request.",
    "layout": "Each lever is simple alone; together they create a layout that wants its own kernel.",
    "spec_machine": "Verification shifts decode toward compute, so the cluster ratio has to move with it.",
    "error_budget": "Memory savings compose cleanly; quality loss does not.",
    "kv_workload": "The cache scales with users, not with model size: batching is what makes it expensive.",
    "attention_mask": "The lower triangle is history; the last row is the only thing computed at each step.",
    "cache_timeline": "Prefill fills the cache in one pass; decode appends a single pair per step.",
    "window": "A window is a hard cap on the length term, paid for with everything that scrolls out.",
    "draft_sources": "Where the draft comes from decides when speculation pays.",
    "early_exit": "A confident early exit becomes a draft; the full model turns it back into an exact answer.",
    "hbm_bars": "The attention matrix is the traffic; keeping it on chip removes most of the cost.",
    "slo_curve": "A latency target cuts the distribution: only the part to the left of the line counts.",
    "stack_compare": "The primitives have converged; the differences now live in scheduling and kernels.",
    "additive": "Independent levers multiply, which is why the combined cache is so much smaller than any single win.",
    "family_map": "The families differ mainly in what they keep per token, and that decides their recall.",
    "recall_gap": "The longer the context, the wider the gap between a fixed state and a full history.",
    "realign": "Drift is the failure mode, and per-request realignment is the missing fix.",
    "open_questions": "Three tradeoffs the field has not closed, each cutting across all four pillars.",
    "stack": "The taxonomy is by insertion point, not by paper topic.",
    "formula": "Learn the formula once and every technique becomes a lever on one term.",
    "tree": "Everything in the pillar is a variation on one trade: memory for recall.",
    "ledger": "Four pillars, four different terms of the same product. Name the term and the paper has a place.",
}
