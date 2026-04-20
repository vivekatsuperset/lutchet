"""
Graph theory primitives.

An undirected multigraph with the fundamental operations shared across
the graph theory stories: degree, connectivity, and Eulerian path /
circuit detection.

Multi-edge support matters here because Königsberg famously has two
bridges between the northern bank and Kneiphof, and two more between
the southern bank and Kneiphof. A simple graph would lose that
information and give a different answer about whether the bridge walk
is possible.

Usage::

    from src.graph_theory.core import Graph, has_eulerian_path

    g = Graph()
    g.add_edge("A", "B")
    g.add_edge("B", "C")
    g.add_edge("A", "C")
    assert has_eulerian_path(g)   # triangle has all even degrees
"""

from collections import defaultdict, deque
from dataclasses import dataclass, field


@dataclass
class Graph:
    """
    Undirected multigraph.

    Edges are stored as an adjacency list where each node maps to a
    list of neighbour labels. Parallel edges (multiple bridges between
    the same two land masses) appear multiple times in that list,
    exactly how Euler counted them.

    Attributes:
        _adj: Adjacency mapping. Prefer the public methods over
              touching this directly.
    """

    _adj: dict[str, list[str]] = field(
        default_factory=lambda: defaultdict(list)
    )

    def add_node(self, node: str) -> None:
        """Add a node with no edges. Idempotent."""
        if node not in self._adj:
            self._adj[node] = []

    def add_edge(self, u: str, v: str) -> None:
        """
        Add an undirected edge between `u` and `v`.

        Parallel edges are allowed. Calling `add_edge("A", "B")` twice
        creates two distinct edges.
        """
        self.add_node(u)
        self.add_node(v)
        self._adj[u].append(v)
        self._adj[v].append(u)

    def remove_edge(self, u: str, v: str) -> None:
        """
        Remove one edge between `u` and `v`.

        If there are multiple parallel edges, only one is removed.
        Raises ValueError if no such edge exists.
        """
        if v not in self._adj.get(u, []) or u not in self._adj.get(v, []):
            raise ValueError(f"No edge between {u!r} and {v!r}")
        self._adj[u].remove(v)
        self._adj[v].remove(u)

    @property
    def nodes(self) -> list[str]:
        """All nodes in the graph."""
        return list(self._adj.keys())

    @property
    def edges(self) -> list[tuple[str, str]]:
        """
        All edges as `(u, v)` pairs with `u <= v`.

        Parallel edges appear once per bridge. The seven bridges of
        Königsberg yield a list of length seven.
        """
        out: list[tuple[str, str]] = []
        for u in self._adj:
            for v in self._adj[u]:
                if u <= v:
                    out.append((u, v))
        return out

    def degree(self, node: str) -> int:
        """Number of edge endpoints at `node`. Each parallel edge counts separately."""
        return len(self._adj[node])

    def neighbours(self, node: str) -> list[str]:
        """Neighbours of `node`, with duplicates preserved for parallel edges."""
        return list(self._adj[node])

    def is_connected(self) -> bool:
        """True if every node is reachable from every other. Empty graph is connected."""
        if not self._adj:
            return True
        start = next(iter(self._adj))
        visited: set[str] = {start}
        queue: deque[str] = deque([start])
        while queue:
            u = queue.popleft()
            for v in self._adj[u]:
                if v not in visited:
                    visited.add(v)
                    queue.append(v)
        return len(visited) == len(self._adj)

    def odd_degree_nodes(self) -> list[str]:
        """Nodes with an odd number of edge endpoints. The heart of Euler's theorem."""
        return [n for n in self._adj if self.degree(n) % 2 == 1]


def has_eulerian_circuit(graph: Graph) -> bool:
    """
    True iff `graph` has an Eulerian circuit.

    Euler's theorem (1736): a connected graph has an Eulerian circuit
    (a walk that traverses every edge exactly once and returns to its
    starting point) if and only if every node has even degree.
    """
    return graph.is_connected() and len(graph.odd_degree_nodes()) == 0


def has_eulerian_path(graph: Graph) -> bool:
    """
    True iff `graph` has an Eulerian path.

    Euler's theorem (1736): a connected graph admits an Eulerian path
    (a walk that traverses every edge exactly once, not necessarily
    returning to start) if and only if it has either zero or exactly
    two nodes of odd degree. If it has two, any such walk must begin
    at one and end at the other.
    """
    return graph.is_connected() and len(graph.odd_degree_nodes()) in (0, 2)
