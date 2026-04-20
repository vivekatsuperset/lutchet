"""
Weighted undirected graph.

Kept separate from `core.Graph` (which is unweighted and serves the
Eulerian story) because shortest-path algorithms need edge weights and
mixing the two would complicate the Königsberg narrative.

Usage::

    from src.graph_theory.weighted import WeightedGraph

    g = WeightedGraph()
    g.add_edge("A", "B", 3.0)
    g.add_edge("B", "C", 1.5)
    g.add_edge("A", "C", 10.0)
    assert sorted(g.nodes) == ["A", "B", "C"]
"""

from collections import defaultdict
from dataclasses import dataclass, field


@dataclass
class WeightedGraph:
    """
    Undirected graph with non-negative edge weights.

    Parallel edges are permitted; Dijkstra's algorithm will simply
    traverse the cheaper one first. Self-loops are permitted but do not
    affect shortest paths from a different source.

    Attributes:
        _adj: Adjacency mapping from node to a list of ``(neighbour,
              weight)`` tuples. Prefer the public methods.
    """

    _adj: dict[str, list[tuple[str, float]]] = field(
        default_factory=lambda: defaultdict(list)
    )

    def add_node(self, node: str) -> None:
        """Add a node with no edges. Idempotent."""
        if node not in self._adj:
            self._adj[node] = []

    def add_edge(self, u: str, v: str, weight: float) -> None:
        """
        Add an undirected edge ``u <-> v`` with the given weight.

        Raises:
            ValueError: if ``weight`` is negative. Dijkstra's algorithm
                assumes non-negative weights; enforcing this at insert
                time catches the mistake at the earliest possible point.
        """
        if weight < 0:
            raise ValueError(
                f"Edge ({u!r}, {v!r}) has negative weight {weight}; "
                "Dijkstra requires non-negative weights."
            )
        self.add_node(u)
        self.add_node(v)
        self._adj[u].append((v, weight))
        self._adj[v].append((u, weight))

    @property
    def nodes(self) -> list[str]:
        """All nodes in the graph."""
        return list(self._adj.keys())

    @property
    def edges(self) -> list[tuple[str, str, float]]:
        """All edges as ``(u, v, weight)`` triples with ``u <= v``."""
        out: list[tuple[str, str, float]] = []
        for u in self._adj:
            for v, w in self._adj[u]:
                if u <= v:
                    out.append((u, v, w))
        return out

    def neighbours(self, node: str) -> list[tuple[str, float]]:
        """Neighbours of ``node`` as ``(neighbour, weight)`` tuples."""
        return list(self._adj[node])
