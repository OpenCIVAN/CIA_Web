/**
 * ViewItem Component
 *
 * Represents a single view in the views list.
 * 
 * UPDATED December 11, 2025:
 * - Disabled hover sliding panel (was too obstructive)
 * - Added "Place on Canvas" quick action for unplaced views
 * - Added right-click context menu for common actions
 * - Settings modal remains accessible via gear icon
 *
 * Main Row (Always Visible):
 * - Drag handle (appears on hover)
 * - Status dot (green=active, hollow=inactive)
 * - Editable name (double-click)
 * - Status icons
 * - Grid position badge
 * - Quick actions on hover
 * - Close/Trash buttons
 *
 * Right-click Context Menu:
 * - Place on Canvas (if not placed)
 * - Go to Location (if placed)
 * - Rename
 * - Spawn Copy
 * - Remove from Canvas / Delete
 */

import React, { memo, useState, useCallback, useRef, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import {
    GripVertical,
    X,
    Trash2,
    Folder,
    Globe,
    Save,
    Users,
    Link2,
    Lock,
    Filter,
    Settings,
    LayoutGrid,
    Navigation,
    Pencil,
    Copy,
    ExternalLink,
} from 'lucide-react';
import { ViewSettingsModal } from './components/ViewSettingsModal';
import './ViewItem.scss';

// Status icon configuration (v3 design)
const STATUS_ICONS = {
    starredWorkspace: { icon: Folder, color: 'purple', tooltip: 'Saved to Workspace' },
    starredPersonal: { icon: Globe, color: 'gold', tooltip: 'Saved to Personal' },
    hasSavedState: { icon: Save, color: 'amber', tooltip: 'Has saved state preset' },
    shared: { icon: Users, color: 'pink', tooltip: 'Shared with collaborators' },
    linked: { icon: Link2, color: 'teal', tooltip: 'Linked properties' },
    locked: { icon: Lock, color: 'amber', tooltip: 'Locked' },
    filtered: { icon: Filter, color: 'purple', tooltip: 'Active filters' },
};

export const ViewItem = memo(function ViewItem({
    view,
    isActive = false,
    isSelected = false,
    isDragging = false,
    linkedCount = 0,
    filterCount = 0,
    linkProperties = {},
    linkConfig = {},
    availableViews = [],
    linkedParent = null,
    linkTarget = null,
    onSelect,
    onClose,
    onTrash,
    onRename,
    onDragStart,
    onDragEnd,
    onNavigate,
    onStarWorkspace,
    onStarPersonal,
    onSaveState,
    onLoadState,
    onShareView,
    onSpawn,
    onConfigureLinks,
    onToggleAllLinks,
    onSizeChange,
    onLinkPropertyChange,
    className = '',
}) {
    const [isHovered, setIsHovered] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [editValue, setEditValue] = useState(view.name);
    const [showSettingsModal, setShowSettingsModal] = useState(false);
    const [contextMenu, setContextMenu] = useState(null); // { x, y }
    const inputRef = useRef(null);
    const itemRef = useRef(null);

    // Check if view is placed on canvas
    const isPlaced = !!view.position;

    // Handle double-click to edit name
    const handleDoubleClick = useCallback((e) => {
        e.stopPropagation();
        setIsEditing(true);
        setEditValue(view.name);
    }, [view.name]);

    // Handle name edit completion
    const handleEditComplete = useCallback(() => {
        setIsEditing(false);
        if (editValue.trim() && editValue !== view.name) {
            onRename?.(view.id, editValue.trim());
        }
    }, [editValue, view.name, view.id, onRename]);

    // Handle edit key events
    const handleEditKeyDown = useCallback((e) => {
        if (e.key === 'Enter') {
            handleEditComplete();
        } else if (e.key === 'Escape') {
            setIsEditing(false);
            setEditValue(view.name);
        }
    }, [handleEditComplete, view.name]);

    // Focus input when editing starts
    useEffect(() => {
        if (isEditing && inputRef.current) {
            inputRef.current.focus();
            inputRef.current.select();
        }
    }, [isEditing]);

    // Handle right-click context menu
    const handleContextMenu = useCallback((e) => {
        e.preventDefault();
        e.stopPropagation();
        setContextMenu({ x: e.clientX, y: e.clientY });
    }, []);

    // Close context menu
    const closeContextMenu = useCallback(() => {
        setContextMenu(null);
    }, []);

    // Handle "Place on Canvas" action
    const handlePlaceOnCanvas = useCallback((e) => {
        e?.stopPropagation();
        // Select the view which should trigger placement
        onSelect?.(view.id);
        // Or explicitly request placement:
        window.dispatchEvent(new CustomEvent('cia:request-instance', {
            detail: { viewId: view.id, spawnNew: false }
        }));
    }, [view.id, onSelect]);

    // Build status badges (v3 design) - max 3 visible, rest shown as overflow
    const MAX_VISIBLE_BADGES = 3;

    const allBadges = useMemo(() => {
        const badges = [];
        if (view.starredWorkspace) badges.push({ key: 'starredWorkspace', ...STATUS_ICONS.starredWorkspace });
        if (view.starredPersonal) badges.push({ key: 'starredPersonal', ...STATUS_ICONS.starredPersonal });
        if (view.hasSavedState) badges.push({ key: 'hasSavedState', ...STATUS_ICONS.hasSavedState });
        if (view.isShared) badges.push({ key: 'shared', ...STATUS_ICONS.shared });
        if (linkedCount > 0) badges.push({ key: 'linked', ...STATUS_ICONS.linked, count: linkedCount });
        if (view.isLocked) badges.push({ key: 'locked', ...STATUS_ICONS.locked });
        if (filterCount > 0) badges.push({ key: 'filtered', ...STATUS_ICONS.filtered, count: filterCount });
        return badges;
    }, [view.starredWorkspace, view.starredPersonal, view.hasSavedState, view.isShared, view.isLocked, linkedCount, filterCount]);

    const visibleBadges = allBadges.slice(0, MAX_VISIBLE_BADGES);
    const overflowCount = allBadges.length - MAX_VISIBLE_BADGES;
    const overflowBadges = allBadges.slice(MAX_VISIBLE_BADGES);

    const classNames = [
        'view-item',
        isActive && 'view-item--active',
        isSelected && 'view-item--selected',
        isDragging && 'view-item--dragging',
        isHovered && 'view-item--hovered',
        !isPlaced && 'view-item--not-placed',
        className,
    ].filter(Boolean).join(' ');

    return (
        <div
            ref={itemRef}
            className={classNames}
            style={{ '--view-color': view.color || '#60a5fa' }}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            onClick={() => onSelect?.(view.id)}
            onContextMenu={handleContextMenu}
        >
            {/* Main Row */}
            <div className="view-item__main">
                {/* Drag Handle */}
                <div
                    className="view-item__drag-handle"
                    draggable
                    onDragStart={(e) => {
                        e.dataTransfer.effectAllowed = 'copyMove';
                        // Set data for internal reordering
                        e.dataTransfer.setData('text/plain', view.id);
                        // Set data for external drop targets (CanvasCell, GridLayoutPreview)
                        e.dataTransfer.setData('application/x-viewitem', JSON.stringify({
                            id: view.id,
                            name: view.name,
                            color: view.color,
                            size: view.size,
                            viewConfigId: view.id,
                        }));
                        onDragStart?.(view.id);
                    }}
                    onDragEnd={onDragEnd}
                >
                    <GripVertical size={12} />
                </div>

                {/* Status Dot */}
                <div
                    className={`view-item__status-dot ${isActive ? 'view-item__status-dot--active' : ''}`}
                    title={isActive ? 'Active' : 'Inactive'}
                />

                {/* Name */}
                <div className="view-item__name-container">
                    {isEditing ? (
                        <input
                            ref={inputRef}
                            type="text"
                            className="view-item__name-input"
                            value={editValue}
                            onChange={(e) => setEditValue(e.target.value)}
                            onBlur={handleEditComplete}
                            onKeyDown={handleEditKeyDown}
                            onClick={(e) => e.stopPropagation()}
                        />
                    ) : (
                        <span
                            className="view-item__name"
                            onDoubleClick={handleDoubleClick}
                            title={`${view.name} (double-click to rename)`}
                        >
                            {view.name}
                        </span>
                    )}
                </div>

                {/* Status Icons - truncated with overflow indicator */}
                <div className="view-item__status-icons">
                    {visibleBadges.map(({ key, icon: Icon, color, count, tooltip }) => (
                        <span
                            key={key}
                            className="view-item__status-icon"
                            data-color={color}
                            title={tooltip}
                        >
                            <Icon size={12} />
                            {count && <span className="view-item__status-count">{count}</span>}
                        </span>
                    ))}
                    {overflowCount > 0 && (
                        <span
                            className="view-item__status-overflow"
                            title={overflowBadges.map(b => b.tooltip).join(', ')}
                        >
                            +{overflowCount}
                        </span>
                    )}
                </div>

                {/* Grid Position OR "Place" button for unplaced views */}
                {isPlaced ? (
                    <span
                        className="view-item__position"
                        onClick={(e) => {
                            e.stopPropagation();
                            onNavigate?.(view.position);
                        }}
                        title="Click to navigate"
                    >
                        {view.position.row + 1},{view.position.col + 1}
                    </span>
                ) : (
                    /* Quick action for unplaced views - always visible */
                    <button
                        className="view-item__place-btn"
                        onClick={handlePlaceOnCanvas}
                        title="Place on Canvas"
                    >
                        <LayoutGrid size={12} />
                        <span>Place</span>
                    </button>
                )}

                {/* Action Buttons */}
                <div className="view-item__actions">
                    {/* Settings Button - opens modal for view configuration */}
                    <button
                        className="view-item__action-btn view-item__settings-btn"
                        onClick={(e) => {
                            e.stopPropagation();
                            setShowSettingsModal(true);
                        }}
                        title="View settings"
                    >
                        <Settings size={12} />
                    </button>

                    {/* Close Button - only show for active views (deactivate, remove from canvas) */}
                    {isActive && (
                        <button
                            className="view-item__action-btn view-item__close-btn"
                            onClick={(e) => {
                                e.stopPropagation();
                                onClose?.(view.id);
                            }}
                            title="Close view (remove from canvas)"
                        >
                            <X size={12} />
                        </button>
                    )}

                    {/* Trash Button - move to Recently Deleted */}
                    <button
                        className="view-item__action-btn view-item__trash-btn"
                        onClick={(e) => {
                            e.stopPropagation();
                            onTrash?.(view.id);
                        }}
                        title="Delete view"
                    >
                        <Trash2 size={12} />
                    </button>
                </div>
            </div>

            {/* Context Menu */}
            {contextMenu && createPortal(
                <ViewItemContextMenu
                    view={view}
                    position={contextMenu}
                    isPlaced={isPlaced}
                    onClose={closeContextMenu}
                    onRename={() => {
                        closeContextMenu();
                        setIsEditing(true);
                    }}
                    onNavigate={() => {
                        if (view.position) {
                            onNavigate?.(view.position);
                        }
                        closeContextMenu();
                    }}
                    onPlace={() => {
                        handlePlaceOnCanvas();
                        closeContextMenu();
                    }}
                    onSpawn={() => {
                        onSpawn?.(view.id);
                        closeContextMenu();
                    }}
                    onCloseView={() => {
                        onClose?.(view.id);
                        closeContextMenu();
                    }}
                    onTrash={() => {
                        onTrash?.(view.id);
                        closeContextMenu();
                    }}
                    onOpenSettings={() => {
                        setShowSettingsModal(true);
                        closeContextMenu();
                    }}
                />,
                document.body
            )}

            {/* Settings Modal */}
            {showSettingsModal && (
                <ViewSettingsModal
                    view={view}
                    linkConfig={linkConfig}
                    availableViews={availableViews}
                    onClose={() => setShowSettingsModal(false)}
                    onSizeChange={(size) => onSizeChange?.(view.id, size)}
                    onLinkPropertyChange={(prop, value) => onLinkPropertyChange?.(view.id, prop, value)}
                    onToggleAllLinks={(linked) => onToggleAllLinks?.(view.id, linked)}
                />
            )}
        </div>
    );
});

// =============================================================================
// CONTEXT MENU COMPONENT
// =============================================================================

function ViewItemContextMenu({
    view,
    position,
    isPlaced,
    onClose,
    onRename,
    onNavigate,
    onPlace,
    onSpawn,
    onCloseView,
    onTrash,
    onOpenSettings,
}) {
    const menuRef = useRef(null);

    // Close on click outside
    useEffect(() => {
        const handleClickOutside = (e) => {
            if (menuRef.current && !menuRef.current.contains(e.target)) {
                onClose();
            }
        };

        // Small delay to prevent immediate close from the triggering click
        const timeoutId = setTimeout(() => {
            document.addEventListener('mousedown', handleClickOutside);
        }, 10);

        return () => {
            clearTimeout(timeoutId);
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [onClose]);

    // Close on escape
    useEffect(() => {
        const handleEscape = (e) => {
            if (e.key === 'Escape') onClose();
        };
        document.addEventListener('keydown', handleEscape);
        return () => document.removeEventListener('keydown', handleEscape);
    }, [onClose]);

    // Position the menu (keep in viewport)
    const style = useMemo(() => {
        const menuWidth = 200;
        const menuHeight = 280;

        let x = position.x;
        let y = position.y;

        // Keep in viewport
        if (x + menuWidth > window.innerWidth) {
            x = window.innerWidth - menuWidth - 8;
        }
        if (y + menuHeight > window.innerHeight) {
            y = window.innerHeight - menuHeight - 8;
        }
        if (x < 8) x = 8;
        if (y < 8) y = 8;

        return {
            position: 'fixed',
            left: x,
            top: y,
            zIndex: 10000,
        };
    }, [position]);

    return (
        <div ref={menuRef} className="view-item-context-menu" style={style}>
            {/* Header */}
            <div className="view-item-context-menu__header">
                <span
                    className="view-item-context-menu__color-dot"
                    style={{ background: view.color || '#60a5fa' }}
                />
                <span className="view-item-context-menu__title">{view.name}</span>
            </div>

            <div className="view-item-context-menu__divider" />

            {/* Primary Action - Place or Navigate */}
            {isPlaced ? (
                <button
                    className="view-item-context-menu__item"
                    onClick={onNavigate}
                >
                    <Navigation size={14} />
                    <span>Go to Location</span>
                    <span className="view-item-context-menu__shortcut">
                        [{view.position.row + 1},{view.position.col + 1}]
                    </span>
                </button>
            ) : (
                <button
                    className="view-item-context-menu__item view-item-context-menu__item--primary"
                    onClick={onPlace}
                >
                    <LayoutGrid size={14} />
                    <span>Place on Canvas</span>
                </button>
            )}

            <div className="view-item-context-menu__divider" />

            {/* Edit Actions */}
            <button
                className="view-item-context-menu__item"
                onClick={onRename}
            >
                <Pencil size={14} />
                <span>Rename</span>
                <span className="view-item-context-menu__shortcut">F2</span>
            </button>

            <button
                className="view-item-context-menu__item"
                onClick={onSpawn}
            >
                <Copy size={14} />
                <span>Duplicate View</span>
            </button>

            <button
                className="view-item-context-menu__item"
                onClick={onOpenSettings}
            >
                <Settings size={14} />
                <span>View Settings...</span>
            </button>

            <div className="view-item-context-menu__divider" />

            {/* Destructive Actions */}
            {isPlaced && (
                <button
                    className="view-item-context-menu__item"
                    onClick={onCloseView}
                >
                    <X size={14} />
                    <span>Remove from Canvas</span>
                </button>
            )}

            <button
                className="view-item-context-menu__item view-item-context-menu__item--danger"
                onClick={onTrash}
            >
                <Trash2 size={14} />
                <span>Move to Trash</span>
            </button>
        </div>
    );
}

export default ViewItem;