// src/ui/react/components/panels/LeftPanel/tabs/AnnotationsTab/AnnotationsTab.jsx
// Annotations tab - spatial annotations for datasets and workspaces
//
// FIXES:
// - Header now uses ALL CAPS styling like Files/Datasets
// - Scope chips are centered
// - Type filters are centered

import React, { useState, useCallback, useMemo } from 'react';
import {
    MapPin,
    Search,
    X,
    Filter,
    Database,
    LayoutGrid,
    Circle,
    Box,
    Ruler,
    CornerUpRight,
    Eye,
    EyeOff,
    MoreHorizontal,
    ChevronRight,
    ChevronDown,
} from 'lucide-react';
import {
    ResizableSectionsContainer,
    ResizableSection,
    useSectionStates
} from '@UI/react/components/common/ResizableSections';
import './AnnotationsTab.scss';

// =============================================================================
// CONSTANTS
// =============================================================================

const ANNOTATION_SCOPES = [
    { id: 'all', label: 'All', color: 'blue' },
    { id: 'dataset', label: 'Dataset', color: 'teal' },
    { id: 'workspace', label: 'Workspace', color: 'amber' },
];

const ANNOTATION_TYPES = {
    point: { icon: MapPin, label: 'Point', color: 'blue' },
    region: { icon: Box, label: 'Region', color: 'green' },
    measurement: { icon: Ruler, label: 'Measure', color: 'amber' },
    angle: { icon: CornerUpRight, label: 'Angle', color: 'purple' },
};

// Sample data - will be replaced with real data from useAnnotations
const SAMPLE_ANNOTATIONS = {
    datasets: [
        {
            id: 'ds-1',
            name: 'Brain_Scan_001.nii',
            annotations: [
                { id: 'ann-1', type: 'point', text: 'Tumor marker', visible: true },
                { id: 'ann-2', type: 'measurement', text: 'Lesion diameter: 35mm', visible: true },
                { id: 'ann-3', type: 'region', text: 'Region of interest', visible: false },
            ],
        },
        {
            id: 'ds-2',
            name: 'CT_Overlay.dcm',
            annotations: [
                { id: 'ann-4', type: 'point', text: 'Vertebra T7', visible: true },
            ],
        },
    ],
    workspace: [
        { id: 'ws-ann-1', type: 'point', text: 'Reference point A', visible: true },
        { id: 'ws-ann-2', type: 'angle', text: 'Rotation angle', visible: true },
    ],
};

const DEFAULT_SECTION_STATES = {
    dataset: { expanded: true, flexGrow: 2 },
    workspace: { expanded: true, flexGrow: 1 },
};

// =============================================================================
// SUB-COMPONENTS
// =============================================================================

function ScopeChip({ scope, active, onClick }) {
    return (
        <button
            className={`scope-chip ${active ? 'scope-chip--active' : ''}`}
            data-color={scope.color}
            onClick={onClick}
        >
            {scope.label}
        </button>
    );
}

function TypeFilterToggle({ type, config, active, onClick }) {
    const Icon = config.icon;
    return (
        <button
            className={`type-filter-toggle ${active ? 'type-filter-toggle--active' : ''}`}
            data-color={config.color}
            onClick={onClick}
            title={config.label}
        >
            <Icon size={14} />
        </button>
    );
}

function AnnotationItem({ annotation }) {
    const config = ANNOTATION_TYPES[annotation.type] || ANNOTATION_TYPES.point;
    const Icon = config.icon;

    return (
        <div className="annotation-item">
            <Icon size={12} className="annotation-item__icon" data-color={config.color} />
            <span className="annotation-item__text">{annotation.text}</span>
            <button className="annotation-item__visibility">
                {annotation.visible ? <Eye size={12} /> : <EyeOff size={12} />}
            </button>
            <button className="annotation-item__more">
                <MoreHorizontal size={12} />
            </button>
        </div>
    );
}

function DatasetGroup({ dataset }) {
    const [expanded, setExpanded] = useState(true);

    return (
        <div className="dataset-group">
            <button
                className="dataset-group__header"
                onClick={() => setExpanded(!expanded)}
            >
                {expanded ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
                <Database size={12} className="dataset-group__icon" />
                <span className="dataset-group__name">{dataset.name}</span>
                <span className="dataset-group__count">{dataset.annotations.length}</span>
            </button>
            {expanded && (
                <div className="dataset-group__list">
                    {dataset.annotations.map(ann => (
                        <AnnotationItem key={ann.id} annotation={ann} />
                    ))}
                </div>
            )}
        </div>
    );
}

function WorkspaceAnnotationItem({ annotation }) {
    const config = ANNOTATION_TYPES[annotation.type] || ANNOTATION_TYPES.point;
    const Icon = config.icon;

    return (
        <div className="annotation-item annotation-item--workspace">
            <Icon size={12} className="annotation-item__icon" data-color={config.color} />
            <span className="annotation-item__text">{annotation.text}</span>
            <button className="annotation-item__visibility">
                {annotation.visible ? <Eye size={12} /> : <EyeOff size={12} />}
            </button>
        </div>
    );
}

// =============================================================================
// MAIN COMPONENT
// =============================================================================

export function AnnotationsPanelContent({ workspaceId }) {
    // State
    const [scope, setScope] = useState('all');
    const [searchQuery, setSearchQuery] = useState('');
    const [typeFilters, setTypeFilters] = useState(Object.keys(ANNOTATION_TYPES));

    // Section states for resizable sections
    const { states: sectionStates, toggleSection } = useSectionStates(DEFAULT_SECTION_STATES);

    // Toggle type filter
    const toggleTypeFilter = useCallback((type) => {
        setTypeFilters(prev =>
            prev.includes(type)
                ? prev.filter(t => t !== type)
                : [...prev, type]
        );
    }, []);

    // Calculate total count
    const totalCount = useMemo(() => {
        const datasetCount = SAMPLE_ANNOTATIONS.datasets.reduce(
            (sum, ds) => sum + ds.annotations.length, 0
        );
        return datasetCount + SAMPLE_ANNOTATIONS.workspace.length;
    }, []);

    return (
        <div className="annotations-tab">
            {/* Header - ALL CAPS like other tabs */}
            <div className="panel-header panel-header--pink">
                <MapPin size={16} className="panel-header__icon" />
                <span className="panel-header__title">Annotations</span>
                <span className="panel-header__count">{totalCount}</span>
            </div>

            {/* Scope chips - CENTERED */}
            <div className="scope-chips-wrapper">
                <div className="scope-chips">
                    {ANNOTATION_SCOPES.map(s => (
                        <ScopeChip
                            key={s.id}
                            scope={s}
                            active={scope === s.id}
                            onClick={() => setScope(s.id)}
                        />
                    ))}
                </div>
            </div>

            {/* Search */}
            <div className="annotations-tab__search">
                <div className="search-input">
                    <Search size={12} className="search-input__icon" />
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search annotations..."
                    />
                    {searchQuery && (
                        <button
                            className="search-input__clear"
                            onClick={() => setSearchQuery('')}
                        >
                            <X size={10} />
                        </button>
                    )}
                </div>
            </div>

            {/* Type filters - CENTERED */}
            <div className="type-filter-wrapper">
                <div className="type-filter-group">
                    {Object.entries(ANNOTATION_TYPES).map(([type, config]) => (
                        <TypeFilterToggle
                            key={type}
                            type={type}
                            config={config}
                            active={typeFilters.includes(type)}
                            onClick={() => toggleTypeFilter(type)}
                        />
                    ))}
                </div>
            </div>

            {/* Resizable Sections */}
            <ResizableSectionsContainer
                sectionStates={sectionStates}
                onSectionToggle={toggleSection}
            >
                {/* Dataset Annotations */}
                <ResizableSection
                    id="dataset"
                    icon={Database}
                    iconColorClass="icon-blue"
                    label="Dataset Annotations"
                    count={SAMPLE_ANNOTATIONS.datasets.reduce((sum, ds) => sum + ds.annotations.length, 0)}
                >
                    <div className="annotations-tab__section-content">
                        {SAMPLE_ANNOTATIONS.datasets.map(ds => (
                            <DatasetGroup key={ds.id} dataset={ds} />
                        ))}
                    </div>
                </ResizableSection>

                {/* Workspace Annotations */}
                <ResizableSection
                    id="workspace"
                    icon={LayoutGrid}
                    iconColorClass="icon-amber"
                    label="Workspace Annotations"
                    count={SAMPLE_ANNOTATIONS.workspace.length}
                >
                    <div className="annotations-tab__section-content">
                        {SAMPLE_ANNOTATIONS.workspace.map(ann => (
                            <WorkspaceAnnotationItem key={ann.id} annotation={ann} />
                        ))}
                    </div>
                </ResizableSection>
            </ResizableSectionsContainer>

            {/* Footer */}
            <div className="annotations-tab__footer">
                <span className="annotations-tab__footer-count">
                    {totalCount} annotation{totalCount !== 1 ? 's' : ''}
                </span>
            </div>
        </div>
    );
}

export default AnnotationsPanelContent;