// src/ui/react/components/adaptive/AdaptiveToggle/AdaptiveToggle.stories.jsx
import React, { useState } from "react";
import AdaptiveToggle from "./AdaptiveToggle";
import { ModeProvider, useMode } from "../ModeContext";

export default {
    title: "Adaptive/AdaptiveToggle",
    component: AdaptiveToggle,
    parameters: {
        layout: "centered",
    },
    argTypes: {
        checked: { control: "boolean" },
        label: { control: "text" },
        disabled: { control: "boolean" },
        onChange: { action: "changed" },
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

// =============================================================================
// BASIC STORIES
// =============================================================================

export const Default = {
    args: {
        checked: false,
    },
};

export const Checked = {
    args: {
        checked: true,
    },
};

export const WithLabel = {
    args: {
        checked: false,
        label: "Enable notifications",
    },
};

export const Disabled = {
    args: {
        checked: false,
        label: "Disabled toggle",
        disabled: true,
    },
};

export const DisabledChecked = {
    args: {
        checked: true,
        label: "Disabled checked",
        disabled: true,
    },
};

// =============================================================================
// INTERACTIVE
// =============================================================================

const InteractiveToggle = ({ initialChecked = false, label }) => {
    const [checked, setChecked] = useState(initialChecked);
    return (
        <AdaptiveToggle
            checked={checked}
            onChange={setChecked}
            label={label}
        />
    );
};

export const Interactive = {
    render: () => <InteractiveToggle label="Click to toggle" />,
};

// =============================================================================
// MODE COMPARISON
// =============================================================================

const ModeDisplay = () => {
    const { mode, tokens } = useMode();
    return (
        <div style={{ color: "#888", fontSize: "12px", marginTop: "16px" }}>
            Mode: {mode} | Font Size: {tokens.fontSize}px
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
    render: () => (
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            <InteractiveToggle label="Desktop toggle unchecked" />
            <InteractiveToggle label="Desktop toggle checked" initialChecked />
        </div>
    ),
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
    render: () => (
        <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
            <InteractiveToggle label="VR toggle unchecked" />
            <InteractiveToggle label="VR toggle checked" initialChecked />
        </div>
    ),
};

export const ModeComparison = {
    render: () => (
        <div style={{ display: "flex", gap: "64px" }}>
            <ModeProvider defaultMode="desktop">
                <div>
                    <div style={{ color: "#888", marginBottom: "16px", fontSize: "14px" }}>Desktop Mode</div>
                    <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                        <InteractiveToggle label="Auto-save" />
                        <InteractiveToggle label="Dark mode" initialChecked />
                    </div>
                    <ModeDisplay />
                </div>
            </ModeProvider>
            <ModeProvider defaultMode="vr">
                <div>
                    <div style={{ color: "#888", marginBottom: "16px", fontSize: "14px" }}>VR Mode</div>
                    <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                        <InteractiveToggle label="Auto-save" />
                        <InteractiveToggle label="Dark mode" initialChecked />
                    </div>
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
// SETTINGS LIST EXAMPLE
// =============================================================================

const SettingsExample = () => {
    const [settings, setSettings] = useState({
        notifications: true,
        autoSave: false,
        darkMode: true,
        analytics: false,
    });

    const toggleSetting = (key) => {
        setSettings((prev) => ({ ...prev, [key]: !prev[key] }));
    };

    return (
        <div style={{ display: "flex", flexDirection: "column", gap: "16px", minWidth: "250px" }}>
            <AdaptiveToggle
                checked={settings.notifications}
                onChange={() => toggleSetting("notifications")}
                label="Enable notifications"
            />
            <AdaptiveToggle
                checked={settings.autoSave}
                onChange={() => toggleSetting("autoSave")}
                label="Auto-save recordings"
            />
            <AdaptiveToggle
                checked={settings.darkMode}
                onChange={() => toggleSetting("darkMode")}
                label="Dark mode"
            />
            <AdaptiveToggle
                checked={settings.analytics}
                onChange={() => toggleSetting("analytics")}
                label="Send analytics"
            />
        </div>
    );
};

export const SettingsList = {
    render: () => <SettingsExample />,
};