// src/ui/react/components/adaptive/AdaptiveCameraGrid/AdaptiveCameraGrid.stories.jsx
import React, { useState } from "react";
import AdaptiveCameraGrid from "./AdaptiveCameraGrid";
import { ModeProvider, useMode } from "../ModeContext";

export default {
    title: "Adaptive/AdaptiveCameraGrid",
    component: AdaptiveCameraGrid,
    parameters: {
        layout: "centered",
    },
    argTypes: {
        columns: { control: { type: "range", min: 2, max: 6, step: 1 } },
        showLabels: { control: "boolean" },
        onSelect: { action: "selected" },
        onDoubleClick: { action: "double-clicked" },
    },
    decorators: [
        (Story, context) => (
            <ModeProvider defaultMode={context.globals.mode || "desktop"}>
                <div style={{ padding: "40px", background: "#0a0a0f" }}>
                    <Story />
                </div>
            </ModeProvider>
        ),
    ],
};

const sampleCameras = [
    { id: "cam1", name: "Front Camera" },
    { id: "cam2", name: "Rear Camera" },
    { id: "cam3", name: "Left Side", active: true },
    { id: "cam4", name: "Right Side" },
    { id: "cam5", name: "Top View", recording: true },
    { id: "cam6", name: "Bottom View" },
];

const largeCameraSet = [
    { id: "cam1", name: "Camera 1" },
    { id: "cam2", name: "Camera 2", active: true },
    { id: "cam3", name: "Camera 3" },
    { id: "cam4", name: "Camera 4", recording: true },
    { id: "cam5", name: "Camera 5" },
    { id: "cam6", name: "Camera 6" },
    { id: "cam7", name: "Camera 7" },
    { id: "cam8", name: "Camera 8", recording: true },
    { id: "cam9", name: "Camera 9" },
];

// =============================================================================
// BASIC STORIES
// =============================================================================

export const Default = {
    args: {
        cameras: sampleCameras,
        selectedIds: [],
        columns: 3,
    },
};

export const WithSelection = {
    args: {
        cameras: sampleCameras,
        selectedIds: ["cam1", "cam3"],
        columns: 3,
    },
};

export const WithoutLabels = {
    args: {
        cameras: sampleCameras,
        selectedIds: ["cam2"],
        columns: 3,
        showLabels: false,
    },
};

export const TwoColumns = {
    args: {
        cameras: sampleCameras.slice(0, 4),
        selectedIds: [],
        columns: 2,
    },
};

export const FourColumns = {
    args: {
        cameras: largeCameraSet,
        selectedIds: ["cam2"],
        columns: 4,
    },
};

// =============================================================================
// INTERACTIVE
// =============================================================================

const InteractiveCameraGrid = ({ cameras, columns = 3, showLabels = true }) => {
    const [selectedIds, setSelectedIds] = useState([]);

    const handleSelect = (camera, multiSelect) => {
        if (multiSelect) {
            setSelectedIds((prev) =>
                prev.includes(camera.id)
                    ? prev.filter((id) => id !== camera.id)
                    : [...prev, camera.id]
            );
        } else {
            setSelectedIds([camera.id]);
        }
    };

    const handleDoubleClick = (camera) => {
        console.log("Double clicked:", camera.name);
    };

    return (
        <div>
            <AdaptiveCameraGrid
                cameras={cameras}
                selectedIds={selectedIds}
                onSelect={handleSelect}
                onDoubleClick={handleDoubleClick}
                columns={columns}
                showLabels={showLabels}
            />
            <div style={{ marginTop: "16px", color: "#888", fontSize: "12px" }}>
                Selected: {selectedIds.length > 0 ? selectedIds.join(", ") : "None"}
                <br />
                <span style={{ fontSize: "11px", opacity: 0.7 }}>
                    Tip: Ctrl/Cmd + click for multi-select
                </span>
            </div>
        </div>
    );
};

export const Interactive = {
    render: () => <InteractiveCameraGrid cameras={sampleCameras} />,
};

export const InteractiveMultiSelect = {
    render: () => <InteractiveCameraGrid cameras={largeCameraSet} columns={3} />,
};

// =============================================================================
// MODE COMPARISON
// =============================================================================

const ModeDisplay = () => {
    const { mode, tokens } = useMode();
    return (
        <div style={{ color: "#888", fontSize: "12px", marginTop: "16px" }}>
            Mode: {mode} | Font Size: {tokens.fontSize}px | Gap: {tokens.gap}px
        </div>
    );
};

export const DesktopMode = {
    decorators: [
        (Story) => (
            <ModeProvider defaultMode="desktop">
                <div style={{ padding: "40px", background: "#0a0a0f" }}>
                    <Story />
                    <ModeDisplay />
                </div>
            </ModeProvider>
        ),
    ],
    render: () => <InteractiveCameraGrid cameras={sampleCameras} />,
};

export const VRMode = {
    decorators: [
        (Story) => (
            <ModeProvider defaultMode="vr">
                <div style={{ padding: "40px", background: "#0a0a0f" }}>
                    <Story />
                    <ModeDisplay />
                </div>
            </ModeProvider>
        ),
    ],
    render: () => <InteractiveCameraGrid cameras={sampleCameras} />,
};

export const ModeComparison = {
    render: () => (
        <div style={{ display: "flex", gap: "64px" }}>
            <ModeProvider defaultMode="desktop">
                <div>
                    <div style={{ color: "#888", marginBottom: "16px", fontSize: "14px" }}>Desktop Mode (80px thumbnails)</div>
                    <InteractiveCameraGrid cameras={sampleCameras.slice(0, 4)} columns={2} />
                    <ModeDisplay />
                </div>
            </ModeProvider>
            <ModeProvider defaultMode="vr">
                <div>
                    <div style={{ color: "#888", marginBottom: "16px", fontSize: "14px" }}>VR Mode (120px thumbnails)</div>
                    <InteractiveCameraGrid cameras={sampleCameras.slice(0, 4)} columns={2} />
                    <ModeDisplay />
                </div>
            </ModeProvider>
        </div>
    ),
    decorators: [
        (Story) => (
            <div style={{ padding: "40px", background: "#0a0a0f" }}>
                <Story />
            </div>
        ),
    ],
};

// =============================================================================
// USE CASE EXAMPLES
// =============================================================================

export const CameraStatusGrid = {
    render: () => {
        const cameras = [
            { id: "1", name: "Entrance", active: true },
            { id: "2", name: "Lobby", active: true, recording: true },
            { id: "3", name: "Hallway A" },
            { id: "4", name: "Hallway B", recording: true },
            { id: "5", name: "Storage", active: true },
            { id: "6", name: "Parking" },
        ];
        return <InteractiveCameraGrid cameras={cameras} />;
    },
};

export const RecordingCameras = {
    render: () => {
        const cameras = [
            { id: "1", name: "Studio A", recording: true },
            { id: "2", name: "Studio B", recording: true },
            { id: "3", name: "Control Room", recording: true },
            { id: "4", name: "Green Room" },
        ];
        return <InteractiveCameraGrid cameras={cameras} columns={2} />;
    },
};

export const MinimalGrid = {
    render: () => {
        const cameras = [
            { id: "1", name: "Cam 1" },
            { id: "2", name: "Cam 2" },
            { id: "3", name: "Cam 3" },
            { id: "4", name: "Cam 4" },
        ];
        return <InteractiveCameraGrid cameras={cameras} columns={4} showLabels={false} />;
    },
};

export const LargeCameraPanel = {
    render: () => <InteractiveCameraGrid cameras={largeCameraSet} columns={3} />,
};