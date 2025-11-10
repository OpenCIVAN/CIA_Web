// src/ui/react/components/toolbars/LeftToolbar.jsx
// Redesigned for multi-instance architecture

import React from "react";
import { FolderOpen, Layout, Search, Star, Settings, HelpCircle } from "lucide-react";

import "./LeftToolbar.css";

const GLOBAL_TOOLS = [
  {
    id: "files",
    label: "Files",
    icon: FolderOpen,
    description: "Manage datasets and project files"
  },
  {
    id: "workspace",
    label: "Workspace",
    icon: Layout,
    description: "Layout and window management"
  },
  {
    id: "search",
    label: "Search",
    icon: Search,
    description: "Search across all data and annotations"
  },
  {
    id: "favorites",
    label: "Favorites",
    icon: Star,
    description: "Saved views and configurations"
  },
  {
    id: "settings",
    label: "Settings",
    icon: Settings,
    description: "Application preferences"
  },
  {
    id: "help",
    label: "Help",
    icon: HelpCircle,
    description: "Documentation and tutorials"
  }
];

export function LeftToolbar({ activeTool, onToolSelect }) {
  return (
    <div className="left-toolbar">
      {GLOBAL_TOOLS.map((tool) => {
        const Icon = tool.icon;
        const isActive = activeTool === tool.id;

        return (
          <button
            key={tool.id}
            className={`tool-button ${isActive ? "active" : ""}`}
            onClick={() => onToolSelect(tool.id)}
            title={tool.description}
            aria-label={tool.label}
          >
            <Icon size={24} />
            <span className="tool-label">{tool.label}</span>
          </button>
        );
      })}
    </div>
  );
}