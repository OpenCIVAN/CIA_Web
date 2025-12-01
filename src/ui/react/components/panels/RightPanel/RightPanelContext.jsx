// src/ui/react/components/panels/RightPanel/RightPanelContext.jsx
// Shared state between RightActivityBar and RightPanelContent
// since they render in different DOM locations in ThreeEdgeLayout

import React, { createContext, useContext, useState, useCallback } from 'react';
import {
    Users,
    Briefcase,
    MessageSquare,
    Mic2,
    FileText,
    Video,
    Activity,
} from 'lucide-react';

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
export const RIGHT_PANEL_TABS = [
    { id: 'people', icon: Users, label: 'People', color: 'pink', implemented: true },
    { id: 'rooms', icon: Briefcase, label: 'Rooms', color: 'purple', implemented: true },
    { id: 'chat', icon: MessageSquare, label: 'Chat', color: 'blue', implemented: true },
    { id: 'voice', icon: Mic2, label: 'Voice', color: 'green', implemented: true },
    { id: 'notes', icon: FileText, label: 'Notes', color: 'teal', implemented: true },
    { id: 'recording', icon: Video, label: 'Recording', color: 'red', implemented: true },
    { id: 'activity', icon: Activity, label: 'Activity', color: 'amber', implemented: true },
];

// Tabs:
// - People: Online members with presence indicators
// - Rooms: Breakout rooms management
// - Chat: Text chat messaging
// - Voice: Voice chat controls
// - Notes: Shared notes/annotations
// - Recording: Session recording controls
// - Activity: Activity feed and notifications

/**
 * Dividers appear after these tabs for visual grouping
 */
export const RIGHT_PANEL_DIVIDERS_AFTER = ['rooms', 'voice'];

// =============================================================================
// CONTEXT
// =============================================================================

/**
 * Context shape
 */
const RightPanelContext = createContext({
    activeTab: 'people',
    setActiveTab: () => { },
    navigateToPanel: () => { },
});

/**
 * RightPanelProvider - Wraps the app to provide shared state
 * 
 * @example
 * <RightPanelProvider>
 *   <ThreeEdgeLayout
 *     rightActivityBar={<RightActivityBar />}
 *     rightPanelContent={<RightPanelContent />}
 *   />
 * </RightPanelProvider>
 */
export function RightPanelProvider({ children, defaultTab = 'people' }) {
    const [activeTab, setActiveTab] = useState(defaultTab);

    // Navigate to a specific panel/tab (used for cross-panel links)
    const navigateToPanel = useCallback((panelId) => {
        const tab = RIGHT_PANEL_TABS.find(t => t.id === panelId);
        if (tab) {
            setActiveTab(panelId);
        }
    }, []);

    const value = {
        activeTab,
        setActiveTab,
        navigateToPanel,
    };

    return (
        <RightPanelContext.Provider value={value}>
            {children}
        </RightPanelContext.Provider>
    );
}

/**
 * Hook to access right panel state
 * 
 * @example
 * const { activeTab, setActiveTab, navigateToPanel } = useRightPanelContext();
 */
export function useRightPanelContext() {
    const context = useContext(RightPanelContext);
    if (!context) {
        throw new Error('useRightPanelContext must be used within a RightPanelProvider');
    }
    return context;
}