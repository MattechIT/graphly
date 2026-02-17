import { state } from './state.js';
import * as renderer from './renderer.js';
import * as interactions from './interactions.js';
import { LABEL_MAX_LENGTH } from './config.js';

/**
 * Export graph in json.
 */
export function exportGraph() {
    const graphData = {
        graphlyVersion: "1.0",
        timestamp: new Date().toISOString(),
        nodes: state.nodes.map(n => ({
            id: n.id,
            x: n.x,
            y: n.y,
            userLabel: n.userLabel
        })),
        edges: state.edges.map(e => ({
            id: e.id,
            source: e.source,
            target: e.target,
            weight: e.weight
        }))
    };

    const blob = new Blob([JSON.stringify(graphData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = `Graphly-${new Date().getTime()}.json`;
    document.body.appendChild(a);
    a.click();
    
    setTimeout(() => {
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }, 0);
}

/**
 * Generates a text representation of the current graph (Edge List format).
 */
export function exportToText() {
    const nodeLabels = state.nodes.map(n => n.userLabel).join(", ");
    const edgeList = state.edges.map(e => {
        const s = state.nodes.find(n => n.id === e.source)?.userLabel || e.source;
        const t = state.nodes.find(n => n.id === e.target)?.userLabel || e.target;
        return `${s} ${t} ${e.weight}`;
    }).join("\n");

    return { nodes: nodeLabels, edges: edgeList };
}

/**
 * Main entry point for Quick Text Generation.
 */
export function generateGraphFromText(nodesStr, edgesStr) {
    renderer.clearGraph();

    // 1. Parse Nodes
    const nodeNames = nodesStr.split(/[,\s\n]+/).filter(s => s.trim().length > 0);
    const nameToId = new Map();

    nodeNames.forEach(name => {
        const node = renderer.createNode(0, 0, null, name.substring(0, LABEL_MAX_LENGTH));
        interactions.attachNodeListeners(node);
        nameToId.set(name, node.id);
    });

    // 2. Parse Edges
    const edgeLines = edgesStr.split("\n").filter(l => l.trim().length > 0);
    edgeLines.forEach(line => {
        const data = parseEdgeLine(line);
        if (data) {
            const sourceId = findNodeIdByLabel(data.src, nameToId);
            const targetId = findNodeIdByLabel(data.dst, nameToId);

            if (sourceId && targetId) {
                renderer.createEdge(sourceId, targetId, data.val);
            }
        }
    });

    // 3. Auto-Layout
    import('./layout.js').then(layout => {
        layout.applyCompactLayout();
    });
}

/**
 * Flexible Regex parser for edge lines (src dst val).
 */
function parseEdgeLine(line) {
    const regex = /^([\w\d]+)[\s,;:>-]+([\w\d]+)[\s,;:=-]+([\d/.]+)/;
    const match = line.trim().match(regex);
    
    if (match) {
        return {
            src: match[1],
            dst: match[2],
            val: match[3].includes('/') ? match[3] : parseFloat(match[3])
        };
    }
    return null;
}

/**
 * Helper to find node ID by label, or create it if missing.
 */
function findNodeIdByLabel(label, nameToIdMap) {
    if (nameToIdMap.has(label)) return nameToIdMap.get(label);
    
    const node = renderer.createNode(0, 0, null, label.substring(0, 2));
    interactions.attachNodeListeners(node);
    nameToIdMap.set(label, node.id);
    return node.id;
}

/**
 * Import graph from json file.
 * @param {File} file 
 */
export function importGraph(file) {
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
        try {
            const data = JSON.parse(e.target.result);
            
            // Validate schema and data integrity before loading
            validateGraphData(data);

            loadGraphData(data);
        } catch (err) {
            console.error("Import error:", err);
            alert("File loading error: " + err.message);
        }
    };
    reader.readAsText(file);
}

/**
 * Validates graph structure, referential integrity, and data types.
 * Throws an Error with a specific message if validation fails.
 */
function validateGraphData(data) {
    if (!data || typeof data !== 'object') throw new Error("Invalid JSON format");
    if (!Array.isArray(data.nodes)) throw new Error("Missing or invalid 'nodes' array");
    if (!Array.isArray(data.edges)) throw new Error("Missing or invalid 'edges' array");

    const nodeIds = new Set();

    // Validate Nodes
    data.nodes.forEach((n, index) => {
        if (!n.id) throw new Error(`Node at index ${index} is missing an ID`);
        if (nodeIds.has(n.id)) throw new Error(`Duplicate node ID found: ${n.id}`);
        
        // Ensure coordinates are numbers or convertible to numbers
        if (n.x !== undefined && typeof n.x !== 'number') {
            const parsedX = parseFloat(n.x);
            if (isNaN(parsedX)) throw new Error(`Node ${n.id} has invalid X coordinate: ${n.x}`);
            n.x = parsedX;
        }
        if (n.y !== undefined && typeof n.y !== 'number') {
            const parsedY = parseFloat(n.y);
            if (isNaN(parsedY)) throw new Error(`Node ${n.id} has invalid Y coordinate: ${n.y}`);
            n.y = parsedY;
        }
        
        nodeIds.add(n.id);
    });

    // Validate Edges
    data.edges.forEach((e, index) => {
        if (!e.source || !e.target) throw new Error(`Edge at index ${index} is missing source or target`);
        if (!nodeIds.has(e.source)) throw new Error(`Edge at index ${index} references non-existent source: ${e.source}`);
        if (!nodeIds.has(e.target)) throw new Error(`Edge at index ${index} references non-existent target: ${e.target}`);
        
        // Ensure weight/capacity is a valid number
        if (e.weight !== undefined && typeof e.weight !== 'number') {
            const parsedW = parseFloat(e.weight);
            if (isNaN(parsedW)) throw new Error(`Edge ${e.source}->${e.target} has invalid weight: ${e.weight}`);
            e.weight = parsedW;
        }
    });
}

/**
 * Build graph from serialized data
 */
export function loadGraphData(data) {
    renderer.clearGraph();

    let missingCoords = false;

    // Import elements
    data.nodes.forEach(n => {
        if (n.x === undefined || n.y === undefined) {
            missingCoords = true;
        }
        const node = renderer.createNode(n.x || 0, n.y || 0, n.id, n.userLabel || null);
        interactions.attachNodeListeners(node);
    });
    data.edges.forEach(e => {
        renderer.createEdge(e.source, e.target, e.weight || 1, e.id || null);
    });

    // Update ID counters
    syncIdCounters(data.nodes, data.edges);

    if (missingCoords) {
        import('./layout.js').then(layout => {
            layout.applyCompactLayout();
        });
    }

    console.log("Import successful");
}

/**
 * Utility functions to sync global ID counters of imported elements.
 */
function syncIdCounters(nodes, edges) {
    // Extract numbers from ID
    const nodeIds = nodes.map(n => {
        const match = n.id.match(/\d+/);
        return match ? parseInt(match[0], 10) : 0;
    });

    const edgeIds = edges.map(e => {
        if (!e.id) return 0;
        const match = e.id.match(/\d+/);
        return match ? parseInt(match[0], 10) : 0;
    });

    const maxNodeId = nodeIds.length > 0 ? Math.max(...nodeIds) : 0;
    const maxEdgeId = edgeIds.length > 0 ? Math.max(...edgeIds) : 0;

    // Update counters
    state.nodeIdCounter = maxNodeId + 1;
    state.edgeIdCounter = maxEdgeId + 1;
}