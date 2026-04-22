# lutchet

Mathematics and CS through stories: interactive lessons with visualisations, Jupyter notebooks, and video animations.

Live site: **https://lutchet.ai**

## Getting started

You need [uv](https://github.com/astral-sh/uv) (Python package manager).

```bash
git clone https://github.com/vivekatsuperset/lutchet
cd lutchet
uv sync
uv run jupyter lab
```

Open the notebook for whichever topic you're following.

Verify everything is wired up:

```bash
uv run python main.py
```

## Website (local dev)

```bash
cd website
npm install
npm run dev      # http://localhost:4321
npm run build    # production build → website/dist/
```

## Video animations

```bash
cd video
npm install
npm run studio   # Remotion Studio preview
npm run render   # render to out/
```

## Structure

Each topic gets a folder in `src/`, a page under `website/src/pages/lessons/`, one or more notebooks, and optionally a video composition.

```
src/
  <topic>/              Python implementation for a topic
notebooks/              Jupyter notebooks, numbered chapters
website/                Astro + React + Tailwind static site (Netlify)
  src/
    pages/
      index.astro       Homepage (topic cards)
      lessons/          One .astro page per topic
    components/
      ui/               LessonCard, Math (KaTeX), ProfileCard
      interactive/      React demos, one subfolder per topic
    layouts/            BaseLayout, LessonLayout
video/                  Remotion animations
main.py                 Smoke test
```

## Tech stack

| Layer | Technology |
|-------|-----------|
| Python | Python 3.12, numpy, scipy, matplotlib |
| Package manager (Python) | [uv](https://github.com/astral-sh/uv) |
| Website | [Astro 5](https://astro.build) (static) + React 18 + Tailwind CSS 3 |
| Math rendering | KaTeX |
| Video | [Remotion 4](https://remotion.dev) |
| Deployment | Netlify (`website/` dir → `dist/`) |
