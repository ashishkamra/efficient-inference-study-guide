"""Spoken forms for tokens a TTS front end would guess badly.

Both the local Kokoro path and the GPU XTTS path apply this before synthesis so
a cached clip is keyed on exactly the words that were spoken.
"""

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


def spoken(text: str) -> str:
    for term, say in PRONOUNCE.items():
        text = text.replace(term, say)
    return text


def clip_hash(text: str, voice: str) -> str:
    """Stable name for one synthesised sentence."""
    import hashlib

    return hashlib.sha1(f"xtts-v2|{voice}|{text}".encode()).hexdigest()[:16]


def syllables(text: str) -> int:
    """Rough syllable count, enough to weight word durations."""
    import re

    word = re.sub(r"[^a-z]", "", text.lower())
    if not word:
        return 1
    groups = re.findall(r"[aeiouy]+", word)
    count = len(groups)
    if count > 1 and word.endswith("e") and not word.endswith(("le", "ee", "ye")):
        count -= 1
    return max(1, count)


def _spoken_syllables(word: str) -> int:
    """Syllables after pronunciation fixes; "TPOT" is four spoken pieces."""
    return sum(syllables(piece) for piece in spoken(word).split()) or 1


def _weight(word: str) -> float:
    weight = 0.45 + 0.6 * _spoken_syllables(word)
    tail = word[-1] if word else ""
    if tail in ",;:":
        weight += 0.9
    elif tail in ".!?":
        weight += 1.8
    return weight


def _phrases(display: list[str]) -> list[list[str]]:
    """Split the words at punctuation, where the voice is likely to pause."""
    groups: list[list[str]] = []
    cur: list[str] = []
    for word in display:
        cur.append(word)
        if word and word[-1] in ",;:.!?":
            groups.append(cur)
            cur = []
    if cur:
        groups.append(cur)
    return groups


def _choose_pauses(
    groups: list[list[str]], pauses: list[tuple[float, float]], duration: float
) -> list[tuple[float, float]] | None:
    """Pick the silences that line up with punctuation boundaries.

    The voice inserts pauses at commas and colons, but also mid-clause, and the
    mid-clause ones can be longer. Choosing the longest silences would then
    plant a boundary in the wrong place. Instead, estimate where each boundary
    should fall from syllable weight and pick the pause closest to it.
    """
    needed = len(groups) - 1
    if needed <= 0:
        return []
    # Very short dips are consonant closures or the gaps between spoken
    # letters ("T P O T"), not punctuation.
    pauses = [p for p in sorted(pauses) if p[1] - p[0] >= 0.22]
    if len(pauses) < needed:
        return None
    if len(pauses) == needed:
        return pauses

    flat = [word for group in groups for word in group]
    weights = [0.45 + 0.6 * _spoken_syllables(word) for word in flat]
    total = sum(weights)
    expected = []
    acc = 0.0
    at = 0
    for group in groups[:-1]:
        acc += sum(weights[at : at + len(group)])
        at += len(group)
        expected.append(duration * acc / total)

    from itertools import combinations

    best = None
    best_cost = float("inf")
    for combo in combinations(pauses, needed):
        # Prefer a pause near the expected boundary, and prefer longer pauses:
        # punctuation dwells longer than the breath inside a clause.
        cost = sum(
            abs((start + end) / 2 - want) - (end - start)
            for (start, end), want in zip(combo, expected)
        )
        if cost < best_cost:
            best, best_cost = combo, cost
    return list(best) if best else None


def word_timings(
    text: str,
    duration: float,
    pauses: list[tuple[float, float]] = (),
) -> list[tuple[float, float]]:
    """Estimate when each displayed word is spoken inside one clip.

    XTTS does not expose word boundaries, so words are weighted by the syllables
    of their spoken form. The measured silent spans are used to pin punctuation
    pauses to the audio: the words before a pause are distributed across the
    voiced span ahead of it, and the last word stays lit through the pause
    itself. Without matching silences the whole sentence is distributed evenly,
    which still tracks, just less tightly at commas.
    """
    display = text.split()
    if not display:
        return []

    groups = _phrases(display)
    chosen = _choose_pauses(groups, pauses, duration)
    cuts = chosen if chosen is not None else []

    starts: list[float] = []
    if chosen is not None:
        for i, group in enumerate(groups):
            begin = 0.0 if i == 0 else cuts[i - 1][1]
            end = cuts[i][0] if i < len(cuts) else duration
            span = max(0.01, end - begin)
            weights = [_weight(word) for word in group]
            total = sum(weights)
            acc = 0.0
            for weight in weights:
                starts.append(begin + span * acc / total)
                acc += weight
    else:
        weights = [_weight(word) for word in display]
        total = sum(weights)
        acc = 0.0
        for weight in weights:
            starts.append(duration * acc / total)
            acc += weight

    out = []
    for i, start in enumerate(starts):
        end = starts[i + 1] if i + 1 < len(starts) else duration
        out.append((round(start, 3), round(max(0.02, end - start), 3)))
    return out
