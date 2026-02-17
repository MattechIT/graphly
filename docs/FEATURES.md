# Features Overview

## 🛠️ Interactive Sandbox
The core of Graphly is its intuitive editor, allowing for direct manipulation of the graph structure.
- **Node Creation:** Add nodes with a single click in Add Node mode.
- **Smart Edges:** Connect nodes by dragging from one node to another OR by clicking source and target nodes in sequence.
- **Direct Editing:** Click any node or edge to open a **Floating Property Panel**, where you can rename nodes or set edge weights/capacities.
- **Live Dragging:** Move nodes freely: connected edges will follow dynamically using optimized geometric recalculations.

## 📐 Automated Layouts
Switch between different perspectives of your graph using built-in layout algorithms:
- **Compact (Diamond):** A balanced distribution ideal for smaller, complex graphs.
- **Layered (Sugiyama Framework):** Arranges nodes in hierarchical columns based on connectivity—perfect for flow networks.
- **Circular:** Places nodes in a perfect circle, useful for analyzing cyclic structures.
- **Grid:** Snaps nodes to a grid for a clean, organized view.

## 💾 Persistence & Interoperability
Graphly makes it easy to save and share your work.
- **Quick Text Import/Export:** A flexible "Edge List" parser that allows you to copy-paste nodes and edges in a simple text format (e.g., `A B 10`).
- **Schema Validation:** The import engine validates data integrity, ensuring that nodes exist and coordinates are valid.
- **JSON Format:** Save the complete graph state (including node positions and labels) to a standard `.json` file.

## ⏯️ Stepwise Visualization
Unlike static solvers, Graphly allows you to **play through** an algorithm:
- **Playback Controls:** Play, Pause, Step Forward, and Step Backward.
- **Execution Log:** A real-time sidebar records every logical step taken by the algorithm.
- **Visual Feedback:** Elements change color and labels (e.g., Dijkstra distances or Ford-Fulkerson flows) dynamically as the algorithm progresses.
