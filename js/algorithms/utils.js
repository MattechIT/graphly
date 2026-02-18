/**
 * Common utilities for graph algorithms
 */

/**
 * Returns a human-readable label for a node.
 * Prioritizes userLabel, then falls back to node ID.
 * @param {Array} nodes - The array of node objects
 * @param {string|number} id - The ID of the node
 * @returns {string} The label to display
 */
export function getNodeLabel(nodes, id) {
    const n = nodes.find(x => x.id === id);
    return n ? (n.userLabel || id) : id;
}
