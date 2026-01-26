// src/ui/react/components/workspace/Canvas/CanvasChrome/CanvasChromeHeader.jsx
// CanvasChromeHeader - header bar for workspace/viewgroup/navigation controls.

import React, { memo, useMemo, useRef, useState, useCallback } from 'react';
import { Icon } from '@UI/react/components/atoms/Icon';
import { DropdownPortal } from '@UI/react/components/atoms/DropdownPortal';
import './CanvasChromeHeader.scss';

const normalizeItems = (items = []) => items.map((item) => {
    if (typeof item === 'string') {
        return { id: item, name: item };
    }
    return item;
});

const DropdownList = memo(function DropdownList({
    open,
    onClose,
    triggerRef,
    items,
    renderItem,
    header,
    footer,
    className = '',
}) {
    if (!open) return null;

    return (
        <DropdownPortal
            open={open}
            onClose={onClose}
            triggerRef={triggerRef}
            align="start"
            position="bottom"
            className={`canvas-chrome-header__dropdown ${className}`}
        >
            <div className="canvas-chrome-header__dropdown-inner">
                {header}
                {items.map(renderItem)}
                {footer}
            </div>
        </DropdownPortal>
    );
});

export const CanvasChromeHeader = memo(function CanvasChromeHeader({
    // Navigation
    canGoBack = false,
    onGoBack,
    onGoHome,

    // Workspace
    workspace,
    workspaces = [],
    onWorkspaceChange,

    // ViewGroup
    viewGroup,
    viewGroups = [],
    onViewGroupChange,
    isViewGroupLinked = false,
    onEditViewGroup,
    onOpenViewGroupManager,

    // Edit mode
    isEditMode = false,
    onToggleEditMode,

    // Flow
    flowDirection = 'right',
    onFlowDirectionChange,

    // Display options
    showCoordinates = false,
    showViewGroupBorders = false,
    onToggleCoordinates,
    onToggleViewGroupBorders,

    // Window mode
    windowMode = 'docked',
    onWindowModeChange,
    isFullscreen = false,
    onToggleFullscreen,

    className = '',
}) {
    const [workspaceOpen, setWorkspaceOpen] = useState(false);
    const [viewGroupOpen, setViewGroupOpen] = useState(false);
    const [displayOpen, setDisplayOpen] = useState(false);
    const [workspaceQuery, setWorkspaceQuery] = useState('');
    const [viewGroupQuery, setViewGroupQuery] = useState('');
    const [viewGroupSort, setViewGroupSort] = useState('name-asc');
    const [viewGroupFilter, setViewGroupFilter] = useState('all');
    const [viewGroupTag, setViewGroupTag] = useState(null);
    const [workspaceSort, setWorkspaceSort] = useState('name-asc');
    const [workspaceFilter, setWorkspaceFilter] = useState('all');
    const [workspaceTag, setWorkspaceTag] = useState(null);
    const workspaceTriggerRef = useRef(null);
    const viewGroupTriggerRef = useRef(null);
    const displayTriggerRef = useRef(null);

    const workspaceItems = useMemo(() => normalizeItems(workspaces), [workspaces]);
    const viewGroupItems = useMemo(() => normalizeItems(viewGroups), [viewGroups]);
    const workspaceLabel = workspace?.name || (typeof workspace === 'string' ? workspace : 'Workspace');
    const workspaceId = workspace?.id || (typeof workspace === 'string' ? workspace : null);
    const viewGroupLabel = viewGroup?.name || (typeof viewGroup === 'string' ? viewGroup : 'All ViewGroups');
    const viewGroupId = viewGroup?.id || (typeof viewGroup === 'string' ? viewGroup : null);

    const activeDisplayCount = Number(showCoordinates) + Number(showViewGroupBorders);

    const viewGroupTags = useMemo(() => {
        const tags = new Set();
        viewGroupItems.forEach((item) => {
            if (Array.isArray(item.tags)) {
                item.tags.forEach((tag) => tags.add(tag));
            }
        });
        return Array.from(tags);
    }, [viewGroupItems]);

    const workspaceTags = useMemo(() => {
        const tags = new Set();
        workspaceItems.forEach((item) => {
            if (Array.isArray(item.tags)) {
                item.tags.forEach((tag) => tags.add(tag));
            }
        });
        return Array.from(tags);
    }, [workspaceItems]);

    const filteredWorkspaces = useMemo(() => {
        const query = workspaceQuery.trim().toLowerCase();
        const hasQuery = Boolean(query);
        const matchesFilter = (item) => {
            if (workspaceFilter === 'all') return true;
            return item.type === workspaceFilter;
        };

        let items = workspaceItems.filter((item) => {
            if (hasQuery && !(item.name || '').toLowerCase().includes(query)) return false;
            if (!matchesFilter(item)) return false;
            if (workspaceTag && (!Array.isArray(item.tags) || !item.tags.includes(workspaceTag))) return false;
            return true;
        });

        const sorters = {
            'name-asc': (a, b) => (a.name || '').localeCompare(b.name || ''),
            'name-desc': (a, b) => (b.name || '').localeCompare(a.name || ''),
            'recent': (a, b) => (b.updatedAt || 0) - (a.updatedAt || 0),
        };

        const sorter = sorters[workspaceSort] || sorters['name-asc'];
        return items.slice().sort(sorter);
    }, [workspaceItems, workspaceQuery, workspaceFilter, workspaceSort, workspaceTag]);

    const filteredViewGroups = useMemo(() => {
        const query = viewGroupQuery.trim().toLowerCase();
        const hasQuery = Boolean(query);
        const isLinked = (item) => Boolean(item.linkedTo || item.isLinked);
        const hasTags = (item) => Array.isArray(item.tags) && item.tags.length > 0;

        let items = viewGroupItems.filter((item) => {
            if (hasQuery && !(item.name || '').toLowerCase().includes(query)) return false;
            if (viewGroupFilter === 'linked' && !isLinked(item)) return false;
            if (viewGroupFilter === 'unlinked' && isLinked(item)) return false;
            if (viewGroupFilter === 'tagged' && !hasTags(item)) return false;
            if (viewGroupTag && (!Array.isArray(item.tags) || !item.tags.includes(viewGroupTag))) return false;
            return true;
        });

        const sorters = {
            'name-asc': (a, b) => (a.name || '').localeCompare(b.name || ''),
            'name-desc': (a, b) => (b.name || '').localeCompare(a.name || ''),
            'views-desc': (a, b) => (b.views?.length || 0) - (a.views?.length || 0),
            'views-asc': (a, b) => (a.views?.length || 0) - (b.views?.length || 0),
            'linked-first': (a, b) => Number(isLinked(b)) - Number(isLinked(a)),
        };

        const sorter = sorters[viewGroupSort] || sorters['name-asc'];
        return items.slice().sort(sorter);
    }, [viewGroupItems, viewGroupQuery, viewGroupFilter, viewGroupSort, viewGroupTag]);

    const handleCloseWorkspace = useCallback(() => {
        setWorkspaceOpen(false);
        setWorkspaceQuery('');
        setWorkspaceTag(null);
    }, []);

    const handleCloseViewGroups = useCallback(() => {
        setViewGroupOpen(false);
        setViewGroupQuery('');
        setViewGroupTag(null);
    }, []);

    return (
        <header className={`canvas-chrome-header ${className}`}>
            <div className="canvas-chrome-header__left">
                <div className="canvas-chrome-header__nav-group">
                    <button
                        type="button"
                        className="canvas-chrome-header__icon-btn"
                        onClick={onGoBack}
                        disabled={!canGoBack}
                        title="Back"
                        aria-label="Back"
                    >
                        <Icon name="arrowLeft" size={14} />
                    </button>
                    <button
                        type="button"
                        className="canvas-chrome-header__icon-btn"
                        onClick={onGoHome}
                        title="Home"
                        aria-label="Home"
                    >
                        <Icon name="home" size={14} />
                    </button>
                </div>

                <div className="canvas-chrome-header__selector-group">
                    <button
                        ref={workspaceTriggerRef}
                        type="button"
                        className="canvas-chrome-header__selector canvas-chrome-header__selector--workspace"
                        onClick={() => setWorkspaceOpen((prev) => !prev)}
                        aria-expanded={workspaceOpen}
                        aria-haspopup="listbox"
                    >
                        <Icon name="grid" size={14} />
                        <span className="canvas-chrome-header__selector-name">
                            {workspaceLabel}
                        </span>
                        <Icon name="chevronDown" size={12} />
                    </button>

                    <Icon name="chevronRight" size={12} className="canvas-chrome-header__chevron" />

                    <button
                        ref={viewGroupTriggerRef}
                        type="button"
                        className="canvas-chrome-header__selector canvas-chrome-header__selector--viewgroup"
                        onClick={() => setViewGroupOpen((prev) => !prev)}
                        aria-expanded={viewGroupOpen}
                        aria-haspopup="listbox"
                    >
                        {viewGroup ? (
                            <>
                                <span
                                    className="canvas-chrome-header__dot"
                                    style={{ background: viewGroup.color || 'var(--color-accent-purple)' }}
                                />
                                <span className="canvas-chrome-header__selector-name">
                                    {viewGroupLabel}
                                </span>
                                {isViewGroupLinked && (
                                    <Icon name="link" size={12} className="canvas-chrome-header__link" />
                                )}
                            </>
                        ) : (
                            <>
                                <Icon name="grid3x3" size={12} />
                                <span className="canvas-chrome-header__selector-name">All ViewGroups</span>
                            </>
                        )}
                        <Icon name="chevronDown" size={12} />
                    </button>
                </div>
            </div>

            <div className="canvas-chrome-header__center">
                <div className="canvas-chrome-header__edit">
                    <button
                        type="button"
                        className={`canvas-chrome-header__pill-btn ${isEditMode ? 'is-active' : ''}`}
                        onClick={() => onToggleEditMode?.(!isEditMode)}
                        aria-pressed={isEditMode}
                    >
                        <Icon name="pencil" size={12} />
                        <span>Edit</span>
                    </button>
                </div>

                <div className="canvas-chrome-header__flow">
                    <div className="canvas-chrome-header__button-group">
                        <button
                            type="button"
                            className={`canvas-chrome-header__icon-btn ${flowDirection === 'right' ? 'is-active' : ''}`}
                            onClick={() => onFlowDirectionChange?.('right')}
                            title="Flow Right"
                            aria-pressed={flowDirection === 'right'}
                        >
                            <Icon name="arrowRight" size={14} />
                        </button>
                        <button
                            type="button"
                            className={`canvas-chrome-header__icon-btn ${flowDirection === 'down' ? 'is-active' : ''}`}
                            onClick={() => onFlowDirectionChange?.('down')}
                            title="Flow Down"
                            aria-pressed={flowDirection === 'down'}
                        >
                            <Icon name="arrowDown" size={14} />
                        </button>
                    </div>
                </div>
            </div>

            <div className="canvas-chrome-header__right">
                <div className="canvas-chrome-header__display">
                    <button
                        ref={displayTriggerRef}
                        type="button"
                        className="canvas-chrome-header__icon-btn canvas-chrome-header__icon-btn--dropdown"
                        onClick={() => setDisplayOpen((prev) => !prev)}
                        aria-expanded={displayOpen}
                        aria-haspopup="menu"
                        title="Display options"
                    >
                        <Icon name="grid" size={14} />
                        {activeDisplayCount > 0 && (
                            <span className="canvas-chrome-header__badge">{activeDisplayCount}</span>
                        )}
                        <Icon name="chevronDown" size={12} />
                    </button>
                </div>

                <div className="canvas-chrome-header__window">
                    <div className="canvas-chrome-header__button-group">
                        <button
                            type="button"
                            className={`canvas-chrome-header__icon-btn ${windowMode === 'docked' ? 'is-active' : ''}`}
                            onClick={() => onWindowModeChange?.('docked')}
                            title="Docked"
                            aria-pressed={windowMode === 'docked'}
                        >
                            <Icon name="dock" size={14} />
                        </button>
                        <button
                            type="button"
                            className={`canvas-chrome-header__icon-btn ${windowMode === 'floating' ? 'is-active' : ''}`}
                            onClick={() => onWindowModeChange?.('floating')}
                            title="Floating"
                            aria-pressed={windowMode === 'floating'}
                        >
                            <Icon name="windowRestore" size={14} />
                        </button>
                        <button
                            type="button"
                            className={`canvas-chrome-header__icon-btn ${windowMode === 'full' ? 'is-active' : ''}`}
                            onClick={() => onWindowModeChange?.('full')}
                            title="Full"
                            aria-pressed={windowMode === 'full'}
                        >
                            <Icon name="maximize" size={14} />
                        </button>
                    </div>
                    <button
                        type="button"
                        className={`canvas-chrome-header__icon-btn ${isFullscreen ? 'is-active' : ''}`}
                        onClick={() => onToggleFullscreen?.(!isFullscreen)}
                        title={isFullscreen ? 'Exit Fullscreen' : 'Enter Fullscreen'}
                        aria-pressed={isFullscreen}
                    >
                        <Icon name={isFullscreen ? 'fullscreenExit' : 'fullscreen'} size={14} />
                    </button>
                </div>
            </div>

            {/* Workspace dropdown */}
            <DropdownList
                open={workspaceOpen}
                onClose={handleCloseWorkspace}
                triggerRef={workspaceTriggerRef}
                items={filteredWorkspaces}
                header={(
                    <>
                        <div className="canvas-chrome-header__dropdown-search">
                            <Icon name="search" size={12} />
                            <input
                                type="text"
                                placeholder="Search workspaces..."
                                value={workspaceQuery}
                                onChange={(e) => setWorkspaceQuery(e.target.value)}
                                autoFocus
                            />
                        </div>
                        <div className="canvas-chrome-header__dropdown-controls">
                            <div className="canvas-chrome-header__filter-row">
                                {['all', 'project', 'breakout', 'personal'].map((filter) => (
                                    <button
                                        key={filter}
                                        type="button"
                                        className={`canvas-chrome-header__filter-chip ${workspaceFilter === filter ? 'is-active' : ''}`}
                                        onClick={() => setWorkspaceFilter(filter)}
                                    >
                                        {filter}
                                    </button>
                                ))}
                            </div>
                            {workspaceTags.length > 0 && (
                                <div className="canvas-chrome-header__tag-row">
                                    {workspaceTags.map((tag) => (
                                        <button
                                            key={tag}
                                            type="button"
                                            className={`canvas-chrome-header__tag-chip ${workspaceTag === tag ? 'is-active' : ''}`}
                                            onClick={() => setWorkspaceTag(workspaceTag === tag ? null : tag)}
                                        >
                                            {tag}
                                        </button>
                                    ))}
                                </div>
                            )}
                            <label className="canvas-chrome-header__sort">
                                <span>Sort</span>
                                <select value={workspaceSort} onChange={(e) => setWorkspaceSort(e.target.value)}>
                                    <option value="name-asc">Name A–Z</option>
                                    <option value="name-desc">Name Z–A</option>
                                    <option value="recent">Recently updated</option>
                                </select>
                            </label>
                        </div>
                        <div className="canvas-chrome-header__dropdown-divider" />
                    </>
                )}
                renderItem={(item) => (
                    <button
                        key={item.id}
                        className={`canvas-chrome-header__dropdown-item ${workspaceId === item.id ? 'is-active' : ''}`}
                        onClick={() => {
                            onWorkspaceChange?.(item);
                            handleCloseWorkspace();
                        }}
                    >
                        <Icon name="grid" size={12} />
                        <span>{item.name}</span>
                    </button>
                )}
            />

            {/* ViewGroup dropdown */}
            <DropdownList
                open={viewGroupOpen}
                onClose={handleCloseViewGroups}
                triggerRef={viewGroupTriggerRef}
                items={filteredViewGroups}
                header={(
                    <>
                        <div className="canvas-chrome-header__dropdown-search">
                            <Icon name="search" size={12} />
                            <input
                                type="text"
                                placeholder="Search view groups..."
                                value={viewGroupQuery}
                                onChange={(e) => setViewGroupQuery(e.target.value)}
                                autoFocus
                            />
                        </div>
                        <div className="canvas-chrome-header__dropdown-controls">
                            <div className="canvas-chrome-header__filter-row">
                                {['all', 'linked', 'unlinked', 'tagged'].map((filter) => (
                                    <button
                                        key={filter}
                                        type="button"
                                        className={`canvas-chrome-header__filter-chip ${viewGroupFilter === filter ? 'is-active' : ''}`}
                                        onClick={() => setViewGroupFilter(filter)}
                                    >
                                        {filter}
                                    </button>
                                ))}
                            </div>
                            {viewGroupTags.length > 0 && (
                                <div className="canvas-chrome-header__tag-row">
                                    {viewGroupTags.map((tag) => (
                                        <button
                                            key={tag}
                                            type="button"
                                            className={`canvas-chrome-header__tag-chip ${viewGroupTag === tag ? 'is-active' : ''}`}
                                            onClick={() => setViewGroupTag(viewGroupTag === tag ? null : tag)}
                                        >
                                            {tag}
                                        </button>
                                    ))}
                                </div>
                            )}
                            <label className="canvas-chrome-header__sort">
                                <span>Sort</span>
                                <select value={viewGroupSort} onChange={(e) => setViewGroupSort(e.target.value)}>
                                    <option value="name-asc">Name A–Z</option>
                                    <option value="name-desc">Name Z–A</option>
                                    <option value="views-desc">Views high→low</option>
                                    <option value="views-asc">Views low→high</option>
                                    <option value="linked-first">Linked first</option>
                                </select>
                            </label>
                        </div>
                        <button
                            type="button"
                            className={`canvas-chrome-header__dropdown-item ${!viewGroupId ? 'is-active' : ''}`}
                            onClick={() => {
                                onViewGroupChange?.(null);
                                handleCloseViewGroups();
                            }}
                        >
                            <Icon name="grid3x3" size={12} />
                            <span className="canvas-chrome-header__dropdown-text">All ViewGroups</span>
                        </button>
                        <div className="canvas-chrome-header__dropdown-divider" />
                    </>
                )}
                renderItem={(item) => (
                    <div
                        key={item.id}
                        role="menuitem"
                        tabIndex={0}
                        className={`canvas-chrome-header__dropdown-item canvas-chrome-header__dropdown-item--selectable ${viewGroupId === item.id ? 'is-active' : ''}`}
                        onClick={() => {
                            onViewGroupChange?.(item);
                            handleCloseViewGroups();
                        }}
                        onKeyDown={(event) => {
                            if (event.key === 'Enter' || event.key === ' ') {
                                event.preventDefault();
                                onViewGroupChange?.(item);
                                handleCloseViewGroups();
                            }
                        }}
                    >
                        <span
                            className="canvas-chrome-header__dot"
                            style={{ background: item.color || 'var(--color-accent-purple)' }}
                        />
                        <div className="canvas-chrome-header__dropdown-main">
                            <span className="canvas-chrome-header__dropdown-text">{item.name}</span>
                            <div className="canvas-chrome-header__dropdown-meta">
                                {typeof item.views?.length === 'number' && (
                                    <span className="canvas-chrome-header__dropdown-count">
                                        {item.views.length} views
                                    </span>
                                )}
                                {Array.isArray(item.tags) && item.tags.length > 0 && (
                                    <div className="canvas-chrome-header__dropdown-tags">
                                        {item.tags.slice(0, 2).map((tag) => (
                                            <span key={tag} className="canvas-chrome-header__dropdown-tag">{tag}</span>
                                        ))}
                                        {item.tags.length > 2 && (
                                            <span className="canvas-chrome-header__dropdown-tag">+{item.tags.length - 2}</span>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>
                        {item.linkedTo && (
                            <Icon name="link" size={12} className="canvas-chrome-header__link" />
                        )}
                        {onEditViewGroup && (
                            <button
                                type="button"
                                className="canvas-chrome-header__edit-btn"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onEditViewGroup?.(item);
                                    handleCloseViewGroups();
                                }}
                                title="Edit ViewGroup"
                            >
                                <Icon name="settings" size={12} />
                            </button>
                        )}
                    </div>
                )}
                footer={onOpenViewGroupManager ? (
                    <button
                        type="button"
                        className="canvas-chrome-header__dropdown-item canvas-chrome-header__dropdown-item--footer"
                        onClick={() => {
                            onOpenViewGroupManager?.();
                            handleCloseViewGroups();
                        }}
                    >
                        <Icon name="layout" size={12} />
                        <span className="canvas-chrome-header__dropdown-text">Manage ViewGroups</span>
                    </button>
                ) : null}
            />

            {/* Display options dropdown */}
            <DropdownList
                open={displayOpen}
                onClose={() => setDisplayOpen(false)}
                triggerRef={displayTriggerRef}
                items={[
                    { id: 'coordinates', label: 'Grid Coordinates', value: showCoordinates, onToggle: onToggleCoordinates },
                    { id: 'borders', label: 'ViewGroup Borders', value: showViewGroupBorders, onToggle: onToggleViewGroupBorders },
                ]}
                renderItem={(item) => (
                    <label key={item.id} className="canvas-chrome-header__dropdown-item canvas-chrome-header__dropdown-item--toggle">
                        <input
                            type="checkbox"
                            checked={item.value}
                            onChange={() => item.onToggle?.(!item.value)}
                        />
                        <span>{item.label}</span>
                    </label>
                )}
            />
        </header>
    );
});

export default CanvasChromeHeader;
