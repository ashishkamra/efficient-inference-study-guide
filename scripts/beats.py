"""Split slide narration into beats and bind each beat to a slide bullet.

The narration is written as prose, the slide as two short claims. This module
finds the sentence ranges that talk about each claim so the renderer can
highlight the bullet being spoken and dim the others.

Alignment is monotone: a slide's sentences may only move forward through its
bullets, which matches how the storyboards are written (first claim, then the
second). Scores are content-word overlap, so "Training is paid once, then
amortized..." pulls the "Training is paid once." bullet.
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

# Deliberate bias: a claim is usually introduced before it is elaborated, and
# the closing sentence usually belongs to the last claim.
POSITION_BIAS = 0.06
# Moving to the next claim costs a little: filler sentences ("It is compute
# bound.") should stay with the claim they elaborate instead of opening a group.
BOUNDARY = 0.10


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


def overlap(sentence: str, bullet: str) -> float:
    """Fraction of the bullet's content words that the sentence mentions."""
    want = set(content(bullet))
    if not want:
        return 0.0
    have = set(content(sentence))
    shared = want & have
    # Token overlap dominates; a small exact-phrase bonus rewards paraphrases
    # that keep the bullet's wording.
    score = len(shared) / len(want)
    score += 0.12 * len(shared)
    return score


def match_score(sentence: str, bullet: str, index: int, count: int) -> float:
    score = overlap(sentence, bullet)
    if count > 1:
        # Extremely light pull toward the natural speaking order.
        score += POSITION_BIAS * (1.0 - abs(index / (count - 1) - 0.5) * 2)
    return score


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
    """Assign each sentence to a bullet, non-decreasing, every bullet used."""
    n, m = len(sentences), len(bullets)
    if m == 0 or n == 0:
        return [-1] * n
    if n < m:
        # More claims than sentences: spread the sentences as best we can.
        return [min(i, m - 1) for i in range(n)]

    table = [
        [match_score(s, bullet, j, m) for j, bullet in enumerate(bullets)]
        for s in sentences
    ]

    # dp[j][i] = best score for bullets 0..j covering sentences 0..i-1.
    neg = float("-inf")
    dp = [[neg] * (n + 1) for _ in range(m)]
    back = [[0] * (n + 1) for _ in range(m)]
    dp[0][0] = 0.0
    for i in range(1, n + 1):
        dp[0][i] = dp[0][i - 1] + table[i - 1][0]
        back[0][i] = 0 if i > 1 else i - 1
    for j in range(1, m):
        for i in range(1, n + 1):
            best, best_k = neg, 0
            # bullet j must take at least one sentence: k <= i-1
            for k in range(j, i):
                if dp[j - 1][k] == neg:
                    continue
                value = dp[j - 1][k] - BOUNDARY + sum(table[t][j] for t in range(k, i))
                if value > best:
                    best, best_k = value, k
            dp[j][i] = best
            back[j][i] = best_k
    if dp[m - 1][n] == neg:
        return [min(i, m - 1) for i in range(n)]

    cuts = [n]
    i = n
    for j in range(m - 1, 0, -1):
        i = back[j][i]
        cuts.append(i)
    cuts.append(0)
    cuts.reverse()  # [0, cut1, cut2, ..., n]

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
