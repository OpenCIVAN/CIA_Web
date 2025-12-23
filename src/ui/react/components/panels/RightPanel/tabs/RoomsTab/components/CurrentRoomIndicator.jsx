/**
 * @file CurrentRoomIndicator.jsx
 * @description Shows the user's current room location.
 */

import React from 'react';
import { IconLogout, IconUser } from '@UI/react/components/common/Icon';
import { PublicOutlined, ViewQuiltOutlined } from '@mui/icons-material';

/**
 * Get icon for room type
 */
function getTypeIcon(type) {
    switch (type) {
        case 'project': return PublicOutlined;
        case 'breakout': return ViewQuiltOutlined;
        case 'personal': return IconUser;
        default: return ViewQuiltOutlined;
    }
}

/**
 * @typedef {Object} CurrentRoomIndicatorProps
 * @property {Object} room - Current room object
 * @property {function} onLeave - Callback to leave room
 */

/**
 * Current room indicator component.
 * Shows where the user currently is.
 *
 * @param {CurrentRoomIndicatorProps} props - Component props
 * @returns {React.ReactElement|null} The rendered indicator
 */
export function CurrentRoomIndicator({ room, onLeave }) {
    if (!room) return null;

    const TypeIcon = getTypeIcon(room.type);

    return (
        <div className="current-room-indicator">
            <div className="current-room-indicator__info">
                <div className="current-room-indicator__label">Currently in</div>
                <div className="current-room-indicator__name">
                    <TypeIcon size={14} />
                    <span>{room.name}</span>
                </div>
            </div>
            {room.type !== 'project' && (
                <button
                    className="current-room-indicator__leave"
                    onClick={onLeave}
                    title="Leave room"
                >
                    <IconLogout size={14} />
                    Leave
                </button>
            )}
        </div>
    );
}

export default CurrentRoomIndicator;