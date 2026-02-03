// Stato centrale dell'applicazione: oggetti mutabili condivisi tra moduli
export const state = {
    // Modalità dell'editor: null | 'addNode' | 'addEdge'
    currentMode: null,

    // Collezioni
    // nodes: { id, x, y, el, labelEl, userLabel, algLabel }
    nodes: [], 
    // edges: { id, source, target, el, hitArea, weight, capacity, flow, isSaturated }
    edges: [],

    // Contatori
    nodeIdCounter: 0,

    // Stato temporaneo di interazione
    draggedNodeData: null,
    isDraggingEdge: false,
    edgeStartNodeDOM: null,
    tempEdgeLine: null,
    hoveredTargetNodeDOM: null,

    // Pannello flottante
    selectedElement: null,

    // [NUOVO] Stato Algoritmi e Player
    isAlgorithmRunning: false,
    algorithmSteps: [],
    currentStepIndex: -1,
    playbackPaused: true,
    playbackTimer: null
};
