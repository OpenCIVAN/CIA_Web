// src/ui/react/components/adaptive/Icon/Icon.stories.jsx
import React from "react";
import Icon from "./Icon";
import { iconPaths } from "./iconPaths";
import { ModeProvider } from "../ModeContext";

export default {
    title: "Adaptive/Icon",
    component: Icon,
    parameters: {
        layout: "centered",
    },
    argTypes: {
        name: {
            control: "select",
            options: Object.keys(iconPaths),
        },
        weight: {
            control: "select",
            options: ["thin", "light", "regular", "medium", "bold"],
        },
        size: {
            control: { type: "range", min: 12, max: 48, step: 4 },
        },
        color: {
            control: "color",
        },
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
// BASIC ICON STORIES
// =============================================================================

export const Default = {
    args: {
        name: "settings",
        weight: "regular",
    },
};

export const WithCustomSize = {
    args: {
        name: "camera",
        size: 32,
        weight: "regular",
    },
};

export const WithCustomColor = {
    args: {
        name: "check",
        color: "#60a5fa",
        weight: "regular",
    },
};

// =============================================================================
// WEIGHT VARIATIONS
// =============================================================================

export const Weights = {
    render: () => (
        <div style={{ display: "flex", gap: "24px", alignItems: "center" }}>
            <div style={{ textAlign: "center", color: "#888" }}>
                <Icon name="settings" weight="thin" size={24} />
                <div style={{ marginTop: "8px", fontSize: "12px" }}>Thin</div>
            </div>
            <div style={{ textAlign: "center", color: "#888" }}>
                <Icon name="settings" weight="light" size={24} />
                <div style={{ marginTop: "8px", fontSize: "12px" }}>Light</div>
            </div>
            <div style={{ textAlign: "center", color: "#888" }}>
                <Icon name="settings" weight="regular" size={24} />
                <div style={{ marginTop: "8px", fontSize: "12px" }}>Regular</div>
            </div>
            <div style={{ textAlign: "center", color: "#888" }}>
                <Icon name="settings" weight="medium" size={24} />
                <div style={{ marginTop: "8px", fontSize: "12px" }}>Medium</div>
            </div>
            <div style={{ textAlign: "center", color: "#888" }}>
                <Icon name="settings" weight="bold" size={24} />
                <div style={{ marginTop: "8px", fontSize: "12px" }}>Bold</div>
            </div>
        </div>
    ),
};

// =============================================================================
// MODE COMPARISON
// =============================================================================

export const DesktopMode = {
    decorators: [
        (Story) => (
            <ModeProvider defaultMode="desktop">
                <div style={{ padding: "40px", background: "#0a0a0f" }}>
                    <Story />
                </div>
            </ModeProvider>
        ),
    ],
    render: () => (
        <div style={{ display: "flex", gap: "16px", alignItems: "center", color: "#fff" }}>
            <Icon name="play" weight="regular" />
            <Icon name="pause" weight="regular" />
            <Icon name="settings" weight="regular" />
            <Icon name="camera" weight="regular" />
            <span style={{ marginLeft: "16px", fontSize: "13px", color: "#888" }}>
                Desktop: 16px icons, 2px stroke
            </span>
        </div>
    ),
};

export const VRMode = {
    decorators: [
        (Story) => (
            <ModeProvider defaultMode="vr">
                <div style={{ padding: "40px", background: "#0a0a0f" }}>
                    <Story />
                </div>
            </ModeProvider>
        ),
    ],
    render: () => (
        <div style={{ display: "flex", gap: "24px", alignItems: "center", color: "#fff" }}>
            <Icon name="play" weight="regular" />
            <Icon name="pause" weight="regular" />
            <Icon name="settings" weight="regular" />
            <Icon name="camera" weight="regular" />
            <span style={{ marginLeft: "16px", fontSize: "18px", color: "#888" }}>
                VR: 28px icons, 1.5px stroke
            </span>
        </div>
    ),
};

// =============================================================================
// ICON GALLERY
// =============================================================================

export const NavigationIcons = {
    render: () => (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(6, 1fr)", gap: "24px" }}>
            {["chevronDown", "chevronUp", "chevronLeft", "chevronRight", "arrowLeft", "arrowRight"].map((name) => (
                <div key={name} style={{ textAlign: "center", color: "#888" }}>
                    <Icon name={name} size={24} />
                    <div style={{ marginTop: "8px", fontSize: "11px" }}>{name}</div>
                </div>
            ))}
        </div>
    ),
};

export const ActionIcons = {
    render: () => (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(6, 1fr)", gap: "24px" }}>
            {["plus", "minus", "close", "check", "edit", "trash", "copy"].map((name) => (
                <div key={name} style={{ textAlign: "center", color: "#888" }}>
                    <Icon name={name} size={24} />
                    <div style={{ marginTop: "8px", fontSize: "11px" }}>{name}</div>
                </div>
            ))}
        </div>
    ),
};

export const MediaIcons = {
    render: () => (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(6, 1fr)", gap: "24px" }}>
            {["play", "pause", "stop", "record", "skipBack", "skipForward"].map((name) => (
                <div key={name} style={{ textAlign: "center", color: "#888" }}>
                    <Icon name={name} size={24} />
                    <div style={{ marginTop: "8px", fontSize: "11px" }}>{name}</div>
                </div>
            ))}
        </div>
    ),
};

export const ViewIcons = {
    render: () => (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(6, 1fr)", gap: "24px" }}>
            {["grid", "list", "columns", "camera", "eye", "eyeOff", "maximize", "minimize"].map((name) => (
                <div key={name} style={{ textAlign: "center", color: "#888" }}>
                    <Icon name={name} size={24} />
                    <div style={{ marginTop: "8px", fontSize: "11px" }}>{name}</div>
                </div>
            ))}
        </div>
    ),
};

export const VRIcons = {
    render: () => (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "24px" }}>
            {["vr", "controller", "headset"].map((name) => (
                <div key={name} style={{ textAlign: "center", color: "#888" }}>
                    <Icon name={name} size={24} />
                    <div style={{ marginTop: "8px", fontSize: "11px" }}>{name}</div>
                </div>
            ))}
        </div>
    ),
};

export const AllIcons = {
    render: () => (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(8, 1fr)", gap: "16px" }}>
            {Object.keys(iconPaths).map((name) => (
                <div key={name} style={{ textAlign: "center", color: "#888", padding: "8px" }}>
                    <Icon name={name} size={20} />
                    <div style={{ marginTop: "6px", fontSize: "10px", wordBreak: "break-all" }}>{name}</div>
                </div>
            ))}
        </div>
    ),
};