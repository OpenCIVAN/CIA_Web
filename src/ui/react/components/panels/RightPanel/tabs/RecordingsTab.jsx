// src/ui/react/components/panels/RightPanel/tabs/RecordingsTab.jsx
// Recordings tab content for the unified right panel
//
// Features:
// - Start/stop recording with mode selection
// - Recording modes: Full Session, Isolation, Subset
// - Audio toggle
// - Past recordings list with playback controls
// - Storage indicator

import React, { useState, useCallback, useMemo, useEffect } from 'react';
import {
    Video,
    Search,
    Play,
    Pause,
    Square,
    Circle,
    Clock,
    Calendar,
    Download,
    Share2,
    Trash2,
    Settings,
    Monitor,
    Maximize,
    Layers,
    Users,
    Mic,
    MicOff,
    SkipBack,
    SkipForward,
    Maximize2,
    X,
    Upload,
    Loader,
    AlertCircle,
    CheckCircle,
} from 'lucide-react';
import {
    ResizableSectionsContainer,
    ResizableSection,
    useSectionStates
} from '@UI/react/components/common/ResizableSections';
import { useRecordings } from '@UI/react/hooks/useRecordings.js';

// =============================================================================
// RECORDING MODES
// =============================================================================

const RECORDING_MODES = [
    { id: 'full', label: 'Full Session', icon: Monitor, description: 'Record entire workspace grid' },
    { id: 'isolation', label: 'Isolation', icon: Maximize, description: 'Record single focused instance' },
    { id: 'subset', label: 'Subset', icon: Layers, description: 'Record selected instances only' },
];

// =============================================================================
// UTILITIES
// =============================================================================

function formatDuration(seconds) {
    if (!seconds && seconds !== 0) return '--:--';
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    if (hrs > 0) {
        return `${hrs}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${mins}:${secs.toString().padStart(2, '0')}`;
}

function formatDurationMs(ms) {
    if (!ms) return '--:--';
    return formatDuration(Math.floor(ms / 1000));
}

function formatDate(dateStr) {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    const now = new Date();
    const diff = now - date;
    const dayMs = 24 * 60 * 60 * 1000;

    if (diff < dayMs) {
        return `Today, ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    } else if (diff < 2 * dayMs) {
        return `Yesterday, ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    } else {
        return date.toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
    }
}

// =============================================================================
// RECORDING CONTROLS
// =============================================================================

function RecordingControls({
    isRecording,
    recordingDuration,
    recordingMode,
    includeAudio,
    onModeChange,
    onAudioToggle,
    onStart,
    onStop,
    recordingName,
    onNameChange,
    isPaused,
    onPause,
    onResume,
}) {
    const [showNameInput, setShowNameInput] = useState(false);
    const [nameInput, setNameInput] = useState('');

    const handleStartClick = useCallback(() => {
        if (showNameInput) {
            if (nameInput.trim()) {
                onNameChange(nameInput.trim());
            }
            onStart();
            setShowNameInput(false);
            setNameInput('');
        } else {
            setShowNameInput(true);
        }
    }, [showNameInput, nameInput, onNameChange, onStart]);

    if (isRecording) {
        return (
            <div className="recording-controls recording-controls--active">
                {/* Recording indicator */}
                <div className="recording-controls__status">
                    <span className="recording-controls__dot recording-controls__dot--pulse" />
                    <span className="recording-controls__label">Recording</span>
                    <span className="recording-controls__time">{formatDuration(recordingDuration)}</span>
                </div>

                {/* Recording info */}
                <div className="recording-controls__info">
                    <span className="recording-controls__info-item">
                        <Monitor size={12} />
                        {RECORDING_MODES.find(m => m.id === recordingMode)?.label}
                    </span>
                    <span className="recording-controls__info-item">
                        {includeAudio ? <Mic size={12} /> : <MicOff size={12} />}
                        {includeAudio ? 'Audio on' : 'Audio off'}
                    </span>
                </div>

                {/* Actions */}
                <div className="recording-controls__actions">
                    <button
                        className="recording-controls__stop-btn"
                        onClick={onStop}
                    >
                        <Square size={14} />
                        Stop Recording
                    </button>
                    <button
                        className="recording-controls__pause-btn"
                        onClick={isPaused ? onResume : onPause}
                    >
                        {isPaused ? <Play size={14} /> : <Pause size={14} />}
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="recording-controls">
            {/* Name input */}
            {showNameInput && (
                <div className="recording-controls__name-input">
                    <input
                        type="text"
                        value={nameInput}
                        onChange={(e) => setNameInput(e.target.value)}
                        placeholder="Recording name (optional)"
                        className="recording-controls__input"
                        autoFocus
                        onKeyDown={(e) => {
                            if (e.key === 'Enter') handleStartClick();
                            if (e.key === 'Escape') setShowNameInput(false);
                        }}
                    />
                </div>
            )}

            {/* Mode selector */}
            <div className="recording-controls__mode-section">
                <div className="recording-controls__mode-label">Recording Mode</div>
                <div className="recording-controls__mode-buttons">
                    {RECORDING_MODES.map(mode => {
                        const Icon = mode.icon;
                        const isActive = recordingMode === mode.id;
                        return (
                            <button
                                key={mode.id}
                                className={`recording-controls__mode-btn ${isActive ? 'recording-controls__mode-btn--active' : ''}`}
                                onClick={() => onModeChange(mode.id)}
                                title={mode.description}
                            >
                                <Icon size={16} />
                                <span>{mode.label}</span>
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* Audio toggle */}
            <div className="recording-controls__audio-toggle">
                <div className="recording-controls__audio-info">
                    <Mic size={14} className={includeAudio ? 'icon-green' : ''} />
                    <span>Include audio</span>
                </div>
                <button
                    className={`toggle-switch ${includeAudio ? 'toggle-switch--active' : ''}`}
                    onClick={onAudioToggle}
                >
                    <span className="toggle-switch__thumb" />
                </button>
            </div>

            {/* Start button */}
            <button
                className="recording-controls__start-btn"
                onClick={handleStartClick}
            >
                <Circle size={16} />
                {showNameInput ? 'Start' : 'Start Recording'}
            </button>
        </div>
    );
}

// =============================================================================
// RECORDING CARD
// =============================================================================

function RecordingCard({
    recording,
    isSelected,
    onSelect,
    onExport,
    onDownload,
    onDelete,
    isExporting,
}) {
    const mode = recording.metadata?.mode || 'full';
    const ModeIcon = RECORDING_MODES.find(m => m.id === mode)?.icon || Monitor;
    const name = recording.metadata?.name || 'Untitled Recording';
    const isExported = !!recording.storage_key;

    const handleDelete = useCallback((e) => {
        e.stopPropagation();
        if (window.confirm('Delete this recording? This cannot be undone.')) {
            onDelete(recording.id);
        }
    }, [recording.id, onDelete]);

    const handleExport = useCallback((e) => {
        e.stopPropagation();
        onExport(recording.id);
    }, [recording.id, onExport]);

    const handleDownload = useCallback((e) => {
        e.stopPropagation();
        onDownload(recording.id);
    }, [recording.id, onDownload]);

    return (
        <div
            className={`recording-card ${isSelected ? 'recording-card--selected' : ''}`}
            onClick={() => onSelect(isSelected ? null : recording.id)}
        >
            <div className="recording-card__main">
                {/* Thumbnail */}
                <div className="recording-card__thumbnail">
                    {recording.status === 'recording' ? (
                        <span className="recording-card__live-indicator">
                            <Circle size={16} className="recording-card__live-dot" />
                        </span>
                    ) : (
                        <Play size={20} />
                    )}
                </div>

                {/* Info */}
                <div className="recording-card__info">
                    <div className="recording-card__title">{name}</div>
                    <div className="recording-card__meta">
                        <span className="recording-card__duration">
                            <Clock size={10} />
                            {formatDurationMs(recording.duration_ms)}
                        </span>
                        <span className="recording-card__events">
                            {recording.event_count || 0} events
                        </span>
                        <span className="recording-card__mode">
                            <ModeIcon size={10} />
                        </span>
                        {isExported && (
                            <span className="recording-card__exported" title="Exported to storage">
                                <CheckCircle size={10} />
                            </span>
                        )}
                    </div>
                    <div className="recording-card__date">
                        {formatDate(recording.started_at)}
                        {recording.recorded_by_name && ` by ${recording.recorded_by_name}`}
                    </div>
                </div>
            </div>

            {/* Expanded details */}
            {isSelected && (
                <div className="recording-card__expanded">
                    {/* Status info */}
                    <div className="recording-card__details">
                        <span>Status: {recording.status}</span>
                        {recording.file_size && (
                            <span>Size: {(recording.file_size / 1024).toFixed(1)} KB</span>
                        )}
                    </div>

                    {/* Playback controls */}
                    {recording.status !== 'recording' && (
                        <div className="recording-card__playback">
                            <button className="recording-card__playback-btn" disabled>
                                <SkipBack size={14} />
                            </button>
                            <button className="recording-card__playback-btn recording-card__playback-btn--play" disabled title="Playback coming soon">
                                <Play size={16} />
                            </button>
                            <button className="recording-card__playback-btn" disabled>
                                <SkipForward size={14} />
                            </button>

                            <div className="recording-card__progress">
                                <div className="recording-card__progress-bar" />
                            </div>

                            <span className="recording-card__progress-time">
                                0:00 / {formatDurationMs(recording.duration_ms)}
                            </span>
                        </div>
                    )}

                    {/* Actions */}
                    <div className="recording-card__actions">
                        {!isExported && recording.status !== 'recording' && (
                            <button
                                className="recording-card__action-btn"
                                data-color="green"
                                onClick={handleExport}
                                disabled={isExporting}
                                title="Export to storage"
                            >
                                {isExporting ? <Loader size={10} className="spin" /> : <Upload size={10} />}
                                Export
                            </button>
                        )}
                        {recording.status !== 'recording' && (
                            <button
                                className="recording-card__action-btn"
                                data-color="blue"
                                onClick={handleDownload}
                                title="Download recording"
                            >
                                <Download size={10} />
                                Download
                            </button>
                        )}
                        <button
                            className="recording-card__action-btn"
                            onClick={handleDelete}
                            title="Delete recording"
                        >
                            <Trash2 size={10} />
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}

// =============================================================================
// MAIN COMPONENT
// =============================================================================

export function RecordingsPanelContent({ workspaceId }) {
    // Use the recordings hook
    const {
        recordings,
        isRecording,
        isPaused,
        recordingDuration,
        recordingName,
        setRecordingName,
        recordingOptions,
        setRecordingOptions,
        loading,
        error,
        startRecording,
        stopRecording,
        pauseRecording,
        resumeRecording,
        deleteRecording,
        exportRecording,
        downloadRecording,
        refresh,
    } = useRecordings();

    // Local state
    const [recordingMode, setRecordingMode] = useState('full');
    const [includeAudio, setIncludeAudio] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedRecording, setSelectedRecording] = useState(null);
    const [exportingId, setExportingId] = useState(null);

    // Section states
    const { states: sectionStates, toggleSection } = useSectionStates({
        controls: { expanded: true, flexGrow: 0 },
        recordings: { expanded: true, flexGrow: 2 },
    });

    // Update options when includeAudio changes
    useEffect(() => {
        setRecordingOptions(prev => ({ ...prev, includeAudio }));
    }, [includeAudio, setRecordingOptions]);

    // Handlers
    const handleStartRecording = useCallback(() => {
        startRecording();
    }, [startRecording]);

    const handleStopRecording = useCallback(() => {
        stopRecording();
    }, [stopRecording]);

    const handleExport = useCallback(async (id) => {
        setExportingId(id);
        try {
            await exportRecording(id);
        } finally {
            setExportingId(null);
        }
    }, [exportRecording]);

    const handleDownload = useCallback((id) => {
        downloadRecording(id);
    }, [downloadRecording]);

    const handleDelete = useCallback((id) => {
        deleteRecording(id);
        if (selectedRecording === id) {
            setSelectedRecording(null);
        }
    }, [deleteRecording, selectedRecording]);

    // Filter recordings by search
    const filteredRecordings = useMemo(() => {
        if (!searchQuery.trim()) return recordings;
        const query = searchQuery.toLowerCase();
        return recordings.filter(r => {
            const name = r.metadata?.name || '';
            const recordedBy = r.recorded_by_name || '';
            return name.toLowerCase().includes(query) ||
                recordedBy.toLowerCase().includes(query);
        });
    }, [searchQuery, recordings]);

    // Calculate storage (simplified - could be enhanced with actual MinIO stats)
    const totalSize = useMemo(() => {
        const bytes = recordings.reduce((sum, r) => sum + (r.file_size || 0), 0);
        if (bytes < 1024) return `${bytes} B`;
        if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
        return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    }, [recordings]);

    return (
        <div className="recordings-tab">
            {/* Header */}
            <div className="panel-header">
                <Video size={14} className="panel-header__icon file-icon--red" />
                <span className="panel-header__title">Recording</span>
                {isRecording && (
                    <div className="panel-header__live-badge">
                        <span className="panel-header__live-dot" />
                        LIVE
                    </div>
                )}
            </div>

            {/* Error display */}
            {error && (
                <div className="recordings-tab__error">
                    <AlertCircle size={14} />
                    <span>{error}</span>
                </div>
            )}

            {/* Resizable Sections */}
            <ResizableSectionsContainer
                sectionStates={sectionStates}
                onSectionToggle={toggleSection}
            >
                {/* Recording Controls */}
                <ResizableSection
                    id="controls"
                    icon={isRecording ? Circle : Video}
                    iconColorClass={isRecording ? 'icon-red' : 'icon-red'}
                    label={isRecording ? 'Current Recording' : 'New Recording'}
                >
                    <RecordingControls
                        isRecording={isRecording}
                        recordingDuration={recordingDuration}
                        recordingMode={recordingMode}
                        includeAudio={includeAudio}
                        onModeChange={setRecordingMode}
                        onAudioToggle={() => setIncludeAudio(!includeAudio)}
                        onStart={handleStartRecording}
                        onStop={handleStopRecording}
                        recordingName={recordingName}
                        onNameChange={setRecordingName}
                        isPaused={isPaused}
                        onPause={pauseRecording}
                        onResume={resumeRecording}
                    />
                </ResizableSection>

                {/* Past Recordings */}
                <ResizableSection
                    id="recordings"
                    icon={Calendar}
                    iconColorClass="icon-purple"
                    label="Past Recordings"
                    count={recordings.length}
                >
                    {/* Search */}
                    <div className="recordings-tab__search">
                        <Search size={14} className="recordings-tab__search-icon" />
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Search recordings..."
                            className="recordings-tab__search-input"
                        />
                        {searchQuery && (
                            <button
                                className="recordings-tab__search-clear"
                                onClick={() => setSearchQuery('')}
                            >
                                <X size={10} />
                            </button>
                        )}
                    </div>

                    {/* Loading state */}
                    {loading && (
                        <div className="recordings-tab__loading">
                            <Loader size={20} className="spin" />
                            <span>Loading recordings...</span>
                        </div>
                    )}

                    {/* Empty state */}
                    {!loading && filteredRecordings.length === 0 && (
                        <div className="recordings-tab__empty">
                            <Video size={32} />
                            <span>
                                {searchQuery
                                    ? 'No recordings match your search'
                                    : 'No recordings yet. Start one above!'}
                            </span>
                        </div>
                    )}

                    {/* Recordings list */}
                    <div className="recordings-tab__list">
                        {filteredRecordings.map(recording => (
                            <RecordingCard
                                key={recording.id}
                                recording={recording}
                                isSelected={selectedRecording === recording.id}
                                onSelect={setSelectedRecording}
                                onExport={handleExport}
                                onDownload={handleDownload}
                                onDelete={handleDelete}
                                isExporting={exportingId === recording.id}
                            />
                        ))}
                    </div>
                </ResizableSection>
            </ResizableSectionsContainer>

            {/* Footer */}
            <div className="panel-footer panel-footer--with-info">
                <span className="panel-footer__storage">
                    Storage: {totalSize}
                </span>
                <button className="panel-footer__settings-btn" onClick={refresh}>
                    <Settings size={10} />
                    Refresh
                </button>
            </div>
        </div>
    );
}

export default RecordingsPanelContent;