"""
Enigma reflector (Umkehrwalze) simulation.

The reflector is what makes the Enigma both useful and cryptographically
weak: it routes the signal back through the rotors from left to right,
but in doing so it guarantees that *no letter ever encrypts to itself*.
This constraint was the crack that Turing exploited.

Two reflectors are provided: UKW-B (most common) and UKW-C.
"""

from dataclasses import dataclass


@dataclass(frozen=True)
class ReflectorSpec:
    name: str
    wiring: str  # Must be a self-inverse permutation: wiring[wiring[i]] == i


REFLECTOR_SPECS: dict[str, ReflectorSpec] = {
    "UKW-B": ReflectorSpec("UKW-B", "YRUHQSLDPXNGOKMIEBFZCWVJAT"),
    "UKW-C": ReflectorSpec("UKW-C", "FVPJIAOYEDRZXWGCTKUQSBNMHL"),
}


class Reflector:
    """The fixed reflector at the left end of the rotor stack."""

    def __init__(self, spec: ReflectorSpec) -> None:
        self._spec = spec
        self._wiring: list[int] = [ord(c) - ord("A") for c in spec.wiring]

    @property
    def name(self) -> str:
        return self._spec.name

    def reflect(self, signal: int) -> int:
        """Map a signal through the reflector. Always returns a different letter."""
        return self._wiring[signal]

    def __repr__(self) -> str:
        return f"Reflector({self._spec.name!r})"
