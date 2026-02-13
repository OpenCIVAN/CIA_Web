/**
 * @file VGContextBar.jsx
 * @description Context bar shown below the minimap when a VG is selected or focused.
 *
 * Renders a unified action bar for both selected and focused VGs,
 * with dimension controls shown below.
 */

import React, { memo, useRef, useCallback, useState, useEffect } from 'react';
import { Icon } from '@UI/react/components/atoms/Icon';
import { LayoutThumbnail } from '@UI/react/components/atoms/LayoutThumbnail';
import { DimensionControls } from './DimensionControls';
import { LAYOUTS } from '../../utils/constants';
import { getVGDisplayName } from '../../utils/gridUtils';
import './VGContextBar.scss';

/**
 * VGContextBar — context bar below minimap for selected/focused VG
 */
export const VGContextBar = memo(function VGContextBar({
  // Selection state
  selectedVG,
  focusedVG,

  // Dimension control props
  canvas,
  viewGroups,
  onResizeInternal,
  onResizeFootprint,
  onRename,

  // Selected-mode actions
  onDeselect,
  onDuplicate,
  onSaveTemplate,
  onDelete,
  onEditVG,
}) {
  // Inline rename state for selected mode
  const [isRenaming, setIsRenaming] = useState(false);
  const [nameDraft, setNameDraft] = useState('');
  const inputRef = useRef(null);

  const activeVG = focusedVG || selectedVG;
  const isFocused = !!focusedVG;
  const showDimensions = !!focusedVG;

  // Reset rename state when VG changes
  useEffect(() => {
    if (!activeVG) {
      setNameDraft('');
      setIsRenaming(false);
      return;
    }
    setNameDraft(activeVG.name || getVGDisplayName(activeVG));
    setIsRenaming(false);
  }, [activeVG?.id, activeVG?.name]);

  useEffect(() => {
    if (isRenaming && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isRenaming]);

  const commitRename = useCallback(() => {
    if (!activeVG) return;
    const trimmed = nameDraft.trim();
    if (!trimmed) {
      setNameDraft(activeVG.name || getVGDisplayName(activeVG));
      return;
    }
    if (trimmed !== (activeVG.name || '')) {
      onRename?.(trimmed);
    }
  }, [activeVG, nameDraft, onRename]);

  if (!activeVG) return null;

  // Selected mode: simpler context bar
  const displayName = activeVG.name || getVGDisplayName(activeVG);
  const layout = LAYOUTS[activeVG.layoutId] || LAYOUTS.single;

  return (
    <div
      className={`vg-context-stack ${showDimensions ? 'vg-context-stack--with-dims' : 'vg-context-stack--solo'}`}
      style={{ '--vg-color': activeVG.color }}
    >
      <div className="vg-context-bar">
        <div className="vg-context-bar__left">
          <div
            className="vg-context-bar__dot"
            style={{ background: activeVG.color }}
          />
        {isRenaming ? (
          <input
            ref={inputRef}
            type="text"
            className="vg-context-bar__name-input"
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
                setNameDraft(activeVG.name || getVGDisplayName(activeVG));
              }
            }}
          />
        ) : (
          <button
            type="button"
            className="vg-context-bar__name"
            title="Click to rename"
            onClick={() => setIsRenaming(true)}
          >
            <span style={{ color: activeVG.color }}>{displayName}</span>
            <Icon name="pencil" size={10} className="vg-context-bar__rename-icon" />
          </button>
        )}
        <LayoutThumbnail layout={layout} size="sm" />
        </div>

        <div className="vg-context-bar__spacer" />

        <div className="vg-context-bar__actions">
          {!isFocused && (
            <button
              type="button"
              className="vg-context-bar__action-btn"
              onClick={() => onEditVG?.(activeVG)}
              title="Edit ViewGroup"
            >
              <Icon name="pencil" size={14} />
            </button>
          )}
          <button
            type="button"
            className="vg-context-bar__action-btn"
            onClick={() => onDuplicate?.(activeVG.id)}
            title="Duplicate"
          >
            <Icon name="copy" size={14} />
          </button>
          <button
            type="button"
            className="vg-context-bar__action-btn"
            onClick={() => onSaveTemplate?.('personal')}
            title="Save template"
          >
            <Icon name="save" size={14} />
          </button>
          <button
            type="button"
            className="vg-context-bar__action-btn"
            onClick={() => onSaveTemplate?.('project')}
            title="Share template"
          >
            <Icon name="share" size={14} />
          </button>
          <button
            type="button"
            className="vg-context-bar__action-btn vg-context-bar__action-btn--danger"
            onClick={() => onDelete?.(activeVG.id)}
            title="Delete"
          >
            <Icon name="trash" size={14} />
          </button>
          {!isFocused && (
            <button
              type="button"
              className="vg-context-bar__action-btn vg-context-bar__action-btn--close"
              onClick={onDeselect}
              title="Deselect"
            >
              <Icon name="close" size={14} />
            </button>
          )}
        </div>
      </div>

      {showDimensions && (
        <div className="vg-context-bar__dimensions">
          <DimensionControls
            focusedVG={activeVG}
            focusedLayout={layout}
            canvas={canvas}
            viewGroups={viewGroups}
            onResizeInternal={onResizeInternal}
            onResizeFootprint={onResizeFootprint}
          />
        </div>
      )}
    </div>
  );
});

export default VGContextBar;
