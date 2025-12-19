import { NODE_RADIUS } from './config.js';
import { state } from './state.js';
import { nodesLayer, edgesLayer, dragLayer } from './dom.js';
import * as ui from './ui.js';

const NS = "http://www.w3.org/2000/svg";

export function createNode(x, y) {
    const circle = document.createElementNS(NS, "circle");
    const nodeNumber = state.nodeIdCounter;
    const id = `node-${state.nodeIdCounter++}`;

    circle.setAttribute("cx", x);
    circle.setAttribute("cy", y);
    circle.setAttribute("r", NODE_RADIUS);
    circle.setAttribute("class", "node");
    circle.setAttribute("id", id);

    const label = document.createElementNS(NS, "text");
    label.setAttribute("x", x);
    label.setAttribute("y", y);
    label.setAttribute("class", "node-label");
    label.textContent = nodeNumber;

    nodesLayer.appendChild(circle);
    nodesLayer.appendChild(label);

    const nodeData = { id, x, y, el: circle, label };
    state.nodes.push(nodeData);
    return nodeData;
}

export function createEdge(sourceId, targetId, opts = {}) {
    // opts: { weight?, capacity? }
    // Default: same numeric value for both weight and capacity
    const DEFAULT_EDGE_VALUE = 1; // unit graph: weight=1, capacity=1
    const weight = opts.weight ?? DEFAULT_EDGE_VALUE;
    const capacity = opts.capacity ?? DEFAULT_EDGE_VALUE;

    if (sourceId === targetId) return;
    const exists = state.edges.some(e => e.source === sourceId && e.target === targetId);
    if (exists) return;

    const sourceNode = state.nodes.find(n => n.id === sourceId);
    const targetNode = state.nodes.find(n => n.id === targetId);
    if (!sourceNode || !targetNode) return;

    const dx = targetNode.x - sourceNode.x;
    const dy = targetNode.y - sourceNode.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    if (dist === 0) return;
    const ux = dx / dist, uy = dy / dist;

    const x1 = sourceNode.x + ux * NODE_RADIUS;
    const y1 = sourceNode.y + uy * NODE_RADIUS;
    const x2 = targetNode.x - ux * NODE_RADIUS;
    const y2 = targetNode.y - uy * NODE_RADIUS;

    const line = document.createElementNS(NS, "line");
    line.setAttribute("x1", x1);
    line.setAttribute("y1", y1);
    line.setAttribute("x2", x2);
    line.setAttribute("y2", y2);
    line.setAttribute("class", "edge");
    line.setAttribute("marker-end", "url(#arrowhead)");

    const edgeId = `edge-${sourceId}-${targetId}`;
    line.setAttribute("id", edgeId);

    const hitArea = document.createElementNS(NS, "line");
    hitArea.setAttribute("x1", x1);
    hitArea.setAttribute("y1", y1);
    hitArea.setAttribute("x2", x2);
    hitArea.setAttribute("y2", y2);
    hitArea.setAttribute("class", "edge-hitarea");
    hitArea.setAttribute("data-edge-id", edgeId);

    hitArea.addEventListener('mouseenter', () => line.classList.add('hover'));
    hitArea.addEventListener('mouseleave', () => line.classList.remove('hover'));
    hitArea.addEventListener('click', (e) => {
        if (state.currentMode === null) {
            e.stopPropagation();
            ui.showFloatingPanel(e.clientX, e.clientY, 'edge', edgeId);
        }
    });

    edgesLayer.appendChild(line);
    edgesLayer.appendChild(hitArea);

    state.edges.push({ source: sourceId, target: targetId, el: line, hitArea, id: edgeId, weight, capacity });
    return edgeId;
}

export function updateEdgesForNode(nodeId) {
    // Aggiorna tutte le linee dopo lo spostamento di un nodo
    state.edges.forEach(edge => {
        const sourceNode = state.nodes.find(n => n.id === edge.source);
        const targetNode = state.nodes.find(n => n.id === edge.target);
        if (!sourceNode || !targetNode) return;

        const dx = targetNode.x - sourceNode.x;
        const dy = targetNode.y - sourceNode.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist === 0) return;
        const ux = dx / dist;
        const uy = dy / dist;

        const x1 = sourceNode.x + ux * NODE_RADIUS;
        const y1 = sourceNode.y + uy * NODE_RADIUS;
        const x2 = targetNode.x - ux * NODE_RADIUS;
        const y2 = targetNode.y - uy * NODE_RADIUS;

        edge.el.setAttribute("x1", x1);
        edge.el.setAttribute("y1", y1);
        edge.el.setAttribute("x2", x2);
        edge.el.setAttribute("y2", y2);

        if (edge.hitArea) {
            edge.hitArea.setAttribute("x1", x1);
            edge.hitArea.setAttribute("y1", y1);
            edge.hitArea.setAttribute("x2", x2);
            edge.hitArea.setAttribute("y2", y2);
        }
    });
}
