/**
 * ViewItemContextMenu Component
 * Location: src/ui/react/components/common/ViewItem/components/ViewItemContextMenu.jsx
 *
 * Right-click context menu for ViewItem with keyboard shortcuts.
 * Portaled to document.body for proper stacking.
 */

import React, { useEffect, useCallback, useRef } from 'react';
import { createPortal } from 'react-dom';
import {
    IconEdit,
    IconCopy,
    IconSettings,
    IconClose,
    IconDelete,
    IconShare,
    IconSave,
    IconExternalLink,
} from '@UI/react/components/common/Icon';
import NavigationOutlined from '@mui/icons-material/NavigationOutlined';
import GridViewOutlined from '@mui/icons-material/GridViewOutlined';
import './ViewItemContextMenu.scss';

// =============================================================================
// MENU ITEM COMPONENT
// =============================================================================

function MenuItem({ icon: Icon, label, shortcut, primary, danger, onClick }) {
    return (
        <button
            className={`view-context-menu__item ${primary ? 'view-context-menu__item--primary' : ''} ${danger ? 'view-context-menu__item--danger' : ''}`}
            onClick={onClick}
        >
            <Icon size={14} />
            <span>{label}</span>
            {shortcut && (
                <span className="view-context-menu__shortcut">{shortcut}</span>
            )}
        </button>
    );
}

// =============================================================================
// MAIN COMPONENT
// =============================================================================

export function ViewItemContextMenu({
    view,
    position,
    isPlaced = false,
    onClose,
    onSelect,
    onRename,
    onDuplicate,
    onShare,
    onTrash,
    onSettings,
    onPlaceOnCanvas,
    onRemoveFromCanvas,
    onNavigate,
    onSaveState,
    onOpenInNewWindow,
}) {
    const menuRef = useRef(null);

    // Position menu within viewport bounds
    const getMenuPosition = useCallback(() => {
        if (!position) return { left: 0, top: 0 };

        const menuWidth = 220;
        const menuHeight = 320;

        let left = position.x;
        let top = position.y;

        // Keep within viewport
        if (left + menuWidth > window.innerWidth - 8) {
            left = window.innerWidth - menuWidth - 8;
        }
        if (top + menuHeight > window.innerHeight - 8) {
            top = window.innerHeight - menuHeight - 8;
        }

        return { left: Math.max(8, left), top: Math.max(8, top) };
    }, [position]);

    // Close on click outside
    useEffect(() => {
        const handleClick = (e) => {
            if (menuRef.current && !menuRef.current.contains(e.target)) {
                onClose?.();
            }
        };

        const handleEscape = (e) => {
            if (e.key === 'Escape') {
                onClose?.();
            }
        };

        document.addEventListener('mousedown', handleClick);
        document.addEventListener('keydown', handleEscape);

        return () => {
            document.removeEventListener('mousedown', handleClick);
            document.removeEventListener('keydown', handleEscape);
        };
    }, [onClose]);

    // Keyboard shortcuts
    useEffect(() => {
        const handleKeyDown = (e) => {
            switch (e.key) {
                case 'F2':
                    e.preventDefault();
                    onRename?.();
                    break;
                case 'd':
                    if (e.ctrlKey || e.metaKey) {
                        e.preventDefault();
                        onDuplicate?.();
                    }
                    break;
                case 'Delete':
                case 'Backspace':
                    if (!e.ctrlKey && !e.metaKey) {
                        e.preventDefault();
                        onTrash?.();
                    }
                    break;
            }
        };

        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, [onRename, onDuplicate, onTrash]);

    const menuStyle = getMenuPosition();

    const menuContent = (
        <div
            ref={menuRef}
            className="view-context-menu"
            style={{
                position: 'fixed',
                left: menuStyle.left,
                top: menuStyle.top,
            }}
        >
            {/* Header with view name */}
            <div className="view-context-menu__header">
                <div
                    className="view-context-menu__color-dot"
                    style={{ background: view?.color || 'var(--color-accent-primary)' }}
                />
                <span className="view-context-menu__title">{view?.name || 'Unnamed View'}</span>
            </div>

            <div className="view-context-menu__divider" />

            {/* Navigation / Placement */}
            {isPlaced ? (
                <MenuItem
                    icon={NavigationOutlined}
                    label="Go to Location"
                    shortcut={view?.position ? `[${view.position.row + 1},${view.position.col + 1}]` : null}
                    onClick={onNavigate}
                />
            ) : (
                <MenuItem
                    icon={GridViewOutlined}
                    label="Place on Canvas"
                    primary
                    onClick={onPlaceOnCanvas}
                />
            )}

            <div className="view-context-menu__divider" />

            {/* Edit Actions */}
            <MenuItem icon={IconEdit} label="Rename" shortcut="F2" onClick={onRename} />
            <MenuItem icon={IconCopy} label="Duplicate View" shortcut="⌘D" onClick={onDuplicate} />
            <MenuItem icon={IconShare} label="Share..." onClick={onShare} />
            <MenuItem icon={IconSettings} label="View Settings..." onClick={onSettings} />

            <div className="view-context-menu__divider" />

            {/* State Actions */}
            <MenuItem icon={IconSave} label="Save Current State" onClick={onSaveState} />
            {onOpenInNewWindow && (
                <MenuItem icon={IconExternalLink} label="Open in New Window" onClick={onOpenInNewWindow} />
            )}

            <div className="view-context-menu__divider" />

            {/* Destructive Actions */}
            {isPlaced && (
                <MenuItem icon={IconClose} label="Remove from Canvas" onClick={onRemoveFromCanvas} />
            )}
            <MenuItem icon={IconDelete} label="Move to Trash" danger onClick={onTrash} />
        </div>
    );

    return createPortal(menuContent, document.body);
}

export default ViewItemContextMenu;