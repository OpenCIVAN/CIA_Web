// src/ui/react/components/panels/LeftPanel/tabs/SavedFiltersTab.jsx
// Saved Filters tab content for the unified left panel
//
// Features:
// - Shows saved filter presets with search and filtering
// - Filter types: colormap, threshold, clip, opacity, composite
// - Star/favorite filters, sharing, and quick apply
// - VS Code-style collapsible sections

import React, { useState, useCallback, useMemo } from 'react';
import {
    SlidersHorizontal,
    Search,
    X,
    ChevronDown,
    ChevronRight,
    Star,
    StarOff,
    Trash2,
    Copy,
    Share2,
    Play,
    Upload,
    Download,
    Plus,
    Palette,
    Sliders,
    Scissors,
    CircleDot,
    Filter,
    Users,
    Pin,
    PinOff,
    Loader2,
    AlertCircle,
} from 'lucide-react';
import { ui as log } from '@Utils/logger.js';
import { useFilters } from '@UI/react/hooks/useFilters.js';

// =============================================================================
// FILTER TYPE ICONS
// =============================================================================

const FILTER_TYPE_ICONS = {
    colormap: Palette,
    threshold: Sliders,
    clip: Scissors,
    opacity: CircleDot,
    composite: Filter,
};

// =============================================================================
// SCOPE BADGES
// =============================================================================

const SCOPE_BADGES = {
    personal: { label: 'Personal', color: 'blue' },
    workspace: { label: 'Workspace', color: 'teal' },
    project: { label: 'Project', color: 'amber' },
};

// =============================================================================
// FILTER ITEM
// =============================================================================

function FilterItem({ filter, isSelected, onSelect, onTogglePin, onApply, onDelete }) {
    const scopeBadge = SCOPE_BADGES[filter.scope] || SCOPE_BADGES.personal;

    return (
        <div
            className={`filter-item ${isSelected ? 'filter-item--selected' : ''}`}
            onClick={() => onSelect(isSelected ? null : filter.id)}
        >
            <div className="filter-item__main">
                {/* Pin toggle */}
                <button
                    className={`filter-item__star ${filter.isPinned ? 'filter-item__star--active' : ''}`}
                    onClick={(e) => { e.stopPropagation(); onTogglePin(filter.id); }}
                    title={filter.isPinned ? 'Unpin' : 'Pin'}
                >
                    {filter.isPinned ? <Pin size={12} fill="currentColor" /> : <PinOff size={12} />}
                </button>

                {/* Type icon */}
                <span className="filter-item__type-icon">
                    <Filter size={14} />
                </span>

                {/* Content */}
                <div className="filter-item__content">
                    <div className="filter-item__name">
                        {filter.name}
                        <span
                            className="filter-item__scope-badge"
                            style={{ '--badge-color': `var(--color-accent-${scopeBadge.color})` }}
                        >
                            {scopeBadge.label}
                        </span>
                    </div>
                    {filter.description && (
                        <div className="filter-item__description">{filter.description}</div>
                    )}
                </div>

                {/* Quick apply button */}
                <button
                    className="filter-item__apply-btn"
                    onClick={(e) => { e.stopPropagation(); onApply(filter.id); }}
                >
                    <Play size={10} />
                    Apply
                </button>
            </div>

            {/* Expanded details */}
            {isSelected && (
                <div className="filter-item__expanded">
                    {/* Metadata */}
                    <div className="filter-item__meta">
                        <span>Created by {filter.owner?.name || 'Unknown'}</span>
                        <span>Scope: {filter.scope}</span>
                    </div>

                    {/* Actions */}
                    <div className="filter-item__actions">
                        <button className="filter-item__action-btn" data-color="blue">
                            <Copy size={10} /> Duplicate
                        </button>
                        {filter.isOwn && (
                            <button
                                className="filter-item__action-btn filter-item__action-btn--icon"
                                onClick={(e) => { e.stopPropagation(); onDelete(filter.id); }}
                            >
                                <Trash2 size={10} />
                            </button>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}

// =============================================================================
// FILTER TABS
// =============================================================================

function FilterTabs({ activeTab, onTabChange }) {
    const tabs = [
        { id: 'all', label: 'All', icon: null },
        { id: 'starred', label: 'Starred', icon: Star },
        { id: 'shared', label: 'Shared', icon: Users },
    ];

    return (
        <div className="filter-tabs">
            {tabs.map(tab => {
                const TabIcon = tab.icon;
                return (
                    <button
                        key={tab.id}
                        className={`filter-tabs__btn ${activeTab === tab.id ? 'filter-tabs__btn--active' : ''}`}
                        onClick={() => onTabChange(tab.id)}
                    >
                        {TabIcon && <TabIcon size={10} />}
                        {tab.label}
                    </button>
                );
            })}
        </div>
    );
}

// =============================================================================
// CREATE FILTER FORM
// =============================================================================

function CreateFilterForm({ onSave, onCancel }) {
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [scope, setScope] = useState('personal');
    const [isSaving, setIsSaving] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!name.trim()) return;

        setIsSaving(true);
        try {
            // For now, save with empty filter config - the actual filter config
            // should come from the current view state
            await onSave(name.trim(), {}, { description, scope });
        } catch (err) {
            log.error('Failed to save filter:', err);
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <form className="create-filter-form" onSubmit={handleSubmit}>
            <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Filter name..."
                className="create-filter-form__input"
                autoFocus
            />
            <input
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Description (optional)"
                className="create-filter-form__input"
            />
            <select
                value={scope}
                onChange={(e) => setScope(e.target.value)}
                className="create-filter-form__select"
            >
                <option value="personal">Personal</option>
                <option value="project">Project</option>
            </select>
            <div className="create-filter-form__actions">
                <button type="button" onClick={onCancel} className="create-filter-form__btn">
                    Cancel
                </button>
                <button
                    type="submit"
                    disabled={!name.trim() || isSaving}
                    className="create-filter-form__btn create-filter-form__btn--primary"
                >
                    {isSaving ? <Loader2 size={12} className="spin" /> : 'Save'}
                </button>
            </div>
        </form>
    );
}

// =============================================================================
// MAIN COMPONENT
// =============================================================================

export function SavedFiltersPanelContent({ workspaceId }) {
    // Use the real filters hook
    const {
        filters,
        groupedFilters,
        isLoading,
        error,
        createFilter,
        deleteFilter,
        togglePin,
        applyFilter,
        refetch,
    } = useFilters({ workspaceId });

    // Local state
    const [searchQuery, setSearchQuery] = useState('');
    const [activeTab, setActiveTab] = useState('all');
    const [selectedFilter, setSelectedFilter] = useState(null);
    const [showCreateForm, setShowCreateForm] = useState(false);

    // Handle apply filter
    const handleApplyFilter = useCallback((filterId) => {
        const filterConfig = applyFilter(filterId);
        if (filterConfig) {
            log.debug('Applying filter:', filterId, filterConfig);
            // Dispatch event for other components to handle
            window.dispatchEvent(
                new CustomEvent('cia:apply-filter', {
                    detail: { filterId, filterConfig },
                })
            );
        }
    }, [applyFilter]);

    // Handle delete
    const handleDelete = useCallback(async (filterId) => {
        if (window.confirm('Delete this filter?')) {
            try {
                await deleteFilter(filterId);
                setSelectedFilter(null);
            } catch (err) {
                log.error('Failed to delete filter:', err);
            }
        }
    }, [deleteFilter]);

    // Handle create
    const handleCreate = useCallback(async (name, filterConfig, options) => {
        try {
            await createFilter(name, filterConfig, options);
            setShowCreateForm(false);
        } catch (err) {
            log.error('Failed to create filter:', err);
            throw err;
        }
    }, [createFilter]);

    // Filter list based on search and tab
    const filteredFilters = useMemo(() => {
        return filters.filter(f => {
            const matchesSearch = !searchQuery ||
                f.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                (f.description && f.description.toLowerCase().includes(searchQuery.toLowerCase()));
            const matchesTab = activeTab === 'all' ||
                (activeTab === 'starred' && f.isPinned) ||
                (activeTab === 'shared' && f.scope !== 'personal');
            return matchesSearch && matchesTab;
        });
    }, [filters, searchQuery, activeTab]);

    // Group by scope for display
    const personalFilters = filteredFilters.filter(f => f.scope === 'personal' && f.isOwn);
    const workspaceFilters = filteredFilters.filter(f => f.scope === 'workspace');
    const projectFilters = filteredFilters.filter(f => f.scope === 'project');
    const sharedFilters = filteredFilters.filter(f => !f.isOwn);

    // Loading state
    if (isLoading && filters.length === 0) {
        return (
            <div className="saved-filters-tab">
                <div className="panel-header">
                    <SlidersHorizontal size={14} className="panel-header__icon file-icon--amber" />
                    <span className="panel-header__title">Saved Filters</span>
                </div>
                <div className="saved-filters-tab__loading">
                    <Loader2 size={24} className="spin" />
                    <span>Loading filters...</span>
                </div>
            </div>
        );
    }

    // Error state
    if (error && filters.length === 0) {
        return (
            <div className="saved-filters-tab">
                <div className="panel-header">
                    <SlidersHorizontal size={14} className="panel-header__icon file-icon--amber" />
                    <span className="panel-header__title">Saved Filters</span>
                </div>
                <div className="saved-filters-tab__error">
                    <AlertCircle size={24} />
                    <span>Failed to load filters</span>
                    <button onClick={refetch}>Retry</button>
                </div>
            </div>
        );
    }

    return (
        <div className="saved-filters-tab">
            {/* Header */}
            <div className="panel-header">
                <SlidersHorizontal size={14} className="panel-header__icon file-icon--amber" />
                <span className="panel-header__title">Saved Filters</span>
                <span className="panel-header__count">{filters.length} presets</span>
            </div>

            {/* Search */}
            <div className="panel-search">
                <div className="panel-search__wrapper">
                    <Search size={12} className="search-icon" />
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search filters..."
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

            {/* Tabs */}
            <div className="panel-toolbar">
                <FilterTabs activeTab={activeTab} onTabChange={setActiveTab} />
            </div>

            {/* Content */}
            <div className="saved-filters-tab__content">
                {/* My Filters (Personal) */}
                {personalFilters.length > 0 && (
                    <div className="saved-filters-tab__section">
                        <div className="saved-filters-tab__section-header">My Filters</div>
                        {personalFilters.map(filter => (
                            <FilterItem
                                key={filter.id}
                                filter={filter}
                                isSelected={selectedFilter === filter.id}
                                onSelect={setSelectedFilter}
                                onTogglePin={togglePin}
                                onApply={handleApplyFilter}
                                onDelete={handleDelete}
                            />
                        ))}
                    </div>
                )}

                {/* Workspace Filters */}
                {workspaceFilters.length > 0 && (
                    <div className="saved-filters-tab__section">
                        <div className="saved-filters-tab__section-header">Workspace Filters</div>
                        {workspaceFilters.map(filter => (
                            <FilterItem
                                key={filter.id}
                                filter={filter}
                                isSelected={selectedFilter === filter.id}
                                onSelect={setSelectedFilter}
                                onTogglePin={togglePin}
                                onApply={handleApplyFilter}
                                onDelete={handleDelete}
                            />
                        ))}
                    </div>
                )}

                {/* Project Filters */}
                {projectFilters.length > 0 && (
                    <div className="saved-filters-tab__section">
                        <div className="saved-filters-tab__section-header">Project Filters</div>
                        {projectFilters.map(filter => (
                            <FilterItem
                                key={filter.id}
                                filter={filter}
                                isSelected={selectedFilter === filter.id}
                                onSelect={setSelectedFilter}
                                onTogglePin={togglePin}
                                onApply={handleApplyFilter}
                                onDelete={handleDelete}
                            />
                        ))}
                    </div>
                )}

                {/* Shared with Me */}
                {sharedFilters.length > 0 && (
                    <div className="saved-filters-tab__section">
                        <div className="saved-filters-tab__section-header">Shared with Me</div>
                        {sharedFilters.map(filter => (
                            <FilterItem
                                key={filter.id}
                                filter={filter}
                                isSelected={selectedFilter === filter.id}
                                onSelect={setSelectedFilter}
                                onTogglePin={togglePin}
                                onApply={handleApplyFilter}
                                onDelete={handleDelete}
                            />
                        ))}
                    </div>
                )}

                {/* Empty state */}
                {filteredFilters.length === 0 && (
                    <div className="saved-filters-tab__empty">
                        {searchQuery ? 'No filters match your search' : 'No saved filters yet'}
                    </div>
                )}
            </div>

            {/* Create Form */}
            {showCreateForm && (
                <CreateFilterForm
                    onSave={handleCreate}
                    onCancel={() => setShowCreateForm(false)}
                />
            )}

            {/* Footer */}
            {!showCreateForm && (
                <div className="panel-footer">
                    <button
                        className="panel-footer__btn panel-footer__btn--primary"
                        onClick={() => setShowCreateForm(true)}
                    >
                        <Plus size={11} />
                        <span>Save Current</span>
                    </button>
                    <button className="panel-footer__btn panel-footer__btn--icon">
                        <Upload size={11} />
                    </button>
                    <button className="panel-footer__btn panel-footer__btn--icon">
                        <Download size={11} />
                    </button>
                </div>
            )}
        </div>
    );
}

export default SavedFiltersPanelContent;