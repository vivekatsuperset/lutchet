"""
Königsberg, 1736: the puzzle that founded graph theory.

The Prussian city of Königsberg sat astride the Pregel river, with two
islands in its middle. Seven bridges connected the four land masses:
the northern bank, the southern bank, Kneiphof (the main island), and
Lomse (the smaller eastern island). Citizens wondered whether it was
possible to take a Sunday walk that crossed each bridge exactly once.

Leonhard Euler's 1736 paper "Solutio problematis ad geometriam situs
pertinentis" proved the walk is impossible. More importantly, it
showed the answer does not depend on the layout of the city at all,
only on how many bridges meet at each land mass. That abstraction is
the birth of graph theory.

Bridge names (as they stood in 1736):
  Krämerbrücke, Schmiedebrücke:  North bank ↔ Kneiphof
  Grüne Brücke, Köttelbrücke:    South bank ↔ Kneiphof
  Honigbrücke:                   Kneiphof ↔ Lomse
  Hohe Brücke:                   North bank ↔ Lomse
  Holzbrücke:                    South bank ↔ Lomse
"""

from .core import Graph

# Land masses.
NORTH = "N"     # Northern bank (Altstadt / Löbenicht)
SOUTH = "S"     # Southern bank (Vorstadt)
KNEIPHOF = "K"  # Main island
LOMSE = "L"     # Smaller eastern island


def koenigsberg_graph() -> Graph:
    """
    Königsberg's bridge network as it stood in 1736.

    Seven bridges connecting four land masses. Every land mass has an
    odd number of bridges, so no Eulerian path exists. The walk is
    impossible.
    """
    g = Graph()
    # North ↔ Kneiphof: Krämerbrücke, Schmiedebrücke
    g.add_edge(NORTH, KNEIPHOF)
    g.add_edge(NORTH, KNEIPHOF)
    # South ↔ Kneiphof: Grüne Brücke, Köttelbrücke
    g.add_edge(SOUTH, KNEIPHOF)
    g.add_edge(SOUTH, KNEIPHOF)
    # Honigbrücke: Kneiphof ↔ Lomse
    g.add_edge(KNEIPHOF, LOMSE)
    # Hohe Brücke: North ↔ Lomse
    g.add_edge(NORTH, LOMSE)
    # Holzbrücke: South ↔ Lomse
    g.add_edge(SOUTH, LOMSE)
    return g
