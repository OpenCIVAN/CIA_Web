// src/ui/react/components/panels/LeftPanel/tabs/CursorsTab/CursorsTab.jsx
// Cursors tab - cursor visibility and settings
//
// FIXES:
// - Header uses ALL CAPS styling like Files/Datasets

import React, { useState, useCallback } from 'react';
import {
    MousePointer2,
    Eye,
    EyeOff,
    Palette,
    Users,
    User,
    Settings,
    ChevronDown,
    ChevronRight,
} from 'lucide-react';
import './CursorsTab.scss';

// =============================================================================
// CONSTANTS
// =============================================================================

const DEFAULT_CURSOR_COLORS = [
    '#60a5fa', // blue
    '#34d399', // green
    '#fb7185', // pink
    '#fbbf24', // amber
    '#c084fc', // purple
    '#2dd4bf', // teal
];

// Sample online users - replace with real presence data
const SAMPLE_USERS = [
    { id: 'user-1', name: 'You', color: '#2dd4bf', isVisible: true, isSelf: true },
    { id: 'user-2', name: 'Dr. Sarah Smith', color: '#fb7185', isVisible: true, isSelf: false },
    { id: 'user-3', name: 'Alex Chen', color: '#60a5fa', isVisible: false, isSelf: false },
];

// =============================================================================
// SUB-COMPONENTS
// =============================================================================

function UserCursorRow({ user, onToggleVisibility, onChangeColor }) {
    const [showColorPicker, setShowColorPicker] = useState(false);

    return (
        <div className={`cursor-row ${user.isSelf ? 'cursor-row--self' : ''}`}>
            <div
                className="cursor-row__color"
                style={{ backgroundColor: user.color }}
                onClick={() => !user.isSelf && setShowColorPicker(!showColorPicker)}
                title={user.isSelf ? 'Your cursor color' : 'Click to change'}
            />
            <span className="cursor-row__name">
                {user.name}
                {user.isSelf && <span className="cursor-row__you">(you)</span>}
            </span>
            <button
                className="cursor-row__visibility"
                onClick={() => onToggleVisibility(user.id)}
                title={user.isVisible ? 'Hide cursor' : 'Show cursor'}
            >
                {user.isVisible ? <Eye size={14} /> : <EyeOff size={14} />}
            </button>

            {/* Color picker dropdown */}
            {showColorPicker && !user.isSelf && (
                <div className="cursor-row__color-picker">
                    {DEFAULT_CURSOR_COLORS.map(color => (
                        <button
                            key={color}
                            className="cursor-row__color-option"
                            style={{ backgroundColor: color }}
                            onClick={() => {
                                onChangeColor(user.id, color);
                                setShowColorPicker(false);
                            }}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}

function SettingsSection({ title, children, defaultExpanded = true }) {
    const [expanded, setExpanded] = useState(defaultExpanded);

    return (
        <div className={`settings-section ${expanded ? 'settings-section--expanded' : ''}`}>
            <button
                className="settings-section__header"
                onClick={() => setExpanded(!expanded)}
            >
                {expanded ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
                <span>{title}</span>
            </button>
            {expanded && (
                <div className="settings-section__content">
                    {children}
                </div>
            )}
        </div>
    );
}

// =============================================================================
// MAIN COMPONENT
// =============================================================================

export function CursorsPanelContent({ workspaceId }) {
    // State
    const [users, setUsers] = useState(SAMPLE_USERS);
    const [showAllCursors, setShowAllCursors] = useState(true);
    const [cursorSize, setCursorSize] = useState('medium');
    const [showLabels, setShowLabels] = useState(true);
    const [showTrails, setShowTrails] = useState(false);

    // Handlers
    const toggleUserVisibility = useCallback((userId) => {
        setUsers(prev => prev.map(u =>
            u.id === userId ? { ...u, isVisible: !u.isVisible } : u
        ));
    }, []);

    const changeUserColor = useCallback((userId, color) => {
        setUsers(prev => prev.map(u =>
            u.id === userId ? { ...u, color } : u
        ));
    }, []);

    const toggleAllCursors = useCallback(() => {
        const newValue = !showAllCursors;
        setShowAllCursors(newValue);
        setUsers(prev => prev.map(u => ({ ...u, isVisible: newValue })));
    }, [showAllCursors]);

    // Count visible
    const visibleCount = users.filter(u => u.isVisible).length;

    return (
        <div className="cursors-tab">
            {/* Header - ALL CAPS like other tabs */}
            <div className="panel-header panel-header--teal">
                <MousePointer2 size={16} className="panel-header__icon" />
                <span className="panel-header__title">Cursors</span>
                <span className="panel-header__count">{visibleCount}/{users.length}</span>
            </div>

            {/* Quick toggle */}
            <div className="cursors-tab__quick-toggle">
                <button
                    className={`quick-toggle-btn ${showAllCursors ? 'quick-toggle-btn--active' : ''}`}
                    onClick={toggleAllCursors}
                >
                    {showAllCursors ? <Eye size={14} /> : <EyeOff size={14} />}
                    {showAllCursors ? 'Hide All' : 'Show All'}
                </button>
            </div>

            {/* User list */}
            <div className="cursors-tab__users">
                <div className="cursors-tab__users-header">
                    <Users size={12} />
                    <span>Online Users</span>
                    <span className="cursors-tab__users-count">{users.length}</span>
                </div>
                <div className="cursors-tab__users-list">
                    {users.map(user => (
                        <UserCursorRow
                            key={user.id}
                            user={user}
                            onToggleVisibility={toggleUserVisibility}
                            onChangeColor={changeUserColor}
                        />
                    ))}
                </div>
            </div>

            {/* Settings */}
            <div className="cursors-tab__settings">
                <SettingsSection title="Display Settings">
                    <div className="setting-row">
                        <span>Cursor Size</span>
                        <select
                            value={cursorSize}
                            onChange={(e) => setCursorSize(e.target.value)}
                            className="setting-select"
                        >
                            <option value="small">Small</option>
                            <option value="medium">Medium</option>
                            <option value="large">Large</option>
                        </select>
                    </div>
                    <div className="setting-row">
                        <span>Show Labels</span>
                        <button
                            className={`setting-toggle ${showLabels ? 'setting-toggle--on' : ''}`}
                            onClick={() => setShowLabels(!showLabels)}
                        >
                            {showLabels ? 'On' : 'Off'}
                        </button>
                    </div>
                    <div className="setting-row">
                        <span>Cursor Trails</span>
                        <button
                            className={`setting-toggle ${showTrails ? 'setting-toggle--on' : ''}`}
                            onClick={() => setShowTrails(!showTrails)}
                        >
                            {showTrails ? 'On' : 'Off'}
                        </button>
                    </div>
                </SettingsSection>

                <SettingsSection title="My Cursor" defaultExpanded={false}>
                    <div className="my-cursor-settings">
                        <div className="setting-row">
                            <span>Color</span>
                            <div className="color-swatches">
                                {DEFAULT_CURSOR_COLORS.map(color => (
                                    <button
                                        key={color}
                                        className={`color-swatch ${users[0]?.color === color ? 'color-swatch--active' : ''}`}
                                        style={{ backgroundColor: color }}
                                        onClick={() => changeUserColor('user-1', color)}
                                    />
                                ))}
                            </div>
                        </div>
                    </div>
                </SettingsSection>
            </div>
        </div>
    );
}

export default CursorsPanelContent;