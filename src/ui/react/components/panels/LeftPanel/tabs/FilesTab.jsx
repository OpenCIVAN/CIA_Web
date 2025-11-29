// src/ui/react/components/panels/LeftPanel/tabs/FilesTab.jsx
// Files tab content for the unified left panel
//
// Features:
// - List and grid view modes with thumbnails
// - Starred, Recent, and All Files sections (VS Code-style resizable)
// - Nested folder support
// - Drag-and-drop for loading files
// - Context menu for file actions
// - Search and filter capabilities
// - Footer anchored to bottom

import React, { useState, useCallback, useMemo } from 'react';
import {
    FolderOpen,
    FolderPlus,
    Search,
    X,
    List,
    Grid3X3,
    ArrowUpDown,
    Filter,
    Star,
    Clock,
    Folder,
    ChevronDown,
    ChevronRight,
    GripVertical,
    Upload,
    RefreshCw,
    Box,
    Database,
    FileCode,
    FileText,
    Circle,
    MoreHorizontal,
    Eye,
    Info,
    Pencil,
} from 'lucide-react';

import {
    ResizableSectionsContainer,
    ResizableSection,
    useSectionStates
} from '../components/ResizableSections';

// =============================================================================
// FILE TYPE UTILITIES
// =============================================================================

const getFileTypeConfig = (type) => {
    switch (type) {
        case 'nifti':
            return { icon: Box, colorClass: 'file-icon--nifti' };
        case 'dicom':
            return { icon: Database, colorClass: 'file-icon--dicom' };
        case 'vtk':
            return { icon: FileCode, colorClass: 'file-icon--vtk' };
        case 'folder':
            return { icon: Folder, colorClass: 'file-icon--folder' };
        default:
            return { icon: FileText, colorClass: 'file-icon--default' };
    }
};

// =============================================================================
// CONTEXT MENU
// =============================================================================

function ContextMenu({ x, y, onClose, onAction, file }) {
    const menuItems = [
        { id: 'open', icon: Eye, label: 'Load in Instance' },
        { id: 'info', icon: Info, label: 'File Details...' },
        { divider: true },
        { id: 'rename', icon: Pencil, label: 'Rename...' },
        { id: 'star', icon: Star, label: file?.starred ? 'Unstar' : 'Star' },
    ];

    return (
        <>
            <div className="context-menu-backdrop" onClick={onClose} />
            <div className="context-menu" style={{ top: y, left: x }} onClick={(e) => e.stopPropagation()}>
                {menuItems.map((item, index) =>
                    item.divider ? (
                        <div key={index} className="context-menu__divider" />
                    ) : (
                        <button
                            key={item.id}
                            className="context-menu__item"
                            onClick={() => { onAction(item.id, file); onClose(); }}
                        >
                            <item.icon size={12} />
                            <span>{item.label}</span>
                        </button>
                    )
                )}
            </div>
        </>
    );
}

// =============================================================================
// FILE ITEM - LIST VIEW
// =============================================================================

function FileItemList({ file, depth = 0, isSelected, onSelect, onStar, onDragStart, onContextMenu, expandedFolders, onToggleFolder }) {
    const [isHovered, setIsHovered] = useState(false);
    const { icon: TypeIcon, colorClass } = getFileTypeConfig(file.type);
    const isFolder = file.type === 'folder';
    const isExpanded = expandedFolders?.has(file.id);

    return (
        <>
            <div
                className={`tree-item ${isFolder ? 'tree-item--folder' : 'tree-item--file'} ${isSelected ? 'selected' : ''} ${file.loaded ? 'loaded' : ''}`}
                style={{ paddingLeft: 8 + (depth * 16) }}
                draggable={!isFolder}
                onDragStart={(e) => !isFolder && onDragStart?.(e, file)}
                onMouseEnter={() => setIsHovered(true)}
                onMouseLeave={() => setIsHovered(false)}
                onClick={() => isFolder ? onToggleFolder(file.id) : onSelect(file.id)}
                onContextMenu={(e) => !isFolder && onContextMenu?.(e, file)}
            >
                {isFolder ? (
                    <span className="chevron">
                        {isExpanded ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
                    </span>
                ) : (
                    <GripVertical size={10} className="drag-handle" style={{ opacity: isHovered ? 0.6 : 0 }} />
                )}
                <TypeIcon size={14} className={`item-icon ${colorClass}`} />
                <span className="item-name">{file.name}</span>
                {!isFolder && (isHovered || file.starred) && (
                    <button className={`star-btn ${file.starred ? 'star-btn--starred' : ''}`} onClick={(e) => { e.stopPropagation(); onStar(file.id); }}>
                        <Star size={10} fill={file.starred ? 'currentColor' : 'none'} />
                    </button>
                )}
                {file.loaded && <Circle size={6} fill="currentColor" className="status-indicator__dot--active" />}
                <span className="item-meta">{isFolder ? `${file.children?.length || 0}` : file.size}</span>
            </div>
            {isFolder && isExpanded && file.children?.map(child => (
                <FileItemList key={child.id} file={child} depth={depth + 1} isSelected={isSelected} onSelect={onSelect} onStar={onStar} onDragStart={onDragStart} onContextMenu={onContextMenu} expandedFolders={expandedFolders} onToggleFolder={onToggleFolder} />
            ))}
        </>
    );
}

// =============================================================================
// FILE ITEM - GRID VIEW
// =============================================================================

function FileItemGrid({ file, isSelected, onSelect, onStar, onDragStart, onContextMenu }) {
    const [isHovered, setIsHovered] = useState(false);
    const { icon: TypeIcon, colorClass } = getFileTypeConfig(file.type);

    if (file.type === 'folder') return null;

    return (
        <div
            className={`file-card ${isSelected ? 'selected' : ''}`}
            draggable
            onDragStart={(e) => onDragStart?.(e, file)}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            onClick={() => onSelect(file.id)}
            onContextMenu={(e) => onContextMenu?.(e, file)}
        >
            <div className="thumbnail">
                {file.thumbnail ? (
                    <div className="thumbnail__preview" style={{ background: `linear-gradient(135deg, var(--thumbnail-color, rgba(96,165,250,0.2)) 0%, transparent 100%)` }}>
                        <TypeIcon size={20} className={colorClass} style={{ opacity: 0.7 }} />
                    </div>
                ) : (
                    <TypeIcon size={20} className={colorClass} style={{ opacity: 0.5 }} />
                )}
                <div className="thumbnail-actions" style={{ opacity: isHovered ? 1 : 0 }}>
                    <button className="thumbnail-action" onClick={(e) => { e.stopPropagation(); onStar(file.id); }}>
                        <Star size={10} fill={file.starred ? 'currentColor' : 'none'} />
                    </button>
                </div>
            </div>
            <div className="file-name">{file.name}</div>
            <div className="file-size">{file.size}</div>
        </div>
    );
}

// =============================================================================
// MAIN FILES TAB CONTENT
// =============================================================================

export function FilesPanelContent({ workspaceId }) {
    // View state
    const [viewMode, setViewMode] = useState('list');
    const [searchQuery, setSearchQuery] = useState('');
    const [showFilters, setShowFilters] = useState(false);
    const [activeFilters, setActiveFilters] = useState({ types: [] });

    // Selection and expansion state
    const [selectedFileId, setSelectedFileId] = useState(null);
    const [expandedFolders, setExpandedFolders] = useState(new Set([1]));

    // Section states (VS Code-style)
    const { states: sectionStates, toggleSection, resizeSection } = useSectionStates({
        starred: { expanded: true, flexGrow: 1 },
        recent: { expanded: false, flexGrow: 1 },
        all: { expanded: true, flexGrow: 2 },
    });

    // Context menu and drag state
    const [contextMenu, setContextMenu] = useState(null);
    const [isDragOver, setIsDragOver] = useState(false);

    // Sample data
    const files = useMemo(() => [
        {
            id: 1, name: 'Patient_Scans', type: 'folder', starred: true, children: [
                { id: 11, name: 'Brain_Scan_001.nii', type: 'nifti', size: '245 MB', starred: true, thumbnail: true, loaded: true },
                { id: 12, name: 'Brain_Scan_002.nii', type: 'nifti', size: '238 MB', starred: false, thumbnail: true },
                { id: 13, name: 'CT_Overlay.dcm', type: 'dicom', size: '180 MB', starred: false, thumbnail: true },
            ]
        },
        {
            id: 2, name: 'Segmentations', type: 'folder', starred: false, children: [
                { id: 21, name: 'Tumor_Mask.nii', type: 'nifti', size: '45 MB', starred: false, thumbnail: true },
                { id: 22, name: 'Vessel_Network.vtk', type: 'vtk', size: '12 MB', starred: true, thumbnail: true },
            ]
        },
        { id: 3, name: 'Reference_Atlas.nii', type: 'nifti', size: '320 MB', starred: true, thumbnail: true },
        { id: 4, name: 'Study_Protocol.pdf', type: 'other', size: '2.4 MB', starred: false, thumbnail: false },
    ], []);

    // Derived data
    const starredFiles = useMemo(() => {
        const getStarred = (items) => {
            let result = [];
            items.forEach(item => {
                if (item.starred && item.type !== 'folder') result.push(item);
                if (item.children) result = [...result, ...getStarred(item.children)];
            });
            return result;
        };
        return getStarred(files);
    }, [files]);

    const recentFiles = useMemo(() => {
        const getFlat = (items) => {
            let result = [];
            items.forEach(item => {
                if (item.type !== 'folder') result.push(item);
                if (item.children) result = [...result, ...getFlat(item.children)];
            });
            return result;
        };
        return getFlat(files).slice(0, 4);
    }, [files]);

    const loadedCount = useMemo(() => {
        const countLoaded = (items) => {
            let count = 0;
            items.forEach(item => {
                if (item.loaded) count++;
                if (item.children) count += countLoaded(item.children);
            });
            return count;
        };
        return countLoaded(files);
    }, [files]);

    const fileTypes = ['nifti', 'dicom', 'vtk'];

    // Handlers
    const toggleFolder = useCallback((id) => {
        setExpandedFolders(prev => {
            const next = new Set(prev);
            next.has(id) ? next.delete(id) : next.add(id);
            return next;
        });
    }, []);

    const handleStar = useCallback((id) => console.log('Toggle star:', id), []);
    const handleDragStart = useCallback((e, file) => {
        e.dataTransfer.setData('application/json', JSON.stringify(file));
        e.dataTransfer.effectAllowed = 'copy';
    }, []);
    const handleContextMenu = useCallback((e, file) => {
        e.preventDefault();
        setContextMenu({ x: e.clientX, y: e.clientY, file });
    }, []);
    const handleContextAction = useCallback((action, file) => console.log('Context action:', action, file), []);
    const toggleTypeFilter = useCallback((type) => {
        setActiveFilters(prev => ({
            ...prev,
            types: prev.types.includes(type) ? prev.types.filter(t => t !== type) : [...prev.types, type]
        }));
    }, []);

    // Render helpers
    const renderFileItems = useCallback((items) => {
        if (viewMode === 'grid') {
            return (
                <div className="files-grid">
                    {items.map(file => (
                        <FileItemGrid key={file.id} file={file} isSelected={selectedFileId === file.id} onSelect={setSelectedFileId} onStar={handleStar} onDragStart={handleDragStart} onContextMenu={handleContextMenu} />
                    ))}
                </div>
            );
        }
        return items.map(file => (
            <FileItemList key={file.id} file={file} isSelected={selectedFileId === file.id} onSelect={setSelectedFileId} onStar={handleStar} onDragStart={handleDragStart} onContextMenu={handleContextMenu} expandedFolders={expandedFolders} onToggleFolder={toggleFolder} />
        ));
    }, [viewMode, selectedFileId, expandedFolders, handleStar, handleDragStart, handleContextMenu, toggleFolder]);

    return (
        <div className="files-tab">
            {/* Header */}
            <div className="panel-header">
                <FolderOpen size={14} className="panel-header__icon file-icon--nifti" />
                <span className="panel-header__title">Files</span>
                <div className="panel-header__actions">
                    <button className="panel-header__action-btn" title="New Folder"><FolderPlus size={14} /></button>
                </div>
            </div>

            {/* Search */}
            <div className="panel-search">
                <div className="panel-search__wrapper">
                    <Search size={12} className="search-icon" />
                    <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Search files..." />
                    {searchQuery && <button className="clear-button" onClick={() => setSearchQuery('')}><X size={10} /></button>}
                </div>
            </div>

            {/* Toolbar */}
            <div className="panel-toolbar">
                <div className="panel-toolbar__group">
                    <button className={`panel-toolbar__toggle ${viewMode === 'list' ? 'active' : ''}`} onClick={() => setViewMode('list')} title="List view"><List size={11} /></button>
                    <button className={`panel-toolbar__toggle ${viewMode === 'grid' ? 'active' : ''}`} onClick={() => setViewMode('grid')} title="Grid view"><Grid3X3 size={11} /></button>
                </div>
                <button className="filter-toggle"><ArrowUpDown size={9} /><span>Date</span></button>
                <div className="panel-toolbar__spacer" />
                <button className={`filter-toggle ${showFilters || activeFilters.types.length > 0 ? 'active' : ''}`} onClick={() => setShowFilters(!showFilters)}>
                    <Filter size={9} />
                    {activeFilters.types.length > 0 && <span className="count">{activeFilters.types.length}</span>}
                </button>
                <span className="panel-toolbar__info"><strong>{loadedCount}</strong> loaded</span>
            </div>

            {/* Filters panel */}
            {showFilters && (
                <div className="panel-filters">
                    <div className="panel-filters__row">
                        {fileTypes.map(type => (
                            <button key={type} className={`filter-toggle ${activeFilters.types.includes(type) ? 'active' : ''}`} onClick={() => toggleTypeFilter(type)}>
                                {type.toUpperCase()}
                            </button>
                        ))}
                        {activeFilters.types.length > 0 && <button className="panel-filters__clear" onClick={() => setActiveFilters({ types: [] })}>Clear</button>}
                    </div>
                </div>
            )}

            {/* Resizable Sections */}
            <ResizableSectionsContainer
                sectionStates={sectionStates}
                onSectionToggle={toggleSection}
                onSectionResize={resizeSection}
            >
                {starredFiles.length > 0 && (
                    <ResizableSection id="starred" icon={Star} iconColorClass="icon-amber" label="Starred" count={starredFiles.length}>
                        {renderFileItems(starredFiles)}
                    </ResizableSection>
                )}

                <ResizableSection id="recent" icon={Clock} iconColorClass="icon-teal" label="Recent" count={recentFiles.length}>
                    {renderFileItems(recentFiles)}
                </ResizableSection>

                <ResizableSection id="all" icon={Folder} iconColorClass="icon-blue" label="All Files" count={files.length}>
                    {viewMode === 'grid' ? (
                        <div className="files-grid">
                            {files.filter(f => f.type !== 'folder').map(file => (
                                <FileItemGrid key={file.id} file={file} isSelected={selectedFileId === file.id} onSelect={setSelectedFileId} onStar={handleStar} onDragStart={handleDragStart} onContextMenu={handleContextMenu} />
                            ))}
                        </div>
                    ) : (
                        files.map(file => (
                            <FileItemList key={file.id} file={file} isSelected={selectedFileId === file.id} onSelect={setSelectedFileId} onStar={handleStar} onDragStart={handleDragStart} onContextMenu={handleContextMenu} expandedFolders={expandedFolders} onToggleFolder={toggleFolder} />
                        ))
                    )}
                </ResizableSection>
            </ResizableSectionsContainer>

            {/* Footer - Always anchored to bottom */}
            <div className="panel-footer" onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }} onDragLeave={() => setIsDragOver(false)} onDrop={(e) => { e.preventDefault(); setIsDragOver(false); }}>
                {isDragOver ? (
                    <div className="panel-footer__dropzone"><Upload size={16} /><span>Drop to upload</span></div>
                ) : (
                    <>
                        <button className="panel-footer__btn panel-footer__btn--primary"><Upload size={11} /><span>Upload</span></button>
                        <button className="panel-footer__btn panel-footer__btn--icon" title="Refresh"><RefreshCw size={11} /></button>
                    </>
                )}
            </div>

            {/* Context menu */}
            {contextMenu && <ContextMenu x={contextMenu.x} y={contextMenu.y} file={contextMenu.file} onClose={() => setContextMenu(null)} onAction={handleContextAction} />}
        </div>
    );
}

export default FilesPanelContent;