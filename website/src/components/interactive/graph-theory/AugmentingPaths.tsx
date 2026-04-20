import { useEffect, useMemo, useRef, useState } from "react";
import {
  buildSovietNetwork,
  flowEdgeKey,
  maxFlowSteps,
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

export default function AugmentingPaths() {
  const [stepIdx, setStepIdx] = useState(0);
  const [playing, setPlaying] = useState(false);
  const playTimer = useRef<number | null>(null);

  const steps = useMemo(() => {
    const net = buildSovietNetwork(defaultCapacities());
    return maxFlowSteps(net, SOVIET_SOURCE, SOVIET_SINK);
  }, []);

  const step = steps[Math.min(stepIdx, steps.length - 1)];
  const pathEdges = useMemo(() => {
    const s = new Set<string>();
    for (let i = 0; i + 1 < step.path.length; i++) {
      s.add(flowEdgeKey(step.path[i], step.path[i + 1]));
    }
    return s;
  }, [step]);

  useEffect(() => {
    if (!playing) return;
    if (stepIdx >= steps.length - 1) {
      setPlaying(false);
      return;
    }
    playTimer.current = window.setTimeout(() => {
      setStepIdx((i) => Math.min(i + 1, steps.length - 1));
    }, 1100);
    return () => {
      if (playTimer.current !== null) {
        window.clearTimeout(playTimer.current);
        playTimer.current = null;
      }
    };
  }, [playing, stepIdx, steps.length]);

  const next = () => setStepIdx((i) => Math.min(i + 1, steps.length - 1));
  const prev = () => setStepIdx((i) => Math.max(i - 1, 0));
  const reset = () => {
    setPlaying(false);
    setStepIdx(0);
  };

  return (
    <div className="bg-navy-light rounded-xl border border-steel/30 border-t-2 border-t-steel/60 p-6 font-sans">
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <h3 className="text-steel font-semibold text-lg">
          Augmenting Paths, Step by Step
        </h3>
        <div className="flex items-center gap-2">
          <button
            onClick={prev}
            disabled={stepIdx === 0}
            className="text-xs text-ivory-dim border border-ivory-dim/30 rounded px-3 py-1 hover:border-steel hover:text-steel transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
          >
            &larr; Prev
          </button>
          <button
            onClick={() => setPlaying((p) => !p)}
            className="text-xs text-steel border border-steel/50 rounded px-3 py-1 hover:border-steel hover:bg-steel/10 transition-colors"
          >
            {playing ? "Pause" : stepIdx >= steps.length - 1 ? "Replay" : "Play"}
          </button>
          <button
            onClick={next}
            disabled={stepIdx >= steps.length - 1}
            className="text-xs text-ivory-dim border border-ivory-dim/30 rounded px-3 py-1 hover:border-steel hover:text-steel transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
          >
            Next &rarr;
          </button>
          <button
            onClick={reset}
            className="text-xs text-ivory-dim border border-ivory-dim/30 rounded px-3 py-1 hover:border-amber hover:text-amber transition-colors"
          >
            Reset
          </button>
        </div>
      </div>

      <div className="grid md:grid-cols-[1fr_240px] gap-6">
        <div className="bg-navy rounded-lg border border-ivory-dim/10 overflow-hidden">
          <svg viewBox="0 0 620 500" className="w-full h-auto block">
            <defs>
              <marker
                id="ap-arrow-default"
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
                id="ap-arrow-path"
                viewBox="0 0 10 10"
                refX="10"
                refY="5"
                markerWidth="6"
                markerHeight="6"
                orient="auto-start-reverse"
              >
                <path d="M 0 0 L 10 5 L 0 10 z" fill="#4a90e2" />
              </marker>
              <marker
                id="ap-arrow-flow"
                viewBox="0 0 10 10"
                refX="10"
                refY="5"
                markerWidth="6"
                markerHeight="6"
                orient="auto-start-reverse"
              >
                <path d="M 0 0 L 10 5 L 0 10 z" fill="#c8a44a" />
              </marker>
            </defs>

            {SOVIET_LINES.map((line) => {
              const a = CITY_BY_ID[line.u];
              const b = CITY_BY_ID[line.v];
              const key = flowEdgeKey(line.u, line.v);
              const onPath = pathEdges.has(key);
              const f = step.flow.get(key) ?? 0;
              const cap = line.capacity;

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

              const hasFlow = f > 0;
              const stroke = onPath
                ? "#4a90e2"
                : hasFlow
                ? "#c8a44a"
                : "#3a4460";
              const marker = onPath
                ? "url(#ap-arrow-path)"
                : hasFlow
                ? "url(#ap-arrow-flow)"
                : "url(#ap-arrow-default)";
              const strokeWidth = onPath ? 3.5 : hasFlow ? 2.5 : 1.5;

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
                    className="transition-all duration-300"
                  />
                  <rect
                    x={mx - 22}
                    y={my - 10}
                    width={44}
                    height={18}
                    rx={4}
                    fill="#0a0e1a"
                    stroke={onPath ? "#4a90e2" : hasFlow ? "#c8a44a" : "#4a5068"}
                    strokeWidth={1}
                  />
                  <text
                    x={mx}
                    y={my + 3}
                    textAnchor="middle"
                    fontFamily="JetBrains Mono, monospace"
                    fontSize="10"
                    fill={onPath ? "#4a90e2" : hasFlow ? "#c8a44a" : "#b0a890"}
                  >
                    {`${f}/${cap}`}
                  </text>
                </g>
              );
            })}

            {SOVIET_CITIES.map((c) => {
              const isSource = c.id === SOVIET_SOURCE;
              const isSink = c.id === SOVIET_SINK;
              const onPath = step.path.includes(c.id);
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
              } else if (onPath) {
                fill = "#2a3460";
                stroke = "#4a90e2";
              }
              return (
                <g key={c.id}>
                  <circle
                    cx={c.x}
                    cy={c.y}
                    r={14}
                    fill={fill}
                    stroke={stroke}
                    strokeWidth={onPath ? 3 : 2}
                    className="transition-all duration-300"
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
            <span className="text-steel">Blue</span> highlights the current
            augmenting path.
            <span className="text-amber"> Gold</span> edges already carry flow.
            Each edge shows flow / capacity.
          </p>
        </div>

        <div className="flex flex-col gap-4">
          <div className="border border-steel/30 bg-steel/5 rounded-lg p-4">
            <p className="text-xs font-mono tracking-widest uppercase mb-2 text-steel">
              Step {stepIdx} of {steps.length - 1}
            </p>
            {step.path.length === 0 ? (
              <p className="font-sans text-sm text-ivory/80">
                Initial state. No flow yet. BFS will look for the shortest
                augmenting path from Moscow to Frontier.
              </p>
            ) : (
              <>
                <p className="font-sans font-semibold text-sm mb-2 text-steel">
                  Augmented by {step.bottleneck}
                </p>
                <p className="font-sans text-xs text-ivory/70 leading-relaxed mb-2">
                  Path:{" "}
                  {step.path
                    .map((id) => CITY_BY_ID[id].name)
                    .join(" \u2192 ")}
                </p>
                <p className="font-sans text-xs text-ivory/70 leading-relaxed">
                  The bottleneck is the smallest residual capacity along
                  the path.
                </p>
              </>
            )}
          </div>

          <div className="border border-amber/30 bg-amber/5 rounded-lg p-4">
            <p className="text-xs font-mono tracking-widest uppercase mb-2 text-amber">
              Total flow
            </p>
            <p className="font-mono text-3xl text-ivory mb-1">
              {step.flowValue}
            </p>
            <p className="font-sans text-xs text-ivory/70">
              {stepIdx >= steps.length - 1
                ? "No more augmenting paths. This is the maximum."
                : "Cumulative after this augmentation."}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
