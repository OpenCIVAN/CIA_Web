/**
 * @file ServerRenderOverlay.jsx
 * @description Fullscreen overlay for server-rendered VTK visualization.
 *
 * Listens for 'cia:open-server-render' custom events dispatched when a user
 * selects a dataset from the server datasets section of the Load Data modal.
 * Shows ServerRenderedViewport in a fullscreen overlay with ESC to dismiss.
 *
 * Mount this once near the top of the app component tree:
 *   <ServerRenderOverlay />
 */

import React, { useState, useEffect, useCallback } from 'react';
import { ServerRenderedViewport } from './ServerRenderedViewport.jsx';
import './ServerRenderOverlay.scss';

export function ServerRenderOverlay() {
    const [activeDataset, setActiveDataset] = useState(null);

    // Listen for cia:open-server-render events from DatasetSelectorModal
    useEffect(() => {
        function handleOpen(e) {
            const { datasetId, path, fileType, name } = e.detail ?? {};
            if (datasetId) {
                console.log('[ServerRenderOverlay] opening dataset:', { datasetId, path, fileType });
                setActiveDataset({ datasetId, path, fileType, name });
            }
        }

        window.addEventListener('cia:open-server-render', handleOpen);
        return () => window.removeEventListener('cia:open-server-render', handleOpen);
    }, []);

    // ESC key closes overlay
    useEffect(() => {
        if (!activeDataset) return;

        function handleKey(e) {
            if (e.key === 'Escape') setActiveDataset(null);
        }

        window.addEventListener('keydown', handleKey);
        return () => window.removeEventListener('keydown', handleKey);
    }, [activeDataset]);

    const handleClose = useCallback(() => setActiveDataset(null), []);

    if (!activeDataset) return null;

    return (
        <div className="server-render-overlay" role="dialog" aria-label="Server Rendered View">
            <div className="server-render-overlay__title">
                <span>{activeDataset.name || activeDataset.datasetId}</span>
                <span className="server-render-overlay__hint">Drag to orbit · Scroll to zoom · Right-drag to pan · ESC to close</span>
            </div>
            <ServerRenderedViewport
                datasetId={activeDataset.datasetId}
                path={activeDataset.path}
                fileType={activeDataset.fileType}
                onClose={handleClose}
            />
        </div>
    );
}

export default ServerRenderOverlay;
