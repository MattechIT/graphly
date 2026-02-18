import { getNodeLabel } from "./utils.js";

/**
 * Dijkstra's Shortest Path Algorithm
 * Calculates shortest paths from a source node to all other nodes.
 */

export const metadata = {
    id: "dijkstra",
    name: "Dijkstra Shortest Path",
    requires: ["sourceNode"],
    graphType: "weighted"
};

export function run(nodes, edges, params) {
    const steps = [];
    const sourceId = params.sourceNode;
    
    // Data structures
    const dist = {};
    const prev = {};
    const visited = new Set();
    const unvisited = new Set();
    
    // Initialize
    nodes.forEach(n => {
        dist[n.id] = Infinity;
        prev[n.id] = null;
        unvisited.add(n.id);
    });
    
    dist[sourceId] = 0;
    
    // Initial Step
    steps.push({
        description: `Initialize distances. Source node ${getNodeLabel(nodes, sourceId)} set to 0, others to Infinity.`,
        changes: {
            nodes: nodes.map(n => ({
                id: n.id,
                algLabel: n.id === sourceId ? "dist: 0" : "dist: ∞",
                state: n.id === sourceId ? "highlighted" : undefined
            }))
        }
    });

    while (unvisited.size > 0) {
        // Find node with min dist in unvisited
        let u = null;
        let minDist = Infinity;
        
        for (const nodeId of unvisited) {
            if (dist[nodeId] < minDist) {
                minDist = dist[nodeId];
                u = nodeId;
            }
        }
        
        // If all remaining nodes are inaccessible, break
        if (u === null) {
            steps.push({
                description: "Remaining nodes are unreachable.",
                changes: {}
            });
            break;
        }
        unvisited.delete(u);
        
        steps.push({
            description: `Selected node ${getNodeLabel(nodes, u)} with current minimum distance ${minDist}.`,
            changes: {
                nodes: [{ id: u, state: "highlighted" }]
            }
        });
        
        // Get neighbors of u
        const neighbors = edges.filter(e => e.source === u);
        
        for (const edge of neighbors) {
            const v = edge.target;
            
            if (visited.has(v)) continue; // Should not happen but check
            
            // Highlight edge being checked
            steps.push({
                description: `Checking edge from ${getNodeLabel(nodes, u)} to ${getNodeLabel(nodes, v)} (weight: ${edge.weight}).`,
                changes: {
                    edges: [{ id: edge.id, state: "searching" }],
                    nodes: [{ id: v, state: "searching" }] // Candidate
                }
            });
            
            const alt = dist[u] + edge.weight;
            
            if (alt < dist[v]) {
                const oldDist = dist[v] === Infinity ? "∞" : dist[v];
                dist[v] = alt;
                prev[v] = u;
                prev[v + "_edge"] = edge.id; // Store edge ID for path highlighting
                
                steps.push({
                    description: `Found shorter path to ${getNodeLabel(nodes, v)}! Distance updated: ${oldDist} -> ${alt}.`,
                    changes: {
                        nodes: [{ id: v, algLabel: `dist: ${alt}` }],
                        edges: [{ id: edge.id, state: "success" }] // Relaxed edge
                    }
                });
            } else {
                steps.push({
                    description: `Path via ${getNodeLabel(nodes, u)} (${alt}) is not shorter than existing (${dist[v]}).`,
                    changes: {
                        edges: [{ id: edge.id, resetStyle: true }], // Revert edge color
                        nodes: [{ id: v, resetStyle: true }]
                    }
                });
            }
        }
        
        visited.add(u);
        
        // Mark u as permanently visited
        steps.push({
            description: `Finished processing node ${getNodeLabel(nodes, u)}.`,
            changes: {
                nodes: [{ id: u, state: "success" }], // Visited
                edges: neighbors.map(e => ({ id: e.id, resetStyle: true })) // Reset outgoing edges style
            }
        });
    }

    // Final Visualization: Highlight Shortest Path Tree
    const finalChanges = {
        nodes: [],
        edges: []
    };
    
    // Highlight all edges that are part of the shortest path tree
    for (const nodeId of nodes.map(n => n.id)) {
        if (nodeId === sourceId) continue;
        if (prev[nodeId + "_edge"]) {
            finalChanges.edges.push({ 
                id: prev[nodeId + "_edge"], 
                state: "path" 
            });
        }
    }
    
    steps.push({
        description: "Algorithm complete. The Shortest Path Tree is highlighted.",
        changes: finalChanges
    });

    return steps;
}

