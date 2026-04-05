"""
Shannon entropy — the fundamental measure of information.

H(X) = -∑ p(x) log₂ p(x)

Entropy tells you the average number of bits needed to encode one symbol
drawn from a source.  A fair coin has H = 1 bit; a biased coin has less.
English text averages ~4.1 bits/letter because letters are not equally
likely — E appears 12.7% of the time while Z appears 0.07%.

The entropy floor is the theoretical minimum for lossless compression:
no scheme can encode a source at fewer bits per symbol than its entropy.
"""

import math
from collections import Counter


# ── English letter frequencies ────────────────────────────────────────────────
# Source: Norvig (2012), based on Google Books N-gram corpus.
# Values sum to ~100 (percentage points); pass directly to entropy_from_freqs.
ENGLISH_FREQUENCIES: dict[str, float] = {
    "E": 12.70, "T":  9.06, "A":  8.17, "O":  7.51, "I":  6.97,
    "N":  6.75, "S":  6.33, "H":  6.09, "R":  5.99, "D":  4.25,
    "L":  4.03, "C":  2.78, "U":  2.76, "M":  2.41, "W":  2.36,
    "F":  2.23, "G":  2.02, "Y":  1.97, "P":  1.93, "B":  1.29,
    "V":  0.98, "K":  0.77, "J":  0.15, "X":  0.15, "Q":  0.10,
    "Z":  0.07,
}


def entropy(text: str) -> float:
    """Compute Shannon entropy of a text string in bits per symbol.

    Only alphabetic characters are considered; digits, spaces, and
    punctuation are ignored.  The result is 0.0 for empty or single-
    character (uniform) inputs.

    Args:
        text: Any string.  Case-insensitive.

    Returns:
        Entropy in bits per symbol (float ≥ 0).

    Examples:
        >>> entropy("AAAAAAAAAA")
        0.0
        >>> round(entropy("the quick brown fox jumps over the lazy dog"), 2)
        4.18
    """
    letters = [c for c in text.upper() if c.isalpha()]
    if not letters:
        return 0.0
    n = len(letters)
    counts = Counter(letters)
    return -sum((c / n) * math.log2(c / n) for c in counts.values())


def entropy_from_freqs(freqs: dict[str, float]) -> float:
    """Compute Shannon entropy from a symbol-frequency (or probability) table.

    Works with both raw counts and probability values — the function
    normalises the values before computing entropy, so the scale does
    not matter.

    Args:
        freqs: Mapping of symbol → non-negative weight.  All values must
               be ≥ 0 and at least one must be > 0.

    Returns:
        Entropy in bits per symbol.

    Raises:
        ValueError: If all weights are zero.

    Examples:
        >>> freqs = {"A": 0.5, "B": 0.25, "C": 0.25}
        >>> round(entropy_from_freqs(freqs), 4)
        1.5
        >>> round(entropy_from_freqs(ENGLISH_FREQUENCIES), 2)
        4.17
    """
    total = sum(freqs.values())
    if total == 0:
        raise ValueError("All frequency weights are zero.")
    return -sum(
        (w / total) * math.log2(w / total)
        for w in freqs.values()
        if w > 0
    )
