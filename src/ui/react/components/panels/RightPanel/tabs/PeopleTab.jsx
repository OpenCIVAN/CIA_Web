// src/ui/react/components/panels/RightPanel/tabs/PeopleTab.jsx
// People tab with Room/Workspace/Project subtabs for Space Navigation system

import React, { useState, useCallback, useMemo } from 'react';
import {
    Users,
    Search,
    X,
    UserPlus,
    Settings,
    Circle,
    Mic,
    MicOff,
    Hand,
    Eye,
    EyeOff,
    Home,
    Layout,
    Globe,
} from 'lucide-react';
import {
    ResizableSectionsContainer,
    ResizableSection,
    useSectionStates
} from "@UI/react/components/common/ResizableSections";
import { usePresence } from '@UI/react/hooks/usePresence.js';
import { useRoomPresence, useWorkspacePresence, useProjectPresence } from '@UI/react/hooks/useRoomPresence.js';
import { createLogger } from '@Utils/logger.js';

const log = createLogger('presence');

// =============================================================================
// STATUS CONFIGURATION
// =============================================================================

const STATUS_CONFIG = {
    active: { icon: Circle, color: '#4ade80', fill: true, label: 'Active' },
    online: { icon: Circle, color: '#4ade80', fill: true, label: 'Online' },
    idle: { icon: Circle, color: '#fbbf24', fill: true, label: 'Idle' },
    away: { icon: Circle, color: '#94a3b8', fill: false, label: 'Away' },
    dnd: { icon: Circle, color: '#ef4444', fill: true, label: 'Do Not Disturb' },
    offline: { icon: Circle, color: '#475569', fill: false, label: 'Offline' },
};

// =============================================================================
// SUB-COMPONENTS
// =============================================================================

function UserAvatar({ userName, color, status = 'active', size = 'md' }) {
    const initial = (userName || 'U')[0].toUpperCase();
    const sizeMap = { sm: 28, md: 32, lg: 40 };
    const px = sizeMap[size] || sizeMap.md;

    return (
        <div style={{
            position: 'relative',
            width: px,
            height: px,
            borderRadius: '50%',
            background: color || '#666',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: px * 0.4,
            fontWeight: 600,
            color: 'white',
            flexShrink: 0,
        }}>
            {initial}
            <div style={{
                position: 'absolute',
                bottom: -1,
                right: -1,
                width: 10,
                height: 10,
                borderRadius: '50%',
                background: STATUS_CONFIG[status]?.color || '#666',
                border: '2px solid var(--color-bg-secondary, #252526)',
            }} />
        </div>
    );
}

function MemberRow({ user, isSelected, onSelect, showVoice, showWorkspace, showCursor, showRoom }) {
    const status = user.status || 'active';
    const statusConfig = STATUS_CONFIG[status] || STATUS_CONFIG.active;

    return (
        <div
            style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                padding: '8px 12px',
                cursor: 'pointer',
                background: isSelected ? 'rgba(255,255,255,0.05)' : 'transparent',
                borderLeft: isSelected ? '2px solid #60a5fa' : '2px solid transparent',
                transition: 'all 0.15s ease',
            }}
            onClick={() => onSelect?.(user.clientId || user.userId)}
        >
            <UserAvatar
                userName={user.userName}
                color={user.userColor}
                status={status}
                size="sm"
            />
            <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{
                    fontSize: '12px',
                    fontWeight: 500,
                    color: 'var(--color-text-primary, #fff)',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                }}>
                    {user.userName || 'Anonymous'}
                    {user.isYou && <span style={{ color: '#60a5fa', marginLeft: '4px' }}>(you)</span>}
                </div>
                <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    fontSize: '10px',
                    color: 'var(--color-text-muted, #666)',
                }}>
                    <Circle
                        size={6}
                        fill={statusConfig.fill ? statusConfig.color : 'none'}
                        color={statusConfig.color}
                    />
                    {statusConfig.label}
                    {showRoom && user.roomId && (
                        <span style={{ marginLeft: '4px', opacity: 0.7 }}>
                            • {user.roomName || 'Room'}
                        </span>
                    )}
                </div>
            </div>

            {user.inVoice && (
                <div style={{ display: 'flex', gap: '4px' }}>
                    {user.isMuted ? (
                        <MicOff size={12} style={{ color: '#ef4444' }} />
                    ) : (
                        <Mic size={12} style={{ color: '#4ade80' }} />
                    )}
                </div>
            )}
        </div>
    );
}

function EmptyState({ message }) {
    return (
        <div style={{
            padding: '24px',
            textAlign: 'center',
            color: 'var(--color-text-muted, #666)',
            fontSize: '12px',
        }}>
            {message}
        </div>
    );
}

// =============================================================================
// SUBTAB TOGGLE (3 tabs)
// =============================================================================

function SubtabToggle({ activeTab, onChange }) {
    const tabs = [
        { id: 'room', icon: Home, label: 'Room', color: '#60a5fa' },
        { id: 'workspace', icon: Layout, label: 'Workspace', color: '#2dd4bf' },
        { id: 'project', icon: Globe, label: 'Project', color: '#f472b6' },
    ];

    return (
        <div style={{
            display: 'flex',
            gap: '2px',
            padding: '4px',
            background: 'rgba(255,255,255,0.03)',
            borderRadius: '6px',
            margin: '8px 12px',
        }}>
            {tabs.map(({ id, icon: Icon, label, color }) => (
                <button
                    key={id}
                    onClick={() => onChange(id)}
                    style={{
                        flex: 1,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '4px',
                        padding: '6px 8px',
                        background: activeTab === id ? `${color}22` : 'transparent',
                        border: 'none',
                        borderRadius: '4px',
                        color: activeTab === id ? color : 'var(--color-text-muted, #666)',
                        fontSize: '10px',
                        fontWeight: 500,
                        cursor: 'pointer',
                        transition: 'all 0.15s ease',
                    }}
                >
                    <Icon size={11} />
                    {label}
                </button>
            ))}
        </div>
    );
}

// =============================================================================
// ROOM SUBTAB
// =============================================================================

function RoomSubtab({ roomId, searchQuery, selectedMember, onSelectMember }) {
    const { users, inVoice, notInVoice } = useRoomPresence(roomId);

    const filteredInVoice = useMemo(() => {
        if (!searchQuery.trim()) return inVoice;
        const q = searchQuery.toLowerCase();
        return inVoice.filter(u => u.userName?.toLowerCase().includes(q));
    }, [inVoice, searchQuery]);

    const filteredNotInVoice = useMemo(() => {
        if (!searchQuery.trim()) return notInVoice;
        const q = searchQuery.toLowerCase();
        return notInVoice.filter(u => u.userName?.toLowerCase().includes(q));
    }, [notInVoice, searchQuery]);

    const { states: sectionStates, toggleSection } = useSectionStates({
        voice: { expanded: true, flexGrow: 1 },
        room: { expanded: true, flexGrow: 2 },
    });

    return (
        <ResizableSectionsContainer
            className="people-tab__sections"
            sectionStates={sectionStates}
            onSectionToggle={toggleSection}
        >
            <ResizableSection id="voice" icon={Mic} iconColorClass="icon-green" label="In Voice" count={filteredInVoice.length}>
                {filteredInVoice.length === 0 ? (
                    <EmptyState message="No one in voice" />
                ) : (
                    filteredInVoice.map(user => (
                        <MemberRow key={user.clientId || user.userId} user={user} isSelected={selectedMember === (user.clientId || user.userId)} onSelect={onSelectMember} showVoice />
                    ))
                )}
            </ResizableSection>

            <ResizableSection id="room" icon={Users} iconColorClass="icon-blue" label="In Room" count={filteredNotInVoice.length}>
                {filteredNotInVoice.length === 0 ? (
                    <EmptyState message="No other users in room" />
                ) : (
                    filteredNotInVoice.map(user => (
                        <MemberRow key={user.clientId || user.userId} user={user} isSelected={selectedMember === (user.clientId || user.userId)} onSelect={onSelectMember} showWorkspace />
                    ))
                )}
            </ResizableSection>
        </ResizableSectionsContainer>
    );
}

// =============================================================================
// WORKSPACE SUBTAB
// =============================================================================

function WorkspaceSubtab({ workspaceId, searchQuery, selectedMember, onSelectMember }) {
    const { users } = useWorkspacePresence(workspaceId);
    const [showMyCursor, setShowMyCursor] = useState(true);
    const [showAllCursors, setShowAllCursors] = useState(true);

    const filteredUsers = useMemo(() => {
        if (!searchQuery.trim()) return users;
        const q = searchQuery.toLowerCase();
        return users.filter(u => u.userName?.toLowerCase().includes(q));
    }, [users, searchQuery]);

    return (
        <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
            <div style={{ flex: 1, overflow: 'auto' }}>
                <div style={{ padding: '8px 12px', fontSize: '10px', color: 'var(--color-text-muted)', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                    Viewing This Workspace ({filteredUsers.length})
                </div>
                {filteredUsers.length === 0 ? (
                    <EmptyState message="No one else viewing this workspace" />
                ) : (
                    filteredUsers.map(user => (
                        <MemberRow key={user.clientId || user.userId} user={user} isSelected={selectedMember === (user.clientId || user.userId)} onSelect={onSelectMember} showCursor />
                    ))
                )}
            </div>

            <div style={{ padding: '12px', borderTop: '1px solid rgba(255,255,255,0.05)', background: 'rgba(0,0,0,0.1)' }}>
                <div style={{ fontSize: '10px', fontWeight: 600, color: 'var(--color-text-muted)', marginBottom: '8px' }}>Cursor Settings</div>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '11px', color: 'var(--color-text-secondary)', cursor: 'pointer', marginBottom: '6px' }}>
                    <input type="checkbox" checked={showMyCursor} onChange={(e) => setShowMyCursor(e.target.checked)} />
                    Show my cursor to others
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '11px', color: 'var(--color-text-secondary)', cursor: 'pointer' }}>
                    <input type="checkbox" checked={showAllCursors} onChange={(e) => setShowAllCursors(e.target.checked)} />
                    Show all cursors
                </label>
            </div>
        </div>
    );
}

// =============================================================================
// PROJECT SUBTAB (NEW)
// =============================================================================

function ProjectSubtab({ searchQuery, selectedMember, onSelectMember }) {
    const { allUsers, byRoom, totalOnline } = useProjectPresence();

    const filteredUsers = useMemo(() => {
        if (!searchQuery.trim()) return allUsers;
        const q = searchQuery.toLowerCase();
        return allUsers.filter(u => u.userName?.toLowerCase().includes(q));
    }, [allUsers, searchQuery]);

    // Group filtered users by room
    const groupedByRoom = useMemo(() => {
        const groups = {};
        filteredUsers.forEach(user => {
            const roomId = user.roomId || 'unknown';
            if (!groups[roomId]) {
                groups[roomId] = { roomName: user.roomName || 'Unknown Room', users: [] };
            }
            groups[roomId].users.push(user);
        });
        return groups;
    }, [filteredUsers]);

    const roomIds = Object.keys(groupedByRoom);

    return (
        <div style={{ flex: 1, overflow: 'auto' }}>
            <div style={{ padding: '8px 12px', fontSize: '10px', color: 'var(--color-text-muted)', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                All Project Members ({totalOnline} online)
            </div>

            {filteredUsers.length === 0 ? (
                <EmptyState message="No users online in project" />
            ) : (
                roomIds.map(roomId => (
                    <div key={roomId}>
                        <div style={{
                            padding: '6px 12px',
                            fontSize: '10px',
                            fontWeight: 600,
                            color: 'var(--color-text-muted)',
                            background: 'rgba(255,255,255,0.02)',
                            borderBottom: '1px solid rgba(255,255,255,0.03)',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px',
                        }}>
                            <Home size={10} />
                            {groupedByRoom[roomId].roomName}
                            <span style={{ opacity: 0.6 }}>({groupedByRoom[roomId].users.length})</span>
                        </div>
                        {groupedByRoom[roomId].users.map(user => (
                            <MemberRow
                                key={user.clientId || user.userId}
                                user={user}
                                isSelected={selectedMember === (user.clientId || user.userId)}
                                onSelect={onSelectMember}
                                showRoom={false}
                            />
                        ))}
                    </div>
                ))
            )}
        </div>
    );
}

// =============================================================================
// MAIN COMPONENT
// =============================================================================

export function PeoplePanelContent({ workspaceId, roomId }) {
    const { onlineCount, isInitialized } = usePresence();

    const [activeSubtab, setActiveSubtab] = useState('room');
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedMember, setSelectedMember] = useState(null);

    const placeholderText = {
        room: 'Search in room...',
        workspace: 'Search in workspace...',
        project: 'Search all members...',
    };

    return (
        <div className="people-tab" style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
            {/* Header */}
            <div className="panel-header">
                <Users size={14} className="panel-header__icon" style={{ color: '#f472b6' }} />
                <span className="panel-header__title">People</span>
                <span className="panel-header__count">{onlineCount} online</span>
            </div>

            {/* Subtab Toggle */}
            <SubtabToggle activeTab={activeSubtab} onChange={setActiveSubtab} />

            {/* Search */}
            <div className="panel-search">
                <div className="panel-search__wrapper">
                    <Search size={12} className="search-icon" />
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder={placeholderText[activeSubtab]}
                    />
                    {searchQuery && (
                        <button className="clear-button" onClick={() => setSearchQuery('')}>
                            <X size={10} />
                        </button>
                    )}
                </div>
            </div>

            {/* Connection Status */}
            {!isInitialized && (
                <div style={{ padding: '12px', background: 'rgba(251,191,36,0.1)', borderBottom: '1px solid rgba(251,191,36,0.2)', fontSize: '11px', color: '#fbbf24', textAlign: 'center' }}>
                    Connecting to presence server...
                </div>
            )}

            {/* Subtab Content */}
            <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
                {activeSubtab === 'room' && (
                    <RoomSubtab roomId={roomId} searchQuery={searchQuery} selectedMember={selectedMember} onSelectMember={setSelectedMember} />
                )}
                {activeSubtab === 'workspace' && (
                    <WorkspaceSubtab workspaceId={workspaceId} searchQuery={searchQuery} selectedMember={selectedMember} onSelectMember={setSelectedMember} />
                )}
                {activeSubtab === 'project' && (
                    <ProjectSubtab searchQuery={searchQuery} selectedMember={selectedMember} onSelectMember={setSelectedMember} />
                )}
            </div>

            {/* Footer */}
            <div className="panel-footer">
                <button className="panel-footer__btn panel-footer__btn--primary">
                    <UserPlus size={11} />
                    <span>Invite</span>
                </button>
                <button className="panel-footer__btn panel-footer__btn--icon" title="Raise Hand">
                    <Hand size={11} />
                </button>
                <button className="panel-footer__btn panel-footer__btn--icon" title="Settings">
                    <Settings size={11} />
                </button>
            </div>
        </div>
    );
}

export default PeoplePanelContent;