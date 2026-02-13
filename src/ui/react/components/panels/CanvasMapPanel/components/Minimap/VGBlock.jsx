/**
 * @file VGBlock.jsx
 * @description ViewGroup block on minimap (VG display mode)
 *
 * Visual States:
 * - Default: 25% opacity fill, 80% opacity border
 * - Selected: 40% opacity fill, 100% border, glow shadow
 * - Ghosted (links mode): 10% opacity fill, 30% border, 40% overall opacity
 * - Explicit: Solid border
 * - Implicit: Dashed border
 */

import React, { memo, useMemo } from 'react';
import { Icon } from '@UI/react/components/atoms/Icon';
import { Tooltip } from '@UI/react/components/atoms/Tooltip';
import { LAYOUTS } from '../../utils/constants';
import { getVGDisplayName } from '../../utils/gridUtils';
import { getInternalCells } from '../../hooks/useInternalCellLayout';

/**
 * VGBlock - ViewGroup on minimap
 *
 * @param {Object} props
 * @param {Object} props.vg - ViewGroup data
 * @param {string} [props.displayName] - Pre-computed display name
 * @param {number} props.cellSize - Size of each cell in pixels
 * @param {number} props.gap - Gap between cells
 * @param {boolean} props.isSelected - Whether this VG is selected
 * @param {boolean} props.isGhosted - Whether to show ghosted (for links mode)
 * @param {boolean} props.showInternals - Whether to show internal layout grid
 * @param {boolean} [props.subtle=false] - Subtle mode: thinner borders, no fill, click-through
 *   Used when showing both VG outlines AND views (views take priority for interaction)
 * @param {Function} props.onClick - Click handler
 * @param {Function} props.onDoubleClick - Double-click handler
 */
export const VGBlock = memo(function VGBlock({
  vg,
  displayName,
  cellSize,
  gap = 4,
  isSelected,
  isGhosted,
  showInternals,
  subtle = false,
  draggable = false,
  onClick,
  onDoubleClick,
  onDragStart,
  onDragEnd,
  // Edit mode props
  isEditMode = false,
  onPointerDown,
  isBeingMoved = false,
  onRemove,
  // Draft change indicator
  changeStatus, // 'added' | 'moved' | 'removed' | null
  // Focus dimming
  dimmed = false,
}) {
  const name = displayName || getVGDisplayName(vg);
  const layout = LAYOUTS[vg.layoutId] || LAYOUTS.single;
  const { position, color, isExplicit, views = [] } = vg;

  // Calculate position and size
  const style = useMemo(() => {
    const left = position.col * (cellSize + gap);
    const top = position.row * (cellSize + gap);
    return {
      left,
      top,
      '--vg-color': color,
      '--vg-width': `${position.colSpan * cellSize + (position.colSpan - 1) * gap}px`,
      '--vg-height': `${position.rowSpan * cellSize + (position.rowSpan - 1) * gap}px`,
    };
  }, [position, cellSize, color, gap]);

  // Calculate internal grid cells
  const internalCells = useMemo(() => {
    if (!showInternals) return [];
    const padding = 4;
    const w = position.colSpan * cellSize + (position.colSpan - 1) * gap - padding * 2;
    const h = position.rowSpan * cellSize + (position.rowSpan - 1) * gap - padding * 2;
    return getInternalCells(layout, w, h, views.length, { padding, gap: 2 });
  }, [showInternals, layout, position, cellSize, gap, views.length]);

  // In edit mode, use pointer events instead of HTML5 drag
  const effectiveDraggable = isEditMode ? false : (draggable && !subtle);

  const handlePointerDown = isEditMode && onPointerDown
    ? (e) => {
        e.stopPropagation(); // prevent minimap panning
        onPointerDown(e, vg);
      }
    : undefined;

  const changeStatusClass = changeStatus ? `vg-block--${changeStatus}` : '';

  return (
    <Tooltip content={`${name} (${position.rowSpan}x${position.colSpan})`} placement="top" delay={300}>
      <div
        className={`vg-block
          ${isSelected ? 'vg-block--selected' : ''}
          ${isGhosted ? 'vg-block--ghosted' : ''}
          ${!isExplicit ? 'vg-block--implicit' : ''}
          ${subtle ? 'vg-block--subtle' : ''}
          ${isBeingMoved ? 'vg-block--moving' : ''}
          ${isEditMode ? 'vg-block--edit-mode' : ''}
          ${dimmed ? 'vg-block--dimmed' : ''}
          ${changeStatusClass}`}
        style={style}
        draggable={effectiveDraggable}
        onDragStart={effectiveDraggable ? onDragStart : undefined}
        onDragEnd={effectiveDraggable ? onDragEnd : undefined}
        onPointerDown={handlePointerDown}
        onClick={subtle ? undefined : onClick}
        onDoubleClick={onDoubleClick}
        role={subtle ? undefined : 'button'}
        tabIndex={subtle ? -1 : 0}
        aria-label={`${name} (${position.rowSpan}x${position.colSpan})`}
        onKeyDown={subtle ? undefined : (e) => {
          if (e.key === 'Enter') onClick?.();
          if (e.key === ' ') {
            e.preventDefault();
            onClick?.();
          }
        }}
      >
      {/* Name label */}
      <span className="vg-block__name">{name}</span>

      {/* Change status badge */}
      {changeStatus && (
        <span className={`vg-block__change-badge vg-block__change-badge--${changeStatus}`}>
          {changeStatus === 'added' ? 'NEW' : changeStatus === 'moved' ? 'MOVED' : changeStatus === 'removed' ? 'REMOVING' : ''}
        </span>
      )}

      {/* Remove button in edit mode */}
      {isEditMode && onRemove && (
        <Tooltip content="Remove from canvas" placement="top" delay={300}>
          <button
            type="button"
            className="vg-block__remove-btn"
            onClick={(e) => {
              e.stopPropagation();
              onRemove(vg.id);
            }}
            aria-label="Remove from canvas"
          >
            <Icon name="close" size={10} />
          </button>
        </Tooltip>
      )}

      {/* Internal layout grid */}
      {showInternals && internalCells.length > 0 && (
        <div className="vg-block__internals">
          {internalCells.map((cell, i) => (
            <div
              key={i}
              className={`vg-block__internal-cell ${cell.filled ? 'vg-block__internal-cell--filled' : ''}`}
              style={{
                left: cell.x,
                top: cell.y,
                width: cell.width,
                height: cell.height,
              }}
            />
          ))}
        </div>
      )}
    </div>
    </Tooltip>
  );
});

export default VGBlock;
