import { useState, useEffect, useRef } from "react";

// ── Pre-computed Banburismus simulation ───────────────────────────────────────
// 6 candidate settings tested against the crib "WETTER" (weather).
// Likelihoods are derived from Enigma constraint + German letter scoring.
// log_updates[step][candidate] = decibans added at that step.
// (Negative = eliminated. Surviving candidates score ~0.1–0.5 decibans/letter.)

const CANDIDATES = [
  { label: "II–I–III  KDW", isCorrect: true  },
  { label: "I–II–III  AAA", isCorrect: false },
  { label: "I–III–II  MQV", isCorrect: false },
  { label: "III–I–II  ZAS", isCorrect: false },
  { label: "II–III–I  BPK", isCorrect: false },
  { label: "III–II–I  XRL", isCorrect: false },
];

const CRIB = "WETTER";

// Cumulative deciban scores after each letter (0 = start, 6 = after full crib)
// Correct setting accumulates positive score; eliminated ones drop to -Infinity.
const SCORES_BY_STEP: number[][] = [
  // start
  [0,    0,    0,    0,    0,    0   ],
  // after W: most survive constraint (each gains ~1–2 decibans from German freq)
  [1.8,  1.4,  1.6,  -999, 1.5,  1.3 ],
  // after E: constraint eliminates candidates 2,4 (E would encrypt to itself)
  [3.9,  2.7,  -999, -999, -999, 2.1 ],
  // after T: German scoring diverges; correct setting gains faster
  [6.4,  3.4,  -999, -999, -999, 2.5 ],
  // after T: second T — extra confirmation
  [9.2,  3.8,  -999, -999, -999, 2.6 ],
  // after E: divergence now decisive
  [12.5, 3.9,  -999, -999, -999, 2.6 ],
  // after R: correct setting is past the 3-ban (30 deciban) threshold
  [31.4, 4.0,  -999, -999, -999, 2.7 ],
];

const BAN_THRESHOLD = 30; // 3 bans = 30 decibans — Turing's acceptance threshold

export default function BayesViz() {
  const [step, setStep] = useState(0);
  const [playing, setPlaying] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const scores = SCORES_BY_STEP[step];
  const maxScore = Math.max(...scores.filter(s => s > -100));

  useEffect(() => {
    if (playing) {
      intervalRef.current = setInterval(() => {
        setStep(s => {
          if (s >= CRIB.length) { setPlaying(false); return s; }
          return s + 1;
        });
      }, 900);
    } else {
      if (intervalRef.current) clearInterval(intervalRef.current);
    }
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [playing]);

  const reset = () => { setStep(0); setPlaying(false); };

  return (
    <div className="bg-navy-light rounded-xl border border-amber/20 border-t-2 border-t-amber/50 p-6 font-sans">
      <h3 className="text-amber font-semibold text-base mb-1">
        Banburismus — Sequential Bayesian Updating
      </h3>
      <p className="text-xs text-ivory-dim mb-5">
        Each letter of the crib <span className="font-mono text-amber">"WETTER"</span> adds
        weight of evidence in <strong className="text-amber">decibans</strong> (Turing's unit).
        Addition — not multiplication. The 3-ban threshold (30 decibans) is the acceptance line.
      </p>

      {/* Crib letter progress */}
      <div className="flex gap-2 mb-6 justify-center">
        {CRIB.split("").map((letter, i) => (
          <div key={i} className="text-center">
            <div className={`w-10 h-10 rounded flex items-center justify-center font-mono font-bold text-lg transition-all duration-300 ${
              i < step  ? "bg-amber text-navy" :
              i === step ? "border-2 border-amber/50 text-amber/60" :
                           "border border-ivory-dim/20 text-ivory-dim/30"
            }`}>{letter}</div>
            <div className="text-xs text-ivory-dim/50 mt-0.5 font-mono">{i + 1}</div>
          </div>
        ))}
      </div>

      {/* Score bars (in decibans) */}
      <div className="space-y-3 mb-4">
        {CANDIDATES.map((c, i) => {
          const score      = scores[i];
          const eliminated = score < -100;
          const past_threshold = score >= BAN_THRESHOLD;
          const barWidth   = eliminated ? 0 : Math.min((score / BAN_THRESHOLD) * 100, 100);

          return (
            <div key={i} className="flex items-center gap-3">
              {/* Label */}
              <div className={`text-xs font-mono w-32 text-right flex-shrink-0 transition-colors ${
                c.isCorrect ? "text-amber font-semibold" :
                eliminated  ? "text-ivory-dim/25 line-through" :
                              "text-ivory-dim/70"
              }`}>
                {c.label}
              </div>

              {/* Bar track */}
              <div className="flex-1 h-6 bg-navy rounded relative overflow-hidden">
                {/* 3-ban threshold marker */}
                <div className="absolute top-0 bottom-0 w-px bg-steel/40" style={{ left: "100%" }} />

                {!eliminated && (
                  <div
                    className={`h-full rounded transition-all duration-500 ${
                      past_threshold ? "bg-amber" : c.isCorrect ? "bg-amber/60" : "bg-steel/40"
                    }`}
                    style={{ width: `${barWidth}%` }}
                  />
                )}

                {eliminated && (
                  <div className="absolute inset-0 flex items-center px-2">
                    <span className="text-xs text-ivory-dim/30 font-mono">
                      eliminated by Enigma constraint
                    </span>
                  </div>
                )}
              </div>

              {/* Score value */}
              <div className={`text-xs font-mono w-16 text-right flex-shrink-0 ${
                past_threshold ? "text-amber font-bold" :
                eliminated     ? "text-ivory-dim/25" :
                                 "text-ivory-dim/60"
              }`}>
                {eliminated ? "—" : `${score.toFixed(1)} db`}
              </div>
            </div>
          );
        })}
      </div>

      {/* Threshold legend */}
      <div className="flex items-center gap-2 mb-4 text-xs text-ivory-dim/60">
        <div className="w-4 h-px bg-steel/60" />
        <span>30 decibans = 3 bans = 1000:1 odds — Turing's acceptance threshold</span>
      </div>

      {/* Step commentary */}
      <div className="bg-navy rounded-lg px-4 py-3 text-xs text-ivory-dim mb-4 min-h-[3rem]">
        {step === 0 && "Uniform prior — no evidence yet. All candidates treated equally."}
        {step === 1 && "After 'W': Most candidates survive the Enigma constraint. Small gains from German frequency."}
        {step === 2 && "After 'E': Constraint eliminates 3 candidates instantly. 'E' would encrypt to itself under those settings — impossible."}
        {step === 3 && "After first 'T': German scoring separates the survivors. The correct setting accumulates faster."}
        {step === 4 && "After second 'T': The double-T is distinctive in German — adds strong evidence for the correct setting."}
        {step === 5 && "After second 'E': Divergence is now decisive. The correct setting is pulling far ahead."}
        {step === 6 && "After 'R': ✓ CORRECT SETTING PAST THE 3-BAN THRESHOLD. 31 decibans ≈ 1,259:1 odds. Turing would accept this — decrypt the message."}
      </div>

      {/* Controls */}
      <div className="flex gap-3 justify-center">
        <button onClick={reset}
          className="px-4 py-2 text-sm border border-ivory-dim/30 rounded text-ivory-dim hover:border-amber hover:text-amber transition-colors">
          Reset
        </button>
        <button
          onClick={() => setStep(s => Math.max(0, s - 1))}
          disabled={step === 0}
          className="px-4 py-2 text-sm border border-ivory-dim/30 rounded text-ivory-dim hover:border-steel transition-colors disabled:opacity-30">
          ←
        </button>
        <button
          onClick={() => setStep(s => Math.min(CRIB.length, s + 1))}
          disabled={step >= CRIB.length}
          className="px-4 py-2 text-sm border border-ivory-dim/30 rounded text-ivory-dim hover:border-steel transition-colors disabled:opacity-30">
          →
        </button>
        <button
          onClick={() => setPlaying(p => !p)}
          disabled={step >= CRIB.length}
          className="px-5 py-2 text-sm bg-amber/10 border border-amber/40 rounded text-amber hover:bg-amber/20 transition-colors disabled:opacity-30">
          {playing ? "⏸ Pause" : "▶ Play"}
        </button>
      </div>
    </div>
  );
}
