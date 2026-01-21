/**
 * @file FilesTabV2.jsx
 * @description Redesigned Files Tab with improved layout and features.
 *
 * Features:
 * - Global search and type filters
 * - Resizable Starred section with filter bypass
 * - Tabbed browser (Loaded/All Files)
 * - Folder navigation with breadcrumbs
 * - Compact mode for small containers
 * - VR-friendly with adaptive sizing
 *
 * Layout (Full Mode):
 * ┌─────────────────────────────────────┐
 * │ 📁 Files                    8 total │
 * ├─────────────────────────────────────┤
 * │ ▼ ⭐ Starred               2 of 3   │
 * │   [All] [Datasets] [Files]          │
 * │   file list...                      │
 * │   [Show all ↗] (when filtered)      │
 * │ ═══════════════════════════════════ │  ← Resize handle
 * ├─────────────────────────────────────┤
 * │ [📦 Loaded (2)] [📁 All Files (5)] │
 * ├─────────────────────────────────────┤
 * │ 🏠 Root / Raw Scans                 │  ← Breadcrumb
 * │ 🔍 [Search files...]                │
 * │ [NIfTI][DICOM][CSV] Sort▼ [≡][⊞]  │
 * │   📁 folders + 📄 files             │
 * ├─────────────────────────────────────┤
 * │ [?]  [    ⬆ Upload Files    ]  [⟳] │
 * └─────────────────────────────────────┘
 *
 * @example
 * <FilesTabV2 workspaceId="ws-1" />
 */

import React, { useCallback, useRef, useState, useMemo } from 'react';
import { Icon, IconButton, Tooltip } from '@UI/react/components/atoms';
import { PanelFooter } from '@UI/react/components/molecules/PanelFooter';
import { StarredSection, TabbedFilesBrowser, CompactFilesPanel } from './sections';
import { FileContextMenu } from './components/FileContextMenu';
import { UploadDropzone } from './components/UploadDropzone';
import { useFilesTab } from './hooks/useFilesTab';
import { useResponsiveMode } from '@UI/react/hooks/useResponsiveMode';
import { useGlobalFilters } from '@UI/react/hooks/useGlobalFilters';
import { useAdaptive } from '@UI/react/context';
import './FilesTab.scss';

/**
 * @typedef {Object} FilesTabV2Props
 * @property {string} workspaceId - Current workspace ID
 * @property {Array} [mockFiles] - Mock files for testing
 * @property {Set} [mockStarredIds] - Mock starred IDs for testing
 * @property {boolean} [mockIsLoading] - Mock loading state
 * @property {string} [mockError] - Mock error state
 */

/**
 * FilesTabV2 - Redesigned Files Tab component
 *
 * @param {FilesTabV2Props} props - Component props
 * @returns {React.ReactElement} The rendered component
 */
export function FilesTabV2({
    workspaceId,
    mockFiles = null,
    mockStarredIds = null,
    mockIsLoading = null,
    mockError = null,
}) {
    const { isVR } = useAdaptive();
    const containerRef = useRef(null);

    // Responsive mode detection
    const { dimensions, isCompact, showLabels } = useResponsiveMode(containerRef);

    // Global filters state
    const { filters, applyFilters, hasActiveFilters } = useGlobalFilters();

    // Core files tab logic
    const {
        // Files data
        files,
        allFiles,
        starredFiles,
        loadedDatasetsFormatted,
        loadedCount,
        isLoading,
        error,

        // Actions
        handleStar,
        handleDragStart,
        handleDoubleClick,
        handleUpload,
        refetch,

        // Context menu
        contextMenu,
        handleContextMenu,
        handleMenuClick,
        closeContextMenu,
        handleContextAction,

        // Upload
        isDragOver,
        setIsDragOver,
    } = useFilesTab({
        workspaceId,
        mockFiles,
        mockStarredIds,
        mockIsLoading,
        mockError,
    });

    // Section states
    const [starredExpanded, setStarredExpanded] = useState(true);
    const [starredHeight, setStarredHeight] = useState(140);
    const [activeTab, setActiveTab] = useState('all');
    const [isResizing, setIsResizing] = useState(false);

    // Starred section resize handler
    const handleResizeStart = useCallback((e) => {
        e.preventDefault();
        setIsResizing(true);
        const startY = e.clientY;
        const startHeight = starredHeight;

        const handleMouseMove = (moveEvent) => {
            const delta = moveEvent.clientY - startY;
            setStarredHeight(Math.max(80, Math.min(250, startHeight + delta)));
        };

        const handleMouseUp = () => {
            setIsResizing(false);
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);
        };

        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mouseup', handleMouseUp);
    }, [starredHeight]);

    // File click handler
    const handleFileClick = useCallback((file) => {
        // Select file
    }, []);

    // View click handler
    const handleViewClick = useCallback((viewId) => {
        // Navigate to view
    }, []);

    // Help click handler
    const handleHelp = useCallback(() => {
        // Show help panel
    }, []);

    // Format loaded datasets with views for display
    const loadedDatasetsWithViews = useMemo(() => {
        return loadedDatasetsFormatted.map(ds => ({
            ...ds,
            views: ds.views || [], // Add views array if not present
        }));
    }, [loadedDatasetsFormatted]);

    // Folders (placeholder - would come from server)
    const folders = useMemo(() => {
        return []; // TODO: Implement folder support
    }, []);

    const classList = [
        'files-tab',
        'files-tab-v2',
        isCompact && 'files-tab--compact',
        isVR && 'files-tab--vr',
    ].filter(Boolean).join(' ');

    // Handle drag events on the container
    const handleDragEnter = useCallback((e) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.dataTransfer.types.includes('Files')) {
            setIsDragOver(true);
        }
    }, [setIsDragOver]);

    const handleDragOver = useCallback((e) => {
        e.preventDefault();
        e.stopPropagation();
    }, []);

    const handleDragLeave = useCallback((e) => {
        e.preventDefault();
        e.stopPropagation();
        // Only hide if leaving the container entirely
        if (e.currentTarget === e.target) {
            setIsDragOver(false);
        }
    }, [setIsDragOver]);

    return (
        <div
            className={classList}
            ref={containerRef}
            onDragEnter={handleDragEnter}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
        >
            {/* Header */}
            <div className="panel-header panel-header--blue">
                <Icon name="folderOpen" size={14} className="panel-header__icon" />
                <span className="panel-header__title">Files</span>
                <div className="panel-header__spacer" />
                <span className="panel-header__info">{allFiles.length} total</span>
                <div className="panel-header__actions">
                    <Tooltip content="New Folder" placement="bottom">
                        <IconButton
                            icon="folderPlus"
                            label="New Folder"
                            size="xs"
                            variant="ghost"
                        />
                    </Tooltip>
                </div>
            </div>

            {/* Loading indicator */}
            {isLoading && (
                <div className="panel-loading">
                    <Icon name="loader" size={16} className="spin" />
                    <span>Loading files...</span>
                </div>
            )}

            {/* Error message */}
            {error && (
                <div className="panel-error">
                    <span>Failed to load files: {error}</span>
                    <button onClick={refetch} className="panel-error__retry">
                        Retry
                    </button>
                </div>
            )}

            {/* Main content */}
            <div className="files-tab__content">
                {isCompact ? (
                    /* Compact Mode: 3-tab layout */
                    <CompactFilesPanel
                        starredFiles={starredFiles}
                        loadedDatasets={loadedDatasetsWithViews}
                        allFiles={files}
                        containerWidth={dimensions.width}
                        onToggleStar={handleStar}
                        onFileClick={handleFileClick}
                        onFileDoubleClick={handleDoubleClick}
                        onViewClick={handleViewClick}
                    />
                ) : (
                    /* Full Mode: Starred + Tabbed Browser */
                    <>
                        <StarredSection
                            items={starredFiles}
                            filters={filters}
                            applyFilters={applyFilters}
                            expanded={starredExpanded}
                            onToggle={() => setStarredExpanded(!starredExpanded)}
                            height={starredHeight}
                            onResizeStart={handleResizeStart}
                            onToggleStar={handleStar}
                            onFileClick={handleFileClick}
                            onFileDoubleClick={handleDoubleClick}
                        />

                        <TabbedFilesBrowser
                            loadedDatasets={loadedDatasetsWithViews}
                            allFiles={files}
                            folders={folders}
                            activeTab={activeTab}
                            onTabChange={setActiveTab}
                            onToggleStar={handleStar}
                            onFileClick={handleFileClick}
                            onFileDoubleClick={handleDoubleClick}
                            onViewClick={handleViewClick}
                        />
                    </>
                )}
            </div>

            {/* Footer - sticks to bottom */}
            <PanelFooter
                onHelp={handleHelp}
                onUpload={() => document.getElementById('file-upload-input')?.click()}
                onRefresh={refetch}
            />

            {/* Hidden upload input */}
            <input
                id="file-upload-input"
                type="file"
                style={{ display: 'none' }}
                onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleUpload(file);
                    e.target.value = '';
                }}
                multiple
            />

            {/* Upload dropzone overlay (for drag-and-drop) */}
            <UploadDropzone
                onUpload={handleUpload}
                isDragOver={isDragOver}
                setIsDragOver={setIsDragOver}
            />

            {/* Context menu */}
            {contextMenu && (
                <FileContextMenu
                    x={contextMenu.x}
                    y={contextMenu.y}
                    file={contextMenu.file}
                    onClose={closeContextMenu}
                    onAction={handleContextAction}
                />
            )}
        </div>
    );
}

export default FilesTabV2;
