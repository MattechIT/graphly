/**
 * Ford-Fulkerson Algorithm
 * Computes the Maximum Flow in a flow network.
 */

export const metadata = {
    id: "ford-fulkerson",
    name: "Ford-Fulkerson Max Flow",
    requires: ["sourceNode", "sinkNode"],
    graphType: "flow" // Directed, Capacitated
};

export function run(nodes, edges, params) {
    const steps = [];
    const sourceId = params.sourceNode;
    const sinkId = params.sinkNode;
    
    edges.forEach(e => {
        e.flow = 0;
        e.capacity = e.capacity || e.weight || 1; // Fallback to weight if capacity not set
    });

    const getNodeLabel = (id) => {
        const n = nodes.find(x => x.id === id);
        return n ? (n.userLabel || id) : id;
    };

    steps.push({
        description: `Starting Max Flow from ${getNodeLabel(sourceId)} to ${getNodeLabel(sinkId)}. Initial flow is 0.`,
        changes: {
            nodes: [
                { id: sourceId, state: "highlighted", algLabel: `[-, ∞]` },
                { id: sinkId, state: "path", algLabel: `[?, ?]` }
            ],
            edges: edges.map(e => ({ id: e.id, flow: 0, saturated: false }))
        }
    });

    let maxFlow = 0;

    while (true) {
        // BFS to find augmenting path
        const parent = {};
        const visited = new Set();
        const queue = [sourceId];
        visited.add(sourceId);
        
        // Track labeling info: [ParentNodeLabel, CapacityToHere]
        const nodeLabels = {}; 
        nodes.forEach(n => nodeLabels[n.id] = null);
        nodeLabels[sourceId] = { pred: '-', cap: Infinity };

        // Reset all labels at start of BFS
        const resetNodeVisuals = nodes
            .filter(n => n.id !== sourceId)
            .map(n => ({ id: n.id, algLabel: "" }));

        steps.push({
            description: "Starting BFS Iteration: Resetting labels.",
            changes: {
                nodes: [
                    ...resetNodeVisuals,
                    { id: sourceId, algLabel: `[-, ∞]` }
                ]
            }
        });
        
        let pathFound = false;

        while (queue.length > 0) {
            const u = queue.shift();
            const uLabel = nodeLabels[u];
            const uCap = uLabel ? uLabel.cap : Infinity;

            if (u === sinkId) {
                pathFound = true;
                break;
            }

            const neighborsToVisit = [];

            // 1. Forward edges
            const outEdges = edges.filter(e => e.source === u);
            for (const edge of outEdges) {
                const v = edge.target;
                const residual = edge.capacity - edge.flow;
                if (!visited.has(v) && residual > 0) {
                    visited.add(v);
                    parent[v] = { from: u, edge: edge, type: 'forward' };
                    
                    const newCap = Math.min(uCap, residual);
                    nodeLabels[v] = { pred: getNodeLabel(u), cap: newCap };
                    neighborsToVisit.push({ id: v, label: nodeLabels[v] });
                    queue.push(v);
                }
            }
            
            // 2. Backward edges
            const inEdges = edges.filter(e => e.target === u);
            for (const edge of inEdges) {
                const v = edge.source; 
                const residual = edge.flow;
                if (!visited.has(v) && residual > 0) {
                    visited.add(v);
                    parent[v] = { from: u, edge: edge, type: 'backward' };
                    const newCap = Math.min(uCap, residual);
                    nodeLabels[v] = { pred: getNodeLabel(u), cap: newCap };
                    neighborsToVisit.push({ id: v, label: nodeLabels[v] });
                    queue.push(v);
                }
            }

            // Visualize newly labeled nodes
            if (neighborsToVisit.length > 0) {
                steps.push({
                    description: `Visiting neighbors of ${getNodeLabel(u)}. Updating labels.`,
                    changes: {
                        nodes: neighborsToVisit.map(n => ({
                            id: n.id,
                            algLabel: `[${n.label.pred}, ${n.label.cap === Infinity ? '∞' : n.label.cap}]`,
                            state: "searching" // Visiting
                        }))
                    }
                });
            }
        }

        if (!pathFound) break; // No more paths

        // Reconstruct path
        let pathFlow = nodeLabels[sinkId].cap;
        let curr = sinkId;
        const pathVisuals = [];
        const pathNodes = []; // String representation for log

        while (curr !== sourceId) {
            const p = parent[curr];
            pathVisuals.push({ 
                id: p.edge.id, 
                state: "highlighted", // Highlight path
                width: 4 
            });
            pathNodes.unshift(getNodeLabel(curr));
            curr = p.from;
        }
        pathNodes.unshift(getNodeLabel(sourceId));

        steps.push({
            description: `Augmenting path found: ${pathNodes.join(" -> ")} with flow ${pathFlow}.`,
            changes: {
                edges: pathVisuals
            }
        });

        // Augment Flow
        curr = sinkId;
        const augmentVisuals = [];
        
        while (curr !== sourceId) {
            const p = parent[curr];
            
            if (p.type === 'forward') {
                p.edge.flow += pathFlow;
            } else {
                p.edge.flow -= pathFlow;
            }
            
            const isSaturated = (p.edge.flow === p.edge.capacity);
            augmentVisuals.push({
                id: p.edge.id,
                flow: p.edge.flow,
                saturated: isSaturated,
                state: "success",
                width: 4
            });
            
            curr = p.from;
        }
        
        maxFlow += pathFlow;

        steps.push({
            description: `Augmented flow by ${pathFlow}. New Total Flow: ${maxFlow}.`,
            changes: {
                edges: augmentVisuals,
                nodes: Array.from(visited).map(id => ({ id: id, resetStyle: true })) 
            }
        });
        
        steps.push({
            description: "Updating residual graph structure...",
            changes: {
                edges: augmentVisuals.map(v => ({ id: v.id, resetStyle: true }))
            }
        });
    }

    steps.push({
        description: `Algorithm complete. Maximum Flow: ${maxFlow}.`,
        changes: {
             nodes: [{ id: sinkId, algLabel: `Max Flow: ${maxFlow}`, state: "success" }]
        }
    });

    return steps;
}
