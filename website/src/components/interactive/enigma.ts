/**
 * Enigma machine simulation in TypeScript — for the interactive browser demo.
 *
 * Mirrors the Python implementation in src/enigma/ so students can compare
 * the same algorithm in two languages.
 */

export const ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";

export interface RotorSpec {
  name: string;
  wiring: string;
  turnovers: string;
}

export const ROTOR_SPECS: Record<string, RotorSpec> = {
  I:   { name: "I",   wiring: "EKMFLGDQVZNTOWYHXUSPAIBRCJ", turnovers: "Q" },
  II:  { name: "II",  wiring: "AJDKSIRUXBLHWTMCQGZNPYFVOE", turnovers: "E" },
  III: { name: "III", wiring: "BDFHJLCPRTXVZNYEIWGAKMUSQO", turnovers: "V" },
  IV:  { name: "IV",  wiring: "ESOVPZJAYQUIRHXLNFTGKDCMWB", turnovers: "J" },
  V:   { name: "V",   wiring: "VZBRGITYUPSDNHLXAWMJQOFECK", turnovers: "Z" },
};

export const REFLECTOR_SPECS: Record<string, string> = {
  "UKW-B": "YRUHQSLDPXNGOKMIEBFZCWVJAT",
  "UKW-C": "FVPJIAOYEDRZXWGCTKUQSBNMHL",
};

export interface EnigmaConfig {
  rotors: [string, string, string];
  positions: [number, number, number];
  ringsettings: [number, number, number];
  reflector: string;
  plugboardPairs: string[];
}

export function defaultConfig(): EnigmaConfig {
  return {
    rotors: ["I", "II", "III"],
    positions: [0, 0, 0],
    ringsettings: [0, 0, 0],
    reflector: "UKW-B",
    plugboardPairs: [],
  };
}

interface RotorState {
  forward: number[];
  backward: number[];
  turnovers: string;
  position: number;
  ring: number;
}

function buildRotor(spec: RotorSpec, ring: number, position: number): RotorState {
  const forward = spec.wiring.split("").map((c) => c.charCodeAt(0) - 65);
  const backward = new Array(26).fill(0);
  forward.forEach((f, i) => { backward[f] = i; });
  return { forward, backward, turnovers: spec.turnovers, position, ring };
}

function buildPlugboard(pairs: string[]): number[] {
  const table = Array.from({ length: 26 }, (_, i) => i);
  for (const pair of pairs) {
    const a = pair.charCodeAt(0) - 65;
    const b = pair.charCodeAt(1) - 65;
    table[a] = b;
    table[b] = a;
  }
  return table;
}

function rotorForward(rotor: RotorState, signal: number): number {
  const offset = (rotor.position - rotor.ring + 26) % 26;
  const entry  = (signal + offset) % 26;
  const wired  = rotor.forward[entry];
  return (wired - offset + 26) % 26;
}

function rotorBackward(rotor: RotorState, signal: number): number {
  const offset = (rotor.position - rotor.ring + 26) % 26;
  const entry  = (signal + offset) % 26;
  const wired  = rotor.backward[entry];
  return (wired - offset + 26) % 26;
}

function atTurnover(rotor: RotorState): boolean {
  return rotor.turnovers.includes(ALPHABET[rotor.position]);
}

export interface EnigmaState {
  config: EnigmaConfig;
  left: RotorState;
  middle: RotorState;
  right: RotorState;
  reflectorWiring: number[];
  plugboard: number[];
}

export function createMachine(config: EnigmaConfig): EnigmaState {
  const [ln, mn, rn] = config.rotors;
  const [lp, mp, rp] = config.positions;
  const [lr, mr, rr] = config.ringsettings;
  return {
    config,
    left:   buildRotor(ROTOR_SPECS[ln], lr, lp),
    middle: buildRotor(ROTOR_SPECS[mn], mr, mp),
    right:  buildRotor(ROTOR_SPECS[rn], rr, rp),
    reflectorWiring: REFLECTOR_SPECS[config.reflector]
      .split("")
      .map((c) => c.charCodeAt(0) - 65),
    plugboard: buildPlugboard(config.plugboardPairs),
  };
}

function stepRotors(state: EnigmaState): void {
  if (atTurnover(state.middle)) {
    state.middle.position = (state.middle.position + 1) % 26;
    state.left.position   = (state.left.position   + 1) % 26;
  } else if (atTurnover(state.right)) {
    state.middle.position = (state.middle.position + 1) % 26;
  }
  state.right.position = (state.right.position + 1) % 26;
}

export function encryptLetter(state: EnigmaState, letter: string): string {
  const upper = letter.toUpperCase();
  const idx   = upper.charCodeAt(0) - 65;
  if (idx < 0 || idx > 25) return letter;

  stepRotors(state);

  let s = state.plugboard[idx];
  s = rotorForward(state.right,  s);
  s = rotorForward(state.middle, s);
  s = rotorForward(state.left,   s);
  s = state.reflectorWiring[s];
  s = rotorBackward(state.left,   s);
  s = rotorBackward(state.middle, s);
  s = rotorBackward(state.right,  s);
  s = state.plugboard[s];

  return String.fromCharCode(s + 65);
}

export function encryptString(config: EnigmaConfig, text: string): string {
  const state = createMachine(config);
  return text
    .toUpperCase()
    .split("")
    .map((c) => (c.match(/[A-Z]/) ? encryptLetter(state, c) : c))
    .join("");
}

export function windowLetters(state: EnigmaState): [string, string, string] {
  return [
    ALPHABET[state.left.position],
    ALPHABET[state.middle.position],
    ALPHABET[state.right.position],
  ];
}
