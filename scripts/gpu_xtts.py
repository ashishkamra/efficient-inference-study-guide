#!/usr/bin/env python3
"""Batched XTTS-v2 synthesis, run on the GPU box.

    python gpu_xtts.py jobs.json out_dir [speaker]

jobs.json is a list of {"hash": ..., "text": ...}. One WAV per job is written to
out_dir/<hash>.wav at the model's native 24 kHz. Existing files are skipped, so
an interrupted run can just be restarted. Progress goes to stdout one line per
clip so the caller can watch it over ssh.
"""

from __future__ import annotations

import json
import os
import sys
import wave

os.environ.setdefault("COQUI_TOS_AGREED", "1")

import numpy as np  # noqa: E402

SPEAKER = "Ana Florence"
MODEL = "tts_models/multilingual/multi-dataset/xtts_v2"


def main() -> int:
    if len(sys.argv) < 3:
        print("usage: gpu_xtts.py jobs.json out_dir [speaker]", file=sys.stderr)
        return 2
    jobs = json.load(open(sys.argv[1]))
    out_dir = sys.argv[2]
    speaker = sys.argv[3] if len(sys.argv) > 3 else SPEAKER
    os.makedirs(out_dir, exist_ok=True)

    from TTS.api import TTS

    tts = TTS(MODEL, progress_bar=False).to("cuda")
    rate = tts.synthesizer.output_sample_rate

    done = 0
    for i, job in enumerate(jobs, 1):
        path = os.path.join(out_dir, f"{job['hash']}.wav")
        if os.path.exists(path) and os.path.getsize(path) > 2000:
            continue
        kwargs = dict(
            text=job["text"],
            speaker=speaker,
            language="en",
            temperature=0.68,
            top_p=0.82,
            repetition_penalty=5.0,
            speed=1.0,
        )
        try:
            wav = tts.tts(split_sentences=False, **kwargs)
        except TypeError:
            wav = tts.tts(**kwargs)
        data = np.clip(np.asarray(wav, dtype=np.float32), -1.0, 1.0)
        pcm = (data * 32767).astype(np.int16)
        tmp = path + ".part"
        with wave.open(tmp, "wb") as w:
            w.setnchannels(1)
            w.setsampwidth(2)
            w.setframerate(rate)
            w.writeframes(pcm.tobytes())
        os.replace(tmp, path)
        done += 1
        if i % 10 == 0 or i == len(jobs):
            print(f"[{i}/{len(jobs)}] {len(data) / rate:.1f}s  {job['text'][:52]}", flush=True)

    print(f"XTTS_DONE {done} new clips", flush=True)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
