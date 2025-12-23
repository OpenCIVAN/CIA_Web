// components/BookmarkItem.jsx
// Individual bookmark item component

import React, { useState } from 'react';
import { IconCamera, IconShare, IconPin, IconDelete, IconPlay } from '@UI/react/components/common/Icon';
import PushPinOutlined from '@mui/icons-material/PushPinOutlined';
import { formatTimestamp } from '@Utils/formatters.js';

export function BookmarkItem({ bookmark, onNavigate, onTogglePin, onDelete, getThumbnailUrl }) {
    const [isHovered, setIsHovered] = useState(false);
    const thumbnailUrl = bookmark.thumbnailKey ? getThumbnailUrl?.(bookmark.id) : null;

    return (
        <div
            className="bookmark-item"
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
        >
            {/* Thumbnail */}
            <div className="bookmark-item__thumbnail">
                {thumbnailUrl ? (
                    <img src={thumbnailUrl} alt={bookmark.name} />
                ) : (
                    <IconCamera size={16} />
                )}
            </div>

            {/* Content */}
            <div className="bookmark-item__content">
                <div className="bookmark-item__name">
                    {bookmark.name}
                    {bookmark.scope !== 'personal' && <IconShare size={9} className="icon-pink" />}
                </div>
                <div className="bookmark-item__meta">
                    <span>{bookmark.datasetName || 'No dataset'}</span>
                    <span>&middot;</span>
                    <span>{formatTimestamp(bookmark.createdAt)}</span>
                </div>
            </div>

            {/* Actions */}
            <div className="bookmark-item__actions" style={{ opacity: isHovered ? 1 : 0 }}>
                <button
                    className={`bookmark-item__action-btn ${bookmark.isPinned ? 'active' : ''}`}
                    onClick={(e) => { e.stopPropagation(); onTogglePin(bookmark.id); }}
                    title={bookmark.isPinned ? 'Unpin' : 'Pin'}
                >
                    {bookmark.isPinned ? <IconPin size={10} fill="currentColor" /> : <PushPinOutlined size={10} />}
                </button>
                {bookmark.isOwn && (
                    <button
                        className="bookmark-item__action-btn"
                        onClick={(e) => { e.stopPropagation(); onDelete(bookmark.id); }}
                        title="Delete"
                    >
                        <IconDelete size={10} />
                    </button>
                )}
            </div>

            {/* Go button */}
            <button
                className="bookmark-item__go-btn"
                onClick={() => onNavigate(bookmark.id)}
            >
                <IconPlay size={10} /> Go
            </button>
        </div>
    );
}

export default BookmarkItem;