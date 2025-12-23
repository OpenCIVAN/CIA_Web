/**
 * @file ActivityCard.jsx
 * @description Single activity item display.
 */

import React from 'react';
import {
    IconClock,
    IconDatabase,
    IconUser,
    IconEye,
    IconMessageSquare,
    IconShare,
    IconUpload,
    IconDownload,
    IconDelete,
    IconEdit,
    IconRefresh,
    IconCircle,
} from '@UI/react/components/common/Icon';
import { formatTimestamp } from '@Utils/formatters.js';

/**
 * Get icon for activity type
 */
function getActivityIcon(type) {
    switch (type) {
        case 'view': return IconEye;
        case 'dataset': return IconDatabase;
        case 'annotation': return IconMessageSquare;
        case 'share': return IconShare;
        case 'upload': return IconUpload;
        case 'download': return IconDownload;
        case 'delete': return IconDelete;
        case 'edit': return IconEdit;
        case 'join': return IconUser;
        case 'system': return IconRefresh;
        default: return IconCircle;
    }
}

/**
 * @typedef {Object} Activity
 * @property {string} id - Activity ID
 * @property {string} type - Activity type
 * @property {string} action - Action description
 * @property {string} [target] - Target of action
 * @property {Object} [user] - User who performed action
 * @property {number} timestamp - When action occurred
 */

/**
 * @typedef {Object} ActivityCardProps
 * @property {Activity} activity - The activity to display
 */

/**
 * Activity card component.
 * Displays a single activity item with icon and details.
 *
 * @param {ActivityCardProps} props - Component props
 * @returns {React.ReactElement} The rendered card
 */
export function ActivityCard({ activity }) {
    const Icon = getActivityIcon(activity.type);
    const isSystem = activity.type === 'system';

    return (
        <div className={`activity-card ${isSystem ? 'activity-card--system' : ''}`}>
            <div className="activity-card__icon" data-type={activity.type}>
                <Icon size={14} />
            </div>

            <div className="activity-card__content">
                <div className="activity-card__text">
                    {activity.user && (
                        <span
                            className="activity-card__user"
                            style={{ color: activity.user.color }}
                        >
                            {activity.user.name}
                        </span>
                    )}
                    <span className="activity-card__action">{activity.action}</span>
                    {activity.target && (
                        <span className="activity-card__target">{activity.target}</span>
                    )}
                </div>
                <div className="activity-card__time">
                    <IconClock size={10} />
                    <span>{formatTimestamp(activity.timestamp)}</span>
                </div>
            </div>
        </div>
    );
}

export default ActivityCard;