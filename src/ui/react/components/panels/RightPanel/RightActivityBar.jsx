// src/ui/react/components/panels/RightPanel/RightActivityBar.jsx
// Activity bar icons for the right panel
// Renders in ThreeEdgeLayout's right activity bar slot

import React from 'react';
import { PanelRightClose, ChevronLeft } from 'lucide-react';
import { useRightPanelContext, RIGHT_PANEL_TABS, RIGHT_PANEL_DIVIDERS_AFTER } from './RightPanelContext';
import './RightActivityBar.scss';

// =============================================================================
// RIGHT ACTIVITY BAR
// =============================================================================

/**
 * RightActivityBar - Vertical icon navigation for panel tabs
 * Fixed width (48px), always visible even when panel is collapsed.
 * 
 * Props are injected by ThreeEdgeLayout via React.cloneElement:
 * @param {boolean} isOpen - Whether the panel content is expanded
 * @param {Function} onToggle - Callback to toggle panel open/closed
 */
export function RightActivityBar({ isOpen, onToggle }) {
    const { activeTab, setActiveTab } = useRightPanelContext();

    // Handle tab click - if clicking active tab, toggle panel
    const handleTabClick = (tabId) => {
        if (tabId === activeTab) {
            // Clicking active tab toggles the panel
            onToggle?.();
        } else {
            // Clicking different tab - switch to it and ensure panel is open
            setActiveTab(tabId);
            if (!isOpen) {
                onToggle?.();
            }
        }
    };

    return (
        <div className="right-activity-bar">
            {/* Tab buttons */}
            <div className="right-activity-bar__tabs">
                {RIGHT_PANEL_TABS.map((tab, index) => {
                    const Icon = tab.icon;
                    const isActive = activeTab === tab.id;
                    const showDivider = RIGHT_PANEL_DIVIDERS_AFTER.includes(tab.id);

                    return (
                        <React.Fragment key={tab.id}>
                            <button
                                className={`right-activity-bar__tab ${isActive ? 'active' : ''}`}
                                data-color={tab.color}
                                onClick={() => handleTabClick(tab.id)}
                                title={tab.label}
                                aria-label={tab.label}
                                aria-selected={isActive}
                            >
                                <Icon size={18} />
                                {!tab.implemented && (
                                    <span className="right-activity-bar__badge">Soon</span>
                                )}
                            </button>
                            {showDivider && (
                                <div className="right-activity-bar__divider" />
                            )}
                        </React.Fragment>
                    );
                })}
            </div>

            {/* Spacer pushes toggle to bottom */}
            <div className="right-activity-bar__spacer" />

            {/* Toggle panel button at bottom */}
            <div className="right-activity-bar__bottom">
                <button
                    className="right-activity-bar__tab right-activity-bar__toggle"
                    onClick={onToggle}
                    title={isOpen ? 'Collapse Panel' : 'Expand Panel'}
                    aria-label={isOpen ? 'Collapse Panel' : 'Expand Panel'}
                >
                    {isOpen ? <PanelRightClose size={18} /> : <ChevronLeft size={18} />}
                </button>
            </div>
        </div>
    );
}

export default RightActivityBar;