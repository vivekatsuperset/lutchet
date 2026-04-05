"""
Huffman coding — optimal prefix-free source compression.

Shannon proved that no lossless code can compress a source below its
entropy.  Huffman (1952) gave a simple greedy algorithm that constructs
a prefix-free binary code whose average length is within 1 bit of the
entropy floor — and in practice far closer.

The key idea: build a binary tree bottom-up by repeatedly merging the
two least-frequent symbols into a new internal node.  The resulting tree
assigns shorter bit-strings to frequent symbols and longer ones to rare
symbols, minimising the expected code length.
"""

import heapq
from dataclasses import dataclass, field
from typing import Optional


@dataclass(order=True)
class HuffNode:
    """A node in a Huffman tree.

    Internal nodes have ``left`` and ``right`` children; leaf nodes
    carry a ``symbol``.  The ``order=True`` argument makes nodes
    comparable by ``freq``, which is required by ``heapq``.

    Attributes:
        freq:   Frequency (or probability weight) of the subtree.
        symbol: The symbol at a leaf node; ``None`` for internal nodes.
        left:   Left child (0-branch).
        right:  Right child (1-branch).
    """

    freq: float
    symbol: Optional[str] = field(compare=False, default=None)
    left: Optional["HuffNode"] = field(compare=False, default=None)
    right: Optional["HuffNode"] = field(compare=False, default=None)


def build_tree(freqs: dict[str, float]) -> HuffNode:
    """Build a Huffman tree from a symbol-frequency table.

    Uses a min-heap to greedily merge the two lowest-frequency nodes
    until only the root remains.

    Args:
        freqs: Mapping of symbol → non-negative weight.  Must contain
               at least one entry.

    Returns:
        The root ``HuffNode`` of the completed Huffman tree.

    Examples:
        >>> tree = build_tree({"A": 0.5, "B": 0.25, "C": 0.25})
        >>> tree.freq
        1.0
    """
    heap = [HuffNode(freq=f, symbol=s) for s, f in freqs.items()]
    heapq.heapify(heap)
    while len(heap) > 1:
        lo = heapq.heappop(heap)
        hi = heapq.heappop(heap)
        heapq.heappush(heap, HuffNode(freq=lo.freq + hi.freq, left=lo, right=hi))
    return heap[0]


def build_codes(
    node: HuffNode,
    prefix: str = "",
    codes: Optional[dict[str, str]] = None,
) -> dict[str, str]:
    """Recursively extract the binary code for each symbol in the tree.

    Traversing left appends "0"; right appends "1".  A single-symbol
    alphabet is assigned the code "0".

    Args:
        node:   Current ``HuffNode`` (start with the root).
        prefix: Bit-string accumulated so far (empty at root).
        codes:  Accumulator dict; created on the first call.

    Returns:
        Mapping of symbol → binary string (e.g. ``{"E": "10", "Z": "00001"}``).

    Examples:
        >>> tree = build_tree({"A": 0.5, "B": 0.5})
        >>> codes = build_codes(tree)
        >>> len(codes["A"]) == len(codes["B"]) == 1
        True
    """
    if codes is None:
        codes = {}
    if node.symbol is not None:
        codes[node.symbol] = prefix or "0"
    else:
        if node.left:
            build_codes(node.left, prefix + "0", codes)
        if node.right:
            build_codes(node.right, prefix + "1", codes)
    return codes


def average_code_length(codes: dict[str, str], freqs: dict[str, float]) -> float:
    """Compute the expected (average) code length under a symbol distribution.

    L̄ = ∑ p(s) · |code(s)|

    This should be close to — but never less than — the entropy of the
    source.  Huffman guarantees L̄ < H + 1.

    Args:
        codes: Symbol → binary string, as returned by ``build_codes``.
        freqs: Symbol → non-negative weight (counts or probabilities).

    Returns:
        Weighted average code length in bits per symbol.

    Examples:
        >>> from src.information_theory.entropy import ENGLISH_FREQUENCIES, entropy_from_freqs
        >>> tree  = build_tree(ENGLISH_FREQUENCIES)
        >>> codes = build_codes(tree)
        >>> avg = average_code_length(codes, ENGLISH_FREQUENCIES)
        >>> h   = entropy_from_freqs(ENGLISH_FREQUENCIES)
        >>> avg - h < 1  # Huffman guarantee
        True
    """
    total = sum(freqs.values())
    return sum(
        (freqs[s] / total) * len(codes[s])
        for s in codes
        if s in freqs
    )
