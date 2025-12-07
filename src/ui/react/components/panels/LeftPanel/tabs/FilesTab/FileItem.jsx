// FileItem.jsx
// Individual file item component for the files tree/list

import React, { useState, useCallback } from 'react';
import { MoreHorizontal, Eye, Info } from 'lucide-react';
import * as LucideIcons from 'lucide-react';
import { getFileTypeDisplayInfo, getHandlerForFileType } from '@Core/instances/types/instanceTypesInit.js';

/**
 * Get display configuration for a file based on its type
 */
const getFileTypeConfig = (file) => {
    if (file.isFolder) {
        return { icon: LucideIcons.Folder, color: null };
    }

    const displayInfo = getFileTypeDisplayInfo(file.fileType);

    if (displayInfo) {
        const iconName = displayInfo.icon.charAt(0).toUpperCase() + displayInfo.icon.slice(1);
        const IconComponent = LucideIcons[iconName] || LucideIcons.Box;
        return { icon: IconComponent, color: displayInfo.color };
    }

    return { icon: LucideIcons.FileText, color: null };
};

/**
 * Check if file can be visualized
 */
const canVisualize = (fileType) => {
    if (!fileType) return false;
    return getHandlerForFileType(fileType) !== null;
};

/**
 * FileItem - Individual file in the tree/list view
 */
export function FileItem({
    file,
    isSelected = false,
    onSelect,
    onDoubleClick,
    onContextMenu,
    onShowDetails
}) {
    const [isHovered, setIsHovered] = useState(false);
    const typeConfig = getFileTypeConfig(file);
    const Icon = typeConfig.icon;
    const canViz = canVisualize(file.fileType);

    const handleClick = useCallback((e) => {
        e.stopPropagation();
        onSelect?.(file, e);
    }, [file, onSelect]);

    const handleDoubleClick = useCallback((e) => {
        e.stopPropagation();
        onDoubleClick?.(file, e);
    }, [file, onDoubleClick]);

    return (
        <div
            className={`file-item ${isSelected ? 'file-item--selected' : ''} ${canViz ? 'file-item--can-viz' : ''}`}
            onClick={handleClick}
            onDoubleClick={handleDoubleClick}
            onContextMenu={(e) => onContextMenu?.(file, e)}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
        >
            <span
                className="file-item__icon"
                style={typeConfig.color ? { color: typeConfig.color } : undefined}
            >
                <Icon size={14} />
            </span>

            <span className="file-item__name">
                {file.name || file.filename}
            </span>

            {file.size && (
                <span className="file-item__size">
                    {formatFileSize(file.size)}
                </span>
            )}

            {isHovered && (
                <div className="file-item__actions">
                    {canViz && (
                        <button
                            className="file-item__action-btn"
                            onClick={(e) => { e.stopPropagation(); onDoubleClick?.(file, e); }}
                            title="Open"
                        >
                            <Eye size={10} />
                        </button>
                    )}
                    <button
                        className="file-item__action-btn"
                        onClick={(e) => { e.stopPropagation(); onShowDetails?.(file); }}
                        title="Details"
                    >
                        <Info size={10} />
                    </button>
                    <button
                        className="file-item__action-btn"
                        onClick={(e) => { e.stopPropagation(); onContextMenu?.(file, e); }}
                        title="More"
                    >
                        <MoreHorizontal size={10} />
                    </button>
                </div>
            )}
        </div>
    );
}

function formatFileSize(bytes) {
    if (!bytes) return '';
    const units = ['B', 'KB', 'MB', 'GB'];
    let i = 0;
    while (bytes >= 1024 && i < units.length - 1) {
        bytes /= 1024;
        i++;
    }
    return `${bytes.toFixed(i > 0 ? 1 : 0)} ${units[i]}`;
}

export default FileItem;