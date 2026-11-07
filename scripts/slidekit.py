"""Slide rendering kit for the Ridge narrated lectures.

Brand-matched typography and programmatic diagrams. Every diagram is drawn with
Pillow primitives so the whole deck can be rebuilt from source with no external
art assets.
"""

from __future__ import annotations

import math
from pathlib import Path
from typing import Iterable, Sequence

from PIL import Image, ImageDraw, ImageFont

FONT_DIR = Path(__file__).resolve().parent / "fonts"
FRAUNCES = FONT_DIR / "Fraunces.ttf"
FIGTREE = FONT_DIR / "Figtree.ttf"
PLEX = FONT_DIR / "IBMPlexMono-Regular.ttf"
PLEX_B = FONT_DIR / "IBMPlexMono-SemiBold.ttf"

PAPER = (243, 239, 230)
CARD = (255, 253, 248)
INK = (28, 25, 21)
MUTED = (109, 101, 92)
LINE = (219, 210, 196)
COPPER = (196, 81, 26)
COPPER_DEEP = (141, 52, 16)
COPPER_SOFT = (247, 227, 213)
MOSS = (31, 107, 86)
MOSS_SOFT = (226, 240, 234)
SAND = (233, 220, 196)
BLUE = (54, 102, 158)
BLUE_SOFT = (222, 232, 243)
WARN = (176, 122, 22)
WARN_SOFT = (248, 239, 216)

W, H = 1280, 720

_font_cache: dict[tuple[str, int, int], ImageFont.FreeTypeFont] = {}


def font(kind: str, size: int, weight: int | None = None) -> ImageFont.FreeTypeFont:
    key = (kind, size, weight or 0)
    if key in _font_cache:
        return _font_cache[key]
    if kind == "serif":
        f = ImageFont.truetype(str(FRAUNCES), size)
        f.set_variation_by_axes([72, weight or 600, 0, 0])
    elif kind == "sans":
        f = ImageFont.truetype(str(FIGTREE), size)
        f.set_variation_by_axes([weight or 400])
    elif kind == "mono":
        f = ImageFont.truetype(str(PLEX_B if (weight or 400) >= 600 else PLEX), size)
    else:
        raise ValueError(kind)
    _font_cache[key] = f
    return f


def text(d: ImageDraw.ImageDraw, xy, s, f, fill=INK, anchor="la", **kw):
    d.text(xy, s, font=f, fill=fill, anchor=anchor, **kw)


def wrap(d: ImageDraw.ImageDraw, s: str, f, width: int) -> list[str]:
    lines, cur = [], ""
    for word in s.split():
        trial = word if not cur else cur + " " + word
        if d.textlength(trial, font=f) <= width:
            cur = trial
        else:
            if cur:
                lines.append(cur)
            cur = word
    if cur:
        lines.append(cur)
    return lines


def spaced(d: ImageDraw.ImageDraw, xy, s, f, fill, tracking=1.6, anchor="la"):
    """Letter-spaced uppercase label, the site's kicker style."""
    x, y = xy
    for ch in s:
        d.text((x, y), ch, font=f, fill=fill, anchor=anchor)
        x += d.textlength(ch, font=f) + tracking


def spaced_width(d: ImageDraw.ImageDraw, s, f, tracking=1.6) -> float:
    return sum(d.textlength(ch, font=f) + tracking for ch in s) - tracking


def arrow(d, p0, p1, fill=INK, width=2, head=9, dashed=False):
    x0, y0 = p0
    x1, y1 = p1
    ang = math.atan2(y1 - y0, x1 - x0)
    if dashed:
        total = math.hypot(x1 - x0, y1 - y0)
        step, on = 10, 6
        t = 0.0
        while t < total - head:
            a = (x0 + math.cos(ang) * t, y0 + math.sin(ang) * t)
            b = (x0 + math.cos(ang) * min(t + on, total - head), y0 + math.sin(ang) * min(t + on, total - head))
            d.line([a, b], fill=fill, width=width)
            t += step
    else:
        d.line([p0, (x1 - math.cos(ang) * head * 0.8, y1 - math.sin(ang) * head * 0.8)], fill=fill, width=width)
    left = ang + math.pi * 0.82
    right = ang - math.pi * 0.82
    d.polygon(
        [
            (x1, y1),
            (x1 + math.cos(left) * head, y1 + math.sin(left) * head),
            (x1 + math.cos(right) * head, y1 + math.sin(right) * head),
        ],
        fill=fill,
    )


def rounded(d, xy, radius=14, fill=CARD, outline=LINE, width=2):
    d.rounded_rectangle(xy, radius=radius, fill=fill, outline=outline, width=width)


def chip(d, xy, s, f, fill=INK, bg=COPPER_SOFT, padx=10, pady=5, radius=8, outline=None):
    x, y = xy
    tw = d.textlength(s, font=f)
    h = f.size + pady * 2
    d.rounded_rectangle((x, y, x + tw + padx * 2, y + h), radius=radius, fill=bg, outline=outline)
    d.text((x + padx, y + pady - 1), s, font=f, fill=fill)
    return x + tw + padx * 2, y + h


def fmt(x: float) -> str:
    if x >= 1000:
        return f"{x/1000:g}k"
    if x >= 10:
        return f"{x:.0f}"
    if x >= 1:
        return f"{x:.0f}"
    return f"{x:.2f}".rstrip("0").rstrip(".")


# --------------------------------------------------------------------------
# Diagram primitives. Each takes a pixel box (x0, y0, x1, y1).
# --------------------------------------------------------------------------


def d_stack(d, box, layers: Sequence[dict]):
    """Layered stack, top to bottom. layers: {label, note, tint}."""
    x0, y0, x1, y1 = box
    gap = 10
    h = (y1 - y0 - gap * (len(layers) - 1)) / len(layers)
    for i, layer in enumerate(layers):
        top = y0 + i * (h + gap)
        tint = layer.get("tint", CARD)
        rounded(d, (x0, top, x1, top + h), radius=10, fill=tint, outline=LINE, width=2)
        d.rectangle((x0 + 2, top + 2, x0 + 12, top + h - 2), fill=layer.get("accent", COPPER))
        text(d, (x0 + 26, top + h / 2 - 12), layer["label"], font("sans", 21, 600), INK)
        note = layer.get("note")
        if note:
            text(d, (x0 + 26, top + h / 2 + 11), note, font("sans", 15), MUTED)


def d_flow(d, box, steps: Sequence[str], note: str | None = None, vertical=False, accents=None):
    x0, y0, x1, y1 = box
    n = len(steps)
    accents = accents or [COPPER] * n
    if vertical:
        gap = 30
        cw = min(x1 - x0, 620)
        lx0 = (x0 + x1) / 2 - cw / 2
        lx1 = lx0 + cw
        avail_h = (y1 - y0) - (26 if note else 0)
        h = min((avail_h - gap * (n - 1)) / n, 150)
        top0 = y0 + (avail_h - (h * n + gap * (n - 1))) / 2
        for i, s in enumerate(steps):
            top = top0 + i * (h + gap)
            rounded(d, (lx0, top, lx1, top + h), radius=10, fill=CARD, outline=LINE, width=2)
            d.rectangle((lx0, top, lx0 + 6, top + h), fill=accents[i])
            text(d, (lx0 + 34, top + h / 2), f"0{i + 1}", font("mono", 14, 600),
                 accents[i], anchor="mm")
            lines = wrap(d, s, font("sans", 20, 500), int(cw - 96))
            ty = top + h / 2 - ((len(lines) - 1) * 27) / 2
            for line in lines:
                text(d, (lx0 + 64, ty), line, font("sans", 20, 500), INK, anchor="lm")
                ty += 27
            if i < n - 1:
                arrow(d, ((lx0 + lx1) / 2, top + h + 5), ((lx0 + lx1) / 2, top + h + gap - 5), COPPER, 2, 7)
        if note:
            text(d, (lx0, y1 - 4), note, font("sans", 13.5), MUTED, anchor="la")
        return
    gap = 26
    w = (x1 - x0 - gap * (n - 1)) / n
    card_h = min(0.52 * (y1 - y0), 210)
    top = y0 + (y1 - y0 - card_h) / 2 - (14 if note else 0)
    for i, s in enumerate(steps):
        left = x0 + i * (w + gap)
        rounded(d, (left, top, left + w, top + card_h), radius=10, fill=CARD, outline=LINE, width=2)
        d.rectangle((left, top, left + w, top + 5), fill=accents[i])
        lines = wrap(d, s, font("sans", 17, 500), int(w - 24))
        ty = top + card_h / 2 - (len(lines) * 12) + 4
        for line in lines:
            text(d, (left + w / 2, ty), line, font("sans", 17, 500), INK, anchor="ma")
            ty += 24
        if i < n - 1:
            arrow(d, (left + w + 5, top + card_h / 2), (left + w + gap - 5, top + card_h / 2), COPPER, 2, 7)
    if note:
        text(d, ((x0 + x1) / 2, y1 - 12), note, font("sans", 14), MUTED, anchor="ma")


def d_bars(d, box, items, unit="", highlight=None, baseline=True, value_fmt=None, pad_b=44):
    """items: [(label, value)] with optional third element colour."""
    x0, y0, x1, y1 = box
    pad_l = 24
    top = y0 + 26
    base = y1 - pad_b
    vmax = max(v for _, v, *_ in items) or 1
    n = len(items)
    slot = (x1 - x0 - pad_l) / n
    bw = min(74, slot * 0.42)
    for i, item in enumerate(items):
        label, value = item[0], item[1]
        colour = item[2] if len(item) > 2 else COPPER
        cx = x0 + pad_l + slot * (i + 0.5)
        h = (base - top) * (value / vmax)
        d.rounded_rectangle((cx - bw / 2, base - h, cx + bw / 2, base), radius=6, fill=colour)
        shown = value_fmt(value) if value_fmt else fmt(value)
        text(d, (cx, base - h - 22), f"{shown}{unit}", font("mono", 18, 600), INK, anchor="ma")
        lines = wrap(d, label, font("sans", 15, 500), int(slot - 6))
        ty = base + 12
        for line in lines[:2]:
            text(d, (cx, ty), line, font("sans", 15, 500), MUTED, anchor="ma")
            ty += 18
    if baseline:
        d.line([(x0 + 16, base), (x1 - 8, base)], fill=INK, width=2)


def d_curve(d, box, series, xlabel, ylabel, xticks=None, yticks=None, note=None, logx=False, logy=False, markers=None, xtick_fmt=None, ytick_fmt=None, spans=None):
    """series: [{points:[(x,y)], colour, label, dashed, width}]"""
    x0, y0, x1, y1 = box
    pad_l, pad_r, pad_t, pad_b = 62, 22, 34, 58
    ax0, ax1 = x0 + pad_l, x1 - pad_r
    ay0, ay1 = y0 + pad_t, y1 - pad_b
    xs = [p[0] for s in series for p in s["points"]]
    ys = [p[1] for s in series for p in s["points"]]
    if xticks:
        xmin, xmax = min(xticks), max(xticks)
    else:
        xmin, xmax = min(xs), max(xs)
    if yticks:
        ymin, ymax = min(yticks), max(yticks)
    else:
        ymin, ymax = 0, max(ys) * 1.12
    tx = (lambda v: math.log10(v)) if logx else (lambda v: v)
    ty = (lambda v: math.log10(v)) if logy else (lambda v: v)
    txmin, txmax = tx(xmin), tx(xmax)
    tymin, tymax = ty(ymin), ty(ymax)

    def px(v):
        return ax0 + (tx(v) - txmin) / (txmax - txmin + 1e-9) * (ax1 - ax0)

    def py(v):
        return ay1 - (ty(v) - tymin) / (tymax - tymin + 1e-9) * (ay1 - ay0)

    d.line([(ax0, ay1), (ax1, ay1)], fill=INK, width=2)
    d.line([(ax0, ay0), (ax0, ay1)], fill=INK, width=2)
    for t in yticks or []:
        d.line([(ax0, py(t)), (ax1, py(t))], fill=LINE, width=1)
        text(d, (ax0 - 10, py(t)), (ytick_fmt or fmt)(t), font("mono", 13), MUTED, anchor="rm")
    for t in xticks or []:
        text(d, (px(t), ay1 + 10), (xtick_fmt or fmt)(t), font("mono", 13), MUTED, anchor="mt")
    if xlabel:
        text(d, ((ax0 + ax1) / 2, y1 - 18), xlabel, font("sans", 15, 500), MUTED, anchor="ma")
    if ylabel:
        text(d, (ax0, y0 + 8), ylabel, font("sans", 15, 500), MUTED, anchor="lm")
    for s in series:
        pts = [(px(x), py(y)) for x, y in s["points"]]
        colour = s.get("colour", COPPER)
        width = s.get("width", 3)
        if s.get("dashed"):
            for a, b in zip(pts, pts[1:]):
                d.line([a, b], fill=colour, width=width)
        else:
            d.line(pts, fill=colour, width=width, joint="curve")
    if markers:
        for m in markers:
            cx, cy = px(m["x"]), py(m["y"])
            d.ellipse((cx - 6, cy - 6, cx + 6, cy + 6), fill=m.get("colour", COPPER), outline=PAPER, width=2)
            if m.get("label"):
                lf = font("sans", 15, 600)
                lx, ly = cx + m.get("dx", 12), cy + m.get("dy", -10)
                anchor = m.get("anchor", "la")
                if anchor == "la" and lx + d.textlength(m["label"], font=lf) > ax1:
                    lx, anchor = cx - 12, "ra"
                text(d, (lx, ly), m["label"], lf, m.get("label_colour", INK), anchor=anchor)
    for sp in spans or []:
        sx = px(sp["x"])
        top, bottom = py(sp["y1"]), py(sp["y0"])
        d.line([(sx, top + 4), (sx, bottom - 4)], fill=sp.get("colour", INK), width=2)
        d.polygon([(sx, top), (sx - 5, top + 9), (sx + 5, top + 9)], fill=sp.get("colour", INK))
        d.polygon([(sx, bottom), (sx - 5, bottom - 9), (sx + 5, bottom - 9)], fill=sp.get("colour", INK))
        if sp.get("label"):
            side = -1 if sp.get("left") else 1
            text(d, (sx + 12 * side, (top + bottom) / 2 + sp.get("dy", 0)), sp["label"], font("sans", 13, 600), sp.get("colour", INK), anchor="rm" if side < 0 else "lm")
    if note:
        text(d, ((ax0 + ax1) / 2, ay0 - 26), note, font("sans", 15), MUTED, anchor="ma")


def d_timeline(d, box, rows, span_label=None):
    """rows: [{label, start, end, colour, text, arrow}] in arbitrary units."""
    x0, y0, x1, y1 = box
    label_w = 118
    total = max(r["end"] for r in rows) or 1
    n = len(rows)
    row_h = (y1 - y0) / n
    for i, r in enumerate(rows):
        cy = y0 + row_h * (i + 0.5)
        text(d, (x0, cy), r["label"], font("sans", 16, 600), INK, anchor="lm")
        sx = x0 + label_w
        ex = x1 - 16
        width = ex - sx
        start = sx + width * (r["start"] / total)
        end = sx + width * (r["end"] / total)
        colour = r.get("colour", COPPER)
        bh = min(30, row_h * 0.48)
        if end - start < 1:
            end = start + 1
        d.rounded_rectangle((start, cy - bh / 2, end, cy + bh / 2), radius=6, fill=colour)
        label = r.get("text")
        if label:
            lf = font("sans", 14, 600)
            if end - start > d.textlength(label, font=lf) + 18:
                text(d, ((start + end) / 2, cy), label, lf, CARD, anchor="mm")
            else:
                text(d, (end + 8, cy), label, lf, INK, anchor="lm")
    if span_label:
        text(d, ((x0 + label_w + x1) / 2, y1 + 4), span_label, font("sans", 14), MUTED, anchor="ma")


def d_grid(d, box, cols, rows, cells, palette=None, gap=6, labels=None, label_side="bottom"):
    """cells: dict[(col,row)] = (fill, text, text_fill)."""
    x0, y0, x1, y1 = box
    cw = (x1 - x0 - gap * (cols - 1)) / cols
    ch = (y1 - y0 - gap * (rows - 1)) / rows
    for (c, r), spec in cells.items():
        left = x0 + c * (cw + gap)
        top = y0 + r * (ch + gap)
        fill, label, tcol = (spec + (INK,))[:3] if isinstance(spec, tuple) else (spec, "", INK)
        d.rounded_rectangle((left, top, left + cw, top + ch), radius=4, fill=fill, outline=None)
        if label:
            text(d, (left + cw / 2, top + ch / 2), label, font("mono", 13, 600), tcol, anchor="mm")
    if labels:
        for c, lab in enumerate(labels):
            text(d, (x0 + c * (cw + gap) + cw / 2, y1 + 8), lab, font("sans", 13), MUTED, anchor="ma")


def d_compare(d, box, left, right):
    """Two-column comparison. left/right: {title, tone, items:[str], foot}."""
    x0, y0, x1, y1 = box
    gap = 18
    w = (x1 - x0 - gap) / 2
    for i, side in enumerate((left, right)):
        left_x = x0 + i * (w + gap)
        tone = side.get("tone", COPPER)
        soft = side.get("soft", COPPER_SOFT)
        rounded(d, (left_x, y0, left_x + w, y1), radius=12, fill=soft, outline=tone, width=2)
        d.rounded_rectangle((left_x, y0, left_x + w, y0 + 46), radius=12, fill=tone)
        d.rectangle((left_x, y0 + 24, left_x + w, y0 + 46), fill=tone)
        text(d, (left_x + 16, y0 + 13), side["title"], font("sans", 19, 700), PAPER)
        avail = (y1 - 22) - (y0 + 46) - (34 if side.get("foot") else 8)
        items = side.get("items", [])
        body, lh, wrapped, block_h = font("sans", 16, 500), 25, [], 0
        # prefer the largest type where every item stays on one line
        for size in (26, 24, 23, 22, 21, 20, 19, 18, 17, 16):
            body = font("sans", size, 500)
            lines_each = [wrap(d, item, body, int(w - 46)) for item in items]
            if all(len(lines) == 1 for lines in lines_each):
                lh = int(size * 1.95)
                wrapped = lines_each
                block_h = sum(len(lines) * lh + 14 for lines in wrapped)
                if block_h <= avail:
                    break
        else:
            for size in (19, 18, 17, 16):
                body = font("sans", size, 500)
                lh = int(size * 1.55)
                wrapped = [wrap(d, item, body, int(w - 46)) for item in items]
                block_h = sum(len(lines) * lh + 14 for lines in wrapped)
                if block_h <= avail:
                    break
        ty = (y0 + 46 + avail / 2) - block_h / 2 + 4
        for lines in wrapped:
            for line in lines:
                text(d, (left_x + 20, ty), line, body, INK)
                ty += lh
            ty += 14
        if side.get("foot"):
            text(d, (left_x + 16, y1 - 34), side["foot"], font("mono", 14, 600), tone)


def d_tree(d, box, root, children, grandchildren=None):
    """Root label, branch bus, then one card per child sized to its own content."""
    x0, y0, x1, y1 = box
    h = y1 - y0
    cx_all = (x0 + x1) / 2
    n = len(children)
    slot = (x1 - x0) / n
    card_w = slot - 18
    note_f = font("sans", 13, 500)

    # lay out each card's text first so the tallest one sets the card height
    cards = []
    for i, child in enumerate(children):
        title_lines, title_f = [child], font("sans", 17, 700)
        for size in (17, 16, 15, 14, 13, 12):
            f = font("sans", size, 700)
            lines = wrap(d, child, f, int(card_w - 18))
            if len(lines) <= 2 and all(d.textlength(ln, font=f) <= card_w - 18 for ln in lines):
                title_lines, title_f = lines, f
                break
        notes = (grandchildren or [[]] * n)[i]
        note_lines = []
        for g in notes:
            note_lines.extend(wrap(d, g, note_f, int(card_w - 20)))
        title_h = len(title_lines) * int(title_f.size * 1.35)
        need = 18 + title_h + 20 + len(note_lines) * 19 + 14
        cards.append((title_lines, title_f, note_lines, need))

    card_h = max(c[3] for c in cards)
    card_h = max(104, min(card_h, 0.50 * h))
    total = 34 + 26 + card_h
    top = y0 + max(0, (h - total) / 2)
    bus_y = top + 76
    card_top = bus_y + 26

    text(d, (cx_all, top), root, font("sans", 18, 700), INK, anchor="ma")
    d.line([(cx_all, top + 34), (cx_all, bus_y)], fill=COPPER, width=2)
    centers = [x0 + slot * (i + 0.5) for i in range(n)]
    d.line([(centers[0], bus_y), (centers[-1], bus_y)], fill=COPPER, width=2)

    for i, (title_lines, title_f, note_lines, _need) in enumerate(cards):
        cx = centers[i]
        d.line([(cx, bus_y), (cx, card_top - 2)], fill=COPPER, width=2)
        d.rounded_rectangle((cx - card_w / 2, card_top, cx + card_w / 2, card_top + card_h),
                            radius=9, fill=CARD, outline=LINE, width=2)
        ty = card_top + 18
        for line in title_lines:
            text(d, (cx, ty), line, title_f, INK, anchor="ma")
            ty += int(title_f.size * 1.35)
        d.line([(cx - 18, ty + 5), (cx + 18, ty + 5)], fill=COPPER, width=2)
        avail = (card_top + card_h - 12) - (ty + 20)
        for line in note_lines[: max(1, int(avail // 19))]:
            text(d, (cx, ty + 22), line, note_f, MUTED, anchor="ma")
            ty += 19


def d_ledger(d, box, columns, rows):
    x0, y0, x1, y1 = box
    header_h = 34
    col_w = (x1 - x0) / len(columns)
    n = len(rows)
    row_h = min(58, (y1 - y0 - header_h - 4) / n)
    total = header_h + row_h * n
    top0 = y0 + (y1 - y0 - total) / 2
    d.rectangle((x0, top0, x1, top0 + header_h), fill=INK)
    wide = (x1 - x0) > 820
    for i, c in enumerate(columns):
        hx = x0 + col_w * i + (12 if wide else col_w * 0.5)
        text(d, (hx, top0 + header_h / 2), c, font("sans", 13.5, 700), PAPER, anchor="lm" if wide else "mm")
    for r, row in enumerate(rows):
        top = top0 + header_h + r * row_h
        if r % 2 == 0:
            d.rectangle((x0, top, x1, top + row_h), fill=CARD)
        for i, cell in enumerate(row):
            anchor = "lm" if (wide or i == 0) else "mm"
            xx = x0 + col_w * i + (12 if (wide or i == 0) else col_w / 2)
            yy = top + row_h / 2
            text(d, (xx, yy), cell, font("mono" if i else "sans", 12.5 if i else 13.5, 600 if i else 500), INK, anchor=anchor)
        d.line([(x0, top + row_h), (x1, top + row_h)], fill=LINE, width=1)
    d.rectangle((x0, top0, x1, top0 + total), outline=LINE, width=1)


def d_formula(d, box, expr, caption=None, accent=COPPER):
    """One equation, set large, with the reading note underneath."""
    x0, y0, x1, y1 = box
    rounded(d, (x0, y0, x1, y1), radius=12, fill=CARD, outline=accent, width=2)
    spaced(d, (x0 + 26, y0 + 22), "THE FORMULA", font("sans", 11, 700), COPPER_DEEP, 1.6)
    d.rectangle((x0 + 26, y0 + 52, x0 + 72, y0 + 55), fill=accent)

    lines = expr.split("\n")
    widest = max(d.textlength(line, font=font("mono", 40, 500)) for line in lines)
    size = 40
    while size > 17 and widest > (x1 - x0 - 56):
        size -= 1
        widest = max(d.textlength(line, font=font("mono", size, 500)) for line in lines)
    lh = int(size * 1.6)
    body_top = y0 + (72 if caption else 66)
    body_bottom = y1 - (62 if caption else 30)
    ty = body_top + (body_bottom - body_top - len(lines) * lh) / 2 + 4
    for line in lines:
        text(d, (x0 + 28, ty), line, font("mono", size, 500), INK)
        ty += lh
    if caption:
        cl = wrap(d, caption, font("sans", 14, 500), int(x1 - x0 - 56))[:2]
        cy = y1 - 26 - (len(cl) - 1) * 19
        for line in cl:
            text(d, (x0 + 28, cy), line, font("sans", 14, 500), MUTED)
            cy += 19


def d_badge(d, xy, s, fg=COPPER_DEEP, bg=COPPER_SOFT, f=None):
    f = f or font("sans", 15, 700)
    x, y = xy
    tw = d.textlength(s, font=f)
    d.rounded_rectangle((x, y, x + tw + 20, y + f.size + 12), radius=9, fill=bg)
    d.text((x + 10, y + 5), s, font=f, fill=fg)
    return x + tw + 20


def d_hub(d, box, center, satellites, centre_fill=INK, centre_text=PAPER):
    """Center badge with labelled satellites. satellites: [(label, note, dx, dy)]."""
    x0, y0, x1, y1 = box
    cx, cy = (x0 + x1) / 2, (y0 + y1) / 2
    r = 64
    bw, bh = 172, 56
    for label, note, dx, dy in satellites:
        sx = cx + dx * (x1 - x0) * 0.34
        sy = cy + dy * (y1 - y0) * 0.34
        # arrow from the circle edge to the near face of the satellite box
        ux, uy = sx - cx, sy - cy
        dist = math.hypot(ux, uy) or 1
        ax0, ay0 = cx + ux / dist * (r + 8), cy + uy / dist * (r + 8)
        if abs(dx) >= abs(dy):
            ax1 = sx - math.copysign(bw / 2 + 8, ux)
            ay1 = sy
        else:
            ax1 = sx
            ay1 = sy - math.copysign(bh / 2 + 8, uy)
        arrow(d, (ax0, ay0), (ax1, ay1), COPPER, 2, 8)
        rounded(d, (sx - bw / 2, sy - bh / 2, sx + bw / 2, sy + bh / 2), radius=10, fill=CARD, outline=LINE, width=2)
        text(d, (sx, sy - 11), label, font("sans", 15.5, 700), INK, anchor="mm")
        text(d, (sx, sy + 11), note, font("sans", 13), MUTED, anchor="mm")
    d.ellipse((cx - r, cy - r, cx + r, cy + r), fill=centre_fill)
    lines = center.split("\n")
    ty = cy - (len(lines) - 1) * 13
    for line in lines:
        text(d, (cx, ty), line, font("sans", 16, 700), centre_text, anchor="mm")
        ty += 25


def d_blocks(d, box, items, note=None):
    """Free-form annotated blocks. items: {x,y,w,h(0..1), label, sub, fill, outline, text}."""
    x0, y0, x1, y1 = box
    bw, bh = x1 - x0, y1 - y0
    for it in items:
        left = x0 + it["x"] * bw
        top = y0 + it["y"] * bh
        w = it["w"] * bw
        h = it["h"] * bh
        fill = it.get("fill", CARD)
        outline = it.get("outline", LINE)
        rounded(d, (left, top, left + w, top + h), radius=it.get("radius", 8), fill=fill, outline=outline, width=it.get("width", 2))
        tcol = it.get("text", INK)
        fs = it.get("size", 14)
        label = it.get("label")
        sub = it.get("sub")
        if sub:
            text(d, (left + 10, top + 10), label, font("sans", fs, 700), tcol)
            for j, line in enumerate(sub.split("\n")):
                text(d, (left + 10, top + 10 + fs + 6 + j * (fs + 2)), line, font("sans", fs - 2), tcol if tcol != INK else MUTED)
        elif label:
            text(d, (left + w / 2, top + h / 2), label, font("sans", fs, 600), tcol, anchor="mm")
    if note:
        text(d, ((x0 + x1) / 2, y1 + 12), note, font("sans", 14), MUTED, anchor="ma")


def render_slide(
    path: Path,
    kicker: str,
    headline: str,
    bullets: Sequence[str],
    diagram,
    index: int,
    total: int,
    layout: str = "split",
    tag: str | None = None,
    caption: str | None = None,
):
    """Compose one 1280x720 slide. `diagram` is a callable(draw, box)."""
    img = Image.new("RGB", (W, H), PAPER)
    d = ImageDraw.Draw(img)
    d.rectangle((0, 0, 10, H), fill=COPPER)

    kick_f = font("sans", 15, 700)
    spaced(d, (54, 42), kicker.upper(), kick_f, COPPER_DEEP, 2.0)
    text(d, (W - 54, 42), f"{index:02d} / {total:02d}", font("mono", 14, 500), MUTED, anchor="ra")

    if layout == "wide":
        head_f = font("serif", 44, 650)
        lines = wrap(d, headline, head_f, 1150)
        y = 88
        for line in lines[:2]:
            text(d, (54, y), line, head_f, INK)
            y += 52
        if bullets:
            sub_f = font("sans", 17, 500)
            sub = wrap(d, "   ·   ".join(bullets), sub_f, 1140)[:2]
            for i, line in enumerate(sub):
                text(d, (54, y + 6 + i * 24), line, sub_f, MUTED)
            y += 6 + 24 * len(sub)
        top = max(196, y + 26)
        if caption:
            cy = 570
            d.rectangle((54, cy, 78, cy + 3), fill=COPPER)
            spaced(d, (54, cy + 12), "THE PICTURE", font("sans", 11, 700), COPPER_DEEP, 1.6)
            lines = wrap(d, caption, font("sans", 16, 500), 940)[:2]
            for i, line in enumerate(lines):
                text(d, (232, cy + 8 + i * 23), line, font("sans", 16, 500), MUTED)
            diagram(d, (54, top, W - 54, 552))
        else:
            diagram(d, (54, top, W - 54, 636))
    else:
        head_f = font("serif", 43, 650)
        lines = wrap(d, headline, head_f, 486)
        while len(lines) > 5 and head_f.size > 34:
            head_f = font("serif", head_f.size - 2, 650)
            lines = wrap(d, headline, head_f, 486)
        y = 100
        for line in lines[:5]:
            text(d, (54, y), line, head_f, INK)
            y += head_f.size + 8
        y += 22
        limit = 486 if caption else 616
        # shrink the bullet block rather than let it run into the caption
        body_f, lh = font("sans", 19, 500), 26
        for size, lead in ((19, 26), (18, 25), (17, 24), (16, 23)):
            body_f, lh = font("sans", size, 500), lead
            total = sum(len(wrap(d, b, body_f, 452)) * lh + 12 for b in bullets)
            if y + total <= limit:
                break
        for b in bullets:
            blines = wrap(d, b, body_f, 452)
            if y + len(blines) * lh > limit:
                break
            d.ellipse((56, y + lh * 0.34, 65, y + lh * 0.34 + 9), fill=COPPER)
            for line in blines:
                text(d, (78, y), line, body_f, INK)
                y += lh
            y += 12
        rounded(d, (588, 96, W - 54, 636), radius=16, fill=CARD, outline=LINE, width=2)
        diagram(d, (614, 122, W - 80, 610))
        if caption:
            cy = 508
            d.rectangle((54, cy, 78, cy + 3), fill=COPPER)
            spaced(d, (54, cy + 12), "THE PICTURE", font("sans", 11, 700), COPPER_DEEP, 1.6)
            ty = cy + 34
            for line in wrap(d, caption, font("sans", 16, 500), 466)[:4]:
                text(d, (54, ty), line, font("sans", 16, 500), MUTED)
                ty += 23

    if tag:
        d_badge(d, (54, 648), tag, COPPER_DEEP, COPPER_SOFT, font("sans", 13, 700))
    d.line([(54, 660), (W - 54, 660)], fill=LINE, width=1)
    text(d, (54, 674), "Ridge  ·  narrated lecture", font("sans", 13, 500), MUTED)
    text(d, (W - 54, 674), "Efficient LLM Inference", font("sans", 13, 500), MUTED, anchor="ra")
    img.save(path, quality=92)
    return img


def d_scatter(d, box, points, xlabel, ylabel, note=None, quadrants=None, labels=None, curve=None):
    x0, y0, x1, y1 = box
    pad_l, pad_b = 56, 48
    ax0, ax1 = x0 + pad_l, x1 - 18
    ay0, ay1 = y0 + 30, y1 - pad_b
    d.line([(ax0, ay1), (ax1, ay1)], fill=INK, width=2)
    d.line([(ax0, ay0), (ax0, ay1)], fill=INK, width=2)
    for a, b in zip((curve or []), (curve or [])[1:]):
        x1c = ax0 + a[0] * (ax1 - ax0)
        y1c = ay1 - a[1] * (ay1 - ay0)
        x2c = ax0 + b[0] * (ax1 - ax0)
        y2c = ay1 - b[1] * (ay1 - ay0)
        d.line([(x1c, y1c), (x2c, y2c)], fill=LINE, width=2)
    if quadrants:
        mx, my = quadrants
        d.line([(mx, ay0), (mx, ay1)], fill=LINE, width=1)
        d.line([(ax0, my), (ax1, my)], fill=LINE, width=1)
    for p in points:
        cx = ax0 + p["x"] * (ax1 - ax0)
        cy = ay1 - p["y"] * (ay1 - ay0)
        colour = p.get("colour", COPPER)
        r = p.get("r", 9)
        d.ellipse((cx - r, cy - r, cx + r, cy + r), fill=colour, outline=CARD, width=2)
        if p.get("label"):
            text(d, (cx + r + 5, cy - 8), p["label"], font("sans", 13, 600), INK)
    text(d, ((ax0 + ax1) / 2, y1 - 16), xlabel, font("sans", 14, 500), MUTED, anchor="ma")
    text(d, (x0 + 12, ay0 - 16), ylabel, font("sans", 14, 500), MUTED)
    if note:
        text(d, (x1 - 10, ay0 - 16), note, font("sans", 13), MUTED, anchor="ra")
    if labels:
        for txt, (fx, fy) in labels:
            text(d, (ax0 + fx * (ax1 - ax0), ay1 - fy * (ay1 - ay0)), txt, font("sans", 13, 600), MUTED, anchor="mm")
