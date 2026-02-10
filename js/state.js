// Central application state: shared mutable objects between modules
export const state = {
    // Editor mode: null | 'addNode' | 'addEdge'
    currentMode: null,

    // Collections
    // nodes: { id, x, y, el, labelEl, userLabel, algLabel }
    nodes: [], 
    // edges: { id, source, target, el, hitArea, weight, capacity, flow, isSaturated }
    edges: [],

    // Counters
    nodeIdCounter: 0,
    edgeIdCounter: 0,

    // Temporary interaction state
    draggedNodeData: null,
    isDraggingEdge: false,
    edgeStartNodeDOM: null,
    tempEdgeLine: null,
    hoveredTargetNodeDOM: null,

    // Floating panel
    selectedElement: null,

    // Algorithm and Player State
    isAlgorithmRunning: false,
    algorithmSteps: [],
    currentStepIndex: -1,
    playbackPaused: true,
    playbackTimer: null,
    
    // Dynamic selection state
    selectedAlgorithm: null,
    algorithmParams: {},
    selectionStep: 0
};
