// src/ui/react/components/panels/LeftPanel/tabs/BookmarksTab.jsx
// Bookmarks tab content for the unified left panel
//
// Features:
// - Shows saved view bookmarks with thumbnails
// - Grid and list view modes
// - Collapsible groups (Recent, My Bookmarks, Shared with Me)
// - Tags, sharing, and quick navigation

import React, { useState, useCallback, useMemo } from 'react';
import {
    Bookmark,
    Search,
    X,
    ChevronDown,
    ChevronRight,
    Share2,
    Play,
    Edit3,
    Trash2,
    Plus,
    Camera,
    Clock,
    User,
    Tag,
    List,
    Grid3X3,
    Pin,
    PinOff,
    Loader2,
    AlertCircle,
} from 'lucide-react';
import { ui as log } from '@Utils/logger.js';
import { useBookmarks } from '@UI/react/hooks/useBookmarks.js';

// =============================================================================
// SCOPE CONFIG
// =============================================================================

const SCOPE_COLORS = {
    personal: 'blue',
    workspace: 'teal',
    project: 'amber',
};

function formatTimestamp(dateString) {
    if (!dateString) return '';
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} min ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
    return date.toLocaleDateString();
}

// =============================================================================
// THUMBNAIL
// =============================================================================

function Thumbnail({ bookmark, thumbnailUrl, size = 'small' }) {
    const dimensions = size === 'small' ? { width: 48, height: 48 } : { width: '100%', height: 70 };
    const color = SCOPE_COLORS[bookmark.scope] || 'blue';
    const [hasError, setHasError] = useState(false);

    if (thumbnailUrl && !hasError) {
        return (
            <div className={`bookmark-thumbnail bookmark-thumbnail--${size}`} style={dimensions}>
                <img
                    src={thumbnailUrl}
                    alt={bookmark.name}
                    onError={() => setHasError(true)}
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
            </div>
        );
    }

    return (
        <div
            className={`bookmark-thumbnail bookmark-thumbnail--${size}`}
            style={{
                ...dimensions,
                '--thumbnail-color': `var(--color-accent-${color})`,
            }}
        >
            <Camera size={size === 'small' ? 16 : 24} />
        </div>
    );
}

// =============================================================================
// LIST ITEM
// =============================================================================

function BookmarkListItem({ bookmark, isSelected, onSelect, onNavigate, onTogglePin, thumbnailUrl }) {
    return (
        <div
            className={`bookmark-list-item ${isSelected ? 'bookmark-list-item--selected' : ''}`}
            onClick={() => onSelect(isSelected ? null : bookmark.id)}
        >
            <button
                className={`bookmark-list-item__pin ${bookmark.isPinned ? 'bookmark-list-item__pin--active' : ''}`}
                onClick={(e) => { e.stopPropagation(); onTogglePin(bookmark.id); }}
                title={bookmark.isPinned ? 'Unpin' : 'Pin'}
            >
                {bookmark.isPinned ? <Pin size={10} fill="currentColor" /> : <PinOff size={10} />}
            </button>

            <Thumbnail bookmark={bookmark} thumbnailUrl={thumbnailUrl} size="small" />

            <div className="bookmark-list-item__content">
                <div className="bookmark-list-item__name">
                    {bookmark.name}
                    {bookmark.scope !== 'personal' && <Share2 size={9} className="bookmark-list-item__shared-icon" />}
                </div>
                <div className="bookmark-list-item__dataset">{bookmark.datasetName || 'No dataset'}</div>
                <div className="bookmark-list-item__meta">
                    <span><Clock size={8} /> {formatTimestamp(bookmark.createdAt)}</span>
                    <span><User size={8} /> {bookmark.owner?.name || 'Unknown'}</span>
                </div>
            </div>

            <button
                className="bookmark-list-item__go-btn"
                onClick={(e) => { e.stopPropagation(); onNavigate(bookmark.id); }}
            >
                <Play size={10} /> Go
            </button>
        </div>
    );
}

// =============================================================================
// GRID ITEM
// =============================================================================

function BookmarkGridItem({ bookmark, onNavigate, thumbnailUrl }) {
    return (
        <div
            className="bookmark-grid-item"
            onClick={() => onNavigate(bookmark.id)}
        >
            <Thumbnail bookmark={bookmark} thumbnailUrl={thumbnailUrl} size="large" />
            <div className="bookmark-grid-item__name">{bookmark.name}</div>
            <div className="bookmark-grid-item__timestamp">{formatTimestamp(bookmark.createdAt)}</div>
        </div>
    );
}

// =============================================================================
// GROUP
// =============================================================================

function BookmarkGroup({ title, bookmarks, isExpanded, onToggle, viewMode, selectedBookmark, onSelect, onNavigate, onTogglePin, getThumbnailUrl }) {
    if (bookmarks.length === 0) return null;

    return (
        <div className="bookmark-group">
            <div className="bookmark-group__header" onClick={onToggle}>
                {isExpanded ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
                <span className="bookmark-group__title">{title}</span>
                <span className="bookmark-group__count">{bookmarks.length}</span>
            </div>

            {isExpanded && (
                viewMode === 'list' ? (
                    <div className="bookmark-group__list">
                        {bookmarks.map(bookmark => (
                            <BookmarkListItem
                                key={bookmark.id}
                                bookmark={bookmark}
                                isSelected={selectedBookmark === bookmark.id}
                                onSelect={onSelect}
                                onNavigate={onNavigate}
                                onTogglePin={onTogglePin}
                                thumbnailUrl={bookmark.thumbnailKey ? getThumbnailUrl(bookmark.id) : null}
                            />
                        ))}
                    </div>
                ) : (
                    <div className="bookmark-group__grid">
                        {bookmarks.map(bookmark => (
                            <BookmarkGridItem
                                key={bookmark.id}
                                bookmark={bookmark}
                                onNavigate={onNavigate}
                                thumbnailUrl={bookmark.thumbnailKey ? getThumbnailUrl(bookmark.id) : null}
                            />
                        ))}
                    </div>
                )
            )}
        </div>
    );
}

// =============================================================================
// SELECTED BOOKMARK DETAILS
// =============================================================================

function SelectedBookmarkDetails({ bookmark, onClose, onNavigate, onDelete }) {
    if (!bookmark) return null;

    return (
        <div className="bookmark-details">
            <div className="bookmark-details__header">
                <span className="bookmark-details__name">{bookmark.name}</span>
                <button className="bookmark-details__close" onClick={onClose}>
                    <ChevronDown size={14} />
                </button>
            </div>

            {/* Tags */}
            {bookmark.tags && bookmark.tags.length > 0 && (
                <div className="bookmark-details__tags">
                    {bookmark.tags.map(tag => (
                        <span key={tag} className="bookmark-details__tag">
                            <Tag size={8} /> {tag}
                        </span>
                    ))}
                </div>
            )}

            {/* Description */}
            {bookmark.description && (
                <div className="bookmark-details__description">
                    {bookmark.description}
                </div>
            )}

            {/* Actions */}
            <div className="bookmark-details__actions">
                <button
                    className="bookmark-details__action-btn bookmark-details__action-btn--primary"
                    onClick={() => onNavigate(bookmark.id)}
                >
                    <Play size={10} /> Go to View
                </button>
                <button className="bookmark-details__action-btn" data-color="blue">
                    <Edit3 size={12} />
                </button>
                {bookmark.isOwn && (
                    <button
                        className="bookmark-details__action-btn"
                        onClick={() => onDelete(bookmark.id)}
                    >
                        <Trash2 size={12} />
                    </button>
                )}
            </div>
        </div>
    );
}

// =============================================================================
// CREATE BOOKMARK FORM
// =============================================================================

function CreateBookmarkForm({ onSave, onCancel }) {
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [scope, setScope] = useState('personal');
    const [tags, setTags] = useState('');
    const [isSaving, setIsSaving] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!name.trim()) return;

        setIsSaving(true);
        try {
            const tagList = tags.split(',').map(t => t.trim()).filter(Boolean);
            await onSave(name.trim(), {
                description,
                scope,
                tags: tagList,
                // camera_state should come from the current view
            });
        } catch (err) {
            log.error('Failed to save bookmark:', err);
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <form className="create-bookmark-form" onSubmit={handleSubmit}>
            <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Bookmark name..."
                className="create-bookmark-form__input"
                autoFocus
            />
            <input
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Description (optional)"
                className="create-bookmark-form__input"
            />
            <input
                type="text"
                value={tags}
                onChange={(e) => setTags(e.target.value)}
                placeholder="Tags (comma separated)"
                className="create-bookmark-form__input"
            />
            <select
                value={scope}
                onChange={(e) => setScope(e.target.value)}
                className="create-bookmark-form__select"
            >
                <option value="personal">Personal</option>
                <option value="project">Project</option>
            </select>
            <div className="create-bookmark-form__actions">
                <button type="button" onClick={onCancel} className="create-bookmark-form__btn">
                    Cancel
                </button>
                <button
                    type="submit"
                    disabled={!name.trim() || isSaving}
                    className="create-bookmark-form__btn create-bookmark-form__btn--primary"
                >
                    {isSaving ? <Loader2 size={12} className="spin" /> : 'Save'}
                </button>
            </div>
        </form>
    );
}

// =============================================================================
// MAIN COMPONENT
// =============================================================================

export function BookmarksPanelContent({ workspaceId }) {
    // Use the real bookmarks hook
    const {
        bookmarks,
        groupedBookmarks,
        isLoading,
        error,
        createBookmark,
        deleteBookmark,
        togglePin,
        navigateToBookmark,
        getThumbnailUrl,
        refetch,
    } = useBookmarks({ workspaceId });

    // Local state
    const [searchQuery, setSearchQuery] = useState('');
    const [viewMode, setViewMode] = useState('list');
    const [selectedBookmark, setSelectedBookmark] = useState(null);
    const [showCreateForm, setShowCreateForm] = useState(false);
    const [expandedGroups, setExpandedGroups] = useState({
        pinned: true,
        mine: true,
        workspace: true,
        project: true,
        shared: true,
    });

    // Toggle group
    const toggleGroup = useCallback((groupId) => {
        setExpandedGroups(prev => ({ ...prev, [groupId]: !prev[groupId] }));
    }, []);

    // Handle navigate
    const handleNavigate = useCallback((bookmarkId) => {
        const bookmark = navigateToBookmark(bookmarkId);
        if (bookmark) {
            log.debug('Navigating to bookmark:', bookmarkId, bookmark);
        }
    }, [navigateToBookmark]);

    // Handle delete
    const handleDelete = useCallback(async (bookmarkId) => {
        if (window.confirm('Delete this bookmark?')) {
            try {
                await deleteBookmark(bookmarkId);
                setSelectedBookmark(null);
            } catch (err) {
                log.error('Failed to delete bookmark:', err);
            }
        }
    }, [deleteBookmark]);

    // Handle create
    const handleCreate = useCallback(async (name, options) => {
        try {
            await createBookmark(name, options);
            setShowCreateForm(false);
        } catch (err) {
            log.error('Failed to create bookmark:', err);
            throw err;
        }
    }, [createBookmark]);

    // Filter bookmarks
    const filteredBookmarks = useMemo(() => {
        return bookmarks.filter(b =>
            !searchQuery ||
            b.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            (b.datasetName && b.datasetName.toLowerCase().includes(searchQuery.toLowerCase())) ||
            (b.tags && b.tags.some(t => t.toLowerCase().includes(searchQuery.toLowerCase())))
        );
    }, [bookmarks, searchQuery]);

    // Group bookmarks
    const pinnedBookmarks = filteredBookmarks.filter(b => b.isPinned);
    const myBookmarks = filteredBookmarks.filter(b => b.isOwn && b.scope === 'personal' && !b.isPinned);
    const workspaceBookmarks = filteredBookmarks.filter(b => b.scope === 'workspace' && !b.isPinned);
    const projectBookmarks = filteredBookmarks.filter(b => b.scope === 'project' && !b.isPinned);
    const sharedBookmarks = filteredBookmarks.filter(b => !b.isOwn && !b.isPinned);

    const selectedBookmarkData = bookmarks.find(b => b.id === selectedBookmark);

    // Loading state
    if (isLoading && bookmarks.length === 0) {
        return (
            <div className="bookmarks-tab">
                <div className="panel-header">
                    <Bookmark size={14} className="panel-header__icon file-icon--indigo" />
                    <span className="panel-header__title">Bookmarks</span>
                </div>
                <div className="bookmarks-tab__loading">
                    <Loader2 size={24} className="spin" />
                    <span>Loading bookmarks...</span>
                </div>
            </div>
        );
    }

    // Error state
    if (error && bookmarks.length === 0) {
        return (
            <div className="bookmarks-tab">
                <div className="panel-header">
                    <Bookmark size={14} className="panel-header__icon file-icon--indigo" />
                    <span className="panel-header__title">Bookmarks</span>
                </div>
                <div className="bookmarks-tab__error">
                    <AlertCircle size={24} />
                    <span>Failed to load bookmarks</span>
                    <button onClick={refetch}>Retry</button>
                </div>
            </div>
        );
    }

    return (
        <div className="bookmarks-tab">
            {/* Header */}
            <div className="panel-header">
                <Bookmark size={14} className="panel-header__icon file-icon--indigo" />
                <span className="panel-header__title">Bookmarks</span>
                <span className="panel-header__count">{bookmarks.length} saved</span>
            </div>

            {/* Search + View mode */}
            <div className="panel-search">
                <div className="panel-search__wrapper">
                    <Search size={12} className="search-icon" />
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search bookmarks..."
                    />
                    {searchQuery && (
                        <button
                            className="clear-button"
                            onClick={() => setSearchQuery('')}
                        >
                            <X size={10} />
                        </button>
                    )}
                </div>
            </div>

            {/* Toolbar with view mode toggle */}
            <div className="panel-toolbar">
                <div className="panel-toolbar__spacer" />
                <div className="panel-toolbar__group">
                    <button
                        className={`panel-toolbar__toggle ${viewMode === 'list' ? 'active' : ''}`}
                        onClick={() => setViewMode('list')}
                    >
                        <List size={14} />
                    </button>
                    <button
                        className={`panel-toolbar__toggle ${viewMode === 'grid' ? 'active' : ''}`}
                        onClick={() => setViewMode('grid')}
                    >
                        <Grid3X3 size={14} />
                    </button>
                </div>
            </div>

            {/* Content */}
            <div className="bookmarks-tab__content">
                {/* Pinned */}
                <BookmarkGroup
                    title="Pinned"
                    bookmarks={pinnedBookmarks}
                    isExpanded={expandedGroups.pinned}
                    onToggle={() => toggleGroup('pinned')}
                    viewMode={viewMode}
                    selectedBookmark={selectedBookmark}
                    onSelect={setSelectedBookmark}
                    onNavigate={handleNavigate}
                    onTogglePin={togglePin}
                    getThumbnailUrl={getThumbnailUrl}
                />

                {/* My Bookmarks */}
                <BookmarkGroup
                    title="My Bookmarks"
                    bookmarks={myBookmarks}
                    isExpanded={expandedGroups.mine}
                    onToggle={() => toggleGroup('mine')}
                    viewMode={viewMode}
                    selectedBookmark={selectedBookmark}
                    onSelect={setSelectedBookmark}
                    onNavigate={handleNavigate}
                    onTogglePin={togglePin}
                    getThumbnailUrl={getThumbnailUrl}
                />

                {/* Workspace Bookmarks */}
                <BookmarkGroup
                    title="Workspace Bookmarks"
                    bookmarks={workspaceBookmarks}
                    isExpanded={expandedGroups.workspace}
                    onToggle={() => toggleGroup('workspace')}
                    viewMode={viewMode}
                    selectedBookmark={selectedBookmark}
                    onSelect={setSelectedBookmark}
                    onNavigate={handleNavigate}
                    onTogglePin={togglePin}
                    getThumbnailUrl={getThumbnailUrl}
                />

                {/* Project Bookmarks */}
                <BookmarkGroup
                    title="Project Bookmarks"
                    bookmarks={projectBookmarks}
                    isExpanded={expandedGroups.project}
                    onToggle={() => toggleGroup('project')}
                    viewMode={viewMode}
                    selectedBookmark={selectedBookmark}
                    onSelect={setSelectedBookmark}
                    onNavigate={handleNavigate}
                    onTogglePin={togglePin}
                    getThumbnailUrl={getThumbnailUrl}
                />

                {/* Shared with Me */}
                <BookmarkGroup
                    title="Shared with Me"
                    bookmarks={sharedBookmarks}
                    isExpanded={expandedGroups.shared}
                    onToggle={() => toggleGroup('shared')}
                    viewMode={viewMode}
                    selectedBookmark={selectedBookmark}
                    onSelect={setSelectedBookmark}
                    onNavigate={handleNavigate}
                    onTogglePin={togglePin}
                    getThumbnailUrl={getThumbnailUrl}
                />

                {/* Empty state */}
                {filteredBookmarks.length === 0 && (
                    <div className="bookmarks-tab__empty">
                        {searchQuery ? 'No bookmarks match your search' : 'No bookmarks yet'}
                    </div>
                )}
            </div>

            {/* Selected bookmark details */}
            {selectedBookmarkData && (
                <SelectedBookmarkDetails
                    bookmark={selectedBookmarkData}
                    onClose={() => setSelectedBookmark(null)}
                    onNavigate={handleNavigate}
                    onDelete={handleDelete}
                />
            )}

            {/* Create Form */}
            {showCreateForm && (
                <CreateBookmarkForm
                    onSave={handleCreate}
                    onCancel={() => setShowCreateForm(false)}
                />
            )}

            {/* Footer */}
            {!selectedBookmark && !showCreateForm && (
                <div className="panel-footer">
                    <button
                        className="panel-footer__btn panel-footer__btn--primary"
                        onClick={() => setShowCreateForm(true)}
                    >
                        <Plus size={11} />
                        <span>Bookmark Current View</span>
                    </button>
                </div>
            )}
        </div>
    );
}

export default BookmarksPanelContent;