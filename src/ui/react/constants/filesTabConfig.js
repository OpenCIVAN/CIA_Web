/**
 * @file filesTabConfig.js
 * @description Configuration constants for the Files Tab redesign.
 * Includes view scope definitions, file type configs, and state colors.
 */

// =============================================================================
// VIEW SCOPE CONFIGURATION
// =============================================================================

/**
 * View scope levels - from ephemeral (session-only) to project-wide
 */
export const SCOPE_CONFIG = {
    ephemeral: {
        id: 'ephemeral',
        label: 'Unsaved',
        color: '#6b7280', // gray
        icon: 'circleDashed',
        description: 'Working view (session only)',
        canPromoteTo: ['personal'],
        canDemoteTo: [],
    },
    personal: {
        id: 'personal',
        label: 'Personal',
        color: '#a855f7', // purple
        icon: 'user',
        description: 'Saved to your account',
        canPromoteTo: ['shared', 'workspace'],
        canDemoteTo: [],
    },
    shared: {
        id: 'shared',
        label: 'Shared',
        color: '#3b82f6', // blue
        icon: 'users',
        description: 'Shared with specific people',
        canPromoteTo: ['workspace'],
        canDemoteTo: ['personal'],
    },
    workspace: {
        id: 'workspace',
        label: 'Workspace',
        color: '#34d399', // green
        icon: 'layoutGrid',
        description: 'Available to workspace members',
        canPromoteTo: ['project'],
        canDemoteTo: ['personal'],
    },
    project: {
        id: 'project',
        label: 'Project',
        color: '#fbbf24', // amber
        icon: 'folderOpen',
        description: 'Project-level template',
        canPromoteTo: [],
        canDemoteTo: ['workspace'],
    },
};

/**
 * Get scope config by id
 * @param {string} scopeId - Scope identifier
 * @returns {Object|null} Scope configuration or null
 */
export function getScopeConfig(scopeId) {
    return SCOPE_CONFIG[scopeId] || null;
}

// =============================================================================
// FILE TYPE CONFIGURATION
// =============================================================================

/**
 * File type definitions with extensions, icons, and colors
 */
export const FILE_TYPES = {
    nifti: {
        id: 'nifti',
        extensions: ['.nii', '.nii.gz'],
        icon: 'box',
        color: '#2dd4bf', // teal
        label: 'NIfTI',
        canLoad: true,
        category: 'dataset',
    },
    dicom: {
        id: 'dicom',
        extensions: ['.dcm', '.dicom'],
        icon: 'box',
        color: '#2dd4bf', // teal
        label: 'DICOM',
        canLoad: true,
        category: 'dataset',
    },
    vtp: {
        id: 'vtp',
        extensions: ['.vtp'],
        icon: 'box',
        color: '#2dd4bf', // teal
        label: 'VTP',
        canLoad: true,
        category: 'dataset',
    },
    vti: {
        id: 'vti',
        extensions: ['.vti'],
        icon: 'box',
        color: '#2dd4bf', // teal
        label: 'VTI',
        canLoad: true,
        category: 'dataset',
    },
    csv: {
        id: 'csv',
        extensions: ['.csv'],
        icon: 'table',
        color: '#34d399', // green
        label: 'CSV',
        canLoad: true,
        category: 'tabular',
    },
    document: {
        id: 'document',
        extensions: ['.md', '.pdf', '.txt', '.doc', '.docx'],
        icon: 'fileText',
        color: '#3b82f6', // blue
        label: 'Document',
        canLoad: false,
        category: 'document',
    },
    image: {
        id: 'image',
        extensions: ['.png', '.jpg', '.jpeg', '.gif', '.webp'],
        icon: 'fileImage',
        color: '#a855f7', // purple
        label: 'Image',
        canLoad: false,
        category: 'image',
    },
};

/**
 * Filter chip options for file type filtering
 */
export const FILE_TYPE_FILTER_OPTIONS = [
    { id: 'nifti', label: 'NIfTI', color: '#2dd4bf', icon: 'box' },
    { id: 'dicom', label: 'DICOM', color: '#2dd4bf', icon: 'box' },
    { id: 'vtp', label: 'VTP', color: '#2dd4bf', icon: 'box' },
    { id: 'csv', label: 'CSV', color: '#34d399', icon: 'table' },
    { id: 'document', label: 'Docs', color: '#3b82f6', icon: 'fileText' },
    { id: 'image', label: 'Images', color: '#a855f7', icon: 'fileImage' },
];

/**
 * Get file type config by extension
 * @param {string} extension - File extension (with or without dot)
 * @returns {Object|null} File type config or null
 */
export function getFileTypeByExtension(extension) {
    const ext = extension.startsWith('.') ? extension.toLowerCase() : `.${extension.toLowerCase()}`;

    for (const [, config] of Object.entries(FILE_TYPES)) {
        if (config.extensions.includes(ext)) {
            return config;
        }
    }
    return null;
}

// =============================================================================
// STATE COLORS
// =============================================================================

/**
 * File/dataset state colors
 */
export const STATE_COLORS = {
    stored: 'transparent',
    loading: '#3b82f6', // blue
    loaded: '#34d399', // green
    processing: '#fbbf24', // amber
    error: '#ef4444', // red
};

/**
 * Accent colors used throughout the Files Tab
 */
export const ACCENT_COLORS = {
    amber: '#fbbf24',   // Starred
    blue: '#3b82f6',    // Files/folders
    teal: '#2dd4bf',    // Datasets
    cyan: '#22d3ee',    // Help
    purple: '#a855f7',  // Images/personal
    green: '#34d399',   // Loaded/success
    red: '#ef4444',     // Error
    pink: '#f472b6',    // Alternative accent
};

// =============================================================================
// SORT OPTIONS
// =============================================================================

/**
 * Available sort options for file lists
 */
export const SORT_OPTIONS = [
    { id: 'name', label: 'Name', icon: 'arrowDown' },
    { id: 'date', label: 'Date Modified', icon: 'calendar' },
    { id: 'size', label: 'Size', icon: 'arrowUp' },
    { id: 'type', label: 'Type', icon: 'fileText' },
];

// =============================================================================
// RESPONSIVE THRESHOLDS
// =============================================================================

/**
 * Height threshold for compact mode
 */
export const COMPACT_HEIGHT_THRESHOLD = 300;

/**
 * Width threshold for showing labels
 */
export const LABEL_WIDTH_THRESHOLD = 280;

export default {
    SCOPE_CONFIG,
    FILE_TYPES,
    FILE_TYPE_FILTER_OPTIONS,
    STATE_COLORS,
    ACCENT_COLORS,
    SORT_OPTIONS,
    COMPACT_HEIGHT_THRESHOLD,
    LABEL_WIDTH_THRESHOLD,
};
