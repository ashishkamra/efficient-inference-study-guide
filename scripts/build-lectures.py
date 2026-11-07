#!/usr/bin/env python3
"""Build the Ridge narrated lectures.

One slide per narration segment: the words are synthesised first, the diagram is
rendered, and the slide is held for exactly the length of its audio. That keeps
the picture locked to the voice with no speech-to-text alignment step.

    python3 scripts/build-lectures.py            # build every lesson
    python3 scripts/build-lectures.py kv systems # build selected lessons

TTS is Kokoro-82M running locally through onnxruntime. The model files are
downloaded once into narration/.tts-model (gitignored).
"""

from __future__ import annotations

import hashlib
import json
import shutil
import subprocess
import sys
import urllib.request
import wave
from pathlib import Path

import numpy as np

ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT / "scripts"))

from diagrams import CAPTIONS, DRAW  # noqa: E402
from lectures import LESSONS  # noqa: E402
from slidekit import render_slide  # noqa: E402

AUDIO = ROOT / "narration"
OUT = ROOT / "public" / "videos"
CACHE = AUDIO / ".tts-model"
WORK = AUDIO / ".build"
MODEL = CACHE / "kokoro-v1.0.onnx"
VOICES = CACHE / "voices-v1.0.bin"
MODEL_URL = "https://github.com/thewh1teagle/kokoro-onnx/releases/download/model-files-v1.0/kokoro-v1.0.onnx"
VOICES_URL = "https://github.com/thewh1teagle/kokoro-onnx/releases/download/model-files-v1.0/voices-v1.0.bin"

VOICE = "af_heart"
SPEED = 0.96
GAP = 0.32  # seconds of silence between slides
TAIL = 0.6

# Spoken forms for tokens the phonemiser would guess badly.
PRONOUNCE = {
    "KIVI": "kee vee",
    "SGLang": "S G Lang",
    "vLLM": "v L L M",
    "GPTQ": "G P T Q",
    "AWQ": "A W Q",
    "MoE": "mixture of experts",
    "GQA": "G Q A",
    "MQA": "M Q A",
    "MLA": "M L A",
    "TTFT": "T T F T",
    "TPOT": "T P O T",
    "SLO": "S L O",
    "HBM": "H B M",
    "SRAM": "S ram",
    "INT4": "int four",
    "INT8": "int eight",
    "FP16": "F P sixteen",
    "FP8": "F P eight",
    "W4A8": "W four A eight",
    "RWKV": "R W K V",
    "EAGLE": "eagle",
    "RadixAttention": "radix attention",
    "FlashAttention": "flash attention",
    "PagedAttention": "paged attention",
    "DistServe": "dist serve",
    "QuIP": "quip",
}

_kokoro = None


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


def spoken(text: str) -> str:
    for term, say in PRONOUNCE.items():
        text = text.replace(term, say)
    return text


def synth(text: str, dest: Path):
    """Synthesize one segment, cached on a hash of voice + text."""
    digest = hashlib.sha1(f"{VOICE}|{SPEED}|{text}".encode()).hexdigest()[:16]
    meta = dest.with_suffix(".json")
    if dest.exists() and meta.exists() and json.loads(meta.read_text()).get("hash") == digest:
        return
    samples, sr = engine().create(spoken(text), voice=VOICE, speed=SPEED, lang="en-us")
    data = (np.clip(samples, -1, 1) * 32767).astype(np.int16)
    with wave.open(str(dest), "wb") as w:
        w.setnchannels(1)
        w.setsampwidth(2)
        w.setframerate(sr)
        w.writeframes(data.tobytes())
    meta.write_text(json.dumps({"hash": digest, "sr": sr}))
    print(f"  tts {dest.name} {len(samples) / sr:.1f}s")


def read_wav(path: Path) -> tuple[np.ndarray, int]:
    with wave.open(str(path), "rb") as w:
        sr = w.getframerate()
        data = np.frombuffer(w.readframes(w.getnframes()), dtype=np.int16)
    return data, sr


def duration(path: Path) -> float:
    data, sr = read_wav(path)
    return len(data) / sr


def build(lesson):
    lid = lesson["id"]
    work = WORK / lid
    work.mkdir(parents=True, exist_ok=True)
    frames = AUDIO / f"{lid}-aligned"
    frames.mkdir(exist_ok=True)
    for old in frames.glob("*"):
        old.unlink()

    segments = []
    cursor = 0.0
    gap = np.zeros(int(24000 * GAP), dtype=np.int16)
    master = []
    starts = []
    for i, slide in enumerate(lesson["slides"], start=1):
        wav = work / f"seg-{i:02d}.wav"
        synth(slide["say"], wav)
        data, sr = read_wav(wav)
        if sr != 24000:
            raise SystemExit(f"unexpected sample rate {sr}")
        starts.append(cursor)
        cursor += len(data) / sr + GAP
        master.append(data)
        master.append(gap)
        png = frames / f"s{i:02d}.png"
        draw = DRAW[slide["fig"]]
        params = dict(slide.get("params") or {})
        layout = slide.get("layout", "split")
        render_slide(
            png,
            lesson["kicker"],
            slide["head"],
            slide.get("bullets", []),
            lambda d, box, f=draw, p=params: f(d, box, **p),
            i,
            len(lesson["slides"]),
            layout=layout,
            tag=slide.get("tag"),
            caption=CAPTIONS.get(slide["fig"]),
        )
        segments.append((png, len(data) / sr + GAP))

    # master narration: segments + trailing silence
    master.append(np.zeros(int(24000 * TAIL), dtype=np.int16))
    audio = np.concatenate(master)
    master_mp3 = AUDIO / f"{lid}.mp3"
    tmp_wav = work / "master.wav"
    with wave.open(str(tmp_wav), "wb") as w:
        w.setnchannels(1)
        w.setsampwidth(2)
        w.setframerate(24000)
        w.writeframes(audio.tobytes())
    subprocess.check_call(
        ["ffmpeg", "-y", "-i", str(tmp_wav), "-codec:a", "libmp3lame", "-b:a", "160k", str(master_mp3)],
        stdout=subprocess.DEVNULL,
        stderr=subprocess.DEVNULL,
    )

    lines = []
    for png, dur in segments:
        lines.append(f"file '{png}'\n")
        lines.append(f"duration {dur:.3f}\n")
    lines.append(f"file '{segments[-1][0]}'\n")
    (frames / "concat.txt").write_text("".join(lines))

    silent = work / "silent.mp4"
    subprocess.check_call(
        [
            "ffmpeg", "-y", "-f", "concat", "-safe", "0", "-i", str(frames / "concat.txt"),
            "-vf", "fps=24,format=yuv420p",
            "-c:v", "libopenh264", "-b:v", "1600k", "-g", "48",
            "-pix_fmt", "yuv420p", "-an", str(silent),
        ],
        stdout=subprocess.DEVNULL,
        stderr=subprocess.DEVNULL,
    )

    final = OUT / f"lecture-{lid}.mp4"
    subprocess.check_call(
        [
            "ffmpeg", "-y", "-i", str(silent), "-i", str(tmp_wav),
            "-c:v", "copy", "-c:a", "aac", "-b:a", "160k", "-shortest",
            "-movflags", "+faststart", str(final),
        ],
        stdout=subprocess.DEVNULL,
        stderr=subprocess.DEVNULL,
    )

    from PIL import Image

    Image.open(frames / "s01.png").convert("RGB").save(OUT / f"lecture-{lid}.jpg", quality=90)
    total = cursor + TAIL
    print(f"{lid:12s} slides={len(segments):2d}  {total/60:.2f} min  {final.stat().st_size/1e6:.1f} MB")


def main():
    wanted = set(sys.argv[1:])
    OUT.mkdir(parents=True, exist_ok=True)
    for lesson in LESSONS:
        if wanted and lesson["id"] not in wanted:
            continue
        print(lesson["id"])
        build(lesson)


if __name__ == "__main__":
    main()
