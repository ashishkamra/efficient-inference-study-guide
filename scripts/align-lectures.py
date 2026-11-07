#!/usr/bin/env python3
"""Rebuild lecture videos so each slide is the material being spoken, timed to the audio."""

import importlib.util
import json
import os
import re
import subprocess
import urllib.request
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont

ROOT = Path(__file__).resolve().parents[1]
AUDIO = ROOT / "narration"
OUT = ROOT / "public" / "videos"
CACHE = AUDIO / "stt"
CACHE.mkdir(parents=True, exist_ok=True)

SERIF = "/usr/share/fonts/truetype/liberation/LiberationSerif-Bold.ttf"
SANS = "/usr/share/fonts/truetype/liberation/LiberationSans-Regular.ttf"
SANS_B = "/usr/share/fonts/truetype/liberation/LiberationSans-Bold.ttf"
MONO = "/usr/share/fonts/truetype/liberation/LiberationMono-Regular.ttf"

PAPER = (243, 239, 230)
INK = (28, 25, 21)
MUTED = (90, 83, 74)
COPPER = (196, 81, 26)
CARD = (255, 252, 246)

STOP = {
    "a", "an", "the", "of", "and", "or", "to", "in", "on", "for", "is", "are",
    "it", "that", "this", "with", "as", "at", "by", "from", "be", "was",
}

# Shown only while the narration is saying that idea.
FORMULAS = [
    ("operational intensity is floating-point", "I  =  FLOPs  /  bytes\nridge  =  peak compute  /  peak bandwidth"),
    ("about two times the parameter count", "decode, batch 1, 16-bit\nFLOPs ≈ 2N     bytes ≈ 2N     intensity ≈ 1 op/byte"),
    ("cache bytes equal two", "bytes = 2 × layers × KV heads × head dim\n        × length × batch × bytes per element"),
    ("one attention layer for every seven", "Jamba ≈ 1 attention layer  :  7 Mamba layers\n+ mixture of experts"),
    ("four-bit weights with eight-bit", "production point in the survey\nW4A8  —  4-bit weights, 8-bit activations"),
    ("keys use per-channel", "KIVI, about 2-bit, no extra tuning\nkeys: per channel     values: per token"),
    ("two of every four weights", "2:4 sparsity\nexactly 2 of every 4 weights kept"),
    ("typically sixteen tokens", "PagedAttention\npage ≈ 16 tokens + a block table per request"),
    ("goodput counts only tokens", "goodput = tokens that meet the latency target\nTTFT = prefill + queue     TPOT = decode"),
]


def load_lessons():
    spec = importlib.util.spec_from_file_location(
        "lectures", ROOT / "scripts" / "build-lectures.py"
    )
    mod = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(mod)
    return mod.LESSONS


def sentences(text: str) -> list[str]:
    parts = re.split(r"(?<=[.])\s+", text.strip())
    return [p.strip() for p in parts if p.strip()]


def beats_from_script(text: str) -> list[str]:
    groups = []
    cur, words = [], 0
    for sent in sentences(text):
        n = len(sent.split())
        if cur and (words + n > 36 or n > 32):
            groups.append(" ".join(cur))
            cur, words = [sent], n
        else:
            cur.append(sent)
            words += n
    if cur:
        groups.append(" ".join(cur))
    return groups


def tokens(s: str) -> list[str]:
    return re.findall(r"[a-z0-9]+", s.lower())


def content_tokens(s: str) -> list[str]:
    return [t for t in tokens(s) if t not in STOP and len(t) > 2]


def transcribe(lid: str, path: Path) -> dict:
    dest = CACHE / f"{lid}.json"
    if dest.exists() and dest.stat().st_size > 100:
        return json.loads(dest.read_text())
    key = os.environ["XAI_API_KEY"]
    boundary = "----ridgealign"
    body = bytearray()

    def field(name, value):
        body.extend(f"--{boundary}\r\nContent-Disposition: form-data; name=\"{name}\"\r\n\r\n{value}\r\n".encode())

    field("model", "grok-voice-transcribe-2.0")
    field("language", "en")
    field("format", "true")
    for term in ("KIVI", "FlashAttention", "Mamba", "GPTQ", "PagedAttention", "Jamba", "EAGLE", "SmoothQuant", "DistServe"):
        field("keyterm", term)
    audio = path.read_bytes()
    body.extend(
        f"--{boundary}\r\nContent-Disposition: form-data; name=\"file\"; filename=\"{lid}.mp3\"\r\nContent-Type: audio/mpeg\r\n\r\n".encode()
    )
    body.extend(audio)
    body.extend(f"\r\n--{boundary}--\r\n".encode())
    req = urllib.request.Request(
        "https://api.x.ai/v1/stt",
        data=bytes(body),
        headers={"Authorization": f"Bearer {key}", "Content-Type": f"multipart/form-data; boundary={boundary}"},
    )
    with urllib.request.urlopen(req, timeout=180) as r:
        payload = json.loads(r.read().decode())
    dest.write_text(json.dumps(payload))
    print("stt", lid, "words", len(payload.get("words") or []), "dur", payload.get("duration"))
    return payload


def locate(flat, needles, pos):
    """Timestamp of the first spoken word of this beat, not a window that merely contains it later."""
    if not needles:
        return None
    for skip in range(min(3, len(needles))):
        target = needles[skip : skip + 4]
        if len(target) < 2:
            continue
        for i in range(pos, len(flat)):
            if flat[i][0] != target[0]:
                continue
            k = i
            ok = True
            for n in target[1:]:
                k2 = k + 1
                limit = k + 6
                while k2 < len(flat) and k2 <= limit and flat[k2][0] != n:
                    k2 += 1
                if k2 >= len(flat) or k2 > limit or flat[k2][0] != n:
                    ok = False
                    break
                k = k2
            if ok:
                return i
    return None


def align(beats: list[str], words: list[dict], duration: float) -> list[float]:
    flat = []
    for w in words:
        start = float(w.get("start") or 0)
        for t in tokens(w.get("text") or "") or [""]:
            flat.append((t, start))
    starts = []
    pos = 0
    for beat in beats:
        found = locate(flat, content_tokens(beat), pos)
        if found is None:
            starts.append(None)
        else:
            starts.append(flat[found][1])
            pos = found + 1
    known = [(i, t) for i, t in enumerate(starts) if t is not None]
    if not known:
        step = duration / max(len(beats), 1)
        return [i * step for i in range(len(beats))]
    if known[0][0] > 0:
        starts[0] = 0.0
        for i in range(1, known[0][0]):
            starts[i] = known[0][1] * i / known[0][0]
    for (a, ta), (b, tb) in zip(known, known[1:]):
        gap = b - a
        for i in range(a + 1, b):
            starts[i] = ta + (tb - ta) * (i - a) / gap
    last_i, last_t = known[-1]
    rest = len(starts) - 1 - last_i
    for i in range(last_i + 1, len(starts)):
        starts[i] = last_t + (duration - last_t) * (i - last_i) / max(rest, 1)
    prev = 0.0
    out = []
    for t in starts:
        t = max(prev, float(t))
        out.append(t)
        prev = t
    if out:
        out[0] = 0.0
    return out


def formula_for(beat: str) -> str | None:
    low = beat.lower()
    for phrase, formula in FORMULAS:
        if phrase in low:
            return formula
    return None


def wrap(draw, text, font, width):
    lines, cur = [], ""
    for w in text.split():
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


def render(path: Path, kicker: str, beat: str, index: int, total: int):
    img = Image.new("RGB", (1280, 720), PAPER)
    d = ImageDraw.Draw(img)
    d.rectangle((0, 0, 14, 720), fill=COPPER)
    d.rectangle((0, 668, 1280, 720), fill=INK)
    kicker_f = ImageFont.truetype(SANS_B, 20)
    foot_f = ImageFont.truetype(SANS, 18)
    d.text((48, 36), kicker.upper(), font=kicker_f, fill=COPPER)
    d.text((1040, 36), f"{index}  /  {total}", font=kicker_f, fill=MUTED)

    sents = sentences(beat)
    head, rest = sents[0], " ".join(sents[1:])
    formula = formula_for(beat)
    y = 88
    size = 40
    head_font = ImageFont.truetype(SERIF, size)
    head_lines = wrap(d, head, head_font, 1160)
    while len(head_lines) > 3 and size > 30:
        size -= 2
        head_font = ImageFont.truetype(SERIF, size)
        head_lines = wrap(d, head, head_font, 1160)
    for line in head_lines[:4]:
        d.text((48, y), line, font=head_font, fill=INK)
        y += size + 10
    y += 8
    if formula:
        box_top = y
        mono = ImageFont.truetype(MONO, 26)
        flines = formula.split("\n")
        box_h = 28 + len(flines) * 36
        d.rounded_rectangle((48, box_top, 1232, box_top + box_h), radius=12, fill=CARD, outline=COPPER, width=2)
        fy = box_top + 14
        for line in flines:
            d.text((68, fy), line, font=mono, fill=INK)
            fy += 36
        y = box_top + box_h + 22
    if rest:
        body = ImageFont.truetype(SANS, 28)
        for line in wrap(d, rest, body, 1160)[:6]:
            if y > 630:
                break
            d.text((48, y), line, font=body, fill=INK)
            y += 38
    d.text((48, 684), "Ridge  ·  narrated from the survey", font=foot_f, fill=PAPER)
    d.text((980, 684), "Ridge lecture", font=foot_f, fill=PAPER)
    img.save(path)


def duration_of(path: Path) -> float:
    proc = subprocess.run(["ffmpeg", "-i", str(path)], capture_output=True, text=True)
    for token in proc.stderr.split():
        if token.count(":") == 2 and token[0].isdigit():
            h, m, s = token.split(":")
            return int(h) * 3600 + int(m) * 60 + float(s.rstrip(","))
    raise RuntimeError("no duration")


def build(lesson):
    lid = lesson["id"]
    audio = AUDIO / f"{lid}.mp3"
    payload = transcribe(lid, audio)
    words = payload.get("words") or []
    dur = float(payload.get("duration") or duration_of(audio))
    beats = beats_from_script(lesson["text"])
    starts = align(beats, words, dur)
    # End of each slide is the next start, last is full duration.
    ends = starts[1:] + [dur]
    work = AUDIO / f"{lid}-aligned"
    if work.exists():
        for old in work.glob("*"):
            old.unlink()
    work.mkdir(exist_ok=True)
    lines = []
    for i, (beat, start, end) in enumerate(zip(beats, starts, ends), start=1):
        span = max(0.4, end - start)
        png = work / f"s{i:02d}.png"
        render(png, f"{lesson['kicker']}  ·  {lesson['title']}", beat, i, len(beats))
        if i == 1:
            Image.open(png).save(OUT / f"lecture-{lid}.jpg", quality=88)
        lines.append(f"file '{png}'\n")
        lines.append(f"duration {span:.3f}\n")
    # concat image demuxer requires the last file repeated
    lines.append(f"file '{work / f's{len(beats):02d}.png'}'\n")
    concat = work / "concat.txt"
    concat.write_text("".join(lines))
    silent = work / "silent.mp4"
    subprocess.check_call(
        [
            "ffmpeg", "-y", "-f", "concat", "-safe", "0", "-i", str(concat),
            "-vf", "fps=24,format=yuv420p",
            "-c:v", "libx264", "-tune", "stillimage", "-pix_fmt", "yuv420p",
            "-an", str(silent),
        ],
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
    missed = sum(1 for t in starts if t is None)
    print(f"{lid} slides={len(beats)} dur={dur:.1f}s file={final.stat().st_size/1e6:.1f}MB")
    # sanity: print first/mid timestamps
    for i in (0, len(beats)//2, len(beats)-1):
        print(f"  {starts[i]:6.1f}s  {beats[i][:90]}")


def main():
    lessons = load_lessons()
    for lesson in lessons:
        build(lesson)


if __name__ == "__main__":
    main()
