"""
Dijkstra's shortest-path algorithm.

Edsger W. Dijkstra, Amsterdam, 1956. Designed in 20 minutes at a café
on the Leidseplein while shopping with his fiancée, as a demo problem
for the unveiling of the ARMAC computer. Published as three pages in
Numerische Mathematik in 1959 under the title "A Note on Two Problems
in Connexion with Graphs".

The algorithm maintains a set of nodes whose shortest distance from
the source is settled, and repeatedly extracts the unsettled node with
the smallest tentative distance, relaxing its outgoing edges. A binary
heap keeps the extraction to O(log n). The overall complexity is
O((V + E) log V).

Correctness depends on non-negative weights. A negative edge can make
a previously settled distance wrong; Bellman-Ford is the algorithm you
want in that case. `WeightedGraph.add_edge` rejects negative weights
at insert time, so the algorithm here can trust its input.
"""

import heapq
import math

from .weighted import WeightedGraph


def dijkstra(
    graph: WeightedGraph, source: str
) -> tuple[dict[str, float], dict[str, str | None]]:
    """
    Shortest-path distances and predecessors from ``source``.

    Args:
        graph: The weighted graph to search. Edge weights must be
            non-negative (enforced by ``WeightedGraph.add_edge``).
        source: The node to search from. Must exist in ``graph``.

    Returns:
        A tuple ``(distances, predecessors)``:
          - ``distances[v]`` is the length of the shortest path from
            ``source`` to ``v``, or ``math.inf`` if ``v`` is unreachable.
          - ``predecessors[v]`` is the node immediately before ``v`` on
            that path, or ``None`` if ``v`` is the source or unreachable.

    Raises:
        ValueError: if ``source`` is not a node in ``graph``.
    """
    if source not in graph.nodes:
        raise ValueError(f"Source {source!r} not in graph.")

    distances: dict[str, float] = {n: math.inf for n in graph.nodes}
    predecessors: dict[str, str | None] = {n: None for n in graph.nodes}
    distances[source] = 0.0

    # (tentative_distance, node) ordered by distance.
    frontier: list[tuple[float, str]] = [(0.0, source)]

    while frontier:
        d, u = heapq.heappop(frontier)
        # Stale entry: we already found a shorter path to u.
        if d > distances[u]:
            continue
        for v, w in graph.neighbours(u):
            alt = d + w
            if alt < distances[v]:
                distances[v] = alt
                predecessors[v] = u
                heapq.heappush(frontier, (alt, v))

    return distances, predecessors


def shortest_path(
    predecessors: dict[str, str | None],
    source: str,
    target: str,
) -> list[str]:
    """
    Reconstruct the shortest path from ``source`` to ``target``.

    Args:
        predecessors: The predecessor map returned by ``dijkstra`` for
            the same ``source``.
        source: The starting node.
        target: The destination node.

    Returns:
        The path as a list of nodes, starting with ``source`` and
        ending with ``target``. Empty if ``target`` is unreachable.

    Raises:
        KeyError: if ``source`` or ``target`` is not in ``predecessors``.
    """
    if source not in predecessors:
        raise KeyError(f"{source!r} not in predecessors map.")
    if target not in predecessors:
        raise KeyError(f"{target!r} not in predecessors map.")

    path: list[str] = []
    node: str | None = target
    while node is not None:
        path.append(node)
        node = predecessors[node]
    path.reverse()

    # A successfully reconstructed path must begin at the source.
    # Otherwise target was unreachable from source.
    if not path or path[0] != source:
        return []
    return path
