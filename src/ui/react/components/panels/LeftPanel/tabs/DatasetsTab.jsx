// src/ui/react/components/panels/LeftPanel/tabs/DatasetsTab.jsx
// Datasets tab content for the unified left panel
//
// Features:
// - Three-layer data model: Dataset → ViewConfiguration → InstanceWindow
// - Active/Inactive/Shared view filtering
// - Tree structure with datasets and their views
// - View status indicators and filter badges
// - Workspace-scoped active views
// - Shared views section docked at bottom

import React, { useState, useCallback, useMemo } from 'react';
import {
    Database,
    Search,
    X,
    Filter,
    Eye,
    EyeOff,
    Archive,
    Users,
    ChevronDown,
    ChevronRight,
    Circle,
    FolderOpen,
    RefreshCw,
    Trash2,
    Box,
    FileCode,
    Layers,
    MoreHorizontal,
    Save,
    Star,
} from 'lucide-react';
import { useDatasets } from '@UI/react/hooks/useDatasets.js';

// =============================================================================
// DATASET TYPE UTILITIES
// =============================================================================

const getDatasetTypeConfig = (type) => {
    switch (type) {
        case 'nifti':
            return { icon: Box, colorClass: 'file-icon--nifti' };
        case 'dicom':
            return { icon: Database, colorClass: 'file-icon--dicom' };
        case 'vtk':
            return { icon: Layers, colorClass: 'file-icon--vtk' };
        default:
            return { icon: Box, colorClass: 'file-icon--default' };
    }
};

// =============================================================================
// VIEW ITEM
// =============================================================================

function ViewItem({ view, isInSharedSection = false }) {
    const [isHovered, setIsHovered] = useState(false);
    const isActive = view.status === 'active';
    const inDifferentWorkspace = view.workspace && view.workspace !== 'personal';

    return (
        <div
            className={`tree-item tree-item--view ${isActive ? 'active' : ''}`}
            style={{
                background: isActive
                    ? `rgba(var(--view-color-rgb, 96,165,250), 0.08)`
                    : isHovered ? 'rgba(255,255,255,0.02)' : 'transparent',
                borderLeftColor: isActive ? view.instanceColor : 'transparent',
                opacity: inDifferentWorkspace && isInSharedSection ? 0.7 : 1,
                '--view-color': view.instanceColor,
            }}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
        >
            {/* Status dot */}
            <Circle
                size={8}
                fill={isActive ? view.instanceColor : 'none'}
                style={{ color: isActive ? view.instanceColor : 'var(--color-text-muted)' }}
            />

            {/* View name */}
            <span className="item-name">
                {view.name}
                {view.sharedBy && (
                    <span className="view-shared-by"> • from {view.sharedBy}</span>
                )}
            </span>

            {/* Badges and indicators */}
            <div className="view-indicators">
                {/* Shared badge (in Active section) */}
                {view.isShared && !isInSharedSection && (
                    <Users
                        size={9}
                        className="indicator-icon indicator-icon--shared"
                        title={view.sharedBy ? `From ${view.sharedBy}` : `Shared with ${view.sharedWith?.length}`}
                    />
                )}

                {/* Saved indicator */}
                {view.savedByUser && (
                    <Save size={9} className="indicator-icon indicator-icon--saved" />
                )}

                {/* Filter count badge */}
                {view.filters?.length > 0 && (
                    <span className="badge badge--count">{view.filters.length}</span>
                )}

                {/* Last active time (for inactive views) */}
                {!isActive && view.lastActive && (
                    <span className="item-meta">{view.lastActive}</span>
                )}

                {/* Workspace badge (in shared section) */}
                {inDifferentWorkspace && isInSharedSection && (
                    <span className="badge badge--workspace">{view.workspaceName}</span>
                )}
            </div>

            {/* More actions button */}
            {isHovered && (
                <button className="tree-item__more-btn">
                    <MoreHorizontal size={12} />
                </button>
            )}
        </div>
    );
}

// =============================================================================
// DATASET ITEM
// =============================================================================

function DatasetItem({ dataset, views, isExpanded, onToggle, isInSharedSection = false }) {
    const [isHovered, setIsHovered] = useState(false);
    const { icon: TypeIcon, colorClass } = getDatasetTypeConfig(dataset.type);
    const activeCount = views.filter(v => v.status === 'active').length;

    if (views.length === 0) return null;

    return (
        <>
            {/* Dataset row */}
            <div
                className="tree-item tree-item--folder"
                onMouseEnter={() => setIsHovered(true)}
                onMouseLeave={() => setIsHovered(false)}
                onClick={onToggle}
            >
                {/* Expand/collapse chevron */}
                <span className="chevron">
                    {isExpanded ? <ChevronDown size={10} /> : <ChevronRight size={10} />}
                </span>

                {/* Dataset type icon */}
                <TypeIcon size={12} className={`item-icon ${colorClass}`} />

                {/* Dataset name */}
                <span className="item-name">{dataset.name}</span>

                {/* Annotation count badge */}
                {dataset.annotations > 0 && (
                    <span className="badge badge--count" title={`${dataset.annotations} annotations`}>
                        {dataset.annotations}
                    </span>
                )}

                {/* View count */}
                <span className="item-meta">
                    <span style={{ color: activeCount > 0 ? 'var(--color-accent-green)' : undefined }}>
                        {activeCount}
                    </span>
                    /{views.length}
                </span>
            </div>

            {/* Views under this dataset */}
            {isExpanded && views.map(view => (
                <ViewItem
                    key={view.id}
                    view={view}
                    isInSharedSection={isInSharedSection}
                />
            ))}
        </>
    );
}

// =============================================================================
// SECTION COMPONENT
// =============================================================================

function Section({
    icon: Icon,
    iconColorClass,
    label,
    count,
    badge,
    expanded,
    onToggle,
    children,
    docked = false,
    maxHeight,
}) {
    return (
        <div className={`tree-section ${expanded ? 'tree-section--expanded' : 'tree-section--collapsed'} ${docked ? 'tree-section--docked' : ''}`}>
            <div className="tree-section__header" onClick={onToggle}>
                <span className="chevron">
                    {expanded ? <ChevronDown size={10} /> : <ChevronRight size={10} />}
                </span>
                <Icon size={11} className={`section-icon ${iconColorClass}`} />
                <span>{label}</span>
                {badge > 0 && <span className="badge badge--new">{badge}</span>}
                <span className="count">{count}</span>
            </div>

            {expanded && (
                <div
                    className="tree-section__content"
                    style={maxHeight ? { maxHeight } : undefined}
                >
                    {children}
                </div>
            )}
        </div>
    );
}

// =============================================================================
// FILTER TOGGLE BUTTON
// =============================================================================

function FilterToggle({ icon: Icon, label, color, active, count, onClick }) {
    return (
        <button
            className={`filter-toggle ${active ? 'active' : ''}`}
            data-color={color}
            onClick={onClick}
        >
            <Icon size={10} />
            {count > 0 && <span className="count">{count}</span>}
        </button>
    );
}

// =============================================================================
// MAIN DATASETS TAB CONTENT
// =============================================================================

export function DatasetsPanelContent({ workspaceId }) {
    // Filter state
    const [searchQuery, setSearchQuery] = useState('');
    const [filters, setFilters] = useState({
        active: true,
        inactive: true,
        shared: true,
    });

    // Section expansion state
    const [expandedSections, setExpandedSections] = useState({
        active: true,
        inactive: false,
        shared: true,
    });

    // Dataset expansion state
    const [expandedDatasets, setExpandedDatasets] = useState(new Set(['ds1', 'ds2', 'ds3']));

    // Get datasets from DatasetManager
    const loadedDatasets = useDatasets();

    // Transform to UI format with views
    const datasets = useMemo(() => {
        return loadedDatasets.map(ds => ({
            id: ds.id,
            name: ds.name,
            type: getDatasetType(ds.name),
            annotations: ds.annotations?.length || 0,
            views: [
                // For now, create a default view per dataset
                // TODO: Connect to ViewConfigurationManager for real views
                {
                    id: `view-${ds.id}`,
                    name: 'Default View',
                    workspace: workspaceId || 'personal',
                    status: ds.hasPolydata || ds.isAnalyzed ? 'active' : 'inactive',
                    instanceColor: '#60a5fa',
                    filters: [],
                    isShared: false,
                }
            ],
        }));
    }, [loadedDatasets, workspaceId]);

    // Helper to determine dataset type from filename
    const getDatasetType = (filename) => {
        if (!filename) return 'other';
        const name = filename.toLowerCase();
        if (name.endsWith('.nii') || name.endsWith('.nii.gz')) return 'nifti';
        if (name.endsWith('.dcm')) return 'dicom';
        if (name.endsWith('.vtp') || name.endsWith('.vtk')) return 'vtk';
        return 'other';
    };


    // View filtering functions
    const getActiveViews = useCallback((ds) =>
        ds.views.filter(v => v.status === 'active'),
        []);

    const getInactiveViews = useCallback((ds) =>
        ds.views.filter(v => v.status === 'inactive'),
        []);

    const getSharedViews = useCallback((ds) =>
        ds.views.filter(v => v.isShared && v.sharedBy),
        []);


    // Count totals
    const counts = useMemo(() => ({
        active: datasets.reduce((sum, ds) => sum + getActiveViews(ds).length, 0),
        inactive: datasets.reduce((sum, ds) => sum + getInactiveViews(ds).length, 0),
        shared: datasets.reduce((sum, ds) => sum + getSharedViews(ds).length, 0),
    }), [datasets, getActiveViews, getInactiveViews, getSharedViews]);

    // Handlers
    const toggleFilter = useCallback((key) => {
        setFilters(prev => ({ ...prev, [key]: !prev[key] }));
    }, []);

    const toggleSection = useCallback((section) => {
        setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }));
    }, []);

    const toggleDataset = useCallback((id) => {
        setExpandedDatasets(prev => {
            const next = new Set(prev);
            if (next.has(id)) {
                next.delete(id);
            } else {
                next.add(id);
            }
            return next;
        });
    }, []);

    return (
        <div className="datasets-tab">
            {/* Header */}
            <div className="panel-header">
                <Database size={14} className="panel-header__icon file-icon--dicom" />
                <span className="panel-header__title">Datasets</span>
            </div>

            {/* Search */}
            <div className="panel-search">
                <div className="panel-search__wrapper">
                    <Search size={12} className="search-icon" />
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search datasets & views..."
                    />
                    {searchQuery && (
                        <button
                            className="clear-button"
                            onClick={() => setSearchQuery('')}
                        >
                            <X size={10} />
                        </button>
                    )}
                </div>
            </div>

            {/* Filter toggles */}
            <div className="panel-toolbar">
                <FilterToggle
                    icon={Eye}
                    label="Active"
                    color="green"
                    active={filters.active}
                    count={counts.active}
                    onClick={() => toggleFilter('active')}
                />
                <FilterToggle
                    icon={Archive}
                    label="Inactive"
                    color="muted"
                    active={filters.inactive}
                    count={counts.inactive}
                    onClick={() => toggleFilter('inactive')}
                />
                <FilterToggle
                    icon={Users}
                    label="Shared"
                    color="pink"
                    active={filters.shared}
                    count={counts.shared}
                    onClick={() => toggleFilter('shared')}
                />
                <div className="panel-toolbar__spacer" />
                <button className="panel-header__action-btn" title="Filter options">
                    <Filter size={12} />
                </button>
            </div>

            {/* Sections container */}
            <div className="datasets-tab__sections">
                {/* Active views - scoped to current workspace */}
                {filters.active && (
                    <Section
                        icon={Eye}
                        iconColorClass="status-indicator__dot--active"
                        label="Active"
                        count={counts.active}
                        expanded={expandedSections.active}
                        onToggle={() => toggleSection('active')}
                    >
                        {datasets.filter(ds => getActiveViews(ds).length > 0).length === 0 ? (
                            <div className="tree-section__empty">
                                No active views in this workspace
                            </div>
                        ) : (
                            datasets.filter(ds => getActiveViews(ds).length > 0).map(ds => (
                                <DatasetItem
                                    key={ds.id}
                                    dataset={ds}
                                    views={getActiveViews(ds)}
                                    isExpanded={expandedDatasets.has(ds.id)}
                                    onToggle={() => toggleDataset(ds.id)}
                                />
                            ))
                        )}
                    </Section>
                )}

                {/* Inactive views - global */}
                {filters.inactive && (
                    <Section
                        icon={Archive}
                        iconColorClass="file-icon--default"
                        label="Inactive"
                        count={counts.inactive}
                        expanded={expandedSections.inactive}
                        onToggle={() => toggleSection('inactive')}
                    >
                        {datasets.filter(ds => getInactiveViews(ds).length > 0).length === 0 ? (
                            <div className="tree-section__empty">
                                No inactive views
                            </div>
                        ) : (
                            datasets.filter(ds => getInactiveViews(ds).length > 0).map(ds => (
                                <DatasetItem
                                    key={ds.id}
                                    dataset={ds}
                                    views={getInactiveViews(ds)}
                                    isExpanded={expandedDatasets.has(ds.id)}
                                    onToggle={() => toggleDataset(ds.id)}
                                />
                            ))
                        )}
                    </Section>
                )}
            </div>

            {/* Shared with Me - DOCKED at bottom */}
            {filters.shared && (
                <Section
                    icon={Users}
                    iconColorClass="indicator-icon--shared"
                    label="Shared with Me"
                    count={counts.shared}
                    badge={counts.shared}
                    expanded={expandedSections.shared}
                    onToggle={() => toggleSection('shared')}
                    docked
                    maxHeight={180}
                >
                    {datasets.filter(ds => getSharedViews(ds).length > 0).length === 0 ? (
                        <div className="tree-section__empty">
                            No shared views
                        </div>
                    ) : (
                        datasets.filter(ds => getSharedViews(ds).length > 0).map(ds => (
                            <DatasetItem
                                key={ds.id}
                                dataset={ds}
                                views={getSharedViews(ds)}
                                isExpanded={expandedDatasets.has(ds.id)}
                                onToggle={() => toggleDataset(ds.id)}
                                isInSharedSection
                            />
                        ))
                    )}
                </Section>
            )}

            {/* Footer */}
            <div className="panel-footer">
                <button className="panel-footer__btn panel-footer__btn--primary">
                    <FolderOpen size={11} />
                    <span>Load Dataset</span>
                </button>
                <button className="panel-footer__btn panel-footer__btn--icon" title="Clean up">
                    <Trash2 size={11} />
                </button>
                <button className="panel-footer__btn panel-footer__btn--icon" title="Refresh">
                    <RefreshCw size={11} />
                </button>
            </div>
        </div>
    );
}

export default DatasetsPanelContent;