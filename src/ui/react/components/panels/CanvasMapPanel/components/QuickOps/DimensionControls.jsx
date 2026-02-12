/**
 * @file DimensionControls.jsx
 * @description Two-row dimension display with ± buttons for internal grid and canvas footprint.
 */

import React, { memo, useState, useCallback, useMemo } from 'react';
import { DirectionPicker } from '@UI/react/components/atoms/DirectionPicker';
import { formatRangeRef } from '../../utils/gridUtils';
import { LAYOUTS } from '../../utils/constants';

const MIN_DIM = 1;
const MAX_DIM = 10;

/**
 * Check which directions are free for footprint expansion
 * @returns {{ row: string[], col: string[] }} free directions per axis
 */
function checkExpansionDirections(focusedVG, viewGroups, canvas) {
  if (!focusedVG?.position) return { row: [], col: [], conflicts: {} };
  const pos = focusedVG.position;

  const rectsOverlap = (a, b) => (
    a.row < b.row + b.rowSpan &&
    a.row + a.rowSpan > b.row &&
    a.col < b.col + b.colSpan &&
    a.col + a.colSpan > b.col
  );

  const neighbors = (viewGroups || []).filter(
    (vg) => vg.id !== focusedVG.id && vg.position
  );

  const result = { row: [], col: [], conflicts: {} };

  // Row expansion (adding a row): check down and up
  const expandDown = { ...pos, rowSpan: pos.rowSpan + 1 };
  const expandUp = { row: pos.row - 1, col: pos.col, rowSpan: pos.rowSpan + 1, colSpan: pos.colSpan };

  const downBlocked = pos.row + pos.rowSpan >= (canvas?.rows || 99) ||
    neighbors.some((vg) => rectsOverlap(expandDown, vg.position));
  const upBlocked = pos.row <= 0 ||
    neighbors.some((vg) => rectsOverlap(expandUp, vg.position));

  if (!downBlocked) result.row.push('down');
  if (!upBlocked) result.row.push('up');

  if (downBlocked) {
    const blocker = neighbors.find((vg) => rectsOverlap(expandDown, vg.position));
    if (blocker) result.conflicts.down = blocker.name || blocker.id;
  }
  if (upBlocked) {
    const blocker = neighbors.find((vg) => rectsOverlap(expandUp, vg.position));
    if (blocker) result.conflicts.up = blocker.name || blocker.id;
  }

  // Col expansion: check right and left
  const expandRight = { ...pos, colSpan: pos.colSpan + 1 };
  const expandLeft = { row: pos.row, col: pos.col - 1, rowSpan: pos.rowSpan, colSpan: pos.colSpan + 1 };

  const rightBlocked = pos.col + pos.colSpan >= (canvas?.cols || 99) ||
    neighbors.some((vg) => rectsOverlap(expandRight, vg.position));
  const leftBlocked = pos.col <= 0 ||
    neighbors.some((vg) => rectsOverlap(expandLeft, vg.position));

  if (!rightBlocked) result.col.push('right');
  if (!leftBlocked) result.col.push('left');

  if (rightBlocked) {
    const blocker = neighbors.find((vg) => rectsOverlap(expandRight, vg.position));
    if (blocker) result.conflicts.right = blocker.name || blocker.id;
  }
  if (leftBlocked) {
    const blocker = neighbors.find((vg) => rectsOverlap(expandLeft, vg.position));
    if (blocker) result.conflicts.left = blocker.name || blocker.id;
  }

  return result;
}

/**
 * DimensionControls - ± controls for internal grid and footprint
 *
 * @param {Object} props
 * @param {Object} props.focusedVG - Currently focused ViewGroup
 * @param {Object} props.focusedLayout - LAYOUTS entry for the focused VG
 * @param {Object} props.canvas - Canvas data { rows, cols }
 * @param {Array} props.viewGroups - All active view groups for collision checks
 * @param {Function} props.onResizeInternal - ({ rows, cols }) handler
 * @param {Function} props.onResizeFootprint - ({ rowSpan, colSpan, direction }) handler
 */
export const DimensionControls = memo(function DimensionControls({
  focusedVG,
  focusedLayout,
  canvas,
  viewGroups,
  onResizeInternal,
  onResizeFootprint,
}) {
  const [showRowPicker, setShowRowPicker] = useState(false);
  const [showColPicker, setShowColPicker] = useState(false);

  const layout = focusedLayout || LAYOUTS.single;
  const internalRows = layout.rows || 1;
  const internalCols = layout.cols || 1;
  const pos = focusedVG?.position;
  const footprintRows = pos?.rowSpan || 1;
  const footprintCols = pos?.colSpan || 1;

  const expansion = useMemo(
    () => checkExpansionDirections(focusedVG, viewGroups, canvas),
    [focusedVG, viewGroups, canvas]
  );

  // Internal grid handlers
  const handleInternalRowMinus = useCallback(() => {
    if (internalRows <= MIN_DIM) return;
    onResizeInternal?.({ rows: internalRows - 1, cols: internalCols });
  }, [internalRows, internalCols, onResizeInternal]);

  const handleInternalRowPlus = useCallback(() => {
    if (internalRows >= MAX_DIM) return;
    onResizeInternal?.({ rows: internalRows + 1, cols: internalCols });
  }, [internalRows, internalCols, onResizeInternal]);

  const handleInternalColMinus = useCallback(() => {
    if (internalCols <= MIN_DIM) return;
    onResizeInternal?.({ rows: internalRows, cols: internalCols - 1 });
  }, [internalRows, internalCols, onResizeInternal]);

  const handleInternalColPlus = useCallback(() => {
    if (internalCols >= MAX_DIM) return;
    onResizeInternal?.({ rows: internalRows, cols: internalCols + 1 });
  }, [internalRows, internalCols, onResizeInternal]);

  // Footprint handlers
  const handleFootprintRowPlus = useCallback(() => {
    const freeRows = expansion.row;
    if (freeRows.length === 0) return;
    if (freeRows.length === 1) {
      onResizeFootprint?.({ rowSpan: footprintRows + 1, colSpan: footprintCols, direction: freeRows[0] });
      return;
    }
    // Ambiguous — show picker
    setShowRowPicker(true);
  }, [expansion.row, footprintRows, footprintCols, onResizeFootprint]);

  const handleFootprintRowMinus = useCallback(() => {
    if (footprintRows <= 1) return;
    onResizeFootprint?.({ rowSpan: footprintRows - 1, colSpan: footprintCols, direction: 'shrink' });
  }, [footprintRows, footprintCols, onResizeFootprint]);

  const handleFootprintColPlus = useCallback(() => {
    const freeCols = expansion.col;
    if (freeCols.length === 0) return;
    if (freeCols.length === 1) {
      onResizeFootprint?.({ rowSpan: footprintRows, colSpan: footprintCols + 1, direction: freeCols[0] });
      return;
    }
    setShowColPicker(true);
  }, [expansion.col, footprintRows, footprintCols, onResizeFootprint]);

  const handleFootprintColMinus = useCallback(() => {
    if (footprintCols <= 1) return;
    onResizeFootprint?.({ rowSpan: footprintRows, colSpan: footprintCols - 1, direction: 'shrink' });
  }, [footprintRows, footprintCols, onResizeFootprint]);

  const handleRowPickerSelect = useCallback((direction) => {
    setShowRowPicker(false);
    onResizeFootprint?.({ rowSpan: footprintRows + 1, colSpan: footprintCols, direction });
  }, [footprintRows, footprintCols, onResizeFootprint]);

  const handleColPickerSelect = useCallback((direction) => {
    setShowColPicker(false);
    onResizeFootprint?.({ rowSpan: footprintRows, colSpan: footprintCols + 1, direction });
  }, [footprintRows, footprintCols, onResizeFootprint]);

  const rangeRef = pos
    ? formatRangeRef(pos.row, pos.col, pos.rowSpan, pos.colSpan)
    : '—';

  const rowPlusDisabled = expansion.row.length === 0;
  const colPlusDisabled = expansion.col.length === 0;

  // Build conflict tooltip text
  const rowConflictTip = rowPlusDisabled
    ? `Blocked${expansion.conflicts.down ? ` by ${expansion.conflicts.down}` : ''}`
    : '';
  const colConflictTip = colPlusDisabled
    ? `Blocked${expansion.conflicts.right ? ` by ${expansion.conflicts.right}` : ''}`
    : '';

  return (
    <div className="dim-controls">
      {/* Row 1: Internal grid */}
      <div className="dim-controls__row">
        <span className="dim-controls__label">Internal:</span>
        <button
          type="button"
          className="dim-controls__btn"
          disabled={internalRows <= MIN_DIM}
          onClick={handleInternalRowMinus}
          title="Decrease rows"
        >−</button>
        <span className="dim-controls__value">{internalRows}</span>
        <button
          type="button"
          className="dim-controls__btn"
          disabled={internalRows >= MAX_DIM}
          onClick={handleInternalRowPlus}
          title="Increase rows"
        >+</button>
        <span className="dim-controls__sep">×</span>
        <button
          type="button"
          className="dim-controls__btn"
          disabled={internalCols <= MIN_DIM}
          onClick={handleInternalColMinus}
          title="Decrease columns"
        >−</button>
        <span className="dim-controls__value">{internalCols}</span>
        <button
          type="button"
          className="dim-controls__btn"
          disabled={internalCols >= MAX_DIM}
          onClick={handleInternalColPlus}
          title="Increase columns"
        >+</button>
      </div>

      {/* Row 2: Footprint */}
      <div className="dim-controls__row">
        <span className="dim-controls__label">Footprint:</span>
        <button
          type="button"
          className="dim-controls__btn"
          disabled={footprintRows <= 1}
          onClick={handleFootprintRowMinus}
          title="Shrink row span"
        >−</button>
        <span className="dim-controls__value">{footprintRows}</span>
        <div className="dim-controls__plus-wrapper">
          <button
            type="button"
            className="dim-controls__btn"
            disabled={rowPlusDisabled}
            onClick={handleFootprintRowPlus}
            title={rowConflictTip || 'Expand row span'}
          >+</button>
          {showRowPicker && (
            <div className="dim-controls__picker-popup">
              <DirectionPicker
                axis="row"
                onSelect={handleRowPickerSelect}
                size="sm"
              />
            </div>
          )}
        </div>
        <span className="dim-controls__sep">×</span>
        <button
          type="button"
          className="dim-controls__btn"
          disabled={footprintCols <= 1}
          onClick={handleFootprintColMinus}
          title="Shrink col span"
        >−</button>
        <span className="dim-controls__value">{footprintCols}</span>
        <div className="dim-controls__plus-wrapper">
          <button
            type="button"
            className="dim-controls__btn"
            disabled={colPlusDisabled}
            onClick={handleFootprintColPlus}
            title={colConflictTip || 'Expand col span'}
          >+</button>
          {showColPicker && (
            <div className="dim-controls__picker-popup">
              <DirectionPicker
                axis="col"
                onSelect={handleColPickerSelect}
                size="sm"
              />
            </div>
          )}
        </div>
        <span className="dim-controls__ref">{rangeRef}</span>
      </div>
    </div>
  );
});

export default DimensionControls;
