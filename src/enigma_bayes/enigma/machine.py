"""
Enigma machine assembly.

The `EnigmaMachine` wires together a plugboard, three rotors, and a
reflector into the complete electro-mechanical cipher device used by the
Wehrmacht and Kriegsmarine during World War II.

Signal path for each keypress:
  keyboard → plugboard → right rotor → middle rotor → left rotor
           → reflector
           → left rotor (inverse) → middle rotor (inverse) → right rotor (inverse)
           → plugboard → lamp

Before the signal travels, the *stepping mechanism* advances the rotors:
  - The right rotor steps on every keypress.
  - The middle rotor steps when the right rotor is at its turnover notch.
  - The left rotor steps when the middle rotor is at its turnover notch.
  - Double-stepping anomaly: if the middle rotor is already at its own
    notch, it steps a second time (a quirk of the physical pawl mechanism).
"""

from dataclasses import dataclass, field

from .rotor     import Rotor, ROTOR_SPECS, ALPHABET
from .reflector import Reflector, REFLECTOR_SPECS
from .plugboard import Plugboard


@dataclass
class EnigmaConfig:
    """
    Complete machine configuration.

    Attributes:
        rotors:          Rotor names left-to-right, e.g. ("I", "II", "III").
        positions:       Starting window positions left-to-right, 0–25 (A=0).
        ring_settings:   Ringstellung left-to-right, 0–25.
        reflector:       Reflector name, "UKW-B" or "UKW-C".
        plugboard_pairs: Steckerbrett connections, e.g. ["AB", "CD"].
    """
    rotors:          tuple[str, str, str]
    positions:       tuple[int, int, int] = (0, 0, 0)
    ring_settings:   tuple[int, int, int] = (0, 0, 0)
    reflector:       str = "UKW-B"
    plugboard_pairs: list[str] = field(default_factory=list)

    @classmethod
    def from_letters(
        cls,
        rotors: tuple[str, str, str],
        positions: tuple[str, str, str] = ("A", "A", "A"),
        ring_settings: tuple[str, str, str] = ("A", "A", "A"),
        reflector: str = "UKW-B",
        plugboard_pairs: list[str] | None = None,
    ) -> "EnigmaConfig":
        """Convenience constructor that accepts letter strings instead of integers."""
        return cls(
            rotors=rotors,
            positions=tuple(ord(p) - ord("A") for p in positions),   # type: ignore[arg-type]
            ring_settings=tuple(ord(r) - ord("A") for r in ring_settings),  # type: ignore[arg-type]
            reflector=reflector,
            plugboard_pairs=plugboard_pairs or [],
        )


class EnigmaMachine:
    """
    A fully functional Enigma machine simulation.

    Usage::

        config = EnigmaConfig.from_letters(
            rotors=("I", "II", "III"),
            positions=("A", "B", "C"),
            plugboard_pairs=["QW", "ER"],
        )
        machine = EnigmaMachine(config)
        ciphertext = machine.encrypt("HELLO WORLD")
        # Reset to same settings to decrypt
        machine.reset(config)
        plaintext = machine.encrypt(ciphertext)
        assert plaintext.replace(" ", "") == "HELLOWORLD"
    """

    def __init__(self, config: EnigmaConfig) -> None:
        if config.rotors[0] not in ROTOR_SPECS:
            raise ValueError(f"Unknown rotor: {config.rotors[0]!r}. Choose from {list(ROTOR_SPECS)}")
        if config.reflector not in REFLECTOR_SPECS:
            raise ValueError(f"Unknown reflector: {config.reflector!r}. Choose from {list(REFLECTOR_SPECS)}")

        self._config = config
        self._build(config)

    def _build(self, config: EnigmaConfig) -> None:
        """Instantiate all sub-components from a config."""
        self._left   = Rotor(ROTOR_SPECS[config.rotors[0]], config.ring_settings[0], config.positions[0])
        self._middle = Rotor(ROTOR_SPECS[config.rotors[1]], config.ring_settings[1], config.positions[1])
        self._right  = Rotor(ROTOR_SPECS[config.rotors[2]], config.ring_settings[2], config.positions[2])
        self._reflector = Reflector(REFLECTOR_SPECS[config.reflector])
        self._plugboard = Plugboard(config.plugboard_pairs)

    def reset(self, config: EnigmaConfig | None = None) -> None:
        """Reset the machine to a configuration (defaults to original config)."""
        self._build(config or self._config)

    # ── Stepping ────────────────────────────────────────────────────────────

    def _step_rotors(self) -> None:
        """
        Advance the rotor stack following the physical stepping mechanism.

        The double-stepping anomaly is reproduced faithfully: if the middle
        rotor is already at its turnover position, it steps *again* when the
        right rotor is at turnover — because the middle pawl engages both the
        middle and left ratchets simultaneously.
        """
        if self._middle.at_turnover():
            # Double-step: middle and left both advance
            self._middle.step()
            self._left.step()
        elif self._right.at_turnover():
            # Normal carry: middle advances
            self._middle.step()
        # Right rotor always steps
        self._right.step()

    # ── Encryption ──────────────────────────────────────────────────────────

    def encrypt_letter(self, letter: str) -> str:
        """
        Encrypt (or decrypt) a single letter.

        Non-alphabetic characters are returned unchanged and do *not* advance
        the rotors, consistent with how Enigma operators worked.
        """
        letter = letter.upper()
        if letter not in ALPHABET:
            return letter

        self._step_rotors()

        signal = ord(letter) - ord("A")

        # Plugboard (entry)
        signal = self._plugboard.swap(signal)

        # Forward through rotors: right → middle → left
        signal = self._right.forward(signal)
        signal = self._middle.forward(signal)
        signal = self._left.forward(signal)

        # Reflector
        signal = self._reflector.reflect(signal)

        # Backward through rotors: left → middle → right
        signal = self._left.backward(signal)
        signal = self._middle.backward(signal)
        signal = self._right.backward(signal)

        # Plugboard (exit)
        signal = self._plugboard.swap(signal)

        return chr(signal + ord("A"))

    def encrypt(self, text: str) -> str:
        """
        Encrypt (or decrypt) a full message.

        Spaces are preserved unchanged. Letters are converted to uppercase.
        """
        return "".join(self.encrypt_letter(c) for c in text)

    # ── Introspection ────────────────────────────────────────────────────────

    def window_positions(self) -> tuple[str, str, str]:
        """Return the current window letters as a (left, middle, right) tuple."""
        return (
            self._left.window_letter,
            self._middle.window_letter,
            self._right.window_letter,
        )

    def __repr__(self) -> str:
        l, m, r = self.window_letters = self.window_positions()
        return (
            f"EnigmaMachine(rotors={self._config.rotors}, "
            f"window={l}{m}{r}, "
            f"reflector={self._config.reflector!r})"
        )
