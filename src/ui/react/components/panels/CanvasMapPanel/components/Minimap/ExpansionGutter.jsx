/**
 * @file ExpansionGutter.jsx
 * @description Invisible zones at grid edges that reveal on hover to allow
 * canvas expansion (add row/column).
 */

import React, { memo } from 'react';
import { Icon } from '@UI/react/components/atoms/Icon';
import { Tooltip } from '@UI/react/components/atoms/Tooltip';
import './ExpansionGutter.scss';

/**
 * ExpansionGutter — hover zones on grid edges for canvas expansion
 */
export const ExpansionGutter = memo(function ExpansionGutter({
  gridWidth,
  gridHeight,
  cellSize,
  onExpand,
  isEditMode,
}) {
  const gutterSize = Math.max(16, Math.round(cellSize * 0.4));

  return (
    <div className="expansion-gutter" style={{ '--gutter-size': `${gutterSize}px` }}>
      {/* Top gutter */}
      <Tooltip content="Add row above" placement="bottom" delay={300}>
        <button
          type="button"
          className="expansion-gutter__zone expansion-gutter__zone--top"
          style={{ width: gridWidth, height: gutterSize }}
          onClick={() => onExpand?.('top')}
        >
          <Icon name="plus" size={12} />
        </button>
      </Tooltip>

      {/* Bottom gutter */}
      <Tooltip content="Add row below" placement="top" delay={300}>
        <button
          type="button"
          className="expansion-gutter__zone expansion-gutter__zone--bottom"
          style={{ width: gridWidth, height: gutterSize, top: gridHeight }}
          onClick={() => onExpand?.('bottom')}
        >
          <Icon name="plus" size={12} />
        </button>
      </Tooltip>

      {/* Left gutter */}
      <Tooltip content="Add column left" placement="right" delay={300}>
        <button
          type="button"
          className="expansion-gutter__zone expansion-gutter__zone--left"
          style={{ width: gutterSize, height: gridHeight }}
          onClick={() => onExpand?.('left')}
        >
          <Icon name="plus" size={12} />
        </button>
      </Tooltip>

      {/* Right gutter */}
      <Tooltip content="Add column right" placement="left" delay={300}>
        <button
          type="button"
          className="expansion-gutter__zone expansion-gutter__zone--right"
          style={{ width: gutterSize, height: gridHeight, left: gridWidth }}
          onClick={() => onExpand?.('right')}
        >
          <Icon name="plus" size={12} />
        </button>
      </Tooltip>
    </div>
  );
});

export default ExpansionGutter;
