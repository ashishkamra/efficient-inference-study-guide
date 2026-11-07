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
