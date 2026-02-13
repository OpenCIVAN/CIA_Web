/**
 * @file EditModeBar.jsx
 * @description Amber-themed bar displayed between Minimap and BottomPanel
 * when in transactional edit mode. Shows pending change count, commit, and discard buttons.
 */

import React, { memo } from 'react';
import { Icon } from '@UI/react/components/atoms/Icon';
import './EditModeBar.scss';

/**
 * EditModeBar - Commit/discard bar for transactional editing
 *
 * @param {Object} props
 * @param {number} props.pendingChangeCount - Number of staged changes
 * @param {Function} props.onCommit - Commit all staged changes
 * @param {Function} props.onDiscard - Discard all staged changes
 * @param {number|null} props.timeRemaining - Seconds remaining on lock timer
 * @param {boolean} props.isWarning - Whether timer is in warning state (<=60s)
 * @param {Function} props.onExtend - Extend editing time callback
 * @param {boolean} props.canUndo - Whether undo is available
 * @param {boolean} props.canRedo - Whether redo is available
 * @param {Function} props.onUndo - Undo last operation
 * @param {Function} props.onRedo - Redo last undone operation
 */
export const EditModeBar = memo(function EditModeBar({
  pendingChangeCount = 0,
  onCommit,
  onDiscard,
  timeRemaining,
  isWarning,
  onExtend,
  canUndo = false,
  canRedo = false,
  onUndo,
  onRedo,
}) {
  const hasChanges = pendingChangeCount > 0;

  return (
    <div className="edit-mode-bar">
      <div className="edit-mode-bar__meta">
        <div className="edit-mode-bar__status">
          <Icon name="pencil" size={12} />
          <span className="edit-mode-bar__label">EDITING</span>
          <span className="edit-mode-bar__count">
            {pendingChangeCount} change{pendingChangeCount !== 1 ? 's' : ''}
          </span>
        </div>

        {timeRemaining != null && (
          <div className={`edit-mode-bar__timer ${isWarning ? 'edit-mode-bar__timer--warning' : ''}`}>
            <Icon name="clock" size={12} />
            <span>
              {Math.floor(timeRemaining / 60)}:{String(Math.round(timeRemaining) % 60).padStart(2, '0')}
            </span>
          </div>
        )}
      </div>

      <div className="edit-mode-bar__actions">
        {onUndo && (
          <button
            type="button"
            className="edit-mode-bar__btn edit-mode-bar__btn--undo"
            onClick={onUndo}
            disabled={!canUndo}
            title="Undo (Ctrl+Z)"
            aria-label="Undo"
          >
            <Icon name="undo" size={12} />
            <span className="edit-mode-bar__btn-label">Undo</span>
          </button>
        )}
        {onRedo && (
          <button
            type="button"
            className="edit-mode-bar__btn edit-mode-bar__btn--redo"
            onClick={onRedo}
            disabled={!canRedo}
            title="Redo (Ctrl+Shift+Z)"
            aria-label="Redo"
          >
            <Icon name="redo" size={12} />
            <span className="edit-mode-bar__btn-label">Redo</span>
          </button>
        )}
        {onExtend && (
          <button
            type="button"
            className="edit-mode-bar__btn edit-mode-bar__btn--extend"
            onClick={onExtend}
            title="Extend editing time"
            aria-label="Extend editing time"
          >
            <Icon name="clock" size={12} />
            <span className="edit-mode-bar__btn-label">Extend</span>
          </button>
        )}
        <button
          type="button"
          className="edit-mode-bar__btn edit-mode-bar__btn--discard"
          onClick={onDiscard}
          title="Discard all changes"
          aria-label="Discard all changes"
        >
          <Icon name="close" size={12} />
          <span className="edit-mode-bar__btn-label">Discard</span>
        </button>
        <button
          type="button"
          className="edit-mode-bar__btn edit-mode-bar__btn--commit"
          onClick={onCommit}
          disabled={!hasChanges}
          title={hasChanges ? 'Commit all changes' : 'No changes to commit'}
          aria-label="Commit all changes"
        >
          <Icon name="check" size={12} />
          <span className="edit-mode-bar__btn-label">Commit</span>
        </button>
      </div>
    </div>
  );
});

export default EditModeBar;
