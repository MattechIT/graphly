# GRAPHLY - Graph Algorithm Visualizer

![Graphly Banner](res/banner.png)

**Interactive Graph Editor & Algorithmic Solver**

Graphly transforms abstract graph theory into a visual experience. It allows users to design custom topologies and watch the step-by-step propagation of standard algorithms into the network.

## 📋 Project Overview

*   **Architecture:** Modular Frontend Application (Vanilla JS).
    *   **Core Engine:** State-driven graph model managing nodes, weighted edges, and connectivity via adjacency lists.
    *   **Renderer Subsystem:** High-performance SVG visualization layer with dynamic edge geometry and markers.
    *   **Algorithm API:** Extensible framework for implementing and visualizing graph algorithms with stepwise execution and operation logging.
*   **Key Features:**
    *   **Interactive Sandbox:** Intuitive node creation and edge dragging with real-time feedback.
    *   **Visual Algorithmic Player:** Full control over algorithm execution with a live operation log.
    *   **Dynamic Layouts:** Multiple automated positioning strategies.
    *   **Data Persistence:** Import/Export capabilities for both structured JSON and simplified text-based edge lists.

## 📂 Repository Structure

- `js/`: Core application logic, state management, and UI controllers.
- `js/algorithms/`: Dedicated implementations of some graph-theoretic algorithms.
- `docs/`: Technical documentation and algorithm API descriptions.
- `css/`: Modern UI styling and component definitions.
- `res/`: Graphical assets, UI icons, and the interactive user guide (`guide.json`).

## 📚 Technologies & Standards

*   **SVG (Scalable Vector Graphics)** - Used for nodes rendering and complex edge geometries.
*   **Vanilla JavaScript (ES6+)** - Core logic and algorithm engine handled without external frameworks for maximum performance.
*   **HTML5 & CSS3** - Responsive design utilizing CSS Variables and Flexbox for a polished, dark-themed UI.

## 🛠️ Software Requirements

*   **Browser:** A modern web browser supporting ES6 Modules (Chrome, Firefox, Edge, Safari).
*   **Environment:** No installation required; can be served via local HTTP server.

## 🎮 How to Use

1.  **Start a Web Server:** Due to ES Modules security restrictions, the project must be served via HTTP.
    *   **Python:** Run `python -m http.server 8000` in the root directory.
    *   **Node.js/npm:** Run `npx serve` or any static server.
2.  **Launch:** Open `http://localhost:8000` (or the port provided by your server) in your browser.
3.  **Edit Graph:** Add nodes and edges using the toolbar and interact with them by moving it or by clicking on elements to edit parameters.
4.  **Organize:** Use the **Layout** menu to automatically arrange nodes into common structured patterns.
5.  **Algorithms:** Select and run algoithms from the **Algorithm** menu in order to visualize the execution step-by-step.
6.  **Persistence:** Use the **File** menu to save your graph as JSON or import existing datasets from formatted text.
