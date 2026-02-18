import { getNodeLabel } from "./utils.js";

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
            nodes: nodes.map(n => ({ id: n.id, resetStyle: true }))
        }
    });

    const mstEdges = [];
    let lastDiscardedEdgeId = null;

    for (const edge of sortedEdges) {
        const edgeLabel = `${getNodeLabel(nodes, edge.source)}-${getNodeLabel(nodes, edge.target)}`;
        
        // --- STEP: ANALYSIS ---
        // If the previous edge was discarded, reset it in this step
        const analysisChanges = {
            edges: [{ id: edge.id, state: "highlighted" }] // Analyzing
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
            // --- STEP: SUCCESS (MST) ---
            union(edge.source, edge.target);
            mstEdges.push(edge);

            steps.push({
                description: `Edge ${edgeLabel} connects two disjoint sets. Added to MST.`,
                changes: {
                    edges: [{ id: edge.id, state: "success", width: 4 }],
                    nodes: [
                        { id: edge.source, state: "success" }, 
                        { id: edge.target, state: "success" }
                    ]
                }
            });
        } else {
            // --- STEP: DISCARD (CYCLE) ---
            lastDiscardedEdgeId = edge.id; // Mark for reset in the next iteration
            steps.push({
                description: `Edge ${edgeLabel} forms a cycle. Discarded.`,
                changes: {
                    edges: [{ id: edge.id, state: "error", width: 2 }]
                }
            });
        }
    }

    // Final reset for the last discarded edge (if any)
    const finalChanges = {
        edges: mstEdges.map(e => ({ id: e.id, state: "path", width: 4 })),
        nodes: nodes.map(n => ({ id: n.id, state: "path" }))
    };
    if (lastDiscardedEdgeId) {
        finalChanges.edges.push({ id: lastDiscardedEdgeId, resetStyle: true });
    }

    steps.push({
        description: "MST Calculation Complete. Final tree highlighted.",
        changes: finalChanges
    });

    return steps;
}

