// src/ui/react/components/panels/LayoutPanel/LayoutPanel.logic.js
// Headless logic hook for LayoutPanel
//
// IMPORTANT: This file should NOT manage navigatorDocked or dockPosition state.
// Those are managed by LayoutPanelContext to ensure single source of truth.

import { useState, useCallback, useMemo, useEffect } from "react";
import { useCanvas } from "@UI/react/hooks/useCanvas.js";
import { viewConfigurationManager } from "@Core/data/managers/ViewConfigurationManager.js";
import { canvasManager } from "@Core/data/managers/CanvasManager.js";
import { ui as log } from "@Utils/logger.js";

// =============================================================================
// CONSTANTS
// =============================================================================

export const LAYOUT_MODES = {
  FREE: "free",
  FLOW: "flow",
  GRID: "grid",
};

export const FLOW_DIRECTIONS = {
  ROW: "row",
  COLUMN: "column",
};

export const TOOLS = {
  SELECT: "select",
  PAN: "pan",
  MERGE: "merge",
};

export const DROP_MODES = {
  REPLACE: "replace",
  SWAP: "swap",
  INSERT: "insert",
};

export const VIEW_MODES = {
  DETAILED: "detailed",
  COMPACT: "compact",
  MINIMAL: "minimal",
};

export const SPAWN_SIZES = {
  "1x1": { rows: 1, cols: 1 },
  "1x2": { rows: 1, cols: 2 },
  "2x1": { rows: 2, cols: 1 },
  "2x2": { rows: 2, cols: 2 },
  "2x3": { rows: 2, cols: 3 },
  "3x2": { rows: 3, cols: 2 },
  "3x3": { rows: 3, cols: 3 },
};

// DOCK_POSITIONS is now exported from LayoutPanelContext
// Re-export here for backward compatibility
export const DOCK_POSITIONS = {
  LEFT_PANEL: "left-panel",
  TOP_LEFT: "top-left",
  TOP_RIGHT: "top-right",
  BOTTOM_LEFT: "bottom-left",
  BOTTOM_RIGHT: "bottom-right",
  FLOAT: "float",
  MINIMIZED: "minimized",
};

/**
 * Parse spawn size string to dimensions
 */
export function parseSpawnSize(sizeStr) {
  return SPAWN_SIZES[sizeStr] || SPAWN_SIZES["1x1"];
}

// =============================================================================
// MAIN HOOK
// =============================================================================

/**
 * useLayoutPanel - Headless hook for layout panel state and actions
 *
 * @param {Object} options
 * @param {string} [options.canvasId] - Target canvas ID (uses active canvas if not provided)
 * @param {Object} [options.__testing] - Mock data for testing
 * @returns {Object} Panel state and actions
 */
export function useLayoutPanel({ canvasId, __testing } = {}) {
  // ===========================================================================
  // DATA SOURCE: useCanvas or __testing mock
  // ===========================================================================

  const realCanvasData = useCanvas(canvasId);

  // Allow tests to inject mock data
  const {
    canvas,
    viewport: canvasViewport,
    loading,
    error,
    isConnected,
    // Operations from useCanvas...
    moveViewport: canvasMoveViewport,
    setViewportPosition,
    addRow: canvasAddRow,
    addColumn: canvasAddColumn,
    removePlacement,
    resizePlacement,
    setLayoutMode: canvasSetLayoutMode,
    setFlowDirection: canvasSetFlowDirection,
  } = __testing || realCanvasData;

  // ===========================================================================
  // DERIVED STATE FROM CANVAS
  // ===========================================================================

  // Canvas dimensions (with fallback for loading state)
  const canvasSize = useMemo(
    () => canvas?.dimensions || { rows: 4, cols: 5 },
    [canvas]
  );

  // Raw placements from canvas
  const rawPlacements = useMemo(() => canvas?.placements || [], [canvas]);

  // Enrich placements with ViewConfiguration data for UI components
  const cells = useMemo(() => {
    if (!rawPlacements || rawPlacements.length === 0) return [];

    return rawPlacements.map((placement, index) => {
      // Get the viewConfigurationId from the placement content
      const viewId =
        placement.getViewId?.() ||
        placement.content?.viewConfigurationId ||
        null;

      // Look up the ViewConfiguration for this placement
      const viewConfig = viewId
        ? viewConfigurationManager.getView(viewId)
        : null;

      // Determine if view has active links
      const hasActiveLinks = viewConfig?.links
        ? Object.values(viewConfig.links).some(
            (link) => link && (link.isActive?.() || link.status === "active")
          )
        : false;

      // Determine if view is shared
      const isShared =
        viewConfig?.visibility !== "private" ||
        (viewConfig?.sharedWith?.length || 0) > 0;

      // Return enriched cell object with both placement position and view metadata
      return {
        // Placement position data
        id: placement.id,
        row: placement.row,
        col: placement.col,
        rowSpan: placement.rowSpan || 1,
        colSpan: placement.colSpan || 1,
        content: placement.content,
        subsetIds: placement.subsetIds || [],

        // ViewConfiguration metadata (with fallbacks)
        viewConfigurationId: viewId,
        name: viewConfig?.name || `View ${index + 1}`,
        title: viewConfig?.name || `View ${index + 1}`,
        description: viewConfig?.description || "",
        datasetId: viewConfig?.datasetId,
        datasetName: viewConfig?.datasetName || "Unknown Dataset",
        color: index % 6, // Color index for UI
        instanceColor: index % 6,

        // Sharing and linking status
        isShared,
        isLinked: hasActiveLinks,
        visibility: viewConfig?.visibility || "private",
        ownerUserId: viewConfig?.ownerUserId,
        ownerUserName: viewConfig?.ownerUserName,

        // Link targets (for ViewItem link UI)
        links: viewConfig?.links || {},
        linkTarget: hasActiveLinks
          ? Object.values(viewConfig.links).find(
              (l) => l?.isActive?.() || l?.status === "active"
            )?.targetViewId
          : null,
        linkedParent: hasActiveLinks
          ? Object.values(viewConfig.links).find(
              (l) => l?.isActive?.() || l?.status === "active"
            )?.sourceViewId
          : null,
      };
    });
  }, [rawPlacements]);

  // ===========================================================================
  // PANEL UI STATE (local to this panel, not shared)
  // ===========================================================================

  // Panel subtab state (canvas vs views)
  const [panelSubtab, setPanelSubtab] = useState("views");

  // View list mode (detailed, compact, minimal)
  const [viewMode, setViewMode] = useState(VIEW_MODES.DETAILED);

  // Active filters for views list
  const [activeFilters, setActiveFilters] = useState(["active"]);

  // View list grouping mode
  const [groupBy, setGroupBy] = useState("none");

  // Search/filter text
  const [searchQuery, setSearchQuery] = useState("");

  // Spawn size for new views
  const [spawnSize, setSpawnSize] = useState("1x1");

  // Edit mode for canvas
  const [editMode, setEditMode] = useState(false);

  // Current tool
  const [tool, setTool] = useState(TOOLS.SELECT);

  // Drop mode
  const [dropMode, setDropMode] = useState(DROP_MODES.REPLACE);

  // Expanded view (for settings panel)
  const [expandedViewId, setExpandedViewId] = useState(null);

  // ===========================================================================
  // NOTE: navigatorDocked and dockPosition are NOT managed here!
  // They are managed by LayoutPanelContext to ensure single source of truth.
  // The context will merge these values into the logic object.
  // ===========================================================================

  // ===========================================================================
  // VIEWPORT STATE (derived from canvas)
  // ===========================================================================

  const viewport = useMemo(
    () => ({
      row: canvasViewport?.row ?? 0,
      col: canvasViewport?.col ?? 0,
      rows: canvasViewport?.rows ?? 2,
      cols: canvasViewport?.cols ?? 2,
    }),
    [canvasViewport]
  );

  const viewportSize = useMemo(
    () => ({
      rows: viewport.rows,
      cols: viewport.cols,
    }),
    [viewport]
  );

  // ===========================================================================
  // VIEWPORT NAVIGATION
  // ===========================================================================

  /**
   * Move viewport by delta rows/cols
   * Handles both string directions and numeric deltas
   */
  const moveViewport = useCallback(
    (deltaRowOrDirection, deltaCol) => {
      // Handle string directions (legacy support)
      if (typeof deltaRowOrDirection === "string") {
        const direction = deltaRowOrDirection;
        switch (direction) {
          case "up":
            canvasMoveViewport?.(-1, 0);
            break;
          case "down":
            canvasMoveViewport?.(1, 0);
            break;
          case "left":
            canvasMoveViewport?.(0, -1);
            break;
          case "right":
            canvasMoveViewport?.(0, 1);
            break;
          case "home":
            setViewportPosition?.(0, 0);
            break;
          default:
            log.warn(`Unknown direction: ${direction}`);
        }
        return;
      }

      // Handle numeric deltas
      const deltaRow =
        typeof deltaRowOrDirection === "number" ? deltaRowOrDirection : 0;
      const dCol = typeof deltaCol === "number" ? deltaCol : 0;

      if (canvasMoveViewport) {
        canvasMoveViewport(deltaRow, dCol);
      }
    },
    [canvasMoveViewport, setViewportPosition]
  );

  /**
   * Navigate to specific cell position
   */
  const navigateToCell = useCallback(
    (row, col) => {
      // Validate inputs
      const targetRow = typeof row === "number" && !isNaN(row) ? row : 0;
      const targetCol = typeof col === "number" && !isNaN(col) ? col : 0;

      // Clamp to canvas bounds
      const clampedRow = Math.max(
        0,
        Math.min(targetRow, canvasSize.rows - viewport.rows)
      );
      const clampedCol = Math.max(
        0,
        Math.min(targetCol, canvasSize.cols - viewport.cols)
      );

      if (setViewportPosition) {
        setViewportPosition(clampedRow, clampedCol);
      }
    },
    [setViewportPosition, canvasSize, viewport]
  );

  // ===========================================================================
  // CANVAS SIZE OPERATIONS
  // ===========================================================================

  const addRow = useCallback(async () => {
    if (canvasAddRow) {
      await canvasAddRow();
    }
  }, [canvasAddRow]);

  const addColumn = useCallback(async () => {
    if (canvasAddColumn) {
      await canvasAddColumn();
    }
  }, [canvasAddColumn]);

  // ===========================================================================
  // LAYOUT MODE (Server-authoritative)
  // ===========================================================================

  const setLayoutMode = useCallback(
    async (mode) => {
      await canvasSetLayoutMode?.(mode);
    },
    [canvasSetLayoutMode]
  );

  const setFlowDirection = useCallback(
    async (direction) => {
      await canvasSetFlowDirection?.(direction);
    },
    [canvasSetFlowDirection]
  );

  // ===========================================================================
  // VIEWS FILTERING
  // ===========================================================================

  const toggleFilter = useCallback((filterId) => {
    setActiveFilters((prev) =>
      prev.includes(filterId)
        ? prev.filter((f) => f !== filterId)
        : [...prev, filterId]
    );
  }, []);

  // Filter cells based on active filters and search query
  const filteredCells = useMemo(() => {
    let result = [...cells];

    // Apply text search
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (cell) =>
          cell.name?.toLowerCase().includes(query) ||
          cell.datasetName?.toLowerCase().includes(query)
      );
    }

    // Apply filters
    if (
      activeFilters.includes("active") &&
      !activeFilters.includes("inactive")
    ) {
      // Only show active (on canvas)
      result = result.filter((cell) => cell.row !== undefined);
    }
    if (
      activeFilters.includes("inactive") &&
      !activeFilters.includes("active")
    ) {
      // Only show inactive (not on canvas)
      result = result.filter((cell) => cell.row === undefined);
    }
    if (activeFilters.includes("shared")) {
      result = result.filter((cell) => cell.isShared);
    }
    if (activeFilters.includes("linked")) {
      result = result.filter((cell) => cell.isLinked);
    }

    return result;
  }, [cells, searchQuery, activeFilters]);

  // ===========================================================================
  // VIEW ACTIONS
  // ===========================================================================

  /**
   * Close a view (remove from canvas but keep configuration)
   */
  const closeView = useCallback(
    async (viewId) => {
      const cell = cells.find(
        (c) => c.viewConfigurationId === viewId || c.id === viewId
      );
      if (cell && removePlacement) {
        await removePlacement(cell.id);
      }
      if (expandedViewId === viewId) {
        setExpandedViewId(null);
      }
    },
    [cells, removePlacement, expandedViewId]
  );

  /**
   * Delete a view permanently
   */
  const deleteView = useCallback(
    async (viewId) => {
      // First close it
      await closeView(viewId);
      // Then delete the configuration
      await viewConfigurationManager.deleteView(viewId);
    },
    [closeView]
  );

  /**
   * Find the first empty cell on the canvas
   */
  const findFirstEmptyCell = useCallback(() => {
    for (let row = 0; row < canvasSize.rows; row++) {
      for (let col = 0; col < canvasSize.cols; col++) {
        const occupied = cells.some(
          (cell) =>
            row >= cell.row &&
            row < cell.row + (cell.rowSpan || 1) &&
            col >= cell.col &&
            col < cell.col + (cell.colSpan || 1)
        );
        if (!occupied) {
          return { row, col };
        }
      }
    }
    // Canvas is full - expand by adding a new row
    return { row: canvasSize.rows, col: 0 };
  }, [cells, canvasSize]);

  // ===========================================================================
  // EDIT MODE
  // ===========================================================================

  const toggleEditMode = useCallback(() => {
    setEditMode((prev) => !prev);
  }, []);

  const exitEditMode = useCallback(() => {
    setEditMode(false);
  }, []);

  // ===========================================================================
  // RETURN VALUE
  // ===========================================================================

  return {
    // Canvas data
    canvas,
    canvasSize,
    cells,
    filteredCells,
    rawPlacements,
    viewport,
    viewportSize,

    // Loading/error state
    loading,
    error,
    isConnected,

    // Panel UI state
    panelSubtab,
    setPanelSubtab,
    viewMode,
    setViewMode,
    activeFilters,
    toggleFilter,
    setActiveFilters,
    groupBy,
    setGroupBy,
    searchQuery,
    setSearchQuery,
    spawnSize,
    setSpawnSize,
    expandedViewId,
    setExpandedViewId,

    // Edit mode
    editMode,
    setEditMode,
    toggleEditMode,
    exitEditMode,
    tool,
    setTool,
    dropMode,
    setDropMode,

    // Viewport navigation
    moveViewport,
    navigateToCell,
    setViewportPosition,

    // Canvas operations
    addRow,
    addColumn,
    setLayoutMode,
    setFlowDirection,
    removePlacement,
    resizePlacement,

    // View actions
    closeView,
    deleteView,
    findFirstEmptyCell,

    // NOTE: The following are NOT included here - they come from LayoutPanelContext:
    // - navigatorDocked
    // - dockPosition
    // - setDockPosition
    // - dockNavigator
    // - undockNavigator
    // - toggleNavigatorDocked
  };
}

export default useLayoutPanel;
