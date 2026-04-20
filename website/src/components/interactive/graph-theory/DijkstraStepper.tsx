import { useEffect, useMemo, useRef, useState } from "react";
import {
  buildDutchGraph,
  dijkstraSteps,
  DUTCH_CITIES,
  DUTCH_ROADS,
} from "./weighted";

const CITY_BY_ID = Object.fromEntries(
  DUTCH_CITIES.map((c) => [c.id, c])
);

function defaultWeights(): Map<string, number> {
  const m = new Map<string, number>();
  for (const e of DUTCH_ROADS) m.set(`${e.u}-${e.v}`, e.km);
  return m;
}

export default function DijkstraStepper() {
  const [source] = useState<string>("ROT");
  const [stepIdx, setStepIdx] = useState<number>(0);
  const [playing, setPlaying] = useState<boolean>(false);
  const playTimer = useRef<number | null>(null);

  const steps = useMemo(() => {
    const g = buildDutchGraph(defaultWeights());
    return dijkstraSteps(g, source);
  }, [source]);

  const step = steps[Math.min(stepIdx, steps.length - 1)];

  useEffect(() => {
    if (!playing) return;
    if (stepIdx >= steps.length - 1) {
      setPlaying(false);
      return;
    }
    playTimer.current = window.setTimeout(() => {
      setStepIdx((i) => Math.min(i + 1, steps.length - 1));
    }, 900);
    return () => {
      if (playTimer.current !== null) {
        window.clearTimeout(playTimer.current);
        playTimer.current = null;
      }
    };
  }, [playing, stepIdx, steps.length]);

  const reset = () => {
    setPlaying(false);
    setStepIdx(0);
  };

  const next = () => setStepIdx((i) => Math.min(i + 1, steps.length - 1));
  const prev = () => setStepIdx((i) => Math.max(i - 1, 0));

  const relaxedKeys = useMemo(() => {
    const s = new Set<string>();
    for (const e of step.relaxedEdges) {
      const k = e.u < e.v ? `${e.u}|${e.v}` : `${e.v}|${e.u}`;
      s.add(k);
    }
    return s;
  }, [step]);

  return (
    <div className="bg-navy-light rounded-xl border border-steel/30 border-t-2 border-t-steel/60 p-6 font-sans">
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <h3 className="text-steel font-semibold text-lg">
          Dijkstra, Step by Step
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
            {DUTCH_ROADS.map((e) => {
              const a = CITY_BY_ID[e.u];
              const b = CITY_BY_ID[e.v];
              const key = [e.u, e.v].sort().join("|");
              const relaxed = relaxedKeys.has(key);
              return (
                <g key={`${e.u}-${e.v}`}>
                  <line
                    x1={a.x}
                    y1={a.y}
                    x2={b.x}
                    y2={b.y}
                    stroke={relaxed ? "#4a90e2" : "#3a4460"}
                    strokeWidth={relaxed ? 3 : 1.5}
                    className="transition-all duration-300"
                  />
                  <text
                    x={(a.x + b.x) / 2}
                    y={(a.y + b.y) / 2 + 3}
                    textAnchor="middle"
                    fontFamily="JetBrains Mono, monospace"
                    fontSize="9"
                    fill="#6a7490"
                  >
                    {e.km}
                  </text>
                </g>
              );
            })}

            {DUTCH_CITIES.map((c) => {
              const isSource = c.id === source;
              const isCurrent = step.current === c.id;
              const isSettled = step.settled.has(c.id);
              const onFrontier = step.frontier.has(c.id);
              const d = step.distances.get(c.id);
              const finite = d !== undefined && Number.isFinite(d);

              let fill = "#0a0e1a";
              let stroke = "#4a5068";
              let label = "#e8e4d9";
              if (isSource) {
                stroke = "#c8a44a";
                label = "#c8a44a";
              }
              if (isSettled) {
                fill = "#1a2240";
                stroke = "#c8a44a";
              }
              if (onFrontier) {
                stroke = "#4a90e2";
                label = "#4a90e2";
              }
              if (isCurrent) {
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
                    strokeWidth={isCurrent ? 3 : 2}
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
                  <text
                    x={c.x}
                    y={c.y + 30}
                    textAnchor="middle"
                    fontFamily="JetBrains Mono, monospace"
                    fontSize="10"
                    fill={finite ? "#c8a44a" : "#6a7490"}
                  >
                    {finite ? String(d) : "\u221e"}
                  </text>
                </g>
              );
            })}
          </svg>
          <p className="text-xs text-ivory-dim/60 text-center py-3 px-4">
            <span className="text-amber">Gold</span> nodes are settled.
            <span className="text-steel"> Blue</span> nodes are on the frontier.
            The current node is highlighted with a thicker ring.
          </p>
        </div>

        <div className="flex flex-col gap-4">
          <div className="border border-steel/30 bg-steel/5 rounded-lg p-4">
            <p className="text-xs font-mono tracking-widest uppercase mb-2 text-steel">
              Step {stepIdx} of {steps.length - 1}
            </p>
            {step.current === null ? (
              <p className="font-sans text-sm text-ivory/80">
                Initial state. The source is at distance 0. All other
                nodes are at distance &infin;.
              </p>
            ) : (
              <>
                <p className="font-sans font-semibold text-sm mb-2 text-steel">
                  Settled {CITY_BY_ID[step.current].name}
                </p>
                <p className="font-sans text-xs text-ivory/70 leading-relaxed">
                  {step.relaxedEdges.length === 0
                    ? "No edges relaxed. All neighbours already have shorter paths."
                    : `Relaxed ${step.relaxedEdges.length} edge${
                        step.relaxedEdges.length === 1 ? "" : "s"
                      }.`}
                </p>
              </>
            )}
          </div>

          <div className="border border-ivory-dim/15 rounded-lg p-4">
            <p className="text-xs font-mono text-steel/70 tracking-widest uppercase mb-3">
              Frontier
            </p>
            {step.frontier.size === 0 ? (
              <p className="text-sm text-ivory-dim italic">
                Empty. Algorithm complete.
              </p>
            ) : (
              <div className="space-y-1">
                {[...step.frontier.entries()]
                  .sort((a, b) => a[1] - b[1])
                  .map(([id, d]) => (
                    <div
                      key={id}
                      className="flex items-center justify-between text-sm"
                    >
                      <span className="font-serif text-ivory">
                        {CITY_BY_ID[id].name}
                      </span>
                      <span className="font-mono text-xs text-steel">
                        {d} km
                      </span>
                    </div>
                  ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
