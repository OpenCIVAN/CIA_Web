// src/ui/react/hooks/useViewportSync.js
// Viewport synchronization between CanvasNavigator and CanvasGrid
//
// Problem: useCanvas() creates local viewport state per hook instance.
// CanvasNavigator and CanvasGrid each have separate viewports.
//
// Solution: Event-based sync. When navigator changes viewport,
// it dispatches an event that CanvasGrid listens to, and vice versa.

import { useEffect, useCallback, useRef } from "react";

// Event names
export const VIEWPORT_EVENTS = {
  // Navigator → Grid: User clicked/navigated in navigator
  NAVIGATE_TO: "cia:viewport-navigate-to",
  // Navigator → Grid: User moved viewport (d-pad, arrow keys)
  MOVE_VIEWPORT: "cia:viewport-move",
  // Grid → Navigator: Viewport changed (scroll, pan, etc.)
  VIEWPORT_CHANGED: "cia:viewport-changed",
  // Sync request: Ask for current viewport state
  SYNC_REQUEST: "cia:viewport-sync-request",
  // Sync response: Current viewport state
  SYNC_RESPONSE: "cia:viewport-sync-response",
};

/**
 * Dispatch a viewport navigation event (go to specific cell)
 * @param {number} row - Target row
 * @param {number} col - Target column
 * @param {string} [canvasId] - Optional canvas ID for multi-canvas support
 */
export function dispatchNavigateTo(row, col, canvasId = null) {
  window.dispatchEvent(
    new CustomEvent(VIEWPORT_EVENTS.NAVIGATE_TO, {
      detail: { row, col, canvasId },
    })
  );
}

/**
 * Dispatch a viewport move event (relative movement)
 * @param {number} deltaRow - Row delta (-1, 0, 1)
 * @param {number} deltaCol - Column delta (-1, 0, 1)
 * @param {string} [canvasId] - Optional canvas ID
 */
export function dispatchMoveViewport(deltaRow, deltaCol, canvasId = null) {
  window.dispatchEvent(
    new CustomEvent(VIEWPORT_EVENTS.MOVE_VIEWPORT, {
      detail: { deltaRow, deltaCol, canvasId },
    })
  );
}

/**
 * Dispatch viewport changed event (notify others of current state)
 * @param {Object} viewport - { row, col, rows, cols }
 * @param {string} [canvasId] - Optional canvas ID
 */
export function dispatchViewportChanged(viewport, canvasId = null) {
  window.dispatchEvent(
    new CustomEvent(VIEWPORT_EVENTS.VIEWPORT_CHANGED, {
      detail: { viewport, canvasId },
    })
  );
}

/**
 * Hook for viewport event listening (used by CanvasGrid)
 *
 * @param {Object} options
 * @param {Function} options.onNavigateTo - Called when navigate-to event received
 * @param {Function} options.onMoveViewport - Called when move-viewport event received
 * @param {string} [options.canvasId] - Only listen for events matching this canvas
 */
export function useViewportEventListener({
  onNavigateTo,
  onMoveViewport,
  canvasId = null,
}) {
  useEffect(() => {
    const handleNavigateTo = (e) => {
      const { row, col, canvasId: eventCanvasId } = e.detail;
      // If canvasId specified, only handle matching events
      if (canvasId && eventCanvasId && eventCanvasId !== canvasId) return;
      onNavigateTo?.(row, col);
    };

    const handleMoveViewport = (e) => {
      const { deltaRow, deltaCol, canvasId: eventCanvasId } = e.detail;
      if (canvasId && eventCanvasId && eventCanvasId !== canvasId) return;
      onMoveViewport?.(deltaRow, deltaCol);
    };

    window.addEventListener(VIEWPORT_EVENTS.NAVIGATE_TO, handleNavigateTo);
    window.addEventListener(VIEWPORT_EVENTS.MOVE_VIEWPORT, handleMoveViewport);

    return () => {
      window.removeEventListener(VIEWPORT_EVENTS.NAVIGATE_TO, handleNavigateTo);
      window.removeEventListener(
        VIEWPORT_EVENTS.MOVE_VIEWPORT,
        handleMoveViewport
      );
    };
  }, [onNavigateTo, onMoveViewport, canvasId]);
}

/**
 * Hook for syncing viewport state with external changes (used by CanvasNavigator)
 *
 * @param {Object} options
 * @param {Function} options.onViewportChanged - Called when viewport-changed event received
 * @param {string} [options.canvasId] - Only listen for events matching this canvas
 */
export function useViewportSyncListener({
  onViewportChanged,
  canvasId = null,
}) {
  useEffect(() => {
    const handleViewportChanged = (e) => {
      const { viewport, canvasId: eventCanvasId } = e.detail;
      if (canvasId && eventCanvasId && eventCanvasId !== canvasId) return;
      onViewportChanged?.(viewport);
    };

    window.addEventListener(
      VIEWPORT_EVENTS.VIEWPORT_CHANGED,
      handleViewportChanged
    );

    return () => {
      window.removeEventListener(
        VIEWPORT_EVENTS.VIEWPORT_CHANGED,
        handleViewportChanged
      );
    };
  }, [onViewportChanged, canvasId]);
}

/**
 * Combined hook for two-way viewport sync
 * Used when a component both sends and receives viewport events
 *
 * @param {Object} options
 * @param {Object} options.viewport - Current viewport state
 * @param {Function} options.setViewport - Function to update viewport
 * @param {string} [options.canvasId] - Canvas ID for filtering
 * @param {boolean} [options.isSource] - If true, broadcasts changes. If false, listens only.
 */
export function useViewportSync({
  viewport,
  setViewport,
  canvasId = null,
  isSource = false,
}) {
  const lastBroadcast = useRef(null);

  // Broadcast viewport changes (debounced to prevent loops)
  useEffect(() => {
    if (!isSource) return;

    // Check if viewport actually changed
    const key = `${viewport.row}-${viewport.col}-${viewport.rows}-${viewport.cols}`;
    if (lastBroadcast.current === key) return;
    lastBroadcast.current = key;

    dispatchViewportChanged(viewport, canvasId);
  }, [viewport, canvasId, isSource]);

  // Listen for external viewport changes
  useViewportSyncListener({
    onViewportChanged: useCallback(
      (newViewport) => {
        // Don't update if we're the source (prevent loops)
        if (isSource) return;
        setViewport(newViewport);
      },
      [isSource, setViewport]
    ),
    canvasId,
  });

  // Return dispatch functions for convenience
  return {
    navigateTo: useCallback(
      (row, col) => {
        dispatchNavigateTo(row, col, canvasId);
      },
      [canvasId]
    ),
    moveViewport: useCallback(
      (deltaRow, deltaCol) => {
        dispatchMoveViewport(deltaRow, deltaCol, canvasId);
      },
      [canvasId]
    ),
  };
}

export default {
  VIEWPORT_EVENTS,
  dispatchNavigateTo,
  dispatchMoveViewport,
  dispatchViewportChanged,
  useViewportEventListener,
  useViewportSyncListener,
  useViewportSync,
};
