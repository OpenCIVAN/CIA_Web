// src/ui/react/components/workspace/InstanceToolbar.jsx
// Instance-specific tools that appear in each viewport

import React from "react";
import {
    Filter,
    Ruler,
    Wand2,
    Camera,
    Eye,
    Sliders
} from "lucide-react";

import "./InstanceToolbar.css";

const INSTANCE_TOOLS = [
    {
        id: "filter",
        label: "Filter",
        icon: Filter,
        description: "Filter data points"
    },
    {
        id: "measure",
        label: "Measure",
        icon: Ruler,
        description: "Measurement tools"
    },
    {
        id: "transform",
        label: "Transform",
        icon: Wand2,
        description: "Apply transformations"
    },
    {
        id: "camera",
        label: "Camera",
        icon: Camera,
        description: "Camera controls"
    },
    {
        id: "visibility",
        label: "Display",
        icon: Eye,
        description: "Visibility and rendering"
    },
    {
        id: "properties",
        label: "Properties",
        icon: Sliders,
        description: "Instance properties"
    }
];

export function InstanceToolbar({ instanceId, activeInstanceTool, onToolSelect }) {
    return (
        <div className="instance-toolbar">
            {INSTANCE_TOOLS.map((tool) => {
                const Icon = tool.icon;
                const isActive = activeInstanceTool === tool.id;

                return (
                    <button
                        key={tool.id}
                        className={`instance-tool-button ${isActive ? "active" : ""}`}
                        onClick={() => onToolSelect(tool.id)}
                        title={tool.description}
                    >
                        <Icon size={18} />
                    </button>
                );
            })}
        </div>
    );
}