/**
 * @file ViewportIndicator.jsx
 * @description Viewport overlay on minimap showing user's viewport area.
 * Supports drag-to-move with grid snapping.
 */

import React, { memo, useState, useCallback, useRef } from 'react';

/**
 * ViewportIndicator - Draggable viewport overlay on minimap
 */
export const ViewportIndicator = memo(function ViewportIndicator({
  viewport,
  cellSize,
  gap = 4,
  isSelected,
  onViewportMove,
}) {
  const { position, size, isPrimary } = viewport;
  const [dragOffset, setDragOffset] = useState(null);
  const isDragging = dragOffset !== null;
  const elementRef = useRef(null);

  const handlePointerDown = useCallback((e) => {
    if (!onViewportMove) return;
    e.preventDefault();
    e.stopPropagation();
    const pointerId = e.pointerId;
    elementRef.current?.setPointerCapture(pointerId);

    const startX = e.clientX;
    const startY = e.clientY;

    const handlePointerMove = (moveEvt) => {
      const dx = moveEvt.clientX - startX;
      const dy = moveEvt.clientY - startY;
      setDragOffset({ x: dx, y: dy });
    };

    const handlePointerUp = (upEvt) => {
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
      try { elementRef.current?.releasePointerCapture(pointerId); } catch {}

      const dx = upEvt.clientX - startX;
      const dy = upEvt.clientY - startY;
      const pitch = cellSize + gap;
      const colDelta = Math.round(dx / pitch);
      const rowDelta = Math.round(dy / pitch);

      setDragOffset(null);

      if (colDelta !== 0 || rowDelta !== 0) {
        const toRow = Math.max(0, position.row + rowDelta);
        const toCol = Math.max(0, position.col + colDelta);
        onViewportMove({ id: viewport.id, toRow, toCol });
      }
    };

    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp);
  }, [onViewportMove, cellSize, gap, position, viewport.id]);

  const baseLeft = position.col * (cellSize + gap);
  const baseTop = position.row * (cellSize + gap);

  return (
    <div
      ref={elementRef}
      className={`viewport-indicator
        ${isSelected ? 'viewport-indicator--selected' : ''}
        ${isPrimary ? 'viewport-indicator--primary' : ''}
        ${isDragging ? 'viewport-indicator--dragging' : ''}`}
      style={{
        left: baseLeft + (dragOffset?.x || 0),
        top: baseTop + (dragOffset?.y || 0),
        '--vp-width': `${size.cols * cellSize + (size.cols - 1) * gap}px`,
        '--vp-height': `${size.rows * cellSize + (size.rows - 1) * gap}px`,
        cursor: onViewportMove ? (isDragging ? 'grabbing' : 'grab') : 'default',
      }}
      onPointerDown={onViewportMove ? handlePointerDown : undefined}
    >
      <span className="viewport-indicator__label">{viewport.name}</span>
    </div>
  );
});

export default ViewportIndicator;
