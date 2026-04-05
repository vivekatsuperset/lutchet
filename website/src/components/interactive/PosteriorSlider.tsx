import { useState } from "react";

function oddsToProb(odds: number) { return odds / (1 + odds); }
function probToOdds(p: number) { return p / (1 - p); }

export default function PosteriorSlider() {
  // Prior probability of the hypothesis (e.g. "this Enigma setting is correct")
  const [priorPct,  setPriorPct]  = useState(10);   // 10%
  // Likelihood ratio L = P(E|H) / P(E|¬H)
  const [lrExp, setLrExp] = useState(1);             // L = 10^1 = 10

  const prior = priorPct / 100;
  const lr    = Math.pow(10, lrExp);

  // Bayes in odds form: posterior_odds = L × prior_odds
  const priorOdds     = probToOdds(prior);
  const posteriorOdds = lr * priorOdds;
  const posterior     = oddsToProb(posteriorOdds);

  const fmtPct  = (v: number) => `${(v * 100).toFixed(1)}%`;
  const fmtOdds = (o: number) => o > 999 ? ">999 : 1" : `${o.toFixed(1)} : 1`;

  return (
    <div className="bg-navy-light rounded-xl border border-ivory-dim/10 border-t-2 border-t-amber/40 p-6 font-sans">
      <h3 className="text-ivory font-semibold text-base mb-1">Prior × Likelihood → Posterior</h3>
      <p className="text-xs text-ivory-dim mb-6">
        Adjust the sliders and watch Bayes' theorem update in real time.
      </p>

      {/* Slider 1: Prior */}
      <div className="mb-6">
        <div className="flex justify-between mb-2">
          <label className="text-sm text-ivory-dim">Prior probability P(H)</label>
          <span className="font-mono text-amber text-sm">{fmtPct(prior)}</span>
        </div>
        <input
          type="range" min={1} max={99} step={1} value={priorPct}
          onChange={e => setPriorPct(Number(e.target.value))}
          className="w-full accent-amber"
        />
        <div className="flex justify-between text-xs text-ivory-dim/50 mt-1">
          <span>Very unlikely (1%)</span>
          <span>Very likely (99%)</span>
        </div>
      </div>

      {/* Slider 2: Likelihood ratio */}
      <div className="mb-6">
        <div className="flex justify-between mb-2">
          <label className="text-sm text-ivory-dim">
            Likelihood ratio L = P(E|H) / P(E|¬H)
          </label>
          <span className="font-mono text-steel text-sm">
            {lr >= 1000 ? "10³" : lr >= 100 ? "10²" : lr >= 10 ? "10¹" : "10⁰"} = {lr.toFixed(0)}×
          </span>
        </div>
        <input
          type="range" min={0} max={3} step={0.1} value={lrExp}
          onChange={e => setLrExp(Number(e.target.value))}
          className="w-full accent-steel"
        />
        <div className="flex justify-between text-xs text-ivory-dim/50 mt-1">
          <span>No information (L=1)</span>
          <span>Strong evidence (L=1000)</span>
        </div>
      </div>

      {/* Visual bars */}
      <div className="grid grid-cols-3 gap-3 mb-5">
        {[
          { label: "Prior P(H)",      value: prior,     color: "bg-ivory/30" },
          { label: "Likelihood ratio", value: Math.min(lr / 1000, 1), color: "bg-steel/50" },
          { label: "Posterior P(H|E)", value: posterior,  color: "bg-amber" },
        ].map(({ label, value, color }) => (
          <div key={label} className="text-center">
            <div className="h-24 bg-navy rounded-lg relative overflow-hidden mb-2">
              <div
                className={`absolute bottom-0 left-0 right-0 rounded-b-lg transition-all duration-300 ${color}`}
                style={{ height: `${value * 100}%` }}
              />
            </div>
            <p className="text-xs text-ivory-dim">{label}</p>
            <p className="font-mono text-sm text-ivory mt-0.5">
              {label.includes("ratio") ? `${lr.toFixed(0)}×` : fmtPct(value)}
            </p>
          </div>
        ))}
      </div>

      {/* Formula with numbers */}
      <div className="bg-navy rounded-lg p-4 text-sm font-mono text-center">
        <span className="text-amber">{fmtPct(posterior)}</span>
        <span className="text-ivory-dim mx-2">=</span>
        <span className="text-steel">{lr.toFixed(0)}</span>
        <span className="text-ivory-dim mx-1">×</span>
        <span className="text-ivory/70">{fmtOdds(priorOdds)}</span>
        <span className="text-ivory-dim mx-2">(odds form)</span>
      </div>

      {step_commentary(prior, lr, posterior)}
    </div>
  );
}

function step_commentary(prior: number, lr: number, posterior: number) {
  let msg = "";
  if (lr < 2) msg = "A likelihood ratio near 1 means the evidence tells us almost nothing — posterior ≈ prior.";
  else if (posterior > 0.99) msg = "Near-certainty achieved. Even a weak prior is overwhelmed by strong evidence.";
  else if (posterior > prior * 5) msg = "The evidence has substantially updated our belief.";
  else msg = "The posterior is a balance between prior belief and the strength of evidence.";

  return (
    <p className="text-xs text-ivory-dim text-center mt-3">{msg}</p>
  );
}
