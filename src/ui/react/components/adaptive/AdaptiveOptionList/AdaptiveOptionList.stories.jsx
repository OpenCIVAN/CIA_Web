// src/ui/react/components/adaptive/AdaptiveOptionList/AdaptiveOptionList.stories.jsx
import React, { useState } from "react";
import AdaptiveOptionList from "./AdaptiveOptionList";
import { ModeProvider, useMode } from "../ModeContext";

export default {
    title: "Adaptive/AdaptiveOptionList",
    component: AdaptiveOptionList,
    parameters: {
        layout: "centered",
    },
    argTypes: {
        multiple: { control: "boolean" },
        disabled: { control: "boolean" },
        onChange: { action: "changed" },
    },
    decorators: [
        (Story, context) => (
            <ModeProvider defaultMode={context.globals.mode || "desktop"}>
                <div style={{ padding: "40px", background: "#0a0a0f", minWidth: "280px" }}>
                    <Story />
                </div>
            </ModeProvider>
        ),
    ],
};

const sampleOptions = [
    { value: "grid", label: "Grid View", icon: "grid" },
    { value: "list", label: "List View", icon: "list" },
    { value: "columns", label: "Column View", icon: "columns" },
];

const cameraOptions = [
    { value: "cam1", label: "Front Camera", icon: "camera" },
    { value: "cam2", label: "Rear Camera", icon: "camera" },
    { value: "cam3", label: "Side Camera", icon: "camera" },
    { value: "cam4", label: "Top Camera", icon: "camera" },
];

const qualityOptions = [
    { value: "low", label: "Low (480p)" },
    { value: "medium", label: "Medium (720p)" },
    { value: "high", label: "High (1080p)" },
    { value: "ultra", label: "Ultra (4K)" },
];

// =============================================================================
// BASIC STORIES
// =============================================================================

export const Default = {
    args: {
        options: sampleOptions,
        value: "grid",
    },
};

export const WithIcons = {
    args: {
        options: sampleOptions,
        value: "list",
    },
};

export const WithoutIcons = {
    args: {
        options: qualityOptions,
        value: "high",
    },
};

export const Disabled = {
    args: {
        options: sampleOptions,
        value: "grid",
        disabled: true,
    },
};

// =============================================================================
// MULTI-SELECT
// =============================================================================

export const MultiSelect = {
    args: {
        options: cameraOptions,
        value: ["cam1", "cam3"],
        multiple: true,
    },
};

// =============================================================================
// INTERACTIVE
// =============================================================================

const InteractiveOptionList = ({ options, multiple = false, initialValue }) => {
    const [value, setValue] = useState(initialValue);
    return (
        <AdaptiveOptionList
            options={options}
            value={value}
            onChange={setValue}
            multiple={multiple}
        />
    );
};

export const InteractiveSingleSelect = {
    render: () => (
        <InteractiveOptionList
            options={sampleOptions}
            initialValue="grid"
        />
    ),
};

export const InteractiveMultiSelect = {
    render: () => (
        <InteractiveOptionList
            options={cameraOptions}
            initialValue={["cam1"]}
            multiple
        />
    ),
};

// =============================================================================
// MODE COMPARISON
// =============================================================================

const ModeDisplay = () => {
    const { mode, tokens } = useMode();
    return (
        <div style={{ color: "#888", fontSize: "12px", marginTop: "16px" }}>
            Mode: {mode} | Item Height: {tokens.buttonHeight}px | Font Size: {tokens.fontSize}px
        </div>
    );
};

export const DesktopMode = {
    decorators: [
        (Story) => (
            <ModeProvider defaultMode="desktop">
                <div style={{ padding: "40px", background: "#0a0a0f", minWidth: "280px" }}>
                    <Story />
                    <ModeDisplay />
                </div>
            </ModeProvider>
        ),
    ],
    render: () => (
        <InteractiveOptionList options={sampleOptions} initialValue="grid" />
    ),
};

export const VRMode = {
    decorators: [
        (Story) => (
            <ModeProvider defaultMode="vr">
                <div style={{ padding: "40px", background: "#0a0a0f", minWidth: "360px" }}>
                    <Story />
                    <ModeDisplay />
                </div>
            </ModeProvider>
        ),
    ],
    render: () => (
        <InteractiveOptionList options={sampleOptions} initialValue="grid" />
    ),
};

export const ModeComparison = {
    render: () => (
        <div style={{ display: "flex", gap: "48px" }}>
            <ModeProvider defaultMode="desktop">
                <div style={{ minWidth: "240px" }}>
                    <div style={{ color: "#888", marginBottom: "16px", fontSize: "14px" }}>Desktop Mode</div>
                    <InteractiveOptionList options={qualityOptions} initialValue="high" />
                    <ModeDisplay />
                </div>
            </ModeProvider>
            <ModeProvider defaultMode="vr">
                <div style={{ minWidth: "320px" }}>
                    <div style={{ color: "#888", marginBottom: "16px", fontSize: "14px" }}>VR Mode</div>
                    <InteractiveOptionList options={qualityOptions} initialValue="high" />
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

export const ViewModePicker = {
    render: () => {
        const viewOptions = [
            { value: "single", label: "Single View", icon: "maximize" },
            { value: "split", label: "Split View", icon: "columns" },
            { value: "quad", label: "Quad View", icon: "grid" },
        ];
        return <InteractiveOptionList options={viewOptions} initialValue="single" />;
    },
};

export const CameraSelector = {
    render: () => (
        <InteractiveOptionList
            options={cameraOptions}
            initialValue={["cam1", "cam2"]}
            multiple
        />
    ),
};

export const QualityPicker = {
    render: () => (
        <InteractiveOptionList
            options={qualityOptions}
            initialValue="high"
        />
    ),
};

export const DisabledOptions = {
    render: () => {
        const options = [
            { value: "free", label: "Free Plan" },
            { value: "pro", label: "Pro Plan" },
            { value: "enterprise", label: "Enterprise", disabled: true },
        ];
        return <InteractiveOptionList options={options} initialValue="free" />;
    },
};