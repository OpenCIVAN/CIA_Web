/**
 * @file SampleDatasetsSection.jsx
 * @description Collapsible section showing built-in VTP sample datasets.
 * Files come from public/vtp_files/ and are always available without upload.
 */

import React, { useState, useCallback } from 'react';
import { Icon } from '@UI/react/components/atoms/Icon';

/**
 * @typedef {Object} BuiltInDataset
 * @property {string} id
 * @property {string} name
 * @property {string} fileType
 * @property {string} description
 * @property {string} sizeHint
 */

/**
 * @param {{
 *   datasets: BuiltInDataset[],
 *   onLoad: (id: string, name: string) => void,
 *   loadingId: string|null,
 *   loadError: {datasetId: string, message: string}|null,
 *   unavailable?: boolean,
 * }} props
 */
export function SampleDatasetsSection({ datasets, onLoad, loadingId, loadError, unavailable }) {
    const [expanded, setExpanded] = useState(true);

    const toggle = useCallback(() => setExpanded((v) => !v), []);

    return (
        <div className="sample-datasets-section">
            {/* Section header */}
            <button
                className="sample-datasets-section__header"
                onClick={toggle}
                aria-expanded={expanded}
                title={expanded ? 'Collapse sample datasets' : 'Expand sample datasets'}
            >
                <Icon
                    name={expanded ? 'chevronDown' : 'chevronRight'}
                    size={12}
                    className="sample-datasets-section__chevron"
                />
                <Icon name="database" size={14} className="sample-datasets-section__icon icon--green" />
                <span className="sample-datasets-section__title">Sample Datasets</span>
                <span className="sample-datasets-section__badge">{datasets.length}</span>
            </button>

            {/* Expandable body */}
            {expanded && (
                <div className="sample-datasets-section__body">
                    {unavailable && (
                        <div className="sample-datasets-section__warning">
                            <Icon name="alertTriangle" size={12} />
                            <span>Sample datasets unavailable — check public/vtp_files/manifest.json</span>
                        </div>
                    )}

                    {!unavailable && datasets.length === 0 && (
                        <div className="sample-datasets-section__empty">
                            <Icon name="loader" size={14} className="spin" />
                            <span>Loading sample datasets…</span>
                        </div>
                    )}

                    {datasets.map((dataset) => {
                        const isLoading = loadingId === dataset.id;
                        const hasError = loadError?.datasetId === dataset.id;

                        return (
                            <div key={dataset.id} className="sample-dataset-row">
                                <div className="sample-dataset-row__info">
                                    <span className="sample-dataset-row__name">{dataset.name}</span>
                                    <span className="sample-dataset-row__meta">
                                        {dataset.fileType && (
                                            <span className="sample-dataset-row__badge">.{dataset.fileType}</span>
                                        )}
                                        {dataset.sizeHint && (
                                            <span className="sample-dataset-row__size">{dataset.sizeHint}</span>
                                        )}
                                    </span>
                                    {dataset.description && (
                                        <span className="sample-dataset-row__desc">{dataset.description}</span>
                                    )}
                                </div>

                                <button
                                    className={`sample-dataset-row__load-btn ${isLoading ? 'sample-dataset-row__load-btn--loading' : ''}`}
                                    onClick={() => onLoad(dataset.id, dataset.name)}
                                    disabled={isLoading}
                                    title={`Load ${dataset.name}`}
                                    aria-label={`Load ${dataset.name}`}
                                >
                                    {isLoading
                                        ? <Icon name="loader" size={12} className="spin" />
                                        : <Icon name="play" size={12} />
                                    }
                                    <span>{isLoading ? 'Loading…' : 'Load'}</span>
                                </button>

                                {hasError && (
                                    <div className="sample-dataset-row__error" title={loadError.message}>
                                        <Icon name="alertCircle" size={12} />
                                        <span>Failed to load</span>
                                    </div>
                                )}
                            </div>
                        );
                    })}

                    <div className="sample-datasets-section__hint">
                        Drag &amp; drop a <code>.vtp</code> file to load your own data
                    </div>
                </div>
            )}
        </div>
    );
}

export default SampleDatasetsSection;
