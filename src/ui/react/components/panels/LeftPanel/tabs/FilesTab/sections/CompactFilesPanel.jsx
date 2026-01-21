/**
 * @file CompactFilesPanel.jsx
 * @description Compact mode panel with 3 tabs (Starred/Loaded/All).
 * Used when container height is below threshold.
 *
 * @example
 * <CompactFilesPanel
 *   starredFiles={starredFiles}
 *   loadedDatasets={loadedDatasets}
 *   allFiles={allFiles}
 *   containerWidth={containerWidth}
 * />
 */

import React, { memo, useState, useMemo, useCallback } from 'react';
import { Icon } from '@UI/react/components/atoms';
import { TabButton } from '@UI/react/components/molecules/TabButton';
import { SearchBar } from '@UI/react/components/molecules/SearchBar';
import { EmptyState } from '@UI/react/components/molecules/EmptyState';
import { FileItemList } from '../components/FileItem';
import { DatasetTreeItem } from '../components/DatasetTreeItem';
import { useAdaptive } from '@UI/react/context';
import { LABEL_WIDTH_THRESHOLD } from '@UI/react/constants/filesTabConfig.js';
import './CompactFilesPanel.scss';

/**
 * @typedef {Object} CompactFilesPanelProps
 * @property {Array} starredFiles - Starred files
 * @property {Array} loadedDatasets - Loaded datasets with views
 * @property {Array} allFiles - All files in project
 * @property {number} containerWidth - Container width in pixels
 * @property {(fileId: string) => void} [onFileLoad] - File load handler
 * @property {(fileId: string) => void} [onToggleStar] - Toggle star handler
 * @property {(file: Object) => void} [onFileClick] - File click handler
 * @property {(file: Object) => void} [onFileDoubleClick] - File double-click handler
 * @property {(viewId: string) => void} [onViewClick] - View click handler
 * @property {string} [className] - Additional CSS classes
 */

/**
 * CompactFilesPanel - 3-tab compact mode layout
 *
 * @param {CompactFilesPanelProps} props - Component props
 * @returns {React.ReactElement} The rendered component
 */
export const CompactFilesPanel = memo(function CompactFilesPanel({
    starredFiles = [],
    loadedDatasets = [],
    allFiles = [],
    containerWidth = 320,
    onFileLoad,
    onToggleStar,
    onFileClick,
    onFileDoubleClick,
    onViewClick,
    className = '',
}) {
    const { isVR } = useAdaptive();

    // Determine initial tab
    const initialTab = starredFiles.length > 0 ? 'starred' : 'loaded';
    const [activeTab, setActiveTab] = useState(initialTab);

    // Expanded datasets (for Loaded tab)
    const [expandedDatasets, setExpandedDatasets] = useState(new Set());

    // Search query (for All tab)
    const [searchQuery, setSearchQuery] = useState('');

    // Toggle dataset expansion
    const toggleDataset = useCallback((id) => {
        setExpandedDatasets(prev => {
            const next = new Set(prev);
            next.has(id) ? next.delete(id) : next.add(id);
            return next;
        });
    }, []);

    // Show labels based on width
    const showLabels = containerWidth > LABEL_WIDTH_THRESHOLD;

    // Filtered files for search
    const filteredFiles = useMemo(() => {
        if (!searchQuery.trim()) return allFiles;
        const q = searchQuery.toLowerCase();
        return allFiles.filter(f =>
            (f.name || f.filename || '').toLowerCase().includes(q)
        );
    }, [allFiles, searchQuery]);

    const classList = [
        'compact-files-panel',
        isVR && 'compact-files-panel--vr',
        className,
    ].filter(Boolean).join(' ');

    return (
        <div className={classList}>
            {/* 3-Tab Bar */}
            <div className="compact-files-panel__tabs">
                <TabButton
                    icon="star"
                    label={showLabels ? 'Starred' : ''}
                    active={activeTab === 'starred'}
                    badge={starredFiles.length}
                    color="amber"
                    onClick={() => setActiveTab('starred')}
                    iconOnly={!showLabels}
                />
                <TabButton
                    icon="database"
                    label={showLabels ? 'Loaded' : ''}
                    active={activeTab === 'loaded'}
                    badge={loadedDatasets.length}
                    color="teal"
                    onClick={() => setActiveTab('loaded')}
                    iconOnly={!showLabels}
                />
                <TabButton
                    icon="folder"
                    label={showLabels ? 'All' : ''}
                    active={activeTab === 'all'}
                    badge={allFiles.length}
                    color="blue"
                    onClick={() => setActiveTab('all')}
                    iconOnly={!showLabels}
                />
            </div>

            {/* Search (for All tab) */}
            {activeTab === 'all' && (
                <SearchBar
                    value={searchQuery}
                    onChange={setSearchQuery}
                    placeholder="Search..."
                />
            )}

            {/* Content */}
            <div className="compact-files-panel__content">
                {/* Starred Tab */}
                {activeTab === 'starred' && (
                    starredFiles.length > 0 ? (
                        starredFiles.map(file => (
                            <FileItemList
                                key={file.id}
                                file={file}
                                showStar={false}
                                onSelect={onFileClick}
                                onDoubleClick={onFileDoubleClick}
                            />
                        ))
                    ) : (
                        <EmptyState
                            icon="star"
                            title="No starred items"
                        />
                    )
                )}

                {/* Loaded Tab */}
                {activeTab === 'loaded' && (
                    loadedDatasets.length > 0 ? (
                        loadedDatasets.map(dataset => (
                            <DatasetTreeItem
                                key={dataset.id}
                                dataset={dataset}
                                expanded={expandedDatasets.has(dataset.id)}
                                onToggle={() => toggleDataset(dataset.id)}
                                onViewClick={onViewClick}
                            />
                        ))
                    ) : (
                        <EmptyState
                            icon="database"
                            title="No datasets loaded"
                        />
                    )
                )}

                {/* All Files Tab */}
                {activeTab === 'all' && (
                    filteredFiles.length > 0 ? (
                        filteredFiles.map(file => (
                            <FileItemList
                                key={file.id}
                                file={file}
                                onSelect={onFileClick}
                                onDoubleClick={onFileDoubleClick}
                                onStar={onToggleStar}
                            />
                        ))
                    ) : (
                        <EmptyState
                            icon="folder"
                            title="No files found"
                        />
                    )
                )}
            </div>
        </div>
    );
});

export default CompactFilesPanel;
