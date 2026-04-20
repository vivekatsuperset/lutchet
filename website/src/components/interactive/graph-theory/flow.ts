// Flow networks, max-flow, min-cut for the Graph Theory / Soviet Rail lesson.
// Mirrors src/graph_theory/flow.py. Keep the two in sync when changing semantics.

export interface FlowEdge {
  u: string;
  v: string;
  capacity: number;
}

export class FlowNetwork {
  private cap = new Map<string, Map<string, number>>();

  addNode(n: string) {
    if (!this.cap.has(n)) this.cap.set(n, new Map());
  }

  addEdge(u: string, v: string, capacity: number) {
    if (capacity < 0) {
      throw new Error(
        `Edge (${u}, ${v}) has negative capacity ${capacity}; flow networks require non-negative capacities.`
      );
    }
    if (u === v) {
      throw new Error(`Self-loop on ${u} is not a valid flow edge.`);
    }
    this.addNode(u);
    this.addNode(v);
    const existing = this.cap.get(u)!.get(v) ?? 0;
    this.cap.get(u)!.set(v, existing + capacity);
  }

  capacity(u: string, v: string): number {
    return this.cap.get(u)?.get(v) ?? 0;
  }

  nodes(): string[] {
    return [...this.cap.keys()];
  }

  edges(): FlowEdge[] {
    const out: FlowEdge[] = [];
    for (const [u, vs] of this.cap) {
      for (const [v, c] of vs) out.push({ u, v, capacity: c });
    }
    return out;
  }
}

type Residual = Map<string, Map<string, number>>;

function buildResidual(net: FlowNetwork): Residual {
  const r: Residual = new Map();
  for (const u of net.nodes()) r.set(u, new Map());
  for (const { u, v, capacity } of net.edges()) {
    const row = r.get(u)!;
    row.set(v, (row.get(v) ?? 0) + capacity);
    const rev = r.get(v)!;
    if (!rev.has(u)) rev.set(u, 0);
  }
  return r;
}

function bfsAugmentingPath(
  residual: Residual,
  source: string,
  sink: string
): string[] | null {
  const predecessors = new Map<string, string | null>();
  predecessors.set(source, null);
  const queue: string[] = [source];
  while (queue.length > 0) {
    const u = queue.shift()!;
    if (u === sink) break;
    for (const [v, cap] of residual.get(u)!) {
      if (cap > 0 && !predecessors.has(v)) {
        predecessors.set(v, u);
        queue.push(v);
      }
    }
  }
  if (!predecessors.has(sink)) return null;
  const path: string[] = [];
  let node: string | null = sink;
  while (node !== null) {
    path.push(node);
    node = predecessors.get(node)!;
  }
  path.reverse();
  return path;
}

function edgeKey(u: string, v: string): string {
  return `${u}->${v}`;
}

export interface MaxFlowResult {
  value: number;
  /** Flow on each original edge, keyed by "u->v". */
  flow: Map<string, number>;
}

export function maxFlow(
  net: FlowNetwork,
  source: string,
  sink: string
): MaxFlowResult {
  if (!net.nodes().includes(source)) {
    throw new Error(`Source ${source} not in network.`);
  }
  if (!net.nodes().includes(sink)) {
    throw new Error(`Sink ${sink} not in network.`);
  }
  if (source === sink) {
    throw new Error("Source and sink must be distinct.");
  }

  const residual = buildResidual(net);
  const originalCaps = new Map<string, number>();
  for (const { u, v, capacity } of net.edges()) {
    originalCaps.set(edgeKey(u, v), capacity);
  }

  let value = 0;
  while (true) {
    const path = bfsAugmentingPath(residual, source, sink);
    if (path === null) break;
    let bottleneck = Infinity;
    for (let i = 0; i + 1 < path.length; i++) {
      const c = residual.get(path[i])!.get(path[i + 1])!;
      if (c < bottleneck) bottleneck = c;
    }
    for (let i = 0; i + 1 < path.length; i++) {
      const u = path[i];
      const v = path[i + 1];
      residual.get(u)!.set(v, residual.get(u)!.get(v)! - bottleneck);
      residual.get(v)!.set(u, (residual.get(v)!.get(u) ?? 0) + bottleneck);
    }
    value += bottleneck;
  }

  const flow = new Map<string, number>();
  for (const [key, cap] of originalCaps) {
    const [u, v] = key.split("->");
    const remaining = residual.get(u)!.get(v) ?? 0;
    flow.set(key, cap - remaining);
  }
  return { value, flow };
}

export interface MinCutResult {
  value: number;
  /** Directed original edges crossing the cut (source side -> sink side). */
  edges: Set<string>;
  /** Nodes on the source side of the cut. */
  sourceSide: Set<string>;
}

export function minCut(
  net: FlowNetwork,
  source: string,
  sink: string
): MinCutResult {
  const { value } = maxFlow(net, source, sink);

  // Replay the augmentations to recover the final residual.
  const residual = buildResidual(net);
  const originalCaps = new Map<string, number>();
  for (const { u, v, capacity } of net.edges()) {
    originalCaps.set(edgeKey(u, v), capacity);
  }
  while (true) {
    const path = bfsAugmentingPath(residual, source, sink);
    if (path === null) break;
    let bottleneck = Infinity;
    for (let i = 0; i + 1 < path.length; i++) {
      const c = residual.get(path[i])!.get(path[i + 1])!;
      if (c < bottleneck) bottleneck = c;
    }
    for (let i = 0; i + 1 < path.length; i++) {
      const u = path[i];
      const v = path[i + 1];
      residual.get(u)!.set(v, residual.get(u)!.get(v)! - bottleneck);
      residual.get(v)!.set(u, (residual.get(v)!.get(u) ?? 0) + bottleneck);
    }
  }

  const reachable = new Set<string>([source]);
  const queue: string[] = [source];
  while (queue.length > 0) {
    const u = queue.shift()!;
    for (const [v, cap] of residual.get(u)!) {
      if (cap > 0 && !reachable.has(v)) {
        reachable.add(v);
        queue.push(v);
      }
    }
  }

  const edges = new Set<string>();
  for (const key of originalCaps.keys()) {
    const [u, v] = key.split("->");
    if (reachable.has(u) && !reachable.has(v)) edges.add(key);
  }
  return { value, edges, sourceSide: reachable };
}

// ── Step-by-step variant for the visualiser ─────────────────────────

export interface FlowStep {
  /** Augmenting path found at this step (empty on the initial step). */
  path: string[];
  /** Bottleneck capacity along that path (0 on the initial step). */
  bottleneck: number;
  /** Cumulative flow value after this step. */
  flowValue: number;
  /** Residual capacity per edge after this step, keyed by "u->v" (includes reverse edges). */
  residual: Map<string, number>;
  /** Flow on each original edge after this step, keyed by "u->v". */
  flow: Map<string, number>;
}

export function maxFlowSteps(
  net: FlowNetwork,
  source: string,
  sink: string
): FlowStep[] {
  if (!net.nodes().includes(source)) {
    throw new Error(`Source ${source} not in network.`);
  }
  if (!net.nodes().includes(sink)) {
    throw new Error(`Sink ${sink} not in network.`);
  }
  if (source === sink) {
    throw new Error("Source and sink must be distinct.");
  }

  const residual = buildResidual(net);
  const originalCaps = new Map<string, number>();
  for (const { u, v, capacity } of net.edges()) {
    originalCaps.set(edgeKey(u, v), capacity);
  }

  const snapshot = (): { residual: Map<string, number>; flow: Map<string, number> } => {
    const rSnap = new Map<string, number>();
    for (const [u, vs] of residual) {
      for (const [v, c] of vs) rSnap.set(edgeKey(u, v), c);
    }
    const fSnap = new Map<string, number>();
    for (const [key, cap] of originalCaps) {
      const [u, v] = key.split("->");
      fSnap.set(key, cap - (residual.get(u)!.get(v) ?? 0));
    }
    return { residual: rSnap, flow: fSnap };
  };

  const steps: FlowStep[] = [];
  {
    const { residual: r, flow: f } = snapshot();
    steps.push({ path: [], bottleneck: 0, flowValue: 0, residual: r, flow: f });
  }

  let value = 0;
  while (true) {
    const path = bfsAugmentingPath(residual, source, sink);
    if (path === null) break;
    let bottleneck = Infinity;
    for (let i = 0; i + 1 < path.length; i++) {
      const c = residual.get(path[i])!.get(path[i + 1])!;
      if (c < bottleneck) bottleneck = c;
    }
    for (let i = 0; i + 1 < path.length; i++) {
      const u = path[i];
      const v = path[i + 1];
      residual.get(u)!.set(v, residual.get(u)!.get(v)! - bottleneck);
      residual.get(v)!.set(u, (residual.get(v)!.get(u) ?? 0) + bottleneck);
    }
    value += bottleneck;
    const { residual: r, flow: f } = snapshot();
    steps.push({ path, bottleneck, flowValue: value, residual: r, flow: f });
  }

  return steps;
}

// ── Soviet rail fixture used by the interactive demos ──────────────

export interface CityNode {
  id: string;
  name: string;
  x: number;
  y: number;
}

// Stylised layout. Moscow (source) is on the right; the Western Frontier
// sink is on the left. Positions are chosen for visual clarity, not
// geographical accuracy. The node set is loosely modelled on the 1955
// Harris-Ross study of the Soviet rail network (their study had ~44
// vertices; we use ten so the visual stays legible).
export const SOVIET_CITIES: CityNode[] = [
  { id: "MOW", name: "Moscow",    x: 560, y: 230 },
  { id: "LED", name: "Leningrad", x: 500, y:  85 },
  { id: "MSK", name: "Minsk",     x: 410, y: 190 },
  { id: "KIE", name: "Kiev",      x: 400, y: 320 },
  { id: "WAW", name: "Warsaw",    x: 300, y: 210 },
  { id: "BER", name: "Berlin",    x: 185, y: 130 },
  { id: "PRG", name: "Prague",    x: 225, y: 275 },
  { id: "BUD", name: "Budapest",  x: 360, y: 405 },
  { id: "VIE", name: "Vienna",    x: 270, y: 375 },
  { id: "FRO", name: "Frontier",  x:  75, y: 230 },
];

export interface RailLine {
  u: string;
  v: string;
  /** Default capacity, in stylised supply units per day. */
  capacity: number;
}

// Directed edges: supply flows from Moscow westward to the frontier.
// Capacities are illustrative; the Harris-Ross study used track count,
// grade, and locomotive availability to derive theirs.
export const SOVIET_LINES: RailLine[] = [
  { u: "MOW", v: "LED", capacity: 30 },
  { u: "MOW", v: "MSK", capacity: 40 },
  { u: "MOW", v: "KIE", capacity: 35 },
  { u: "LED", v: "MSK", capacity: 20 },
  { u: "LED", v: "BER", capacity: 25 },
  { u: "MSK", v: "WAW", capacity: 30 },
  { u: "KIE", v: "WAW", capacity: 20 },
  { u: "KIE", v: "BUD", capacity: 25 },
  { u: "WAW", v: "BER", capacity: 35 },
  { u: "WAW", v: "PRG", capacity: 25 },
  { u: "PRG", v: "VIE", capacity: 20 },
  { u: "PRG", v: "FRO", capacity: 30 },
  { u: "BER", v: "FRO", capacity: 40 },
  { u: "VIE", v: "FRO", capacity: 25 },
  { u: "BUD", v: "VIE", capacity: 20 },
];

export const SOVIET_SOURCE = "MOW";
export const SOVIET_SINK = "FRO";

export function buildSovietNetwork(
  capacities: Map<string, number>
): FlowNetwork {
  const net = new FlowNetwork();
  for (const c of SOVIET_CITIES) net.addNode(c.id);
  for (const line of SOVIET_LINES) {
    const key = edgeKey(line.u, line.v);
    const cap = capacities.get(key) ?? line.capacity;
    net.addEdge(line.u, line.v, cap);
  }
  return net;
}

export { edgeKey as flowEdgeKey };
