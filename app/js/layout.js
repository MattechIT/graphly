import { state } from './state.js';
import * as renderer from './renderer.js';
import { svgCanvas } from './dom.js';

/**
 * Layered Layout: Arranges nodes in columns.
 * Forces distribution across multiple levels based on connection structure (Sugiyama's Framework 1981).
 */
export function applyLayeredLayout() {
    if (state.nodes.length === 0) return;

    const rect = svgCanvas.getBoundingClientRect();
    const width = rect.width || 800;
    const height = rect.height || 600;
    const padding = 100;

    // 1. Calculate In-Degree to find roots
    const inDegree = {};
    state.nodes.forEach(n => inDegree[n.id] = 0);
    state.edges.forEach(e => {
        if (inDegree[e.target] !== undefined) inDegree[e.target]++;
    });

    // 2. Level Assignment (Simplified Longest Path Algorithm)
    const nodeLevels = {};
    state.nodes.forEach(n => nodeLevels[n.id] = 0);

    // Iterate multiple times to push nodes "forward" using a limit based on node count to avoid infinite loops in case of cycles
    for (let i = 0; i < state.nodes.length; i++) {
        let changed = false;
        state.edges.forEach(edge => {
            // If source is at the same level or beyond the target, push target forward
            if (nodeLevels[edge.target] <= nodeLevels[edge.source]) {
                nodeLevels[edge.target] = nodeLevels[edge.source] + 1;
                changed = true;
            }
        });
        if (!changed) break;
    }

    // 3. Group nodes by level
    const levels = {};
    state.nodes.forEach(node => {
        const lv = nodeLevels[node.id];
        if (!levels[lv]) levels[lv] = [];
        levels[lv].push(node.id);
    });

    const levelKeys = Object.keys(levels).sort((a, b) => a - b);
    const numLevels = levelKeys.length;

    // 4. Physical Positioning
    const colWidth = (width - 2 * padding) / Math.max(1, numLevels - 1);

    levelKeys.forEach((lvKey, colIndex) => {
        const nodesInLevel = levels[lvKey];
        const x = padding + colIndex * colWidth;

        nodesInLevel.forEach((nodeId, rowIndex) => {
            const node = state.nodes.find(n => n.id === nodeId);
            const y = (height / (nodesInLevel.length + 1)) * (rowIndex + 1);
            updateNodePos(node, x, y);
        });
    });

    finalizeLayout();
}

/**
 * Compact Layout (Diamond): Groups nodes in a diamond pattern.
 * Col 1: Node (Center)
 * Col 2: Nodes (Top + Bottom)
 * Col 3: Node (Center)
 */
export function applyCompactLayout() {
    if (state.nodes.length === 0) return;

    const rect = svgCanvas.getBoundingClientRect();
    const width = rect.width || 800;
    const height = rect.height || 600;
    const padding = 100;

    // Sort nodes by numerical ID
    const sortedNodes = [...state.nodes].sort((a, b) => {
        const numA = parseInt(a.id.match(/\d+/)?.[0] || 0);
        const numB = parseInt(b.id.match(/\d+/)?.[0] || 0);
        return numA - numB;
    });

    // Group nodes: the first goes alone, then in pairs, then alone...
    const columns = [];
    let i = 0;
    while (i < sortedNodes.length) {
        // Column with 1 node
        columns.push([sortedNodes[i++]]);
        // Column with 2 nodes (if remaining)
        if (i < sortedNodes.length) {
            const pair = [sortedNodes[i++]];
            if (i < sortedNodes.length) pair.push(sortedNodes[i++]);
            columns.push(pair);
        }
    }

    const numCols = columns.length;
    const colSpacing = (width - 2 * padding) / Math.max(1, numCols - 1);

    const yTop = height * 0.25;
    const yCenter = height * 0.5;
    const yBottom = height * 0.75;

    // 2. Positioning on the 3 lanes
    columns.forEach((colNodes, colIndex) => {
        const x = padding + colIndex * colSpacing;
        
        if (colNodes.length === 1) {
            updateNodePos(colNodes[0], x, yCenter);
        } else if (colNodes.length === 2) {
            updateNodePos(colNodes[0], x, yTop);
            updateNodePos(colNodes[1], x, yBottom);
        }
    });

    finalizeLayout();
}

/**
 * Circular Layout
 */
export function applyCircleLayout() {
    if (state.nodes.length === 0) return;
    const rect = svgCanvas.getBoundingClientRect();
    const centerX = (rect.width || 800) / 2;
    const centerY = (rect.height || 600) / 2;
    const radius = Math.min(centerX, centerY) * 0.8;

    state.nodes.forEach((node, i) => {
        const angle = (i / state.nodes.length) * 2 * Math.PI;
        const x = centerX + radius * Math.cos(angle);
        const y = centerY + radius * Math.sin(angle);
        updateNodePos(node, x, y);
    });
    finalizeLayout();
}

/**
 * Grid Layout
 */
export function applyGridLayout() {
    if (state.nodes.length === 0) return;
    const rect = svgCanvas.getBoundingClientRect();
    const width = rect.width || 800;
    const height = rect.height || 600;
    const padding = 80;

    const cols = Math.ceil(Math.sqrt(state.nodes.length));
    const cellW = (width - 2 * padding) / Math.max(1, cols - 1);
    const cellH = (height - 2 * padding) / Math.max(1, Math.ceil(state.nodes.length / cols) - 1);

    state.nodes.forEach((node, i) => {
        const x = padding + (i % cols) * cellW;
        const y = padding + Math.floor(i / cols) * cellH;
        updateNodePos(node, x, y);
    });
    finalizeLayout();
}

/**
 * Fits the entire graph into the current canvas view, scaling it down if necessary.
 */
export function centerGraph() {
    if (state.nodes.length === 0) return;

    const rect = svgCanvas.getBoundingClientRect();
    const canvasWidth = rect.width;
    const canvasHeight = rect.height;
    const padding = 60;

    if (canvasWidth <= 0 || canvasHeight <= 0) return;

    // 1. Calculate current graph boundaries
    let minX = Infinity, maxX = -Infinity;
    let minY = Infinity, maxY = -Infinity;

    state.nodes.forEach(n => {
        minX = Math.min(minX, n.x);
        maxX = Math.max(maxX, n.x);
        minY = Math.min(minY, n.y);
        maxY = Math.max(maxY, n.y);
    });

    let graphWidth = maxX - minX;
    let graphHeight = maxY - minY;
    
    // Prevent division by zero for single nodes
    if (graphWidth === 0) graphWidth = 1;
    if (graphHeight === 0) graphHeight = 1;

    // 2. Calculate scale factor to fit
    const availableWidth = canvasWidth - 2 * padding;
    const availableHeight = canvasHeight - 2 * padding;

    // We only scale down if the graph is larger than the available space
    const scaleX = availableWidth / graphWidth;
    const scaleY = availableHeight / graphHeight;
    const scale = Math.min(scaleX, scaleY, 1.0); // Never scale up (>1.0), only down

    // 3. Calculate target center
    const graphCenterX = minX + graphWidth / 2;
    const graphCenterY = minY + graphHeight / 2;
    const targetCenterX = canvasWidth / 2;
    const targetCenterY = canvasHeight / 2;

    // 4. Apply transformation: (pos - center) * scale + targetCenter
    state.nodes.forEach(n => {
        const newX = targetCenterX + (n.x - graphCenterX) * scale;
        const newY = targetCenterY + (n.y - graphCenterY) * scale;
        updateNodePos(n, newX, newY);
    });

    finalizeLayout();
}

/**
 * Utility to update position and DOM
 */
function updateNodePos(node, x, y) {
    node.x = x;
    node.y = y;
    node.el.setAttribute("cx", x);
    node.el.setAttribute("cy", y);
    if (node.labelEl) {
        node.labelEl.setAttribute("x", x);
        node.labelEl.setAttribute("y", y);
    }
    if (node.algLabelEl) {
        node.algLabelEl.setAttribute("x", x);
        node.algLabelEl.setAttribute("y", y - 25);
    }
}

function finalizeLayout() {
    state.edges.forEach(edge => renderer.updateEdgeGeometry(edge));
}
