/**
 * Kruskal's Minimum Spanning Tree Algorithm
 */

export const metadata = {
    id: "kruskal",
    name: "Kruskal MST",
    requires: [], 
    graphType: "undirected"
};

export function run(nodes, edges, params) {
    const steps = [];
    
    const getNodeLabel = (id) => {
        const n = nodes.find(x => x.id === id);
        return n ? (n.userLabel || id) : id;
    };

    const parent = {};
    nodes.forEach(n => parent[n.id] = n.id);

    const find = (i) => {
        if (parent[i] === i) return i;
        return find(parent[i]);
    };

    const union = (i, j) => {
        const rootI = find(i);
        const rootJ = find(j);
        if (rootI !== rootJ) {
            parent[rootI] = rootJ;
            return true;
        }
        return false;
    };

    const sortedEdges = [...edges].sort((a, b) => a.weight - b.weight);

    steps.push({
        description: "Algorithm started. Edges sorted by weight.",
        changes: {
            nodes: nodes.map(n => ({ id: n.id, color: "white" }))
        }
    });

    const mstEdges = [];
    let lastDiscardedEdgeId = null;

    for (const edge of sortedEdges) {
        const edgeLabel = `${getNodeLabel(edge.source)}-${getNodeLabel(edge.target)}`;
        
        // --- STEP: ANALISI ---
        // Se l'arco precedente era stato scartato, lo resettiamo in questo step
        const analysisChanges = {
            edges: [{ id: edge.id, color: "#f1c40f" }] // Giallo: in analisi
        };
        if (lastDiscardedEdgeId) {
            analysisChanges.edges.push({ id: lastDiscardedEdgeId, resetStyle: true });
            lastDiscardedEdgeId = null;
        }

        steps.push({
            description: `Checking edge ${edgeLabel} (Weight: ${edge.weight}).`,
            changes: analysisChanges
        });

        const root1 = find(edge.source);
        const root2 = find(edge.target);

        if (root1 !== root2) {
            // --- STEP: SUCCESSO (MST) ---
            union(edge.source, edge.target);
            mstEdges.push(edge);

            steps.push({
                description: `Edge ${edgeLabel} connects two disjoint sets. Added to MST.`,
                changes: {
                    edges: [{ id: edge.id, color: "#2ecc71", width: 4 }],
                    nodes: [
                        { id: edge.source, color: "#2ecc71" }, 
                        { id: edge.target, color: "#2ecc71" }
                    ]
                }
            });
        } else {
            // --- STEP: SCARTO (CICLO) ---
            lastDiscardedEdgeId = edge.id; // Segniamo per resettarlo al prossimo giro
            steps.push({
                description: `Edge ${edgeLabel} forms a cycle. Discarded.`,
                changes: {
                    edges: [{ id: edge.id, color: "#e74c3c", width: 2 }]
                }
            });
        }
    }

    // Reset finale per l'ultimo eventuale arco scartato
    const finalChanges = {
        edges: mstEdges.map(e => ({ id: e.id, color: "#3498db", width: 4 })),
        nodes: nodes.map(n => ({ id: n.id, color: "#3498db" }))
    };
    if (lastDiscardedEdgeId) {
        finalChanges.edges.push({ id: lastDiscardedEdgeId, resetStyle: true });
    }

    steps.push({
        description: "MST Calculation Complete. Final tree highlighted in Blue.",
        changes: finalChanges
    });

    return steps;
}