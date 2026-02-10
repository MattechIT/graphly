import { state } from './state.js';
import { getMousePosition, svgCanvas, dragLayer } from './dom.js';
import * as renderer from './renderer.js';
import * as ui from './ui.js';

// Initialize global handlers and node attachment functions
export function init() {
    // Background click to create node (if in addNode mode)
    const handleBgStart = (e) => {
        if (e.target.id === 'svg-canvas' && state.currentMode === 'addNode') {
            const pos = getMousePosition(e);
            const node = renderer.createNode(pos.x, pos.y);
            attachNodeListeners(node);
        }
    };

    svgCanvas.addEventListener('pointerdown', handleBgStart);

    // Global move handler
    const handleMove = (e) => {
        const pos = getMousePosition(e);

        if (state.isDraggingEdge && state.tempEdgeLine) {
            state.tempEdgeLine.setAttribute('x2', pos.x);
            state.tempEdgeLine.setAttribute('y2', pos.y);

            // Manual targeting for touch:
            const target = document.elementFromPoint(e.clientX, e.clientY);
            const nodeDOM = target?.classList.contains('node') ? target : null;

            if (state.hoveredTargetNodeDOM !== nodeDOM) {
                if (state.hoveredTargetNodeDOM) {
                    state.hoveredTargetNodeDOM.classList.remove('target-hover');
                }
                state.hoveredTargetNodeDOM = nodeDOM;
                if (state.hoveredTargetNodeDOM && state.hoveredTargetNodeDOM !== state.edgeStartNodeDOM) {
                    state.hoveredTargetNodeDOM.classList.add('target-hover');
                }
            }
        } else if (state.draggedNodeData && state.currentMode === null) {
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

    window.addEventListener('pointermove', handleMove);

    // Global up handler
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
                ui.showFloatingPanel(e.clientX, e.clientY, 'node', state.draggedNodeData.id);
            }
            state.draggedNodeData = null;
        }
    };

    window.addEventListener('pointerup', handleEnd);
    window.addEventListener('pointercancel', handleEnd); // Important to handle interruptions
}

// Attach essential handlers to a newly created node
export function attachNodeListeners(nodeData) {
    const circle = nodeData.el;
    circle.addEventListener('pointerdown', (e) => handleNodePointerDown(e, nodeData.id));
}

// Handler invoked when a node is pressed
export function handleNodePointerDown(e, nodeId) {
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

        // Temporary helper line
        const ns = 'http://www.w3.org/2000/svg';
        const line = document.createElementNS(ns, 'line');
        line.setAttribute('x1', nodeData.x);
        line.setAttribute('y1', nodeData.y);
        line.setAttribute('x2', nodeData.x);
        line.setAttribute('y2', nodeData.y);
        // Explicit classes and attributes to ensure visibility during drag
        line.setAttribute('class', 'drag-edge');
        line.setAttribute('stroke', 'var(--text-light)');
        line.setAttribute('stroke-width', '2');
        line.setAttribute('stroke-dasharray', '6,4');
        line.setAttribute('marker-end', 'url(#arrowhead-drag)');
        dragLayer.appendChild(line);
        state.tempEdgeLine = line;

        ui.hideFloatingPanel();
    } else if (state.currentMode === null && !state.isAlgorithmRunning) {
        state.draggedNodeData = nodeData;
        state.draggedNodeData.startX = nodeData.x;
        state.draggedNodeData.startY = nodeData.y;
        nodeDOM.setPointerCapture(e.pointerId);
        nodeDOM.style.cursor = 'grabbing';
        ui.hideFloatingPanel();
    }
}
