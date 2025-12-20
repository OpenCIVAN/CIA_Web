/**
 * @file useInstanceSelector.js
 * @description Hook for managing instance selection state in the SecondaryFooter.
 *
 * Provides:
 * - Active instance from workspaceManager
 * - Views currently on canvas (active, placed)
 * - Available views (can be placed on canvas)
 * - Handlers for selection and placement
 *
 * @example
 * const {
 *   activeInstance,
 *   onCanvasViews,
 *   availableViews,
 *   handleSelectInstance,
 *   handlePlaceView
 * } = useInstanceSelector({ workspaceId });
 */

import { useState, useEffect, useMemo, useCallback } from "react";
import { getViewConfigurationManager } from "@Init/appInitializer.js";
import { workspaceManager } from "@Core/instances/workspaceManager.js";
import { canvasManager } from "@Core/data/managers/CanvasManager.js";
import { view as log } from "@Utils/logger.js";

/**
 * @typedef {Object} UseInstanceSelectorOptions
 * @property {string} workspaceId - Current workspace ID
 */

/**
 * @typedef {Object} InstanceInfo
 * @property {string} id - Instance ID
 * @property {string} name - Display name
 * @property {string} color - Instance color (hex)
 * @property {number} [count] - Number of selected instances (for multi-select)
 */

/**
 * @typedef {Object} CanvasViewInfo
 * @property {string} id - View ID
 * @property {string} name - View name
 * @property {string} color - View color (hex)
 * @property {Object} position - Grid position { row, col }
 */

/**
 * @typedef {Object} AvailableViewInfo
 * @property {string} id - View ID
 * @property {string} name - View name
 * @property {string} datasetName - Parent dataset name
 */

/**
 * @typedef {Object} UseInstanceSelectorReturn
 * @property {InstanceInfo|null} activeInstance - Currently active/focused instance
 * @property {CanvasViewInfo[]} onCanvasViews - Views currently on canvas
 * @property {AvailableViewInfo[]} availableViews - Views available to place
 * @property {Function} handleSelectInstance - Select/focus an instance
 * @property {Function} handlePlaceView - Place a view on canvas
 */

/**
 * Hook for instance selector state management.
 *
 * @param {UseInstanceSelectorOptions} options - Hook options
 * @returns {UseInstanceSelectorReturn} Instance selector state and handlers
 */
export function useInstanceSelector({ workspaceId } = {}) {
  const [activeInstance, setActiveInstance] = useState(null);
  const [views, setViews] = useState([]);
  const [refreshKey, setRefreshKey] = useState(0);

  // ===========================================================================
  // SUBSCRIBE TO ACTIVE INSTANCE CHANGES
  // ===========================================================================
  useEffect(() => {
    const updateActiveInstance = () => {
      try {
        const instance = workspaceManager?.getActiveInstance?.();
        if (instance) {
          setActiveInstance({
            id: instance.id,
            name: instance.name || instance.viewId || "Instance",
            color: instance.color?.hex || instance.color || "#60a5fa",
          });
        } else {
          setActiveInstance(null);
        }
      } catch (error) {
        log.warn("Failed to get active instance:", error);
        setActiveInstance(null);
      }
    };

    // Initial check
    updateActiveInstance();

    // Listen for instance changes
    const handleInstanceFocus = () => {
      updateActiveInstance();
    };

    // Event listeners for instance state changes
    window.addEventListener("cia:instance-focused", handleInstanceFocus);
    window.addEventListener("cia:active-instance-changed", handleInstanceFocus);
    window.addEventListener("cia:instance-created", handleInstanceFocus);
    window.addEventListener("cia:instance-deleted", handleInstanceFocus);

    // Listen to workspaceManager if it has event emitter
    if (workspaceManager?.on) {
      workspaceManager.on("instanceCreated", handleInstanceFocus);
      workspaceManager.on("instanceDeleted", handleInstanceFocus);
      workspaceManager.on("activeInstanceChanged", handleInstanceFocus);
    }

    return () => {
      window.removeEventListener("cia:instance-focused", handleInstanceFocus);
      window.removeEventListener(
        "cia:active-instance-changed",
        handleInstanceFocus
      );
      window.removeEventListener("cia:instance-created", handleInstanceFocus);
      window.removeEventListener("cia:instance-deleted", handleInstanceFocus);

      if (workspaceManager?.off) {
        workspaceManager.off("instanceCreated", handleInstanceFocus);
        workspaceManager.off("instanceDeleted", handleInstanceFocus);
        workspaceManager.off("activeInstanceChanged", handleInstanceFocus);
      }
    };
  }, []);

  // ===========================================================================
  // SUBSCRIBE TO VIEW CHANGES
  // ===========================================================================
  useEffect(() => {
    const viewManager = getViewConfigurationManager();

    const updateViews = () => {
      try {
        const allViews = viewManager?.getAllViews?.() || [];
        setViews(allViews);
      } catch (error) {
        log.warn("Failed to get views:", error);
        setViews([]);
      }
    };

    // Initial load
    updateViews();

    // Listen for view changes
    const handleViewChange = () => {
      updateViews();
      // Force re-render for computed values
      setRefreshKey((k) => k + 1);
    };

    // Canvas placement events
    window.addEventListener("cia:view-placed", handleViewChange);
    window.addEventListener("cia:view-removed", handleViewChange);
    window.addEventListener("cia:close-view", handleViewChange);

    // ViewConfigurationManager events
    if (viewManager?.on) {
      viewManager.on("viewCreated", handleViewChange);
      viewManager.on("viewUpdated", handleViewChange);
      viewManager.on("viewTrashed", handleViewChange);
      viewManager.on("viewDeleted", handleViewChange);
      viewManager.on("viewActivated", handleViewChange);
      viewManager.on("viewDeactivated", handleViewChange);
      viewManager.on("reconciled", handleViewChange);
    }

    return () => {
      window.removeEventListener("cia:view-placed", handleViewChange);
      window.removeEventListener("cia:view-removed", handleViewChange);
      window.removeEventListener("cia:close-view", handleViewChange);

      if (viewManager?.off) {
        viewManager.off("viewCreated", handleViewChange);
        viewManager.off("viewUpdated", handleViewChange);
        viewManager.off("viewTrashed", handleViewChange);
        viewManager.off("viewDeleted", handleViewChange);
        viewManager.off("viewActivated", handleViewChange);
        viewManager.off("viewDeactivated", handleViewChange);
        viewManager.off("reconciled", handleViewChange);
      }
    };
  }, []);

  // ===========================================================================
  // COMPUTE ON-CANVAS VIEWS
  // Views that are currently active and placed on the canvas grid
  // ===========================================================================
  const onCanvasViews = useMemo(() => {
    // Get placements from canvas manager
    const placements = canvasManager?.getPlacements?.() || [];

    // Filter to active views with canvas placement
    return views
      .filter((view) => {
        // Check if view is active (not trashed, not inactive)
        if (view.status === "trashed" || view.status === "inactive") {
          return false;
        }

        // Check if view has a canvas placement
        const hasPlacement = placements.some(
          (p) => p.content?.viewId === view.id || p.viewId === view.id
        );

        // Also check the view's own isActive flag
        return view.isActive || hasPlacement;
      })
      .map((view) => {
        // Find placement for position
        const placement = placements.find(
          (p) => p.content?.viewId === view.id || p.viewId === view.id
        );

        return {
          id: view.id,
          name: view.name || "Untitled View",
          color: view.color?.hex || view.color || "#60a5fa",
          position: placement
            ? { row: placement.row, col: placement.col }
            : { row: 0, col: 0 },
        };
      });
  }, [views, refreshKey]);

  // ===========================================================================
  // COMPUTE AVAILABLE VIEWS
  // Views that exist but are not currently on canvas
  // ===========================================================================
  const availableViews = useMemo(() => {
    const onCanvasIds = new Set(onCanvasViews.map((v) => v.id));

    return views
      .filter((view) => {
        // Not on canvas
        if (onCanvasIds.has(view.id)) return false;

        // Not trashed
        if (view.status === "trashed") return false;

        // Is a valid, placeable view
        return true;
      })
      .map((view) => ({
        id: view.id,
        name: view.name || "Untitled View",
        datasetName:
          view.datasetName || view.dataset?.name || "Unknown Dataset",
      }));
  }, [views, onCanvasViews, refreshKey]);

  // ===========================================================================
  // HANDLERS
  // ===========================================================================

  /**
   * Select/focus an instance on the canvas
   * @param {string} viewId - View ID to focus
   */
  const handleSelectInstance = useCallback((viewId) => {
    log.debug("Instance selector: selecting view", viewId);

    // Find the instance for this view
    if (workspaceManager) {
      const instances = workspaceManager.getInstances?.() || [];
      const instance = instances.find(
        (i) => i.viewId === viewId || i.id === viewId
      );

      if (instance) {
        // Set as active instance
        workspaceManager.setActiveInstance?.(instance.id);

        // Dispatch event for other components to react
        window.dispatchEvent(
          new CustomEvent("cia:instance-focused", {
            detail: { instanceId: instance.id, viewId },
          })
        );
      }
    }

    // Also navigate canvas to show the view
    // This could scroll the canvas grid to center on the selected view
    const placement = canvasManager?.getPlacementByViewId?.(viewId);
    if (placement) {
      window.dispatchEvent(
        new CustomEvent("cia:navigate-to-cell", {
          detail: { row: placement.row, col: placement.col },
        })
      );
    }
  }, []);

  /**
   * Place a view on the canvas
   * @param {string} viewId - View ID to place
   */
  const handlePlaceView = useCallback(
    (viewId) => {
      log.debug("Instance selector: placing view", viewId);

      const viewManager = getViewConfigurationManager();
      const view = viewManager?.getView?.(viewId);

      if (!view) {
        log.warn("Cannot place view: view not found", viewId);
        return;
      }

      // Find next available cell
      const nextCell = canvasManager?.getNextAvailableCell?.() || {
        row: 0,
        col: 0,
      };

      // Activate the view (mark as active)
      viewManager?.activateView?.(viewId);

      // Place on canvas
      if (canvasManager?.placeView) {
        canvasManager.placeView(viewId, nextCell.row, nextCell.col);
      }

      // Dispatch event for other components
      window.dispatchEvent(
        new CustomEvent("cia:view-placed", {
          detail: { viewId, row: nextCell.row, col: nextCell.col },
        })
      );

      // Optionally focus the new view
      handleSelectInstance(viewId);
    },
    [handleSelectInstance]
  );

  return {
    activeInstance,
    onCanvasViews,
    availableViews,
    handleSelectInstance,
    handlePlaceView,
  };
}

export default useInstanceSelector;
