# information_theory

Python implementation for the [Information Theory](https://lutchet.netlify.app/lessons/information-theory) lesson.

## Modules

| File | What it does |
|------|-------------|
| `entropy.py` | Shannon entropy (`entropy`, `entropy_from_freqs`), English letter frequencies |
| `coding.py` | Huffman tree builder and code table (`build_tree`, `build_codes`, `average_code_length`) |
| `channel.py` | Binary Symmetric Channel simulation, repetition coding, BSC capacity formula |

## Notebook

`05_information_theory.ipynb` — covers entropy, Huffman coding, noisy channels, and connections to modern ML (cross-entropy loss, KL divergence, perplexity).
