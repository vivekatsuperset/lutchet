"""
Bayesian inference package for Enigma decoding.

Quick start::

    from bayes import BayesianDecoder

    decoder = BayesianDecoder(reflector="UKW-B")
    results = decoder.decode(ciphertext, crib="WETTER", top_n=5, verbose=True)
    print(results[0].decrypted)
"""

from .probability import (
    uniform_prior,
    normalize,
    bayesian_update,
    sequential_update,
    odds,
    log_odds,
    probability_from_odds,
)
from .scoring import (
    GERMAN_FREQUENCIES,
    index_of_coincidence,
    log_likelihood_german,
    enigma_constraint_satisfied,
    weight_of_evidence,
    to_bans,
    to_decibans,
    from_bans,
    bans_to_posterior_odds,
)
from .decoder import BayesianDecoder, DecodeResult

__all__ = [
    "uniform_prior", "normalize", "bayesian_update", "sequential_update",
    "odds", "log_odds", "probability_from_odds",
    "GERMAN_FREQUENCIES",
    "index_of_coincidence", "log_likelihood_german",
    "enigma_constraint_satisfied",
    "weight_of_evidence", "to_bans", "to_decibans", "from_bans",
    "bans_to_posterior_odds",
    "BayesianDecoder", "DecodeResult",
]
