"""
Quick smoke test — run with: uv run python main.py
Verifies the Enigma machine and Bayes modules are wired correctly.
"""
import sys
sys.path.insert(0, '.')

from src.enigma_bayes.enigma.machine import EnigmaMachine, EnigmaConfig
from src.enigma_bayes.bayes.probability import uniform_prior, bayesian_update
from src.enigma_bayes.bayes.scoring import index_of_coincidence, enigma_constraint_satisfied

def main():
    print("── Enigma smoke test ──────────────────────────────")
    config = EnigmaConfig.from_letters(
        rotors=("I", "II", "III"),
        positions=("A", "A", "A"),
        ring_settings=("A", "A", "A"),
        reflector="UKW-B",
    )
    machine = EnigmaMachine(config)
    msg = "HELLOTURINGSHELLOTURINGS"
    enc = machine.encrypt(msg)
    machine.reset(config)
    dec = machine.encrypt(enc)
    print(f"  Plain:   {msg}")
    print(f"  Cipher:  {enc}")
    print(f"  Decrypt: {dec}")
    assert dec == msg, "Round-trip failed!"
    print("  ✓ Round-trip encryption/decryption correct\n")

    # Verify no-self-encryption property
    violations = [p for p, c in zip(msg, enc) if p == c]
    assert not violations, f"Self-encryption found: {violations}"
    print("  ✓ No letter encrypted to itself\n")

    print("── Bayes smoke test ───────────────────────────────")
    prior = uniform_prior(4)
    likelihoods = [0.0, 0.9, 0.0, 0.1]  # only H2 and H4 survive
    import numpy as np
    posterior = bayesian_update(prior, np.array(likelihoods))
    print(f"  Prior:     {prior}")
    print(f"  Posterior: {posterior.round(3)}")
    assert posterior[1] > 0.8, "Bayesian update failed"
    print("  ✓ Bayesian update correct\n")

    print("── Index of Coincidence ───────────────────────────")
    english_ic = index_of_coincidence("THEENIGMAWASSUPPOSEDLYUNBREAKABLE")
    random_ic  = index_of_coincidence(enc)  # ciphertext looks random
    print(f"  English text IC: {english_ic:.4f}  (expect ~0.065)")
    print(f"  Ciphertext IC:   {random_ic:.4f}   (expect ~0.038)")
    print()
    print("All checks passed. You're ready to open the notebooks.")

if __name__ == "__main__":
    main()
