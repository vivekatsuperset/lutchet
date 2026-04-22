import { useState } from "react";

const PHASES = [
  {
    label: "Before any evidence",
    sub:   "All ~10²³ Enigma settings are equally plausible. We have no reason to prefer any one of them.",
    dot:   (i: number) => "bg-ivory/20",
    count: 100,
  },
  {
    label: "After the crib check (Enigma constraint)",
    sub:   "No letter can encrypt to itself. One 12-letter crib eliminates over 99.9% of all settings — instantly, with no probability maths.",
    dot:   (i: number) => i < 97 ? "bg-ivory/5 scale-75" : "bg-amber/70",
    count: 100,
  },
  {
    label: "After Bayesian scoring",
    sub:   "The surviving settings are scored by how well their decryption matches German letter frequencies. Probability mass collapses onto one answer.",
    dot:   (i: number) => i < 97 ? "bg-ivory/5 scale-75" : i < 99 ? "bg-amber/30 scale-90" : "bg-amber shadow-[0_0_12px_rgba(200,164,74,0.8)]",
    count: 100,
  },
];

export default function IntuitionDiagram() {
  const [phase, setPhase] = useState(0);
  const current = PHASES[phase];

  return (
    <div className="bg-navy-light rounded-xl border border-ivory-dim/10 border-t-2 border-t-amber/40 p-6 font-sans">
      {/* Phase indicator */}
      <div className="flex items-center gap-2 mb-5">
        {PHASES.map((p, i) => (
          <button
            key={i}
            onClick={() => setPhase(i)}
            className={`flex-1 py-1.5 rounded text-xs font-semibold transition-all ${
              i === phase
                ? "bg-amber text-navy"
                : "border border-ivory-dim/20 text-ivory-dim hover:border-amber/40"
            }`}
          >
            Step {i + 1}
          </button>
        ))}
      </div>

      {/* Dot grid — each dot is a candidate Enigma setting */}
      <div className="grid gap-1 mb-5" style={{ gridTemplateColumns: "repeat(20, 1fr)" }}>
        {Array.from({ length: current.count }).map((_, i) => (
          <div
            key={i}
            className={`aspect-square rounded-sm transition-all duration-500 ${current.dot(i)}`}
          />
        ))}
      </div>

      {/* Legend */}
      <div className="flex gap-4 mb-4 text-xs text-ivory-dim font-mono">
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-sm bg-ivory/20 inline-block" /> candidate setting
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-sm bg-amber inline-block" /> survives
        </span>
      </div>

      {/* Description */}
      <div className="border-t border-ivory-dim/10 pt-4">
        <p className="font-semibold text-ivory mb-1">{current.label}</p>
        <p className="text-sm text-ivory-dim leading-relaxed">{current.sub}</p>
      </div>

      <div className="flex justify-between mt-4">
        <button
          onClick={() => setPhase(p => Math.max(0, p - 1))}
          disabled={phase === 0}
          className="text-sm text-ivory-dim hover:text-amber transition-colors disabled:opacity-30"
        >← Previous</button>
        <button
          onClick={() => setPhase(p => Math.min(PHASES.length - 1, p + 1))}
          disabled={phase === PHASES.length - 1}
          className="text-sm text-ivory-dim hover:text-amber transition-colors disabled:opacity-30"
        >Next →</button>
      </div>
    </div>
  );
}
