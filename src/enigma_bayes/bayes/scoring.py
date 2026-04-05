"""
Scoring functions for Bayesian Enigma decoding.

Two complementary approaches are implemented here:

1. **Index of Coincidence (IoC)** — a classical cryptanalysis statistic.
   A random substitution cipher has IoC ≈ 0.038. English plaintext has
   IoC ≈ 0.067. A decryption attempt that yields high IoC is probably
   correct plaintext.

2. **Turing's Bans / Decibans** — Turing's own weight-of-evidence scale.
   A "ban" is log₁₀(10) = 1 unit on the log-odds scale. A "deciban"
   (1/10 of a ban) was the practical unit used at Bletchley Park.
   Turing showed that roughly 3 bans (30 decibans) of evidence — meaning
   1000:1 odds — was a reliable threshold for accepting a hypothesis.
"""

import math
import numpy as np

# ── English letter frequencies (source: Norvig, based on Google N-grams) ─────
ENGLISH_FREQUENCIES: dict[str, float] = {
    "A": 0.08167, "B": 0.01492, "C": 0.02782, "D": 0.04253,
    "E": 0.12702, "F": 0.02228, "G": 0.02015, "H": 0.06094,
    "I": 0.06966, "J": 0.00153, "K": 0.00772, "L": 0.04025,
    "M": 0.02406, "N": 0.06749, "O": 0.07507, "P": 0.01929,
    "Q": 0.00095, "R": 0.05987, "S": 0.06327, "T": 0.09056,
    "U": 0.02758, "V": 0.00978, "W": 0.02360, "X": 0.00150,
    "Y": 0.01974, "Z": 0.00074,
}

# Smoothed English frequency array (index = letter ordinal, A=0)
_ENG_FREQ = np.array([ENGLISH_FREQUENCIES[chr(i + ord("A"))] for i in range(26)])


def index_of_coincidence(text: str) -> float:
    """
    Compute the Index of Coincidence for a string of alphabetic characters.

    IC = Σ n_i(n_i - 1) / (N(N-1))

    where n_i is the count of letter i and N is the total letter count.

    Reference values:
      - Random (uniform) text:  IC ≈ 0.0385
      - English plaintext:      IC ≈ 0.0667

    Args:
        text: Any string; non-alphabetic characters are ignored.

    Returns:
        IC value, or 0.0 if fewer than 2 alphabetic characters.
    """
    text = "".join(c for c in text.upper() if c.isalpha())
    n = len(text)
    if n < 2:
        return 0.0
    counts = np.array([text.count(chr(i + ord("A"))) for i in range(26)])
    return float(np.sum(counts * (counts - 1)) / (n * (n - 1)))


def log_likelihood_english(text: str) -> float:
    """
    Score how "English-like" a text is using log-likelihood against known frequencies.

    A higher (less negative) score means the text looks more like English.
    This is used as the likelihood P(text | setting is correct) in the
    Bayesian decoder.

    Args:
        text: Decrypted candidate text (non-alpha characters ignored).

    Returns:
        Sum of log-probabilities for each letter under the English model.
        Returns a large negative number for empty input.
    """
    text = "".join(c for c in text.upper() if c.isalpha())
    if not text:
        return -1e10
    score = 0.0
    for letter in text:
        freq = ENGLISH_FREQUENCIES.get(letter, 1e-10)
        score += math.log(freq)
    return score


def enigma_constraint_satisfied(plaintext_attempt: str, ciphertext_fragment: str) -> bool:
    """
    Check the fundamental Enigma constraint: no letter encrypts to itself.

    This is the single most powerful tool available to codebreakers. Because
    the reflector forces the signal to take a different path on the return
    journey, A can never encrypt to A, B never to B, and so on.

    If we try a candidate setting and find that ANY letter of our crib
    (known plaintext) would map to itself in the ciphertext, we can
    *immediately discard* that setting — no probability calculation needed.

    Args:
        plaintext_attempt:  The suspected plaintext (e.g., our crib).
        ciphertext_fragment: The corresponding ciphertext segment.

    Returns:
        True if the constraint holds (no self-encryption found).
        False if any letter maps to itself — this setting is impossible.
    """
    for p, c in zip(plaintext_attempt.upper(), ciphertext_fragment.upper()):
        if p.isalpha() and p == c:
            return False
    return True


# ── Turing's Ban / Deciban system ─────────────────────────────────────────────

def weight_of_evidence(p_given_h: float, p_given_not_h: float) -> float:
    """
    Compute the weight of evidence in *bans* (Turing's unit).

    W = log₁₀( P(evidence | H) / P(evidence | ¬H) )

    A positive value means the evidence supports hypothesis H.
    A negative value means it counts against H.
    Each ban corresponds to a 10× change in odds.

    Args:
        p_given_h:     Probability of the evidence if H is true.
        p_given_not_h: Probability of the evidence if H is false.

    Returns:
        Weight in bans. 1 ban = 10 decibans.
    """
    if p_given_not_h <= 0:
        return float("inf")
    return math.log10(p_given_h / p_given_not_h)


def to_bans(likelihood_ratio: float) -> float:
    """Convert a likelihood ratio to bans: bans = log₁₀(LR)."""
    return math.log10(likelihood_ratio)


def to_decibans(likelihood_ratio: float) -> float:
    """Convert a likelihood ratio to decibans: decibans = 10 × log₁₀(LR)."""
    return 10.0 * math.log10(likelihood_ratio)


def from_bans(bans: float) -> float:
    """Convert bans back to a likelihood ratio: LR = 10^bans."""
    return 10.0 ** bans


def bans_to_posterior_odds(prior_odds: float, bans: float) -> float:
    """
    Update prior odds with a weight of evidence in bans.

    In log-odds space:  log10(posterior_odds) = log10(prior_odds) + bans

    This is the sequential Bayesian update in Turing's framework:
    evidence *adds* to the log-odds score rather than *multiplying*.

    Args:
        prior_odds: Odds before seeing the evidence.
        bans:       Weight of evidence in bans.

    Returns:
        Posterior odds.
    """
    log_prior = math.log10(prior_odds)
    log_posterior = log_prior + bans
    return 10.0 ** log_posterior
