/**
 * LayoutPanel Component
 *
 * Main container for the Layout Panel in the left sidebar.
 * Manages canvas navigation, view configuration, and layout tools.
 * 
 * IMPORTANT: This component should NOT render FloatingCanvasNavigator.
 * FloatingCanvasNavigator is rendered at the app level in CIAWebApp.jsx.
 * This component ONLY renders the docked navigator when dockPosition === 'left-panel'.
 */

import React, { memo, useContext } from 'react';
import { LayoutGrid, Map, Layers, Loader2, WifiOff, AlertCircle } from 'lucide-react';
import { useLayoutPanel, DOCK_POSITIONS } from './LayoutPanel.logic';
import LayoutPanelContext from './LayoutPanelContext';
import { CanvasNavigator } from './components/CanvasNavigator/CanvasNavigator';
import { CanvasSubtab } from './subtabs/CanvasSubtab';
import { ViewsSubtab } from './subtabs/ViewsSubtab';
import './LayoutPanel.scss';

// Subtab configuration
const SUBTABS = [
    { id: 'canvas', label: 'Canvas', icon: Map, color: 'amber' },
    { id: 'views', label: 'Views', icon: Layers, color: 'purple' },
];

/**
 * LayoutPanel - Main panel component
 *
 * @param {Object} props
 * @param {string} [props.canvasId] - Target canvas ID (uses active canvas if not provided)
 * @param {string} [props.className] - Additional CSS classes
 */
export const LayoutPanel = memo(function LayoutPanel({
    canvasId,
    className = '',
}) {
    // Check if we're inside a LayoutPanelProvider (shared context)
    const context = useContext(LayoutPanelContext);

    // Create standalone logic only if no context is available
    // IMPORTANT: Always pass an object, never null/undefined
    const standaloneLogic = useLayoutPanel(context ? {} : { canvasId });

    // Use context logic if available, otherwise use standalone
    const logic = context?.logic || standaloneLogic;

    const {
        panelSubtab,
        setPanelSubtab,
        cells,
        loading,
        error,
        isConnected,
        // Get dockPosition from logic (which comes from context)
        dockPosition,
    } = logic;

    // Check if navigator should be docked in this panel
    // ONLY render when dockPosition is explicitly 'left-panel'
    const shouldRenderDockedNavigator = dockPosition === DOCK_POSITIONS.LEFT_PANEL;

    // Loading state
    if (loading) {
        return (
            <div className={`layout-panel layout-panel--loading ${className}`}>
                <div className="layout-panel__loading">
                    <Loader2 size={24} className="spin" />
                    <span>Loading canvas...</span>
                </div>
            </div>
        );
    }

    // Error state
    if (error) {
        return (
            <div className={`layout-panel layout-panel--error ${className}`}>
                <div className="layout-panel__error">
                    <AlertCircle size={24} />
                    <span>{error}</span>
                </div>
            </div>
        );
    }

    return (
        <div className={`layout-panel ${!isConnected ? 'layout-panel--disabled' : ''} ${className}`}>
            {/* Header - using standard panel-header */}
            <div className="panel-header panel-header--amber">
                <LayoutGrid size={14} className="panel-header__icon" />
                <span className="panel-header__title">Layout</span>
                {!isConnected && (
                    <WifiOff size={12} className="layout-panel__header-offline" title="Disconnected" />
                )}
            </div>

            {/* Subtabs */}
            <div className="layout-panel__tabs">
                {SUBTABS.map((tab) => {
                    const Icon = tab.icon;
                    const isActive = panelSubtab === tab.id;
                    const badge = tab.id === 'views' ? cells.length : null;

                    return (
                        <button
                            key={tab.id}
                            className={`layout-panel__tab ${isActive ? 'layout-panel__tab--active' : ''}`}
                            data-color={tab.color}
                            onClick={() => setPanelSubtab(tab.id)}
                        >
                            <Icon size={12} />
                            <span>{tab.label}</span>
                            {badge !== null && badge > 0 && (
                                <span className="layout-panel__tab-badge">{badge}</span>
                            )}
                        </button>
                    );
                })}
            </div>

            {/* Subtab Content */}
            <div className="layout-panel__content">
                {panelSubtab === 'canvas' ? (
                    <CanvasSubtab logic={logic} />
                ) : (
                    <ViewsSubtab logic={logic} />
                )}
            </div>

            {/* Docked Navigator - ONLY when dockPosition is 'left-panel' */}
            {shouldRenderDockedNavigator && (
                <div className="layout-panel__navigator">
                    <CanvasNavigator
                        isDocked={true}
                        logic={logic}
                    />
                </div>
            )}
        </div>
    );
});

// NOTE: FloatingCanvasNavigator is NO LONGER exported from this file.
// It should be imported from './FloatingCanvasNavigator' instead.
// This prevents duplicate renders.

export default LayoutPanel;