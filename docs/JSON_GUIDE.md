# Guide: Creating Graph JSON Files Manually

This guide explains the structure of `.json` files used for import/export in Graphly.

## 1. Basic Structure

A valid graph file is a JSON object containing a `nodes` array and an `edges` array.

```json
{
  "graphlyVersion": "1.1",
  "nodes": [ ... ],
  "edges": [ ... ]
}
```

---

## 2. Nodes (`nodes`)

Each node object represents a vertex in the graph.

### Required Fields
- `id`: (String) A unique identifier for the node (e.g., `"n1"`, `"Roma"`, `"A"`).

### Optional Fields
- `userLabel`: (String) The text displayed inside the node (max 5 chars). If omitted the system will try to derive it from the `id`.
- `x`: (Number) The horizontal position.
- `y`: (Number) The vertical position.

If a coordinate is missing, the system will place the node at the default value `(0, 0)` and then the system will automatically arrange it when you load the file.

### Example
```json
{
  "id": "city-1",
  "userLabel": "ROMA",
  "x": 150,
  "y": 200
}
```

---

## 3. Edges (`edges`)

Edges define the connections between nodes.

### Required Fields
- `source`: (String) The `id` of the starting node.
- `target`: (String) The `id` of the ending node.

### Optional Fields
- `id`: (String) A unique identifier for the edge.
- `weight`: (Number) The value of the edge (used by Dijkstra, Kruskal, Ford-Fulkerson, etc.). Defaults to `1`.

### Example
```json
{
  "source": "city-1",
  "target": "city-2",
  "weight": 5
}
```

---

## 4. Understanding IDs and Labels

The system offers great flexibility regarding naming, but understanding how it handles them is key to efficiency.

### Freedom of Naming
You are free to use any string as an `id`. For example:
- `{"id": "Alpha", "userLabel": "1"}` (Label will be "1")
- `{"id": "Beta"}` (Label will be "Beta")

### The "System Pattern" Advantage
The system is optimized for IDs following the `node-N` (for nodes) and `edge-node-A-node-B` (for edges) patterns. Following this pattern provides several benefits:

1.  **Smarter Auto-Labels:**
    - If you use `{"id": "node-5"}`, the system automatically displays **"5"** as the label.
    - If you use `{"id": "Roma"}`, the system displays **"Roma"**. Using the pattern keeps the UI cleaner with short numbers.

2.  **ID Collision Prevention:**
    - The system tracks the highest number used in IDs (e.g., if you have `node-10`, the next node created manually in the UI will be `node-11`).
    - If you use purely textual IDs like `city-A`, the system might restart its counter from `node-0`, which is safe but less organized.

3.  **Predictable Edge IDs:**
    - The UI generates edge IDs as `edge-[sourceId]-[targetId]`. Following this in your JSON makes it easier to debug connections.

---

## 5. Pro-Tips for Manual Creation

- **Omit Coordinates for Auto-Layout:** You don't need to guess `x` and `y`. Just define the IDs and connections, load the file, and you will get a clean layout automatically.
- **Weights for Algorithms:** If you are preparing a graph for Dijkstra, ensure every edge has a `weight`.
- **Directionality:** All edges in the JSON are considered directed. If you need an undirected graph, create two edges (e.g., A -> B and B -> A).
- **Try** the `test-graph.json` file included in the repository to see a working example of a graph JSON file.
