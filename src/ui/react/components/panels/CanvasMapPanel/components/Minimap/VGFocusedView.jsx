/**
 * @file VGFocusedView.jsx
 * @description Container component for the focused VG overlay.
 *
 * Composes VGFocusHeader + FocusedCell grid.
 * Phase 4: adds pointer-based drag, right-click context menu,
 * targeting visuals, and DragGhost rendering.
 */

import React, { memo, useState, useCallback, useRef, useEffect } from 'react';
import { VGFocusHeader } from './VGFocusHeader';
import { FocusedCell } from './FocusedCell';
import { CellContextMenu } from './CellContextMenu';
import { DragGhost } from './DragGhost';

const DRAG_THRESHOLD = 4;

/**
 * @param {Object} props
 * @param {Object} props.focusedVG - The focused ViewGroup
 * @param {Array} props.focusedSlots - Slot data array (view per cell index)
 * @param {Array} props.cells - Cell layout array from getInternalCells
 * @param {number} props.cellSize - Cell size in pixels
 * @param {number} props.renderGap - Gap between cells
 * @param {Function} props.onRename - Rename callback
 * @param {Function} props.onSlotDrop - Slot drop callback (slotIndex, payload)
 * @param {Function} props.onSlotClear - Slot clear callback (slotIndex)
 * @param {Function} props.onBackToCanvas - Exit focus callback
 * @param {Function} props.parseDragPayload - Drag payload parser
 * @param {Function} props.isViewPayload - View payload checker
 * @param {Object} props.quickOps - Quick ops state from useVGQuickOps
 * @param {Function} props.onCellDragComplete - Drag complete handler
 * @param {Function} props.onCellAssign - Assignment handler (cellIndex)
 * @param {Function} props.onTargetingResolve - Targeting resolve handler (targetCellIndex)
 * @param {Function} props.onSplitCell - Split cell handler (cellIndex)
 */
export const VGFocusedView = memo(function VGFocusedView({
  focusedVG,
  focusedSlots,
  cells,
  cellSize,
  renderGap,
  onRename,
  onSlotDrop,
  onSlotClear,
  onBackToCanvas,
  parseDragPayload,
  isViewPayload,
  quickOps,
  onCellDragComplete,
  onCellAssign,
  onTargetingResolve,
  onSplitCell,
}) {
  const [focusedDropIndex, setFocusedDropIndex] = useState(null);
  const dragStartRef = useRef(null);
  const cellRectsRef = useRef([]);

  // ── External drag-drop (from CompanionPanel) ────────────────────────────
  const handleCellDragOver = useCallback((e, cellIndex) => {
    const payload = parseDragPayload(e);
    if (!isViewPayload(payload)) return;
    e.preventDefault();
    e.stopPropagation();
    e.dataTransfer.dropEffect = 'copy';
    setFocusedDropIndex(cellIndex);
  }, [parseDragPayload, isViewPayload]);

  const handleCellDragLeave = useCallback((e) => {
    if (e.currentTarget.contains(e.relatedTarget)) return;
    setFocusedDropIndex(null);
  }, []);

  const handleCellDrop = useCallback((e, cellIndex) => {
    const payload = parseDragPayload(e);
    if (!isViewPayload(payload)) return;
    e.preventDefault();
    e.stopPropagation();
    onSlotDrop?.(cellIndex, payload);
    setFocusedDropIndex(null);
  }, [parseDragPayload, isViewPayload, onSlotDrop]);

  // ── Cell click (with targeting override) ────────────────────────────────
  const handleCellClick = useCallback((cellIndex, e) => {
    // If targeting is active, resolve it
    if (quickOps?.targeting) {
      onTargetingResolve?.(cellIndex);
      return;
    }
    quickOps?.selectCell(cellIndex, { shift: e?.shiftKey || false });
  }, [quickOps, onTargetingResolve]);

  // ── Pointer-based drag (follows edit-mode VG move pattern) ──────────────
  const handleCellPointerDown = useCallback((cellIndex, view, e) => {
    if (!view || !quickOps || e.button !== 0) return;
    // Don't start drag if targeting is active
    if (quickOps.targeting) return;

    e.preventDefault();
    const startX = e.clientX;
    const startY = e.clientY;
    let isDragging = false;

    dragStartRef.current = { cellIndex, view, startX, startY };

    const handlePointerMove = (moveEvt) => {
      const dx = moveEvt.clientX - startX;
      const dy = moveEvt.clientY - startY;

      if (!isDragging) {
        if (Math.sqrt(dx * dx + dy * dy) < DRAG_THRESHOLD) return;
        isDragging = true;
        quickOps.startDrag(cellIndex, view);
      }

      quickOps.updateDragGhost(moveEvt.clientX, moveEvt.clientY);
    };

    const handlePointerUp = (upEvt) => {
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
      dragStartRef.current = null;

      if (!isDragging) {
        // Threshold not crossed — treat as click
        return;
      }

      // Hit-test against cell rects to find target
      const targetCellIndex = hitTestCells(upEvt.clientX, upEvt.clientY, cellIndex);
      const dragInfo = quickOps.endDrag();

      if (dragInfo && targetCellIndex !== null && targetCellIndex !== cellIndex) {
        const targetView = focusedSlots?.[targetCellIndex] || null;
        onCellDragComplete?.({
          sourceCellIndex: cellIndex,
          targetCellIndex,
          sourceView: view,
          targetView,
        });
      }
    };

    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp);
  }, [quickOps, focusedSlots, onCellDragComplete]);

  // Hit-test pointer position against rendered cell rects
  const hitTestCells = useCallback((clientX, clientY, excludeIndex) => {
    const rects = cellRectsRef.current;
    for (let i = 0; i < rects.length; i++) {
      if (i === excludeIndex) continue;
      const rect = rects[i];
      if (!rect) continue;
      if (clientX >= rect.left && clientX <= rect.right &&
          clientY >= rect.top && clientY <= rect.bottom) {
        return i;
      }
    }
    return null;
  }, []);

  // Ref callback to capture cell DOM rects
  const setCellRef = useCallback((index, el) => {
    if (el) {
      cellRectsRef.current[index] = el.getBoundingClientRect();
    }
  }, []);

  // ── Context menu ────────────────────────────────────────────────────────
  const handleContextMenu = useCallback((cellIndex, view, isMerged, e) => {
    e.preventDefault();
    quickOps?.openContextMenu(cellIndex, { x: e.clientX, y: e.clientY }, view, isMerged);
  }, [quickOps]);

  // Context menu action handlers
  const handleSwapWith = useCallback(() => {
    const cm = quickOps?.contextMenu;
    if (!cm) return;
    quickOps.enterTargeting('swap', cm.cellIndex, cm.cellView);
  }, [quickOps]);

  const handleMoveTo = useCallback(() => {
    const cm = quickOps?.contextMenu;
    if (!cm) return;
    quickOps.enterTargeting('move', cm.cellIndex, cm.cellView);
  }, [quickOps]);

  const handleDuplicateTo = useCallback(() => {
    const cm = quickOps?.contextMenu;
    if (!cm) return;
    quickOps.enterTargeting('clone', cm.cellIndex, cm.cellView);
  }, [quickOps]);

  const handleRemoveFromCell = useCallback(() => {
    const cm = quickOps?.contextMenu;
    if (!cm) return;
    onSlotClear?.(cm.cellIndex);
  }, [quickOps, onSlotClear]);

  const handleAssignView = useCallback(() => {
    const cm = quickOps?.contextMenu;
    if (!cm) return;
    onCellAssign?.(cm.cellIndex);
  }, [quickOps, onCellAssign]);

  const handleSplitCell = useCallback(() => {
    const cm = quickOps?.contextMenu;
    if (!cm) return;
    onSplitCell?.(cm.cellIndex);
  }, [quickOps, onSplitCell]);

  // ── Empty cell "+" click ────────────────────────────────────────────────
  const handleAssignEmpty = useCallback((cellIndex) => {
    if (quickOps?.targeting) {
      onTargetingResolve?.(cellIndex);
      return;
    }
    onCellAssign?.(cellIndex);
  }, [quickOps, onTargetingResolve, onCellAssign]);

  // ── Keyboard: arrow key navigation between cells ───────────────────────
  const gridRef = useRef(null);

  const handleGridKeyDown = useCallback((e) => {
    if (!gridRef.current || !cells.length) return;
    const arrows = { ArrowUp: true, ArrowDown: true, ArrowLeft: true, ArrowRight: true };
    if (!arrows[e.key]) return;

    e.preventDefault();
    const focused = document.activeElement;
    const cellEls = Array.from(gridRef.current.querySelectorAll('[role="gridcell"]'));
    const currentIdx = cellEls.indexOf(focused);
    if (currentIdx < 0) {
      cellEls[0]?.focus();
      return;
    }

    // Determine grid columns from layout
    const layoutCols = focusedVG?.layoutId
      ? (cells.length > 0 ? Math.round(Math.sqrt(cells.length)) : 1)
      : 1;
    // Better: compute from cell positions
    const colSet = new Set(cells.map(c => c.col !== undefined ? c.col : 0));
    const gridCols = colSet.size || 1;

    let nextIdx = currentIdx;
    if (e.key === 'ArrowRight') nextIdx = Math.min(currentIdx + 1, cellEls.length - 1);
    if (e.key === 'ArrowLeft') nextIdx = Math.max(currentIdx - 1, 0);
    if (e.key === 'ArrowDown') nextIdx = Math.min(currentIdx + gridCols, cellEls.length - 1);
    if (e.key === 'ArrowUp') nextIdx = Math.max(currentIdx - gridCols, 0);

    if (nextIdx !== currentIdx) {
      cellEls[nextIdx]?.focus();
    }
  }, [cells, focusedVG?.layoutId]);

  const pos = focusedVG?.position;
  if (!pos) return null;

  const overlayWidth = pos.colSpan * cellSize + (pos.colSpan - 1) * renderGap;
  const overlayHeight = pos.rowSpan * cellSize + (pos.rowSpan - 1) * renderGap;
  const renderPitch = cellSize + renderGap;

  const { targeting, dragState } = quickOps || {};

  return (
    <div
      className="minimap__focused-overlay"
      style={{
        left: pos.col * renderPitch,
        top: pos.row * renderPitch,
        width: overlayWidth,
        height: overlayHeight,
        '--vg-color': focusedVG.color,
      }}
    >
      <VGFocusHeader
        focusedVG={focusedVG}
        onBackToCanvas={onBackToCanvas}
        onRename={onRename}
      />

      <div
        className="minimap__focused-cells"
        ref={gridRef}
        role="grid"
        aria-label={`${focusedVG.name || 'ViewGroup'} cells`}
        onKeyDown={handleGridKeyDown}
      >
        {cells.map((cell, i) => {
          const view = focusedSlots?.[i] || null;
          const isDropTarget = focusedDropIndex === i;
          const isSelected = quickOps?.selectedCells?.has(i) || false;

          // Drag visual states
          const isDragSource = dragState?.sourceCellIndex === i;
          const isDragTarget = dragState && !isDragSource && i !== dragState.sourceCellIndex;

          // Targeting visual states
          let isTargetingValid = false;
          let isTargetingPulse = false;
          if (targeting && i !== targeting.sourceCellIndex) {
            if (targeting.action === 'swap') {
              isTargetingValid = !!view;
              isTargetingPulse = !!view;
            } else {
              // move or clone — target must be empty
              isTargetingValid = !view;
            }
          }

          // Assigning state
          const isAssigning = quickOps?.assigningCellIndex === i;

          return (
            <FocusedCell
              key={i}
              ref={(el) => setCellRef(i, el)}
              cell={cell}
              view={view}
              vgColor={focusedVG.color}
              isSelected={isSelected}
              isDropTarget={isDropTarget}
              isDragSource={isDragSource}
              isDragTarget={isDragTarget}
              isTargetingValid={isTargetingValid}
              isTargetingPulse={isTargetingPulse}
              isAssigning={isAssigning}
              onClick={(e) => handleCellClick(i, e)}
              onDragOver={(e) => handleCellDragOver(e, i)}
              onDragLeave={handleCellDragLeave}
              onDrop={(e) => handleCellDrop(e, i)}
              onClearView={() => onSlotClear?.(i)}
              onContextMenu={(e) => handleContextMenu(i, view, cell.isMerged || false, e)}
              onPointerDown={view ? (e) => handleCellPointerDown(i, view, e) : undefined}
              onAssign={() => handleAssignEmpty(i)}
              targeting={!!targeting}
              animationDelay={i * 30}
            />
          );
        })}
      </div>

      {/* Context menu portal */}
      {quickOps?.contextMenu && (
        <CellContextMenu
          view={quickOps.contextMenu.cellView}
          cell={cells[quickOps.contextMenu.cellIndex]}
          position={quickOps.contextMenu.position}
          vgColor={focusedVG.color}
          vgName={focusedVG.name}
          isMerged={quickOps.contextMenu.cellIsMerged}
          onClose={quickOps.closeContextMenu}
          onSwapWith={handleSwapWith}
          onMoveTo={handleMoveTo}
          onDuplicateTo={handleDuplicateTo}
          onRemove={handleRemoveFromCell}
          onAssignView={handleAssignView}
          onSplitCell={handleSplitCell}
        />
      )}

      {/* Drag ghost portal */}
      {dragState && (
        <DragGhost
          view={dragState.sourceView}
          vgColor={focusedVG.color}
          x={dragState.ghostX}
          y={dragState.ghostY}
        />
      )}
    </div>
  );
});

export default VGFocusedView;
