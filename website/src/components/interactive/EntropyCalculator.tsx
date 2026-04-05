import { useState, useCallback } from "react";

const LETTER_ORDER = "ETAOINSHRDLCUMWFGYPBVKJXQZ";

const SAMPLE_TEXTS: Record<string, string> = {
  English: "THE QUICK BROWN FOX JUMPS OVER THE LAZY DOG AND THE QUICK BROWN FOX",
  Random:  "XKQZJVBWPYFUHMOLCNRSDTIGEA XKQZJVBWPYFUHMOLCNRSDTIGEA",
  Repeated: "AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA",
};

function computeEntropy(text: string): {
  entropy: number;
  maxEntropy: number;
  freqs: Record<string, number>;
  counts: Record<string, number>;
  total: number;
} {
  const clean = text.toUpperCase().replace(/[^A-Z]/g, "");
  if (clean.length === 0) {
    return { entropy: 0, maxEntropy: 0, freqs: {}, counts: {}, total: 0 };
  }

  const counts: Record<string, number> = {};
  for (const ch of clean) {
    counts[ch] = (counts[ch] ?? 0) + 1;
  }

  const total = clean.length;
  const freqs: Record<string, number> = {};
  let entropy = 0;
  for (const [ch, count] of Object.entries(counts)) {
    const p = count / total;
    freqs[ch] = p;
    entropy -= p * Math.log2(p);
  }

  const k = Object.keys(counts).length;
  const maxEntropy = k > 1 ? Math.log2(k) : 0;

  return { entropy, maxEntropy, freqs, counts, total };
}

export default function EntropyCalculator() {
  const [text, setText] = useState(SAMPLE_TEXTS.English);

  const { entropy, maxEntropy, freqs, counts, total } = computeEntropy(text);

  // Sort letters by descending frequency for the bar display
  const letters = Object.keys(counts).sort((a, b) => (counts[b] ?? 0) - (counts[a] ?? 0));

  const handleSample = useCallback((key: string) => {
    setText(SAMPLE_TEXTS[key] ?? "");
  }, []);

  const pct = maxEntropy > 0 ? (entropy / Math.log2(26)) * 100 : 0;

  return (
    <div className="bg-navy-medium border border-ivory-dim/10 border-t-2 border-t-amber/40 rounded-xl p-6 my-8">
      <div className="flex items-center justify-between mb-4">
        <p className="font-sans text-xs text-amber/60 tracking-widest uppercase">
          Entropy Calculator
        </p>
        <div className="flex gap-2">
          {Object.keys(SAMPLE_TEXTS).map((key) => (
            <button
              key={key}
              onClick={() => handleSample(key)}
              className="font-sans text-xs px-3 py-1 rounded border border-ivory-dim/20 text-ivory-dim/60 hover:border-amber/40 hover:text-amber/80 transition-colors"
            >
              {key}
            </button>
          ))}
        </div>
      </div>

      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        rows={3}
        className="w-full bg-navy border border-ivory-dim/20 rounded-lg p-3 font-mono text-sm text-ivory resize-none focus:outline-none focus:border-amber/40 mb-4"
        placeholder="Type anything..."
      />

      {/* Main entropy readout */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-navy rounded-lg p-4 text-center">
          <p className="font-mono text-3xl font-bold text-amber mb-1">
            {total > 0 ? entropy.toFixed(3) : "—"}
          </p>
          <p className="font-sans text-xs text-ivory-dim/60 uppercase tracking-widest">bits / letter</p>
        </div>
        <div className="bg-navy rounded-lg p-4 text-center">
          <p className="font-mono text-3xl font-bold text-steel mb-1">
            {Math.log2(26).toFixed(3)}
          </p>
          <p className="font-sans text-xs text-ivory-dim/60 uppercase tracking-widest">max (26 letters)</p>
        </div>
        <div className="bg-navy rounded-lg p-4 text-center">
          <p className="font-mono text-3xl font-bold text-ivory/50 mb-1">
            {total}
          </p>
          <p className="font-sans text-xs text-ivory-dim/60 uppercase tracking-widest">letters</p>
        </div>
      </div>

      {/* Entropy bar */}
      {total > 0 && (
        <div className="mb-6">
          <div className="flex justify-between font-sans text-xs text-ivory-dim/50 mb-1">
            <span>0 bits</span>
            <span className="text-amber/70">H = {entropy.toFixed(2)} bits</span>
            <span>log₂(26) = {Math.log2(26).toFixed(2)} bits</span>
          </div>
          <div className="h-3 bg-navy rounded-full overflow-hidden">
            <div
              className="h-full bg-amber rounded-full transition-all duration-300"
              style={{ width: `${Math.min(pct, 100)}%` }}
            />
          </div>
          <p className="font-sans text-xs text-ivory-dim/50 mt-1 text-right">
            {pct.toFixed(1)}% of theoretical maximum
          </p>
        </div>
      )}

      {/* Frequency bars */}
      {letters.length > 0 && (
        <div>
          <p className="font-sans text-xs text-ivory-dim/50 uppercase tracking-widest mb-3">
            Letter distribution (by frequency)
          </p>
          <div className="flex items-end gap-0.5 h-20">
            {letters.slice(0, 26).map((ch) => {
              const p = freqs[ch] ?? 0;
              const heightPct = p * 100;
              const contribution = -p * Math.log2(p);
              return (
                <div
                  key={ch}
                  className="flex-1 flex flex-col items-center justify-end gap-0.5 group relative"
                  title={`${ch}: p=${(p * 100).toFixed(1)}%, −p·log₂p = ${contribution.toFixed(3)} bits`}
                >
                  <div
                    className="w-full bg-amber/70 rounded-sm transition-all duration-300 group-hover:bg-amber"
                    style={{ height: `${Math.max(heightPct * 4, 2)}px` }}
                  />
                  <span className="font-mono text-[8px] text-ivory-dim/40">{ch}</span>
                </div>
              );
            })}
          </div>
          <p className="font-sans text-xs text-ivory-dim/30 mt-2">
            Hover a bar: letter frequency and its contribution to entropy
          </p>
        </div>
      )}

      <div className="mt-5 border-t border-ivory-dim/10 pt-4">
        <p className="font-sans text-xs text-ivory-dim/50 leading-relaxed">
          <span className="text-amber/70">H(X) = &minus;&Sigma; p(x) log&#8322; p(x)</span>
          &nbsp;&mdash;&nbsp;
          English text averages ~4.1 bits/letter. Random has ~4.7. Repetitive text approaches 0.
        </p>
      </div>
    </div>
  );
}
