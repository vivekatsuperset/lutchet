"""
Directed graph, no weights, no capacities.

Kept separate from ``core.Graph`` (undirected multigraph for Königsberg),
``weighted.WeightedGraph`` (undirected, weighted, for Dijkstra), and
``flow.FlowNetwork`` (directed, with capacities, for max-flow). Random
walks and PageRank need direction but nothing else; reusing any of the
other classes would pull in semantics that don't apply (bridges that
can be traversed twice, weights that aren't probabilities, capacities
that aren't there).

Self-loops and parallel edges are disallowed: they would complicate the
transition-matrix construction without adding anything the PageRank
story needs.
"""

from dataclasses import dataclass, field


@dataclass
class DirectedGraph:
    """
    Directed graph with at most one edge in each direction per pair.

    Attributes:
        _adj: Adjacency mapping from node to the ordered list of its
              out-neighbours. Prefer the public methods.
    """

    _adj: dict[str, list[str]] = field(default_factory=dict)

    def add_node(self, node: str) -> None:
        """Add a node with no edges. Idempotent."""
        if node not in self._adj:
            self._adj[node] = []

    def add_edge(self, u: str, v: str) -> None:
        """
        Add a directed edge ``u -> v``.

        Raises:
            ValueError: if ``u == v`` (self-loops are disallowed).

        Adding an edge that already exists is a no-op.
        """
        if u == v:
            raise ValueError(f"Self-loop on {u!r} is not allowed.")
        self.add_node(u)
        self.add_node(v)
        if v not in self._adj[u]:
            self._adj[u].append(v)

    @property
    def nodes(self) -> list[str]:
        """All nodes in the graph."""
        return list(self._adj.keys())

    @property
    def edges(self) -> list[tuple[str, str]]:
        """All directed edges as ``(u, v)`` pairs."""
        out: list[tuple[str, str]] = []
        for u, vs in self._adj.items():
            for v in vs:
                out.append((u, v))
        return out

    def out_neighbours(self, node: str) -> list[str]:
        """Nodes reachable from ``node`` via one out-edge."""
        return list(self._adj.get(node, []))

    def in_neighbours(self, node: str) -> list[str]:
        """Nodes from which ``node`` is reachable via one in-edge."""
        return [u for u, vs in self._adj.items() if node in vs]

    def out_degree(self, node: str) -> int:
        """Number of out-edges from ``node``."""
        return len(self._adj.get(node, []))
