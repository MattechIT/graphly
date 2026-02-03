export class Graph {
    constructor() {
        this.nodes = [];            // [{ id, x, y, ... }]
        this.idToIndex = new Map(); // id -> index
        this.edges = [];            // [{ id, source, target, weight?, capacity? }]
        this.adj = [];              // adjacency list: array of arrays of edge indices
    }

    addNode(node) {
        const idx = this.nodes.length;
        this.nodes.push(node);
        this.idToIndex.set(node.id, idx);
        this.adj.push([]);
        return idx;
    }

    addEdge(edge) {
        // edge: { id, sourceId, targetId, weight?, capacity? }
        const s = this.idToIndex.get(edge.sourceId);
        const t = this.idToIndex.get(edge.targetId);
        if (s === undefined || t === undefined) return null;
        const eIdx = this.edges.length;
        this.edges.push({ id: edge.id, source: s, target: t, weight: edge.weight ?? 1, capacity: edge.capacity ?? null });
        this.adj[s].push(eIdx); // directed
        return eIdx;
    }

    // optional helper to get outgoing edges of node by index
    outEdgesOf(nodeIndex) {
        return this.adj[nodeIndex].map(eIdx => this.edges[eIdx]);
    }
}

export function buildGraphFromState(state) {
    const g = new Graph();
    // add nodes
    state.nodes.forEach(n => g.addNode({ id: n.id, x: n.x, y: n.y }));
    // add edges (use stored ids; renderer can be extended to provide weight/capacity)
    state.edges.forEach(e => {
        g.addEdge({ id: e.id, sourceId: e.source, targetId: e.target, weight: e.weight, capacity: e.capacity });
    });
    return g;
}