"""Split slide narration into beats and bind each beat to a slide bullet.

The narration is written as prose, the slide as two short claims. This module
finds the sentence ranges that talk about each claim so the renderer can
highlight the bullet being spoken and dim the others.

Every claim opens with a sentence that echoes its bullet, so alignment looks for
that opening rather than guessing from overall overlap. A bullet starts at the
first sentence whose leading words cover most of the bullet's content words;
filler and elaboration between two openings stays with the claim it explains.
This keeps "That makes it compute bound." with prefill instead of handing it to
the next claim just because the sentence count divides evenly.
"""

from __future__ import annotations

import re
from dataclasses import dataclass

SENTENCE_RE = re.compile(r"(?<=[.!?])\s+")

STOP = {
    "a", "an", "the", "and", "or", "but", "if", "then", "than", "so", "to",
    "of", "in", "on", "at", "by", "for", "with", "from", "into", "over",
    "is", "are", "was", "were", "be", "been", "being", "am", "do", "does",
    "did", "has", "have", "had", "can", "could", "will", "would", "should",
    "may", "might", "must", "it", "its", "this", "that", "these", "those",
    "there", "their", "they", "them", "we", "you", "your", "our", "i", "as",
    "not", "no", "yes", "very", "just", "also", "only", "more", "most",
    "much", "many", "some", "any", "all", "each", "every", "one", "two",
    "both", "same", "other", "such", "what", "which", "who", "when", "where",
    "why", "how", "up", "out", "about", "across", "per", "via", "vs",
}

# A sentence counts as a claim's opening when its first few words cover this
# much of the bullet. Below the threshold the closest candidate wins.
ECHO = 0.6


def split_sentences(text: str) -> list[str]:
    """Split narration into sentences, keeping abbreviations and decimals."""
    text = re.sub(r"\s+", " ", text.strip())
    parts = SENTENCE_RE.split(text)
    out: list[str] = []
    for part in parts:
        part = part.strip()
        if part:
            out.append(part)
    return out


def words(text: str) -> list[str]:
    return re.findall(r"[a-z0-9']+", text.lower())


def stem(word: str) -> str:
    """Small suffix stripper: enough for training/trained/trains to collide."""
    w = word.strip("'")
    for suffix in ("ations", "ation", "ings", "ing", "ies", "ied", "ers", "er", "ed", "es", "s"):
        if w.endswith(suffix) and len(w) - len(suffix) >= 4:
            return w[: -len(suffix)]
    return w


def content(text: str) -> list[str]:
    return [stem(w) for w in words(text) if w not in STOP and len(w) > 2]


def echo_score(sentence: str, bullet: str) -> float:
    """How much of the bullet the sentence's opening words cover."""
    want = set(content(bullet))
    if not want:
        return 0.0
    head = {
        stem(word)
        for word in words(sentence)[: max(8, len(want) + 3)]
        if word not in STOP
    }
    return len(want & head) / len(want)


@dataclass
class Beat:
    text: str
    bullet: int  # index of the active bullet, or -1 when the slide has none
    keywords: tuple[str, ...] = ()


def match_keywords(sentence: str, bullet: str) -> tuple[str, ...]:
    """Bullet words the sentence actually says, to emphasise in the render."""
    have = set(content(sentence))
    out: list[str] = []
    for raw in re.findall(r"[A-Za-z0-9']+", bullet):
        if raw.lower() in STOP or len(raw) < 4:
            continue
        if stem(raw.lower()) in have and raw not in out:
            out.append(raw)
    return tuple(out)


def align_sentences(sentences: list[str], bullets: list[str]) -> list[int]:
    """Assign each sentence to a bullet, non-decreasing, every bullet used.

    The first bullet starts at sentence zero. Each later bullet starts at the
    first sentence after the previous boundary whose opening echoes the bullet;
    when no sentence clears the threshold, the closest opening wins.
    """
    n, m = len(sentences), len(bullets)
    if m == 0 or n == 0:
        return [-1] * n
    if n < m:
        # More claims than sentences: spread the sentences as best we can.
        return [min(i, m - 1) for i in range(n)]

    cuts = [0]
    prev = 0
    for j in range(1, m):
        earliest = prev + 1
        # Leave one sentence for each claim that still has to start.
        latest = n - (m - j)
        if earliest > latest:
            cuts.append(min(earliest, n))
            prev = cuts[-1]
            continue

        pick = None
        best_i, best = latest, -1.0
        for i in range(earliest, latest + 1):
            score = echo_score(sentences[i], bullets[j])
            if score >= ECHO:
                pick = i
                break
            if score > best:
                best, best_i = score, i
        i = pick if pick is not None else best_i
        cuts.append(i)
        prev = i
    cuts.append(n)

    out = []
    for j in range(m):
        out.extend([j] * (cuts[j + 1] - cuts[j]))
    return out


def slide_beats(say: str, bullets: list[str]) -> list[Beat]:
    sentences = split_sentences(say)
    assignment = align_sentences(sentences, bullets)
    beats = []
    for sentence, bullet in zip(sentences, assignment):
        keywords = match_keywords(sentence, bullets[bullet]) if bullet >= 0 else ()
        beats.append(Beat(text=sentence, bullet=bullet, keywords=keywords))
    return beats
