/**
 * @file RoomCard.jsx
 * @description Individual room display with expandable details.
 */

import React, { useState } from 'react';
import {
    IconUsers,
    IconLock,
    IconUnlock,
    IconEyeOff,
    IconVolume,
    IconMessageSquare,
    IconLogout,
    IconCrown,
    IconSettings,
    IconDelete,
    IconChevronDown,
    IconChevronRight,
    IconUser,
} from '@UI/react/components/common/Icon';
import { PublicOutlined, BusinessCenterOutlined, ViewQuiltOutlined } from '@mui/icons-material';

/**
 * Get access icon for room
 */
function getAccessIcon(access) {
    switch (access) {
        case 'open': return IconUnlock;
        case 'invite': return IconLock;
        case 'invisible': return IconEyeOff;
        default: return IconUnlock;
    }
}

/**
 * Get type icon for room
 */
function getTypeIcon(type) {
    switch (type) {
        case 'project': return PublicOutlined;
        case 'breakout': return BusinessCenterOutlined;
        case 'personal': return IconUser;
        default: return ViewQuiltOutlined;
    }
}

/**
 * @typedef {Object} RoomCardProps
 * @property {Object} room - Room data
 * @property {function} onJoin - Callback to join room
 * @property {function} onLeave - Callback to leave room
 * @property {function} onSettings - Callback to open settings
 * @property {function} onDelete - Callback to delete room
 */

/**
 * Room card component.
 * Displays room with expandable member list.
 *
 * @param {RoomCardProps} props - Component props
 * @returns {React.ReactElement} The rendered card
 */
export function RoomCard({ room, onJoin, onLeave, onSettings, onDelete }) {
    const [isExpanded, setIsExpanded] = useState(false);

    const AccessIcon = getAccessIcon(room.access);
    const TypeIcon = getTypeIcon(room.type);

    return (
        <div className={`room-card ${room.isCurrentRoom ? 'room-card--current' : ''}`}>
            <div
                className="room-card__header"
                onClick={() => setIsExpanded(!isExpanded)}
            >
                <div className="room-card__type-icon" data-type={room.type}>
                    <TypeIcon size={14} />
                </div>

                <div className="room-card__info">
                    <div className="room-card__name">
                        <AccessIcon size={12} className="room-card__access-icon" />
                        <span>{room.name}</span>
                        {room.isPersistent && (
                            <span className="room-card__badge">Persistent</span>
                        )}
                    </div>
                    <div className="room-card__meta">
                        <span className="room-card__member-count">
                            <IconUsers size={10} />
                            {room.members.length}
                        </span>
                        {room.hasVoice && <IconVolume size={10} />}
                        {room.hasText && <IconMessageSquare size={10} />}
                    </div>
                </div>

                <div className="room-card__actions">
                    {room.isCurrentRoom ? (
                        <span className="room-card__current-badge">Current</span>
                    ) : (
                        <button
                            className="room-card__join-btn"
                            onClick={(e) => { e.stopPropagation(); onJoin(room.id); }}
                        >
                            Join
                        </button>
                    )}
                    <span className="room-card__chevron">
                        {isExpanded ? <IconChevronDown size={12} /> : <IconChevronRight size={12} />}
                    </span>
                </div>
            </div>

            {isExpanded && (
                <div className="room-card__expanded">
                    <div className="room-card__members">
                        <div className="room-card__members-label">Members</div>
                        <div className="room-card__members-list">
                            {room.members.map(member => (
                                <div key={member.id} className="room-card__member">
                                    <div
                                        className="room-card__member-avatar"
                                        style={{ '--member-color': member.color }}
                                    >
                                        {member.name.charAt(0).toUpperCase()}
                                    </div>
                                    <span className="room-card__member-name">
                                        {member.name}
                                        {member.isOwner && <IconCrown size={10} />}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="room-card__footer">
                        {room.isCurrentRoom && room.type !== 'project' && (
                            <button
                                className="room-card__footer-btn room-card__footer-btn--leave"
                                onClick={() => onLeave(room.id)}
                            >
                                <IconLogout size={12} />
                                Leave Room
                            </button>
                        )}
                        <button
                            className="room-card__footer-btn"
                            onClick={() => onSettings(room.id)}
                        >
                            <IconSettings size={12} />
                            Settings
                        </button>
                        {room.type !== 'project' && (
                            <button
                                className="room-card__footer-btn room-card__footer-btn--delete"
                                onClick={() => onDelete(room.id)}
                            >
                                <IconDelete size={12} />
                            </button>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}

export default RoomCard;