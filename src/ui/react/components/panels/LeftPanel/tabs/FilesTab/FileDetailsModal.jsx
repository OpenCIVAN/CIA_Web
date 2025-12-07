// FileDetailsModal.jsx
// Modal dialog showing detailed file information

import React from 'react';
import { X, FileText, Calendar, HardDrive, Tag, Eye, Download, Trash2 } from 'lucide-react';
import * as LucideIcons from 'lucide-react';
import { getFileTypeDisplayInfo } from '@Core/instances/types/instanceTypesInit.js';

/**
 * FileDetailsModal - Shows detailed information about a file
 */
export function FileDetailsModal({ file, onClose, onOpen, onDownload, onDelete }) {
    if (!file) return null;

    const displayInfo = getFileTypeDisplayInfo(file.fileType);
    let Icon = LucideIcons.FileText;

    if (displayInfo) {
        const iconName = displayInfo.icon.charAt(0).toUpperCase() + displayInfo.icon.slice(1);
        Icon = LucideIcons[iconName] || LucideIcons.FileText;
    }

    const formatFileSize = (bytes) => {
        if (!bytes) return 'Unknown';
        const units = ['B', 'KB', 'MB', 'GB'];
        let i = 0;
        while (bytes >= 1024 && i < units.length - 1) {
            bytes /= 1024;
            i++;
        }
        return `${bytes.toFixed(i > 0 ? 1 : 0)} ${units[i]}`;
    };

    const formatDate = (dateString) => {
        if (!dateString) return 'Unknown';
        return new Date(dateString).toLocaleString();
    };

    return (
        <div className="file-details-modal-backdrop" onClick={onClose}>
            <div className="file-details-modal" onClick={(e) => e.stopPropagation()}>
                {/* Header */}
                <div className="file-details-modal__header">
                    <div
                        className="file-details-modal__icon"
                        style={displayInfo?.color ? { color: displayInfo.color } : undefined}
                    >
                        <Icon size={24} />
                    </div>
                    <div className="file-details-modal__title-area">
                        <h3 className="file-details-modal__title">
                            {file.name || file.filename}
                        </h3>
                        <span className="file-details-modal__type">
                            {displayInfo?.label || file.fileType || 'Unknown type'}
                        </span>
                    </div>
                    <button className="file-details-modal__close" onClick={onClose}>
                        <X size={16} />
                    </button>
                </div>

                {/* Details */}
                <div className="file-details-modal__content">
                    <div className="file-details-modal__row">
                        <HardDrive size={14} />
                        <span className="file-details-modal__label">Size</span>
                        <span className="file-details-modal__value">{formatFileSize(file.size)}</span>
                    </div>

                    <div className="file-details-modal__row">
                        <Calendar size={14} />
                        <span className="file-details-modal__label">Modified</span>
                        <span className="file-details-modal__value">{formatDate(file.modifiedAt || file.uploadedAt)}</span>
                    </div>

                    <div className="file-details-modal__row">
                        <Tag size={14} />
                        <span className="file-details-modal__label">Type</span>
                        <span className="file-details-modal__value">{file.fileType || 'Unknown'}</span>
                    </div>

                    {file.path && (
                        <div className="file-details-modal__row">
                            <FileText size={14} />
                            <span className="file-details-modal__label">Path</span>
                            <span className="file-details-modal__value file-details-modal__value--path">
                                {file.path}
                            </span>
                        </div>
                    )}
                </div>

                {/* Actions */}
                <div className="file-details-modal__actions">
                    <button
                        className="file-details-modal__action-btn file-details-modal__action-btn--primary"
                        onClick={() => onOpen?.(file)}
                    >
                        <Eye size={14} />
                        Open
                    </button>
                    <button
                        className="file-details-modal__action-btn"
                        onClick={() => onDownload?.(file)}
                    >
                        <Download size={14} />
                        Download
                    </button>
                    <button
                        className="file-details-modal__action-btn file-details-modal__action-btn--danger"
                        onClick={() => onDelete?.(file)}
                    >
                        <Trash2 size={14} />
                        Delete
                    </button>
                </div>
            </div>
        </div>
    );
}

export default FileDetailsModal;