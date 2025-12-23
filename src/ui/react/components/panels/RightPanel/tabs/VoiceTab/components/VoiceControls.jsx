/**
 * @file VoiceControls.jsx
 * @description Main voice control buttons (mute, deafen, leave).
 */

import React from 'react';
import {
    IconMic,
    IconMicOff,
    IconHeadphones,
    IconPhoneOff,
    IconRadio,
    IconSettings,
} from '@UI/react/components/common/Icon';
import { HeadsetOffOutlined } from '@mui/icons-material';
import { VoiceConnectionState } from '@Services/voice/voiceRoomService.js';

/**
 * @typedef {Object} VoiceControlsProps
 * @property {string} connectionState - Current connection state
 * @property {boolean} muted - Whether mic is muted
 * @property {boolean} deafened - Whether audio is deafened
 * @property {function} onToggleMute - Callback to toggle mute
 * @property {function} onToggleDeafen - Callback to toggle deafen
 * @property {function} onJoin - Callback to join voice
 * @property {function} onLeave - Callback to leave voice
 */

/**
 * Voice controls component.
 * Displays mute/deafen/leave buttons or join button.
 *
 * @param {VoiceControlsProps} props - Component props
 * @returns {React.ReactElement} The rendered controls
 */
export function VoiceControls({
    connectionState,
    muted,
    deafened,
    onToggleMute,
    onToggleDeafen,
    onLeave,
    onJoin
}) {
    const isConnected = connectionState === VoiceConnectionState.CONNECTED;
    const isConnecting = connectionState === VoiceConnectionState.CONNECTING;
    const isReconnecting = connectionState === VoiceConnectionState.RECONNECTING;

    if (!isConnected && !isReconnecting) {
        return (
            <div className="voice-controls voice-controls--disconnected">
                <button
                    className="voice-controls__join-btn"
                    onClick={onJoin}
                    disabled={isConnecting}
                >
                    <IconRadio size={16} />
                    <span>{isConnecting ? 'Connecting...' : 'Join Voice'}</span>
                </button>
            </div>
        );
    }

    return (
        <div className="voice-controls">
            {isReconnecting && (
                <div className="voice-controls__status">Reconnecting...</div>
            )}
            <button
                className={`voice-controls__btn ${muted ? 'voice-controls__btn--active' : ''}`}
                onClick={onToggleMute}
                title={muted ? 'Unmute (M)' : 'Mute (M)'}
            >
                {muted ? <IconMicOff size={18} /> : <IconMic size={18} />}
            </button>

            <button
                className={`voice-controls__btn ${deafened ? 'voice-controls__btn--active' : ''}`}
                onClick={onToggleDeafen}
                title={deafened ? 'Undeafen' : 'Deafen'}
            >
                {deafened ? <HeadsetOffOutlined size={18} /> : <IconHeadphones size={18} />}
            </button>

            <button
                className="voice-controls__btn voice-controls__btn--leave"
                onClick={onLeave}
                title="Leave Voice"
            >
                <IconPhoneOff size={18} />
            </button>

            <button className="voice-controls__btn" title="Voice Settings">
                <IconSettings size={18} />
            </button>
        </div>
    );
}

export default VoiceControls;