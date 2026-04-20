// Weighted graph + Dijkstra for the Graph Theory / Networks lesson.
// Mirrors src/graph_theory/weighted.py and src/graph_theory/dijkstra.py.
// Keep the three in sync when changing semantics.

export type Edge = { u: string; v: string; weight: number };

export class WeightedGraph {
  private adj = new Map<string, Array<[string, number]>>();

  addNode(n: string) {
    if (!this.adj.has(n)) this.adj.set(n, []);
  }

  addEdge(u: string, v: string, weight: number) {
    if (weight < 0) {
      throw new Error(
        `Edge (${u}, ${v}) has negative weight ${weight}; Dijkstra requires non-negative weights.`
      );
    }
    this.addNode(u);
    this.addNode(v);
    this.adj.get(u)!.push([v, weight]);
    this.adj.get(v)!.push([u, weight]);
  }

  nodes(): string[] {
    return [...this.adj.keys()];
  }

  edges(): Edge[] {
    const out: Edge[] = [];
    for (const [u, list] of this.adj) {
      for (const [v, w] of list) {
        if (u <= v) out.push({ u, v, weight: w });
      }
    }
    return out;
  }

  neighbours(n: string): Array<[string, number]> {
    return this.adj.get(n) ?? [];
  }
}

export interface DijkstraResult {
  distances: Map<string, number>;
  predecessors: Map<string, string | null>;
}

// Minimal binary min-heap keyed on the first element of [distance, node].
class MinHeap {
  private heap: Array<[number, string]> = [];

  size(): number {
    return this.heap.length;
  }

  push(item: [number, string]): void {
    this.heap.push(item);
    this.bubbleUp(this.heap.length - 1);
  }

  pop(): [number, string] | undefined {
    if (this.heap.length === 0) return undefined;
    const top = this.heap[0];
    const last = this.heap.pop()!;
    if (this.heap.length > 0) {
      this.heap[0] = last;
      this.bubbleDown(0);
    }
    return top;
  }

  private bubbleUp(i: number): void {
    while (i > 0) {
      const parent = (i - 1) >> 1;
      if (this.heap[parent][0] <= this.heap[i][0]) break;
      [this.heap[parent], this.heap[i]] = [this.heap[i], this.heap[parent]];
      i = parent;
    }
  }

  private bubbleDown(i: number): void {
    const n = this.heap.length;
    while (true) {
      const l = 2 * i + 1;
      const r = 2 * i + 2;
      let smallest = i;
      if (l < n && this.heap[l][0] < this.heap[smallest][0]) smallest = l;
      if (r < n && this.heap[r][0] < this.heap[smallest][0]) smallest = r;
      if (smallest === i) break;
      [this.heap[smallest], this.heap[i]] = [this.heap[i], this.heap[smallest]];
      i = smallest;
    }
  }
}

export function dijkstra(graph: WeightedGraph, source: string): DijkstraResult {
  if (!graph.nodes().includes(source)) {
    throw new Error(`Source ${source} not in graph.`);
  }
  const distances = new Map<string, number>();
  const predecessors = new Map<string, string | null>();
  for (const n of graph.nodes()) {
    distances.set(n, Infinity);
    predecessors.set(n, null);
  }
  distances.set(source, 0);

  const heap = new MinHeap();
  heap.push([0, source]);

  while (heap.size() > 0) {
    const [d, u] = heap.pop()!;
    if (d > distances.get(u)!) continue;
    for (const [v, w] of graph.neighbours(u)) {
      const alt = d + w;
      if (alt < distances.get(v)!) {
        distances.set(v, alt);
        predecessors.set(v, u);
        heap.push([alt, v]);
      }
    }
  }

  return { distances, predecessors };
}

export function shortestPath(
  predecessors: Map<string, string | null>,
  source: string,
  target: string
): string[] {
  if (!predecessors.has(source) || !predecessors.has(target)) return [];
  const path: string[] = [];
  let node: string | null = target;
  while (node !== null) {
    path.push(node);
    node = predecessors.get(node)!;
  }
  path.reverse();
  if (path.length === 0 || path[0] !== source) return [];
  return path;
}

// ── Step-by-step variant for the visualiser ─────────────────────────

export interface DijkstraStep {
  /** Node just extracted from the frontier at this step (null on the initial step). */
  current: string | null;
  /** Nodes whose shortest distance is now settled. */
  settled: Set<string>;
  /** Nodes that have been reached but not yet settled, with their tentative distances. */
  frontier: Map<string, number>;
  /** Tentative distances for every node (Infinity for unreached). */
  distances: Map<string, number>;
  /** Predecessor map as it stood after this step's relaxations. */
  predecessors: Map<string, string | null>;
  /** Edges relaxed in this step (from current node to each neighbour whose distance improved). */
  relaxedEdges: Array<{ u: string; v: string; newDist: number }>;
}

export function dijkstraSteps(
  graph: WeightedGraph,
  source: string
): DijkstraStep[] {
  if (!graph.nodes().includes(source)) {
    throw new Error(`Source ${source} not in graph.`);
  }

  const distances = new Map<string, number>();
  const predecessors = new Map<string, string | null>();
  for (const n of graph.nodes()) {
    distances.set(n, Infinity);
    predecessors.set(n, null);
  }
  distances.set(source, 0);

  const settled = new Set<string>();
  const frontier = new Map<string, number>();
  frontier.set(source, 0);

  const steps: DijkstraStep[] = [];

  // Initial snapshot before any extraction.
  steps.push({
    current: null,
    settled: new Set(settled),
    frontier: new Map(frontier),
    distances: new Map(distances),
    predecessors: new Map(predecessors),
    relaxedEdges: [],
  });

  while (frontier.size > 0) {
    // Extract the frontier node with the smallest tentative distance.
    let current: string | null = null;
    let best = Infinity;
    for (const [n, d] of frontier) {
      if (d < best) {
        best = d;
        current = n;
      }
    }
    if (current === null) break;
    frontier.delete(current);
    settled.add(current);

    const relaxedEdges: DijkstraStep["relaxedEdges"] = [];
    for (const [v, w] of graph.neighbours(current)) {
      if (settled.has(v)) continue;
      const alt = distances.get(current)! + w;
      if (alt < distances.get(v)!) {
        distances.set(v, alt);
        predecessors.set(v, current);
        frontier.set(v, alt);
        relaxedEdges.push({ u: current, v, newDist: alt });
      }
    }

    steps.push({
      current,
      settled: new Set(settled),
      frontier: new Map(frontier),
      distances: new Map(distances),
      predecessors: new Map(predecessors),
      relaxedEdges,
    });
  }

  return steps;
}

// ── Dutch cities fixture used by both interactive demos ─────────────

export interface CityNode {
  id: string;
  name: string;
  x: number;
  y: number;
}

// Coordinates are a stylised map, not geographically accurate. The
// chosen cities match those in Dijkstra's ARMAC demo era (he used 64
// Dutch cities; we use ten so the visual stays legible).
export const DUTCH_CITIES: CityNode[] = [
  { id: "AMS", name: "Amsterdam",  x: 295, y: 165 },
  { id: "HAA", name: "Haarlem",    x: 220, y: 160 },
  { id: "UTR", name: "Utrecht",    x: 330, y: 225 },
  { id: "ROT", name: "Rotterdam",  x: 225, y: 260 },
  { id: "DHG", name: "The Hague",  x: 165, y: 240 },
  { id: "ARN", name: "Arnhem",     x: 445, y: 235 },
  { id: "ZWO", name: "Zwolle",     x: 460, y: 145 },
  { id: "GRO", name: "Groningen",  x: 535, y:  65 },
  { id: "EIN", name: "Eindhoven",  x: 370, y: 355 },
  { id: "MAA", name: "Maastricht", x: 430, y: 440 },
];

export interface DutchEdge {
  u: string;
  v: string;
  /** Default weight in kilometres (approximate road distance). */
  km: number;
}

export const DUTCH_ROADS: DutchEdge[] = [
  { u: "AMS", v: "HAA", km:  20 },
  { u: "AMS", v: "UTR", km:  45 },
  { u: "HAA", v: "DHG", km:  45 },
  { u: "DHG", v: "ROT", km:  25 },
  { u: "ROT", v: "UTR", km:  60 },
  { u: "UTR", v: "ARN", km:  65 },
  { u: "UTR", v: "EIN", km: 100 },
  { u: "ROT", v: "EIN", km: 110 },
  { u: "ARN", v: "ZWO", km:  65 },
  { u: "ARN", v: "EIN", km:  90 },
  { u: "ZWO", v: "GRO", km: 100 },
  { u: "AMS", v: "ZWO", km: 120 },
  { u: "EIN", v: "MAA", km:  85 },
  { u: "ARN", v: "MAA", km: 180 },
];

export function buildDutchGraph(
  weights: Map<string, number>
): WeightedGraph {
  const g = new WeightedGraph();
  for (const c of DUTCH_CITIES) g.addNode(c.id);
  for (const e of DUTCH_ROADS) {
    const key = `${e.u}-${e.v}`;
    const w = weights.get(key) ?? e.km;
    g.addEdge(e.u, e.v, w);
  }
  return g;
}
