/**
 * @file GlobalFiltersBar.jsx
 * @description Global filters bar for the Files Tab.
 * Displays search, type filter chips, and sort dropdown that apply to all sections.
 *
 * @example
 * <GlobalFiltersBar
 *   filters={filters}
 *   onFiltersChange={setFilters}
 *   hasActiveFilters={hasActiveFilters}
 *   onClearFilters={clearFilters}
 * />
 */

import React, { memo, useState, useCallback } from 'react';
import { Icon } from '@UI/react/components/atoms';
import { ChipGroup } from '@UI/react/components/molecules/ChipGroup';
import { SortDropdown } from '@UI/react/components/molecules/SortDropdown';
import { useAdaptive } from '@UI/react/context';
import { FILE_TYPE_FILTER_OPTIONS, SORT_OPTIONS } from '@UI/react/constants/filesTabConfig.js';
import './GlobalFiltersBar.scss';

/**
 * @typedef {Object} GlobalFiltersBarProps
 * @property {Object} filters - Current filter state
 * @property {string} filters.searchQuery - Search query string
 * @property {string[]} filters.typeFilters - Active type filter IDs
 * @property {string} filters.sortBy - Current sort field
 * @property {(updates: Object) => void} onFiltersChange - Filter update handler
 * @property {boolean} hasActiveFilters - Whether any filters are active
 * @property {() => void} onClearFilters - Clear all filters handler
 * @property {string} [className] - Additional CSS classes
 */

/**
 * GlobalFiltersBar - Search, type filters, and sort for all sections
 *
 * @param {GlobalFiltersBarProps} props - Component props
 * @returns {React.ReactElement} The rendered component
 */
export const GlobalFiltersBar = memo(function GlobalFiltersBar({
    filters,
    onFiltersChange,
    hasActiveFilters,
    onClearFilters,
    className = '',
}) {
    const { isVR } = useAdaptive();
    const { searchQuery, typeFilters, sortBy } = filters;

    // Handle search input change
    const handleSearchChange = useCallback((e) => {
        onFiltersChange({ searchQuery: e.target.value });
    }, [onFiltersChange]);

    // Handle search clear
    const handleSearchClear = useCallback(() => {
        onFiltersChange({ searchQuery: '' });
    }, [onFiltersChange]);

    // Handle type filter toggle
    const handleTypeToggle = useCallback((typeId) => {
        const newFilters = typeFilters.includes(typeId)
            ? typeFilters.filter(t => t !== typeId)
            : [...typeFilters, typeId];
        onFiltersChange({ typeFilters: newFilters });
    }, [typeFilters, onFiltersChange]);

    // Handle sort change
    const handleSortChange = useCallback((newSortBy) => {
        onFiltersChange({ sortBy: newSortBy });
    }, [onFiltersChange]);

    // Build type filter chips with selection state
    const typeFilterChips = FILE_TYPE_FILTER_OPTIONS.map(opt => ({
        ...opt,
        selected: typeFilters.includes(opt.id),
    }));

    const classList = [
        'global-filters-bar',
        isVR && 'global-filters-bar--vr',
        className,
    ].filter(Boolean).join(' ');

    return (
        <div className={classList}>
            {/* Search Row */}
            <div className="global-filters-bar__search">
                <Icon name="search" size={12} className="global-filters-bar__search-icon" />
                <input
                    type="text"
                    placeholder="Search all files..."
                    value={searchQuery}
                    onChange={handleSearchChange}
                    className="global-filters-bar__search-input"
                />
                {searchQuery && (
                    <button
                        type="button"
                        onClick={handleSearchClear}
                        className="global-filters-bar__search-clear"
                        aria-label="Clear search"
                    >
                        <Icon name="x" size={12} />
                    </button>
                )}
            </div>

            {/* Filter Row */}
            <div className="global-filters-bar__filters">
                <div className="global-filters-bar__type-filters">
                    <ChipGroup
                        chips={typeFilterChips}
                        activeChips={typeFilters}
                        onToggle={handleTypeToggle}
                        size="sm"
                    />

                    {/* Clear filters button */}
                    {hasActiveFilters && (
                        <button
                            type="button"
                            onClick={onClearFilters}
                            className="global-filters-bar__clear-btn"
                        >
                            <Icon name="x" size={10} />
                            <span>Clear</span>
                        </button>
                    )}
                </div>

                {/* Sort Dropdown */}
                <SortDropdown
                    value={sortBy}
                    onChange={handleSortChange}
                    options={SORT_OPTIONS}
                />
            </div>

            {/* Active filters indicator */}
            {hasActiveFilters && (
                <div className="global-filters-bar__indicator">
                    <div className="global-filters-bar__indicator-badge">
                        <Icon name="filter" size={8} />
                        <span>Filters active</span>
                    </div>
                </div>
            )}
        </div>
    );
});

export default GlobalFiltersBar;
