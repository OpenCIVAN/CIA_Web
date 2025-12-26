/**
 * @file VoiceTab.jsx
 * @description Voice chat controls and participant management.
 * Part of the Right Panel collaboration hub.
 *
 * Features:
 * - Voice channel status and selection
 * - Mute/deafen/leave controls with keyboard shortcuts
 * - Participant list with speaking indicators
 * - Per-participant volume control
 * - LiveKit integration for real-time voice
 *
 * @see Right_Panel_Design_Specification.md - Voice Tab section
 *
 * @example
 * <VoiceTab workspaceId="ws-1" channels={channels} />
 */

import React, { useState, useEffect } from 'react';
import {
    CollapsibleHeaderSection,
    StatusDot,
    StatBadge,
    SectionHeader,
    AdaptiveButton,
    Icon,
} from '@UI/react/components/adaptive';

import { useVoiceTab } from './hooks/useVoiceTab';
import { ParticipantCard } from './components/ParticipantCard';

import './VoiceTab.scss';

// =============================================================================
// HELPERS
// =============================================================================

/**
 * Format duration in seconds to HH:MM:SS or MM:SS
 */
function formatDuration(seconds) {
    if (!seconds || seconds < 0) return '00:00';
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = Math.floor(seconds % 60);
    if (h > 0) {
        return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    }
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}

// =============================================================================
// MAIN COMPONENT
// =============================================================================

/**
 * @typedef {Object} VoiceTabProps
 * @property {string} [workspaceId] - Current workspace ID
 * @property {Array} [channels] - Available voice channels
 */

/**
 * Voice tab component.
 * Provides voice chat controls and participant management.
 *
 * @param {VoiceTabProps} props - Component props
 * @returns {React.ReactElement} The rendered tab
 */
export function VoiceTab({ workspaceId, channels: propChannels }) {
    const {
        channels,
        connectionState,
        isConnected,
        muted,
        deafened,
        currentChannel,
        participants,
        handleJoin,
        handleLeave,
        handleToggleMute,
        handleToggleDeafen,
        handleChannelSelect,
        handleAdjustVolume,
    } = useVoiceTab({ channels: propChannels });

    // Track connection duration
    const [connectionDuration, setConnectionDuration] = useState(0);
    const [connectionStartTime, setConnectionStartTime] = useState(null);

    // Update connection duration timer
    useEffect(() => {
        if (isConnected && !connectionStartTime) {
            setConnectionStartTime(Date.now());
        } else if (!isConnected) {
            setConnectionStartTime(null);
            setConnectionDuration(0);
        }
    }, [isConnected, connectionStartTime]);

    useEffect(() => {
        if (!connectionStartTime) return;

        const interval = setInterval(() => {
            setConnectionDuration(Math.floor((Date.now() - connectionStartTime) / 1000));
        }, 1000);

        return () => clearInterval(interval);
    }, [connectionStartTime]);

    // Get current channel object
    const currentChannelObj = channels.find(c => c.id === currentChannel);

    return (
        <div className="voice-panel">
            {/* Header Section - Collapsible, not resizable */}
            <div className="voice-panel__header">
                <CollapsibleHeaderSection
                    icon="wifi"
                    title="Voice Status"
                    color={isConnected ? "green" : "default"}
                    defaultExpanded={true}
                >
                    {/* Row 1: Room name centered as subheading */}
                    <div className="voice-status__room">
                        <Icon name="doorOpen" size={14} />
                        <span className="voice-status__room-name">
                            {currentChannelObj?.name || 'Not Connected'}
                        </span>
                    </div>

                    {/* Row 2: Connection status */}
                    {isConnected && (
                        <div className="voice-status__connection">
                            <StatusDot color="var(--color-accent-green)" pulse />
                            <span className="voice-status__state">Connected</span>
                        </div>
                    )}

                    {/* Row 2: Stats */}
                    {isConnected && (
                        <div className="voice-status__stats">
                            <StatBadge icon="users">
                                {participants.length} in voice
                            </StatBadge>
                            <StatBadge icon="clock">
                                {formatDuration(connectionDuration)}
                            </StatBadge>
                        </div>
                    )}

                    {/* Controls */}
                    {isConnected ? (
                        <div className="voice-status__controls">
                            <div className="voice-status__controls-left">
                                <AdaptiveButton
                                    icon={muted ? 'micOff' : 'mic'}
                                    variant={muted ? 'danger' : 'primary'}
                                    onClick={handleToggleMute}
                                    title={muted ? 'Unmute (M)' : 'Mute (M)'}
                                />
                                <AdaptiveButton
                                    icon="headphones"
                                    variant={deafened ? 'danger' : 'secondary'}
                                    onClick={handleToggleDeafen}
                                    title={deafened ? 'Undeafen (D)' : 'Deafen (D)'}
                                />
                                <AdaptiveButton
                                    icon="settings"
                                    variant="ghost"
                                    onClick={() => { }}
                                    title="Voice Settings"
                                />
                            </div>
                            <AdaptiveButton
                                icon="phoneOff"
                                variant="danger"
                                onClick={handleLeave}
                                title="Leave Voice"
                            />
                        </div>
                    ) : (
                        <div className="voice-status__join">
                            <AdaptiveButton
                                icon="phone"
                                variant="primary"
                                onClick={handleJoin}
                            >
                                Join Voice
                            </AdaptiveButton>
                        </div>
                    )}
                </CollapsibleHeaderSection>
            </div>

            {/* List Section - Scrollable */}
            <div className="voice-panel__list">
                <SectionHeader
                    icon="users"
                    color="var(--color-accent-green)"
                    count={participants.length}
                >
                    In Channel
                </SectionHeader>
                <div className="participants-list">
                    {!isConnected ? (
                        <div className="voice-panel__empty">
                            Join a voice channel to see participants
                        </div>
                    ) : participants.length === 0 ? (
                        <div className="voice-panel__empty">
                            No other participants yet
                        </div>
                    ) : (
                        participants.map(participant => (
                            <ParticipantCard
                                key={participant.id}
                                participant={participant}
                                onAdjustVolume={handleAdjustVolume}
                            />
                        ))
                    )}
                </div>
            </div>
        </div>
    );
}

// Export with both names for backwards compatibility
export { VoiceTab as VoicePanelContent };
export default VoiceTab;