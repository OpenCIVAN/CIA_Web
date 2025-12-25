// src/ui/react/components/adaptive/AdaptiveButton/AdaptiveButton.stories.jsx
import React from "react";
import AdaptiveButton from "./AdaptiveButton";
import { ModeProvider, useMode } from "../ModeContext";

export default {
    title: "Adaptive/AdaptiveButton",
    component: AdaptiveButton,
    parameters: {
        layout: "centered",
    },
    argTypes: {
        variant: {
            control: "select",
            options: ["primary", "secondary", "ghost", "danger"],
        },
        size: {
            control: "select",
            options: ["default", "large"],
        },
        icon: {
            control: "select",
            options: [null, "plus", "settings", "play", "pause", "check", "close", "camera"],
        },
        iconPosition: {
            control: "select",
            options: ["left", "right"],
        },
        disabled: { control: "boolean" },
        active: { control: "boolean" },
        fullWidth: { control: "boolean" },
        onClick: { action: "clicked" },
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
        children: "Button",
        variant: "secondary",
    },
};

export const Primary = {
    args: {
        children: "Primary Action",
        variant: "primary",
    },
};

export const Ghost = {
    args: {
        children: "Ghost Button",
        variant: "ghost",
    },
};

export const Danger = {
    args: {
        children: "Delete",
        variant: "danger",
        icon: "trash",
    },
};

// =============================================================================
// WITH ICONS
// =============================================================================

export const WithIconLeft = {
    args: {
        children: "Add Item",
        variant: "primary",
        icon: "plus",
        iconPosition: "left",
    },
};

export const WithIconRight = {
    args: {
        children: "Continue",
        variant: "primary",
        icon: "chevronRight",
        iconPosition: "right",
    },
};

export const IconOnly = {
    args: {
        icon: "settings",
        variant: "secondary",
    },
};

// =============================================================================
// STATES
// =============================================================================

export const Active = {
    args: {
        children: "Active",
        variant: "secondary",
        active: true,
    },
};

export const Disabled = {
    args: {
        children: "Disabled",
        variant: "primary",
        disabled: true,
    },
};

export const FullWidth = {
    args: {
        children: "Full Width Button",
        variant: "primary",
        fullWidth: true,
    },
    decorators: [
        (Story) => (
            <ModeProvider defaultMode="desktop">
                <div style={{ width: "300px", padding: "40px", background: "#0a0a0f" }}>
                    <Story />
                </div>
            </ModeProvider>
        ),
    ],
};

// =============================================================================
// SIZE VARIATIONS
// =============================================================================

export const Sizes = {
    render: () => (
        <div style={{ display: "flex", gap: "16px", alignItems: "center" }}>
            <AdaptiveButton variant="primary" size="default">Default</AdaptiveButton>
            <AdaptiveButton variant="primary" size="large">Large</AdaptiveButton>
        </div>
    ),
};

// =============================================================================
// ALL VARIANTS
// =============================================================================

export const AllVariants = {
    render: () => (
        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            <AdaptiveButton variant="primary">Primary</AdaptiveButton>
            <AdaptiveButton variant="secondary">Secondary</AdaptiveButton>
            <AdaptiveButton variant="ghost">Ghost</AdaptiveButton>
            <AdaptiveButton variant="danger">Danger</AdaptiveButton>
        </div>
    ),
};

// =============================================================================
// MODE COMPARISON
// =============================================================================

const ModeDisplay = () => {
    const { mode, tokens } = useMode();
    return (
        <div style={{ color: "#888", fontSize: "12px", marginTop: "16px" }}>
            Mode: {mode} | Button Height: {tokens.buttonHeight}px | Icon Size: {tokens.iconSize}px
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
        <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
            <AdaptiveButton variant="primary" icon="play">Play</AdaptiveButton>
            <AdaptiveButton variant="secondary" icon="settings">Settings</AdaptiveButton>
            <AdaptiveButton variant="ghost" icon="close" />
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
        <div style={{ display: "flex", gap: "16px", alignItems: "center" }}>
            <AdaptiveButton variant="primary" icon="play">Play</AdaptiveButton>
            <AdaptiveButton variant="secondary" icon="settings">Settings</AdaptiveButton>
            <AdaptiveButton variant="ghost" icon="close" />
        </div>
    ),
};

export const ModeComparison = {
    render: () => (
        <div style={{ display: "flex", gap: "48px" }}>
            <ModeProvider defaultMode="desktop">
                <div>
                    <div style={{ color: "#888", marginBottom: "16px", fontSize: "14px" }}>Desktop Mode</div>
                    <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
                        <AdaptiveButton variant="primary" icon="camera">Record</AdaptiveButton>
                        <AdaptiveButton variant="secondary" icon="settings" />
                    </div>
                    <ModeDisplay />
                </div>
            </ModeProvider>
            <ModeProvider defaultMode="vr">
                <div>
                    <div style={{ color: "#888", marginBottom: "16px", fontSize: "14px" }}>VR Mode</div>
                    <div style={{ display: "flex", gap: "16px", alignItems: "center" }}>
                        <AdaptiveButton variant="primary" icon="camera">Record</AdaptiveButton>
                        <AdaptiveButton variant="secondary" icon="settings" />
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
// BUTTON GROUP EXAMPLE
// =============================================================================

export const ButtonGroup = {
    render: () => (
        <div style={{ display: "flex", gap: "8px" }}>
            <AdaptiveButton variant="secondary" icon="skipBack" />
            <AdaptiveButton variant="primary" icon="play" />
            <AdaptiveButton variant="secondary" icon="skipForward" />
        </div>
    ),
};