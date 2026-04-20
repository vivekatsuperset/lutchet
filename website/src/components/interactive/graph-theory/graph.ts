// Graph primitives for the Graph Theory lessons.
// Mirrors src/graph_theory/core.py. Keep the two in sync.
//
// Undirected multigraph. Parallel edges are preserved because Königsberg
// has two bridges between some pairs of land masses and the analysis
// depends on counting them separately.

export class Graph {
  private adj = new Map<string, string[]>();

  addNode(n: string) {
    if (!this.adj.has(n)) this.adj.set(n, []);
  }

  addEdge(u: string, v: string) {
    this.addNode(u);
    this.addNode(v);
    this.adj.get(u)!.push(v);
    this.adj.get(v)!.push(u);
  }

  removeEdge(u: string, v: string) {
    const uList = this.adj.get(u);
    const vList = this.adj.get(v);
    if (!uList || !vList) return;
    const i = uList.indexOf(v);
    const j = vList.indexOf(u);
    if (i !== -1) uList.splice(i, 1);
    if (j !== -1) vList.splice(j, 1);
  }

  nodes(): string[] {
    return [...this.adj.keys()];
  }

  degree(n: string): number {
    return this.adj.get(n)?.length ?? 0;
  }

  isConnected(): boolean {
    if (this.adj.size === 0) return true;
    // Only nodes with at least one edge need to be connected. Isolated
    // nodes would trivially fail this for Königsberg where we always
    // register all four land masses even when bridges are removed.
    const withEdges = this.nodes().filter((n) => this.degree(n) > 0);
    if (withEdges.length === 0) return true;
    const start = withEdges[0];
    const visited = new Set<string>([start]);
    const queue: string[] = [start];
    while (queue.length) {
      const u = queue.shift()!;
      for (const v of this.adj.get(u)!) {
        if (!visited.has(v)) {
          visited.add(v);
          queue.push(v);
        }
      }
    }
    return withEdges.every((n) => visited.has(n));
  }

  oddDegreeNodes(): string[] {
    return this.nodes().filter((n) => this.degree(n) % 2 === 1);
  }
}

export function hasEulerianCircuit(g: Graph): boolean {
  return g.isConnected() && g.oddDegreeNodes().length === 0;
}

export function hasEulerianPath(g: Graph): boolean {
  const odd = g.oddDegreeNodes().length;
  return g.isConnected() && (odd === 0 || odd === 2);
}

// ── Königsberg fixtures ────────────────────────────────────────────

export const KOENIGSBERG_NODES = {
  NORTH: "N",
  SOUTH: "S",
  KNEIPHOF: "K",
  LOMSE: "L",
} as const;

export interface Bridge {
  id: string;
  u: string;
  v: string;
  name: string;
}

export const KOENIGSBERG_BRIDGES: Bridge[] = [
  { id: "kraemer",  u: "N", v: "K", name: "Krämerbrücke" },
  { id: "schmiede", u: "N", v: "K", name: "Schmiedebrücke" },
  { id: "gruene",   u: "S", v: "K", name: "Grüne Brücke" },
  { id: "koettel",  u: "S", v: "K", name: "Köttelbrücke" },
  { id: "honig",    u: "K", v: "L", name: "Honigbrücke" },
  { id: "hohe",     u: "N", v: "L", name: "Hohe Brücke" },
  { id: "holz",     u: "S", v: "L", name: "Holzbrücke" },
];

export function buildKoenigsberg(activeBridgeIds: ReadonlySet<string>): Graph {
  const g = new Graph();
  // Always register all four land masses so the UI can show them even
  // when all bridges are removed.
  for (const id of Object.values(KOENIGSBERG_NODES)) g.addNode(id);
  for (const b of KOENIGSBERG_BRIDGES) {
    if (activeBridgeIds.has(b.id)) g.addEdge(b.u, b.v);
  }
  return g;
}
