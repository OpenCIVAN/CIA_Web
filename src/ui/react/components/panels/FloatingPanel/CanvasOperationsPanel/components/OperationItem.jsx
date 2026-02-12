/**
 * @file OperationItem.jsx
 * @description A single operation row with checkbox selection for the transaction tab.
 * Includes a reaction bar for collaborative feedback.
 */

import React, { useState } from 'react';
import { Icon } from '@UI/react/components/atoms/Icon';
import { OPERATION_TYPES } from '../CanvasOperationsPanel.logic';

// Emoji options for reactions
const REACTION_EMOJIS = [
  { key: 'thumbsUp', emoji: '\uD83D\uDC4D', label: 'Approve' },
  { key: 'warning', emoji: '\u26A0\uFE0F', label: 'Concern' },
  { key: 'question', emoji: '\u2753', label: 'Question' },
  { key: 'target', emoji: '\uD83C\uDFAF', label: 'Important' },
];

/**
 * OperationItem - A single pending operation row with optional reactions
 *
 * @param {Object} props - Component props
 * @param {Object} props.operation - The operation object
 * @param {boolean} props.isSelected - Whether the operation is selected
 * @param {Function} props.onToggle - Toggle selection callback
 * @param {Function} props.onUndo - Undo this specific operation
 * @param {boolean} props.showCheckbox - Show selection checkbox
 * @param {boolean} props.showUser - Show user who made the operation
 * @param {Array} props.reactions - Array of reaction objects for this operation
 * @param {Function} props.onAddReaction - Callback to add a reaction (emoji)
 * @param {Function} props.onRemoveReaction - Callback to remove a reaction (emoji)
 * @param {string} props.currentUserId - Current user's ID
 */
export function OperationItem({
  operation,
  isSelected = false,
  onToggle,
  onUndo,
  showCheckbox = false,
  showUser = false,
  reactions = [],
  onAddReaction,
  onRemoveReaction,
  currentUserId,
}) {
  const config = OPERATION_TYPES[operation.type] || OPERATION_TYPES.MOVE;
  const [showReactionPicker, setShowReactionPicker] = useState(false);

  // Group reactions by emoji
  const reactionGroups = reactions.reduce((acc, r) => {
    if (!acc[r.emoji]) acc[r.emoji] = [];
    acc[r.emoji].push(r);
    return acc;
  }, {});

  const hasOwnReaction = (emoji) =>
    reactions.some((r) => r.userId === currentUserId && r.emoji === emoji);

  const handleEmojiClick = (emoji) => {
    if (hasOwnReaction(emoji)) {
      onRemoveReaction?.(emoji);
    } else {
      onAddReaction?.(emoji);
    }
  };

  return (
    <div
      className={`operation-item ${isSelected ? 'operation-item--selected' : ''}`}
    >
      {showCheckbox && (
        <button
          className={`operation-item__checkbox ${isSelected ? 'operation-item__checkbox--checked' : ''}`}
          onClick={onToggle}
          type="button"
          aria-label={isSelected ? 'Deselect operation' : 'Select operation'}
        >
          {isSelected && <Icon name="check" size={10} />}
        </button>
      )}

      <div className={`cop-op-icon cop-op-icon--${config.color}`}>
        <Icon name={config.icon} size={12} />
      </div>

      <div className="operation-item__content">
        <div className="operation-item__detail">{operation.detail || operation.description}</div>
        <div className="operation-item__meta">
          <span className={`operation-item__type operation-item__type--${config.color}`}>
            {config.label}
          </span>
          {showUser && operation.user && (
            <span className="operation-item__user">by {operation.user}</span>
          )}
          {operation.timestamp && (
            <span className="operation-item__time">
              {typeof operation.timestamp === 'number'
                ? new Date(operation.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                : operation.timestamp}
            </span>
          )}
        </div>

        {/* Reaction bar */}
        {(onAddReaction || reactions.length > 0) && (
          <div className="operation-item__reactions">
            {/* Existing reaction groups */}
            {Object.entries(reactionGroups).map(([emoji, group]) => (
              <button
                key={emoji}
                className={`operation-item__reaction-chip ${hasOwnReaction(emoji) ? 'operation-item__reaction-chip--own' : ''}`}
                onClick={() => handleEmojiClick(emoji)}
                type="button"
                title={group.map((r) => r.userName).join(', ')}
              >
                <span className="operation-item__reaction-emoji">{emoji}</span>
                <span className="operation-item__reaction-count">{group.length}</span>
              </button>
            ))}

            {/* Add reaction button */}
            {onAddReaction && (
              <div className="operation-item__reaction-add-wrapper">
                <button
                  className="operation-item__reaction-add"
                  onClick={() => setShowReactionPicker((prev) => !prev)}
                  type="button"
                  title="Add reaction"
                >
                  <Icon name="add" size={10} />
                </button>
                {showReactionPicker && (
                  <>
                    <div
                      className="operation-item__reaction-overlay"
                      onClick={() => setShowReactionPicker(false)}
                    />
                    <div className="operation-item__reaction-picker">
                      {REACTION_EMOJIS.map((re) => (
                        <button
                          key={re.key}
                          className={`operation-item__reaction-option ${hasOwnReaction(re.emoji) ? 'operation-item__reaction-option--active' : ''}`}
                          onClick={() => {
                            handleEmojiClick(re.emoji);
                            setShowReactionPicker(false);
                          }}
                          type="button"
                          title={re.label}
                        >
                          {re.emoji}
                        </button>
                      ))}
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {onUndo && (
        <button
          className="cop-button cop-button--icon-small"
          onClick={onUndo}
          title="Undo this operation"
          type="button"
        >
          <Icon name="undo" size={12} />
        </button>
      )}
    </div>
  );
}

export default OperationItem;
