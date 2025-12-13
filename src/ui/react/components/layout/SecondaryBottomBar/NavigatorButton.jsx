/**
 * Navigator Button for Secondary Bottom Bar
 * 
 * This button opens/closes the Canvas Navigator and should be placed
 * in the LEFT zone of the SecondaryBottomBar.
 * 
 * File: src/ui/react/components/layout/SecondaryBottomBar/NavigatorButton.jsx
 */

import React, { memo } from 'react';
import { Grid3X3, Maximize2, Minimize2, PanelLeft } from 'lucide-react';
import { useNavigatorButton } from '@UI/react/components/panels/LayoutPanel/FloatingCanvasNavigator';
import { DOCK_POSITIONS } from '@UI/react/components/panels/LayoutPanel/LayoutPanelContext';
import './NavigatorButton.scss';

/**
 * NavigatorButton - Opens/closes the Canvas Navigator
 * 
 * States:
 * - isFloating: Navigator is visible as floating panel → show "minimize" action
 * - isMinimized: Navigator is hidden → show "open" action
 * - isDocked: Navigator is in left panel → show "undock" action
 */
export const NavigatorButton = memo(function NavigatorButton({ className = '' }) {
    const {
        isMinimized,
        isDocked,
        isFloating,
        toggleNavigator,
        setDockPosition,
    } = useNavigatorButton();

    // Determine button state and action
    const getButtonConfig = () => {
        if (isFloating) {
            return {
                icon: Minimize2,
                label: 'Hide Navigator',
                color: 'amber',
                active: true,
                onClick: () => setDockPosition(DOCK_POSITIONS.MINIMIZED),
            };
        }
        if (isDocked) {
            return {
                icon: PanelLeft,
                label: 'Navigator (Docked)',
                color: 'blue',
                active: true,
                onClick: () => setDockPosition(DOCK_POSITIONS.FLOAT),
            };
        }
        // Minimized
        return {
            icon: Grid3X3,
            label: 'Open Navigator',
            color: 'amber',
            active: false,
            onClick: () => setDockPosition(DOCK_POSITIONS.FLOAT),
        };
    };

    const config = getButtonConfig();
    const Icon = config.icon;

    return (
        <button
            className={`navigator-button ${config.active ? 'navigator-button--active' : ''} navigator-button--${config.color} ${className}`}
            onClick={config.onClick}
            title={config.label}
        >
            <Icon size={14} />
            <span className="navigator-button__label">Navigator</span>
        </button>
    );
});

export default NavigatorButton;