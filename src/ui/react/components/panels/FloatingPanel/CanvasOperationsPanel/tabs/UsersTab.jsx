/**
 * @file UsersTab.jsx
 * @description Shows all collaborators with their current state and action buttons.
 * Displays lock info when a canvas lock is active.
 */

import React from 'react';
import { Icon } from '@UI/react/components/atoms';
import { LabeledButton } from '@UI/react/components/molecules';
import { UserItem } from '../components/UserItem';
import { getUserColor } from '../CanvasOperationsPanel.logic';

/**
 * UsersTab - Shows collaborators and lock status
 *
 * @param {Object} props - Component props
 * @param {Array} props.collaborators - Array of collaborator objects
 * @param {Object|null} props.lock - Current lock info from store
 * @param {number|null} props.timeRemaining - Seconds remaining on lock
 * @param {boolean} props.isEditMode - Whether we're in transactional edit mode
 * @param {Function} props.onExtendLock - Extend the current lock
 * @param {string|null} props.followingUser - ID of user being followed
 * @param {Function} props.onFollow - Toggle following a user
 * @param {Function} props.onGoToViewport - Navigate to user's viewport
 * @param {Function} props.onGoToCursor - Navigate to user's cursor
 * @param {string} props.currentUserId - Current user's ID
 */
export function UsersTab({
  collaborators = [],
  lock,
  remoteLock,
  timeRemaining,
  isEditMode,
  onExtendLock,
  followingUser,
  onFollow,
  onGoToViewport,
  onGoToCursor,
  currentUserId,
}) {
  const isCurrentUserLock = lock && lock.lockedBy === currentUserId;

  return (
    <div className="cop-scroll-list">
      {/* Lock info banner */}
      {lock && isEditMode && (
        <div className="users-tab__lock-info">
          <Icon name="lock" size={14} />
          <span>{isCurrentUserLock ? 'You are editing' : `${lock.lockedByName || 'Someone'} is editing`}</span>
          {timeRemaining != null && (
            <span className="users-tab__lock-timer">
              {Math.floor(timeRemaining / 60)}:{String(Math.round(timeRemaining) % 60).padStart(2, '0')}
            </span>
          )}
          <div style={{ flex: 1 }} />
          {isCurrentUserLock && onExtendLock && (
            <LabeledButton label="Extend" onClick={onExtendLock} size="sm" variant="ghost" />
          )}
        </div>
      )}

      {/* Remote lock banner — shown when another user has the lock and we are NOT the editor */}
      {remoteLock && !isEditMode && (
        <div className="users-tab__lock-info users-tab__lock-info--remote">
          <Icon name="lock" size={14} />
          <span>{remoteLock.lockedByName || 'Someone'} is editing the canvas</span>
        </div>
      )}

      <div className="cop-list cop-list--gap-md">
        {collaborators.map((user) => {
          const isCurrentUser = user.id === currentUserId || user.name === 'You';
          const userColor = getUserColor(user.name, isCurrentUser);

          return (
            <UserItem
              key={user.id || user.name}
              user={user}
              userColor={userColor}
              isFollowing={followingUser === user.id || followingUser === user.name}
              onGoToViewport={() => onGoToViewport?.(user)}
              onGoToCursor={() => onGoToCursor?.(user)}
              onFollow={() => onFollow?.(user.id || user.name)}
              isCurrentUser={isCurrentUser}
            />
          );
        })}
      </div>
    </div>
  );
}

export default UsersTab;
