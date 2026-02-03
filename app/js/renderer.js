import { NODE_RADIUS } from './config.js';
import { state } from './state.js';
import { nodesLayer, edgesLayer, dragLayer } from './dom.js';
import * as ui from './ui.js';

const NS = "http://www.w3.org/2000/svg";

export function createNode(x, y) {
    const circle = document.createElementNS(NS, "circle");
    const nodeIndex = state.nodeIdCounter;
    const id = `node-${state.nodeIdCounter++}`;
    const userLabelText = nodeIndex.toString();

    circle.setAttribute("cx", x);
    circle.setAttribute("cy", y);
    circle.setAttribute("r", NODE_RADIUS);
    circle.setAttribute("class", "node");
    circle.setAttribute("id", id);

    // Etichetta Utente (Centro del nodo)
    const label = document.createElementNS(NS, "text");
    label.setAttribute("x", x);
    label.setAttribute("y", y);
    label.setAttribute("class", "node-label");
    label.textContent = userLabelText;

    // Etichetta Algoritmo (Sopra il nodo)
    const algLabel = document.createElementNS(NS, "text");
    algLabel.setAttribute("x", x);
    algLabel.setAttribute("y", y - NODE_RADIUS - 5);
    algLabel.setAttribute("class", "node-alg-label");
    algLabel.setAttribute("text-anchor", "middle");
    algLabel.style.fill = "#e67e22";
    algLabel.style.fontSize = "12px";
    algLabel.style.fontWeight = "bold";
    algLabel.style.pointerEvents = "none";
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
    return nodeData;
}

export function createEdge(sourceId, targetId, opts = {}) {
    const DEFAULT_VALUE = 1;
    const weight = opts.weight ?? DEFAULT_VALUE;
    const capacity = opts.capacity ?? DEFAULT_VALUE;
    const flow = opts.flow ?? 0;

    if (sourceId === targetId) return;
    const exists = state.edges.some(e => e.source === sourceId && e.target === targetId);
    if (exists) return;

    const sourceNode = state.nodes.find(n => n.id === sourceId);
    const targetNode = state.nodes.find(n => n.id === targetId);
    if (!sourceNode || !targetNode) return;

    const edgeId = `edge-${sourceId}-${targetId}`;
    
    // Gruppo per l'arco e la sua etichetta
    const group = document.createElementNS(NS, "g");
    group.setAttribute("id", `group-${edgeId}`);

    const line = document.createElementNS(NS, "line");
    line.setAttribute("class", "edge");
    line.setAttribute("marker-end", "url(#arrowhead)");
    line.setAttribute("id", edgeId);

    const hitArea = document.createElementNS(NS, "line");
    hitArea.setAttribute("class", "edge-hitarea");
    hitArea.setAttribute("data-edge-id", edgeId);

    // Testo del peso/flusso
    const text = document.createElementNS(NS, "text");
    text.setAttribute("class", "edge-label");
    text.setAttribute("text-anchor", "middle");
    text.style.fontSize = "12px";
    text.style.fill = "#2c3e50";
    text.style.pointerEvents = "none";

    group.appendChild(line);
    group.appendChild(hitArea);
    group.appendChild(text);
    edgesLayer.appendChild(group);

    const edgeData = { 
        source: sourceId, 
        target: targetId, 
        el: line, 
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
    updateEdgeGeometry(edgeData);
    updateEdgeVisuals(edgeData);

    hitArea.addEventListener('mouseenter', () => line.classList.add('hover'));
    hitArea.addEventListener('mouseleave', () => line.classList.remove('hover'));
    hitArea.addEventListener('click', (e) => {
        if (state.currentMode === null && !state.isAlgorithmRunning) {
            e.stopPropagation();
            ui.showFloatingPanel(e.clientX, e.clientY, 'edge', edgeId);
        }
    });

    return edgeId;
}

export function updateEdgeGeometry(edge) {
    const sourceNode = state.nodes.find(n => n.id === edge.source);
    const targetNode = state.nodes.find(n => n.id === edge.target);
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

    [edge.el, edge.hitArea].forEach(el => {
        el.setAttribute("x1", x1);
        el.setAttribute("y1", y1);
        el.setAttribute("x2", x2);
        el.setAttribute("y2", y2);
    });

    // Posiziona il testo a metà arco, leggermente spostato
    const midX = (x1 + x2) / 2;
    const midY = (y1 + y2) / 2;
    edge.labelEl.setAttribute("x", midX);
    edge.labelEl.setAttribute("y", midY - 8);
}

export function updateEdgeVisuals(edge) {
    const isFlowMode = state.isAlgorithmRunning; // Semplificazione per ora
    
    if (edge.isSaturated) {
        edge.el.style.stroke = "#e74c3c";
        edge.el.style.strokeWidth = "4px";
        edge.labelEl.textContent = "";
    } else {
        edge.el.style.stroke = ""; // reset to CSS
        edge.el.style.strokeWidth = "";
        edge.labelEl.textContent = edge.flow > 0 || isFlowMode ? `${edge.flow}/${edge.capacity}` : `${edge.weight}`;
    }
}

export function updateEdgesForNode(nodeId) {
    state.edges.forEach(edge => {
        if (edge.source === nodeId || edge.target === nodeId) {
            updateEdgeGeometry(edge);
        }
    });
}

export function updateNodeVisuals(node) {
    node.labelEl.textContent = node.userLabel;
    node.algLabelEl.textContent = node.algLabel;
}
