import { useMemo, useState } from "react";
import {
  buildKoenigsberg,
  hasEulerianCircuit,
  hasEulerianPath,
  KOENIGSBERG_BRIDGES,
  KOENIGSBERG_NODES,
} from "./graph";

interface NodePos {
  x: number;
  y: number;
  label: string;
  long: string;
}

const NODE_POSITIONS: Record<string, NodePos> = {
  N: { x: 390, y:  70, label: "N", long: "North bank" },
  S: { x: 390, y: 430, label: "S", long: "South bank" },
  K: { x: 230, y: 250, label: "K", long: "Kneiphof" },
  L: { x: 570, y: 250, label: "L", long: "Lomse" },
};

// Bridge geometry. Parallel bridges are offset perpendicular to the
// connection so they don't overlap visually. Endpoints sit just outside
// the node circles (radius 38) so lines appear to attach to the land.
const BRIDGE_GEOM: Record<string, { x1: number; y1: number; x2: number; y2: number }> = {
  kraemer:  { x1: 360, y1: 100, x2: 250, y2: 220 }, // N → K, left
  schmiede: { x1: 398, y1: 108, x2: 275, y2: 238 }, // N → K, right
  gruene:   { x1: 360, y1: 400, x2: 250, y2: 280 }, // S → K, left
  koettel:  { x1: 398, y1: 392, x2: 275, y2: 262 }, // S → K, right
  honig:    { x1: 268, y1: 250, x2: 532, y2: 250 }, // K → L, horizontal
  hohe:     { x1: 420, y1: 100, x2: 548, y2: 220 }, // N → L
  holz:     { x1: 420, y1: 400, x2: 548, y2: 280 }, // S → L
};

export default function KoenigsbergBridges() {
  const [active, setActive] = useState<Set<string>>(
    () => new Set(KOENIGSBERG_BRIDGES.map((b) => b.id))
  );

  const graph = useMemo(() => buildKoenigsberg(active), [active]);
  const circuit = hasEulerianCircuit(graph);
  const path = hasEulerianPath(graph);
  const odd = graph.oddDegreeNodes();

  const toggle = (id: string) => {
    setActive((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const reset = () =>
    setActive(new Set(KOENIGSBERG_BRIDGES.map((b) => b.id)));

  let statusLabel: string;
  let statusDetail: string;
  let tone: "ok" | "path" | "no";
  if (active.size === 0) {
    statusLabel = "No bridges";
    statusDetail = "Toggle bridges on to start. The original Königsberg had all seven.";
    tone = "no";
  } else if (circuit) {
    statusLabel = "Eulerian circuit possible";
    statusDetail = "You can walk every remaining bridge exactly once and return to where you started.";
    tone = "ok";
  } else if (path) {
    const [a, b] = odd;
    statusLabel = "Eulerian path possible";
    statusDetail = `You can cross every bridge exactly once, starting at ${longName(a)} and ending at ${longName(b)}, but you can't return to the start.`;
    tone = "path";
  } else {
    statusLabel = "No Eulerian walk exists";
    statusDetail = `${odd.length} land masses have an odd number of bridges. Euler's rule requires exactly 0 or 2.`;
    tone = "no";
  }

  const toneClasses = {
    ok:   "border-amber/50 bg-amber/5",
    path: "border-steel/50 bg-steel/5",
    no:   "border-ivory-dim/30 bg-navy",
  }[tone];

  const toneText = {
    ok:   "text-amber",
    path: "text-steel",
    no:   "text-ivory-dim",
  }[tone];

  return (
    <div className="bg-navy-light rounded-xl border border-amber/20 border-t-2 border-t-amber/50 p-6 font-sans">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-amber font-semibold text-lg">
          Königsberg: Interactive Bridge Puzzle
        </h3>
        <button
          onClick={reset}
          className="text-xs text-ivory-dim border border-ivory-dim/30 rounded px-3 py-1 hover:border-amber hover:text-amber transition-colors"
        >
          Reset
        </button>
      </div>

      <div className="grid md:grid-cols-[1fr_240px] gap-6">
        {/* Map */}
        <div className="bg-navy rounded-lg border border-ivory-dim/10 overflow-hidden">
          <svg viewBox="0 0 780 500" className="w-full h-auto block">
            {/* River stripes */}
            <rect x="0" y="185" width="780" height="45" fill="#1a2240" opacity="0.55" />
            <rect x="0" y="270" width="780" height="45" fill="#1a2240" opacity="0.55" />

            {/* Bridges */}
            {KOENIGSBERG_BRIDGES.map((b) => {
              const p = BRIDGE_GEOM[b.id];
              const on = active.has(b.id);
              return (
                <g
                  key={b.id}
                  onClick={() => toggle(b.id)}
                  style={{ cursor: "pointer" }}
                >
                  {/* Visible stroke */}
                  <line
                    x1={p.x1}
                    y1={p.y1}
                    x2={p.x2}
                    y2={p.y2}
                    stroke={on ? "#c8a44a" : "#3a4460"}
                    strokeWidth={on ? 4 : 2}
                    strokeDasharray={on ? "none" : "5 4"}
                    strokeLinecap="round"
                    className="transition-all duration-150"
                  />
                  {/* Wider invisible hit target */}
                  <line
                    x1={p.x1}
                    y1={p.y1}
                    x2={p.x2}
                    y2={p.y2}
                    stroke="transparent"
                    strokeWidth={18}
                  />
                  <title>{`${b.name}: click to ${on ? "remove" : "add"}`}</title>
                </g>
              );
            })}

            {/* Nodes */}
            {Object.entries(NODE_POSITIONS).map(([id, pos]) => {
              const d = graph.degree(id);
              const isOdd = d % 2 === 1 && d > 0;
              return (
                <g key={id}>
                  <text
                    x={pos.x}
                    y={pos.y - 52}
                    textAnchor="middle"
                    fontFamily="JetBrains Mono, monospace"
                    fontSize="11"
                    fill={isOdd ? "#c8a44a" : "#4a90e2"}
                    opacity="0.85"
                  >
                    degree {d}
                  </text>
                  <circle
                    cx={pos.x}
                    cy={pos.y}
                    r="38"
                    fill="#0a0e1a"
                    stroke={isOdd ? "#c8a44a" : "#4a90e2"}
                    strokeWidth="2.5"
                  />
                  <text
                    x={pos.x}
                    y={pos.y + 10}
                    textAnchor="middle"
                    fontFamily="EB Garamond, serif"
                    fontSize="30"
                    fontWeight="600"
                    fill={isOdd ? "#c8a44a" : "#e8e4d9"}
                  >
                    {pos.label}
                  </text>
                  <text
                    x={pos.x}
                    y={pos.y + 62}
                    textAnchor="middle"
                    fontFamily="Instrument Sans, sans-serif"
                    fontSize="12"
                    fill="#b0a890"
                  >
                    {pos.long}
                  </text>
                </g>
              );
            })}
          </svg>
          <p className="text-xs text-ivory-dim/60 text-center py-3 px-4">
            Click a bridge to toggle it. Land masses with an <span className="text-amber">odd</span> number of bridges are highlighted.
          </p>
        </div>

        {/* Side panel */}
        <div className="flex flex-col gap-4">
          <div className={`border rounded-lg p-4 ${toneClasses}`}>
            <p className={`text-xs font-mono tracking-widest uppercase mb-2 ${toneText}`}>
              Status
            </p>
            <p className={`font-sans font-semibold text-sm mb-2 ${toneText}`}>
              {statusLabel}
            </p>
            <p className="font-sans text-xs text-ivory/70 leading-relaxed">
              {statusDetail}
            </p>
          </div>

          <div className="border border-ivory-dim/15 rounded-lg p-4">
            <p className="text-xs font-mono text-amber/70 tracking-widest uppercase mb-3">
              Land masses
            </p>
            <div className="space-y-2">
              {Object.entries(NODE_POSITIONS).map(([id, pos]) => {
                const d = graph.degree(id);
                const o = d % 2 === 1 && d > 0;
                return (
                  <div
                    key={id}
                    className="flex items-center justify-between text-sm"
                  >
                    <span className="font-serif text-ivory">{pos.long}</span>
                    <span className={`font-mono text-xs ${o ? "text-amber" : "text-ivory-dim/70"}`}>
                      {d} bridge{d === 1 ? "" : "s"}{o ? " · odd" : ""}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="border border-ivory-dim/15 rounded-lg p-4">
            <p className="text-xs font-mono text-amber/70 tracking-widest uppercase mb-3">
              Euler's rule
            </p>
            <p className="font-sans text-xs text-ivory/70 leading-relaxed">
              A walk that crosses every bridge exactly once exists iff <span className="text-ivory">0 or 2</span> land masses have an odd number of bridges. A <em>circuit</em> that also returns to start requires <span className="text-ivory">0</span>.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function longName(id: string): string {
  return NODE_POSITIONS[id]?.long ?? id;
}
