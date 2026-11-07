#!/usr/bin/env python3
"""Render the lecture voice on the GPU box with XTTS-v2.

Every beat (one sentence) is synthesised once and cached on a hash of the
speaker and the spoken text, so changing a slide only re-renders the sentences
that changed.

    python3 scripts/voice-gpu.py             # everything missing
    python3 scripts/voice-gpu.py kv systems  # selected lessons
    python3 scripts/voice-gpu.py --voice "Ana Florence"

Requires ssh access to the GPU host (RIDGE_GPU_HOST, RIDGE_GPU_KEY) with the
`ridge-tts` virtualenv built by `scripts/gpu_xtts.py`'s header.
"""

from __future__ import annotations

import json
import os
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT / "scripts"))

from beats import slide_beats  # noqa: E402
from lectures import LESSONS  # noqa: E402
from speech import clip_hash, spoken  # noqa: E402

AUDIO = ROOT / "narration"
CACHE = AUDIO / ".tts-gpu"
BUILD = AUDIO / ".build"

HOST = os.environ.get("RIDGE_GPU_HOST", "akamra@192.168.86.196")
KEY = os.environ.get("RIDGE_GPU_KEY", str(Path.home() / ".ssh" / "id_rsa"))
DEFAULT_VOICE = "Ana Florence"

SSH = ["ssh", "-o", "BatchMode=yes", "-i", KEY, HOST]
RSYNC = ["rsync", "-az", "-e", f"ssh -o BatchMode=yes -i {KEY}"]


def collect(lesson_ids: list[str]) -> list[dict]:
    jobs = []
    seen = set()
    for lesson in LESSONS:
        if lesson_ids and lesson["id"] not in lesson_ids:
            continue
        for slide in lesson["slides"]:
            for beat in slide_beats(slide["say"], slide.get("bullets", [])):
                text = spoken(beat.text)
                digest = clip_hash(text, VOICE)
                if digest in seen:
                    continue
                seen.add(digest)
                jobs.append({"hash": digest, "text": text})
    return jobs


VOICE = DEFAULT_VOICE


def main() -> int:
    global VOICE
    args = sys.argv[1:]
    if "--voice" in args:
        i = args.index("--voice")
        VOICE = args[i + 1]
        del args[i : i + 2]

    jobs = collect(args)
    CACHE.mkdir(parents=True, exist_ok=True)
    missing = [j for j in jobs if not (CACHE / f"{j['hash']}.wav").exists()]
    print(f"{len(jobs)} beats, {len(jobs) - len(missing)} cached, {len(missing)} to render")
    if not missing:
        return 0

    BUILD.mkdir(parents=True, exist_ok=True)
    local_jobs = BUILD / "xtts-jobs.json"
    local_jobs.write_text(json.dumps(missing, indent=1))

    subprocess.check_call([*SSH, "mkdir -p ~/ridge-tts-jobs/out"])
    subprocess.check_call(["scp", "-q", "-i", KEY, str(local_jobs), f"{HOST}:~/ridge-tts-jobs/jobs.json"])
    subprocess.check_call(
        ["scp", "-q", "-i", KEY, str(ROOT / "scripts" / "gpu_xtts.py"), f"{HOST}:~/ridge-tts-jobs/gpu_xtts.py"]
    )
    remote = (
        "COQUI_TOS_AGREED=1 ~/ridge-tts/bin/python ~/ridge-tts-jobs/gpu_xtts.py "
        f"~/ridge-tts-jobs/jobs.json ~/ridge-tts-jobs/out {json.dumps(VOICE)}"
    )
    print("rendering on GPU:", HOST)
    subprocess.check_call([*SSH, remote])
    subprocess.check_call([*RSYNC, f"{HOST}:~/ridge-tts-jobs/out/", str(CACHE) + "/"])

    still = [j for j in jobs if not (CACHE / f"{j['hash']}.wav").exists()]
    if still:
        print(f"missing {len(still)} clips after sync", file=sys.stderr)
        return 1
    (CACHE / "READY").write_text(f"{VOICE}\t{len(jobs)}\n")
    print(f"voice cache ready: {CACHE}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
