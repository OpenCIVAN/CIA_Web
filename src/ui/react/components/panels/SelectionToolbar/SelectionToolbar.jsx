// src/ui/react/components/panels/SelectionToolbar.jsx
// Floating toolbar shown during selection mode
//
// Provides quick actions for selection without needing the panel

import React from 'react';
import { Tooltip } from '@UI/react/components/atoms/Tooltip';
import { useSubsets } from '@UI/react/hooks/useCanvas.js';
import './SelectionToolbar.scss';

/**
 * SelectionToolbar - Floating toolbar for selection mode
 */
export function SelectionToolbar({ canvasId, onCreateClick }) {
    const {
        selectionMode,
        selectedIds,
        exitSelectionMode,
    } = useSubsets(canvasId);

    if (!selectionMode) {
        return null;
    }

    return (
        <div className="selection-toolbar">
            <div className="selection-toolbar__info">
                <span className="selection-toolbar__count">{selectedIds.length}</span>
                <span className="selection-toolbar__label">selected</span>
            </div>

            <div className="selection-toolbar__divider" />

            <div className="selection-toolbar__actions">
                <Tooltip content="Cancel selection" placement="top" delay={400}>
                    <button
                        className="selection-toolbar__btn selection-toolbar__btn--secondary"
                        onClick={() => exitSelectionMode(true)}
                        aria-label="Cancel selection"
                    >
                        Cancel
                    </button>
                </Tooltip>
                <Tooltip content="Create focus group from selection" placement="top" delay={400}>
                    <button
                        className="selection-toolbar__btn selection-toolbar__btn--primary"
                        onClick={onCreateClick}
                        disabled={selectedIds.length === 0}
                        aria-label="Create focus group from selection"
                    >
                        Create Group ({selectedIds.length})
                    </button>
                </Tooltip>
            </div>

            <div className="selection-toolbar__hint">
                Click views to select • Shift+click for range
            </div>
        </div>
    );
}

export default SelectionToolbar;
