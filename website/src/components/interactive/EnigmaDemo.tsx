import { useState, useCallback, useRef, useEffect } from "react";
import {
  createMachine,
  encryptLetter,
  windowLetters,
  defaultConfig,
  ALPHABET,
  ROTOR_SPECS,
  REFLECTOR_SPECS,
  type EnigmaConfig,
  type EnigmaState,
} from "./enigma";

interface EnigmaDemoProps {
  initialConfig?: Partial<EnigmaConfig>;
}

export default function EnigmaDemo({ initialConfig }: EnigmaDemoProps) {
  const [config, setConfig] = useState<EnigmaConfig>({
    ...defaultConfig(),
    ...initialConfig,
  });

  const [input,  setInput]  = useState("");
  const [output, setOutput] = useState("");
  const [window, setWindow] = useState<[string, string, string]>(["A", "A", "A"]);
  const [lastEncrypted, setLastEncrypted] = useState<string | null>(null);

  const stateRef = useRef<EnigmaState>(createMachine(config));

  const reset = useCallback((cfg: EnigmaConfig) => {
    stateRef.current = createMachine(cfg);
    setWindow(windowLetters(stateRef.current));
    setInput("");
    setOutput("");
    setLastEncrypted(null);
  }, []);

  useEffect(() => {
    reset(config);
  }, [config]);

  const handleKey = useCallback((letter: string) => {
    if (!letter.match(/[A-Z]/)) return;
    const enc = encryptLetter(stateRef.current, letter);
    setLastEncrypted(enc);
    setInput((prev) => prev + letter);
    setOutput((prev) => prev + enc);
    setWindow(windowLetters(stateRef.current));
  }, []);

  const handlePhysicalKey = useCallback(
    (e: React.KeyboardEvent) => {
      const key = e.key.toUpperCase();
      if (key.match(/^[A-Z]$/)) {
        e.preventDefault();
        handleKey(key);
      } else if (e.key === "Backspace") {
        // Can't undo Enigma — tell the user
      }
    },
    [handleKey]
  );

  return (
    <div
      className="enigma-demo bg-navy-light rounded-xl border border-amber/20 border-t-2 border-t-amber/50 p-6 font-sans"
      tabIndex={0}
      onKeyDown={handlePhysicalKey}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-amber font-semibold text-lg">
          Enigma Machine — Interactive Demo
        </h3>
        <button
          onClick={() => reset(config)}
          className="text-xs text-ivory-dim border border-ivory-dim/30 rounded px-3 py-1 hover:border-amber hover:text-amber transition-colors"
        >
          Reset
        </button>
      </div>

      {/* Rotor windows */}
      <div className="flex justify-center gap-4 mb-6">
        {(["Left", "Middle", "Right"] as const).map((label, i) => (
          <div key={label} className="text-center">
            <div className="text-xs text-ivory-dim mb-1 font-mono">{label}</div>
            <div className="w-14 h-14 rounded-lg bg-navy border-2 border-amber flex items-center justify-center text-2xl font-mono text-amber font-bold tracking-wider shadow-[0_0_12px_rgba(200,164,74,0.4)]">
              {window[i]}
            </div>
            <div className="text-xs text-ivory-dim mt-1 font-mono">
              {config.rotors[i]}
            </div>
          </div>
        ))}
      </div>

      {/* Keyboard */}
      <div className="mb-6">
        {["QWERTYUIOP", "ASDFGHJKL", "ZXCVBNM"].map((row) => (
          <div key={row} className="flex justify-center gap-1.5 mb-1.5">
            {row.split("").map((k) => (
              <button
                key={k}
                onClick={() => handleKey(k)}
                className={`w-9 h-9 rounded text-sm font-mono font-semibold transition-all duration-100
                  ${lastEncrypted && input.slice(-1) === k
                    ? "bg-amber text-navy scale-95"
                    : "bg-navy border border-ivory-dim/20 text-ivory hover:border-amber/60 hover:text-amber active:scale-95"
                  }`}
              >
                {k}
              </button>
            ))}
          </div>
        ))}
      </div>

      {/* Lamp board */}
      <div className="mb-6">
        <div className="text-xs text-ivory-dim mb-2 text-center font-mono">LAMP BOARD</div>
        {["QWERTYUIOP", "ASDFGHJKL", "ZXCVBNM"].map((row) => (
          <div key={row} className="flex justify-center gap-1.5 mb-1.5">
            {row.split("").map((k) => {
              const lit = lastEncrypted === k;
              return (
                <div
                  key={k}
                  className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-mono font-semibold transition-all duration-150
                    ${lit
                      ? "bg-amber text-navy shadow-[0_0_16px_rgba(200,164,74,0.8)] scale-110"
                      : "bg-navy-medium border border-ivory-dim/10 text-ivory-dim/40"
                    }`}
                >
                  {k}
                </div>
              );
            })}
          </div>
        ))}
      </div>

      {/* Input / Output */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <div className="text-xs text-ivory-dim mb-1 font-mono">PLAINTEXT</div>
          <div className="bg-navy rounded p-3 min-h-[3rem] font-mono text-ivory text-sm break-all">
            {input || <span className="text-ivory-dim/40">Type or click keys…</span>}
          </div>
        </div>
        <div>
          <div className="text-xs text-amber mb-1 font-mono">CIPHERTEXT</div>
          <div className="bg-navy rounded p-3 min-h-[3rem] font-mono text-amber text-sm break-all">
            {output || <span className="text-amber/30">Encrypted output…</span>}
          </div>
        </div>
      </div>

      {/* Settings */}
      <details className="mt-6">
        <summary className="text-xs text-ivory-dim cursor-pointer hover:text-amber transition-colors font-mono">
          ▸ Machine settings
        </summary>
        <div className="mt-3 grid grid-cols-3 gap-3">
          {(["Left", "Middle", "Right"] as const).map((label, i) => (
            <div key={label}>
              <label className="text-xs text-ivory-dim block mb-1">{label} rotor</label>
              <select
                value={config.rotors[i]}
                onChange={(e) => {
                  const newRotors = [...config.rotors] as [string, string, string];
                  newRotors[i] = e.target.value;
                  setConfig({ ...config, rotors: newRotors });
                }}
                className="w-full bg-navy border border-ivory-dim/20 rounded px-2 py-1 text-sm text-ivory font-mono"
              >
                {Object.keys(ROTOR_SPECS).map((r) => (
                  <option key={r} value={r}>{r}</option>
                ))}
              </select>
            </div>
          ))}
          {(["Left", "Middle", "Right"] as const).map((label, i) => (
            <div key={label}>
              <label className="text-xs text-ivory-dim block mb-1">{label} start</label>
              <select
                value={ALPHABET[config.positions[i]]}
                onChange={(e) => {
                  const newPos = [...config.positions] as [number, number, number];
                  newPos[i] = e.target.value.charCodeAt(0) - 65;
                  setConfig({ ...config, positions: newPos });
                }}
                className="w-full bg-navy border border-ivory-dim/20 rounded px-2 py-1 text-sm text-ivory font-mono"
              >
                {ALPHABET.split("").map((l) => (
                  <option key={l} value={l}>{l}</option>
                ))}
              </select>
            </div>
          ))}
        </div>
      </details>

      <p className="mt-4 text-xs text-ivory-dim/50 text-center font-sans">
        Click keys or type on your keyboard. Notice how the same letter never produces itself.
      </p>
    </div>
  );
}
