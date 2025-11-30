/**
 * ViewItem Component
 *
 * Represents a single view in the views list with expandable sliding panel.
 * Shows status, controls, and linked properties on hover.
 *
 * Main Row (Always Visible):
 * - Drag handle (appears on hover)
 * - Status dot (green=active, hollow=inactive)
 * - Editable name (double-click)
 * - Status icons
 * - Grid position badge
 * - Close button (hover)
 *
 * Sliding Panel (On Hover):
 * - Glassmorphism frosted glass effect
 * - Action buttons grouped by category
 * - Link property toggles
 */

import { memo, useState, useCallback, useRef, useEffect } from 'react';
import {
    GripVertical,
    X,
    Folder,
    Globe,
    Save,
    Users,
    Link2,
    Lock,
    Filter,
    Camera,
    Palette,
    MessageSquare,
    MousePointer,
    Layers,
} from 'lucide-react';
import { SlidingPanel } from './components/SlidingPanel';
import './ViewItem.scss';

// Status icon configuration
const STATUS_ICONS = {
    workspace: { icon: Folder, color: 'blue', tooltip: 'In workspace' },
    personal: { icon: Globe, color: 'teal', tooltip: 'Personal view' },
    preset: { icon: Save, color: 'green', tooltip: 'Saved preset' },
    shared: { icon: Users, color: 'pink', tooltip: 'Shared with team' },
    linked: { icon: Link2, color: 'purple', tooltip: 'Linked views' },
    locked: { icon: Lock, color: 'amber', tooltip: 'Locked' },
    filtered: { icon: Filter, color: 'indigo', tooltip: 'Has filters' },
};

export const ViewItem = memo(function ViewItem({
    view,
    isActive = false,
    isSelected = false,
    isDragging = false,
    linkedCount = 0,
    filterCount = 0,
    linkProperties = {},
    onSelect,
    onClose,
    onRename,
    onDragStart,
    onDragEnd,
    onNavigate,
    onSaveView,
    onShareView,
    onSpawnLink,
    onSizeChange,
    onLinkPropertyChange,
    className = '',
}) {
    const [isHovered, setIsHovered] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [editValue, setEditValue] = useState(view.name);
    const [showPanel, setShowPanel] = useState(false);
    const inputRef = useRef(null);
    const itemRef = useRef(null);

    // Handle double-click to edit name
    const handleDoubleClick = useCallback(() => {
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

    // Show panel with delay on hover
    useEffect(() => {
        let timeout;
        if (isHovered && !isEditing) {
            timeout = setTimeout(() => setShowPanel(true), 200);
        } else {
            setShowPanel(false);
        }
        return () => clearTimeout(timeout);
    }, [isHovered, isEditing]);

    // Build status badges
    const statusBadges = [];
    if (view.isWorkspace) statusBadges.push({ key: 'workspace', ...STATUS_ICONS.workspace });
    if (view.isPersonal) statusBadges.push({ key: 'personal', ...STATUS_ICONS.personal });
    if (view.isPreset) statusBadges.push({ key: 'preset', ...STATUS_ICONS.preset });
    if (view.isShared) statusBadges.push({ key: 'shared', ...STATUS_ICONS.shared });
    if (linkedCount > 0) statusBadges.push({ key: 'linked', ...STATUS_ICONS.linked, count: linkedCount });
    if (view.isLocked) statusBadges.push({ key: 'locked', ...STATUS_ICONS.locked });
    if (filterCount > 0) statusBadges.push({ key: 'filtered', ...STATUS_ICONS.filtered, count: filterCount });

    const classNames = [
        'view-item',
        isActive && 'view-item--active',
        isSelected && 'view-item--selected',
        isDragging && 'view-item--dragging',
        isHovered && 'view-item--hovered',
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
        >
            {/* Main Row */}
            <div className="view-item__main">
                {/* Drag Handle */}
                <div
                    className="view-item__drag-handle"
                    draggable
                    onDragStart={(e) => {
                        e.dataTransfer.effectAllowed = 'move';
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
                        />
                    ) : (
                        <span
                            className="view-item__name"
                            onDoubleClick={handleDoubleClick}
                            title={view.name}
                        >
                            {view.name}
                        </span>
                    )}
                </div>

                {/* Status Icons */}
                <div className="view-item__status-icons">
                    {statusBadges.map(({ key, icon: Icon, color, count, tooltip }) => (
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
                </div>

                {/* Grid Position */}
                {view.position && (
                    <span className="view-item__position" onClick={(e) => {
                        e.stopPropagation();
                        onNavigate?.(view.position);
                    }}>
                        {view.position.row + 1},{view.position.col + 1}
                    </span>
                )}

                {/* Close Button */}
                <button
                    className="view-item__close-btn"
                    onClick={(e) => {
                        e.stopPropagation();
                        onClose?.(view.id);
                    }}
                    title="Close view"
                >
                    <X size={12} />
                </button>
            </div>

            {/* Sliding Panel */}
            <SlidingPanel
                isVisible={showPanel}
                view={view}
                linkProperties={linkProperties}
                onSaveView={() => onSaveView?.(view.id)}
                onShareView={() => onShareView?.(view.id)}
                onSpawnLink={() => onSpawnLink?.(view.id)}
                onSizeChange={(size) => onSizeChange?.(view.id, size)}
                onLinkPropertyChange={(prop, value) => onLinkPropertyChange?.(view.id, prop, value)}
            />
        </div>
    );
});

export default ViewItem;