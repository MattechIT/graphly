export class Graph {
    constructor() {
        this.nodes = [];            // [{ id, x, y, userLabel, algLabel }]
        this.idToIndex = new Map(); // id -> index
        this.edges = [];            // [{ id, source, target, weight, capacity, flow }]
        this.adj = [];              // Adjacency list: array of arrays of edge indices
    }

    addNode(node) {
        const idx = this.nodes.length;
        this.nodes.push({
            id: node.id,
            x: node.x,
            y: node.y,
            userLabel: node.userLabel || "",
            algLabel: node.algLabel || ""
        });
        this.idToIndex.set(node.id, idx);
        this.adj.push([]);
        return idx;
    }

    addEdge(edge) {
        // Edge: { id, sourceId, targetId, weight, capacity, flow }
        const s = this.idToIndex.get(edge.sourceId);
        const t = this.idToIndex.get(edge.targetId);
        if (s === undefined || t === undefined) return null;
        const eIdx = this.edges.length;
        this.edges.push({ 
            id: edge.id, 
            source: s, 
            target: t, 
            weight: edge.weight ?? 1, 
            capacity: edge.capacity ?? 1,
            flow: edge.flow ?? 0
        });
        this.adj[s].push(eIdx); // directed
        return eIdx;
    }

    // Optional helper to get outgoing edges of node by index
    outEdgesOf(nodeIndex) {
        return this.adj[nodeIndex].map(eIdx => this.edges[eIdx]);
    }
}

export function buildGraphFromState(state) {
    const g = new Graph();
    // Add nodes
    state.nodes.forEach(n => g.addNode({ 
        id: n.id, 
        x: n.x, 
        y: n.y, 
        userLabel: n.userLabel, 
        algLabel: n.algLabel 
    }));
    // Add edges
    state.edges.forEach(e => {
        g.addEdge({ 
            id: e.id, 
            sourceId: e.source, 
            targetId: e.target, 
            weight: e.weight, 
            capacity: e.capacity,
            flow: e.flow 
        });
    });
    return g;
}