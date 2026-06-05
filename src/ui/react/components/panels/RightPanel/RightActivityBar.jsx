// src/ui/react/components/panels/RightPanel/RightActivityBar.jsx
// Activity bar icons for the right panel
// Renders in ThreeEdgeLayout's right activity bar slot
//
// Uses TabButton molecule with etched variant for consistent styling
// Includes compact voice controls at the bottom (moved from SecondaryFooter)
// UPDATED: Added peek/preview support for overlay panel system

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { TabButton } from '@UI/react/components/molecules';
import { Icon } from '@UI/react/components/atoms';
import { Tooltip } from '@UI/react/components/atoms/Tooltip';
import { useRightPanelContext, RIGHT_PANEL_TABS } from './RightPanelContext';
import { useLayoutContext } from '@UI/react/components/layout/ThreeEdgeLayout';
import { useAdaptiveHover } from '@UI/react/hooks/useAdaptiveHover';
import { DwellIndicator } from '@UI/react/components/atoms/DwellIndicator';
import './RightActivityBar.scss';

// =============================================================================
// TAB BUTTON WITH PEEK SUPPORT
// =============================================================================

/**
 * PeekableTabButton - TabButton wrapper with hover peek functionality
 */
function PeekableTabButton({ tab, isActive, isPeeking, onClick, onPeekStart, onPeekEnd, children }) {
    const tabRef = useRef(null);

    const { dwellProgress } = useAdaptiveHover(tabRef, {
        onHoverStart: () => onPeekStart?.(tab.id),
        onHoverEnd: () => onPeekEnd?.(tab.id),
    });

    return (
        <div ref={tabRef} className="right-panel__activity-btn-wrapper" data-hover-id={`right-tab-${tab.id}`}>
            <TabButton
                icon={tab.icon}
                label={tab.label}
                color={tab.color}
                variant="etched"
                iconOnly
                active={isActive || isPeeking}
                onClick={onClick}
                className={isPeeking ? 'peeking' : ''}
            />
            {children}
            <DwellIndicator progress={dwellProgress} size={32} />
        </div>
    );
}

// =============================================================================
// COMPACT VOICE CONTROLS
// =============================================================================

/**
 * CompactVoiceControls - Minimal voice controls for activity bar
 * Shows join button when not in voice, mute/deafen when connected
 */
function CompactVoiceControls({
    inVoice,
    isMuted,
    isDeafened,
    isJoining,
    onJoinLeave,
    onToggleMute,
    onToggleDeafen,
    onOpenSettings,
}) {
    if (!inVoice) {
        // Not in voice - show join button (or joining indicator)
        const joinLabel = isJoining ? 'Connecting...' : 'Join Voice';
        return (
            <div className="right-panel__voice-controls">
                <Tooltip content={joinLabel} placement="left" delay={400}>
                    <button
                        className={`right-panel__voice-btn right-panel__voice-btn--join ${isJoining ? 'right-panel__voice-btn--joining' : ''}`}
                        onClick={onJoinLeave}
                        disabled={isJoining}
                        aria-label={joinLabel}
                    >
                        <Icon name={isJoining ? 'loader' : 'headsetMic'} size={18} />
                    </button>
                </Tooltip>
                {isJoining && (
                    <span className="right-panel__voice-status">Joining...</span>
                )}
            </div>
        );
    }

    // In voice - show controls
    return (
        <div className="right-panel__voice-controls right-panel__voice-controls--connected">
            {/* Mute toggle */}
            <Tooltip content={isMuted ? 'Unmute (M)' : 'Mute (M)'} placement="left" delay={400}>
                <button
                    className={`right-panel__voice-btn ${isMuted ? 'right-panel__voice-btn--muted' : ''}`}
                    onClick={onToggleMute}
                    aria-label={isMuted ? 'Unmute (M)' : 'Mute (M)'}
                >
                    <Icon name={isMuted ? 'micOff' : 'mic'} size={18} />
                </button>
            </Tooltip>

            {/* Deafen toggle */}
            <Tooltip content={isDeafened ? 'Undeafen (D)' : 'Deafen (D)'} placement="left" delay={400}>
                <button
                    className={`right-panel__voice-btn ${isDeafened ? 'right-panel__voice-btn--muted' : ''}`}
                    onClick={onToggleDeafen}
                    aria-label={isDeafened ? 'Undeafen (D)' : 'Deafen (D)'}
                >
                    <Icon name={isDeafened ? 'volumeOff' : 'volume'} size={18} />
                </button>
            </Tooltip>

            {/* Settings button */}
            <Tooltip content="Voice Settings" placement="left" delay={400}>
                <button
                    className="right-panel__voice-btn"
                    onClick={onOpenSettings}
                    aria-label="Voice Settings"
                >
                    <Icon name="settings" size={18} />
                </button>
            </Tooltip>

            {/* Leave button */}
            <Tooltip content="Leave Voice" placement="left" delay={400}>
                <button
                    className="right-panel__voice-btn right-panel__voice-btn--leave"
                    onClick={onJoinLeave}
                    aria-label="Leave Voice"
                >
                    <Icon name="leaveVoice" size={18} />
                </button>
            </Tooltip>
        </div>
    );
}

// =============================================================================
// RIGHT ACTIVITY BAR
// =============================================================================

/**
 * RightActivityBar - Vertical icon navigation for panel tabs
 * Fixed width (48px), always visible even when panel is collapsed.
 *
 * Uses TabButton molecule with etched variant for the recessed button style.
 * Uses LayoutContext from ThreeEdgeLayout to control panel open/close state.
 *
 * Bottom section includes compact voice controls (moved from SecondaryFooter)
 */
export function RightActivityBar() {
    const { activeTab, setActiveTab } = useRightPanelContext();
    const {
        rightOpen: isOpen,
        setRightOpen,
        rightPeekingTab,
        startPeek,
        endPeek,
    } = useLayoutContext();

    // Peek handlers for overlay panel preview
    const handlePeekStart = useCallback((tabId) => {
        startPeek?.('right', tabId);
    }, [startPeek]);

    const handlePeekEnd = useCallback((tabId) => {
        endPeek?.('right');
    }, [endPeek]);

    // Voice state - synced via events from main app
    const [voiceState, setVoiceState] = useState({
        inVoice: false,
        isMuted: false,
        isDeafened: false,
        isJoining: false,
    });

    // Listen for voice state changes from main app
    useEffect(() => {
        const handleVoiceStateChange = (e) => {
            const { inVoice, isMuted, isDeafened, isJoining } = e.detail || {};
            setVoiceState(prev => ({
                ...prev,
                ...(inVoice !== undefined && { inVoice }),
                ...(isMuted !== undefined && { isMuted }),
                ...(isDeafened !== undefined && { isDeafened }),
                ...(isJoining !== undefined && { isJoining }),
            }));
        };

        window.addEventListener('cia:voice-state-change', handleVoiceStateChange);
        return () => window.removeEventListener('cia:voice-state-change', handleVoiceStateChange);
    }, []);

    // Voice action handlers - dispatch events to main app
    const handleJoinLeave = useCallback(() => {
        window.dispatchEvent(new CustomEvent('cia:voice-action', { detail: { action: 'joinLeave' } }));
    }, []);

    const handleToggleMute = useCallback(() => {
        window.dispatchEvent(new CustomEvent('cia:voice-action', { detail: { action: 'toggleMute' } }));
    }, []);

    const handleToggleDeafen = useCallback(() => {
        window.dispatchEvent(new CustomEvent('cia:voice-action', { detail: { action: 'toggleDeafen' } }));
    }, []);

    const handleOpenSettings = useCallback(() => {
        window.dispatchEvent(new CustomEvent('cia:voice-action', { detail: { action: 'openSettings' } }));
    }, []);

    // Toggle the panel open/closed
    const onToggle = () => setRightOpen(!isOpen);

    // Handle tab click - if clicking active tab, toggle panel
    const handleTabClick = (tabId) => {
        if (tabId === activeTab) {
            // Clicking active tab toggles the panel
            onToggle();
        } else {
            // Clicking different tab - switch to it and ensure panel is open
            setActiveTab(tabId);
            if (!isOpen) {
                setRightOpen(true);
            }
        }
    };

    // Get active tab's color for the indicator line
    const activeTabConfig = RIGHT_PANEL_TABS.find(tab => tab.id === activeTab);
    const activeColor = activeTabConfig?.color || 'pink';

    return (
        // data-color attribute controls the colored indicator line on the activity bar
        <div className="right-panel__activity-bar" data-color={activeColor}>
            {/* Tab buttons */}
            <div className="right-panel__activity-tabs">
                {RIGHT_PANEL_TABS.map((tab) => {
                    const isActive = activeTab === tab.id;
                    const isPeeking = rightPeekingTab === tab.id;

                    return (
                        <PeekableTabButton
                            key={tab.id}
                            tab={tab}
                            isActive={isActive}
                            isPeeking={isPeeking}
                            onClick={() => handleTabClick(tab.id)}
                            onPeekStart={handlePeekStart}
                            onPeekEnd={handlePeekEnd}
                        >
                            {/* "Soon" badge for unimplemented tabs */}
                            {tab.implemented === false && (
                                <span className="right-panel__activity-badge">Soon</span>
                            )}
                        </PeekableTabButton>
                    );
                })}
            </div>

            {/* Spacer pushes bottom items down */}
            <div className="right-panel__activity-spacer" />

            {/* Voice controls */}
            <CompactVoiceControls
                inVoice={voiceState.inVoice}
                isMuted={voiceState.isMuted}
                isDeafened={voiceState.isDeafened}
                isJoining={voiceState.isJoining}
                onJoinLeave={handleJoinLeave}
                onToggleMute={handleToggleMute}
                onToggleDeafen={handleToggleDeafen}
                onOpenSettings={handleOpenSettings}
            />

            <div className="right-panel__activity-divider" />

            {/* Toggle panel button at bottom */}
            <TabButton
                icon={isOpen ? 'panelRightClose' : 'chevronLeft'}
                label={isOpen ? 'Collapse Panel' : 'Expand Panel'}
                variant="etched"
                iconOnly
                onClick={onToggle}
                className="right-panel__toggle-btn"
            />
        </div>
    );
}

export default RightActivityBar;
