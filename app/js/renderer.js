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

    const path = document.createElementNS(NS, "path");
    path.setAttribute("class", "edge");
    path.setAttribute("marker-end", "url(#arrowhead)");
    path.setAttribute("id", edgeId);
    path.setAttribute("fill", "none"); // Importante per i path

    const hitArea = document.createElementNS(NS, "path");
    hitArea.setAttribute("class", "edge-hitarea");
    hitArea.setAttribute("data-edge-id", edgeId);
    hitArea.setAttribute("fill", "none");

    // Testo del peso/flusso
    const text = document.createElementNS(NS, "text");
    text.setAttribute("class", "edge-label");
    // Gli attributi di stile ora sono gestiti dal CSS (.edge-label)

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
    
    // Aggiorniamo la geometria di ENTRAMBI gli archi se esiste una connessione inversa
    // per assicurarci che si curvino subito
    const reverseEdge = state.edges.find(e => e.source === targetId && e.target === sourceId);
    
    updateEdgeGeometry(edgeData);
    if (reverseEdge) {
        updateEdgeGeometry(reverseEdge);
    }
    
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

export function updateEdgeGeometry(edge) {
    const sourceNode = state.nodes.find(n => n.id === edge.source);
    const targetNode = state.nodes.find(n => n.id === edge.target);
    if (!sourceNode || !targetNode) return;

    // Controlla se esiste un arco inverso
    const hasReverse = state.edges.some(e => e.source === edge.target && e.target === edge.source);

    const dx = targetNode.x - sourceNode.x;
    const dy = targetNode.y - sourceNode.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    
    if (dist === 0) return;

    // Vettori unitari
    const ux = dx / dist;
    const uy = dy / dist;
    
    // Vettore perpendicolare (normalizzato) per la curvatura
    // (-uy, ux) ruota di 90 gradi
    const perpX = -uy;
    const perpY = ux;

    // Calcolo punti di partenza e arrivo sul bordo dei nodi
    const startX = sourceNode.x + ux * NODE_RADIUS;
    const startY = sourceNode.y + uy * NODE_RADIUS;
    const endX = targetNode.x - ux * NODE_RADIUS;
    const endY = targetNode.y - uy * NODE_RADIUS;

    let dString = "";
    let labelX, labelY;

    if (hasReverse) {
        // Curvatura quadratica di Bézier
        // Offset determina quanto "spancia" l'arco. 
        // 40 è un valore arbitrario che funziona bene visivamente
        const offset = 40; 
        
        // Punto di controllo: punto medio + spostamento perpendicolare
        const midX = (startX + endX) / 2;
        const midY = (startY + endY) / 2;
        
        const ctrlX = midX + perpX * offset;
        const ctrlY = midY + perpY * offset;

        dString = `M ${startX} ${startY} Q ${ctrlX} ${ctrlY} ${endX} ${endY}`;

        // Posizione etichetta: a metà della curva (approx al punto di controllo intermedio)
        // La formula esatta per t=0.5 su una curva quadratica è: 
        // B(t) = (1-t)^2 * P0 + 2(1-t)t * P1 + t^2 * P2
        // Per t=0.5: 0.25*P0 + 0.5*P1 + 0.25*P2
        labelX = 0.25 * startX + 0.5 * ctrlX + 0.25 * endX;
        labelY = 0.25 * startY + 0.5 * ctrlY + 0.25 * endY;
        
        // Spostiamo leggermente l'etichetta ancora più "fuori" per non toccare la linea
        labelX += perpX * 10;
        labelY += perpY * 10;

    } else {
        // Linea retta semplice
        dString = `M ${startX} ${startY} L ${endX} ${endY}`;
        
        // Etichetta nel punto medio preciso
        labelX = (startX + endX) / 2;
        labelY = (startY + endY) / 2;
        
        // Spostamento standard verso l'alto (perpendicolare negativo) per non coprire la linea
        // Usiamo il vettore perpendicolare per mantenere la distanza costante indipendentemente dall'angolo
        labelX += perpX * 15;
        labelY += perpY * 15;
    }

    // Applica il path
    edge.el.setAttribute("d", dString);
    edge.hitArea.setAttribute("d", dString);

    // Applica posizione etichetta
    edge.labelEl.setAttribute("x", labelX);
    edge.labelEl.setAttribute("y", labelY);
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

export function refreshAllEdgesVisuals() {
    state.edges.forEach(edge => updateEdgeVisuals(edge));
}

export function removeEdge(edgeId) {
    const edgeIndex = state.edges.findIndex(e => e.id === edgeId);
    if (edgeIndex === -1) return;
    
    const edge = state.edges[edgeIndex];
    
    // Remove from DOM
    if (edge.groupEl) edge.groupEl.remove();
    else {
        // Fallback for old structure if any
        if (edge.el) edge.el.remove();
        if (edge.hitArea) edge.hitArea.remove();
    }
    
    // Remove from State
    state.edges.splice(edgeIndex, 1);
}

export function removeNode(nodeId) {
    const nodeIndex = state.nodes.findIndex(n => n.id === nodeId);
    if (nodeIndex === -1) return;
    
    const node = state.nodes[nodeIndex];
    
    // Remove connected edges first
    const edgesToRemove = state.edges.filter(e => e.source === nodeId || e.target === nodeId);
    edgesToRemove.forEach(e => removeEdge(e.id));
    
    // Remove Node from DOM
    if (node.el) node.el.remove();
    if (node.labelEl) node.labelEl.remove();
    if (node.algLabelEl) node.algLabelEl.remove();
    
    // Remove from State
    state.nodes.splice(nodeIndex, 1);
}
