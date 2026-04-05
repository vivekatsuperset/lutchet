import { useState, useCallback } from "react";

/** English letter frequencies (index = ordinal, A=0) */
const ENG_FREQ = [
  0.082, 0.015, 0.028, 0.043, 0.127, 0.022, 0.020, 0.061, 0.070, 0.002,
  0.008, 0.040, 0.024, 0.067, 0.075, 0.019, 0.001, 0.060, 0.063, 0.091,
  0.028, 0.010, 0.024, 0.002, 0.020, 0.001,
];

// "HELLO WORLD" encrypted with shift 3 → "KHOOR ZRUOG"
// We use just "KHOOR" (HELLO) for a clean 5-letter demo.
const CIPHERTEXT = "KHOOR";
const PLAINTEXT  = "HELLO";
const TRUE_SHIFT = 3;
const ALPHABET   = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";

function normalize(arr: number[]): number[] {
  const sum = arr.reduce((a, b) => a + b, 0);
  return arr.map(v => v / sum);
}

function bayesUpdate(prior: number[], cipherLetter: string): number[] {
  const c = cipherLetter.charCodeAt(0) - 65;
  const likelihood = Array.from({ length: 26 }, (_, shift) => {
    const plainIdx = ((c - shift) + 26) % 26;
    return ENG_FREQ[plainIdx];
  });
  return normalize(prior.map((p, i) => p * likelihood[i]));
}

export default function CaesarBayesDemo() {
  const [step, setStep] = useState(0);

  // Compute posteriors up to current step
  const posteriors: number[][] = [normalize(Array(26).fill(1))];
  for (let i = 0; i < step; i++) {
    posteriors.push(bayesUpdate(posteriors[posteriors.length - 1], CIPHERTEXT[i]));
  }
  const current = posteriors[posteriors.length - 1];
  const maxP = Math.max(...current);
  const topShift = current.indexOf(maxP);

  const reset = () => setStep(0);

  return (
    <div className="bg-navy-light rounded-xl border border-steel/20 border-t-2 border-t-amber/40 p-6 font-sans">
      <h3 className="text-steel font-semibold text-base mb-1">
        Caesar Cipher — Bayesian Decoder
      </h3>
      <p className="text-xs text-ivory-dim mb-5">
        Intercept: <span className="font-mono text-amber">"KHOOR"</span>. Unknown shift.
        Each letter we reveal updates our probability over all 26 possible shifts.
        The correct shift is <span className="text-amber font-mono">3</span> (decrypts to "HELLO").
      </p>

      {/* Ciphertext reveal */}
      <div className="flex gap-2 mb-6 justify-center">
        {CIPHERTEXT.split("").map((letter, i) => (
          <div key={i} className="text-center">
            <div
              className={`w-12 h-12 rounded-lg flex items-center justify-center font-mono text-xl font-bold transition-all duration-300 ${
                i < step
                  ? "bg-amber text-navy"
                  : i === step
                  ? "border-2 border-amber/50 text-amber/50"
                  : "border border-ivory-dim/20 text-ivory-dim/30"
              }`}
            >
              {i < step ? letter : "?"}
            </div>
            {i < step && (
              <div className="text-xs text-ivory-dim/60 mt-1 font-mono">
                →{PLAINTEXT[i]}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Posterior bar chart */}
      <div className="mb-2 flex justify-between text-xs text-ivory-dim/50 font-mono">
        <span>Shift 0 (A)</span>
        <span>P(shift | evidence)</span>
        <span>Shift 25 (Z)</span>
      </div>
      <div className="flex items-end gap-px h-24 mb-1">
        {current.map((p, i) => {
          const height = maxP > 0 ? (p / maxP) * 100 : 0;
          const isTrue  = i === TRUE_SHIFT;
          const isTop   = i === topShift;
          return (
            <div
              key={i}
              className={`flex-1 rounded-t transition-all duration-500 ${
                isTrue  ? "bg-amber" :
                isTop   ? "bg-steel/70" : "bg-ivory/15"
              }`}
              style={{ height: `${Math.max(height, 2)}%` }}
              title={`Shift ${i} (${ALPHABET[i]}): ${(p * 100).toFixed(2)}%`}
            />
          );
        })}
      </div>
      <div className="flex justify-between text-xs font-mono text-ivory-dim/40 mb-5">
        {Array.from({ length: 26 }, (_, i) => (
          <span key={i} className={i === TRUE_SHIFT ? "text-amber" : ""}>{ALPHABET[i]}</span>
        ))}
      </div>

      {/* Current best guess */}
      <div className="bg-navy rounded-lg p-3 mb-4 flex justify-between items-center text-sm">
        <span className="text-ivory-dim">Most probable shift:</span>
        <span className="font-mono text-amber font-bold">
          {topShift} ({ALPHABET[topShift]}) — {(maxP * 100).toFixed(1)}% probability
        </span>
      </div>

      {/* Status message */}
      <p className="text-xs text-ivory-dim text-center mb-4 min-h-[2rem]">
        {step === 0 && "Uniform prior — all 26 shifts equally likely."}
        {step === 1 && "Seeing 'K': shifts that decode K to a common English letter gain probability."}
        {step === 2 && `After 'KH': shift ${topShift} is pulling ahead. 'K'→'H' and 'H'→'E' are both common.`}
        {step >= 3 && step < CIPHERTEXT.length && `After ${step} letters: probability concentrating on shift ${topShift}.`}
        {step === CIPHERTEXT.length && "✓ Posterior has converged. Shift 3 — correct setting — is overwhelmingly probable."}
      </p>

      {/* Controls */}
      <div className="flex gap-3 justify-center">
        <button
          onClick={reset}
          className="px-4 py-2 text-sm border border-ivory-dim/30 rounded text-ivory-dim hover:border-amber hover:text-amber transition-colors"
        >Reset</button>
        <button
          onClick={() => setStep(s => Math.min(CIPHERTEXT.length, s + 1))}
          disabled={step >= CIPHERTEXT.length}
          className="px-5 py-2 text-sm bg-steel/20 border border-steel/50 rounded text-steel hover:bg-steel/30 transition-colors disabled:opacity-30"
        >
          {step === 0 ? "Reveal first letter →" : step < CIPHERTEXT.length ? `Reveal '${CIPHERTEXT[step]}' →` : "Done"}
        </button>
      </div>
    </div>
  );
}
