/**
 * @file AssignmentBanner.jsx
 * @description Banner shown at the top of the CompanionPanel when a view
 * assignment is in progress (from focused mode or VG Editor).
 */

import React, { memo } from 'react';
import { Icon } from '@UI/react/components/atoms/Icon';

/**
 * @param {Object} props
 * @param {string} props.targetLabel - Formatted target label (e.g. "Analysis -> B2")
 * @param {string} props.vgColor - VG color for left border accent
 * @param {Function} props.onCancel - Cancel assignment handler
 */
export const AssignmentBanner = memo(function AssignmentBanner({
  targetLabel,
  vgColor,
  onCancel,
}) {
  return (
    <div
      className="assignment-banner"
      style={{ '--assign-color': vgColor || 'var(--color-accent-cyan)' }}
    >
      <div className="assignment-banner__content">
        <Icon name="plus" size={14} />
        <span className="assignment-banner__label">
          Assigning to: <strong>{targetLabel}</strong>
        </span>
      </div>
      <button
        type="button"
        className="assignment-banner__cancel"
        onClick={onCancel}
      >
        Cancel
      </button>
    </div>
  );
});

export default AssignmentBanner;
