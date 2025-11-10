// src/ui/react/components/workspace/InstanceViewport.jsx

import React, { useRef, useEffect, useState } from "react";

import { workspaceManager } from "@Core/instances/workspaceManager.js";
import { datasetManager } from "@Core/datasets/datasetManager.js";

export function InstanceViewport({ instanceId, instanceName, datasetId, onDelete, onDuplicate }) {
    const containerRef = useRef(null);
    const [initialized, setInitialized] = useState(false);
    const [hasData, setHasData] = useState(false);
    const initOnce = useRef(false);

    // Initialize the VTK scene once
    useEffect(() => {
        if (containerRef.current && !initOnce.current) {
            initOnce.current = true;

            console.log(`🎨 Initializing instance viewport: ${instanceId}`);

            try {
                workspaceManager.createInstance(containerRef.current, {
                    instanceId: instanceId
                });

                setInitialized(true);
                console.log(`✅ Instance viewport initialized: ${instanceId}`);

            } catch (error) {
                console.error(`❌ Failed to initialize instance viewport:`, error);
            }
        }

        return () => {
            // Cleanup handled by WorkspaceGrid when instance is deleted
        };
    }, [instanceId]);

    // ✨ NEW: Load dataset when it changes and scene is ready
    useEffect(() => {
        // Wait until both the scene is initialized and we have a dataset
        if (!initialized || !datasetId) {
            return;
        }

        console.log(`📊 Loading dataset ${datasetId} into instance ${instanceId}`);

        // Get the dataset from datasetManager
        const dataset = datasetManager.getDatasetSync(datasetId);

        if (!dataset) {
            console.warn(`⚠️  Dataset ${datasetId} not found in manager`);
            return;
        }

        if (!dataset.polydata) {
            console.warn(`⚠️  Dataset ${datasetId} has no polydata yet - waiting...`);
            // You might want to add a polling mechanism here or use datasetManager.onChange
            return;
        }

        try {
            // Use the workspaceManager's method to load the dataset
            console.log(`🎨 Loading ${dataset.polydata.getPoints().getNumberOfPoints()} points into instance`);

            // ✅ CORRECT: Use workspaceManager's method
            workspaceManager.loadDatasetIntoInstance(instanceId, datasetId, dataset.polydata);
            setHasData(true);

            console.log(`✅ Dataset loaded into instance ${instanceId}`);

        } catch (error) {
            console.error(`❌ Failed to load dataset into instance:`, error);
        }

    }, [initialized, datasetId, instanceId]);

    return (
        <div style={{
            display: "flex",
            flexDirection: "column",
            backgroundColor: "#0f0f0f",
            border: "1px solid #2a2a2a",
            borderRadius: "6px",
            overflow: "hidden"
        }}>
            {/* Instance Header */}
            <div style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "10px 14px",
                backgroundColor: "#1a1a1a",
                borderBottom: "1px solid #2a2a2a"
            }}>
                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                    {/* Status indicator: gray = initializing, yellow = ready, green = has data */}
                    <span style={{
                        width: "8px",
                        height: "8px",
                        background: !initialized ? "#666" : (hasData ? "#0f0" : "#ff0"),
                        borderRadius: "50%"
                    }} />
                    <span style={{ color: "#fff", fontSize: "13px", fontWeight: 600 }}>
                        {instanceName}
                    </span>
                </div>

                <div style={{ display: "flex", gap: "6px" }}>
                    <button
                        onClick={onDuplicate}
                        style={{
                            padding: "6px 12px",
                            backgroundColor: "#2a2a2a",
                            border: "1px solid #3a3a3a",
                            borderRadius: "4px",
                            color: "#ccc",
                            fontSize: "12px",
                            cursor: "pointer"
                        }}
                    >
                        Duplicate
                    </button>
                    <button
                        onClick={onDelete}
                        style={{
                            padding: "6px 12px",
                            backgroundColor: "#3a1a1a",
                            border: "1px solid #4a2a2a",
                            borderRadius: "4px",
                            color: "#f88",
                            fontSize: "12px",
                            cursor: "pointer"
                        }}
                    >
                        Close
                    </button>
                </div>
            </div>

            {/* VTK Container */}
            <div
                ref={containerRef}
                style={{
                    flex: 1,
                    position: "relative",
                    backgroundColor: "#0a0a0a"
                }}
            >
                {!initialized && (
                    <div style={{
                        position: "absolute",
                        top: "50%",
                        left: "50%",
                        transform: "translate(-50%, -50%)",
                        color: "#666",
                        fontSize: "12px"
                    }}>
                        Initializing VTK...
                    </div>
                )}
                {initialized && !hasData && (
                    <div style={{
                        position: "absolute",
                        top: "50%",
                        left: "50%",
                        transform: "translate(-50%, -50%)",
                        color: "#888",
                        fontSize: "12px"
                    }}>
                        {datasetId ? "Loading dataset..." : "No dataset selected"}
                    </div>
                )}
            </div>
        </div>
    );
}