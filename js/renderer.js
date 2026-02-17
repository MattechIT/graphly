import { NODE_RADIUS, LABEL_MAX_LENGTH } from './config.js';
import { state } from './state.js';
import { nodesLayer, edgesLayer, dragLayer } from './dom.js';
import { calculateEdgeGeometry } from './geometry.js';
import * as ui from './ui.js';

const NS = "http://www.w3.org/2000/svg";

/**
 * Completely clears the graph from the DOM and resets the state.
 */
export function clearGraph() {
    while (nodesLayer.firstChild) nodesLayer.removeChild(nodesLayer.firstChild);
    while (edgesLayer.firstChild) edgesLayer.removeChild(edgesLayer.firstChild);
    while (dragLayer.firstChild) dragLayer.removeChild(dragLayer.firstChild);

    state.nodes = [];
    state.edges = [];
}

/**
 * Creates a new node element and adds it to the DOM and state.
 */
export function createNode(x = 0, y = 0, forcedId = null, forcedLabel = null) {
    const circle = document.createElementNS(NS, "circle");

    const id = forcedId || `node-${state.nodeIdCounter++}`;
    const defaultLabel = forcedId ? (forcedId.includes('-') ? forcedId.split('-')[1] : forcedId) : (state.nodeIdCounter - 1).toString();
    const userLabelText = (forcedLabel || defaultLabel).substring(0, LABEL_MAX_LENGTH);

    circle.setAttribute("cx", x);
    circle.setAttribute("cy", y);
    circle.setAttribute("r", NODE_RADIUS);
    circle.setAttribute("class", "node");
    circle.setAttribute("id", id);

    const label = document.createElementNS(NS, "text");
    label.setAttribute("x", x);
    label.setAttribute("y", y);
    label.setAttribute("class", "node-label");
    label.textContent = userLabelText;

    const algLabel = document.createElementNS(NS, "text");
    algLabel.setAttribute("x", x);
    algLabel.setAttribute("y", y - NODE_RADIUS - 5);
    algLabel.setAttribute("class", "node-alg-label");
    algLabel.setAttribute("text-anchor", "middle");
    algLabel.setAttribute("pointer-events", "none");
    algLabel.textContent = "";

    nodesLayer.appendChild(circle);
    nodesLayer.appendChild(label);
    nodesLayer.appendChild(algLabel);

    const nodeData = { 
        id, x, y, el: circle, 
        labelEl: label, 
        algLabelEl: algLabel,
        userLabel: userLabelText,
        algLabel: ""
    };
    state.nodes.push(nodeData);
    updateNodeVisuals(nodeData);
    return nodeData;
}

/**
 * Creates a new edge element between two nodes.
 */
export function createEdge(sourceId, targetId, forcedWeight = null, forcedId = null) {
    const weight = forcedWeight ?? 1;
    const capacity = weight;
    const flow = 0;

    if (sourceId === targetId) return;
    const exists = state.edges.some(e => e.source === sourceId && e.target === targetId);
    if (exists) return;

    const sourceNode = state.nodes.find(n => n.id === sourceId);
    const targetNode = state.nodes.find(n => n.id === targetId);
    if (!sourceNode || !targetNode) return;

    const edgeId = forcedId || `edge-${sourceId}-${targetId}`;
    
    const group = document.createElementNS(NS, "g");
    group.setAttribute("id", `group-${edgeId}`);

    const path = document.createElementNS(NS, "path");
    path.setAttribute("class", "edge");
    path.setAttribute("marker-end", "url(#arrowhead)");
    path.setAttribute("id", edgeId);
    path.setAttribute("fill", "none");

    const hitArea = document.createElementNS(NS, "path");
    hitArea.setAttribute("class", "edge-hitarea");
    hitArea.setAttribute("data-edge-id", edgeId);
    hitArea.setAttribute("fill", "none");

    const text = document.createElementNS(NS, "text");
    text.setAttribute("class", "edge-label");

    group.appendChild(path);
    group.appendChild(hitArea);
    group.appendChild(text);
    edgesLayer.appendChild(group);

    const edgeData = { 
        source: sourceId, 
        target: targetId, 
        el: path, 
        hitArea, 
        labelEl: text,
        groupEl: group,
        id: edgeId, 
        weight, 
        capacity,
        flow,
        isSaturated: false
    };

    state.edges.push(edgeData);
    
    // Auto-curve reverse edges
    const reverseEdge = state.edges.find(e => e.source === targetId && e.target === sourceId);
    updateEdgeGeometry(edgeData);
    if (reverseEdge) updateEdgeGeometry(reverseEdge);
    
    updateEdgeVisuals(edgeData);

    hitArea.addEventListener('mouseenter', () => path.classList.add('hover'));
    hitArea.addEventListener('mouseleave', () => path.classList.remove('hover'));
    hitArea.addEventListener('click', (e) => {
        if (state.currentMode === null && !state.isAlgorithmRunning) {
            e.stopPropagation();
            ui.showFloatingPanel(e.clientX, e.clientY, 'edge', edgeId);
        }
    });

    return edgeId;
}

/**
 * Updates the physical path and label position of an edge.
 */
export function updateEdgeGeometry(edge) {
    const sourceNode = state.nodes.find(n => n.id === edge.source);
    const targetNode = state.nodes.find(n => n.id === edge.target);
    if (!sourceNode || !targetNode) return;

    const hasReverse = state.edges.some(e => e.source === edge.target && e.target === edge.source);
    const geo = calculateEdgeGeometry(sourceNode, targetNode, hasReverse);
    
    if (!geo) return;

    edge.el.setAttribute("d", geo.d);
    edge.hitArea.setAttribute("d", geo.d);
    edge.labelEl.setAttribute("x", geo.labelX);
    edge.labelEl.setAttribute("y", geo.labelY);
}

/**
 * Updates the visual properties (labels, markers, saturation) of an edge.
 */
export function updateEdgeVisuals(edge) {
    const isFlowMode = state.isAlgorithmRunning; 
    const isUndirected = state.isAlgorithmRunning && state.selectedAlgorithm?.graphType === "undirected";
    
    if (isUndirected) {
        edge.el.removeAttribute("marker-end");
    } else {
        edge.el.setAttribute("marker-end", "url(#arrowhead)");
    }

    if (edge.isSaturated) {
        edge.el.dataset.isSaturated = "true";
        edge.labelEl.textContent = "";
    } else {
        delete edge.el.dataset.isSaturated;
        edge.labelEl.textContent = edge.flow > 0 || isFlowMode ? `${edge.flow}/${edge.capacity}` : `${edge.weight}`;
    }
}

/**
 * Updates all edges connected to a specific node.
 */
export function updateEdgesForNode(nodeId) {
    state.edges.forEach(edge => {
        if (edge.source === nodeId || edge.target === nodeId) {
            updateEdgeGeometry(edge);
        }
    });
}

/**
 * Synchronizes the node DOM with current state values.
 * Includes dynamic font-size calculation to fit text inside the node.
 */
export function updateNodeVisuals(node) {
    node.labelEl.textContent = node.userLabel;
    node.algLabelEl.textContent = node.algLabel;

    // Dynamic Font Sizing (using default size to measure correctly)
    const padding = 4;
    const maxWidth = (NODE_RADIUS * 2) - padding;
    node.labelEl.style.fontSize = "14px";
    
    const bbox = node.labelEl.getBBox();
    if (bbox.width > maxWidth) {
        const newSize = Math.floor(14 * (maxWidth / bbox.width));
        node.labelEl.style.fontSize = `${newSize}px`;
    }
}

/**
 * Forces a visual refresh of all edges in the graph.
 */
export function refreshAllEdgesVisuals() {
    state.edges.forEach(edge => updateEdgeVisuals(edge));
}

/**
 * Removes an edge from the DOM and state.
 */
export function removeEdge(edgeId) {
    const idx = state.edges.findIndex(e => e.id === edgeId);
    if (idx === -1) return;
    const edge = state.edges[idx];
    if (edge.groupEl) edge.groupEl.remove();
    state.edges.splice(idx, 1);
}

/**
 * Removes a node and all its connected edges.
 */
export function removeNode(nodeId) {
    const idx = state.nodes.findIndex(n => n.id === nodeId);
    if (idx === -1) return;
    const node = state.nodes[idx];
    
    const toRemove = state.edges.filter(e => e.source === nodeId || e.target === nodeId);
    toRemove.forEach(e => removeEdge(e.id));
    
    if (node.el) node.el.remove();
    if (node.labelEl) node.labelEl.remove();
    if (node.algLabelEl) node.algLabelEl.remove();
    
    state.nodes.splice(idx, 1);
}