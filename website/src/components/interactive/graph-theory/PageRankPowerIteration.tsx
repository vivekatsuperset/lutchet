import { useEffect, useMemo, useRef, useState } from "react";
import {
  buildWebGraph,
  pagerankSteps,
  WEB_EDGES,
  WEB_NODES,
} from "./walks";

const NODE_BY_ID = Object.fromEntries(WEB_NODES.map((n) => [n.id, n]));

export default function PageRankPowerIteration() {
  const [damping, setDamping] = useState(0.85);
  const [stepIdx, setStepIdx] = useState(0);
  const [playing, setPlaying] = useState(false);
  const playTimer = useRef<number | null>(null);

  const { steps, deltas } = useMemo(() => {
    const g = buildWebGraph();
    const { steps: s, deltas: d } = pagerankSteps(g, damping, 1e-8, 60);
    return { steps: s, deltas: d };
  }, [damping]);

  const effectiveIdx = Math.min(stepIdx, steps.length - 1);
  const ranks = steps[effectiveIdx];
  const delta = deltas[effectiveIdx];

  useEffect(() => {
    if (!playing) return;
    if (stepIdx >= steps.length - 1) {
      setPlaying(false);
      return;
    }
    playTimer.current = window.setTimeout(() => {
      setStepIdx((i) => Math.min(i + 1, steps.length - 1));
    }, 700);
    return () => {
      if (playTimer.current !== null) {
        window.clearTimeout(playTimer.current);
        playTimer.current = null;
      }
    };
  }, [playing, stepIdx, steps.length]);

  useEffect(() => {
    // New damping value resets the step counter. Otherwise we could
    // index past the end of the new shorter/longer trajectory.
    setStepIdx(0);
    setPlaying(false);
  }, [damping]);

  const next = () => setStepIdx((i) => Math.min(i + 1, steps.length - 1));
  const prev = () => setStepIdx((i) => Math.max(i - 1, 0));
  const reset = () => {
    setPlaying(false);
    setStepIdx(0);
  };

  const maxRank = Math.max(...ranks.values());
  const minRank = Math.min(...ranks.values());
  const sortedNodes = [...ranks.entries()].sort((a, b) => b[1] - a[1]);

  const radiusFor = (r: number): number => {
    if (maxRank === minRank) return 18;
    const t = (r - minRank) / (maxRank - minRank);
    return 12 + t * 14;
  };

  return (
    <div className="bg-navy-light rounded-xl border border-amber/20 border-t-2 border-t-amber/50 p-6 font-sans">
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <h3 className="text-amber font-semibold text-lg">
          PageRank: Power Iteration
        </h3>
        <div className="flex items-center gap-2">
          <button
            onClick={prev}
            disabled={effectiveIdx === 0}
            className="text-xs text-ivory-dim border border-ivory-dim/30 rounded px-3 py-1 hover:border-amber hover:text-amber transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
          >
            &larr; Prev
          </button>
          <button
            onClick={() => setPlaying((p) => !p)}
            className="text-xs text-amber border border-amber/50 rounded px-3 py-1 hover:border-amber hover:bg-amber/10 transition-colors"
          >
            {playing ? "Pause" : effectiveIdx >= steps.length - 1 ? "Replay" : "Play"}
          </button>
          <button
            onClick={next}
            disabled={effectiveIdx >= steps.length - 1}
            className="text-xs text-ivory-dim border border-ivory-dim/30 rounded px-3 py-1 hover:border-amber hover:text-amber transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
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

      <div className="mb-5 flex items-center gap-4 flex-wrap">
        <label className="text-xs font-mono text-ivory-dim tracking-widest uppercase">
          Damping
        </label>
        <input
          type="range"
          min={0.5}
          max={0.99}
          step={0.01}
          value={damping}
          onChange={(ev) => setDamping(parseFloat(ev.target.value))}
          className="flex-1 min-w-[180px] max-w-xs accent-amber"
        />
        <span className="font-mono text-amber text-sm tabular-nums">
          {damping.toFixed(2)}
        </span>
      </div>

      <div className="grid md:grid-cols-[1fr_240px] gap-6">
        <div className="bg-navy rounded-lg border border-ivory-dim/10 overflow-hidden">
          <svg viewBox="0 0 620 520" className="w-full h-auto block">
            <defs>
              <marker
                id="pr-arrow"
                viewBox="0 0 10 10"
                refX="10"
                refY="5"
                markerWidth="6"
                markerHeight="6"
                orient="auto-start-reverse"
              >
                <path d="M 0 0 L 10 5 L 0 10 z" fill="#6a7490" />
              </marker>
            </defs>

            {WEB_EDGES.map(([u, v]) => {
              const a = NODE_BY_ID[u];
              const b = NODE_BY_ID[v];
              const dx = b.x - a.x;
              const dy = b.y - a.y;
              const len = Math.sqrt(dx * dx + dy * dy) || 1;
              const ux = dx / len;
              const uy = dy / len;
              const rA = radiusFor(ranks.get(u) ?? 0);
              const rB = radiusFor(ranks.get(v) ?? 0);
              const x1 = a.x + ux * rA;
              const y1 = a.y + uy * rA;
              const x2 = b.x - ux * rB;
              const y2 = b.y - uy * rB;
              return (
                <line
                  key={`${u}-${v}`}
                  x1={x1}
                  y1={y1}
                  x2={x2}
                  y2={y2}
                  stroke="#3a4460"
                  strokeWidth={1.5}
                  markerEnd="url(#pr-arrow)"
                />
              );
            })}

            {WEB_NODES.map((n) => {
              const r = ranks.get(n.id) ?? 0;
              const radius = radiusFor(r);
              const t = maxRank === minRank ? 0.5 : (r - minRank) / (maxRank - minRank);
              const fill = `rgba(200, 164, 74, ${0.15 + t * 0.6})`;
              return (
                <g key={n.id}>
                  <circle
                    cx={n.x}
                    cy={n.y}
                    r={radius}
                    fill={fill}
                    stroke="#c8a44a"
                    strokeWidth={2}
                    className="transition-all duration-300"
                  />
                  <text
                    x={n.x}
                    y={n.y + 4}
                    textAnchor="middle"
                    fontFamily="Instrument Sans, sans-serif"
                    fontSize="13"
                    fontWeight="700"
                    fill="#0a0e1a"
                  >
                    {n.label}
                  </text>
                </g>
              );
            })}
          </svg>
          <p className="text-xs text-ivory-dim/60 text-center py-3 px-4">
            Node size and saturation track the current rank. The graph
            re-lays-out its rankings each iteration as mass flows along
            the arrows.
          </p>
        </div>

        <div className="flex flex-col gap-4">
          <div className="border border-amber/30 bg-amber/5 rounded-lg p-4">
            <p className="text-xs font-mono tracking-widest uppercase mb-2 text-amber">
              Iteration {effectiveIdx} of {steps.length - 1}
            </p>
            <p className="font-sans text-xs text-ivory/70 mb-2 leading-relaxed">
              {effectiveIdx === 0
                ? "Uniform start. Every node begins with equal rank."
                : Number.isFinite(delta)
                ? `L1 change since last iteration: ${delta.toExponential(2)}.`
                : ""}
            </p>
            <p className="font-sans text-xs text-ivory/60 leading-relaxed">
              {effectiveIdx >= steps.length - 1
                ? "Converged (to tolerance 1e-8) or reached the iteration cap."
                : "Power iteration is still moving. Step forward to watch it stabilise."}
            </p>
          </div>

          <div className="border border-ivory-dim/15 rounded-lg p-4">
            <p className="text-xs font-mono text-amber/70 tracking-widest uppercase mb-3">
              Ranks (sorted)
            </p>
            <div className="space-y-1">
              {sortedNodes.map(([id, r]) => (
                <div
                  key={id}
                  className="flex items-center justify-between text-sm"
                >
                  <span className="font-serif text-ivory">{id}</span>
                  <span className="font-mono text-xs text-amber tabular-nums">
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
