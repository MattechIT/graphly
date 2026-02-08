import { state } from './state.js';
import { getMousePosition, svgCanvas, dragLayer } from './dom.js';
import * as renderer from './renderer.js';
import * as ui from './ui.js';

// Inizializza gli handler globali e le funzioni di attach per i nodi
export function init() {
    // Click sullo sfondo per creare nodo (se in modalità addNode)
    const handleBgStart = (e) => {
        if (e.target.id === 'svg-canvas' && state.currentMode === 'addNode') {
            const pos = getMousePosition(e);
            const node = renderer.createNode(pos.x, pos.y);
            attachNodeListeners(node);
        }
    };

    svgCanvas.addEventListener('mousedown', handleBgStart);
    svgCanvas.addEventListener('touchstart', (e) => {
        handleBgStart(e);
        // Preveniamo lo scrolling della pagina quando si tocca l'area del grafo
        if (state.currentMode) e.preventDefault();
    }, { passive: false });

    // Move globale
    const handleMove = (e) => {
        const pos = getMousePosition(e);

        if (state.isDraggingEdge && state.tempEdgeLine) {
            state.tempEdgeLine.setAttribute('x2', pos.x);
            state.tempEdgeLine.setAttribute('y2', pos.y);
            
            if (e.touches) {
                const target = document.elementFromPoint(e.touches[0].clientX, e.touches[0].clientY);
                updateTouchTarget(target);
            }
        } else if (state.draggedNodeData && state.currentMode === null) {
            if (e.touches) e.preventDefault(); // Blocca scroll durante drag nodo
            state.draggedNodeData.x = pos.x;
            state.draggedNodeData.y = pos.y;
            state.draggedNodeData.el.setAttribute('cx', pos.x);
            state.draggedNodeData.el.setAttribute('cy', pos.y);
            
            if (state.draggedNodeData.labelEl) {
                state.draggedNodeData.labelEl.setAttribute('x', pos.x);
                state.draggedNodeData.labelEl.setAttribute('y', pos.y);
            }
            if (state.draggedNodeData.algLabelEl) {
                state.draggedNodeData.algLabelEl.setAttribute('x', pos.x);
                state.draggedNodeData.algLabelEl.setAttribute('y', pos.y - 25);
            }
            renderer.updateEdgesForNode(state.draggedNodeData.id);
        }
    };

    window.addEventListener('mousemove', handleMove);
    window.addEventListener('touchmove', handleMove, { passive: false });

    // Up globale
    const handleEnd = (e) => {
        if (state.isDraggingEdge) {
            if (state.hoveredTargetNodeDOM && state.hoveredTargetNodeDOM !== state.edgeStartNodeDOM) {
                renderer.createEdge(state.edgeStartNodeDOM.id, state.hoveredTargetNodeDOM.id);
            }
            if (state.tempEdgeLine) state.tempEdgeLine.remove();
            if (state.hoveredTargetNodeDOM) state.hoveredTargetNodeDOM.classList.remove('target-hover');

            state.isDraggingEdge = false;
            state.tempEdgeLine = null;
            state.edgeStartNodeDOM = null;
            state.hoveredTargetNodeDOM = null;
        }

        if (state.draggedNodeData) {
            state.draggedNodeData.el.style.cursor = 'grab';
            const movedDistance = Math.sqrt(
                Math.pow(state.draggedNodeData.x - state.draggedNodeData.startX, 2) +
                Math.pow(state.draggedNodeData.y - state.draggedNodeData.startY, 2)
            );
            if (movedDistance < 5 && state.currentMode === null) {
                const clientX = e.clientX ?? (e.changedTouches ? e.changedTouches[0].clientX : 0);
                const clientY = e.clientY ?? (e.changedTouches ? e.changedTouches[0].clientY : 0);
                ui.showFloatingPanel(clientX, clientY, 'node', state.draggedNodeData.id);
            }
            state.draggedNodeData = null;
        }
    };

    window.addEventListener('mouseup', handleEnd);
    window.addEventListener('touchend', handleEnd);
}

// Funzione helper per il touch targeting
function updateTouchTarget(target) {
    const nodeDOM = target?.classList.contains('node') ? target : null;
    if (state.hoveredTargetNodeDOM === nodeDOM) return;

    if (state.hoveredTargetNodeDOM) {
        state.hoveredTargetNodeDOM.classList.remove('target-hover');
    }
    
    state.hoveredTargetNodeDOM = nodeDOM;
    
    if (state.hoveredTargetNodeDOM && state.hoveredTargetNodeDOM !== state.edgeStartNodeDOM) {
        state.hoveredTargetNodeDOM.classList.add('target-hover');
    }
}

// Collegare gli handler essenziali a un nodo appena creato
export function attachNodeListeners(nodeData) {
    const circle = nodeData.el;

    circle.addEventListener('mousedown', (e) => handleNodeMouseDown(e, nodeData.id));
    circle.addEventListener('touchstart', (e) => handleNodeMouseDown(e, nodeData.id), { passive: false });

    circle.addEventListener('mouseenter', (e) => {
        if (state.isDraggingEdge && state.edgeStartNodeDOM !== e.target) {
            state.hoveredTargetNodeDOM = e.target;
            state.hoveredTargetNodeDOM.classList.add('target-hover');
        }
    });

    circle.addEventListener('mouseleave', (e) => {
        if (state.hoveredTargetNodeDOM === e.target) {
            state.hoveredTargetNodeDOM.classList.remove('target-hover');
            state.hoveredTargetNodeDOM = null;
        }
    });
}

// Handler invocato quando si preme su un nodo
export function handleNodeMouseDown(e, nodeId) {
    e.stopPropagation();
    const nodeDOM = e.target;
    const nodeData = state.nodes.find(n => n.id === nodeId);

    if (state.currentMode === 'selectSource' || state.currentMode === 'selectSink') {
        ui.handleSelection(nodeId);
        return;
    }

    if (state.currentMode === 'addEdge') {
        state.isDraggingEdge = true;
        state.edgeStartNodeDOM = nodeDOM;

        // linea temporanea di supporto
        const ns = 'http://www.w3.org/2000/svg';
        const line = document.createElementNS(ns, 'line');
        line.setAttribute('x1', nodeData.x);
        line.setAttribute('y1', nodeData.y);
        line.setAttribute('x2', nodeData.x);
        line.setAttribute('y2', nodeData.y);
        // classe e attributi espliciti per garantire visibilità durante il drag
        line.setAttribute('class', 'drag-edge');
        line.setAttribute('stroke', '#95a5a6');
        line.setAttribute('stroke-width', '2');
        line.setAttribute('stroke-dasharray', '6,4');
        line.setAttribute('marker-end', 'url(#arrowhead-drag)');
        dragLayer.appendChild(line);
        state.tempEdgeLine = line;

        ui.hideFloatingPanel();
    } else if (state.currentMode === null) {
        state.draggedNodeData = nodeData;
        state.draggedNodeData.startX = nodeData.x;
        state.draggedNodeData.startY = nodeData.y;
        nodeDOM.style.cursor = 'grabbing';
        ui.hideFloatingPanel();
    }
}
