"""
Enigma machine simulation package.

Quick start::

    from enigma import EnigmaMachine, EnigmaConfig

    config = EnigmaConfig.from_letters(
        rotors=("I", "II", "III"),
        positions=("A", "B", "L"),
        ring_settings=("A", "A", "A"),
        plugboard_pairs=["QW", "ER"],
    )
    machine = EnigmaMachine(config)
    cipher  = machine.encrypt("HELLO WORLD")
    machine.reset(config)
    plain   = machine.encrypt(cipher)  # → "HELLO WORLD"
"""

from .machine   import EnigmaMachine, EnigmaConfig
from .rotor     import Rotor, RotorSpec, ROTOR_SPECS, ALPHABET
from .reflector import Reflector, ReflectorSpec, REFLECTOR_SPECS
from .plugboard import Plugboard

__all__ = [
    "EnigmaMachine",
    "EnigmaConfig",
    "Rotor",
    "RotorSpec",
    "ROTOR_SPECS",
    "ALPHABET",
    "Reflector",
    "ReflectorSpec",
    "REFLECTOR_SPECS",
    "Plugboard",
]
