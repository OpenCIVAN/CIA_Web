// src/ui/react/components/panels/LeftPanel/index.jsx
// Unified left panel with activity bar navigation and workspace-scoped content
//
// Architecture:
// - Activity bar: Vertical icon navigation for panel tabs
// - Content area: Tab-specific content (Files, Datasets, etc.)
// - Workspace context: All tabs share the selected workspace context
//
// Tabs:
// - Files: Project files with grid/list views and thumbnails
// - Datasets: Loaded datasets with views tree
// - Instance Tools: Tools for the active instance
// - Layout: Workspace layout presets
// - Annotations: Spatial annotations
// - Cursors: Cursor visibility settings
// - Saved Filters: Reusable filter presets
// - Bookmarks: Saved view bookmarks

import React, { useState, useCallback, useMemo } from 'react';
import {
    FolderOpen,
    Database,
    Wrench,
    LayoutGrid,
    MessageSquare,
    MousePointer2,
    Filter,
    Bookmark,
} from 'lucide-react';

// Tab content components
import { FilesPanelContent } from './tabs/FilesTab';
import { DatasetsPanelContent } from './tabs/DatasetsTab';
// Placeholder imports - these will be implemented later
// import { InstanceToolsContent } from './tabs/InstanceToolsTab';
// import { LayoutContent } from './tabs/LayoutTab';
// import { AnnotationsContent } from './tabs/AnnotationsTab';
// import { CursorsContent } from './tabs/CursorsTab';
// import { SavedFiltersContent } from './tabs/SavedFiltersTab';
// import { BookmarksContent } from './tabs/BookmarksTab';

import './LeftPanel.scss';

// =============================================================================
// TAB CONFIGURATION
// =============================================================================

/**
 * Tab definitions with icons and colors
 * Each tab has:
 * - id: Unique identifier
 * - icon: Lucide icon component
 * - label: Display name (for tooltips)
 * - color: Accent color variable name from tokens
 * - implemented: Whether the tab content is ready
 */
const TABS = [
    { id: 'files', icon: FolderOpen, label: 'Files', color: 'blue', implemented: true },
    { id: 'datasets', icon: Database, label: 'Datasets', color: 'teal', implemented: true },
    { id: 'instance-tools', icon: Wrench, label: 'Instance Tools', color: 'orange', implemented: false },
    { id: 'layout', icon: LayoutGrid, label: 'Layout', color: 'green', implemented: false },
    { id: 'annotations', icon: MessageSquare, label: 'Annotations', color: 'pink', implemented: false },
    { id: 'cursors', icon: MousePointer2, label: 'Cursors', color: 'amber', implemented: false },
    { id: 'filters', icon: Filter, label: 'Saved Filters', color: 'indigo', implemented: false },
    { id: 'bookmarks', icon: Bookmark, label: 'Bookmarks', color: 'purple', implemented: false },
];

// =============================================================================
// ACTIVITY BAR
// =============================================================================

/**
 * ActivityBar - Vertical icon navigation for panel tabs
 * Fixed width, always visible even when panel is collapsed
 */
function ActivityBar({ tabs, activeTab, onTabChange, onTogglePanel, isPanelOpen }) {

    // Handle tab click - if clicking active tab, toggle panel
    const handleTabClick = (tabId) => {
        if (tabId === activeTab) {
            // Clicking active tab toggles the panel
            onTogglePanel?.();
        } else {
            // Clicking different tab - switch to it and ensure panel is open
            onTabChange(tabId);
            if (!isPanelOpen) {
                onTogglePanel?.();
            }
        }
    };

    return (
        <div className="left-panel__activity-bar">
            {/* Tab buttons */}
            <div className="left-panel__activity-tabs">
                {tabs.map(tab => {
                    const Icon = tab.icon;
                    const isActive = activeTab === tab.id;

                    return (
                        <button
                            key={tab.id}
                            className={`left-panel__activity-btn ${isActive ? 'active' : ''}`}
                            data-color={tab.color}
                            onClick={() => handleTabClick(tab.id)}
                            title={tab.label}
                            aria-label={tab.label}
                            aria-selected={isActive}
                        >
                            <Icon size={18} />
                            {!tab.implemented && (
                                <span className="left-panel__activity-badge">Soon</span>
                            )}
                        </button>
                    );
                })}
            </div>

            {/* Spacer */}
            <div className="left-panel__activity-spacer" />
        </div>
    );
}

// =============================================================================
// PLACEHOLDER TAB CONTENT
// =============================================================================

/**
 * PlaceholderContent - Shown for unimplemented tabs
 */
function PlaceholderContent({ tab }) {
    const Icon = tab.icon;

    return (
        <div className="left-panel__placeholder">
            <Icon size={32} className="left-panel__placeholder-icon" data-color={tab.color} />
            <h3 className="left-panel__placeholder-title">{tab.label}</h3>
            <p className="left-panel__placeholder-text">
                This tab is coming soon. It will contain {tab.label.toLowerCase()}
                management features.
            </p>
        </div>
    );
}

// =============================================================================
// MAIN COMPONENT
// =============================================================================

/**
 * LeftPanel - Main unified left panel component
 * 
 * Note: This component receives props from ResizablePanel via React.cloneElement:
 * - isCollapsed: boolean - Whether panel is collapsed
 * - onToggle: function - Callback to toggle panel
 * - side: string - Always 'left' for this panel
 * 
 * @param {Object} props
 * @param {string} props.workspaceId - Current workspace ID from context
 * @param {boolean} props.isCollapsed - Whether panel is collapsed (from ResizablePanel)
 * @param {Function} props.onToggle - Callback to toggle panel (from ResizablePanel)
 * @param {string} props.side - Panel side, always 'left' (from ResizablePanel)
 */
export function LeftPanel({
    workspaceId,
    // These props come from ResizablePanel via React.cloneElement
    isCollapsed = false,
    onToggle,
    side = 'left',
}) {
    // Active tab state
    const [activeTab, setActiveTab] = useState('files');

    // Get current tab config
    const currentTab = useMemo(
        () => TABS.find(t => t.id === activeTab) || TABS[0],
        [activeTab]
    );

    // Handle tab change
    const handleTabChange = useCallback((tabId) => {
        setActiveTab(tabId);
    }, []);

    // Render tab content based on active tab
    const renderContent = useCallback(() => {
        switch (activeTab) {
            case 'files':
                return <FilesPanelContent workspaceId={workspaceId} />;
            case 'datasets':
                return <DatasetsPanelContent workspaceId={workspaceId} />;
            case 'instance-tools':
            case 'layout':
            case 'annotations':
            case 'cursors':
            case 'filters':
            case 'bookmarks':
                return <PlaceholderContent tab={currentTab} />;
            default:
                return <PlaceholderContent tab={TABS[0]} />;
        }
    }, [activeTab, workspaceId, currentTab]);

    return (
        <div className="left-panel" data-collapsed={isCollapsed}>
            {/* Activity Bar - Always visible */}
            <ActivityBar
                tabs={TABS}
                activeTab={activeTab}
                onTabChange={handleTabChange}
                onTogglePanel={onToggle}
                isPanelOpen={!isCollapsed}
            />

            {/* Content Panel - Hidden when collapsed */}
            {!isCollapsed && (
                <div
                    className="left-panel__content"
                    data-active-tab={activeTab}
                    data-color={currentTab.color}
                >
                    {renderContent()}
                </div>
            )}
        </div>
    );
}

// =============================================================================
// EXPORTS
// =============================================================================

export { TABS as LEFT_PANEL_TABS };
export default LeftPanel;