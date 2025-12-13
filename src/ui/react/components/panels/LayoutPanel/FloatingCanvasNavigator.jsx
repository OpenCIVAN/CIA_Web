// src/ui/react/components/panels/LayoutPanel/FloatingCanvasNavigator.jsx
// Floating Canvas Navigator - renders the navigator based on dock position
//
// IMPORTANT: Import DOCK_POSITIONS from LayoutPanelContext, NOT from
// CanvasNavigator.logic.js to ensure consistent comparisons.

import React, { memo, useState, useEffect, useCallback, useRef } from 'react';
import { useLayoutPanelContext, DOCK_POSITIONS } from './LayoutPanelContext';
import { CanvasNavigator } from './components/CanvasNavigator/CanvasNavigator';
import { Grid3X3, Maximize2 } from 'lucide-react';
import './FloatingCanvasNavigator.scss';

// Corner position styles
const CORNER_POSITIONS = {
    [DOCK_POSITIONS.TOP_LEFT]: { top: 70, left: 16 },
    [DOCK_POSITIONS.TOP_RIGHT]: { top: 70, right: 16 },
    [DOCK_POSITIONS.BOTTOM_LEFT]: { bottom: 70, left: 16 },
    [DOCK_POSITIONS.BOTTOM_RIGHT]: { bottom: 70, right: 16 },
};

// LocalStorage key for float position
const FLOAT_POSITION_KEY = 'cia-navigator-float-position';

/**
 * Load float position from localStorage
 */
function loadFloatPosition() {
    try {
        const stored = localStorage.getItem(FLOAT_POSITION_KEY);
        if (stored) {
            const parsed = JSON.parse(stored);
            if (typeof parsed.x === 'number' && typeof parsed.y === 'number') {
                return {
                    x: Math.max(0, Math.min(window.innerWidth - 500, parsed.x)),
                    y: Math.max(60, Math.min(window.innerHeight - 400, parsed.y)),
                };
            }
        }
    } catch (e) {
        console.warn('[FloatingCanvasNavigator] Failed to load position:', e);
    }
    return { x: 100, y: 100 };
}

/**
 * FloatingCanvasNavigator
 *
 * Renders the CanvasNavigator in floating/corner positions.
 * 
 * RENDER CONDITIONS:
 * - Returns null if dockPosition === LEFT_PANEL (LayoutPanel handles that)
 * - Returns minimized button if dockPosition === MINIMIZED
 * - Otherwise renders the full navigator
 */
export const FloatingCanvasNavigator = memo(function FloatingCanvasNavigator({
    className = '',
}) {
    const context = useLayoutPanelContext();

    // Float position state (persisted)
    const [floatPosition, setFloatPosition] = useState(loadFloatPosition);

    // Drag state
    const [isDragging, setIsDragging] = useState(false);
    const dragStartRef = useRef(null);
    const containerRef = useRef(null);

    // ==========================================================================
    // EARLY RETURNS - Check if we should render
    // ==========================================================================

    // Don't render if no context available
    if (!context?.logic) {
        console.log('[FloatingCanvasNavigator] No context - not rendering');
        return null;
    }

    const { logic, dockPosition: contextDockPosition } = context;

    // Get dock position - prefer direct context property over logic
    const dockPosition = contextDockPosition || logic.dockPosition || DOCK_POSITIONS.FLOAT;
    const setDockPosition = logic.setDockPosition || (() => { });

    // DEBUG: Log render decision
    console.log('[FloatingCanvasNavigator] dockPosition:', dockPosition,
        '| Is LEFT_PANEL:', dockPosition === DOCK_POSITIONS.LEFT_PANEL);

    // DON'T render if docked in left panel - LayoutPanel handles that
    if (dockPosition === DOCK_POSITIONS.LEFT_PANEL) {
        console.log('[FloatingCanvasNavigator] Docked in left panel - LayoutPanel will render');
        return null;
    }

    // ==========================================================================
    // DRAG HANDLING
    // ==========================================================================

    // Save float position to localStorage when it changes
    useEffect(() => {
        if (dockPosition === DOCK_POSITIONS.FLOAT && !isDragging) {
            try {
                localStorage.setItem(FLOAT_POSITION_KEY, JSON.stringify(floatPosition));
            } catch (e) {
                console.warn('[FloatingCanvasNavigator] Failed to save position:', e);
            }
        }
    }, [floatPosition, dockPosition, isDragging]);

    // Drag start handler
    const handleDragStart = useCallback((e) => {
        // Only allow dragging in float mode
        if (dockPosition !== DOCK_POSITIONS.FLOAT) return;

        // Don't drag from interactive elements
        if (e.target.closest('button, input, .canvas-navigator__grid')) return;

        // Only drag from header area
        if (!e.target.closest('.canvas-navigator__header, .canvas-navigator__drag-handle')) return;

        e.preventDefault();
        setIsDragging(true);
        dragStartRef.current = {
            mouseX: e.clientX,
            mouseY: e.clientY,
            posX: floatPosition.x,
            posY: floatPosition.y,
        };

        document.body.style.cursor = 'grabbing';
        document.body.style.userSelect = 'none';
    }, [dockPosition, floatPosition]);

    // Drag move handler
    const handleDragMove = useCallback((e) => {
        if (!isDragging || !dragStartRef.current) return;

        const dx = e.clientX - dragStartRef.current.mouseX;
        const dy = e.clientY - dragStartRef.current.mouseY;

        setFloatPosition({
            x: Math.max(0, Math.min(window.innerWidth - 200, dragStartRef.current.posX + dx)),
            y: Math.max(60, Math.min(window.innerHeight - 100, dragStartRef.current.posY + dy)),
        });
    }, [isDragging]);

    // Drag end handler
    const handleDragEnd = useCallback(() => {
        setIsDragging(false);
        dragStartRef.current = null;
        document.body.style.cursor = '';
        document.body.style.userSelect = '';
    }, []);

    // Global mouse event listeners for drag
    useEffect(() => {
        if (isDragging) {
            window.addEventListener('mousemove', handleDragMove);
            window.addEventListener('mouseup', handleDragEnd);
            return () => {
                window.removeEventListener('mousemove', handleDragMove);
                window.removeEventListener('mouseup', handleDragEnd);
                document.body.style.cursor = '';
                document.body.style.userSelect = '';
            };
        }
    }, [isDragging, handleDragMove, handleDragEnd]);

    // ==========================================================================
    // RENDER - MINIMIZED STATE
    // ==========================================================================

    if (dockPosition === DOCK_POSITIONS.MINIMIZED) {
        return (
            <button
                className={`floating-canvas-navigator floating-canvas-navigator--minimized ${className}`}
                onClick={() => setDockPosition(DOCK_POSITIONS.FLOAT)}
                title="Open Canvas Navigator"
            >
                <Grid3X3 size={14} />
                <span>Navigator</span>
                <Maximize2 size={12} />
            </button>
        );
    }

    // ==========================================================================
    // RENDER - FLOATING/CORNER STATE
    // ==========================================================================

    // Calculate position style
    let positionStyle = {};

    if (dockPosition === DOCK_POSITIONS.FLOAT) {
        positionStyle = {
            position: 'fixed',
            left: floatPosition.x,
            top: floatPosition.y,
        };
    } else if (CORNER_POSITIONS[dockPosition]) {
        positionStyle = {
            position: 'fixed',
            ...CORNER_POSITIONS[dockPosition],
        };
    }

    // Check if corner docked (for opacity effect)
    const isCornerDocked = Object.keys(CORNER_POSITIONS).includes(dockPosition);

    return (
        <div
            ref={containerRef}
            className={`floating-canvas-navigator ${isDragging ? 'floating-canvas-navigator--dragging' : ''} ${isCornerDocked ? 'floating-canvas-navigator--corner' : ''} ${className}`}
            style={positionStyle}
            onMouseDown={handleDragStart}
        >
            <CanvasNavigator
                logic={logic}
                onClose={() => setDockPosition(DOCK_POSITIONS.MINIMIZED)}
            />
        </div>
    );
});

export default FloatingCanvasNavigator;