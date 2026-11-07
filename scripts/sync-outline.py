#!/usr/bin/env python3
"""Sync each lesson's lecture outline in src/lib/course.ts with the storyboard.

The Watch tab shows an outline under the video. It is generated from the same
storyboard that produces the slides and the narration, so the three cannot drift
apart.
"""

from __future__ import annotations

import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT / "scripts"))

from lectures import LESSONS  # noqa: E402

COURSE = ROOT / "src" / "lib" / "course.ts"


def outline(lesson: dict) -> list[str]:
    lines = []
    for slide in lesson["slides"]:
        body = " ".join(b.strip() for b in slide.get("bullets", []))
        lines.append(f"{slide['head']} {body}".strip())
    return lines


def main() -> None:
    source = COURSE.read_text()
    blocks = list(re.finditer(r"transcript: \[(.*?)\n      \],", source, re.S))
    if len(blocks) != len(LESSONS):
        raise SystemExit(f"found {len(blocks)} transcript blocks, expected {len(LESSONS)}")

    out = []
    cursor = 0
    for match, lesson in zip(blocks, LESSONS):
        lines = outline(lesson)
        body = "\n".join(f'        "{line}",' for line in lines)
        out.append(source[cursor : match.start()])
        out.append(f"transcript: [\n{body}\n      ],")
        cursor = match.end()
    out.append(source[cursor:])
    updated = "".join(out)

    COURSE.write_text(updated)
    print(f"updated {len(blocks)} lecture outlines")
    for lesson in LESSONS:
        print(f"  {lesson['id']:12s} {len(outline(lesson))} slides")


if __name__ == "__main__":
    main()
