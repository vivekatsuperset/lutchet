# enigma_bayes

Python implementation for the [Enigma & Bayes](https://lutchet.netlify.app/lessons/enigma-bayes) lesson.

## Modules

### `enigma/`
A complete Enigma machine simulation.

| File | What it does |
|------|-------------|
| `rotor.py` | Rotor wiring, stepping, and ring settings |
| `reflector.py` | Reflector (UKW) substitution |
| `plugboard.py` | Plugboard (Steckerbrett) swaps |
| `machine.py` | Full machine — wires all components together |

### `bayes/`
Bayesian inference tools used to crack Enigma settings.

| File | What it does |
|------|-------------|
| `probability.py` | `uniform_prior`, `bayesian_update`, `normalize`, log-odds utilities |
| `scoring.py` | Index of coincidence, weight of evidence, Enigma constraint check |
| `decoder.py` | `BayesianDecoder` — applies Bayesian updating over candidate settings |

## Notebooks

Follow along in order:

1. `01_enigma_machine.ipynb` — how the Enigma machine works
2. `02_bayes_fundamentals.ipynb` — Bayes' theorem from first principles
3. `03_cracking_enigma.ipynb` — using Bayes to find the correct setting
4. `04_advanced.ipynb` — Turing's bans, log-odds, and modern ML connections
