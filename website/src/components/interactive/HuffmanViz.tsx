import { useState, useMemo } from "react";

// Approximate English letter frequencies
const ENGLISH_FREQ: Record<string, number> = {
  E: 12.7, T: 9.1, A: 8.2, O: 7.5, I: 7.0, N: 6.7, S: 6.3, H: 6.1,
  R: 6.0, D: 4.3, L: 4.0, C: 2.8, U: 2.8, M: 2.4, W: 2.4, F: 2.2,
  G: 2.0, Y: 2.0, P: 1.9, B: 1.5, V: 1.0, K: 0.8, J: 0.2, X: 0.2,
  Q: 0.1, Z: 0.1,
};

interface HuffNode {
  id: string;
  symbol?: string;
  freq: number;
  left?: HuffNode;
  right?: HuffNode;
}

function buildHuffmanTree(freqs: Record<string, number>): HuffNode {
  let counter = 0;
  const nodes: HuffNode[] = Object.entries(freqs).map(([sym, f]) => ({
    id: `leaf-${sym}`,
    symbol: sym,
    freq: f,
  }));

  const queue = [...nodes].sort((a, b) => a.freq - b.freq);

  while (queue.length > 1) {
    const left = queue.shift()!;
    const right = queue.shift()!;
    const merged: HuffNode = {
      id: `node-${counter++}`,
      freq: left.freq + right.freq,
      left,
      right,
    };
    // Insert sorted
    let i = 0;
    while (i < queue.length && queue[i].freq < merged.freq) i++;
    queue.splice(i, 0, merged);
  }

  return queue[0];
}

function buildCodes(node: HuffNode, prefix = "", codes: Record<string, string> = {}): Record<string, string> {
  if (node.symbol !== undefined) {
    codes[node.symbol] = prefix || "0";
  } else {
    if (node.left) buildCodes(node.left, prefix + "0", codes);
    if (node.right) buildCodes(node.right, prefix + "1", codes);
  }
  return codes;
}

function treeDepth(node: HuffNode): number {
  if (!node.left && !node.right) return 0;
  return 1 + Math.max(
    node.left ? treeDepth(node.left) : 0,
    node.right ? treeDepth(node.right) : 0,
  );
}

// Pick top N most frequent letters for display
const TOP_N = 8;

export default function HuffmanViz() {
  const [highlighted, setHighlighted] = useState<string | null>(null);

  const topLetters = useMemo(() => {
    return Object.entries(ENGLISH_FREQ)
      .sort(([, a], [, b]) => b - a)
      .slice(0, TOP_N);
  }, []);

  const freqMap = useMemo(() => Object.fromEntries(topLetters), [topLetters]);

  const tree = useMemo(() => buildHuffmanTree(freqMap), [freqMap]);
  const codes = useMemo(() => buildCodes(tree), [tree]);

  const entropy = useMemo(() => {
    const total = Object.values(freqMap).reduce((s, v) => s + v, 0);
    return Object.values(freqMap).reduce((h, f) => {
      const p = f / total;
      return h - p * Math.log2(p);
    }, 0);
  }, [freqMap]);

  const avgCodeLength = useMemo(() => {
    const total = Object.values(freqMap).reduce((s, v) => s + v, 0);
    return Object.entries(codes).reduce((sum, [sym, code]) => {
      const p = (freqMap[sym] ?? 0) / total;
      return sum + p * code.length;
    }, 0);
  }, [codes, freqMap]);

  // Sort by code length, then alpha for display
  const sortedCodes = useMemo(() => {
    return Object.entries(codes).sort(([, a], [, b]) => a.length - b.length || a.localeCompare(b));
  }, [codes]);

  return (
    <div className="bg-navy-medium border border-ivory-dim/10 border-t-2 border-t-amber/40 rounded-xl p-6 my-8">
      <p className="font-sans text-xs text-amber/60 tracking-widest uppercase mb-6">
        Huffman Codes &mdash; Top {TOP_N} English Letters
      </p>

      {/* Code table */}
      <div className="grid grid-cols-2 gap-3 mb-6">
        {sortedCodes.map(([sym, code]) => {
          const freq = freqMap[sym] ?? 0;
          const isHighlighted = highlighted === sym;
          return (
            <button
              key={sym}
              onMouseEnter={() => setHighlighted(sym)}
              onMouseLeave={() => setHighlighted(null)}
              className={`flex items-center gap-3 rounded-lg p-3 text-left border transition-all ${
                isHighlighted
                  ? "border-amber/50 bg-amber/5"
                  : "border-ivory-dim/10 hover:border-ivory-dim/25"
              }`}
            >
              <span className="font-mono text-2xl font-bold text-amber w-8 text-center">{sym}</span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1 mb-0.5">
                  {code.split("").map((bit, i) => (
                    <span
                      key={i}
                      className={`font-mono text-sm font-semibold ${
                        bit === "0" ? "text-steel" : "text-amber"
                      }`}
                    >
                      {bit}
                    </span>
                  ))}
                  <span className="ml-2 font-sans text-xs text-ivory-dim/40">
                    ({code.length} bit{code.length !== 1 ? "s" : ""})
                  </span>
                </div>
                <div className="h-1 bg-navy rounded-full overflow-hidden">
                  <div
                    className="h-full bg-amber/40 rounded-full"
                    style={{ width: `${freq}%` }}
                  />
                </div>
                <p className="font-sans text-xs text-ivory-dim/40 mt-0.5">{freq.toFixed(1)}% in English</p>
              </div>
            </button>
          );
        })}
      </div>

      {/* Tree structure — text-based for the top 4 letters */}
      <div className="border-t border-ivory-dim/10 pt-5 mb-5">
        <p className="font-sans text-xs text-ivory-dim/50 uppercase tracking-widest mb-3">
          Tree structure
        </p>
        <div className="font-mono text-xs text-ivory/70 bg-navy rounded-lg p-4 leading-relaxed">
          <TreeView node={tree} highlighted={highlighted} depth={0} maxDepth={3} />
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-navy rounded-lg p-3 text-center">
          <p className="font-mono text-xl font-bold text-amber">{entropy.toFixed(2)}</p>
          <p className="font-sans text-xs text-ivory-dim/50 mt-0.5">bits entropy</p>
        </div>
        <div className="bg-navy rounded-lg p-3 text-center">
          <p className="font-mono text-xl font-bold text-steel">{avgCodeLength.toFixed(2)}</p>
          <p className="font-sans text-xs text-ivory-dim/50 mt-0.5">avg code length</p>
        </div>
        <div className="bg-navy rounded-lg p-3 text-center">
          <p className="font-mono text-xl font-bold text-ivory/60">
            {((avgCodeLength / entropy - 1) * 100).toFixed(1)}%
          </p>
          <p className="font-sans text-xs text-ivory-dim/50 mt-0.5">above entropy floor</p>
        </div>
      </div>

      <p className="font-sans text-xs text-ivory-dim/40 mt-4 leading-relaxed">
        Frequent letters (E, T, A) get short codes. Rare ones (J, X, Q) get long codes.
        Shannon proved you cannot do better than the entropy floor on average.
        Huffman codes get within 1 bit of it.
      </p>
    </div>
  );
}

function TreeView({
  node,
  highlighted,
  depth,
  maxDepth,
}: {
  node: HuffNode;
  highlighted: string | null;
  depth: number;
  maxDepth: number;
}) {
  const indent = "  ".repeat(depth);
  const isLeaf = !node.left && !node.right;
  const isHighlighted = isLeaf && node.symbol === highlighted;

  if (depth > maxDepth) {
    return <span className="text-ivory-dim/30">…</span>;
  }

  if (isLeaf) {
    return (
      <div className={isHighlighted ? "text-amber" : ""}>
        {indent}
        <span className={isHighlighted ? "text-amber font-bold" : "text-amber/70"}>
          {node.symbol}
        </span>
        <span className="text-ivory-dim/40"> ({node.freq.toFixed(1)}%)</span>
      </div>
    );
  }

  return (
    <div>
      <div>
        {indent}
        <span className="text-ivory-dim/40">&#9632; </span>
        <span className="text-ivory/40">{node.freq.toFixed(1)}%</span>
      </div>
      <div>
        {indent}
        <span className="text-steel/60">0 </span>
        <TreeView node={node.left!} highlighted={highlighted} depth={depth + 1} maxDepth={maxDepth} />
      </div>
      <div>
        {indent}
        <span className="text-amber/60">1 </span>
        <TreeView node={node.right!} highlighted={highlighted} depth={depth + 1} maxDepth={maxDepth} />
      </div>
    </div>
  );
}
