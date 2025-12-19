// Stato centrale dell'applicazione: oggetti mutabili condivisi tra moduli
export const state = {
    // Modalità dell'editor: null | 'addNode' | 'addEdge'
    currentMode: null,

    // Collezioni
    nodes: [], // { id, x, y, el, label }
    edges: [], // { source, target, el, hitArea, id }

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
