// src/ui/react/components/adaptive/AdaptiveSlider/AdaptiveSlider.stories.jsx
import React, { useState } from "react";
import AdaptiveSlider from "./AdaptiveSlider";
import { ModeProvider, useMode } from "../ModeContext";

export default {
    title: "Adaptive/AdaptiveSlider",
    component: AdaptiveSlider,
    parameters: {
        layout: "centered",
    },
    argTypes: {
        value: { control: { type: "range", min: 0, max: 100 } },
        min: { control: "number" },
        max: { control: "number" },
        step: { control: "number" },
        label: { control: "text" },
        showValue: { control: "boolean" },
        disabled: { control: "boolean" },
        onChange: { action: "changed" },
    },
    decorators: [
        (Story, context) => (
            <ModeProvider defaultMode={context.globals.mode || "desktop"}>
                <div style={{ padding: "40px", background: "#0a0a0f", minWidth: "300px" }}>
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
        value: 50,
        min: 0,
        max: 100,
    },
};

export const WithLabel = {
    args: {
        value: 75,
        min: 0,
        max: 100,
        label: "Volume",
    },
};

export const WithoutValue = {
    args: {
        value: 30,
        label: "Brightness",
        showValue: false,
    },
};

export const Disabled = {
    args: {
        value: 50,
        label: "Disabled slider",
        disabled: true,
    },
};

// =============================================================================
// CUSTOM RANGES
// =============================================================================

export const CustomRange = {
    args: {
        value: 5,
        min: 1,
        max: 10,
        step: 1,
        label: "Rating",
    },
};

export const FloatStep = {
    args: {
        value: 0.5,
        min: 0,
        max: 1,
        step: 0.1,
        label: "Opacity",
        valueFormatter: (v) => `${(v * 100).toFixed(0)}%`,
    },
};

// =============================================================================
// INTERACTIVE
// =============================================================================

const InteractiveSlider = ({ label, ...props }) => {
    const [value, setValue] = useState(props.value || 50);
    return (
        <AdaptiveSlider
            {...props}
            value={value}
            onChange={setValue}
            label={label}
        />
    );
};

export const Interactive = {
    render: () => <InteractiveSlider label="Adjust value" />,
};

export const InteractiveWithFormatter = {
    render: () => (
        <InteractiveSlider
            label="Volume"
            value={80}
            valueFormatter={(v) => `${v}%`}
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
            Mode: {mode} | Font Size: {tokens.fontSize}px
        </div>
    );
};

export const DesktopMode = {
    decorators: [
        (Story) => (
            <ModeProvider defaultMode="desktop">
                <div style={{ padding: "40px", background: "#0a0a0f", minWidth: "300px" }}>
                    <Story />
                    <ModeDisplay />
                </div>
            </ModeProvider>
        ),
    ],
    render: () => (
        <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
            <InteractiveSlider label="Volume" value={75} valueFormatter={(v) => `${v}%`} />
            <InteractiveSlider label="Brightness" value={50} valueFormatter={(v) => `${v}%`} />
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
        <div style={{ display: "flex", flexDirection: "column", gap: "32px" }}>
            <InteractiveSlider label="Volume" value={75} valueFormatter={(v) => `${v}%`} />
            <InteractiveSlider label="Brightness" value={50} valueFormatter={(v) => `${v}%`} />
        </div>
    ),
};

export const ModeComparison = {
    render: () => (
        <div style={{ display: "flex", gap: "64px" }}>
            <ModeProvider defaultMode="desktop">
                <div style={{ minWidth: "250px" }}>
                    <div style={{ color: "#888", marginBottom: "16px", fontSize: "14px" }}>Desktop Mode</div>
                    <InteractiveSlider label="Zoom" value={100} min={50} max={200} valueFormatter={(v) => `${v}%`} />
                    <ModeDisplay />
                </div>
            </ModeProvider>
            <ModeProvider defaultMode="vr">
                <div style={{ minWidth: "350px" }}>
                    <div style={{ color: "#888", marginBottom: "16px", fontSize: "14px" }}>VR Mode</div>
                    <InteractiveSlider label="Zoom" value={100} min={50} max={200} valueFormatter={(v) => `${v}%`} />
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
// AUDIO CONTROLS EXAMPLE
// =============================================================================

const AudioControlsExample = () => {
    const [volume, setVolume] = useState(80);
    const [bass, setBass] = useState(50);
    const [treble, setTreble] = useState(60);
    const [pan, setPan] = useState(0);

    return (
        <div style={{ display: "flex", flexDirection: "column", gap: "20px", minWidth: "280px" }}>
            <AdaptiveSlider
                label="Volume"
                value={volume}
                onChange={setVolume}
                valueFormatter={(v) => `${v}%`}
            />
            <AdaptiveSlider
                label="Bass"
                value={bass}
                onChange={setBass}
                valueFormatter={(v) => `${v > 50 ? '+' : ''}${v - 50}`}
            />
            <AdaptiveSlider
                label="Treble"
                value={treble}
                onChange={setTreble}
                valueFormatter={(v) => `${v > 50 ? '+' : ''}${v - 50}`}
            />
            <AdaptiveSlider
                label="Pan"
                value={pan}
                onChange={setPan}
                min={-100}
                max={100}
                valueFormatter={(v) => v === 0 ? 'C' : v < 0 ? `L${Math.abs(v)}` : `R${v}`}
            />
        </div>
    );
};

export const AudioControls = {
    render: () => <AudioControlsExample />,
};