// src/ui/react/components/adaptive/AdaptiveTabs/AdaptiveTabs.stories.jsx
import React, { useState } from "react";
import AdaptiveTabs from "./AdaptiveTabs";
import { ModeProvider, useMode } from "../ModeContext";

export default {
    title: "Adaptive/AdaptiveTabs",
    component: AdaptiveTabs,
    parameters: {
        layout: "centered",
    },
    argTypes: {
        variant: {
            control: "select",
            options: ["default", "pills", "underline"],
        },
        fullWidth: { control: "boolean" },
        onChange: { action: "changed" },
    },
    decorators: [
        (Story, context) => (
            <ModeProvider defaultMode={context.globals.mode || "desktop"}>
                <div style={{ padding: "40px", background: "#0a0a0f", minWidth: "400px" }}>
                    <Story />
                </div>
            </ModeProvider>
        ),
    ],
};

const basicTabs = [
    { id: "overview", label: "Overview" },
    { id: "settings", label: "Settings" },
    { id: "activity", label: "Activity" },
];

const iconTabs = [
    { id: "grid", label: "Grid", icon: "grid" },
    { id: "list", label: "List", icon: "list" },
    { id: "columns", label: "Columns", icon: "columns" },
];

const tabsWithCounts = [
    { id: "all", label: "All", count: 24 },
    { id: "active", label: "Active", count: 8 },
    { id: "archived", label: "Archived", count: 16 },
];

const iconOnlyTabs = [
    { id: "play", icon: "play" },
    { id: "pause", icon: "pause" },
    { id: "stop", icon: "stop" },
];

// =============================================================================
// BASIC STORIES
// =============================================================================

export const Default = {
    args: {
        tabs: basicTabs,
        activeTab: "overview",
    },
};

export const WithIcons = {
    args: {
        tabs: iconTabs,
        activeTab: "grid",
    },
};

export const WithCounts = {
    args: {
        tabs: tabsWithCounts,
        activeTab: "all",
    },
};

export const IconOnly = {
    args: {
        tabs: iconOnlyTabs,
        activeTab: "play",
    },
};

export const FullWidth = {
    args: {
        tabs: basicTabs,
        activeTab: "overview",
        fullWidth: true,
    },
};

// =============================================================================
// VARIANTS
// =============================================================================

export const Pills = {
    args: {
        tabs: basicTabs,
        activeTab: "overview",
        variant: "pills",
    },
};

export const Underline = {
    args: {
        tabs: basicTabs,
        activeTab: "overview",
        variant: "underline",
    },
};

export const AllVariants = {
    render: () => (
        <div style={{ display: "flex", flexDirection: "column", gap: "32px" }}>
            <div>
                <div style={{ color: "#888", marginBottom: "12px", fontSize: "12px" }}>Default</div>
                <AdaptiveTabs tabs={basicTabs} activeTab="overview" />
            </div>
            <div>
                <div style={{ color: "#888", marginBottom: "12px", fontSize: "12px" }}>Pills</div>
                <AdaptiveTabs tabs={basicTabs} activeTab="settings" variant="pills" />
            </div>
            <div>
                <div style={{ color: "#888", marginBottom: "12px", fontSize: "12px" }}>Underline</div>
                <AdaptiveTabs tabs={basicTabs} activeTab="activity" variant="underline" />
            </div>
        </div>
    ),
};

// =============================================================================
// INTERACTIVE
// =============================================================================

const InteractiveTabs = ({ tabs, variant, fullWidth }) => {
    const [activeTab, setActiveTab] = useState(tabs[0].id);
    return (
        <div>
            <AdaptiveTabs
                tabs={tabs}
                activeTab={activeTab}
                onChange={setActiveTab}
                variant={variant}
                fullWidth={fullWidth}
            />
            <div style={{ marginTop: "16px", padding: "16px", background: "rgba(255,255,255,0.05)", borderRadius: "8px", color: "#888" }}>
                Active tab: <strong style={{ color: "#fff" }}>{activeTab}</strong>
            </div>
        </div>
    );
};

export const Interactive = {
    render: () => <InteractiveTabs tabs={basicTabs} />,
};

export const InteractiveWithIcons = {
    render: () => <InteractiveTabs tabs={iconTabs} />,
};

export const InteractivePills = {
    render: () => <InteractiveTabs tabs={basicTabs} variant="pills" />,
};

// =============================================================================
// MODE COMPARISON
// =============================================================================

const ModeDisplay = () => {
    const { mode, tokens } = useMode();
    return (
        <div style={{ color: "#888", fontSize: "12px", marginTop: "16px" }}>
            Mode: {mode} | Tab Height: {tokens.buttonHeight}px | Font Size: {tokens.fontSize}px
        </div>
    );
};

export const DesktopMode = {
    decorators: [
        (Story) => (
            <ModeProvider defaultMode="desktop">
                <div style={{ padding: "40px", background: "#0a0a0f", minWidth: "400px" }}>
                    <Story />
                    <ModeDisplay />
                </div>
            </ModeProvider>
        ),
    ],
    render: () => <InteractiveTabs tabs={iconTabs} />,
};

export const VRMode = {
    decorators: [
        (Story) => (
            <ModeProvider defaultMode="vr">
                <div style={{ padding: "40px", background: "#0a0a0f", minWidth: "500px" }}>
                    <Story />
                    <ModeDisplay />
                </div>
            </ModeProvider>
        ),
    ],
    render: () => <InteractiveTabs tabs={iconTabs} />,
};

export const ModeComparison = {
    render: () => (
        <div style={{ display: "flex", gap: "48px" }}>
            <ModeProvider defaultMode="desktop">
                <div>
                    <div style={{ color: "#888", marginBottom: "16px", fontSize: "14px" }}>Desktop Mode</div>
                    <InteractiveTabs tabs={iconTabs} />
                    <ModeDisplay />
                </div>
            </ModeProvider>
            <ModeProvider defaultMode="vr">
                <div>
                    <div style={{ color: "#888", marginBottom: "16px", fontSize: "14px" }}>VR Mode</div>
                    <InteractiveTabs tabs={iconTabs} />
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

export const ViewModeTabs = {
    render: () => {
        const viewTabs = [
            { id: "single", label: "Single", icon: "maximize" },
            { id: "split", label: "Split", icon: "columns" },
            { id: "quad", label: "Quad", icon: "grid" },
        ];
        return <InteractiveTabs tabs={viewTabs} />;
    },
};

export const MediaControls = {
    render: () => {
        const mediaTabs = [
            { id: "skipBack", icon: "skipBack" },
            { id: "play", icon: "play" },
            { id: "pause", icon: "pause" },
            { id: "skipForward", icon: "skipForward" },
        ];
        return <InteractiveTabs tabs={mediaTabs} />;
    },
};

export const FilterTabs = {
    render: () => {
        const filterTabs = [
            { id: "all", label: "All Cameras", count: 12 },
            { id: "active", label: "Active", count: 4 },
            { id: "recording", label: "Recording", count: 2 },
            { id: "offline", label: "Offline", count: 6 },
        ];
        return <InteractiveTabs tabs={filterTabs} fullWidth />;
    },
};

export const DisabledTab = {
    render: () => {
        const tabs = [
            { id: "current", label: "Current" },
            { id: "history", label: "History" },
            { id: "analytics", label: "Analytics", disabled: true },
        ];
        return <InteractiveTabs tabs={tabs} />;
    },
};