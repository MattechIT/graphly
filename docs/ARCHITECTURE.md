# System Architecture

Graphly is built as a **Modular Frontend Application** using Vanilla JavaScript (ES6+). 
The software is designed to be lightweight and extensible, because of the separation of visual and internal representation of the graph.

## 🧱 Core Components

### 1. State-Driven Model (`js/state.js`)
The application maintains a centralized `state` object that acts as the central source of truth for all graph data and UI state.
- **Nodes & Edges:** Stores the raw data (coordinates, labels, weights, flow) of all graph elements.
- **UI State:** Tracks the current mode (Add Node, Add Edge, Algorithm Selection) and dragging operations.
- **Player State:** Manages the playback of algorithm steps (current step, paused/playing).

### 2. Renderer Subsystem (`js/renderer.js` & `js/geometry.js`)
Handles the translation of state data into the **SVG (Scalable Vector Graphics)** container.
- **Dynamic Geometry:** Calculates quadratic Bézier curves for bidirectional edges to avoid overlap.
- **DOM Synchronization:** Updates only the necessary SVG elements when the state changes (e.g., node position update during drag).
- **Hit Areas:** Uses invisible wide paths for easier edge selection and interaction.

### 3. Algorithm Framework (`js/algorithms/`)
Provides an extensible API for graph solvers.
- **Registry:** A central hub (`registry.js`) where all algorithms are exported with their metadata.
- **Step-Based Output:** Algorithms do not modify the state directly; instead, they return a sequence of `steps` describing visual changes.

### 4. Persistence Layer (`js/persistence.js`)
Manages the import and export of graph data.
- **TXT Format:** Graphs can be saved and created in a simple text format for easy sharing and debugging.
- **JSON Format:** Graphs can be saved and loaded in a structured JSON format that captures all necessary information (nodes, edges, weights, flow, positions).

## 🔄 Interaction Flow
1. **User Interaction:** The user interacts with the SVG via `js/interactions.js`.
2. **State Mutation:** Interactions update the global `state`.
3. **Reactive Rendering:** The `renderer` is called to update the visual representation based on the new state.
4. **Algorithm Execution:** When an algorithm is triggered, it processes a *copy* of the current graph data and produces a step-by-step animation plan.

## 🛠️ Performance Considerations
- **No Heavy Libraries:** By avoiding frameworks like D3 or React, Graphly maintains a minimal memory footprint and fast execution.
- **SVG Layering:** Elements are organized in layers (edges, nodes, drag-feedback) to ensure consistent Z-indexing and efficient DOM management.
