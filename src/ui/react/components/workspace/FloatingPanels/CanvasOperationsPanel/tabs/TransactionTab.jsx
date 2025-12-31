/**
 * @file TransactionTab.jsx
 * @description Shows pending operations that haven't been committed to the collaborative state.
 */

import React from 'react';
import { Icon } from '@UI/react/components/common/Icon';
import { OperationItem } from '../components/OperationItem';

// =============================================================================
// EMPTY STATE
// =============================================================================

function EmptyState() {
  return (
    <div className="cop-empty-state">
      <div className="cop-empty-state__icon">
        <Icon name="check" size={24} />
      </div>
      <div className="cop-empty-state__title">No pending changes</div>
      <div className="cop-empty-state__description">
        Drag views in the minimap to make changes
      </div>
    </div>
  );
}

// =============================================================================
// MAIN COMPONENT
// =============================================================================

/**
 * Transaction Tab - Shows pending operations for review
 *
 * @param {Object} props - Component props
 * @param {Array} props.operations - Array of pending operations
 * @param {Array} props.selectedOps - Array of boolean for selection state
 * @param {Function} props.onToggleOp - Toggle operation selection
 * @param {Function} props.onSelectAll - Select all operations
 * @param {Function} props.onClearSelection - Clear all selections
 * @param {Function} props.onApply - Apply selected operations
 * @param {Function} props.onCancel - Cancel all pending operations
 * @param {boolean} props.hasChanges - Whether there are pending changes
 * @param {number} props.selectedCount - Number of selected operations
 */
export function TransactionTab({
  operations = [],
  selectedOps = [],
  onToggleOp,
  onSelectAll,
  onClearSelection,
  onApply,
  onCancel,
  hasChanges,
  selectedCount = 0,
}) {
  if (!hasChanges) {
    return <EmptyState />;
  }

  return (
    <div className="transaction-tab">
      {/* Header */}
      <div className="cop-toolbar">
        <span className="transaction-tab__count">
          {selectedCount} of {operations.length} selected
        </span>
        <div className="cop-toolbar__spacer" />
        <button
          className="cop-button cop-button--secondary cop-button--small"
          onClick={onSelectAll}
          type="button"
        >
          Select All
        </button>
        <button
          className="cop-button cop-button--secondary cop-button--small"
          onClick={onClearSelection}
          type="button"
        >
          Clear
        </button>
      </div>

      {/* Operations list */}
      <div className="cop-scroll-list">
        <div className="cop-list">
          {operations.map((op, i) => (
            <OperationItem
              key={op.id || i}
              operation={op}
              isSelected={selectedOps[i]}
              onToggle={() => onToggleOp(i)}
              showCheckbox
            />
          ))}
        </div>
      </div>

      {/* Action buttons */}
      <div className="cop-actions">
        <button
          className="cop-button cop-button--secondary"
          onClick={onCancel}
          type="button"
        >
          Cancel
        </button>
        <button
          className="cop-button cop-button--primary"
          onClick={onApply}
          disabled={selectedCount === 0}
          type="button"
        >
          Apply {selectedCount} Changes
        </button>
      </div>
    </div>
  );
}

export default TransactionTab;
