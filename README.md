# lutchet

Interactive lessons on cryptography, probability, and information theory.
Each lesson has a companion website with visualisations and a Jupyter notebook
you can run locally.

## Lessons

| # | Lesson | Notebook |
|---|--------|----------|
| 1 | [Enigma & Bayes](https://lutchet.netlify.app/lessons/enigma-bayes) | `notebooks/01–04` |
| 2 | [Information Theory](https://lutchet.netlify.app/lessons/information-theory) | `notebooks/05` |

## Getting started

You need [uv](https://github.com/astral-sh/uv) (Python package manager).

```bash
git clone https://github.com/vivekatsuperset/lutchet
cd lutchet
uv sync
uv run jupyter lab
```

Then open the notebook for whichever lesson you're following.

## Structure

```
src/
  enigma_bayes/       Python implementation backing the Enigma & Bayes lesson
  information_theory/ Python implementation backing the Information Theory lesson
notebooks/            Jupyter notebooks — one per chapter
website/              Astro site (you don't need this to run the notebooks)
```

Run the smoke test to confirm everything is wired up:

```bash
uv run python main.py
```
