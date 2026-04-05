"""
Core Bayesian inference functions.

These are the mathematical building blocks of Bayesian reasoning:

  posterior ∝ likelihood × prior

In the Enigma context:
  - Each *hypothesis* H_i is a candidate Enigma setting.
  - The *prior* P(H_i) is our initial belief (uniform: all settings equally likely).
  - The *likelihood* P(E | H_i) is how probable our observed evidence is
    given that setting i is correct.
  - The *posterior* P(H_i | E) is our updated belief after seeing the evidence.
"""

import numpy as np


def uniform_prior(n: int) -> np.ndarray:
    """
    Return a uniform probability distribution over n hypotheses.

    This is the right starting point when we have no reason to prefer one
    Enigma setting over another — which is exactly the situation at the
    start of a codebreaking session.

    Args:
        n: Number of hypotheses (candidate settings).

    Returns:
        1-D array of shape (n,) where every element equals 1/n.
    """
    return np.ones(n) / n


def normalize(probs: np.ndarray) -> np.ndarray:
    """
    Normalize an array of non-negative scores to a proper probability distribution.

    The denominator (total probability) is sometimes called the *evidence* or
    *marginal likelihood* P(E) in Bayes' theorem.

    Args:
        probs: Non-negative scores. Does not need to sum to 1 beforehand.

    Returns:
        A new array that sums to 1.

    Raises:
        ValueError: If all scores are zero (no hypothesis has any support).
    """
    total = probs.sum()
    if total == 0:
        raise ValueError(
            "All likelihoods are zero — no hypothesis is consistent with the evidence. "
            "Check your crib or expand the search space."
        )
    return probs / total


def bayesian_update(prior: np.ndarray, likelihoods: np.ndarray) -> np.ndarray:
    """
    Apply a single Bayesian update step.

    This is Bayes' theorem in array form:

        posterior[i] = likelihood[i] * prior[i]  (then normalised)

    Args:
        prior:       Current probability distribution over hypotheses.
        likelihoods: P(evidence | H_i) for each hypothesis i.
                     Need not be normalised — only relative values matter.

    Returns:
        Updated (posterior) probability distribution.
    """
    unnormalised = likelihoods * prior
    return normalize(unnormalised)


def sequential_update(prior: np.ndarray, likelihoods_list: list[np.ndarray]) -> np.ndarray:
    """
    Apply multiple independent pieces of evidence one at a time.

    Because each update is just a multiplication followed by normalisation,
    the order of evidence does not matter — the final posterior is the same
    regardless. This is the *sequential* nature of Bayesian reasoning.

    Args:
        prior:            Starting distribution.
        likelihoods_list: Each element is a likelihood array for one piece
                          of evidence.

    Returns:
        Final posterior after all evidence is incorporated.
    """
    posterior = prior.copy()
    for likelihoods in likelihoods_list:
        posterior = bayesian_update(posterior, likelihoods)
    return posterior


def odds(p: float) -> float:
    """
    Convert a probability to odds.

    odds(p) = p / (1 - p)

    An odds of 10 means "10 times more likely than not".
    """
    if p <= 0 or p >= 1:
        raise ValueError(f"Probability must be in (0, 1), got {p}")
    return p / (1.0 - p)


def probability_from_odds(o: float) -> float:
    """Convert odds back to probability: p = o / (1 + o)."""
    return o / (1.0 + o)


def log_odds(p: float) -> float:
    """
    Convert a probability to log-odds (base 10).

    log_odds(p) = log10(p / (1 - p))

    This is the key quantity in Turing's *ban* system. Adding log-odds
    is equivalent to multiplying probabilities — a much more convenient
    operation when combining many pieces of evidence.
    """
    return float(np.log10(odds(p)))
