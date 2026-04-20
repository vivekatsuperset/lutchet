"""
Quick smoke test — run with: uv run python main.py
Verifies the Enigma machine and Bayes modules are wired correctly.
"""
import sys
sys.path.insert(0, '.')

from src.enigma_bayes.enigma.machine import EnigmaMachine, EnigmaConfig
from src.enigma_bayes.bayes.probability import uniform_prior, bayesian_update
from src.enigma_bayes.bayes.scoring import index_of_coincidence, enigma_constraint_satisfied
from src.graph_theory.core import has_eulerian_circuit, has_eulerian_path
from src.graph_theory.koenigsberg import koenigsberg_graph
from src.graph_theory.weighted import WeightedGraph
from src.graph_theory.dijkstra import dijkstra, shortest_path
from src.graph_theory.flow import FlowNetwork, max_flow, min_cut
from src.graph_theory.directed import DirectedGraph
from src.graph_theory.walks import pagerank, personalized_pagerank

def main():
    print("── Enigma smoke test ──────────────────────────────")
    config = EnigmaConfig.from_letters(
        rotors=("I", "II", "III"),
        positions=("A", "A", "A"),
        ring_settings=("A", "A", "A"),
        reflector="UKW-B",
    )
    machine = EnigmaMachine(config)
    msg = "HELLOTURINGSHELLOTURINGS"
    enc = machine.encrypt(msg)
    machine.reset(config)
    dec = machine.encrypt(enc)
    print(f"  Plain:   {msg}")
    print(f"  Cipher:  {enc}")
    print(f"  Decrypt: {dec}")
    assert dec == msg, "Round-trip failed!"
    print("  ✓ Round-trip encryption/decryption correct\n")

    # Verify no-self-encryption property
    violations = [p for p, c in zip(msg, enc) if p == c]
    assert not violations, f"Self-encryption found: {violations}"
    print("  ✓ No letter encrypted to itself\n")

    print("── Bayes smoke test ───────────────────────────────")
    prior = uniform_prior(4)
    likelihoods = [0.0, 0.9, 0.0, 0.1]  # only H2 and H4 survive
    import numpy as np
    posterior = bayesian_update(prior, np.array(likelihoods))
    print(f"  Prior:     {prior}")
    print(f"  Posterior: {posterior.round(3)}")
    assert posterior[1] > 0.8, "Bayesian update failed"
    print("  ✓ Bayesian update correct\n")

    print("── Index of Coincidence ───────────────────────────")
    english_ic = index_of_coincidence("THEENIGMAWASSUPPOSEDLYUNBREAKABLE")
    random_ic  = index_of_coincidence(enc)  # ciphertext looks random
    print(f"  English text IC: {english_ic:.4f}  (expect ~0.065)")
    print(f"  Ciphertext IC:   {random_ic:.4f}   (expect ~0.038)")
    print()

    print("── Königsberg smoke test ──────────────────────────")
    kg = koenigsberg_graph()
    degrees = {n: kg.degree(n) for n in kg.nodes}
    print(f"  Nodes:    {kg.nodes}")
    print(f"  Degrees:  {degrees}")
    print(f"  Bridges:  {len(kg.edges)}")
    assert len(kg.edges) == 7, "Königsberg has seven bridges"
    assert all(d % 2 == 1 for d in degrees.values()), "All four land masses have odd degree"
    assert not has_eulerian_path(kg), "Königsberg walk must be impossible"
    assert not has_eulerian_circuit(kg), "No circuit either"
    print("  ✓ Euler's theorem says no walk is possible (confirmed)\n")

    print("── Dijkstra smoke test ────────────────────────────")
    # A small weighted graph with a known shortest path.
    #   A --1-- B --2-- C
    #   |       |       |
    #   4       5       1
    #   |       |       |
    #   D --1-- E --3-- F
    wg = WeightedGraph()
    wg.add_edge("A", "B", 1.0)
    wg.add_edge("B", "C", 2.0)
    wg.add_edge("A", "D", 4.0)
    wg.add_edge("B", "E", 5.0)
    wg.add_edge("C", "F", 1.0)
    wg.add_edge("D", "E", 1.0)
    wg.add_edge("E", "F", 3.0)
    dists, preds = dijkstra(wg, "A")
    path = shortest_path(preds, "A", "F")
    print(f"  Shortest A->F distance: {dists['F']}")
    print(f"  Shortest A->F path:     {' -> '.join(path)}")
    assert dists["F"] == 4.0, f"Expected 4.0, got {dists['F']}"
    assert path == ["A", "B", "C", "F"], f"Unexpected path: {path}"
    print("  ✓ Dijkstra finds the correct shortest path\n")

    print("── Max-flow / min-cut smoke test ──────────────────")
    # A small directed flow network.
    #
    #        10         10
    #    s ------> a ------> t
    #    |         ^         ^
    #    |5        |4        |10
    #    v         |         |
    #    b ------> c --------+
    #        8          9
    #
    # Capacities chosen so the bottleneck is s->b (5), giving max-flow 15.
    net = FlowNetwork()
    net.add_edge("s", "a", 10)
    net.add_edge("a", "t", 10)
    net.add_edge("s", "b", 5)
    net.add_edge("b", "c", 8)
    net.add_edge("c", "a", 4)
    net.add_edge("c", "t", 9)
    value, flow = max_flow(net, "s", "t")
    print(f"  Max flow s->t:  {value}")
    cut_value, cut_edges = min_cut(net, "s", "t")
    print(f"  Min cut value:  {cut_value}")
    print(f"  Min cut edges:  {sorted(cut_edges)}")
    assert value == 15.0, f"Expected max-flow 15, got {value}"
    assert cut_value == value, "Max-flow / min-cut theorem violated"
    # Conservation: flow in = flow out at every intermediate node.
    for node in ("a", "b", "c"):
        inflow = sum(f for (u, v), f in flow.items() if v == node)
        outflow = sum(f for (u, v), f in flow.items() if u == node)
        assert abs(inflow - outflow) < 1e-9, f"{node}: {inflow} != {outflow}"
    print("  ✓ Max-flow = min-cut and flow is conserved\n")

    print("── PageRank smoke test ────────────────────────────")
    # A small directed graph with a cycle and a pure source.
    #
    #        A -> B -> C
    #        ^         |
    #        |         v
    #        +--- D <--+
    #        ^
    #        |
    #        E (pure source, one outgoing edge to A)
    #
    # The cycle A -> B -> C -> D -> A accumulates rank; E is a pure
    # source and receives nothing, so its rank should be the lowest.
    dg = DirectedGraph()
    dg.add_edge("A", "B")
    dg.add_edge("B", "C")
    dg.add_edge("C", "D")
    dg.add_edge("D", "A")
    dg.add_edge("E", "A")
    ranks = pagerank(dg)
    total = sum(ranks.values())
    print(f"  Ranks: {[(n, round(r, 3)) for n, r in sorted(ranks.items())]}")
    print(f"  Sum:   {total:.6f}  (expect 1.0)")
    assert abs(total - 1.0) < 1e-6, f"Ranks should sum to 1, got {total}"
    assert ranks["E"] == min(ranks.values()), "Pure source should rank lowest"
    # Personalised PageRank from A should rank A highest.
    pp = personalized_pagerank(dg, "A")
    assert pp["A"] == max(pp.values()), "Seed should rank highest in personalised PageRank"
    print(f"  Personalised from A: top = {max(pp, key=pp.get)}")
    print("  ✓ PageRank converges and respects structure\n")

    print("All checks passed. You're ready to open the notebooks.")

if __name__ == "__main__":
    main()
