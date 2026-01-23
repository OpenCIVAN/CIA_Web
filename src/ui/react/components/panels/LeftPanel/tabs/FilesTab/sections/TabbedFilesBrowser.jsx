/**
 * @file TabbedFilesBrowser.jsx
 * @description Bottom section with Loaded/All Files tabs.
 * Uses global filters from parent. Includes breadcrumb navigation and folder browsing.
 *
 * @example
 * <TabbedFilesBrowser
 *   loadedDatasets={loadedDatasets}
 *   allFiles={allFiles}
 *   folders={folders}
 *   filters={filters}
 *   applyFilters={applyFilters}
 *   activeTab={activeTab}
 *   onTabChange={setActiveTab}
 * />
 */

import React, { memo, useState, useMemo, useCallback } from 'react';
import { Icon } from '@UI/react/components/atoms';
import { TabButton } from '@UI/react/components/molecules/TabButton';
import { ToggleGroup } from '@UI/react/components/molecules/ToggleGroup';
import { Breadcrumb, buildBreadcrumbPath } from '@UI/react/components/molecules/Breadcrumb';
import { EmptyState } from '@UI/react/components/molecules/EmptyState';
import { FileItemList, FileItemGrid } from '../components/FileItem';
import { DatasetTreeItem } from '../components/DatasetTreeItem';
import { FolderNode } from '../components/FolderNode';
import { useAdaptive } from '@UI/react/context';
import './TabbedFilesBrowser.scss';

/**
 * @typedef {Object} TabbedFilesBrowserProps
 * @property {Array} loadedDatasets - Loaded datasets with views
 * @property {Array} allFiles - All files in project
 * @property {Array} folders - Folder hierarchy
 * @property {Object} [filters] - Global filter state from parent
 * @property {(items: Array) => Array} [applyFilters] - Global filter function from parent
 * @property {'loaded'|'all'} activeTab - Currently active tab
 * @property {(tab: 'loaded'|'all') => void} onTabChange - Tab change handler
 * @property {string} [selectedFileId] - Currently selected file ID
 * @property {(fileId: string) => void} [onSelect] - File selection handler
 * @property {(fileId: string) => void} [onToggleStar] - Toggle star handler
 * @property {(file: Object) => void} [onDoubleClick] - File double-click handler
 * @property {(e: DragEvent, file: Object) => void} [onDragStart] - Drag start handler
 * @property {(e: MouseEvent, file: Object) => void} [onContextMenu] - Context menu handler
 * @property {(e: MouseEvent, file: Object) => void} [onMenuClick] - Menu button click handler
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
    filters = null,
    applyFilters = null,
    activeTab = 'all',
    onTabChange,
    selectedFileId,
    onSelect,
    onToggleStar,
    onDoubleClick,
    onDragStart,
    onContextMenu,
    onMenuClick,
    onViewClick,
    className = '',
}) {
    const { isVR } = useAdaptive();

    // Expanded datasets state (for Loaded tab)
    const [expandedDatasets, setExpandedDatasets] = useState(new Set());

    // Local view state (not filtered globally)
    const [viewMode, setViewMode] = useState('list');
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

    // Check if global filters are active
    const hasGlobalSearch = filters?.searchQuery?.trim();
    const hasGlobalFilters = hasGlobalSearch || (filters?.typeFilters?.length > 0);

    // Filter and sort files using global filters
    const filteredFiles = useMemo(() => {
        // When searching globally, search all files; otherwise show current folder contents
        const baseFiles = hasGlobalSearch ? allFiles : rootFiles;

        // Apply global filters if available
        if (applyFilters) {
            return applyFilters(baseFiles);
        }

        // Fallback: return base files sorted by name
        return [...baseFiles].sort((a, b) =>
            (a.name || '').localeCompare(b.name || '')
        );
    }, [rootFiles, allFiles, hasGlobalSearch, applyFilters]);

    // Filter loaded datasets using global filters
    const filteredDatasets = useMemo(() => {
        if (!applyFilters || !hasGlobalFilters) {
            return loadedDatasets;
        }
        return applyFilters(loadedDatasets);
    }, [loadedDatasets, applyFilters, hasGlobalFilters]);

    const classList = [
        'tabbed-files-browser',
        isVR && 'tabbed-files-browser--vr',
        className,
    ].filter(Boolean).join(' ');

    return (
        <div className={classList}>
            {/* Tab bar */}
            <div className="tabbed-files-browser__tabs">
                <TabButton
                    icon="database"
                    label="Loaded"
                    active={activeTab === 'loaded'}
                    badge={hasGlobalFilters ? filteredDatasets.length : loadedDatasets.length}
                    color="teal"
                    onClick={() => onTabChange('loaded')}
                />
                <TabButton
                    icon="folder"
                    label="All Files"
                    active={activeTab === 'all'}
                    badge={hasGlobalFilters ? filteredFiles.length : allFiles.length}
                    color="blue"
                    onClick={() => onTabChange('all')}
                />
            </div>

            {/* All Files Tab Content */}
            {activeTab === 'all' && (
                <>
                    {/* Toolbar: Breadcrumb + View Toggle */}
                    <div className="tabbed-files-browser__toolbar">
                        <Breadcrumb
                            path={breadcrumbPath}
                            onNavigate={setCurrentFolderId}
                        />
                        <div className="tabbed-files-browser__toolbar-right">
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

                    {/* File list/grid */}
                    <div className={`tabbed-files-browser__content ${viewMode === 'grid' ? 'tabbed-files-browser__content--grid' : ''}`}>
                        {/* Folders (when not searching globally, list view only) */}
                        {!hasGlobalSearch && viewMode === 'list' && rootFolders.map(folder => (
                            <FolderNode
                                key={folder.id}
                                folder={folder}
                                files={allFiles}
                                allFolders={folders}
                                expanded={expandedFolders.has(folder.id)}
                                onToggle={() => toggleFolder(folder.id)}
                                depth={0}
                                onToggleStar={onToggleStar}
                            />
                        ))}

                        {/* Files - Grid View */}
                        {viewMode === 'grid' && filteredFiles.length > 0 && (
                            <div className="files-grid">
                                {filteredFiles.filter(f => !f.isFolder).map(file => (
                                    <FileItemGrid
                                        key={file.id}
                                        file={file}
                                        isSelected={selectedFileId === file.id}
                                        onSelect={() => onSelect?.(file.id)}
                                        onDoubleClick={onDoubleClick}
                                        onStar={onToggleStar}
                                        onDragStart={onDragStart}
                                        onContextMenu={onContextMenu}
                                        onMenuClick={onMenuClick}
                                    />
                                ))}
                            </div>
                        )}

                        {/* Files - List View */}
                        {viewMode === 'list' && filteredFiles.length > 0 && (
                            filteredFiles.map(file => (
                                <FileItemList
                                    key={file.id}
                                    file={file}
                                    isSelected={selectedFileId === file.id}
                                    onSelect={() => onSelect?.(file.id)}
                                    onDoubleClick={onDoubleClick}
                                    onStar={onToggleStar}
                                    onDragStart={onDragStart}
                                    onContextMenu={onContextMenu}
                                    onMenuClick={onMenuClick}
                                    expandedFolders={expandedFolders}
                                    onToggleFolder={toggleFolder}
                                />
                            ))
                        )}

                        {/* Empty state */}
                        {filteredFiles.length === 0 && hasGlobalSearch && (
                            <EmptyState
                                icon="search"
                                title="No files found"
                                subtitle={`No results for "${filters?.searchQuery}"`}
                            />
                        )}
                    </div>
                </>
            )}

            {/* Loaded Datasets Tab Content */}
            {activeTab === 'loaded' && (
                <div className="tabbed-files-browser__content">
                    {filteredDatasets.length > 0 ? (
                        filteredDatasets.map(dataset => (
                            <DatasetTreeItem
                                key={dataset.id}
                                dataset={dataset}
                                expanded={expandedDatasets.has(dataset.id)}
                                onToggle={() => toggleDataset(dataset.id)}
                                onViewClick={onViewClick}
                            />
                        ))
                    ) : loadedDatasets.length > 0 ? (
                        <EmptyState
                            icon="search"
                            title="No matching datasets"
                            subtitle={`No results for "${filters?.searchQuery || 'current filters'}"`}
                        />
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

export default TabbedFilesBrowser;
