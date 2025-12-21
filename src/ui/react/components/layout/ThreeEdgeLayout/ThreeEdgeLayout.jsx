// src/ui/react/components/layout/ThreeEdgeLayout/ThreeEdgeLayout.jsx
// Main layout orchestrator for the three-edge panel system
// CSS Grid layout with separated activity bars and panel content
//
// UPDATED: Now supports BOTH secondary bar patterns for backward compatibility:
// - Pattern 1 (legacy): secondaryTopBarZones={{ left, center, right }}
// - Pattern 2 (recommended): secondaryTopBar={<SecondaryHeader {...props} />}

import React, { useMemo, cloneElement, useCallback, isValidElement } from 'react';
import { LayoutPanelProvider } from '@UI/react/components/panels/LayoutPanel/LayoutPanelContext';
import { LayoutPanel } from '@UI/react/components/panels/LayoutPanel';
import { CanvasWorkspace } from '@UI/react/components/workspace';
import { useLayoutState, usePanelPersistence, PANEL_CONSTRAINTS, useResizeHandler } from './ThreeEdgeLayout.logic.js';
import './ThreeEdgeLayout.scss';

/**
 * ThreeEdgeLayout - Main application layout container
 *
 * SUPPORTS TWO PATTERNS:
 * 
 * Pattern 1 - Zone Objects (legacy, for gradual migration):
 * ```jsx
 * <ThreeEdgeLayout
 *   secondaryTopBarZones={{ left: <Comp/>, center: <Comp/>, right: <Comp/> }}
 *   secondaryBottomBarZones={{ left: <Comp/>, center: <Comp/>, right: <Comp/> }}
 * />
 * ```
 * 
 * Pattern 2 - Rendered Components (recommended):
 * ```jsx
 * <ThreeEdgeLayout
 *   secondaryTopBar={<SecondaryHeader {...props} />}
 *   secondaryBottomBar={<SecondaryFooter {...props} />}
 * />
 * ```
 * 
 * When using Pattern 2, components receive layout props via cloneElement:
 * - leftPanelWidth, rightPanelWidth, leftPanelOpen, rightPanelOpen
 */
export function ThreeEdgeLayout({
    topBar,
    centerPanel,
    bottomBar,
    leftActivityBar,
    leftPanelContent,
    rightActivityBar,
    rightPanelContent,
    // Pattern 1: Zone objects (legacy)
    secondaryTopBarZones,    // { left, center, right }
    secondaryBottomBarZones, // { left, center, right }
    // Pattern 2: Rendered components (recommended)
    secondaryTopBar,         // <SecondaryHeader {...props} />
    secondaryBottomBar,      // <SecondaryFooter {...props} />
    children, // Additional content rendered inside LayoutContext (e.g., floating panels)
}) {
    // Layout state management
    const {
        leftOpen,
        setLeftOpen,
        rightOpen,
        setRightOpen,
        leftWidth,
        setLeftWidth,
        rightWidth,
        setRightWidth
    } = useLayoutState();

    // Persist state to localStorage
    usePanelPersistence({
        leftOpen,
        rightOpen,
        leftWidth,
        rightWidth
    });

    // Calculate actual widths for secondary bar zones
    const layoutDimensions = useMemo(() => ({
        leftPanelWidth: leftOpen ? leftWidth : PANEL_CONSTRAINTS.left.collapsed,
        rightPanelWidth: rightOpen ? rightWidth : PANEL_CONSTRAINTS.right.collapsed,
        leftPanelOpen: leftOpen,
        rightPanelOpen: rightOpen,
    }), [leftOpen, leftWidth, rightOpen, rightWidth]);

    // Context value for child components
    const contextValue = useMemo(() => ({
        leftOpen,
        setLeftOpen,
        rightOpen,
        setRightOpen,
        leftWidth,
        rightWidth,
        ...layoutDimensions
    }), [leftOpen, setLeftOpen, rightOpen, setRightOpen, leftWidth, rightWidth, layoutDimensions]);

    return (
        <LayoutContext.Provider value={contextValue}>
            <GridZonesLayout
                topBar={topBar}
                leftActivityBar={leftActivityBar}
                leftPanelContent={leftPanelContent}
                rightActivityBar={rightActivityBar}
                rightPanelContent={rightPanelContent}
                // Pass both patterns - GridZonesLayout handles them
                secondaryTopBarZones={secondaryTopBarZones}
                secondaryBottomBarZones={secondaryBottomBarZones}
                secondaryTopBar={secondaryTopBar}
                secondaryBottomBar={secondaryBottomBar}
                centerPanel={centerPanel}
                bottomBar={bottomBar}
                leftOpen={leftOpen}
                setLeftOpen={setLeftOpen}
                rightOpen={rightOpen}
                setRightOpen={setRightOpen}
                leftWidth={leftWidth}
                setLeftWidth={setLeftWidth}
                rightWidth={rightWidth}
                setRightWidth={setRightWidth}
                layoutDimensions={layoutDimensions}
            />
            {/* Render children inside LayoutContext (e.g., floating panels) */}
            {children}
        </LayoutContext.Provider>
    );
}

// =============================================================================
// GRID STYLES HOOK
// =============================================================================

function useGridStyles(leftOpen, rightOpen, leftWidth, rightWidth) {
    return useMemo(() => {
        const leftActivityWidth = PANEL_CONSTRAINTS.left.collapsed;
        const rightActivityWidth = PANEL_CONSTRAINTS.right.collapsed;

        const leftContentWidth = leftOpen
            ? Math.max(0, leftWidth - leftActivityWidth)
            : 0;
        const rightContentWidth = rightOpen
            ? Math.max(0, rightWidth - rightActivityWidth)
            : 0;

        return {
            '--left-activity-width': `${leftActivityWidth}px`,
            '--right-activity-width': `${rightActivityWidth}px`,
            '--left-content-width': `${leftContentWidth}px`,
            '--right-content-width': `${rightContentWidth}px`,
            '--sec-bar-left-min': leftOpen ? `${leftWidth}px` : '180px',
            '--sec-bar-right-min': rightOpen ? `${rightWidth}px` : '180px',
        };
    }, [leftOpen, rightOpen, leftWidth, rightWidth]);
}

// =============================================================================
// GRID ZONES LAYOUT
// =============================================================================

function GridZonesLayout({
    topBar,
    leftActivityBar,
    leftPanelContent,
    rightActivityBar,
    rightPanelContent,
    // Pattern 1: Zone objects
    secondaryTopBarZones,
    secondaryBottomBarZones,
    // Pattern 2: Rendered components
    secondaryTopBar,
    secondaryBottomBar,
    centerPanel,
    bottomBar,
    leftOpen,
    setLeftOpen,
    rightOpen,
    setRightOpen,
    leftWidth,
    setLeftWidth,
    rightWidth,
    setRightWidth,
    layoutDimensions,
}) {
    const { isResizing: leftResizing, handleMouseDown: leftMouseDown } = useResizeHandler('left', setLeftWidth);
    const { isResizing: rightResizing, handleMouseDown: rightMouseDown } = useResizeHandler('right', setRightWidth);

    const gridStyles = useGridStyles(leftOpen, rightOpen, leftWidth, rightWidth);

    const layoutClassName = [
        'three-edge-layout',
        'three-edge-layout--grid-zones',
        !leftOpen && 'three-edge-layout--left-collapsed',
        !rightOpen && 'three-edge-layout--right-collapsed',
    ].filter(Boolean).join(' ');

    // ==========================================================================
    // SECONDARY BAR RENDERING - Supports both patterns
    // ==========================================================================

    const renderSecondaryTopBar = () => {
        // Pattern 2: Rendered component (preferred)
        if (secondaryTopBar && isValidElement(secondaryTopBar)) {
            // Clone and inject layout dimensions so component can use them
            // The wrapper uses flex to ensure children fill width
            return (
                <div
                    className="three-edge-layout__sec-top three-edge-layout__sec-top--component"
                    style={{ display: 'flex', width: '100%' }}
                >
                    {cloneElement(secondaryTopBar, {
                        ...layoutDimensions,
                        style: { ...(secondaryTopBar.props?.style || {}), width: '100%' }
                    })}
                </div>
            );
        }

        // Pattern 1: Zone objects (legacy)
        const secTopLeft = secondaryTopBarZones?.left || null;
        const secTopCenter = secondaryTopBarZones?.center || null;
        const secTopRight = secondaryTopBarZones?.right || null;

        if (secTopLeft || secTopCenter || secTopRight) {
            return (
                <div className="three-edge-layout__sec-top">
                    <div className="three-edge-layout__sec-top-left">
                        {secTopLeft}
                    </div>
                    <div className="three-edge-layout__sec-top-center">
                        {secTopCenter}
                    </div>
                    <div className="three-edge-layout__sec-top-right">
                        {secTopRight}
                    </div>
                </div>
            );
        }

        return null;
    };

    const renderSecondaryBottomBar = () => {
        // Pattern 2: Rendered component (preferred)
        if (secondaryBottomBar && isValidElement(secondaryBottomBar)) {
            return (
                <div
                    className="three-edge-layout__sec-bot three-edge-layout__sec-bot--component"
                    style={{ display: 'flex', width: '100%' }}
                >
                    {cloneElement(secondaryBottomBar, {
                        ...layoutDimensions,
                        style: { ...(secondaryBottomBar.props?.style || {}), width: '100%' }
                    })}
                </div>
            );
        }

        // Pattern 1: Zone objects (legacy)
        const secBotLeft = secondaryBottomBarZones?.left || null;
        const secBotCenter = secondaryBottomBarZones?.center || null;
        const secBotRight = secondaryBottomBarZones?.right || null;

        if (secBotLeft || secBotCenter || secBotRight) {
            return (
                <div className="three-edge-layout__sec-bot">
                    <div className="three-edge-layout__sec-bot-left">
                        {secBotLeft}
                    </div>
                    <div className="three-edge-layout__sec-bot-center">
                        {secBotCenter}
                    </div>
                    <div className="three-edge-layout__sec-bot-right">
                        {secBotRight}
                    </div>
                </div>
            );
        }

        return null;
    };

    return (
        <div className={layoutClassName} style={gridStyles}>
            {/* Row 1: Top Bar (spans all columns) */}
            {topBar && (
                <div className="three-edge-layout__top">
                    {topBar}
                </div>
            )}

            {/* Row 2: Secondary Top Bar */}
            {renderSecondaryTopBar()}

            {/* Row 3: Main Content Area */}
            <div className="three-edge-layout__left-activity">
                {leftActivityBar}
            </div>

            {leftOpen && (
                <div className="three-edge-layout__left-panel">
                    {leftPanelContent}
                    <div
                        className={`grid-resize-handle grid-resize-handle--left ${leftResizing ? 'grid-resize-handle--active' : ''}`}
                        onMouseDown={leftMouseDown}
                    />
                </div>
            )}

            <div className="three-edge-layout__workspace">
                {centerPanel}
            </div>

            {rightOpen && (
                <div className="three-edge-layout__right-panel">
                    <div
                        className={`grid-resize-handle grid-resize-handle--right ${rightResizing ? 'grid-resize-handle--active' : ''}`}
                        onMouseDown={rightMouseDown}
                    />
                    {rightPanelContent}
                </div>
            )}

            <div className="three-edge-layout__right-activity">
                {rightActivityBar}
            </div>

            {/* Row 4: Secondary Bottom Bar */}
            {renderSecondaryBottomBar()}

            {/* Row 5: Status Bar (spans all columns) */}
            {bottomBar && (
                <div className="three-edge-layout__bottom">
                    {bottomBar}
                </div>
            )}
        </div>
    );
}

export { GridZonesLayout, useGridStyles };

// =============================================================================
// LAYOUT CONTEXT
// =============================================================================

export const LayoutContext = React.createContext({
    leftOpen: true,
    setLeftOpen: () => { },
    rightOpen: true,
    setRightOpen: () => { },
    leftWidth: PANEL_CONSTRAINTS.left.default,
    rightWidth: PANEL_CONSTRAINTS.right.default,
    leftPanelWidth: PANEL_CONSTRAINTS.left.default,
    rightPanelWidth: PANEL_CONSTRAINTS.right.default,
    leftPanelOpen: true,
    rightPanelOpen: true,
});

export function useLayoutContext() {
    return React.useContext(LayoutContext);
}