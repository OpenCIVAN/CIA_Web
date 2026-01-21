/**
 * @file TabbedFilesBrowser.jsx
 * @description Bottom section with Loaded/All Files tabs.
 * Includes search, filters, sorting, breadcrumb navigation, and folder browsing.
 *
 * @example
 * <TabbedFilesBrowser
 *   loadedDatasets={loadedDatasets}
 *   allFiles={allFiles}
 *   folders={folders}
 *   activeTab={activeTab}
 *   onTabChange={setActiveTab}
 * />
 */

import React, { memo, useState, useMemo, useCallback } from 'react';
import { Icon } from '@UI/react/components/atoms';
import { TabButton } from '@UI/react/components/molecules/TabButton';
import { ChipGroup } from '@UI/react/components/molecules/ChipGroup';
import { SearchBar } from '@UI/react/components/molecules/SearchBar';
import { SortDropdown } from '@UI/react/components/molecules/SortDropdown';
import { ToggleGroup } from '@UI/react/components/molecules/ToggleGroup';
import { Breadcrumb, buildBreadcrumbPath } from '@UI/react/components/molecules/Breadcrumb';
import { EmptyState } from '@UI/react/components/molecules/EmptyState';
import { FileItemList } from '../components/FileItem';
import { DatasetTreeItem } from '../components/DatasetTreeItem';
import { FolderNode } from '../components/FolderNode';
import { useAdaptive } from '@UI/react/context';
import { SORT_OPTIONS, FILE_TYPE_FILTER_OPTIONS } from '@UI/react/constants/filesTabConfig.js';
import './TabbedFilesBrowser.scss';

/**
 * @typedef {Object} TabbedFilesBrowserProps
 * @property {Array} loadedDatasets - Loaded datasets with views
 * @property {Array} allFiles - All files in project
 * @property {Array} folders - Folder hierarchy
 * @property {'loaded'|'all'} activeTab - Currently active tab
 * @property {(tab: 'loaded'|'all') => void} onTabChange - Tab change handler
 * @property {(fileId: string) => void} [onFileLoad] - File load handler
 * @property {(fileId: string) => void} [onToggleStar] - Toggle star handler
 * @property {(file: Object) => void} [onFileClick] - File click handler
 * @property {(file: Object) => void} [onFileDoubleClick] - File double-click handler
 * @property {(viewId: string) => void} [onViewClick] - View click handler
 * @property {string} [className] - Additional CSS classes
 */

/**
 * TabbedFilesBrowser - Bottom section with Loaded/All tabs
 *
 * @param {TabbedFilesBrowserProps} props - Component props
 * @returns {React.ReactElement} The rendered component
 */
export const TabbedFilesBrowser = memo(function TabbedFilesBrowser({
    loadedDatasets = [],
    allFiles = [],
    folders = [],
    activeTab = 'all',
    onTabChange,
    onFileLoad,
    onToggleStar,
    onFileClick,
    onFileDoubleClick,
    onViewClick,
    className = '',
}) {
    const { isVR } = useAdaptive();

    // Expanded datasets state (for Loaded tab)
    const [expandedDatasets, setExpandedDatasets] = useState(new Set());

    // All Files tab state
    const [searchQuery, setSearchQuery] = useState('');
    const [sortBy, setSortBy] = useState('name');
    const [viewMode, setViewMode] = useState('list');
    const [typeFilters, setTypeFilters] = useState([]);
    const [currentFolderId, setCurrentFolderId] = useState(null);
    const [expandedFolders, setExpandedFolders] = useState(new Set());

    // Toggle dataset expansion
    const toggleDataset = useCallback((id) => {
        setExpandedDatasets(prev => {
            const next = new Set(prev);
            next.has(id) ? next.delete(id) : next.add(id);
            return next;
        });
    }, []);

    // Toggle folder expansion
    const toggleFolder = useCallback((id) => {
        setExpandedFolders(prev => {
            const next = new Set(prev);
            next.has(id) ? next.delete(id) : next.add(id);
            return next;
        });
    }, []);

    // Toggle type filter
    const toggleTypeFilter = useCallback((type) => {
        setTypeFilters(prev =>
            prev.includes(type)
                ? prev.filter(t => t !== type)
                : [...prev, type]
        );
    }, []);

    // Build breadcrumb path
    const breadcrumbPath = useMemo(() => {
        return buildBreadcrumbPath(currentFolderId, folders);
    }, [currentFolderId, folders]);

    // Get root folders and files for current location
    const { rootFolders, rootFiles } = useMemo(() => {
        return {
            rootFolders: folders.filter(f => (f.parentId ?? null) === currentFolderId),
            // At root (null), show files without a folder assignment
            rootFiles: allFiles.filter(f => (f.folderId ?? null) === currentFolderId),
        };
    }, [folders, allFiles, currentFolderId]);

    // Filter and sort files
    const filteredFiles = useMemo(() => {
        let result = searchQuery.trim() ? allFiles : rootFiles;

        // Search filter
        if (searchQuery.trim()) {
            const q = searchQuery.toLowerCase();
            result = allFiles.filter(f =>
                (f.name || f.filename || '').toLowerCase().includes(q)
            );
        }

        // Type filter
        if (typeFilters.length > 0) {
            result = result.filter(f => typeFilters.includes(f.fileType || f.type));
        }

        // Sort
        result = [...result].sort((a, b) => {
            switch (sortBy) {
                case 'date':
                    return new Date(b.modifiedAt || b.uploadedAt || 0) -
                           new Date(a.modifiedAt || a.uploadedAt || 0);
                case 'size':
                    return parseSize(b.size) - parseSize(a.size);
                case 'type':
                    return (a.fileType || a.type || '').localeCompare(b.fileType || b.type || '');
                default:
                    return (a.name || '').localeCompare(b.name || '');
            }
        });

        return result;
    }, [rootFiles, allFiles, searchQuery, typeFilters, sortBy]);

    const classList = [
        'tabbed-files-browser',
        isVR && 'tabbed-files-browser--vr',
        className,
    ].filter(Boolean).join(' ');

    // File type filter chips with counts
    const typeFilterChips = FILE_TYPE_FILTER_OPTIONS.map(opt => ({
        ...opt,
        count: allFiles.filter(f => (f.fileType || f.type) === opt.id).length,
    }));

    return (
        <div className={classList}>
            {/* Tab bar */}
            <div className="tabbed-files-browser__tabs">
                <TabButton
                    icon="database"
                    label="Loaded"
                    active={activeTab === 'loaded'}
                    badge={loadedDatasets.length}
                    color="teal"
                    onClick={() => onTabChange('loaded')}
                />
                <TabButton
                    icon="folder"
                    label="All Files"
                    active={activeTab === 'all'}
                    badge={allFiles.length}
                    color="blue"
                    onClick={() => onTabChange('all')}
                />
            </div>

            {/* All Files Tab Content */}
            {activeTab === 'all' && (
                <>
                    {/* Breadcrumb */}
                    <Breadcrumb
                        path={breadcrumbPath}
                        onNavigate={setCurrentFolderId}
                    />

                    {/* Search */}
                    <SearchBar
                        value={searchQuery}
                        onChange={setSearchQuery}
                        placeholder="Search files..."
                    />

                    {/* Toolbar */}
                    <div className="tabbed-files-browser__toolbar">
                        <div className="tabbed-files-browser__filters">
                            <ChipGroup
                                chips={typeFilterChips}
                                activeChips={typeFilters}
                                onToggle={toggleTypeFilter}
                                size="sm"
                            />
                        </div>
                        <div className="tabbed-files-browser__toolbar-right">
                            <SortDropdown
                                value={sortBy}
                                onChange={setSortBy}
                                options={SORT_OPTIONS}
                            />
                            <ToggleGroup
                                options={[
                                    { value: 'list', icon: 'list' },
                                    { value: 'grid', icon: 'grid_3x3' },
                                ]}
                                value={viewMode}
                                onChange={setViewMode}
                                size="xs"
                            />
                        </div>
                    </div>

                    {/* File list */}
                    <div className="tabbed-files-browser__content">
                        {/* Folders (when not searching) */}
                        {!searchQuery && rootFolders.map(folder => (
                            <FolderNode
                                key={folder.id}
                                folder={folder}
                                files={allFiles}
                                allFolders={folders}
                                expanded={expandedFolders.has(folder.id)}
                                onToggle={() => toggleFolder(folder.id)}
                                depth={0}
                                onFileLoad={onFileLoad}
                                onToggleStar={onToggleStar}
                            />
                        ))}

                        {/* Files */}
                        {filteredFiles.length > 0 ? (
                            filteredFiles.map(file => (
                                <FileItemList
                                    key={file.id}
                                    file={file}
                                    onSelect={onFileClick}
                                    onDoubleClick={onFileDoubleClick}
                                    onStar={onToggleStar}
                                />
                            ))
                        ) : searchQuery ? (
                            <EmptyState
                                icon="search"
                                title="No files found"
                                subtitle={`No results for "${searchQuery}"`}
                            />
                        ) : null}
                    </div>
                </>
            )}

            {/* Loaded Datasets Tab Content */}
            {activeTab === 'loaded' && (
                <div className="tabbed-files-browser__content">
                    {loadedDatasets.length > 0 ? (
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
                            subtitle="Load a file to create views"
                        />
                    )}
                </div>
            )}
        </div>
    );
});

/**
 * Parse file size string to bytes
 */
function parseSize(size) {
    if (typeof size === 'number') return size;
    if (!size || typeof size !== 'string') return 0;

    const match = size.match(/^([\d.]+)\s*(B|KB|MB|GB)?$/i);
    if (!match) return 0;

    const value = parseFloat(match[1]);
    const unit = (match[2] || 'B').toUpperCase();
    const multipliers = { B: 1, KB: 1024, MB: 1048576, GB: 1073741824 };

    return value * (multipliers[unit] || 1);
}

export default TabbedFilesBrowser;
