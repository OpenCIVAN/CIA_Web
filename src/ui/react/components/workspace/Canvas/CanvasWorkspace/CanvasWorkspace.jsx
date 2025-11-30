// src/ui/react/components/workspace/Canvas/CanvasWorkspace/CanvasWorkspace.jsx
// Integration component for the new canvas system
//
// This wraps CanvasGrid with workspace selection and subset management

import React, { useState, useEffect, useCallback } from 'react';
import { CanvasGrid } from '@UI/react/components/workspace';
import { MiniMap } from '@UI/react/components/workspace';
import { ViewportNavigator } from '@UI/react/components/workspace';
import { WorkspaceSelector } from '@UI/react/components/workspace';
import { SubsetPanel } from '@UI/react/components/panels/SubsetPanel.jsx';
import { FocusModeOverlay } from '@UI/react/components/panels/FocusModeOverlay.jsx';

import { useCanvas, useSubsets } from '@UI/react/hooks/useCanvas.js';
import { canvasManager } from '@Core/data/managers/CanvasManager.js';
import { workspace as log } from '@Utils/logger.js';

import './CanvasWorkspace.scss';

/**
 * CanvasWorkspace - Full canvas system with workspace selection
 */
export function CanvasWorkspace({ userId, projectId }) {
    const [activeWorkspace, setActiveWorkspace] = useState(null);
    const [activeCanvasId, setActiveCanvasId] = useState(null);
    const [showMiniMap, setShowMiniMap] = useState(true);
    const [showSubsetPanel, setShowSubsetPanel] = useState(false);

    // Canvas hook for the active canvas
    const {
        canvas,
        viewport,
        visiblePlacements,
        isLoading,
        error,
        moveViewport,
        navigateTo,
    } = useCanvas(activeCanvasId);

    // Subsets hook
    const {
        subsets,
        focusedSubset,
        isFocusMode,
        enterFocusMode,
        exitFocusMode,
    } = useSubsets(activeCanvasId);

    // Load initial workspace/canvas
    useEffect(() => {
        const loadWorkspace = async () => {
            if (!projectId) {
                log.warn('No projectId provided to CanvasWorkspace');
                return;
            }

            try {
                log.debug(`Loading canvases for project: ${projectId}`);

                // Get or create personal canvas from server
                const personalCanvas = await canvasManager.getPersonalCanvas(projectId);

                if (personalCanvas) {
                    log.debug(`Got personal canvas: ${personalCanvas.id}`);
                    setActiveCanvasId(personalCanvas.id);
                    setActiveWorkspace({ type: 'personal', canvasId: personalCanvas.id });
                }
            } catch (error) {
                log.error('Failed to load workspace:', error);
            }
        };

        if (projectId) {
            loadWorkspace();
        }
    }, [projectId, userId]);

    // Handle workspace change
    const handleWorkspaceChange = useCallback((workspace) => {
        setActiveWorkspace(workspace);
        if (workspace.canvasIds.length > 0) {
            setActiveCanvasId(workspace.activeCanvasId || workspace.canvasIds[0]);
        } else {
            setActiveCanvasId(null);
        }
    }, []);

    // Handle placement click
    const handlePlacementClick = useCallback((placement) => {
        log.debug('Placement clicked:', placement);
        // TODO: Open content or navigate
    }, []);

    // Handle cell double-click (add content)
    const handleCellDoubleClick = useCallback((row, col) => {
        log.debug('Add content at:', row, col);
        // TODO: Show add content dialog
    }, []);

    return (
        <div className="canvas-workspace">
            {/* Header with workspace selector */}
            <div className="canvas-workspace__header">
                <WorkspaceSelector
                    userId={userId}
                    onWorkspaceChange={handleWorkspaceChange}
                />

                <div className="canvas-workspace__tools">
                    <button
                        className={`canvas-workspace__tool-btn ${showMiniMap ? 'active' : ''}`}
                        onClick={() => setShowMiniMap(!showMiniMap)}
                        title="Toggle Mini Map"
                    >
                        🗺️
                    </button>
                    <button
                        className={`canvas-workspace__tool-btn ${showSubsetPanel ? 'active' : ''}`}
                        onClick={() => setShowSubsetPanel(!showSubsetPanel)}
                        title="Focus Groups"
                    >
                        🎯
                    </button>
                </div>
            </div>

            {/* Main content area */}
            <div className="canvas-workspace__content">
                {/* Canvas grid */}
                <div className="canvas-workspace__canvas">
                    {isLoading ? (
                        <div className="canvas-workspace__loading">Loading canvas...</div>
                    ) : error ? (
                        <div className="canvas-workspace__error">{error}</div>
                    ) : activeCanvasId ? (
                        <CanvasGrid
                            canvasId={activeCanvasId}
                            viewport={viewport}
                            placements={visiblePlacements}
                            focusedSubset={focusedSubset}
                            onPlacementClick={handlePlacementClick}
                            onCellDoubleClick={handleCellDoubleClick}
                            onViewportChange={moveViewport}
                        />
                    ) : (
                        <div className="canvas-workspace__empty">
                            <p>No canvas selected</p>
                            <button onClick={() => {/* TODO: Create canvas */ }}>
                                Create Canvas
                            </button>
                        </div>
                    )}

                    {/* Viewport navigator */}
                    <ViewportNavigator
                        viewport={viewport}
                        canvasDimensions={canvas?.dimensions || { rows: 3, cols: 3 }}
                        onNavigate={navigateTo}
                    />
                </div>

                {/* Mini map overlay */}
                {showMiniMap && canvas && (
                    <div className="canvas-workspace__minimap">
                        <MiniMap
                            canvas={canvas}
                            viewport={viewport}
                            onViewportChange={navigateTo}
                        />
                    </div>
                )}

                {/* Subset panel (right sidebar) */}
                {showSubsetPanel && (
                    <div className="canvas-workspace__subset-panel">
                        <SubsetPanel
                            canvasId={activeCanvasId}
                            subsets={subsets}
                            focusedSubset={focusedSubset}
                            onEnterFocus={enterFocusMode}
                            onExitFocus={exitFocusMode}
                        />
                    </div>
                )}
            </div>

            {/* Focus mode overlay */}
            {isFocusMode && focusedSubset && (
                <FocusModeOverlay
                    subset={focusedSubset}
                    onExit={exitFocusMode}
                />
            )}
        </div>
    );
}

export default CanvasWorkspace;