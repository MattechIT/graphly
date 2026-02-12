// --- SVG LAYERS ---
export const svgCanvas = document.getElementById('svg-canvas');
export const nodesLayer = document.getElementById('nodes-layer');
export const edgesLayer = document.getElementById('edges-layer');
export const dragLayer = document.getElementById('drag-layer');

// --- TOOLBAR & UI ---
export const btnAddNode = document.getElementById('btn-add-node');
export const btnAddEdge = document.getElementById('btn-add-edge');
export const algorithmContainer = document.getElementById('algorithm-container');
export const floatingPanel = document.getElementById('floating-panel');
export const toastContainer = document.getElementById('toast-container');

// --- PERSISTENCE CONTROLS ---
export const btnSaveJson = document.getElementById('btn-save-json');
export const btnSaveText = document.getElementById('btn-save-text');
export const btnLoadJson = document.getElementById('btn-load-json');
export const btnLoadText = document.getElementById('btn-load-text');
export const inputLoadFile = document.getElementById('input-load-file');

// --- LAYOUT BUTTONS ---
export const btnLayoutLayered = document.getElementById('btn-layout-layered');
export const btnLayoutCompact = document.getElementById('btn-layout-compact');
export const btnLayoutCircle = document.getElementById('btn-layout-circle');
export const btnLayoutGrid = document.getElementById('btn-layout-grid');

// --- PLAYER & LOG SIDEBAR ---
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

// --- MODALS: QUICK TEXT EDIT ---
export const importOverlay = document.getElementById('import-overlay');
export const exportOverlay = document.getElementById('export-overlay');
export const textareaNodes = document.getElementById('text-nodes');
export const textareaEdges = document.getElementById('text-edges');
export const textareaExportAll = document.getElementById('text-export-all');
export const importStatus = document.getElementById('import-status');
export const btnQuickGenerate = document.getElementById('btn-quick-generate');
export const btnCopyExport = document.getElementById('btn-copy-export');

/**
 * Gets mouse/pointer position relative to the SVG canvas.
 */
export function getMousePosition(evt) {
    const rect = svgCanvas.getBoundingClientRect();
    return {
        x: evt.clientX - rect.left,
        y: evt.clientY - rect.top
    };
}
