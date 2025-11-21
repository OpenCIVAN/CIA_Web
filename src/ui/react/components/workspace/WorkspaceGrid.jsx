// src/ui/react/components/workspace/WorkspaceGrid.jsx
// Clean instance creation flow with proper ID handling

import React, { useState, useEffect, useRef, useCallback } from "react";
import { Plus, Users, X } from "lucide-react";

import { viewConfigurationManager, datasetManager } from "@Init/appInitializer.js";
import { InstanceViewport } from "@UI/react/components/workspace/InstanceViewport.jsx";

export function WorkspaceGrid() {
    // Track instances to render
    // New structure: { key, viewConfigId, type, isRemote, remoteId, userName }
    const [instances, setInstances] = useState([]);

    const gridRef = useRef(null);
    const initialized = useRef(false);

    /**
     * Listen for dataset selection from FilesPanel
     */
    useEffect(() => {
        const handleInstanceRequest = async (event) => {
            const datasetId = event.detail?.datasetId;

            if (!datasetId || typeof datasetId !== 'string') {
                console.error('❌ Invalid dataset ID:', datasetId);
                return;
            }

            try {
                console.log('📬 Creating instance for dataset:', datasetId);

                // Get dataset
                const dataset = datasetManager.getDataset(datasetId);
                if (!dataset) {
                    console.error('❌ Dataset not found:', datasetId);
                    return;
                }

                // Create ViewConfiguration
                const viewConfig = viewConfigurationManager.createView(datasetId, {
                    name: `View of ${dataset.filename}`,
                });

                console.log(`📋 Created view ${viewConfig.id} for dataset ${datasetId}`);

                // Create instance with viewConfigId
                setInstances((prev) => [...prev, {
                    key: `local-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                    viewConfigId: viewConfig.id,  // ✅ Use viewConfigId
                    type: 'vtk',
                    isRemote: false,
                }]);

            } catch (error) {
                console.error('❌ Failed to create instance:', error);
            }
        };

        window.addEventListener('cia:request-instance', handleInstanceRequest);
        return () => window.removeEventListener('cia:request-instance', handleInstanceRequest);
    }, []);

    // window.addEventListener('cia:request-instance', handleInstanceRequest);
    // return () => {
    //     window.removeEventListener('cia:request-instance', handleInstanceRequest);
    // };

    /**
     * Create empty instance
     */
    const handleCreateEmptyInstance = useCallback(() => {
        if (instances.length >= 9) {
            console.log('⚠️ Grid full - max 9 instances');
            return;
        }

        console.log('➕ Creating empty instance (no view yet)');

        setInstances((prev) => [...prev, {
            key: `local-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            viewConfigId: null,  // Empty instance - no view yet
            type: null,          // Type determined when content loads
            isRemote: false,
        }]);
    }, [instances.length]);

    /**
     * Dismiss notification
     */
    const handleDismissNotification = useCallback(() => {
        setPendingRemoteInstances([]);
        setShowNotification(false);
    }, []);

    /**
     * Delete instance
     */
    const handleDeleteInstance = useCallback((key) => {
        console.log(`🗑️ Removing instance from grid: ${key}`);
        setInstances((prev) => prev.filter((i) => i.key !== key));
    }, []);

    /**
     * Calculate grid layout
     */
    const getGridStyle = () => {
        const count = instances.length;

        if (count === 0) {
            return { display: "none" };
        }

        let cols = 1;
        let rows = 1;

        if (count === 1) {
            cols = 1; rows = 1;
        } else if (count === 2) {
            cols = 2; rows = 1;
        } else if (count <= 4) {
            cols = 2; rows = 2;
        } else if (count <= 6) {
            cols = 3; rows = 2;
        } else {
            cols = 3; rows = 3;
        }

        return {
            display: "grid",
            gridTemplateColumns: `repeat(${cols}, 1fr)`,
            gridTemplateRows: `repeat(${rows}, 1fr)`,
            gap: "12px",
            padding: "12px",
            height: "100%",
            overflow: "auto",
        };
    };

    return (
        <div style={{ display: "flex", flexDirection: "column", height: "100%", position: "relative" }}>
            {/* Toolbar */}
            <div style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "12px 16px",
                backgroundColor: "#1a1a1a",
                borderBottom: "1px solid #2a2a2a",
                flexShrink: 0,
            }}>
                <span style={{ color: "#fff", fontSize: "14px", fontWeight: 600 }}>
                    Workspace ({instances.length} instance{instances.length !== 1 ? "s" : ""})
                    {instances.filter((i) => i.isRemote).length > 0 && (
                        <span style={{ color: "#4CAF50", marginLeft: "8px", fontSize: "12px" }}>
                            ({instances.filter((i) => i.isRemote).length} remote)
                        </span>
                    )}
                    {pendingRemoteInstances.length > 0 && (
                        <span style={{
                            color: "#FFA726",
                            marginLeft: "8px",
                            fontSize: "12px",
                            animation: "pulse 2s infinite",
                        }}>
                            ({pendingRemoteInstances.length} pending)
                        </span>
                    )}
                </span>
                <button
                    onClick={handleCreateEmptyInstance}
                    disabled={instances.length >= 9}
                    style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "6px",
                        padding: "8px 14px",
                        backgroundColor: instances.length >= 9 ? "#2a2a2a" : "#3a5a3a",
                        border: "none",
                        borderRadius: "4px",
                        color: instances.length >= 9 ? "#666" : "#fff",
                        cursor: instances.length >= 9 ? "not-allowed" : "pointer",
                        fontSize: "13px",
                        fontWeight: 600,
                        transition: "all 0.2s",
                    }}
                >
                    <Plus size={16} />
                    Add Instance
                </button>
            </div>

            {/* Empty State or Grid */}
            {instances.length === 0 ? (
                <div style={{
                    flex: 1,
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    backgroundColor: "#0a0a0a",
                    color: "#666",
                    gap: "16px",
                    padding: "40px",
                }}>
                    <div style={{ fontSize: "48px", opacity: 0.3 }}>🎨</div>
                    <div style={{ fontSize: "16px", fontWeight: 600, color: "#888" }}>
                        No visualization windows open
                    </div>
                    <div style={{
                        fontSize: "13px",
                        color: "#666",
                        textAlign: "center",
                        maxWidth: "400px",
                        lineHeight: 1.5,
                    }}>
                        Click a dataset from the Files panel to create a window with that data,
                        or click "Add Instance" above to create an empty window.
                    </div>
                    <button
                        onClick={handleCreateEmptyInstance}
                        style={{
                            marginTop: "16px",
                            display: "flex",
                            alignItems: "center",
                            gap: "8px",
                            padding: "10px 20px",
                            backgroundColor: "#3a5a3a",
                            border: "none",
                            borderRadius: "6px",
                            color: "#fff",
                            cursor: "pointer",
                            fontSize: "14px",
                            fontWeight: 600,
                            transition: "all 0.2s",
                        }}
                    >
                        <Plus size={18} />
                        Create Instance
                    </button>
                </div>
            ) : (
                // Inside your WorkspaceGrid component, in the render section

                <div ref={gridRef} style={getGridStyle()}>
                    {instances.map((instance) => {
                        // Handle remote instances
                        if (instance.isRemote && instance.viewConfigId) {
                            const view = viewConfigurationManager.getView(instance.viewConfigId);
                            const dataset = view ? datasetManager.getDataset(view.datasetId) : null;
                        }

                        // Normal case - render with viewConfigId
                        return (
                            <InstanceViewport
                                key={instance.key}
                                viewConfigId={instance.viewConfigId}  // ✅ Pass view ID
                                type={instance.type}
                                isRemote={instance.isRemote}
                                remoteInstanceId={instance.remoteId}
                                ownerUserName={instance.userName}
                                onDelete={() => handleDeleteInstance(instance.key)}
                            />
                        );
                    })}
                </div>
            )}

            {/* Animations */}
            <style>{`
        @keyframes slideDown {
          from {
            opacity: 0;
            transform: translateX(-50%) translateY(-20px);
          }
          to {
            opacity: 1;
            transform: translateX(-50%) translateY(0);
          }
        }
        
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
      `}</style>
        </div>
    );
}