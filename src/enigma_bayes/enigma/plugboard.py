"""
Enigma plugboard (Steckerbrett) simulation.

The plugboard is a patch panel that swaps pairs of letters *before* the
signal enters the rotor stack and *after* it returns. In the war, operators
used up to 10 pairs. An unplugged letter passes through unchanged.

Example:
    Plugboard(["AB", "CD"])  swaps A↔B and C↔D.
"""


class Plugboard:
    """Symmetric letter-pair swapper."""

    def __init__(self, pairs: list[str] | None = None) -> None:
        """
        Args:
            pairs: List of two-letter strings, e.g. ["AB", "XZ"].
                   At most 13 pairs (26 letters / 2). Defaults to no connections.

        Raises:
            ValueError: If a letter appears in more than one pair, or a pair
                        contains identical letters.
        """
        self._table: list[int] = list(range(26))  # identity by default

        if pairs:
            seen: set[int] = set()
            for pair in pairs:
                pair = pair.upper().strip()
                if len(pair) != 2:
                    raise ValueError(f"Each plugboard pair must be exactly 2 letters, got {pair!r}")
                a, b = ord(pair[0]) - ord("A"), ord(pair[1]) - ord("A")
                if a == b:
                    raise ValueError(f"Plugboard pair cannot connect a letter to itself: {pair!r}")
                if a in seen or b in seen:
                    raise ValueError(f"Letter appears in multiple plugboard pairs: {pair!r}")
                seen.update([a, b])
                self._table[a] = b
                self._table[b] = a

    def swap(self, signal: int) -> int:
        """Apply the plugboard substitution to a numeric signal (0–25)."""
        return self._table[signal]

    def swap_letter(self, letter: str) -> str:
        """Convenience wrapper that accepts and returns single letters."""
        idx = ord(letter.upper()) - ord("A")
        return chr(self._table[idx] + ord("A"))

    def active_pairs(self) -> list[tuple[str, str]]:
        """Return the list of connected letter pairs."""
        seen: set[int] = set()
        result = []
        for i, j in enumerate(self._table):
            if i != j and i not in seen:
                result.append((chr(i + ord("A")), chr(j + ord("A"))))
                seen.add(i)
                seen.add(j)
        return result

    def __repr__(self) -> str:
        pairs = self.active_pairs()
        if not pairs:
            return "Plugboard(no connections)"
        return "Plugboard(" + ", ".join(f"{a}↔{b}" for a, b in pairs) + ")"
