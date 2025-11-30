/**
 * ViewportIndicator Component
 *
 * Shows the current visible area in the grid preview.
 *
 * @param {Object} viewport - { row, col, zoom }
 * @param {Object} gridSize - { rows, cols }
 */

import { memo, useMemo } from 'react';
import './ViewportIndicator.scss';

export const ViewportIndicator = memo(function ViewportIndicator({
    viewport,
    gridSize,
}) {
    // Calculate viewport rectangle position and size
    const indicatorStyle = useMemo(() => {
        const viewportWidth = 100 / gridSize.cols;
        const viewportHeight = 100 / gridSize.rows;

        return {
            left: `${viewport.col * viewportWidth}%`,
            top: `${viewport.row * viewportHeight}%`,
            width: `${viewportWidth}%`,
            height: `${viewportHeight}%`,
        };
    }, [viewport, gridSize]);

    return (
        <div
            className="viewport-indicator"
            style={indicatorStyle}
            aria-hidden="true"
        >
            <div className="viewport-indicator__border" />
        </div>
    );
});

export default ViewportIndicator;