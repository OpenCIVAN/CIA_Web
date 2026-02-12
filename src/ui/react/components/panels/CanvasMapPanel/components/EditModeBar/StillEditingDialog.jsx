/**
 * @file StillEditingDialog.jsx
 * @description Three-button expiry prompt shown when the edit session timer reaches 0.
 * Uses the base Modal component with Extend / Commit / Discard actions
 * and an auto-discard countdown.
 */

import React from 'react';
import { Modal } from '@UI/react/components/modals/Modal';
import { Icon } from '@UI/react/components/atoms/Icon';

export function StillEditingDialog({
  isOpen,
  onClose,
  onExtend,
  onCommit,
  onDiscard,
  pendingChangeCount = 0,
  graceTimeRemaining = null,
}) {
  const hasChanges = pendingChangeCount > 0;

  const footer = (
    <>
      <button type="button" className="btn btn--secondary" onClick={onDiscard}>
        Discard
      </button>
      {hasChanges && (
        <button type="button" className="btn btn--primary" onClick={onCommit}>
          Commit ({pendingChangeCount})
        </button>
      )}
      <button type="button" className="btn btn--warning" onClick={onExtend}>
        Extend
      </button>
    </>
  );

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Still editing?"
      icon={() => <Icon name="clock" size={18} />}
      severity="warning"
      size="sm"
      closeOnBackdrop={false}
      footer={footer}
    >
      <p style={{ margin: 0, color: 'var(--text-secondary)' }}>
        Your edit session has expired.
        {hasChanges
          ? ` You have ${pendingChangeCount} pending change${pendingChangeCount !== 1 ? 's' : ''}.`
          : ' No changes were made.'}
        {' '}Other collaborators are waiting.
        {graceTimeRemaining != null && (
          <span style={{ display: 'block', marginTop: 8, fontWeight: 600, color: 'var(--accent-red, #ef4444)' }}>
            Auto-discarding in {graceTimeRemaining}s...
          </span>
        )}
      </p>
    </Modal>
  );
}
