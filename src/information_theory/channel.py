"""
Noisy channels and Shannon's channel capacity theorem.

A communication channel introduces errors.  Shannon (1948) asked: at what
rate can information be transmitted reliably over a noisy channel?

The Binary Symmetric Channel (BSC) is the simplest model: each bit is
flipped independently with probability p.  Shannon proved that the
capacity of a BSC is:

    C = 1 - H_b(p) = 1 + p·log₂(p) + (1-p)·log₂(1-p)  bits per use

Below this rate, arbitrarily reliable communication is possible.  Above
it, errors are unavoidable no matter how clever the code.

This module provides a BSC simulator and a simple repetition code —
the most intuitive (though far from optimal) error-correction scheme.
"""

import math
import random


def bsc_channel(bits: list[int], error_rate: float) -> list[int]:
    """Simulate a Binary Symmetric Channel.

    Each input bit is independently flipped with probability ``error_rate``.
    XOR with 1 flips the bit; XOR with 0 leaves it unchanged.

    Args:
        bits:       List of integers, each 0 or 1.
        error_rate: Probability of flipping each bit (0.0 – 1.0).

    Returns:
        A new list of bits after transmission through the noisy channel.

    Examples:
        >>> random.seed(0)
        >>> bsc_channel([0, 0, 0, 0, 0], error_rate=0.0)
        [0, 0, 0, 0, 0]
    """
    return [b ^ (1 if random.random() < error_rate else 0) for b in bits]


def encode_repetition(bits: list[int], n: int = 3) -> list[int]:
    """Encode bits using a repetition code of rate 1/n.

    Each input bit is repeated ``n`` times.  The encoded length is
    ``n`` times the input length.

    Args:
        bits: List of integers, each 0 or 1.
        n:    Repetition factor (must be a positive odd integer for
              majority decoding to be unambiguous).

    Returns:
        Encoded bit list of length ``len(bits) * n``.

    Examples:
        >>> encode_repetition([1, 0], n=3)
        [1, 1, 1, 0, 0, 0]
    """
    return [b for b in bits for _ in range(n)]


def decode_repetition(received: list[int], n: int = 3) -> list[int]:
    """Decode a repetition-coded bit stream by majority vote.

    Each group of ``n`` received bits is reduced to whichever value
    (0 or 1) appears more than n//2 times.

    Args:
        received: List of bits after channel transmission.  Length must
                  be a multiple of ``n``.
        n:        Repetition factor used during encoding.

    Returns:
        Decoded bit list of length ``len(received) // n``.

    Examples:
        >>> decode_repetition([1, 1, 0, 0, 0, 1], n=3)
        [1, 0]
    """
    decoded = []
    for i in range(0, len(received), n):
        block = received[i : i + n]
        decoded.append(1 if sum(block) > n // 2 else 0)
    return decoded


def bsc_capacity(error_rate: float) -> float:
    """Compute the Shannon capacity of a Binary Symmetric Channel.

    C = 1 - H_b(p) = 1 + p·log₂(p) + (1-p)·log₂(1-p)

    At p=0 (perfect channel) capacity is 1 bit/use.
    At p=0.5 (pure noise) capacity is 0 bits/use.

    Args:
        error_rate: Bit-flip probability p (0.0 – 1.0).

    Returns:
        Channel capacity in bits per channel use.

    Examples:
        >>> bsc_capacity(0.0)
        1.0
        >>> bsc_capacity(0.5)
        0.0
        >>> round(bsc_capacity(0.10), 4)
        0.531
    """
    p = error_rate
    if p == 0.0:
        return 1.0
    if p == 1.0:
        return 1.0  # perfectly reliable: always flip back
    if p == 0.5:
        return 0.0
    return 1.0 + p * math.log2(p) + (1 - p) * math.log2(1 - p)
