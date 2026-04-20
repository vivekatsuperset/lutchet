import { useMemo, useState } from "react";
import {
  buildSovietNetwork,
  flowEdgeKey,
  maxFlow,
  minCut,
  SOVIET_CITIES,
  SOVIET_LINES,
  SOVIET_SINK,
  SOVIET_SOURCE,
} from "./flow";

const CITY_BY_ID = Object.fromEntries(
  SOVIET_CITIES.map((c) => [c.id, c])
);

function defaultCapacities(): Map<string, number> {
  const m = new Map<string, number>();
  for (const line of SOVIET_LINES) {
    m.set(flowEdgeKey(line.u, line.v), line.capacity);
  }
  return m;
}

export default function SovietRail() {
  const [capacities, setCapacities] = useState<Map<string, number>>(() =>
    defaultCapacities()
  );

  const { value, flow, cutEdges, sourceSide } = useMemo(() => {
    const net = buildSovietNetwork(capacities);
    const { value, flow } = maxFlow(net, SOVIET_SOURCE, SOVIET_SINK);
    const { edges, sourceSide } = minCut(net, SOVIET_SOURCE, SOVIET_SINK);
    return { value, flow, cutEdges: edges, sourceSide };
  }, [capacities]);

  const adjust = (u: string, v: string, delta: number) => {
    setCapacities((prev) => {
      const next = new Map(prev);
      const key = flowEdgeKey(u, v);
      const current = next.get(key) ?? 0;
      next.set(key, Math.max(0, Math.round(current + delta)));
      return next;
    });
  };

  const reset = () => setCapacities(defaultCapacities());

  return (
    <div className="bg-navy-light rounded-xl border border-amber/20 border-t-2 border-t-amber/50 p-6 font-sans">
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <h3 className="text-amber font-semibold text-lg">
          Soviet Rail: Max Flow and Min Cut
        </h3>
        <button
          onClick={reset}
          className="text-xs text-ivory-dim border border-ivory-dim/30 rounded px-3 py-1 hover:border-amber hover:text-amber transition-colors"
        >
          Reset capacities
        </button>
      </div>

      <div className="grid md:grid-cols-[1fr_260px] gap-6">
        <div className="bg-navy rounded-lg border border-ivory-dim/10 overflow-hidden">
          <svg viewBox="0 0 620 500" className="w-full h-auto block">
            <defs>
              <marker
                id="arrow-default"
                viewBox="0 0 10 10"
                refX="10"
                refY="5"
                markerWidth="6"
                markerHeight="6"
                orient="auto-start-reverse"
              >
                <path d="M 0 0 L 10 5 L 0 10 z" fill="#3a4460" />
              </marker>
              <marker
                id="arrow-flow"
                viewBox="0 0 10 10"
                refX="10"
                refY="5"
                markerWidth="6"
                markerHeight="6"
                orient="auto-start-reverse"
              >
                <path d="M 0 0 L 10 5 L 0 10 z" fill="#c8a44a" />
              </marker>
              <marker
                id="arrow-cut"
                viewBox="0 0 10 10"
                refX="10"
                refY="5"
                markerWidth="6"
                markerHeight="6"
                orient="auto-start-reverse"
              >
                <path d="M 0 0 L 10 5 L 0 10 z" fill="#e06464" />
              </marker>
            </defs>

            {SOVIET_LINES.map((line) => {
              const a = CITY_BY_ID[line.u];
              const b = CITY_BY_ID[line.v];
              const key = flowEdgeKey(line.u, line.v);
              const cap = capacities.get(key) ?? line.capacity;
              const f = flow.get(key) ?? 0;
              const isCut = cutEdges.has(key);
              const hasFlow = f > 0;

              // Shorten line endpoints so arrows don't sit inside node circles.
              const dx = b.x - a.x;
              const dy = b.y - a.y;
              const len = Math.sqrt(dx * dx + dy * dy) || 1;
              const ux = dx / len;
              const uy = dy / len;
              const r = 16;
              const x1 = a.x + ux * r;
              const y1 = a.y + uy * r;
              const x2 = b.x - ux * r;
              const y2 = b.y - uy * r;

              const stroke = isCut
                ? "#e06464"
                : hasFlow
                ? "#c8a44a"
                : "#3a4460";
              const marker = isCut
                ? "url(#arrow-cut)"
                : hasFlow
                ? "url(#arrow-flow)"
                : "url(#arrow-default)";
              const strokeWidth = isCut ? 3.5 : hasFlow ? 2.5 : 1.5;

              const mx = (a.x + b.x) / 2;
              const my = (a.y + b.y) / 2;

              return (
                <g key={key}>
                  <line
                    x1={x1}
                    y1={y1}
                    x2={x2}
                    y2={y2}
                    stroke={stroke}
                    strokeWidth={strokeWidth}
                    markerEnd={marker}
                    className="transition-all duration-150"
                  />
                  <g
                    style={{ cursor: "pointer" }}
                    onClick={(ev) => {
                      ev.stopPropagation();
                      adjust(line.u, line.v, ev.shiftKey ? -5 : 5);
                    }}
                  >
                    <rect
                      x={mx - 22}
                      y={my - 10}
                      width={44}
                      height={18}
                      rx={4}
                      fill="#0a0e1a"
                      stroke={isCut ? "#e06464" : hasFlow ? "#c8a44a" : "#4a5068"}
                      strokeWidth={1}
                    />
                    <text
                      x={mx}
                      y={my + 3}
                      textAnchor="middle"
                      fontFamily="JetBrains Mono, monospace"
                      fontSize="10"
                      fill={isCut ? "#e06464" : hasFlow ? "#c8a44a" : "#b0a890"}
                    >
                      {`${f}/${cap}`}
                    </text>
                    <title>
                      {`${CITY_BY_ID[line.u].name} to ${CITY_BY_ID[line.v].name}: flow ${f} of capacity ${cap}. Click +5, shift-click -5.`}
                    </title>
                  </g>
                </g>
              );
            })}

            {SOVIET_CITIES.map((c) => {
              const isSource = c.id === SOVIET_SOURCE;
              const isSink = c.id === SOVIET_SINK;
              const onSourceSide = sourceSide.has(c.id);
              let fill = "#0a0e1a";
              let stroke = "#4a5068";
              let label = "#e8e4d9";
              if (isSource) {
                fill = "#1a2240";
                stroke = "#c8a44a";
                label = "#c8a44a";
              } else if (isSink) {
                fill = "#1a2240";
                stroke = "#4a90e2";
                label = "#4a90e2";
              } else if (onSourceSide) {
                stroke = "#c8a44a";
              }
              return (
                <g key={c.id}>
                  <circle
                    cx={c.x}
                    cy={c.y}
                    r={14}
                    fill={fill}
                    stroke={stroke}
                    strokeWidth={isSource || isSink ? 2.5 : 2}
                  />
                  <text
                    x={c.x}
                    y={c.y - 22}
                    textAnchor="middle"
                    fontFamily="Instrument Sans, sans-serif"
                    fontSize="11"
                    fontWeight="600"
                    fill={label}
                  >
                    {c.name}
                  </text>
                </g>
              );
            })}
          </svg>
          <p className="text-xs text-ivory-dim/60 text-center py-3 px-4">
            <span className="text-amber">Gold</span> edges carry flow.
            <span className="text-[#e06464]"> Red</span> edges are on the min cut.
            Click an edge label to add 5 units of capacity; shift-click to remove 5.
          </p>
        </div>

        <div className="flex flex-col gap-4">
          <div className="border border-amber/30 bg-amber/5 rounded-lg p-4">
            <p className="text-xs font-mono tracking-widest uppercase mb-2 text-amber">
              Maximum flow
            </p>
            <p className="font-mono text-3xl text-ivory mb-1">{value}</p>
            <p className="font-sans text-xs text-ivory/70 leading-relaxed">
              {CITY_BY_ID[SOVIET_SOURCE].name} to {CITY_BY_ID[SOVIET_SINK].name},
              summed across all paths.
            </p>
          </div>

          <div className="border border-[#e06464]/40 bg-[#e06464]/5 rounded-lg p-4">
            <p className="text-xs font-mono tracking-widest uppercase mb-2 text-[#e06464]">
              Min cut ({cutEdges.size} edge{cutEdges.size === 1 ? "" : "s"})
            </p>
            {cutEdges.size === 0 ? (
              <p className="text-sm text-ivory-dim italic">
                No cut; sink is unreachable from source.
              </p>
            ) : (
              <div className="space-y-1">
                {[...cutEdges].map((key) => {
                  const [u, v] = key.split("->");
                  const cap = capacities.get(key) ?? 0;
                  return (
                    <div
                      key={key}
                      className="flex items-center justify-between text-sm"
                    >
                      <span className="font-serif text-ivory">
                        {CITY_BY_ID[u].name} &rarr; {CITY_BY_ID[v].name}
                      </span>
                      <span className="font-mono text-xs text-[#e06464]">
                        {cap}
                      </span>
                    </div>
                  );
                })}
                <div className="border-t border-[#e06464]/20 mt-2 pt-2 flex items-center justify-between text-sm">
                  <span className="font-sans text-ivory/70">Sum</span>
                  <span className="font-mono text-[#e06464]">{value}</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
