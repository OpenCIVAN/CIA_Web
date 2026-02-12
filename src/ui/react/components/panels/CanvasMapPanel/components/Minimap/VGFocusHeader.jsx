/**
 * @file VGFocusHeader.jsx
 * @description Header for the focused VG overlay — breadcrumb, color dot, inline rename, dimension badges.
 *
 * Extracted from Minimap.jsx inline header (lines 834-869 in original).
 */

import React, { memo, useState, useEffect, useCallback, useRef } from 'react';
import { Icon } from '@UI/react/components/atoms/Icon';
import { LAYOUTS } from '../../utils/constants';
import { getVGDisplayName, formatRangeRef } from '../../utils/gridUtils';

/**
 * @param {Object} props
 * @param {Object} props.focusedVG - The focused ViewGroup
 * @param {Function} props.onBackToCanvas - Callback to exit focus
 * @param {Function} props.onRename - Callback with new name string
 */
export const VGFocusHeader = memo(function VGFocusHeader({ focusedVG, onBackToCanvas, onRename }) {
  const [isRenaming, setIsRenaming] = useState(false);
  const [nameDraft, setNameDraft] = useState('');
  const inputRef = useRef(null);

  // Reset draft when focusedVG changes
  useEffect(() => {
    if (!focusedVG) {
      setNameDraft('');
      setIsRenaming(false);
      return;
    }
    setNameDraft(focusedVG.name || getVGDisplayName(focusedVG));
    setIsRenaming(false);
  }, [focusedVG?.id, focusedVG?.name]);

  // Auto-focus input when renaming starts
  useEffect(() => {
    if (isRenaming && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isRenaming]);

  const commitRename = useCallback(() => {
    if (!focusedVG) return;
    const trimmed = nameDraft.trim();
    if (!trimmed) {
      setNameDraft(focusedVG.name || getVGDisplayName(focusedVG));
      return;
    }
    if (trimmed === (focusedVG.name || '')) {
      return;
    }
    onRename?.(trimmed);
  }, [focusedVG, nameDraft, onRename]);

  const layout = focusedVG ? (LAYOUTS[focusedVG.layoutId] || LAYOUTS.single) : null;
  const pos = focusedVG?.position;

  return (
    <div className="minimap__focused-header">
      {/* Breadcrumb back button */}
      <button
        type="button"
        className="minimap__focused-breadcrumb"
        onClick={(e) => {
          e.stopPropagation();
          onBackToCanvas?.();
        }}
      >
        <Icon name="chevronLeft" size={10} />
        Canvas
      </button>

      <span className="minimap__focused-header-sep">/</span>

      {/* Color dot */}
      <span
        className="minimap__focused-dot"
        style={{ background: focusedVG?.color }}
      />

      {/* Inline name / rename */}
      {isRenaming ? (
        <input
          ref={inputRef}
          type="text"
          className="minimap__focused-name-input"
          value={nameDraft}
          onChange={(e) => setNameDraft(e.target.value)}
          onBlur={() => {
            setIsRenaming(false);
            commitRename();
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              setIsRenaming(false);
              commitRename();
            }
            if (e.key === 'Escape') {
              setIsRenaming(false);
              setNameDraft(focusedVG.name || getVGDisplayName(focusedVG));
            }
          }}
        />
      ) : (
        <button
          type="button"
          className="minimap__focused-name"
          title="Click to rename ViewGroup"
          onClick={(e) => {
            e.stopPropagation();
            setIsRenaming(true);
          }}
        >
          {focusedVG?.name || getVGDisplayName(focusedVG)}
          <Icon name="pencil" size={12} />
        </button>
      )}

      {/* Dimension badges */}
      {layout && (
        <span className="minimap__focused-badge">
          {layout.rows}&times;{layout.cols} grid
        </span>
      )}
      {pos && (
        <span className="minimap__focused-badge">
          {formatRangeRef(pos.row, pos.col, pos.rowSpan, pos.colSpan)}
        </span>
      )}
    </div>
  );
});

export default VGFocusHeader;
