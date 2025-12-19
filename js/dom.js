// Cache dei riferimenti DOM e utilità per coordinate
export const svgCanvas = document.getElementById('svg-canvas');
export const nodesLayer = document.getElementById('nodes-layer');
export const edgesLayer = document.getElementById('edges-layer');
export const dragLayer = document.getElementById('drag-layer');
export const btnAddNode = document.getElementById('btn-add-node');
export const btnAddEdge = document.getElementById('btn-add-edge');
export const infoText = document.getElementById('info');
export const floatingPanel = document.getElementById('floating-panel');

export function getMousePosition(evt) {
    const rect = svgCanvas.getBoundingClientRect();
    return {
        x: evt.clientX - rect.left,
        y: evt.clientY - rect.top
    };
}
