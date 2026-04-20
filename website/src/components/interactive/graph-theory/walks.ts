// Directed graph + random walks + PageRank for the Graph Theory / Random Walks lesson.
// Mirrors src/graph_theory/directed.py and src/graph_theory/walks.py.
// Keep the three in sync when changing semantics.

export class DirectedGraph {
  private adj = new Map<string, string[]>();

  addNode(n: string) {
    if (!this.adj.has(n)) this.adj.set(n, []);
  }

  addEdge(u: string, v: string) {
    if (u === v) throw new Error(`Self-loop on ${u} is not allowed.`);
    this.addNode(u);
    this.addNode(v);
    const outs = this.adj.get(u)!;
    if (!outs.includes(v)) outs.push(v);
  }

  nodes(): string[] {
    return [...this.adj.keys()];
  }

  edges(): Array<[string, string]> {
    const out: Array<[string, string]> = [];
    for (const [u, vs] of this.adj) {
      for (const v of vs) out.push([u, v]);
    }
    return out;
  }

  outNeighbours(n: string): string[] {
    return [...(this.adj.get(n) ?? [])];
  }

  inNeighbours(n: string): string[] {
    const out: string[] = [];
    for (const [u, vs] of this.adj) {
      if (vs.includes(n)) out.push(u);
    }
    return out;
  }

  outDegree(n: string): number {
    return (this.adj.get(n) ?? []).length;
  }
}

interface IterateOptions {
  teleport: Map<string, number>;
  damping: number;
  tol: number;
  maxIter: number;
  recordSteps: boolean;
}

interface IterateResult {
  ranks: Map<string, number>;
  stepHistory: Array<Map<string, number>>;
  deltaHistory: number[];
}

function pagerankIterate(
  graph: DirectedGraph,
  opts: IterateOptions
): IterateResult {
  const nodes = graph.nodes();
  const n = nodes.length;
  if (n === 0) {
    return { ranks: new Map(), stepHistory: [], deltaHistory: [] };
  }
  const { teleport, damping, tol, maxIter, recordSteps } = opts;
  if (!(damping > 0 && damping < 1)) {
    throw new Error(`damping must be strictly between 0 and 1; got ${damping}.`);
  }

  let ranks = new Map<string, number>();
  for (const node of nodes) ranks.set(node, 1 / n);
  const inNeighbours = new Map<string, string[]>();
  const outDeg = new Map<string, number>();
  for (const v of nodes) {
    inNeighbours.set(v, graph.inNeighbours(v));
    outDeg.set(v, graph.outDegree(v));
  }
  const dangling = nodes.filter((u) => (outDeg.get(u) ?? 0) === 0);

  const stepHistory: Array<Map<string, number>> = [];
  const deltaHistory: number[] = [];
  if (recordSteps) {
    stepHistory.push(new Map(ranks));
    deltaHistory.push(Infinity);
  }

  for (let iter = 0; iter < maxIter; iter++) {
    let danglingMass = 0;
    for (const u of dangling) danglingMass += ranks.get(u)!;
    const newRanks = new Map<string, number>();
    for (const v of nodes) {
      let incoming = 0;
      for (const u of inNeighbours.get(v)!) {
        incoming += ranks.get(u)! / outDeg.get(u)!;
      }
      const teleV = teleport.get(v) ?? 0;
      newRanks.set(
        v,
        damping * (incoming + danglingMass * teleV) + (1 - damping) * teleV
      );
    }
    let delta = 0;
    for (const v of nodes) {
      delta += Math.abs(newRanks.get(v)! - ranks.get(v)!);
    }
    ranks = newRanks;
    if (recordSteps) {
      stepHistory.push(new Map(ranks));
      deltaHistory.push(delta);
    }
    if (delta < tol) {
      return { ranks, stepHistory, deltaHistory };
    }
  }

  // Non-convergence: return what we have. The UI treats non-convergence
  // as "keep iterating" rather than failing, since users can drag the
  // damping up near 1 and expect to see slow behaviour.
  return { ranks, stepHistory, deltaHistory };
}

export function pagerank(
  graph: DirectedGraph,
  damping = 0.85,
  tol = 1e-8,
  maxIter = 200
): Map<string, number> {
  const nodes = graph.nodes();
  if (nodes.length === 0) return new Map();
  const teleport = new Map<string, number>();
  for (const node of nodes) teleport.set(node, 1 / nodes.length);
  return pagerankIterate(graph, {
    teleport,
    damping,
    tol,
    maxIter,
    recordSteps: false,
  }).ranks;
}

export function personalizedPagerank(
  graph: DirectedGraph,
  seed: string,
  damping = 0.85,
  tol = 1e-8,
  maxIter = 200
): Map<string, number> {
  if (!graph.nodes().includes(seed)) {
    throw new Error(`Seed ${seed} not in graph.`);
  }
  const teleport = new Map<string, number>();
  for (const node of graph.nodes()) teleport.set(node, 0);
  teleport.set(seed, 1);
  return pagerankIterate(graph, {
    teleport,
    damping,
    tol,
    maxIter,
    recordSteps: false,
  }).ranks;
}

export interface PageRankSteps {
  steps: Array<Map<string, number>>;
  deltas: number[];
}

export function pagerankSteps(
  graph: DirectedGraph,
  damping = 0.85,
  tol = 1e-8,
  maxIter = 200
): PageRankSteps {
  const nodes = graph.nodes();
  if (nodes.length === 0) return { steps: [], deltas: [] };
  const teleport = new Map<string, number>();
  for (const node of nodes) teleport.set(node, 1 / nodes.length);
  const result = pagerankIterate(graph, {
    teleport,
    damping,
    tol,
    maxIter,
    recordSteps: true,
  });
  return { steps: result.stepHistory, deltas: result.deltaHistory };
}

// ── Web-graph fixture for PageRankPowerIteration ───────────────────

export interface GraphNode {
  id: string;
  label: string;
  x: number;
  y: number;
}

// Eight stylised web pages. The structure is loosely inspired by the
// 11-node example in Brin and Page's original 1998 paper: a couple of
// hubs, a couple of authorities, and a pure source.
export const WEB_NODES: GraphNode[] = [
  { id: "A", label: "A", x: 120, y: 120 },
  { id: "B", label: "B", x: 280, y:  70 },
  { id: "C", label: "C", x: 440, y: 120 },
  { id: "D", label: "D", x: 520, y: 260 },
  { id: "E", label: "E", x: 440, y: 400 },
  { id: "F", label: "F", x: 280, y: 450 },
  { id: "G", label: "G", x: 120, y: 400 },
  { id: "H", label: "H", x:  60, y: 260 },
];

export const WEB_EDGES: Array<[string, string]> = [
  ["A", "B"],
  ["A", "H"],
  ["B", "C"],
  ["B", "D"],
  ["C", "D"],
  ["D", "E"],
  ["D", "C"],
  ["E", "F"],
  ["E", "D"],
  ["F", "G"],
  ["G", "H"],
  ["G", "A"],
  ["H", "A"],
  ["H", "F"],
];

export function buildWebGraph(): DirectedGraph {
  const g = new DirectedGraph();
  for (const n of WEB_NODES) g.addNode(n.id);
  for (const [u, v] of WEB_EDGES) g.addEdge(u, v);
  return g;
}

// ── Knowledge-graph fixture for PersonalizedPageRank ──────────────
//
// An Easter-egg cast drawn from characters and concepts that appear
// in the other lessons on this site: Shannon, Huffman, Turing,
// Kolmogorov, Bayes, Euler, Dijkstra, their papers, and a handful of
// connecting concepts. The edges are typed by convention in the label
// (e.g. "wrote", "cites", "applies") but the graph itself is plain
// directed: personalised PageRank doesn't care about edge types.

export const KNOWLEDGE_NODES: GraphNode[] = [
  { id: "shannon",     label: "Shannon",                 x:  80, y: 110 },
  { id: "mtc",         label: "A Mathematical Theory of Communication (1948)", x: 270, y:  65 },
  { id: "entropy",     label: "Entropy",                 x: 470, y: 110 },
  { id: "huffman",     label: "Huffman",                 x: 620, y:  55 },
  { id: "huffman_code", label: "Huffman coding (1952)",  x: 640, y: 170 },
  { id: "turing",      label: "Turing",                  x:  70, y: 265 },
  { id: "enigma",      label: "Enigma",                  x: 240, y: 235 },
  { id: "bayes",       label: "Bayes",                   x: 400, y: 290 },
  { id: "kolmogorov",  label: "Kolmogorov",              x: 560, y: 320 },
  { id: "complexity",  label: "Kolmogorov complexity",   x: 660, y: 260 },
  { id: "euler",       label: "Euler",                   x: 110, y: 420 },
  { id: "graph_theory", label: "Graph theory",           x: 310, y: 455 },
  { id: "dijkstra",    label: "Dijkstra",                x: 470, y: 425 },
  { id: "pagerank",    label: "PageRank (1998)",         x: 640, y: 410 },
];

export const KNOWLEDGE_EDGES: Array<[string, string]> = [
  ["shannon", "mtc"],
  ["mtc", "entropy"],
  ["entropy", "huffman_code"],
  ["huffman", "huffman_code"],
  ["huffman_code", "mtc"],
  ["turing", "enigma"],
  ["bayes", "enigma"],
  ["turing", "complexity"],
  ["kolmogorov", "complexity"],
  ["complexity", "entropy"],
  ["shannon", "entropy"],
  ["euler", "graph_theory"],
  ["graph_theory", "dijkstra"],
  ["graph_theory", "pagerank"],
  ["dijkstra", "pagerank"],
  ["entropy", "complexity"],
  ["bayes", "mtc"],
  ["enigma", "shannon"],
  ["pagerank", "graph_theory"],
  ["dijkstra", "graph_theory"],
];

export function buildKnowledgeGraph(): DirectedGraph {
  const g = new DirectedGraph();
  for (const n of KNOWLEDGE_NODES) g.addNode(n.id);
  for (const [u, v] of KNOWLEDGE_EDGES) g.addEdge(u, v);
  return g;
}
