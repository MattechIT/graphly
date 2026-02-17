# Algorithm API & Developer Guide

This guide explains how to extend Graphly by adding new algorithms (e.g., BFS, DFS, Prim, Bellman-Ford) in a simple and modular way. Thanks to Graphly's "plug-and-play" architecture, you only need to focus on the logic; the system handles rendering and playback.

---

## 1. Philosophy: Logic vs. Visualization
In Graphly, an algorithm is a **pure module**:
1. It receives a copy of the graph data.
2. It performs calculations.
3. It returns a **list of instructions (Steps)** describing what happens over time.

The **Player** then takes this list, animates the changes, and populates the sidebar log.

---

## 2. Anatomy of an Algorithm File
Create a `.js` file in `js/algorithms/` (e.g., `myAlgorithm.js`). The file must export two main elements: `metadata` and `run`.

### A. Metadata (Configuration)
Defines how the algorithm appears in the UI and what it requires to execute.

```javascript
export const metadata = {
    id: "my-algorithm",          // Unique ID
    name: "My Algorithm",        // Display name in the toolbar
    
    // Required selections. If the algorithm works on the whole graph
    // (e.g., Kruskal), use an empty array: []
    requires: ["sourceNode"],    // Options: "sourceNode", "sinkNode"
    
    // Graph visual style:
    // "weighted": Directed graph with arrows (e.g., Dijkstra)
    // "undirected": Hides edge arrows (e.g., Kruskal)
    // "flow": Optimized for flow networks (e.g., Ford-Fulkerson)
    graphType: "weighted"        
};
```

### B. The `run` Function (Logic)
Receives three parameters: `nodes`, `edges`, and `params`.

```javascript
export function run(nodes, edges, params) {
    const steps = []; 
    
    // If requires is [], params will be an empty object.
    const startNodeId = params.sourceNode;

    // ... your logic ...

    return steps; 
}
```

---

## 3. Data Structures (Input)

### The `Node` Object
```javascript
{
    id: "node-0",        
    userLabel: "A",      // Visible label
    x: 100, y: 200       // Coordinates
}
```

### The `Edge` Object
```javascript
{
    id: "edge-0-1",      
    source: "node-0",    // Source node ID
    target: "node-1",    // Target node ID
    weight: 5,           
    capacity: 5,         
    flow: 0              
}
```

---

## 4. Creating the Visualization (Output)

Each `step` object represents a "frame" in the animation sequence.

### The `Step` Structure
```javascript
{
    description: "Analyzing Node A completed", // Text shown in the sidebar log

    changes: {
        // Use the 'state' property with semantic values
        nodes: [{ 
            id: "node-0", 
            state: "highlighted", 
            algLabel: "dist: 5", 
            resetStyle: false 
        }],
        edges: [{ 
            id: "edge-0-1", 
            state: "path", 
            width: 4, 
            saturated: false, // Optional: sets data-is-saturated="true"
            resetStyle: false 
        }]
    }
}
```

---

## 5. Advanced Patterns & Best Practices

### A. Semantic State System
**Do not use colors or CSS variables directly** in your steps. Use the `state` property, which automatically triggers `data-alg-state` attributes in the DOM.

Standard `state` values:
- **`highlighted`**: Current element under analysis (Yellow).
- **`searching`**: Scanning neighbors / Candidate (Orange).
- **`success`**: Confirmed or visited element (Green).
- **`path`**: Final result (Blue - e.g., shortest path, MST).
- **`error`**: Discarded / Cycle detected / Error (Red).

**Edge Special Property:**
Use `saturated: true` to indicate that an edge has reached its maximum capacity. This is independent of the state and colors the edge a deep red.

### B. Sequential Cleanup (The "Kruskal Technique")
When highlighting elements, remember to reset them in the next step to avoid visual clutter.

```javascript
let lastEdgeId = null;
for (const edge of sortedEdges) {
    const changes = { edges: [{ id: edge.id, state: "highlighted" }] };
    
    // Reset the previous edge's highlight
    if (lastEdgeId) changes.edges.push({ id: lastEdgeId, resetStyle: true });
    
    steps.push({ description: "Examining edge...", changes });
    lastEdgeId = edge.id;
}
```

---

## 6. Registration
1. Open `js/algorithms/registry.js`.
2. Import your file: `import * as MyAlgorithm from './myAlgorithm.js';`
3. Add it to the `AlgorithmRegistry` object.

The UI will automatically generate the corresponding button and handle the node selection workflow based on your `metadata.requires`.
