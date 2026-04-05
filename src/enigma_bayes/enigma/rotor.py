"""
Enigma rotor simulation.

Each physical rotor is a wired scrambler that substitutes one letter for
another. The historical Wehrmacht/Luftwaffe rotors (I–V) and Kriegsmarine
rotors (VI–VIII) are reproduced here with their authentic wirings.

The *ring setting* (Ringstellung) offsets the wiring relative to the
alphabet ring. The *position* (Grundstellung) is where the rotor currently
sits in the machine — it advances with every keypress.
"""

from dataclasses import dataclass

ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ"


@dataclass(frozen=True)
class RotorSpec:
    """Immutable specification of a physical rotor."""
    name: str
    wiring: str   # 26-character substitution string (A→wiring[0], B→wiring[1], …)
    turnovers: str  # window letter(s) at which this rotor causes the next to step


# Historical rotor wirings and turnover positions.
# Source: Cipher Machines & Cryptology, D. Rijmenants
ROTOR_SPECS: dict[str, RotorSpec] = {
    "I":    RotorSpec("I",    "EKMFLGDQVZNTOWYHXUSPAIBRCJ", "Q"),
    "II":   RotorSpec("II",   "AJDKSIRUXBLHWTMCQGZNPYFVOE", "E"),
    "III":  RotorSpec("III",  "BDFHJLCPRTXVZNYEIWGAKMUSQO", "V"),
    "IV":   RotorSpec("IV",   "ESOVPZJAYQUIRHXLNFTGKDCMWB", "J"),
    "V":    RotorSpec("V",    "VZBRGITYUPSDNHLXAWMJQOFECK", "Z"),
    # Kriegsmarine rotors (double turnover at Z and M)
    "VI":   RotorSpec("VI",   "JPGVOUMFYQBENHZRDKASXLICTW", "ZM"),
    "VII":  RotorSpec("VII",  "NZJHGRCXMYSWBOUFAIVLPEKQDT", "ZM"),
    "VIII": RotorSpec("VIII", "FKQHTLXOCBJSPDZRAMEWNIUYGV", "ZM"),
}


class Rotor:
    """
    A single Enigma rotor.

    Internally, we store *forward* and *backward* lookup tables so that
    both the right-to-left (forward) and left-to-right (backward) signal
    paths are O(1) per letter.
    """

    def __init__(self, spec: RotorSpec, ring_setting: int = 0, position: int = 0) -> None:
        """
        Args:
            spec:         The rotor specification (wiring + turnover).
            ring_setting: Ringstellung offset, 0–25 (A=0 … Z=25).
            position:     Starting window position, 0–25.
        """
        self._spec = spec
        self._ring_setting = ring_setting
        self._position = position

        # Build forward mapping: input index → output index
        self._forward: list[int] = [ord(c) - ord("A") for c in spec.wiring]

        # Build backward (inverse) mapping
        self._backward: list[int] = [0] * 26
        for i, fwd in enumerate(self._forward):
            self._backward[fwd] = i

    # ── Properties ──────────────────────────────────────────────────────────

    @property
    def name(self) -> str:
        return self._spec.name

    @property
    def position(self) -> int:
        return self._position

    @position.setter
    def position(self, value: int) -> None:
        self._position = value % 26

    @property
    def window_letter(self) -> str:
        """The letter currently visible in the Enigma's window."""
        return ALPHABET[self._position]

    # ── Stepping ────────────────────────────────────────────────────────────

    def at_turnover(self) -> bool:
        """Return True when this rotor is about to cause its left neighbour to step."""
        return ALPHABET[self._position] in self._spec.turnovers

    def step(self) -> None:
        """Advance the rotor by one position."""
        self._position = (self._position + 1) % 26

    # ── Signal path ─────────────────────────────────────────────────────────

    def forward(self, signal: int) -> int:
        """
        Pass a signal right-to-left through the rotor.

        The position and ring-setting together determine which wiring contact
        is actually aligned with the incoming signal pin.
        """
        offset = (self._position - self._ring_setting) % 26
        entry  = (signal + offset) % 26
        wired  = self._forward[entry]
        return (wired - offset) % 26

    def backward(self, signal: int) -> int:
        """Pass a signal left-to-right through the rotor (return path)."""
        offset = (self._position - self._ring_setting) % 26
        entry  = (signal + offset) % 26
        wired  = self._backward[entry]
        return (wired - offset) % 26

    def __repr__(self) -> str:
        return (
            f"Rotor({self._spec.name!r}, "
            f"ring={ALPHABET[self._ring_setting]}, "
            f"pos={self.window_letter})"
        )
