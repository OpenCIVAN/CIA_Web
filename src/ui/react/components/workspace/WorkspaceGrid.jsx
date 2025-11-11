// src/ui/react/components/workspace/WorkspaceGrid.jsx
// FIXED VERSION - Connects to instanceStore for collaborative instance management

import React, { useState, useEffect, useRef } from "react";
import { Plus } from "lucide-react";

import { workspaceManager } from "@Core/instances/workspaceManager.js";
import { useInstanceStore } from "@UI/react/store/instanceStore.js";
import { InstanceViewport } from "@UI/react/components/workspace/InstanceViewport.jsx";
import { useCurrentDataset } from "@UI/react/hooks/useCurrentDataset.js";
import { getUserId } from "@Collaboration/presence/userManagement.js";

export function WorkspaceGrid() {
    // CRITICAL: Subscribe to instanceStore instead of local state
    // This allows us to see both our own instances AND remote instances from Y.js
    const instances = useInstanceStore((state) => state.getAllInstances());
    const createInstance = useInstanceStore((state) => state.createInstance);
    const removeInstance = useInstanceStore((state) => state.removeInstance);

    const [layout, setLayout] = useState("1x1");
    const gridRef = useRef(null);
    const initialized = useRef(false);

    // Watch for dataset changes to auto-create instance
    const { datasetId } = useCurrentDataset();

    // Initialize workspace manager once
    useEffect(() => {
        if (!initialized.current) {
            initialized.current = true;
            console.log("🎨 WorkspaceGrid mounted");
            workspaceManager.initialize();
        }
    }, []);

    // Auto-create first instance when a dataset is selected
    // ONLY if there are no instances yet AND no instances are being created
    useEffect(() => {
        if (datasetId && instances.length === 0) {
            console.log(`🎨 Auto-creating instance for dataset: ${datasetId}`);
            handleCreateNewInstance(datasetId);
        }
    }, [datasetId]); // Only depend on datasetId

    /**
     * Create a new instance and add it to the store
     * This will automatically sync to other users via Y.js
     */
    const handleCreateNewInstance = (datasetIdForInstance = null) => {
        const instanceId = `instance-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        const currentUserId = getUserId();

        console.log(`✅ Creating new instance: ${instanceId}`);
        if (datasetIdForInstance) {
            console.log(`   Linked to dataset: ${datasetIdForInstance}`);
        }

        // Add to the store (this will sync via Y.js automatically)
        createInstance({
            id: instanceId,
            datasetId: datasetIdForInstance || null,
            userId: currentUserId,
            userName: getUserId(), // You may want to get the actual username here
            type: 'desktop',
            visibility: 'shared', // 'shared' means visible to all users
        });

        console.log(`✅ Instance added to store: ${instanceId}`);
    };

    /**
     * Delete an instance
     * This will sync the deletion to other users
     */
    const handleDeleteInstance = (instanceId) => {
        console.log(`🗑️ Deleting instance: ${instanceId}`);

        // Delete from workspace manager (VTK cleanup)
        workspaceManager.deleteInstance(instanceId);

        // Delete from store (this will sync via Y.js)
        removeInstance(instanceId);
    };

    /**
     * Duplicate an instance
     */
    const handleDuplicateInstance = (instanceId) => {
        console.log(`📋 Duplicating instance: ${instanceId}`);
        const original = instances.find(i => i.id === instanceId);

        if (original) {
            handleCreateNewInstance(original.datasetId);
        }
    };

    /**
     * Calculate grid layout based on instance count
     */
    const getGridStyle = () => {
        const count = instances.length;
        let cols = 1;
        let rows = 1;

        if (count === 2) {
            cols = 2;
            rows = 1;
        } else if (count === 3 || count === 4) {
            cols = 2;
            rows = 2;
        } else if (count > 4) {
            // For more than 4, use a responsive grid
            cols = Math.ceil(Math.sqrt(count));
            rows = Math.ceil(count / cols);
        }

        return {
            display: "grid",
            gridTemplateColumns: `repeat(${cols}, 1fr)`,
            gridTemplateRows: `repeat(${rows}, 1fr)`,
            gap: "16px",
            flex: 1,
            padding: "16px",
            backgroundColor: "#0a0a0a"
        };
    };

    // Filter to only show my instances OR shared instances from others
    // Private instances from other users should not be displayed
    const currentUserId = getUserId();
    const visibleInstances = instances.filter(instance => {
        // Show my own instances (private or shared)
        if (instance.userId === currentUserId) return true;

        // Show shared instances from others
        if (instance.visibility === 'shared') return true;

        // Hide private instances from others
        return false;
    });

    return (
        <div style={{
            display: "flex",
            flexDirection: "column",
            height: "100%",
            backgroundColor: "#0f0f0f"
        }}>
            {/* Toolbar */}
            <div style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "12px 16px",
                backgroundColor: "#1a1a1a",
                borderBottom: "1px solid #2a2a2a"
            }}>
                <span style={{ color: "#fff", fontSize: "14px", fontWeight: 600 }}>
                    Workspace ({visibleInstances.length} instances)
                    {instances.length !== visibleInstances.length && (
                        <span style={{ color: "#666", fontSize: "12px", marginLeft: "8px" }}>
                            ({instances.length - visibleInstances.length} hidden)
                        </span>
                    )}
                </span>
                <button
                    onClick={() => handleCreateNewInstance(datasetId)}
                    disabled={instances.length >= 8} // Increased limit to 8
                    style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "6px",
                        padding: "8px 14px",
                        backgroundColor: instances.length >= 8 ? "#2a2a2a" : "#3a5a3a",
                        border: "none",
                        borderRadius: "4px",
                        color: instances.length >= 8 ? "#666" : "#fff",
                        cursor: instances.length >= 8 ? "not-allowed" : "pointer",
                        fontSize: "13px",
                        fontWeight: 600,
                        transition: "all 0.2s"
                    }}
                >
                    <Plus size={16} />
                    Add Instance
                </button>
            </div>

            {/* Instance Grid or Empty State */}
            {visibleInstances.length === 0 ? (
                <div style={{
                    flex: 1,
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    backgroundColor: "#0a0a0a",
                    color: "#666",
                    gap: "16px",
                    padding: "40px"
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
                        lineHeight: 1.5
                    }}>
                        Load a dataset from the Files panel to automatically create a window,
                        or click "Add Instance" to create one manually.
                    </div>
                    <button
                        onClick={() => handleCreateNewInstance(datasetId)}
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
                            transition: "all 0.2s"
                        }}
                    >
                        <Plus size={18} />
                        Create First Instance
                    </button>
                </div>
            ) : (
                <div ref={gridRef} style={getGridStyle()}>
                    {visibleInstances.map(instance => (
                        <InstanceViewport
                            key={instance.id}
                            instanceId={instance.id}
                            instanceName={`View ${instance.id.split('-')[1]}`}
                            datasetId={instance.datasetId}
                            isRemote={instance.userId !== currentUserId}
                            ownerName={instance.userName || 'Unknown'}
                            onDelete={() => handleDeleteInstance(instance.id)}
                            onDuplicate={() => handleDuplicateInstance(instance.id)}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}