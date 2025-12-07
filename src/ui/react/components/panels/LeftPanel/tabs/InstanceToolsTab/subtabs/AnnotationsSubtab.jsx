// AnnotationsSubtab.jsx
// Instance-specific annotations subtab for InstanceToolsTab
//
// FIXED: Uses real annotations from useAnnotations hook
// FIXED: "Open Full Annotations Panel" button is in a proper footer

import React, { useState, useCallback, useMemo } from 'react';
import {
    MapPin,
    ArrowUpRight,
    Eye,
    EyeOff,
    MoreHorizontal,
    Box,
    Ruler,
    CornerUpRight,
    Plus,
    Loader,
    TextCursor,
} from 'lucide-react';
import { useAnnotations } from '@UI/react/hooks/useAnnotations.js';

// =============================================================================
// ANNOTATION TYPE CONFIG
// =============================================================================

const ANNOTATION_TYPES = {
    point: { icon: MapPin, label: 'Point', color: 'blue' },
    region: { icon: Box, label: 'Region', color: 'green' },
    measurement: { icon: Ruler, label: 'Measure', color: 'amber' },
    angle: { icon: CornerUpRight, label: 'Angle', color: 'purple' },
    text: { icon: TextCursor, label: 'Text', color: 'pink' },
};

// =============================================================================
// ANNOTATION LIST ITEM
// =============================================================================

function AnnotationListItem({ annotation, onToggleVisibility }) {
    const typeConfig = ANNOTATION_TYPES[annotation.type] || ANNOTATION_TYPES.point;
    const Icon = typeConfig.icon;
    const isVisible = annotation.visible !== false;

    return (
        <div className="annotation-list-item">
            <Icon size={14} className={`annotation-list-item__icon icon-${typeConfig.color}`} />
            <div className="annotation-list-item__content">
                <span className="annotation-list-item__text">
                    {annotation.label || annotation.text || `${typeConfig.label} annotation`}
                </span>
                <span className="annotation-list-item__meta">
                    {typeConfig.label} &middot; {annotation.createdBy || 'Unknown'}
                </span>
            </div>
            <button
                className="annotation-list-item__visibility"
                onClick={() => onToggleVisibility?.(annotation)}
                title={isVisible ? 'Hide' : 'Show'}
            >
                {isVisible ? <Eye size={12} /> : <EyeOff size={12} />}
            </button>
            <button className="annotation-list-item__more" title="More options">
                <MoreHorizontal size={12} />
            </button>
        </div>
    );
}

// =============================================================================
// MAIN COMPONENT
// =============================================================================

export function AnnotationsSubtab({ activeInstance, onOpenFullPanel }) {
    // Get the dataset ID from the active instance
    const datasetId = activeInstance?.instanceData?.dataset?.id || null;

    // Fetch real annotations for this dataset
    const {
        annotations,
        isLoading,
        error,
        updateAnnotation,
    } = useAnnotations({ datasetId });

    // Toggle annotation visibility
    const handleToggleVisibility = useCallback((annotation) => {
        updateAnnotation({
            id: annotation.id,
            targetDatasetId: annotation.datasetId,
            updates: { visible: annotation.visible === false }
        });
    }, [updateAnnotation]);

    // Handle opening the full panel
    const handleOpenFullPanel = useCallback(() => {
        // Dispatch event to open the annotations tab in main panel
        window.dispatchEvent(new CustomEvent('cia:open-panel', {
            detail: { panel: 'annotations' }
        }));
        onOpenFullPanel?.();
    }, [onOpenFullPanel]);

    return (
        <div className="annotations-subtab">
            <div className="annotations-subtab__info">
                Annotations on this instance only. For all annotations, use the global Annotations panel.
            </div>

            {/* Loading state */}
            {isLoading && (
                <div className="annotations-subtab__loading">
                    <Loader size={16} className="spin" />
                    <span>Loading...</span>
                </div>
            )}

            {/* Error state */}
            {error && (
                <div className="annotations-subtab__error">
                    <span>Failed to load annotations</span>
                </div>
            )}

            {/* Content */}
            {!isLoading && !error && (
                <>
                    {annotations.length === 0 ? (
                        <div className="annotations-subtab__empty">
                            <MapPin size={24} />
                            <p>No annotations on this instance</p>
                            <span>Use the annotation tool to add markers</span>
                        </div>
                    ) : (
                        <div className="annotations-subtab__list">
                            {annotations.map(ann => (
                                <AnnotationListItem
                                    key={ann.id}
                                    annotation={ann}
                                    onToggleVisibility={handleToggleVisibility}
                                />
                            ))}
                        </div>
                    )}
                </>
            )}

            {/* Footer - fixed to bottom of subtab */}
            <div className="annotations-subtab__footer">
                <button
                    className="annotations-subtab__footer-btn annotations-subtab__footer-btn--add"
                    title="Add annotation"
                >
                    <Plus size={11} />
                    <span>New</span>
                </button>
                <button
                    className="annotations-subtab__footer-btn annotations-subtab__footer-btn--open"
                    onClick={handleOpenFullPanel}
                >
                    <ArrowUpRight size={11} />
                    <span>Open Panel</span>
                </button>
            </div>
        </div>
    );
}

export default AnnotationsSubtab;