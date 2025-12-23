// ViewModeSelector.jsx
// Toggle between list and tree view modes

import React from 'react';
import { IconFolderTree } from '@UI/react/components/common/Icon';
import ListOutlined from '@mui/icons-material/ListOutlined';

/**
 * ViewModeSelector - Toggle between view modes for the datasets panel
 *
 * @param {string} mode - Current mode: 'list' | 'tree'
 * @param {Function} onModeChange - Callback when mode changes
 */
export function ViewModeSelector({ mode, onModeChange }) {
    return (
        <div className="view-mode-selector">
            <button
                className={`view-mode-selector__btn ${mode === 'list' ? 'view-mode-selector__btn--active' : ''}`}
                onClick={() => onModeChange('list')}
                title="List view"
            >
                <ListOutlined sx={{ fontSize: 12 }} />
            </button>
            <button
                className={`view-mode-selector__btn ${mode === 'tree' ? 'view-mode-selector__btn--active' : ''}`}
                onClick={() => onModeChange('tree')}
                title="Tree view"
            >
                <IconFolderTree size={12} />
            </button>
        </div>
    );
}

export default ViewModeSelector;