// src/ui/react/components/layout/StatusBar.jsx
import React, { useEffect, useState } from "react";
import { workspaceManager } from "@Core/instances/workspaceManager.js";
import { datasetManager } from "@Core/datasets/datasetManager.js";

export function StatusBar({ phase, ready }) {
    const [instanceCount, setInstanceCount] = useState(0);
    const [datasetCount, setDatasetCount] = useState(0);
    const [syncStatus, setSyncStatus] = useState('idle');

    useEffect(() => {
        // Update counts periodically
        const updateStats = () => {
            setInstanceCount(workspaceManager.getInstanceCount());
            setDatasetCount(datasetManager.getAllDatasets().length);

            // Check sync status if available
            if (window.CIA?.syncManager) {
                const status = window.CIA.syncManager.getSyncStatus();
                setSyncStatus(status.pendingDatasets > 0 ? 'syncing' : 'synced');
            }
        };

        updateStats();
        const interval = setInterval(updateStats, 2000);

        return () => clearInterval(interval);
    }, []);

    return (
        <div className="status-bar">
            <div className="status-bar__left">
                <span className="status-item">
                    {ready ? '🟢 Ready' : '🟡 Loading'}
                </span>
                <span className="status-item">
                    Instances: {instanceCount}
                </span>
                <span className="status-item">
                    Datasets: {datasetCount}
                </span>
            </div>

            <div className="status-bar__center">
                {syncStatus === 'syncing' && (
                    <span className="sync-indicator syncing">
                        🔄 Syncing...
                    </span>
                )}
                {syncStatus === 'synced' && (
                    <span className="sync-indicator synced">
                        ✅ Synced
                    </span>
                )}
            </div>

            <div className="status-bar__right">
                <span className="status-item">
                    Phase: {phase}/3
                </span>
            </div>
        </div>
    );
}