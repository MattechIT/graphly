// DOM cache and coordinates utility
export const svgCanvas = document.getElementById('svg-canvas');
export const nodesLayer = document.getElementById('nodes-layer');
export const edgesLayer = document.getElementById('edges-layer');
export const dragLayer = document.getElementById('drag-layer');
export const btnAddNode = document.getElementById('btn-add-node');
export const btnAddEdge = document.getElementById('btn-add-edge');
export const btnSave = document.getElementById('btn-save');
export const btnLoad = document.getElementById('btn-load');
export const btnLayoutLayered = document.getElementById('btn-layout-layered');
export const btnLayoutCompact = document.getElementById('btn-layout-compact');
export const btnLayoutCircle = document.getElementById('btn-layout-circle');
export const btnLayoutGrid = document.getElementById('btn-layout-grid');
export const inputLoadFile = document.getElementById('input-load-file');
export const algorithmContainer = document.getElementById('algorithm-container');
export const infoText = document.getElementById('info');
export const floatingPanel = document.getElementById('floating-panel');
export const logSidebar = document.getElementById('log-sidebar');
export const btnCloseSidebar = document.getElementById('btn-close-sidebar');
export const logList = document.getElementById('log-list');
export const playerBar = document.getElementById('player-bar');
export const btnPlayerStart = document.getElementById('player-start');
export const btnPlayerBack = document.getElementById('player-back');
export const btnPlayerPlay = document.getElementById('player-play');
export const btnPlayerNext = document.getElementById('player-next');
export const btnPlayerEnd = document.getElementById('player-end');
export const btnPlayerStop = document.getElementById('player-stop');
export const playerStepInfo = document.getElementById('player-step-info');

export function getMousePosition(evt) {
    const rect = svgCanvas.getBoundingClientRect();
    return {
        x: evt.clientX - rect.left,
        y: evt.clientY - rect.top
    };
}
