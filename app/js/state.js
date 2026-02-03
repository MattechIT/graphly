// Stato centrale dell'applicazione: oggetti mutabili condivisi tra moduli
export const state = {
    // Modalità dell'editor: null | 'addNode' | 'addEdge'
    currentMode: null,

    // Collezioni
    nodes: [], // { id, x, y, el, label }
    // edges: array of edge objects. Each edge may include optional numeric
    // properties `weight` and `capacity` used by graph algorithms.
    // Example: { source, target, el, hitArea, id, weight, capacity }
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
    selectedElement: null
};
