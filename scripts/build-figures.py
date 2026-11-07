#!/usr/bin/env python3
"""Render standalone diagrams for the written notes.

The same drawing code backs the lecture slides, so a figure in the notes and the
matching slide can never say different things.
"""

from __future__ import annotations

import sys
from pathlib import Path

from PIL import Image, ImageDraw

ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT / "scripts"))

from diagrams import CAPTIONS, DRAW  # noqa: E402
from slidekit import CARD, COPPER, INK, LINE, PAPER, font, spaced, text, wrap  # noqa: E402

OUT = ROOT / "public" / "figures"
OUT.mkdir(parents=True, exist_ok=True)

W, H = 1200, 640

FIGURES = [
    ("shift", "prefill_decode", {}, "Two phases, two resources"),
    ("bottlenecks", "roofline", {}, "The roofline, with decode far below the ridge"),
    ("kv", "cache_levers", {}, "The footprint formula, read as four levers"),
    ("architecture", "recall_curve", {}, "Recall against state size"),
    ("decoding", "spec_timeline", {}, "Draft, verify, accept"),
    ("compression", "quant_grid", {}, "Why a uniform grid fails on outliers"),
    ("systems", "paging", {}, "Reservation versus paging"),
    ("synthesis", "additive", {}, "Four levers multiply the cache saving"),
    ("frontiers", "recall_gap", {}, "The recall gap widens with context"),
]


def render(src: Path, fig: str, params: dict, caption: str):
    img = Image.new("RGB", (W, H), PAPER)
    d = ImageDraw.Draw(img)
    d.rectangle((0, 0, 8, H), fill=COPPER)
    spaced(d, (44, 22), "FIGURE", font("sans", 12, 700), COPPER, 1.8)
    d.rounded_rectangle((44, 46, W - 44, H - 34), radius=14, fill=CARD, outline=LINE, width=2)
    DRAW[fig](d, (76, 72, W - 76, H - 62), **params)
    img.save(src, quality=92)


def main():
    for lesson, fig, params, caption in FIGURES:
        dest = OUT / f"{lesson}.png"
        render(dest, fig, params, caption)
        print(dest.relative_to(ROOT), f"{dest.stat().st_size/1024:.0f} KB")


if __name__ == "__main__":
    main()
