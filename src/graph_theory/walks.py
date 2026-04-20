"""
Random walks on directed graphs, with PageRank as the central application.

Sergey Brin and Larry Page, Stanford, 1998. Their paper "The Anatomy of
a Large-Scale Hypertextual Web Search Engine" (WWW7) described a new
ranking system based on a simple idea: imagine a bored surfer who
clicks random links forever. The long-run fraction of time she spends
at each page is that page's importance. Mathematically, this is the
stationary distribution of a Markov chain on the web graph, biased by
a small teleport probability that keeps it from getting stuck in
rank sinks.

The algorithm is the same one you use for a knowledge graph thirty
years later, with a different teleport vector. Personalised PageRank
teleports back to a chosen seed rather than uniformly, which turns the
ranking into a "what is most related to this seed?" query. This is the
core retrieval primitive used in modern knowledge-graph augmented
language model pipelines.

All computations are dict-based rather than matrix-based, to keep the
module dependency-free and parallel in shape to the rest of
``src/graph_theory/``.
"""

import random

from .directed import DirectedGraph


def transition_matrix(
    graph: DirectedGraph,
) -> dict[str, dict[str, float]]:
    """
    Row-stochastic transition matrix for a simple random walk.

    From a node with out-degree ``k``, the walker picks one of the
    ``k`` out-neighbours uniformly at random. From a node with no
    out-edges (a "dangling" node in the web-graph sense) the walker
    teleports uniformly at random to any node, which is the standard
    fix.

    Returns:
        A nested dict ``T[u][v]`` giving the probability of stepping
        from ``u`` to ``v``. Rows sum to 1.
    """
    nodes = graph.nodes
    if not nodes:
        return {}
    n = len(nodes)
    t: dict[str, dict[str, float]] = {}
    for u in nodes:
        outs = graph.out_neighbours(u)
        if outs:
            p = 1.0 / len(outs)
            t[u] = {v: p for v in outs}
        else:
            # Dangling node: teleport uniformly.
            p = 1.0 / n
            t[u] = {v: p for v in nodes}
    return t


def _pagerank_iterate(
    graph: DirectedGraph,
    teleport: dict[str, float],
    damping: float,
    tol: float,
    max_iter: int,
    record_steps: bool,
) -> tuple[dict[str, float], list[dict[str, float]], list[float]]:
    """
    Shared power-iteration core for ``pagerank`` and its variants.

    Args:
        graph: The directed graph to rank.
        teleport: Probability distribution over nodes used when the
            walker teleports. Uniform gives standard PageRank; a
            distribution concentrated on one node gives personalised
            PageRank.
        damping: Probability of following an out-edge at each step.
            The complement ``1 - damping`` is the teleport probability.
        tol: L1 convergence tolerance on the rank vector.
        max_iter: Maximum number of iterations. Raises on non-convergence.
        record_steps: If True, capture the rank vector after every
            iteration for visualisation.

    Returns:
        ``(ranks, step_history, delta_history)``. The two histories are
        empty when ``record_steps`` is False.
    """
    nodes = graph.nodes
    n = len(nodes)
    if n == 0:
        return {}, [], []
    if not 0.0 < damping < 1.0:
        raise ValueError(
            f"damping must be strictly between 0 and 1; got {damping}."
        )

    ranks = {node: 1.0 / n for node in nodes}
    in_neighbours = {v: graph.in_neighbours(v) for v in nodes}
    out_deg = {u: graph.out_degree(u) for u in nodes}
    dangling = [u for u in nodes if out_deg[u] == 0]

    step_history: list[dict[str, float]] = []
    delta_history: list[float] = []
    if record_steps:
        step_history.append(dict(ranks))
        delta_history.append(float("inf"))

    for _ in range(max_iter):
        # Mass contributed by dangling nodes is distributed across the
        # teleport vector (same as saying they teleport each step).
        dangling_mass = sum(ranks[u] for u in dangling)
        new_ranks: dict[str, float] = {}
        for v in nodes:
            incoming = sum(
                ranks[u] / out_deg[u] for u in in_neighbours[v]
            )
            new_ranks[v] = (
                damping * (incoming + dangling_mass * teleport[v])
                + (1.0 - damping) * teleport[v]
            )
        delta = sum(abs(new_ranks[v] - ranks[v]) for v in nodes)
        ranks = new_ranks
        if record_steps:
            step_history.append(dict(ranks))
            delta_history.append(delta)
        if delta < tol:
            return ranks, step_history, delta_history

    raise RuntimeError(
        f"PageRank did not converge within {max_iter} iterations "
        f"(last delta {delta})."
    )


def pagerank(
    graph: DirectedGraph,
    damping: float = 0.85,
    tol: float = 1e-8,
    max_iter: int = 200,
) -> dict[str, float]:
    """
    Standard PageRank: power iteration with uniform teleport.

    Args:
        graph: The directed graph to rank.
        damping: The "follow a link" probability. Brin and Page chose
            0.85 based on empirical convergence speed on the 1998 web.
        tol: L1 convergence tolerance.
        max_iter: Maximum iteration count before giving up.

    Returns:
        A dict mapping node to its PageRank. Values sum to 1.
    """
    n = len(graph.nodes)
    if n == 0:
        return {}
    teleport = {node: 1.0 / n for node in graph.nodes}
    ranks, _, _ = _pagerank_iterate(
        graph, teleport, damping, tol, max_iter, record_steps=False
    )
    return ranks


def personalized_pagerank(
    graph: DirectedGraph,
    seed: str,
    damping: float = 0.85,
    tol: float = 1e-8,
    max_iter: int = 200,
) -> dict[str, float]:
    """
    PageRank biased toward ``seed``.

    Identical to standard PageRank, except the teleport vector is
    concentrated entirely on ``seed``. The resulting ranks answer the
    question "starting from seed, which nodes does a damped random
    walk tend to visit most?". This is the workhorse query behind
    knowledge-graph retrieval in modern LLM pipelines.

    Args:
        graph: The directed graph to rank.
        seed: The node to teleport back to. Must exist in ``graph``.
        damping: The "follow a link" probability.
        tol: L1 convergence tolerance.
        max_iter: Maximum iteration count.

    Returns:
        A dict mapping node to its personalised PageRank. Values sum
        to 1. The seed typically scores highest.

    Raises:
        ValueError: if ``seed`` is not a node in ``graph``.
    """
    if seed not in graph.nodes:
        raise ValueError(f"Seed {seed!r} not in graph.")
    teleport = {node: 0.0 for node in graph.nodes}
    teleport[seed] = 1.0
    ranks, _, _ = _pagerank_iterate(
        graph, teleport, damping, tol, max_iter, record_steps=False
    )
    return ranks


def pagerank_steps(
    graph: DirectedGraph,
    damping: float = 0.85,
    tol: float = 1e-8,
    max_iter: int = 200,
) -> tuple[list[dict[str, float]], list[float]]:
    """
    Record every iteration of PageRank for visualisation.

    Returns:
        A tuple ``(step_ranks, step_deltas)``. ``step_ranks[i]`` is the
        rank vector after iteration ``i``; index 0 is the uniform
        initial vector. ``step_deltas[i]`` is the L1 change from
        iteration ``i-1``; index 0 is ``inf`` by convention.
    """
    n = len(graph.nodes)
    if n == 0:
        return [], []
    teleport = {node: 1.0 / n for node in graph.nodes}
    _, steps, deltas = _pagerank_iterate(
        graph, teleport, damping, tol, max_iter, record_steps=True
    )
    return steps, deltas


def stationary_distribution(
    graph: DirectedGraph, tol: float = 1e-8, max_iter: int = 1000
) -> dict[str, float]:
    """
    Stationary distribution of the undamped random walk.

    A thin wrapper over PageRank with damping very close to 1. A true
    damping of 1 would not converge on disconnected graphs; we use
    0.9999 and a generous iteration budget as a practical substitute.
    Use this when you care about the walk itself rather than the
    Brin-Page construction.
    """
    if not graph.nodes:
        return {}
    return pagerank(graph, damping=0.9999, tol=tol, max_iter=max_iter)


def random_walk_sample(
    graph: DirectedGraph,
    start: str,
    steps: int,
    rng: random.Random | None = None,
) -> list[str]:
    """
    Sample a trajectory of the uniform random walk.

    Args:
        graph: The directed graph to walk on.
        start: Starting node.
        steps: Number of hops to take. The returned list has length
            ``steps + 1`` including the starting node.
        rng: A ``random.Random`` instance for reproducibility. If None,
            a fresh one is created.

    Returns:
        The node trajectory as a list.

    Raises:
        ValueError: if ``start`` is not in ``graph``.
    """
    if start not in graph.nodes:
        raise ValueError(f"Start {start!r} not in graph.")
    r = rng if rng is not None else random.Random()
    trajectory = [start]
    current = start
    for _ in range(steps):
        outs = graph.out_neighbours(current)
        if outs:
            current = r.choice(outs)
        else:
            # Dangling: teleport uniformly.
            current = r.choice(graph.nodes)
        trajectory.append(current)
    return trajectory
