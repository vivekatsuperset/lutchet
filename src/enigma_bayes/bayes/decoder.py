"""
Bayesian Enigma decoder — a simplified implementation of crib-dragging.

The strategy:
    1. For every candidate rotor configuration (ordering + starting positions),
       attempt to decrypt the ciphertext.
    2. Apply the *Enigma constraint* (no letter can encrypt to itself) to
       immediately eliminate impossible settings. This is computationally free
       and eliminates the vast majority of candidates.
    3. Score surviving candidates using the Index of Coincidence and letter
       frequency log-likelihood — our Bayesian likelihood P(evidence | H).
    4. Return results ranked by score so the most probable setting is first.

This is not the full Bombe (which exploited menu loops for speed), but it
captures the probabilistic reasoning that made the Bombe possible.
"""

from __future__ import annotations

import itertools
from dataclasses import dataclass, field

import numpy as np

from ..enigma.machine import EnigmaMachine, EnigmaConfig
from ..enigma.rotor   import ALPHABET
from .scoring import (
    enigma_constraint_satisfied,
    index_of_coincidence,
    log_likelihood_english,
)


@dataclass
class DecodeResult:
    """A single candidate decryption, with its Bayesian score."""
    config:      EnigmaConfig
    position:    int            # where in the ciphertext the crib was tested
    decrypted:   str            # full decrypted message with these settings
    ioc:         float          # Index of Coincidence of decrypted text
    log_score:   float          # log-likelihood under English model
    eliminated:  bool = False   # True if discarded by the Enigma constraint

    @property
    def window(self) -> str:
        """Rotor window positions as a three-letter string."""
        pos = self.config.positions
        return "".join(ALPHABET[p] for p in pos)


class BayesianDecoder:
    """
    A Bayesian decoder that searches over Enigma configurations.

    Simplified search space for tractability:
        - Rotors: any subset of the available rotors (default: I, II, III)
        - Positions: all 26³ = 17,576 starting positions
        - Ring settings: fixed at AAA (the most pedagogically transparent choice)
        - Reflector: fixed (default UKW-B)
        - Plugboard: not searched (combinatorial explosion)

    Even with these constraints, the Enigma constraint eliminates >99% of
    candidates before any scoring is needed — demonstrating why crib-dragging
    was such a powerful technique.
    """

    def __init__(
        self,
        reflector: str = "UKW-B",
        plugboard_pairs: list[str] | None = None,
        rotor_choices: list[str] | None = None,
    ) -> None:
        self._reflector      = reflector
        self._plugboard      = plugboard_pairs or []
        self._rotor_choices  = rotor_choices or ["I", "II", "III"]

    def decode(
        self,
        ciphertext: str,
        crib: str,
        top_n: int = 10,
        verbose: bool = False,
    ) -> list[DecodeResult]:
        """
        Search for the Enigma settings that most plausibly produced *ciphertext*.

        The *crib* is a piece of known or suspected plaintext (e.g., "WETTER"
        for a weather report, or "KEINE BESONDEREN EREIGNISSE" for the routine
        "nothing to report" message that operators were lazy enough to send
        every day).

        Args:
            ciphertext: The intercepted ciphertext (uppercase letters only).
            crib:       Known or suspected plaintext fragment.
            top_n:      How many top-scoring results to return.
            verbose:    Print progress while searching.

        Returns:
            List of DecodeResult, sorted by log_score descending (best first).
        """
        ciphertext = "".join(c for c in ciphertext.upper() if c.isalpha())
        crib       = "".join(c for c in crib.upper() if c.isalpha())

        if len(crib) > len(ciphertext):
            raise ValueError("Crib is longer than the ciphertext.")

        results: list[DecodeResult] = []
        total_tested = 0
        constraint_eliminated = 0

        # All ordered permutations of the chosen rotors
        rotor_orderings = list(itertools.permutations(self._rotor_choices, 3))

        for rotors in rotor_orderings:
            if verbose:
                print(f"Searching rotors {'–'.join(rotors)} …")

            for pos_l, pos_m, pos_r in itertools.product(range(26), repeat=3):
                # Try each possible position for the crib within the ciphertext
                for crib_start in range(len(ciphertext) - len(crib) + 1):
                    total_tested += 1
                    cipher_slice = ciphertext[crib_start: crib_start + len(crib)]

                    # ── Enigma constraint: fast elimination ──────────────────
                    if not enigma_constraint_satisfied(crib, cipher_slice):
                        constraint_eliminated += 1
                        continue

                    # ── Decrypt the full message with this setting ────────────
                    config = EnigmaConfig(
                        rotors=(rotors[0], rotors[1], rotors[2]),
                        positions=(pos_l, pos_m, pos_r),
                        ring_settings=(0, 0, 0),
                        reflector=self._reflector,
                        plugboard_pairs=self._plugboard,
                    )
                    machine    = EnigmaMachine(config)
                    decrypted  = machine.encrypt(ciphertext)
                    ioc        = index_of_coincidence(decrypted)
                    log_score  = log_likelihood_english(decrypted)

                    results.append(DecodeResult(
                        config=config,
                        position=crib_start,
                        decrypted=decrypted,
                        ioc=ioc,
                        log_score=log_score,
                    ))

        if verbose:
            pct = 100 * constraint_eliminated / max(total_tested, 1)
            print(f"Tested {total_tested:,} settings.")
            print(f"Eliminated by Enigma constraint: {constraint_eliminated:,} ({pct:.1f}%)")
            print(f"Surviving candidates scored: {len(results):,}")

        results.sort(key=lambda r: r.log_score, reverse=True)
        return results[:top_n]

    def elimination_rate(self, crib: str, sample_size: int = 10_000) -> float:
        """
        Estimate what fraction of settings the Enigma constraint eliminates.

        This is a pedagogical tool — it makes vivid how powerful the
        no-self-encryption property really is.

        Args:
            crib:        The crib to test.
            sample_size: Number of random settings to sample.

        Returns:
            Fraction eliminated (0.0–1.0).
        """
        import random
        crib = "".join(c for c in crib.upper() if c.isalpha())
        eliminated = 0
        for _ in range(sample_size):
            config = EnigmaConfig(
                rotors=tuple(random.sample(self._rotor_choices, 3)),   # type: ignore[arg-type]
                positions=(random.randint(0, 25), random.randint(0, 25), random.randint(0, 25)),
                ring_settings=(0, 0, 0),
                reflector=self._reflector,
            )
            machine = EnigmaMachine(config)
            # Encrypt the crib to get what the ciphertext would look like
            encrypted_crib = machine.encrypt(crib)
            if not enigma_constraint_satisfied(crib, encrypted_crib):
                eliminated += 1
        return eliminated / sample_size
