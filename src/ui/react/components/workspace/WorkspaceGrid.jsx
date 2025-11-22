// src/ui/react/components/workspace/WorkspaceGrid.jsx
import React, { useState, useEffect, useRef, useCallback } from "react";
import { Plus } from "lucide-react";

import { viewConfigurationManager, datasetManager } from "@Init/appInitializer.js";
import { InstanceViewport } from "@UI/react/components/workspace/InstanceViewport.jsx";

import './WorkspaceGrid.scss';

export function WorkspaceGrid() {
    const [instances, setInstances] = useState([]);
    const gridRef = useRef(null);

    // Listen for dataset click events
    useEffect(() => {
        const handleInstanceRequest = async (event) => {
            const datasetId = event.detail?.datasetId;

            if (!datasetId || typeof datasetId !== 'string') {
                console.error('❌ Invalid dataset ID:', datasetId);
                return;
            }

            try {
                console.log('📬 Creating instance for dataset:', datasetId);

                const dataset = datasetManager.getDataset(datasetId);
                if (!dataset) {
                    console.error('❌ Dataset not found:', datasetId);
                    return;
                }

                // Create view configuration
                const viewConfig = viewConfigurationManager.createView(datasetId, {
                    name: `View of ${dataset.filename}`,
                });

                console.log(`📋 Created view ${viewConfig.id} for dataset ${datasetId}`);

                // Add instance with the view (type will be determined when data loads)
                setInstances((prev) => [...prev, {
                    key: `local-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                    viewConfigId: viewConfig.id,
                    // ✅ NO TYPE - instance will infer it from dataset
                    isRemote: false,
                }]);

            } catch (error) {
                console.error('❌ Failed to create instance:', error);
            }
        };

        window.addEventListener('cia:request-instance', handleInstanceRequest);
        return () => window.removeEventListener('cia:request-instance', handleInstanceRequest);
    }, []);

    // Create empty instance button handler
    const handleCreateEmptyInstance = useCallback(() => {
        if (instances.length >= 9) {
            console.log('⚠️ Grid full - max 9 instances');
            return;
        }

        console.log('➕ Creating empty instance (no type, no view)');

        setInstances((prev) => [...prev, {
            key: `local-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            viewConfigId: null,  // No view = empty instance
            // ✅ NO TYPE - truly generic empty instance
            isRemote: false,
        }]);
    }, [instances.length]);

    // Delete instance handler
    const handleDeleteInstance = useCallback((instanceKey) => {
        console.log(`🗑️ Deleting instance: ${instanceKey}`);
        setInstances((prev) => prev.filter((instance) => instance.key !== instanceKey));
    }, []);

    // Calculate grid layout style
    const getGridStyle = () => {
        const count = instances.length;
        if (count === 0) return {};
        if (count === 1) return { gridTemplateColumns: '1fr', gridTemplateRows: '1fr' };
        if (count === 2) return { gridTemplateColumns: '1fr 1fr', gridTemplateRows: '1fr' };
        if (count <= 4) return { gridTemplateColumns: '1fr 1fr', gridTemplateRows: '1fr 1fr' };
        if (count <= 6) return { gridTemplateColumns: '1fr 1fr 1fr', gridTemplateRows: '1fr 1fr' };
        return { gridTemplateColumns: '1fr 1fr 1fr', gridTemplateRows: '1fr 1fr 1fr' };
    };

    return (
        <div className="workspace-grid">
            {/* Header with Add Instance button */}
            <div className="workspace-grid__header">
                <div className="workspace-grid__title">
                    <span>Workspace</span>
                    <span className="workspace-grid__count">({instances.length})</span>
                </div>
                <button
                    className="workspace-grid__add-button"
                    onClick={handleCreateEmptyInstance}
                    disabled={instances.length >= 9}
                    title="Add empty instance"
                >
                    <Plus size={18} />
                    Add Instance
                </button>
            </div>

            {/* Empty state or grid */}
            {instances.length === 0 ? (
                <div className="workspace-grid__empty-state">
                    <div className="workspace-grid__empty-icon">🎨</div>
                    <div className="workspace-grid__empty-title">
                        No visualization windows open
                    </div>
                    <div className="workspace-grid__empty-description">
                        Click a dataset from the Files panel to create a window with that data,
                        or click "Add Instance" above to create an empty window.
                    </div>
                    <button
                        className="workspace-grid__empty-button"
                        onClick={handleCreateEmptyInstance}
                    >
                        <Plus size={18} />
                        Create Instance
                    </button>
                </div>
            ) : (
                <div ref={gridRef} className="workspace-grid__grid" style={getGridStyle()}>
                    {instances.map((instance) => (
                        <InstanceViewport
                            key={instance.key}
                            viewConfigId={instance.viewConfigId}
                            // ✅ NO TYPE PROP - instance determines its own type!
                            isRemote={instance.isRemote}
                            remoteInstanceId={instance.remoteId}
                            ownerUserName={instance.userName}
                            onDelete={() => handleDeleteInstance(instance.key)}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}