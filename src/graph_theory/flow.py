"""
Maximum flow and minimum cut.

Lester Ford and Delbert Fulkerson, RAND Corporation, 1956. Their paper
"Maximal Flow Through a Network" (Canadian Journal of Mathematics, 1956)
proved the max-flow / min-cut theorem and gave the augmenting-path
algorithm. They were working in the same building at RAND as Ted Harris
and Frank Ross, who had just produced a classified study modelling the
Soviet-and-Eastern-European rail network as a graph and asking which
links, if cut, would sever supply from the Soviet interior to its
satellites. The theorem answered their question.

This module implements Edmonds-Karp (Ford-Fulkerson with BFS for the
augmenting path). BFS guarantees termination on irrational capacities
and gives O(V * E^2) complexity. Depth-first augmenting paths can fail
to terminate on real-valued capacities; BFS is the standard pedagogical
and practical choice.

The min-cut is recovered by running max-flow, then doing a single BFS
from the source on the residual graph. Nodes reachable in the residual
form one side of the cut; the cut edges are the original edges that
cross from reachable to unreachable.

Usage::

    from src.graph_theory.flow import FlowNetwork, max_flow, min_cut

    net = FlowNetwork()
    net.add_edge("s", "a", 10)
    net.add_edge("a", "t", 10)
    value, flow = max_flow(net, "s", "t")
    cut_value, cut_edges = min_cut(net, "s", "t")
    assert value == cut_value
"""

from collections import defaultdict, deque
from dataclasses import dataclass, field


@dataclass
class FlowStep:
    """One iteration of Edmonds-Karp. See ``max_flow_steps``."""

    path: list[str]
    bottleneck: float
    flow_value: float
    residual: dict[str, dict[str, float]]


@dataclass
class FlowNetwork:
    """
    Directed graph with non-negative edge capacities.

    Edges are directed and asymmetric: ``add_edge(u, v, c)`` adds a
    single edge from ``u`` to ``v`` with capacity ``c``. The reverse
    edge used by the algorithm lives in the residual graph, not here.

    Parallel edges in the same direction are merged by summing their
    capacities; this matches how flow networks are usually drawn in
    practice and avoids pathological cases for the residual construction.

    Attributes:
        _cap: Capacity mapping ``_cap[u][v]`` is the capacity of the
              edge from ``u`` to ``v``. Prefer the public methods.
    """

    _cap: dict[str, dict[str, float]] = field(
        default_factory=lambda: defaultdict(dict)
    )

    def add_node(self, node: str) -> None:
        """Add a node with no edges. Idempotent."""
        if node not in self._cap:
            self._cap[node] = {}

    def add_edge(self, u: str, v: str, capacity: float) -> None:
        """
        Add a directed edge ``u -> v`` with the given capacity.

        If an edge from ``u`` to ``v`` already exists, the capacities
        are summed.

        Raises:
            ValueError: if ``capacity`` is negative, or if ``u == v``
                (self-loops carry no flow and usually indicate a bug).
        """
        if capacity < 0:
            raise ValueError(
                f"Edge ({u!r}, {v!r}) has negative capacity {capacity}; "
                "flow networks require non-negative capacities."
            )
        if u == v:
            raise ValueError(
                f"Self-loop on {u!r} is not a valid flow edge."
            )
        self.add_node(u)
        self.add_node(v)
        self._cap[u][v] = self._cap[u].get(v, 0.0) + capacity

    def capacity(self, u: str, v: str) -> float:
        """Capacity of edge ``u -> v``; 0 if no such edge exists."""
        return self._cap.get(u, {}).get(v, 0.0)

    @property
    def nodes(self) -> list[str]:
        """All nodes in the network."""
        return list(self._cap.keys())

    @property
    def edges(self) -> list[tuple[str, str, float]]:
        """All directed edges as ``(u, v, capacity)`` triples."""
        out: list[tuple[str, str, float]] = []
        for u, vs in self._cap.items():
            for v, c in vs.items():
                out.append((u, v, c))
        return out


def _build_residual(net: FlowNetwork) -> dict[str, dict[str, float]]:
    """
    Initialise a residual graph from a flow network.

    The residual graph has the same forward capacities as the original
    plus a reverse edge for every forward edge, initially at zero. As
    flow is pushed, forward capacity decreases and reverse capacity
    grows, allowing the algorithm to "cancel" flow along an earlier
    path if a better one is found later.
    """
    residual: dict[str, dict[str, float]] = defaultdict(dict)
    for u in net.nodes:
        residual[u] = {}
    for u, v, c in net.edges:
        residual[u][v] = residual[u].get(v, 0.0) + c
        if u not in residual[v]:
            residual[v][u] = 0.0
    return residual


def _bfs_augmenting_path(
    residual: dict[str, dict[str, float]], source: str, sink: str
) -> list[str] | None:
    """
    Return the shortest (in edge count) augmenting path, or None.

    BFS on the residual graph, considering only edges with positive
    residual capacity. The returned path starts at ``source`` and ends
    at ``sink``.
    """
    predecessors: dict[str, str | None] = {source: None}
    queue: deque[str] = deque([source])
    while queue:
        u = queue.popleft()
        if u == sink:
            break
        for v, cap in residual[u].items():
            if cap > 0 and v not in predecessors:
                predecessors[v] = u
                queue.append(v)
    if sink not in predecessors:
        return None
    path: list[str] = []
    node: str | None = sink
    while node is not None:
        path.append(node)
        node = predecessors[node]
    path.reverse()
    return path


def max_flow(
    net: FlowNetwork, source: str, sink: str
) -> tuple[float, dict[tuple[str, str], float]]:
    """
    Maximum flow from ``source`` to ``sink`` using Edmonds-Karp.

    Args:
        net: The flow network. Capacities must be non-negative.
        source: The node flow originates from.
        sink: The node flow terminates at.

    Returns:
        A tuple ``(value, flow)``:
          - ``value`` is the maximum flow value.
          - ``flow[(u, v)]`` is the flow along the original edge
            ``u -> v``. Only original edges appear; reverse edges are
            an implementation detail of the residual graph.

    Raises:
        ValueError: if ``source`` or ``sink`` is not in ``net``, or if
            ``source == sink``.
    """
    if source not in net.nodes:
        raise ValueError(f"Source {source!r} not in network.")
    if sink not in net.nodes:
        raise ValueError(f"Sink {sink!r} not in network.")
    if source == sink:
        raise ValueError("Source and sink must be distinct.")

    residual = _build_residual(net)
    original_caps = {(u, v): c for u, v, c in net.edges}
    value = 0.0

    while True:
        path = _bfs_augmenting_path(residual, source, sink)
        if path is None:
            break
        bottleneck = min(
            residual[path[i]][path[i + 1]] for i in range(len(path) - 1)
        )
        for i in range(len(path) - 1):
            u, v = path[i], path[i + 1]
            residual[u][v] -= bottleneck
            residual[v][u] += bottleneck
        value += bottleneck

    flow: dict[tuple[str, str], float] = {}
    for (u, v), cap in original_caps.items():
        flow[(u, v)] = cap - residual[u][v]
    return value, flow


def min_cut(
    net: FlowNetwork, source: str, sink: str
) -> tuple[float, set[tuple[str, str]]]:
    """
    Minimum s-t cut value and the edges crossing the cut.

    By the max-flow / min-cut theorem (Ford and Fulkerson, 1956) the
    value returned here equals ``max_flow(net, source, sink)[0]``.

    The cut is recovered by running max-flow, then doing a single BFS
    from ``source`` on the final residual graph. Nodes reachable in
    the residual form the source side; the cut edges are the *original*
    edges that cross from reachable to unreachable.

    Args:
        net: The flow network.
        source: The source node.
        sink: The sink node.

    Returns:
        A tuple ``(value, edges)`` where ``edges`` is the set of
        directed original edges ``(u, v)`` with ``u`` reachable and
        ``v`` unreachable in the residual.
    """
    value, _ = max_flow(net, source, sink)

    residual = _build_residual(net)
    # Replay the augmenting paths to get the final residual. Cheaper
    # than threading the residual out of max_flow and keeps that
    # function's contract narrow.
    original_caps = {(u, v): c for u, v, c in net.edges}
    while True:
        path = _bfs_augmenting_path(residual, source, sink)
        if path is None:
            break
        bottleneck = min(
            residual[path[i]][path[i + 1]] for i in range(len(path) - 1)
        )
        for i in range(len(path) - 1):
            u, v = path[i], path[i + 1]
            residual[u][v] -= bottleneck
            residual[v][u] += bottleneck

    reachable: set[str] = set()
    queue: deque[str] = deque([source])
    reachable.add(source)
    while queue:
        u = queue.popleft()
        for v, cap in residual[u].items():
            if cap > 0 and v not in reachable:
                reachable.add(v)
                queue.append(v)

    cut_edges: set[tuple[str, str]] = set()
    for (u, v) in original_caps:
        if u in reachable and v not in reachable:
            cut_edges.add((u, v))
    return value, cut_edges


def max_flow_steps(
    net: FlowNetwork, source: str, sink: str
) -> list[FlowStep]:
    """
    Record each augmenting-path iteration of Edmonds-Karp.

    Useful for visualisation. Each step captures the augmenting path,
    the bottleneck capacity along it, the cumulative flow value after
    that augmentation, and a snapshot of the residual graph.

    The returned list always has at least one entry: the initial state
    (empty path, zero flow, initial residual) at index 0.
    """
    if source not in net.nodes:
        raise ValueError(f"Source {source!r} not in network.")
    if sink not in net.nodes:
        raise ValueError(f"Sink {sink!r} not in network.")
    if source == sink:
        raise ValueError("Source and sink must be distinct.")

    residual = _build_residual(net)
    steps: list[FlowStep] = [
        FlowStep(
            path=[],
            bottleneck=0.0,
            flow_value=0.0,
            residual={u: dict(vs) for u, vs in residual.items()},
        )
    ]
    value = 0.0
    while True:
        path = _bfs_augmenting_path(residual, source, sink)
        if path is None:
            break
        bottleneck = min(
            residual[path[i]][path[i + 1]] for i in range(len(path) - 1)
        )
        for i in range(len(path) - 1):
            u, v = path[i], path[i + 1]
            residual[u][v] -= bottleneck
            residual[v][u] += bottleneck
        value += bottleneck
        steps.append(
            FlowStep(
                path=list(path),
                bottleneck=bottleneck,
                flow_value=value,
                residual={u: dict(vs) for u, vs in residual.items()},
            )
        )
    return steps
