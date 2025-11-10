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

    // Load dataset when it changes and scene is ready
    useEffect(() => {
        if (!initialized || !datasetId) {
            return;
        }

        console.log(`📊 Loading dataset ${datasetId} into instance ${instanceId}`);

        const dataset = datasetManager.getDatasetSync(datasetId);

        if (!dataset) {
            console.warn(`⚠️  Dataset ${datasetId} not found in manager`);
            return;
        }

        if (!dataset.polydata) {
            console.warn(`⚠️  Dataset ${datasetId} has no polydata yet - waiting...`);
            return;
        }

        try {
            console.log(`🎨 Loading ${dataset.polydata.getPoints().getNumberOfPoints()} points into instance`);

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
            height: "100%",
            border: "1px solid #333",
            borderRadius: "8px",
            overflow: "hidden",
            backgroundColor: "#1a1a1a"
        }}>
            {/* Header Bar */}
            <div style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                padding: "8px 12px",
                backgroundColor: "#2a2a2a",
                borderBottom: "1px solid #333"
            }}>
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <div style={{
                        width: "8px",
                        height: "8px",
                        backgroundColor: !initialized ? "#666" : (hasData ? "#0f0" : "#ff0"),
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

            {/* FIXED: Wrapper container for React-managed overlays */}
            <div style={{
                flex: 1,
                position: "relative",
                backgroundColor: "#0a0a0a"
            }}>
                {/* VTK Container - NO CHILDREN ALLOWED */}
                {/* This div is exclusively for VTK - React never puts children here */}
                <div
                    ref={containerRef}
                    style={{
                        width: "100%",
                        height: "100%",
                        position: "absolute",
                        top: 0,
                        left: 0
                    }}
                />

                {/* Loading overlays - siblings to VTK container, not children */}
                {/* These are positioned OVER the VTK container using absolute positioning */}
                {!initialized && (
                    <div style={{
                        position: "absolute",
                        top: "50%",
                        left: "50%",
                        transform: "translate(-50%, -50%)",
                        color: "#666",
                        fontSize: "12px",
                        pointerEvents: "none",
                        zIndex: 1
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
                        fontSize: "12px",
                        pointerEvents: "none",
                        zIndex: 1
                    }}>
                        {datasetId ? "Loading dataset..." : "No dataset selected"}
                    </div>
                )}
            </div>
        </div>
    );
}