// src/ui/react/components/adaptive/AdaptiveSection/AdaptiveSection.stories.jsx
import React from "react";
import AdaptiveSection from "./AdaptiveSection";
import AdaptiveButton from "../AdaptiveButton/AdaptiveButton";
import AdaptiveToggle from "../AdaptiveToggle/AdaptiveToggle";
import AdaptiveSlider from "../AdaptiveSlider/AdaptiveSlider";
import { ModeProvider, useMode } from "../ModeContext";

export default {
    title: "Adaptive/AdaptiveSection",
    component: AdaptiveSection,
    parameters: {
        layout: "centered",
    },
    argTypes: {
        title: { control: "text" },
        icon: {
            control: "select",
            options: [null, "settings", "camera", "sliders", "layout", "layers"],
        },
        defaultExpanded: { control: "boolean" },
        collapsible: { control: "boolean" },
    },
    decorators: [
        (Story, context) => (
            <ModeProvider defaultMode={context.globals.mode || "desktop"}>
                <div style={{ padding: "40px", background: "#0a0a0f", minWidth: "320px" }}>
                    <Story />
                </div>
            </ModeProvider>
        ),
    ],
};

// =============================================================================
// BASIC STORIES
// =============================================================================

export const Default = {
    args: {
        title: "Section Title",
        children: (
            <div style={{ color: "#888" }}>
                Section content goes here. This is a basic section with some text content.
            </div>
        ),
    },
};

export const WithIcon = {
    args: {
        title: "Settings",
        icon: "settings",
        children: (
            <div style={{ color: "#888" }}>
                Settings content with an icon in the header.
            </div>
        ),
    },
};

export const Collapsed = {
    args: {
        title: "Collapsed Section",
        icon: "camera",
        defaultExpanded: false,
        children: (
            <div style={{ color: "#888" }}>
                This content is hidden by default.
            </div>
        ),
    },
};

export const NonCollapsible = {
    args: {
        title: "Always Visible",
        icon: "layout",
        collapsible: false,
        children: (
            <div style={{ color: "#888" }}>
                This section cannot be collapsed.
            </div>
        ),
    },
};

// =============================================================================
// WITH ACTIONS
// =============================================================================

export const WithActions = {
    args: {
        title: "Camera Settings",
        icon: "camera",
        actions: (
            <AdaptiveButton variant="ghost" icon="plus" size="default" />
        ),
        children: (
            <div style={{ color: "#888" }}>
                Section with action button in the header.
            </div>
        ),
    },
};

// =============================================================================
// WITH REAL CONTENT
// =============================================================================

export const WithControls = {
    render: () => (
        <AdaptiveSection title="Display Settings" icon="sliders">
            <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                <AdaptiveSlider label="Brightness" value={75} showValue />
                <AdaptiveSlider label="Contrast" value={50} showValue />
                <AdaptiveToggle label="Auto-adjust" checked={true} />
            </div>
        </AdaptiveSection>
    ),
};

// =============================================================================
// MODE COMPARISON
// =============================================================================

const ModeDisplay = () => {
    const { mode, tokens } = useMode();
    return (
        <div style={{ color: "#888", fontSize: "12px", marginTop: "16px" }}>
            Mode: {mode} | Header Height: {tokens.buttonHeight}px | Padding: {tokens.padding}px
        </div>
    );
};

export const DesktopMode = {
    decorators: [
        (Story) => (
            <ModeProvider defaultMode="desktop">
                <div style={{ padding: "40px", background: "#0a0a0f", minWidth: "320px" }}>
                    <Story />
                    <ModeDisplay />
                </div>
            </ModeProvider>
        ),
    ],
    render: () => (
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            <AdaptiveSection title="Video Settings" icon="camera">
                <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                    <AdaptiveSlider label="Frame Rate" value={30} min={15} max={60} valueFormatter={(v) => `${v} fps`} />
                    <AdaptiveToggle label="Auto-focus" checked />
                </div>
            </AdaptiveSection>
            <AdaptiveSection title="Audio Settings" icon="sliders" defaultExpanded={false}>
                <div style={{ color: "#888" }}>Audio controls here</div>
            </AdaptiveSection>
        </div>
    ),
};

export const VRMode = {
    decorators: [
        (Story) => (
            <ModeProvider defaultMode="vr">
                <div style={{ padding: "40px", background: "#0a0a0f", minWidth: "400px" }}>
                    <Story />
                    <ModeDisplay />
                </div>
            </ModeProvider>
        ),
    ],
    render: () => (
        <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
            <AdaptiveSection title="Video Settings" icon="camera">
                <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                    <AdaptiveSlider label="Frame Rate" value={30} min={15} max={60} valueFormatter={(v) => `${v} fps`} />
                    <AdaptiveToggle label="Auto-focus" checked />
                </div>
            </AdaptiveSection>
            <AdaptiveSection title="Audio Settings" icon="sliders" defaultExpanded={false}>
                <div style={{ color: "#888" }}>Audio controls here</div>
            </AdaptiveSection>
        </div>
    ),
};

export const ModeComparison = {
    render: () => (
        <div style={{ display: "flex", gap: "48px" }}>
            <ModeProvider defaultMode="desktop">
                <div style={{ minWidth: "280px" }}>
                    <div style={{ color: "#888", marginBottom: "16px", fontSize: "14px" }}>Desktop Mode</div>
                    <AdaptiveSection title="Quick Settings" icon="sliders">
                        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                            <AdaptiveToggle label="Night mode" checked />
                            <AdaptiveSlider label="Volume" value={80} showValue={false} />
                        </div>
                    </AdaptiveSection>
                    <ModeDisplay />
                </div>
            </ModeProvider>
            <ModeProvider defaultMode="vr">
                <div style={{ minWidth: "360px" }}>
                    <div style={{ color: "#888", marginBottom: "16px", fontSize: "14px" }}>VR Mode</div>
                    <AdaptiveSection title="Quick Settings" icon="sliders">
                        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                            <AdaptiveToggle label="Night mode" checked />
                            <AdaptiveSlider label="Volume" value={80} showValue={false} />
                        </div>
                    </AdaptiveSection>
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
// SETTINGS PANEL EXAMPLE
// =============================================================================

export const SettingsPanel = {
    render: () => (
        <div style={{ display: "flex", flexDirection: "column", gap: "12px", minWidth: "320px" }}>
            <AdaptiveSection title="General" icon="settings">
                <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                    <AdaptiveToggle label="Enable notifications" checked />
                    <AdaptiveToggle label="Auto-save" checked={false} />
                    <AdaptiveToggle label="Dark mode" checked />
                </div>
            </AdaptiveSection>

            <AdaptiveSection title="Camera" icon="camera">
                <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                    <AdaptiveSlider label="Zoom" value={100} min={50} max={200} valueFormatter={(v) => `${v}%`} />
                    <AdaptiveSlider label="Exposure" value={0} min={-100} max={100} valueFormatter={(v) => v > 0 ? `+${v}` : v} />
                    <AdaptiveToggle label="Auto-focus" checked />
                </div>
            </AdaptiveSection>

            <AdaptiveSection title="Layout" icon="layout" defaultExpanded={false}>
                <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                    <AdaptiveToggle label="Show grid" checked />
                    <AdaptiveToggle label="Snap to grid" checked={false} />
                </div>
            </AdaptiveSection>
        </div>
    ),
};