import { useMemo, useState } from "react";
import {
  buildKnowledgeGraph,
  KNOWLEDGE_EDGES,
  KNOWLEDGE_NODES,
  personalizedPagerank,
} from "./walks";

const NODE_BY_ID = Object.fromEntries(
  KNOWLEDGE_NODES.map((n) => [n.id, n])
);

export default function PersonalizedPageRank() {
  const [seed, setSeed] = useState<string>("shannon");

  const ranks = useMemo(() => {
    const g = buildKnowledgeGraph();
    return personalizedPagerank(g, seed, 0.85, 1e-9, 300);
  }, [seed]);

  const maxRank = Math.max(...ranks.values());
  const minRank = Math.min(...ranks.values());

  const sorted = [...ranks.entries()].sort((a, b) => b[1] - a[1]);
  const top5 = sorted.slice(0, 5);

  const intensityFor = (id: string): number => {
    const r = ranks.get(id) ?? 0;
    if (maxRank === minRank) return 0.3;
    return (r - minRank) / (maxRank - minRank);
  };

  return (
    <div className="bg-navy-light rounded-xl border border-steel/30 border-t-2 border-t-steel/60 p-6 font-sans">
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <h3 className="text-steel font-semibold text-lg">
          Knowledge Graph: Personalised PageRank
        </h3>
        <p className="text-xs text-ivory-dim">
          Click any node to set it as the seed.
        </p>
      </div>

      <div className="grid md:grid-cols-[1fr_260px] gap-6">
        <div className="bg-navy rounded-lg border border-ivory-dim/10 overflow-hidden">
          <svg viewBox="0 0 720 520" className="w-full h-auto block">
            <defs>
              <marker
                id="ppr-arrow"
                viewBox="0 0 10 10"
                refX="10"
                refY="5"
                markerWidth="6"
                markerHeight="6"
                orient="auto-start-reverse"
              >
                <path d="M 0 0 L 10 5 L 0 10 z" fill="#4a5068" />
              </marker>
            </defs>

            {KNOWLEDGE_EDGES.map(([u, v]) => {
              const a = NODE_BY_ID[u];
              const b = NODE_BY_ID[v];
              const dx = b.x - a.x;
              const dy = b.y - a.y;
              const len = Math.sqrt(dx * dx + dy * dy) || 1;
              const ux = dx / len;
              const uy = dy / len;
              const r = 14;
              const x1 = a.x + ux * r;
              const y1 = a.y + uy * r;
              const x2 = b.x - ux * r;
              const y2 = b.y - uy * r;
              const relevant =
                intensityFor(u) > 0.2 && intensityFor(v) > 0.2;
              return (
                <line
                  key={`${u}-${v}`}
                  x1={x1}
                  y1={y1}
                  x2={x2}
                  y2={y2}
                  stroke={relevant ? "#c8a44a" : "#3a4460"}
                  strokeOpacity={relevant ? 0.8 : 0.5}
                  strokeWidth={relevant ? 2 : 1.2}
                  markerEnd="url(#ppr-arrow)"
                  className="transition-all duration-300"
                />
              );
            })}

            {KNOWLEDGE_NODES.map((n) => {
              const isSeed = n.id === seed;
              const t = intensityFor(n.id);
              const fill = isSeed
                ? "#4a90e2"
                : `rgba(200, 164, 74, ${0.1 + t * 0.65})`;
              const stroke = isSeed ? "#4a90e2" : "#c8a44a";
              return (
                <g
                  key={n.id}
                  style={{ cursor: "pointer" }}
                  onClick={() => setSeed(n.id)}
                >
                  <circle
                    cx={n.x}
                    cy={n.y}
                    r={14}
                    fill={fill}
                    stroke={stroke}
                    strokeWidth={isSeed ? 3 : 2}
                    className="transition-all duration-300"
                  />
                  <text
                    x={n.x}
                    y={n.y - 22}
                    textAnchor="middle"
                    fontFamily="Instrument Sans, sans-serif"
                    fontSize="11"
                    fontWeight="600"
                    fill={isSeed ? "#4a90e2" : "#e8e4d9"}
                    style={{ pointerEvents: "none" }}
                  >
                    {n.label}
                  </text>
                  <title>{`${n.label}: click to set as seed. Personalised rank ${(
                    ranks.get(n.id) ?? 0
                  ).toFixed(3)}.`}</title>
                </g>
              );
            })}
          </svg>
          <p className="text-xs text-ivory-dim/60 text-center py-3 px-4">
            <span className="text-steel">Blue</span> is the seed.
            <span className="text-amber"> Gold</span> intensity shows
            how strongly each node is surfaced by a damped random walk
            from the seed.
          </p>
        </div>

        <div className="flex flex-col gap-4">
          <div className="border border-steel/30 bg-steel/5 rounded-lg p-4">
            <p className="text-xs font-mono tracking-widest uppercase mb-2 text-steel">
              Seed
            </p>
            <p className="font-serif text-lg text-ivory mb-2">
              {NODE_BY_ID[seed].label}
            </p>
            <p className="font-sans text-xs text-ivory/70 leading-relaxed">
              Personalised PageRank starts every teleport from this
              node. The result ranks everything else by how related it
              is to the seed.
            </p>
          </div>

          <div className="border border-amber/30 bg-amber/5 rounded-lg p-4">
            <p className="text-xs font-mono tracking-widest uppercase mb-3 text-amber">
              Most related
            </p>
            <div className="space-y-2">
              {top5.map(([id, r], idx) => (
                <div
                  key={id}
                  className="flex items-start justify-between text-sm gap-2"
                >
                  <div>
                    <span className="font-mono text-xs text-amber/60 mr-2">
                      {idx + 1}
                    </span>
                    <span className="font-serif text-ivory">
                      {NODE_BY_ID[id].label}
                    </span>
                  </div>
                  <span className="font-mono text-xs text-amber tabular-nums shrink-0">
                    {r.toFixed(3)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
