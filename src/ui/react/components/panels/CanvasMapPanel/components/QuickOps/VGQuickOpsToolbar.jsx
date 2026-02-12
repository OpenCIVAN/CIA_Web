/**
 * @file VGQuickOpsToolbar.jsx
 * @description Action bar for focused VG mode with template picker,
 * dimension controls, and merge/split/edit buttons.
 */

import React, { memo, useRef, useCallback } from 'react';
import { Icon } from '@UI/react/components/atoms/Icon';
import { LayoutThumbnail } from '@UI/react/components/atoms/LayoutThumbnail';
import { DropdownPortal, useDropdown } from '@UI/react/components/atoms/DropdownPortal';
import { TemplatePicker } from './TemplatePicker';
import { DimensionControls } from './DimensionControls';
import { LAYOUTS } from '../../utils/constants';
import './VGQuickOpsToolbar.scss';

/**
 * VGQuickOpsToolbar - action bar in focused VG mode
 *
 * @param {Object} props
 * @param {Object} props.focusedVG - Currently focused ViewGroup
 * @param {Object} props.focusedLayout - LAYOUTS entry for focused VG
 * @param {Array} props.focusedSlots - Slot data for focused VG
 * @param {Array} props.cells - Cell descriptors from getInternalCells
 * @param {Object} props.canvas - Canvas data { rows, cols }
 * @param {Array} props.viewGroups - Active view groups (for collision checks)
 * @param {Object} props.quickOps - Quick ops state from useVGQuickOps
 * @param {Function} props.onApplyTemplate - (layoutId) handler
 * @param {Function} props.onResizeInternal - ({ rows, cols }) handler
 * @param {Function} props.onResizeFootprint - ({ rowSpan, colSpan, direction }) handler
 * @param {Function} props.onMergeCells - (cellIndices) handler
 * @param {Function} props.onSplitCell - (cellIndex) handler
 * @param {Function} props.onOpenEditor - () handler
 */
export const VGQuickOpsToolbar = memo(function VGQuickOpsToolbar({
  focusedVG,
  focusedLayout,
  focusedSlots,
  cells,
  canvas,
  viewGroups,
  quickOps,
  onApplyTemplate,
  onResizeInternal,
  onResizeFootprint,
  onMergeCells,
  onSplitCell,
  onOpenEditor,
}) {
  const templateDropdown = useDropdown();

  const layout = focusedLayout || LAYOUTS.single;
  const layoutId = focusedVG?.layoutId || 'single';
  const pos = focusedVG?.position;

  // Merge button gating
  const canMerge = quickOps.isRectangularSelection && quickOps.selectedCells.size > 1;
  const mergeTooltip = canMerge
    ? 'Merge selected cells'
    : 'Select a rectangular area to merge';

  // Split button gating
  const canSplit = quickOps.hasMergedCellSelected && quickOps.selectedCells.size === 1;
  const splitTooltip = canSplit
    ? 'Split merged cell'
    : 'Select a merged cell to split';

  const handleMerge = useCallback(() => {
    if (!canMerge) return;
    onMergeCells?.(Array.from(quickOps.selectedCells));
  }, [canMerge, quickOps.selectedCells, onMergeCells]);

  const handleSplit = useCallback(() => {
    if (!canSplit) return;
    const cellIndex = Array.from(quickOps.selectedCells)[0];
    onSplitCell?.(cellIndex);
  }, [canSplit, quickOps.selectedCells, onSplitCell]);

  const handleApply = useCallback((id) => {
    onApplyTemplate?.(id);
    templateDropdown.close();
  }, [onApplyTemplate, templateDropdown]);

  if (!focusedVG) return null;

  return (
    <div className="quick-ops-toolbar">
      {/* Left section: Template picker */}
      <div className="quick-ops-toolbar__section quick-ops-toolbar__section--left">
        <button
          type="button"
          className="quick-ops-toolbar__template-btn"
          ref={templateDropdown.triggerRef}
          onClick={templateDropdown.toggle}
          aria-expanded={templateDropdown.open}
          aria-haspopup
          title="Change layout template"
        >
          <LayoutThumbnail layout={layout} size="sm" highlighted />
          <Icon name="chevronDown" size={12} />
        </button>
        <DropdownPortal
          open={templateDropdown.open}
          onClose={templateDropdown.close}
          triggerRef={templateDropdown.triggerRef}
          position="top"
          align="start"
          offset={6}
        >
          <TemplatePicker
            currentLayout={layoutId}
            currentRows={pos?.rowSpan || layout.rows}
            currentCols={pos?.colSpan || layout.cols}
            onApply={handleApply}
            onClose={templateDropdown.close}
          />
        </DropdownPortal>
      </div>

      {/* Center section: Dimension controls */}
      <div className="quick-ops-toolbar__section quick-ops-toolbar__section--center">
        <DimensionControls
          focusedVG={focusedVG}
          focusedLayout={focusedLayout}
          canvas={canvas}
          viewGroups={viewGroups}
          onResizeInternal={onResizeInternal}
          onResizeFootprint={onResizeFootprint}
        />
      </div>

      {/* Right section: Merge / Split / Edit */}
      <div className="quick-ops-toolbar__section quick-ops-toolbar__section--right">
        <button
          type="button"
          className={`quick-ops-toolbar__merge-btn ${canMerge ? '' : 'quick-ops-toolbar__btn--disabled'}`}
          disabled={!canMerge}
          onClick={handleMerge}
          title={mergeTooltip}
        >
          <Icon name="combine" size={14} />
        </button>
        <button
          type="button"
          className={`quick-ops-toolbar__split-btn ${canSplit ? '' : 'quick-ops-toolbar__btn--disabled'}`}
          disabled={!canSplit}
          onClick={handleSplit}
          title={splitTooltip}
        >
          <Icon name="layers" size={14} />
        </button>
        <button
          type="button"
          className="quick-ops-toolbar__edit-btn"
          onClick={onOpenEditor}
          title="Open VG Editor"
        >
          <Icon name="pencil" size={14} />
        </button>
      </div>
    </div>
  );
});

export default VGQuickOpsToolbar;
