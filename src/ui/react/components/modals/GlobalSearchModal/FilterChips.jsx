/**
 * @file FilterChips.jsx
 * @description Filter chips component for filtering search results by type.
 * Provides a horizontally scrollable row of filter options.
 *
 * @example
 * <FilterChips
 *   activeFilter={activeFilter}
 *   onFilterChange={setActiveFilter}
 *   counts={filterCounts}
 * />
 */

import React, { memo, useCallback, useRef, useEffect } from 'react';
import {
    Search,
    Folder,
    Database,
    Eye,
    Users,
    MessageSquare
} from 'lucide-react';

/**
 * @typedef {Object} FilterConfig
 * @property {string} id - Filter identifier
 * @property {string} label - Display label
 * @property {React.ComponentType} icon - Filter icon component
 */

/**
 * @typedef {Object} FilterChipsProps
 * @property {string} activeFilter - Currently active filter ID
 * @property {(filter: string) => void} onFilterChange - Filter change handler
 * @property {Object<string, number>} [counts={}] - Result counts per filter
 * @property {boolean} [showCounts=true] - Whether to show count badges
 * @property {string} [testId] - Data-testid for testing
 */

/**
 * Available search filters configuration
 */
const SEARCH_FILTERS = [
    { id: 'all', label: 'All', icon: Search },
    { id: 'projects', label: 'Projects', icon: Folder },
    { id: 'datasets', label: 'Datasets', icon: Database },
    { id: 'views', label: 'Views', icon: Eye },
    { id: 'people', label: 'People', icon: Users },
    { id: 'annotations', label: 'Annotations', icon: MessageSquare },
];

/**
 * Individual filter chip component.
 */
const FilterChip = memo(function FilterChip({
    filter,
    isActive,
    count,
    showCount,
    onClick,
    index
}) {
    const Icon = filter.icon;

    const handleClick = () => {
        onClick(filter.id);
    };

    const handleKeyDown = (event) => {
        if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            onClick(filter.id);
        }
    };

    const classNames = [
        'global-search__filter-chip',
        isActive && 'global-search__filter-chip--active'
    ].filter(Boolean).join(' ');

    return (
        <button
            type="button"
            role="tab"
            className={classNames}
            onClick={handleClick}
            onKeyDown={handleKeyDown}
            aria-selected={isActive}
            aria-controls="search-results"
            tabIndex={isActive ? 0 : -1}
            data-filter={filter.id}
        >
            <Icon size={14} />
            <span>{filter.label}</span>
            {showCount && count !== undefined && count > 0 && (
                <span className="global-search__filter-chip__count">{count}</span>
            )}
        </button>
    );
});

/**
 * Filter chips row with horizontal scroll.
 *
 * @param {FilterChipsProps} props - Component props
 * @returns {React.ReactElement} The rendered filter chips
 */
function FilterChips({
    activeFilter,
    onFilterChange,
    counts = {},
    showCounts = true,
    testId
}) {
    const containerRef = useRef(null);

    /**
     * Handle filter selection
     */
    const handleFilterClick = useCallback((filterId) => {
        onFilterChange(filterId);
    }, [onFilterChange]);

    /**
     * Handle keyboard navigation between chips
     */
    const handleKeyDown = useCallback((event) => {
        const { key } = event;
        const currentIndex = SEARCH_FILTERS.findIndex(f => f.id === activeFilter);

        if (key === 'ArrowRight' || key === 'ArrowDown') {
            event.preventDefault();
            const nextIndex = (currentIndex + 1) % SEARCH_FILTERS.length;
            onFilterChange(SEARCH_FILTERS[nextIndex].id);
        } else if (key === 'ArrowLeft' || key === 'ArrowUp') {
            event.preventDefault();
            const prevIndex = currentIndex <= 0 ? SEARCH_FILTERS.length - 1 : currentIndex - 1;
            onFilterChange(SEARCH_FILTERS[prevIndex].id);
        } else if (key === 'Home') {
            event.preventDefault();
            onFilterChange(SEARCH_FILTERS[0].id);
        } else if (key === 'End') {
            event.preventDefault();
            onFilterChange(SEARCH_FILTERS[SEARCH_FILTERS.length - 1].id);
        }
    }, [activeFilter, onFilterChange]);

    /**
     * Scroll active chip into view
     */
    useEffect(() => {
        if (containerRef.current) {
            const activeChip = containerRef.current.querySelector('[aria-selected="true"]');
            if (activeChip) {
                activeChip.scrollIntoView({
                    behavior: 'smooth',
                    block: 'nearest',
                    inline: 'center'
                });
            }
        }
    }, [activeFilter]);

    return (
        <div
            ref={containerRef}
            className="global-search__filters"
            role="tablist"
            aria-label="Filter results by type"
            onKeyDown={handleKeyDown}
            data-testid={testId}
        >
            {SEARCH_FILTERS.map((filter, index) => (
                <FilterChip
                    key={filter.id}
                    filter={filter}
                    isActive={activeFilter === filter.id}
                    count={counts[filter.id]}
                    showCount={showCounts && !!counts[filter.id]}
                    onClick={handleFilterClick}
                    index={index}
                />
            ))}
        </div>
    );
}

export default memo(FilterChips);
export { FilterChips, SEARCH_FILTERS };