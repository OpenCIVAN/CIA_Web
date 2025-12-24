/**
 * @file DatasetParent.jsx
 * @description Parent/folder node for a dataset in the tree view
 * 
 * CLEAN MIGRATION: Uses <Icon name={...} /> directly with semantic names
 */

import React, { useState, useCallback } from 'react';
import { Icon } from '@UI/react/components/common/Icon';
import { getFileTypeDisplayInfo } from '@Core/instances/types/instanceTypesInit.js';
import { DatasetSettingsModal } from '@UI/react/components/modals/DatasetSettingsModal';

/**
 * Get display configuration - returns STRING icon names (not components!)
 */
function getDatasetTypeConfig(fileType) {
    const displayInfo = getFileTypeDisplayInfo(fileType);

    if (displayInfo) {
        return {
            icon: displayInfo.icon,  // Already semantic!
            color: displayInfo.color,
        };
    }

    return { icon: 'database', color: null };
}

/**
 * DatasetParent - Tree node representing a loaded dataset
 */
export function DatasetParent({
    dataset,
    isExpanded,
    onToggle,
    children,
    viewCount = 0,
    views = [],
    onCreateView,
    onUnloadDataset,
}) {
    const [isHovered, setIsHovered] = useState(false);
    const [showSettingsModal, setShowSettingsModal] = useState(false);
    const typeConfig = getDatasetTypeConfig(dataset.fileType);

    const handleContextMenu = useCallback((e) => {
        e.preventDefault();
        // TODO: Open context menu for dataset actions
    }, []);

    return (
        <div className="dataset-parent">
            <div
                className={`dataset-parent__header ${isExpanded ? 'dataset-parent__header--expanded' : ''}`}
                onClick={onToggle}
                onContextMenu={handleContextMenu}
                onMouseEnter={() => setIsHovered(true)}
                onMouseLeave={() => setIsHovered(false)}
            >
                <span className="dataset-parent__chevron">
                    <Icon name={isExpanded ? "chevronDown" : "chevronRight"} size={10} />
                </span>

                <span
                    className="dataset-parent__icon"
                    style={typeConfig.color ? { color: typeConfig.color } : undefined}
                >
                    <Icon name={typeConfig.icon} size={14} />
                </span>

                <span className="dataset-parent__name">
                    {dataset.filename || dataset.name || 'Untitled'}
                </span>

                <span className="dataset-parent__count">
                    {viewCount}
                </span>

                {isHovered && (
                    <>
                        <button
                            className="dataset-parent__settings-btn"
                            onClick={(e) => {
                                e.stopPropagation();
                                setShowSettingsModal(true);
                            }}
                            title="Dataset settings"
                        >
                            <Icon name="settings" size={12} />
                        </button>
                        <button
                            className="dataset-parent__more-btn"
                            onClick={(e) => { e.stopPropagation(); handleContextMenu(e); }}
                        >
                            <Icon name="moreHorizontal" size={12} />
                        </button>
                    </>
                )}
            </div>

            {isExpanded && children && (
                <div className="dataset-parent__children">
                    {children}
                </div>
            )}

            {/* Settings Modal */}
            <DatasetSettingsModal
                isOpen={showSettingsModal}
                dataset={dataset}
                views={views}
                onClose={() => setShowSettingsModal(false)}
                onCreateView={onCreateView}
                onUnloadDataset={onUnloadDataset}
            />
        </div>
    );
}

export default DatasetParent;