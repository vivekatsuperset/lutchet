import { useMemo, useState } from "react";
import {
  buildDutchGraph,
  dijkstra,
  DUTCH_CITIES,
  DUTCH_ROADS,
  shortestPath,
} from "./weighted";

const CITY_BY_ID = Object.fromEntries(
  DUTCH_CITIES.map((c) => [c.id, c])
);

function edgeKey(u: string, v: string): string {
  return `${u}-${v}`;
}

function defaultWeights(): Map<string, number> {
  const m = new Map<string, number>();
  for (const e of DUTCH_ROADS) m.set(edgeKey(e.u, e.v), e.km);
  return m;
}

export default function DutchRoutes() {
  const [source, setSource] = useState<string>("ROT");
  const [target, setTarget] = useState<string>("GRO");
  const [weights, setWeights] = useState<Map<string, number>>(() =>
    defaultWeights()
  );

  const { graph, distances, path, pathEdges } = useMemo(() => {
    const g = buildDutchGraph(weights);
    const { distances: dists, predecessors } = dijkstra(g, source);
    const p = shortestPath(predecessors, source, target);
    const edges = new Set<string>();
    for (let i = 0; i + 1 < p.length; i++) {
      const a = p[i];
      const b = p[i + 1];
      edges.add(a < b ? `${a}|${b}` : `${b}|${a}`);
    }
    return { graph: g, distances: dists, path: p, pathEdges: edges };
  }, [weights, source, target]);

  const totalKm = distances.get(target);
  const reachable = totalKm !== undefined && Number.isFinite(totalKm);

  const adjust = (u: string, v: string, delta: number) => {
    setWeights((prev) => {
      const next = new Map(prev);
      const key = edgeKey(u, v);
      const current = next.get(key) ?? 0;
      next.set(key, Math.max(5, Math.round(current + delta)));
      return next;
    });
  };

  const reset = () => setWeights(defaultWeights());

  return (
    <div className="bg-navy-light rounded-xl border border-amber/20 border-t-2 border-t-amber/50 p-6 font-sans">
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <h3 className="text-amber font-semibold text-lg">
          Dutch Roads: Shortest Path
        </h3>
        <button
          onClick={reset}
          className="text-xs text-ivory-dim border border-ivory-dim/30 rounded px-3 py-1 hover:border-amber hover:text-amber transition-colors"
        >
          Reset weights
        </button>
      </div>

      <div className="grid md:grid-cols-[1fr_250px] gap-6">
        <div className="bg-navy rounded-lg border border-ivory-dim/10 overflow-hidden">
          <svg viewBox="0 0 620 500" className="w-full h-auto block">
            {DUTCH_ROADS.map((e) => {
              const a = CITY_BY_ID[e.u];
              const b = CITY_BY_ID[e.v];
              const key = [e.u, e.v].sort().join("|");
              const onPath = pathEdges.has(key);
              const w = weights.get(edgeKey(e.u, e.v)) ?? e.km;
              const mx = (a.x + b.x) / 2;
              const my = (a.y + b.y) / 2;
              return (
                <g key={`${e.u}-${e.v}`}>
                  <line
                    x1={a.x}
                    y1={a.y}
                    x2={b.x}
                    y2={b.y}
                    stroke={onPath ? "#c8a44a" : "#3a4460"}
                    strokeWidth={onPath ? 3.5 : 1.5}
                    className="transition-all duration-150"
                  />
                  <g
                    style={{ cursor: "pointer" }}
                    onClick={(ev) => {
                      ev.stopPropagation();
                      adjust(e.u, e.v, ev.shiftKey ? -10 : 10);
                    }}
                  >
                    <rect
                      x={mx - 18}
                      y={my - 10}
                      width={36}
                      height={18}
                      rx={4}
                      fill="#0a0e1a"
                      stroke={onPath ? "#c8a44a" : "#4a5068"}
                      strokeWidth={1}
                    />
                    <text
                      x={mx}
                      y={my + 3}
                      textAnchor="middle"
                      fontFamily="JetBrains Mono, monospace"
                      fontSize="10"
                      fill={onPath ? "#c8a44a" : "#b0a890"}
                    >
                      {w}
                    </text>
                    <title>
                      {`${CITY_BY_ID[e.u].name} - ${CITY_BY_ID[e.v].name}: ${w} km. Click +10, Shift+click -10.`}
                    </title>
                  </g>
                </g>
              );
            })}

            {DUTCH_CITIES.map((c) => {
              const isSource = c.id === source;
              const isTarget = c.id === target;
              const onPath = path.includes(c.id);
              const fill = isSource
                ? "#c8a44a"
                : isTarget
                ? "#4a90e2"
                : onPath
                ? "#1a2240"
                : "#0a0e1a";
              const stroke = isSource || isTarget || onPath ? "#c8a44a" : "#4a5068";
              return (
                <g
                  key={c.id}
                  onClick={(ev) => {
                    if (ev.shiftKey) setTarget(c.id);
                    else setSource(c.id);
                  }}
                  style={{ cursor: "pointer" }}
                >
                  <circle
                    cx={c.x}
                    cy={c.y}
                    r={14}
                    fill={fill}
                    stroke={stroke}
                    strokeWidth={2}
                  />
                  <text
                    x={c.x}
                    y={c.y - 22}
                    textAnchor="middle"
                    fontFamily="Instrument Sans, sans-serif"
                    fontSize="11"
                    fontWeight="600"
                    fill={isSource || isTarget ? "#c8a44a" : "#e8e4d9"}
                  >
                    {c.name}
                  </text>
                  <title>
                    {`${c.name}. Click to set as source (gold), shift-click to set as target (blue).`}
                  </title>
                </g>
              );
            })}
          </svg>
          <p className="text-xs text-ivory-dim/60 text-center py-3 px-4">
            Click a city to set the <span className="text-amber">source</span>.
            Shift-click to set the <span className="text-steel">target</span>.
            Click an edge label to add 10 km; shift-click to remove 10 km.
          </p>
        </div>

        <div className="flex flex-col gap-4">
          <div className="border border-amber/30 bg-amber/5 rounded-lg p-4">
            <p className="text-xs font-mono tracking-widest uppercase mb-2 text-amber">
              Shortest path
            </p>
            <p className="font-sans font-semibold text-sm mb-2 text-amber">
              {CITY_BY_ID[source].name} &rarr; {CITY_BY_ID[target].name}
            </p>
            {reachable ? (
              <>
                <p className="font-mono text-2xl text-ivory mb-1">
                  {totalKm} km
                </p>
                <p className="font-sans text-xs text-ivory/70 leading-relaxed">
                  {path.map((id) => CITY_BY_ID[id].name).join(" \u2192 ")}
                </p>
              </>
            ) : (
              <p className="font-sans text-xs text-ivory-dim">
                No path exists between these cities under the current
                weights.
              </p>
            )}
          </div>

          <div className="border border-ivory-dim/15 rounded-lg p-4">
            <p className="text-xs font-mono text-amber/70 tracking-widest uppercase mb-3">
              Distance from {CITY_BY_ID[source].name}
            </p>
            <div className="space-y-1 max-h-64 overflow-auto">
              {DUTCH_CITIES.filter((c) => c.id !== source).map((c) => {
                const d = distances.get(c.id);
                const finite = d !== undefined && Number.isFinite(d);
                return (
                  <div
                    key={c.id}
                    className="flex items-center justify-between text-sm"
                  >
                    <span className="font-serif text-ivory">{c.name}</span>
                    <span
                      className={`font-mono text-xs ${
                        c.id === target ? "text-amber" : "text-ivory-dim/70"
                      }`}
                    >
                      {finite ? `${d} km` : "unreachable"}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
