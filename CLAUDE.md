# CLAUDE.md: lutchet

Mathematics and CS through stories. Each topic gets a Python implementation, an Astro lesson page with interactive React demos, Jupyter notebooks, and optionally a Remotion video.

## Project overview

Three independent sub-systems that share the same content domain:

1. **Python library** (`src/`): one subfolder per topic, pure implementations of the relevant algorithms
2. **Website** (`website/`): Astro + React + Tailwind static site deployed to Netlify
3. **Video** (`video/`): Remotion animations

Where a topic has interactive browser demos, the Python logic is **mirrored manually in TypeScript** inside `website/src/components/interactive/`. Both must be kept in sync when the algorithm changes.

## Running things

```bash
# Python / notebooks
uv sync
uv run python main.py          # smoke test
uv run jupyter lab

# Website
cd website && npm run dev      # localhost:4321
cd website && npm run build

# Video
cd video && npm run studio
cd video && npm run render
```

## Architecture notes

### Python (`src/`)

Each topic lives in its own subfolder under `src/`. Current topics:

- `src/enigma_bayes/`: Enigma machine + Bayesian decoder
- `src/information_theory/`: Shannon entropy, Huffman coding, channel capacity

`main.py` is a smoke test; run it after any change to Python modules.

### Website (`website/`)

- Framework: **Astro 5** (static output, no SSR)
- Interactivity: **React 18** islands embedded in `.astro` pages
- Styling: **Tailwind CSS 3** with custom design tokens (see below)
- Math: **KaTeX** via `<Math>` component (`website/src/components/ui/Math.astro`)
- Pages live in `website/src/pages/`: `index.astro` (homepage) and one lesson page (or sub-tree) per topic under `lessons/`
- Interactive React components in `website/src/components/interactive/`, one subfolder per topic

#### Two topic shapes

A topic on the homepage can take either shape; pick based on the content, not the count:

- **Single-page topic**: one `lessons/<topic>.astro` containing the whole lesson. Use when the topic is one unified narrative with one cast of characters, even if it spans multiple notebook chapters. *Example: Enigma & Bayes.*
- **Multi-story topic**: a directory `lessons/<topic>/` with `index.astro` (landing page sketching the arc) and one `.astro` per story underneath. Use when a topic naturally splits into standalone stories with different historical anchors, characters, and algorithms that happen to share a mathematical family. *Example: Graph Theory (Königsberg / Dijkstra / max-flow / random walks).*

In both shapes the homepage shows **one** `LessonCard` for the topic. The topic is still the unit in `src/` and on the homepage; only the lesson page(s) branch.

#### Design tokens (Tailwind)

| Token | Hex | Usage |
|-------|-----|-------|
| `navy` | `#0a0e1a` | Background |
| `navy-medium` | `#0f1629` | Card backgrounds |
| `navy-light` | `#1a2240` | Borders, dividers |
| `amber` | `#c8a44a` | Primary accent, headings |
| `amber-light` | `#e0c06a` | Hover states |
| `ivory` | `#e8e4d9` | Body text |
| `ivory-dim` | `#b0a890` | Muted text |
| `steel` | `#4a90e2` | Links, code |

Fonts: `font-serif` (EB Garamond), `font-sans` (Instrument Sans), `font-mono` (JetBrains Mono).

### Video (`video/`)

- Remotion 4 with React/TypeScript
- One composition per topic under `video/src/compositions/`
- Style constants: `video/src/tokens.ts`
- Renders to `video/out/`

## Deployment

Netlify builds from the `website/` base directory (`netlify.toml`). All routes redirect to `index.html` (SPA-style). Node 20 is pinned.

## Content structure per lesson page

Every lesson page (whether it's a single-page topic or one story within a multi-story topic) has the same shape:
- Story section: how the historical/real problem arose (general audience)
- Interactive demo section: React components embedded in the Astro page
- Topic section: deeper mathematical content with KaTeX equations
- Further reading: curated pointers (books, papers, related lessons in this project). Cross-lesson callbacks are encouraged when the math connects (e.g. random walks ↔ Bayes ↔ entropy rate).
- Links to Jupyter notebooks and source code

For a multi-story topic, the `index.astro` landing page is lighter: it sketches the arc across stories and links out. Treat it like a table of contents with narrative glue, not a full lesson.

## Style

**No em dashes.** Not in prose, code comments, docstrings, commit messages, or notebook markdown. Use commas, periods, colons, parentheses, or rewrite the sentence. (Vivek strips them out of published content; skip the step.)

## Adding a new topic

1. `src/<topic>/`: Python implementation (shared primitives at the top, per-story modules below for multi-story topics)
2. Lesson page(s):
   - Single-page topic: `website/src/pages/lessons/<topic>.astro`
   - Multi-story topic: `website/src/pages/lessons/<topic>/index.astro` + one `.astro` per story
3. `website/src/components/interactive/<topic>/`: React demo components (sub-folders per story if needed)
4. Add one `LessonCard` for the topic to `website/src/pages/index.astro`
5. `notebooks/`: numbered chapter notebooks (one per story for multi-story topics)
6. (optional) `video/src/compositions/<Topic>.tsx`: Remotion animation
7. Update `main.py` smoke test

## Things to keep in sync

- When changing Python algorithm logic → also update the mirrored TypeScript in `website/src/components/interactive/`
- When modifying design tokens → edit `website/tailwind.config.mjs`
