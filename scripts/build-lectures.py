#!/usr/bin/env python3
"""Build the Ridge narrated lectures, beat by beat.

Each slide's narration is split into sentences. Every sentence becomes a beat:
its own audio clip and its own frame, with the slide bullet it talks about lit
up and the others dimmed. Beat frames crossfade, slides crossfade while the
voice is silent, and the audio is placed on one continuous timeline so the
picture never cuts away from the words.

    python3 scripts/build-lectures.py             # every lesson
    python3 scripts/build-lectures.py kv systems  # selected lessons
    RIDGE_TTS=xtts python3 scripts/build-lectures.py kv

The default voice is Kokoro-82M, which runs locally and reads in a steady,
neutral register. Set RIDGE_TTS=xtts to use the XTTS-v2 voice rendered on the
GPU box by scripts/voice-gpu.py instead; those clips are cached in
narration/.tts-gpu.
"""

from __future__ import annotations

import bisect
import json
import math
import os
import shutil
import subprocess
import sys
import urllib.request
import wave
from pathlib import Path

import numpy as np
from PIL import Image

ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT / "scripts"))

from beats import slide_beats  # noqa: E402
from diagrams import CAPTIONS, DRAW  # noqa: E402
from lectures import LESSONS  # noqa: E402
from slidekit import H, PAPER, W, draw_caption, render_slide  # noqa: E402
from speech import clip_hash, spoken, word_timings  # noqa: E402

AUDIO = ROOT / "narration"
OUT = ROOT / "public" / "videos"
CACHE = AUDIO / ".tts-model"
WORK = AUDIO / ".build"
GPU_VOICE = AUDIO / ".tts-gpu"
MODEL = CACHE / "kokoro-v1.0.onnx"
VOICES = CACHE / "voices-v1.0.bin"
MODEL_URL = "https://github.com/thewh1teagle/kokoro-onnx/releases/download/model-files-v1.0/kokoro-v1.0.onnx"
VOICES_URL = "https://github.com/thewh1teagle/kokoro-onnx/releases/download/model-files-v1.0/voices-v1.0.bin"

KOKORO_VOICE = "bm_george"
KOKORO_SPEED = 0.92
KOKORO_LANG = "en-gb"
XTTS_VOICE = os.environ.get("RIDGE_VOICE", "Ana Florence")

SR = 24000
FPS = 24
LEAD = 0.45       # first slide is on screen before the voice starts
BEAT_GAP = 0.14   # between sentences of the same claim
BULLET_GAP = 0.34 # when the narration moves to the other claim
SLIDE_GAP = 0.62  # between slides, used for the crossfade
TAIL = 1.1

_kokoro = None


def backend() -> str:
    chosen = os.environ.get("RIDGE_TTS")
    if chosen:
        return chosen
    return "kokoro"


def ensure_model():
    CACHE.mkdir(parents=True, exist_ok=True)
    for path, url in ((MODEL, MODEL_URL), (VOICES, VOICES_URL)):
        if path.exists() and path.stat().st_size > 1_000_000:
            continue
        print(f"downloading {path.name}")
        tmp = path.with_suffix(".part")
        with urllib.request.urlopen(url, timeout=600) as r, tmp.open("wb") as f:
            shutil.copyfileobj(r, f)
        tmp.rename(path)


def engine():
    global _kokoro
    if _kokoro is None:
        ensure_model()
        from kokoro_onnx import Kokoro

        _kokoro = Kokoro(str(MODEL), str(VOICES))
    return _kokoro


def read_wav(path: Path) -> tuple[np.ndarray, int]:
    with wave.open(str(path), "rb") as w:
        sr = w.getframerate()
        data = np.frombuffer(w.readframes(w.getnframes()), dtype=np.int16)
    return data, sr


def write_wav(path: Path, data: np.ndarray, sr: int = SR):
    with wave.open(str(path), "wb") as w:
        w.setnchannels(1)
        w.setsampwidth(2)
        w.setframerate(sr)
        w.writeframes(data.tobytes())


def synth_kokoro(text: str, dest: Path):
    digest = clip_hash(spoken(text), f"kokoro|{KOKORO_VOICE}|{KOKORO_SPEED}|{KOKORO_LANG}")
    meta = dest.with_suffix(".json")
    if dest.exists() and meta.exists() and json.loads(meta.read_text()).get("hash") == digest:
        return
    samples, sr = engine().create(spoken(text), voice=KOKORO_VOICE, speed=KOKORO_SPEED, lang=KOKORO_LANG)
    pcm = (np.clip(samples, -1, 1) * 32767).astype(np.int16)
    write_wav(dest, pcm, sr)
    meta.write_text(json.dumps({"hash": digest, "sr": sr}))


def beat_audio(text: str, work: Path, name: str, kind: str) -> np.ndarray:
    if kind == "xtts":
        path = GPU_VOICE / f"{clip_hash(spoken(text), XTTS_VOICE)}.wav"
        if not path.exists():
            raise SystemExit(
                f"missing GPU voice clip for: {text[:60]!r}\nrun: python3 scripts/voice-gpu.py"
            )
        data, sr = read_wav(path)
    else:
        path = work / f"{name}.wav"
        synth_kokoro(text, path)
        data, sr = read_wav(path)
    if sr != SR:
        data = resample(data, sr, SR)
    return normalize(trim_silence(data))


def trim_silence(data: np.ndarray) -> np.ndarray:
    """Drop the dead air a model leaves at the head and tail of a clip."""
    peak = int(np.abs(data).max()) if len(data) else 0
    if peak == 0:
        return data
    live = np.flatnonzero(np.abs(data.astype(np.int32)) > max(90, peak * 0.015))
    if live.size == 0:
        return data
    start = max(0, int(live[0]) - int(0.05 * SR))
    end = min(len(data), int(live[-1]) + int(0.12 * SR))
    return data[start:end]


def normalize(data: np.ndarray) -> np.ndarray:
    """Even out clip loudness without letting one stressed word clip."""
    if not len(data):
        return data
    loud = float(np.percentile(np.abs(data.astype(np.float32)), 92))
    if loud < 60:
        return data
    gain = 0.24 * 32767 / loud
    return np.clip(data.astype(np.float32) * gain, -32768, 32767).astype(np.int16)


def pauses_in(data: np.ndarray) -> list[tuple[float, float]]:
    """Internal silent spans long enough to be a punctuation pause.

    Pinning caption timings to the real pauses matters more than a perfect
    per-word model: without this, the highlight runs ahead at every comma and
    then waits for the voice to catch up.
    """
    win = int(0.01 * SR)
    if len(data) < win * 8:
        return []
    n = len(data) // win
    frames = np.abs(data[: n * win].astype(np.int32)).reshape(n, win).mean(axis=1)
    threshold = max(40.0, float(np.percentile(frames, 90)) * 0.035)
    quiet = frames < threshold
    spans: list[tuple[float, float]] = []
    i = 0
    total = len(data) / SR
    while i < n:
        if not quiet[i]:
            i += 1
            continue
        j = i
        while j < n and quiet[j]:
            j += 1
        start, end = i * win / SR, j * win / SR
        if end - start >= 0.13 and start > 0.04 and end < total - 0.04:
            spans.append((round(start, 3), round(end, 3)))
        i = j
    return spans


def resample(data: np.ndarray, sr: int, target: int) -> np.ndarray:
    if sr == target:
        return data
    n = int(round(len(data) * target / sr))
    x = np.linspace(0, len(data) - 1, n)
    out = np.interp(x, np.arange(len(data)), data.astype(np.float32))
    return np.clip(out, -32768, 32767).astype(np.int16)


def smoothstep(a: float) -> float:
    a = min(1.0, max(0.0, a))
    return a * a * (3 - 2 * a)


def image_for(lesson, slide, index, total, beat, path: Path) -> Image.Image:
    fig = DRAW[slide["fig"]]
    params = dict(slide.get("params") or {})
    return render_slide(
        path,
        lesson["kicker"],
        slide["head"],
        slide.get("bullets", []),
        lambda d, box, f=fig, p=params: f(d, box, **p),
        index,
        total,
        layout=slide.get("layout", "split"),
        tag=slide.get("tag"),
        caption=CAPTIONS.get(slide["fig"]),
        active=[beat.bullet] if beat.bullet >= 0 else None,
        keywords=beat.keywords,
    )


def build(lesson, kind: str):
    lid = lesson["id"]
    work = WORK / lid
    work.mkdir(parents=True, exist_ok=True)
    frames = AUDIO / f"{lid}-aligned"
    frames.mkdir(exist_ok=True)
    for old in frames.glob("*"):
        old.unlink()

    beats = []
    total = len(lesson["slides"])
    for i, slide in enumerate(lesson["slides"], start=1):
        seen: dict[tuple[int, tuple[str, ...]], Image.Image] = {}
        slide_beats_ = slide_beats(slide["say"], slide.get("bullets", []))
        for k, beat in enumerate(slide_beats_, start=1):
            key = (beat.bullet, tuple(beat.keywords))
            if key in seen:
                img = seen[key]
            else:
                png = frames / f"s{i:02d}-b{k:02d}.png"
                img = image_for(lesson, slide, i, total, beat, png)
                seen[key] = img
            pcm = beat_audio(beat.text, work, f"s{i:02d}-b{k:02d}", kind)
            dur = len(pcm) / SR
            beats.append(
                {
                    "slide": i,
                    "bullet": beat.bullet,
                    "img": img,
                    "pcm": pcm,
                    "dur": dur,
                    "text": beat.text,
                    "words": word_timings(beat.text, dur, pauses_in(pcm)),
                }
            )

    # Place every clip on one timeline. The gap before a beat is also the
    # length of the crossfade into it, so the new frame has settled by the time
    # its sentence starts.
    at = LEAD
    for n, beat in enumerate(beats):
        if n:
            prev = beats[n - 1]
            if beat["slide"] != prev["slide"]:
                gap = SLIDE_GAP
            elif beat["bullet"] != prev["bullet"]:
                gap = BULLET_GAP
            else:
                gap = BEAT_GAP
            at = prev["at"] + prev["dur"] + gap
        beat["at"] = at
        beat["fade"] = 0.0 if n == 0 else min(gap, 0.7)
        beat["wstarts"] = [at + start for start, _span in beat["words"]]
    total_seconds = beats[-1]["at"] + beats[-1]["dur"] + TAIL

    starts = [b["at"] for b in beats]
    n_frames = int(math.ceil(total_seconds * FPS))
    samples = int(math.ceil(n_frames / FPS * SR))
    master = np.zeros(samples, dtype=np.int16)
    for beat in beats:
        start = int(round(beat["at"] * SR))
        end = min(start + len(beat["pcm"]), len(master))
        master[start:end] = beat["pcm"][: end - start]

    master_wav = work / "master.wav"
    write_wav(master_wav, master)
    (frames / "timeline.json").write_text(
        json.dumps(
            [
                {
                    "t": round(b["at"], 3),
                    "dur": round(b["dur"], 3),
                    "slide": b["slide"],
                    "bullet": b["bullet"],
                    "say": b["text"],
                    "words": [[start, span] for start, span in b["words"]],
                }
                for b in beats
            ],
            indent=0,
        )
    )

    silent = work / "silent.mp4"
    proc = subprocess.Popen(
        [
            "ffmpeg", "-y", "-f", "rawvideo", "-pix_fmt", "rgb24",
            "-s", f"{W}x{H}", "-r", str(FPS), "-i", "-",
            "-c:v", "libopenh264", "-b:v", "1600k", "-g", str(FPS * 2),
            "-pix_fmt", "yuv420p", "-an", str(silent),
        ],
        stdin=subprocess.PIPE,
        stdout=subprocess.DEVNULL,
        stderr=subprocess.DEVNULL,
    )

    paper = Image.new("RGB", (W, H), PAPER)

    def caption_word(beat, t: float) -> int:
        starts_ = beat["wstarts"]
        if not starts_:
            return 0
        k = bisect.bisect_right(starts_, t) - 1
        return max(0, min(k, len(starts_) - 1))

    for f in range(n_frames):
        t = f / FPS
        j = bisect.bisect_right(starts, t) - 1
        if j < 0:
            j = 0
        nxt = j + 1
        cross = (
            nxt < len(beats)
            and beats[nxt]["fade"] > 0
            and beats[nxt]["img"] is not beats[j]["img"]
            and t >= starts[nxt] - beats[nxt]["fade"]
        )
        if cross:
            span = beats[nxt]["fade"]
            begin = starts[nxt] - span
            incoming = beats[nxt]["img"]
            if beats[nxt]["slide"] != beats[j]["slide"]:
                # Page turn: let the old slide dissolve to paper, then let the
                # new one resolve out of it. Two different layouts never
                # double-expose into each other.
                half = begin + span / 2
                if t < half:
                    frame = Image.blend(beats[j]["img"], paper, smoothstep((t - begin) / (span / 2)))
                else:
                    frame = Image.blend(paper, incoming, smoothstep((t - half) / (span / 2)))
            else:
                frame = Image.blend(beats[j]["img"], incoming, smoothstep((t - begin) / span))
        else:
            frame = beats[j]["img"].copy()
        draw_caption(frame, beats[j]["text"], caption_word(beats[j], t))
        proc.stdin.write(frame.tobytes())

    proc.stdin.close()
    if proc.wait() != 0:
        raise SystemExit("ffmpeg frame encode failed")

    final = OUT / f"lecture-{lid}.mp4"
    subprocess.check_call(
        [
            "ffmpeg", "-y", "-i", str(silent), "-i", str(master_wav),
            "-c:v", "copy", "-c:a", "aac", "-b:a", "160k", "-shortest",
            "-movflags", "+faststart", str(final),
        ],
        stdout=subprocess.DEVNULL,
        stderr=subprocess.DEVNULL,
    )
    subprocess.check_call(
        ["ffmpeg", "-y", "-i", str(master_wav), "-codec:a", "libmp3lame", "-b:a", "160k", str(AUDIO / f"{lid}.mp3")],
        stdout=subprocess.DEVNULL,
        stderr=subprocess.DEVNULL,
    )

    poster = beats[0]["img"].copy()
    draw_caption(poster, beats[0]["text"], 0)
    poster.convert("RGB").save(OUT / f"lecture-{lid}.jpg", quality=90)

    print(
        f"{lid:12s} slides={total:2d} beats={len(beats):3d}  "
        f"{total_seconds / 60:.2f} min  {final.stat().st_size / 1e6:.1f} MB"
    )


def main():
    wanted = set(sys.argv[1:])
    OUT.mkdir(parents=True, exist_ok=True)
    kind = backend()
    print(f"voice: {kind}")
    for lesson in LESSONS:
        if wanted and lesson["id"] not in wanted:
            continue
        build(lesson, kind)


if __name__ == "__main__":
    main()
