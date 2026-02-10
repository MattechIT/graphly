import { NODE_RADIUS } from './config.js';

/**
 * Calculates the SVG path string and label coordinates for an edge.
 * Handles both straight lines and quadratic Bézier curves for bidirectional edges.
 */
export function calculateEdgeGeometry(source, target, hasReverse) {
    const dx = target.x - source.x;
    const dy = target.y - source.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    
    if (dist === 0) return null;

    // Unit vectors
    const ux = dx / dist;
    const uy = dy / dist;
    
    // Perpendicular vector (normalized) for curvature
    const perpX = -uy;
    const perpY = ux;

    // Calculate start and end points on node borders
    const startX = source.x + ux * NODE_RADIUS;
    const startY = source.y + uy * NODE_RADIUS;
    const endX = target.x - ux * NODE_RADIUS;
    const endY = target.y - uy * NODE_RADIUS;

    let d, labelX, labelY;

    if (hasReverse) {
        // Quadratic Bézier curvature
        const offset = 40; 
        const midX = (startX + endX) / 2;
        const midY = (startY + endY) / 2;
        const ctrlX = midX + perpX * offset;
        const ctrlY = midY + perpY * offset;

        d = `M ${startX} ${startY} Q ${ctrlX} ${ctrlY} ${endX} ${endY}`;

        // Label position: midpoint of the curve
        labelX = 0.25 * startX + 0.5 * ctrlX + 0.25 * endX + perpX * 10;
        labelY = 0.25 * startY + 0.5 * ctrlY + 0.25 * endY + perpY * 10;
    } else {
        // Simple straight line
        d = `M ${startX} ${startY} L ${endX} ${endY}`;
        labelX = (startX + endX) / 2 + perpX * 15;
        labelY = (startY + endY) / 2 + perpY * 15;
    }

    return { d, labelX, labelY };
}
