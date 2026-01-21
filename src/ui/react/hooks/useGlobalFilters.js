/**
 * @file useGlobalFilters.js
 * @description Hook for managing global file filtering state in the Files Tab.
 * Provides search, type filtering, and sorting functionality.
 *
 * @example
 * const { filters, setFilters, applyFilters, hasActiveFilters } = useGlobalFilters();
 */

import { useState, useMemo, useCallback } from 'react';
import { getFileTypeByExtension } from '@UI/react/constants/filesTabConfig.js';

/**
 * @typedef {Object} FilterState
 * @property {string} searchQuery - Search query string
 * @property {string[]} typeFilters - Active file type filters
 * @property {string} sortBy - Sort field (name, date, size, type)
 * @property {'asc'|'desc'} sortOrder - Sort direction
 */

/**
 * @typedef {Object} UseGlobalFiltersReturn
 * @property {FilterState} filters - Current filter state
 * @property {(updates: Partial<FilterState>) => void} setFilters - Update filter state
 * @property {(items: Array) => Array} applyFilters - Apply filters to items
 * @property {boolean} hasActiveFilters - Whether any filters are active
 * @property {() => void} clearFilters - Clear all filters
 * @property {(query: string) => void} setSearchQuery - Set search query
 * @property {(type: string) => void} toggleTypeFilter - Toggle a type filter
 * @property {(sortBy: string) => void} setSortBy - Set sort field
 * @property {(order: 'asc'|'desc') => void} setSortOrder - Set sort order
 */

/**
 * Hook for managing global file filters
 *
 * @param {Object} options - Hook options
 * @param {FilterState} [options.initialFilters] - Initial filter state
 * @returns {UseGlobalFiltersReturn} Filter state and methods
 */
export function useGlobalFilters(options = {}) {
    const {
        initialFilters = {
            searchQuery: '',
            typeFilters: [],
            sortBy: 'name',
            sortOrder: 'asc',
        },
    } = options;

    const [filters, setFiltersState] = useState(initialFilters);

    /**
     * Update filters with partial state
     */
    const setFilters = useCallback((updates) => {
        setFiltersState(prev => ({ ...prev, ...updates }));
    }, []);

    /**
     * Set search query
     */
    const setSearchQuery = useCallback((searchQuery) => {
        setFiltersState(prev => ({ ...prev, searchQuery }));
    }, []);

    /**
     * Toggle a type filter
     */
    const toggleTypeFilter = useCallback((type) => {
        setFiltersState(prev => ({
            ...prev,
            typeFilters: prev.typeFilters.includes(type)
                ? prev.typeFilters.filter(t => t !== type)
                : [...prev.typeFilters, type],
        }));
    }, []);

    /**
     * Set sort field
     */
    const setSortBy = useCallback((sortBy) => {
        setFiltersState(prev => ({ ...prev, sortBy }));
    }, []);

    /**
     * Set sort order
     */
    const setSortOrder = useCallback((sortOrder) => {
        setFiltersState(prev => ({ ...prev, sortOrder }));
    }, []);

    /**
     * Clear all filters
     */
    const clearFilters = useCallback(() => {
        setFiltersState({
            searchQuery: '',
            typeFilters: [],
            sortBy: filters.sortBy, // Keep sort preference
            sortOrder: filters.sortOrder,
        });
    }, [filters.sortBy, filters.sortOrder]);

    /**
     * Check if any filters are active
     */
    const hasActiveFilters = useMemo(() => {
        return filters.searchQuery.trim().length > 0 || filters.typeFilters.length > 0;
    }, [filters.searchQuery, filters.typeFilters]);

    /**
     * Apply filters to an array of items
     */
    const applyFilters = useCallback((items) => {
        if (!items || items.length === 0) return [];

        let result = [...items];

        // Search filter
        if (filters.searchQuery.trim()) {
            const query = filters.searchQuery.toLowerCase();
            result = result.filter(item => {
                const name = item.name || item.filename || '';
                return name.toLowerCase().includes(query);
            });
        }

        // Type filter
        if (filters.typeFilters.length > 0) {
            result = result.filter(item => {
                const fileType = item.fileType || item.type;
                if (!fileType) return false;

                // Check if the file type matches any of the active filters
                const typeConfig = getFileTypeByExtension(`.${fileType}`);
                if (typeConfig) {
                    return filters.typeFilters.includes(typeConfig.id);
                }

                // Fallback to direct match
                return filters.typeFilters.includes(fileType);
            });
        }

        // Sort
        result.sort((a, b) => {
            let comparison = 0;

            switch (filters.sortBy) {
                case 'date':
                    const dateA = new Date(a.modifiedAt || a.uploadedAt || a.date || 0);
                    const dateB = new Date(b.modifiedAt || b.uploadedAt || b.date || 0);
                    comparison = dateB - dateA;
                    break;

                case 'size':
                    // Parse size strings like "45 MB" to numbers
                    const sizeA = parseFileSize(a.size);
                    const sizeB = parseFileSize(b.size);
                    comparison = sizeB - sizeA;
                    break;

                case 'type':
                    const typeA = a.fileType || a.type || '';
                    const typeB = b.fileType || b.type || '';
                    comparison = typeA.localeCompare(typeB);
                    break;

                case 'name':
                default:
                    const nameA = a.name || a.filename || '';
                    const nameB = b.name || b.filename || '';
                    comparison = nameA.localeCompare(nameB);
                    break;
            }

            return filters.sortOrder === 'desc' ? -comparison : comparison;
        });

        return result;
    }, [filters]);

    return {
        filters,
        setFilters,
        applyFilters,
        hasActiveFilters,
        clearFilters,
        setSearchQuery,
        toggleTypeFilter,
        setSortBy,
        setSortOrder,
    };
}

/**
 * Parse file size string to bytes
 * @param {string|number} size - Size string (e.g., "45 MB") or number
 * @returns {number} Size in bytes
 */
function parseFileSize(size) {
    if (typeof size === 'number') return size;
    if (!size || typeof size !== 'string') return 0;

    const match = size.match(/^([\d.]+)\s*(B|KB|MB|GB|TB)?$/i);
    if (!match) return 0;

    const value = parseFloat(match[1]);
    const unit = (match[2] || 'B').toUpperCase();

    const multipliers = {
        'B': 1,
        'KB': 1024,
        'MB': 1024 * 1024,
        'GB': 1024 * 1024 * 1024,
        'TB': 1024 * 1024 * 1024 * 1024,
    };

    return value * (multipliers[unit] || 1);
}

export default useGlobalFilters;
