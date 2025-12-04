// src/ui/react/components/panels/LayoutPanel/LayoutPanel.logic.js
// Headless logic for the Layout Panel component.
//
// WIRED TO REAL DATA:
// - Canvas state from useCanvas hook (connects to canvasManager)
// - View metadata from viewConfigurationManager
// - Operations delegated to server-authoritative managers
//
// LOCAL UI STATE:
// - Panel subtab (canvas/views)
// - Navigator docked/floating
// - Tool selection, edit mode
// - View filtering and grouping
// - Spawn size settings

import { useState, useCallback, useMemo, useEffect } from "react";
import { useCanvas } from "@UI/react/hooks/useCanvas.js";
import { canvasManager } from "@Core/data/managers/CanvasManager.js";
import {
  viewConfigurationManager,
  datasetManager,
} from "@Init/appInitializer.js";
import {
  LAYOUT_MODES,
  FLOW_DIRECTIONS,
} from "@Core/data/models/WorkspaceCanvas.js";

// Re-export layout constants for convenience
export { LAYOUT_MODES, FLOW_DIRECTIONS };

// Tool types
export const TOOLS = {
  SELECT: "select",
  PAN: "pan",
  MERGE: "merge",
};

// Drop modes
export const DROP_MODES = {
  ADD: "add",
  REPLACE: "replace",
};

// View modes
export const VIEW_MODES = {
  NORMAL: "normal",
  ISOLATION: "isolation",
  SUBSET: "subset",
};

// Default spawn sizes
export const SPAWN_SIZES = ["1x1", "2x1", "1x2", "2x2"];

// Instance colors for view color coding
export const INSTANCE_COLORS = [
  "#60a5fa", // blue
  "#4ade80", // green
  "#f472b6", // pink
  "#fbbf24", // amber
  "#2dd4bf", // teal
  "#a78bfa", // purple
];

/**
 * Parse spawn size string to object
 * @param {string|object} size - Size string like "2x1" or object {cols, rows}
 * @returns {{cols: number, rows: number}}
 */
export function parseSpawnSize(size) {
  if (typeof size === "object") return size;
  const [cols, rows] = size.split("x").map(Number);
  return { cols, rows };
}

/**
 * Main logic hook for LayoutPanel
 *
 * Now wired to real canvas data via useCanvas hook.
 * Enriches placements with view metadata for display.
 */
export function useLayoutPanel({ canvasId = null } = {}) {
  // ==========================================================================
  // REAL DATA: Canvas State from useCanvas hook
  // ==========================================================================

  const {
    canvas,
    loading: canvasLoading,
    error: canvasError,
    viewport,
    visiblePlacements,
    connectionState,
    isConnected,

    // Viewport controls
    moveViewport: moveViewportRaw,
    setViewportPosition,
    setViewportSize,

    // Placement operations (delegated to canvasManager)
    addPlacement,
    updatePlacement,
    removePlacement,
    movePlacement,
    resizePlacement,

    // Canvas operations
    addRow,
    addColumn,
    setLayoutMode: setLayoutModeAsync,
    setFlowDirection: setFlowDirectionAsync,
    addViewInFlowMode,
  } = useCanvas(canvasId);

  // ==========================================================================
  // LOCAL UI STATE: Panel-specific state
  // ==========================================================================

  // Active subtab: 'canvas' or 'views'
  const [panelSubtab, setPanelSubtab] = useState("canvas");

  // Navigator docked state
  const [navigatorDocked, setNavigatorDocked] = useState(true);

  // Spawn size for new views
  const [spawnSize, setSpawnSize] = useState("1x1");

  // Zoom level (local, affects minimap display)
  const [zoom, setZoom] = useState(1);

  // Tools state
  const [tool, setTool] = useState(TOOLS.SELECT);
  const [editMode, setEditMode] = useState(false);
  const [dropMode, setDropMode] = useState(DROP_MODES.ADD);
  const [viewMode, setViewMode] = useState(VIEW_MODES.NORMAL);

  // Views subtab state
  const [expandedViewId, setExpandedViewId] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilters, setActiveFilters] = useState([]);
  const [groupByDataset, setGroupByDataset] = useState(false);

  // Undo/redo history (for local operations)
  const [history, setHistory] = useState([]);
  const [historyIndex, setHistoryIndex] = useState(-1);

  // ==========================================================================
  // DERIVED STATE: Canvas dimensions and homepoint
  // ==========================================================================

  const canvasSize = useMemo(() => {
    return canvas?.dimensions || { rows: 4, cols: 5 };
  }, [canvas]);

  const layoutMode = useMemo(() => {
    return canvas?.layoutMode || LAYOUT_MODES.GRID;
  }, [canvas]);

  const flowDirection = useMemo(() => {
    return canvas?.flowDirection || FLOW_DIRECTIONS.ROW;
  }, [canvas]);

  const homepoint = useMemo(() => {
    return canvas?.homepoint || { row: 0, col: 0 };
  }, [canvas]);

  const isAtHome = useMemo(() => {
    return viewport.row === homepoint.row && viewport.col === homepoint.col;
  }, [viewport, homepoint]);

  // ==========================================================================
  // ENRICHED CELLS: Placements with view metadata
  // ==========================================================================

  /**
   * Enrich placements with view configuration and dataset metadata.
   * This transforms raw placements into the "cells" format expected by UI.
   */
  const cells = useMemo(() => {
    if (!canvas?.placements) return [];

    return canvas.placements.map((placement, index) => {
      // Get view configuration if this is a view placement
      let viewConfig = null;
      let dataset = null;
      let viewName = `View ${index + 1}`;
      let datasetName = "Unknown Dataset";

      if (
        placement.content?.type === "view" &&
        placement.content?.viewConfigurationId
      ) {
        viewConfig = viewConfigurationManager?.getView?.(
          placement.content.viewConfigurationId
        );

        if (viewConfig) {
          viewName = viewConfig.name || viewName;

          // Get dataset info
          if (viewConfig.datasetId) {
            dataset = datasetManager?.getDataset?.(viewConfig.datasetId);
            datasetName = dataset?.name || datasetName;
          }
        }
      }

      // Return enriched cell data
      return {
        id: placement.id,
        row: placement.row,
        col: placement.col,
        rowSpan: placement.rowSpan || 1,
        colSpan: placement.colSpan || 1,

        // View metadata
        name: viewName,
        dataset: datasetName,
        viewConfigId: placement.content?.viewConfigurationId,
        contentType: placement.content?.type || "empty",

        // Color assignment (cycle through INSTANCE_COLORS)
        color: index % INSTANCE_COLORS.length,

        // Status flags (from view config if available)
        isShared: viewConfig?.isShared || false,
        isLinked: viewConfig?.hasActiveLinks?.() || false,
        linkedParent: viewConfig?.getLinkedParentName?.() || null,
        linkTarget: viewConfig?.canBeLinkedTo || false,

        // Starred status
        starredWorkspace: viewConfig?.starredWorkspace || false,
        starredPersonal: viewConfig?.starredPersonal || false,
      };
    });
  }, [canvas?.placements]);

  // ==========================================================================
  // CANVAS SIZE PROTECTION
  // ==========================================================================

  /**
   * Check if canvas size can be reduced without cutting off views
   */
  const checkCanReduceSize = useCallback(
    (dimension, targetValue) => {
      const maxOccupied = cells.reduce((max, cell) => {
        if (dimension === "cols") {
          return Math.max(max, cell.col + (cell.colSpan || 1));
        }
        return Math.max(max, cell.row + (cell.rowSpan || 1));
      }, 0);

      const target =
        targetValue !== undefined
          ? targetValue
          : dimension === "cols"
          ? canvasSize.cols - 1
          : canvasSize.rows - 1;

      if (target < maxOccupied) {
        console.warn(
          `Cannot reduce ${dimension}: cells occupy up to ${maxOccupied}`
        );
        return false;
      }
      return true;
    },
    [cells, canvasSize]
  );

  // ==========================================================================
  // CANVAS SIZE OPERATIONS (Server-authoritative)
  // ==========================================================================

  const incrementCols = useCallback(async () => {
    if (!canvas) return;
    await canvasManager.updateCanvas(canvas.id, {
      dimensions: { ...canvasSize, cols: canvasSize.cols + 1 },
    });
  }, [canvas, canvasSize]);

  const decrementCols = useCallback(async () => {
    if (!canvas || !checkCanReduceSize("cols")) return;
    await canvasManager.updateCanvas(canvas.id, {
      dimensions: { ...canvasSize, cols: Math.max(1, canvasSize.cols - 1) },
    });
  }, [canvas, canvasSize, checkCanReduceSize]);

  const incrementRows = useCallback(async () => {
    if (!canvas) return;
    await canvasManager.updateCanvas(canvas.id, {
      dimensions: { ...canvasSize, rows: canvasSize.rows + 1 },
    });
  }, [canvas, canvasSize]);

  const decrementRows = useCallback(async () => {
    if (!canvas || !checkCanReduceSize("rows")) return;
    await canvasManager.updateCanvas(canvas.id, {
      dimensions: { ...canvasSize, rows: Math.max(1, canvasSize.rows - 1) },
    });
  }, [canvas, canvasSize, checkCanReduceSize]);

  const setCanvasCols = useCallback(
    async (cols) => {
      if (!canvas) return;
      const value = Math.max(1, cols);
      if (value < canvasSize.cols && !checkCanReduceSize("cols", value)) return;
      await canvasManager.updateCanvas(canvas.id, {
        dimensions: { ...canvasSize, cols: value },
      });
    },
    [canvas, canvasSize, checkCanReduceSize]
  );

  const setCanvasRows = useCallback(
    async (rows) => {
      if (!canvas) return;
      const value = Math.max(1, rows);
      if (value < canvasSize.rows && !checkCanReduceSize("rows", value)) return;
      await canvasManager.updateCanvas(canvas.id, {
        dimensions: { ...canvasSize, rows: value },
      });
    },
    [canvas, canvasSize, checkCanReduceSize]
  );

  // ==========================================================================
  // VIEWPORT NAVIGATION
  // ==========================================================================

  const moveViewport = useCallback(
    (direction) => {
      switch (direction) {
        case "up":
          moveViewportRaw(-1, 0);
          break;
        case "down":
          moveViewportRaw(1, 0);
          break;
        case "left":
          moveViewportRaw(0, -1);
          break;
        case "right":
          moveViewportRaw(0, 1);
          break;
        case "reset":
          setViewportPosition(homepoint.row, homepoint.col);
          break;
        default:
          break;
      }
    },
    [moveViewportRaw, setViewportPosition, homepoint]
  );

  const navigateToCell = useCallback(
    (row, col) => {
      setViewportPosition(row, col);
    },
    [setViewportPosition]
  );

  const setHomepoint = useCallback(
    async (row, col) => {
      if (!canvas) return;
      await canvasManager.updateCanvas(canvas.id, {
        homepoint: { row, col },
      });
    },
    [canvas]
  );

  // ==========================================================================
  // ZOOM CONTROLS
  // ==========================================================================

  const setZoomLevel = useCallback((level) => {
    setZoom(Math.max(0.5, Math.min(2, level)));
  }, []);

  const zoomIn = useCallback(() => {
    setZoom((z) => Math.min(2, z + 0.25));
  }, []);

  const zoomOut = useCallback(() => {
    setZoom((z) => Math.max(0.5, z - 0.25));
  }, []);

  // ==========================================================================
  // CELL HELPERS
  // ==========================================================================

  const getCellAt = useCallback(
    (row, col) => {
      return (
        cells.find(
          (c) =>
            row >= c.row &&
            row < c.row + (c.rowSpan || 1) &&
            col >= c.col &&
            col < c.col + (c.colSpan || 1)
        ) || null
      );
    },
    [cells]
  );

  const isInViewport = useCallback(
    (row, col) => {
      return (
        row >= viewport.row &&
        row < viewport.row + viewport.rows &&
        col >= viewport.col &&
        col < viewport.col + viewport.cols
      );
    },
    [viewport]
  );

  // ==========================================================================
  // CELL MANAGEMENT (Server-authoritative)
  // ==========================================================================

  const closeView = useCallback(
    async (cellId) => {
      const cell = cells.find((c) => c.id === cellId);
      if (!cell) return;
      await removePlacement(cellId);
    },
    [cells, removePlacement]
  );

  const resizeView = useCallback(
    async (cellId, colSpan, rowSpan) => {
      await resizePlacement(cellId, rowSpan, colSpan);
    },
    [resizePlacement]
  );

  const moveView = useCallback(
    async (cellId, newRow, newCol) => {
      await movePlacement(cellId, newRow, newCol);
    },
    [movePlacement]
  );

  // ==========================================================================
  // LAYOUT MODE (Server-authoritative)
  // ==========================================================================

  const setLayoutMode = useCallback(
    async (mode) => {
      await setLayoutModeAsync(mode);
    },
    [setLayoutModeAsync]
  );

  const setFlowDirection = useCallback(
    async (direction) => {
      await setFlowDirectionAsync(direction);
    },
    [setFlowDirectionAsync]
  );

  // ==========================================================================
  // TOOLS STATE
  // ==========================================================================

  const toggleEditMode = useCallback(() => {
    setEditMode((prev) => !prev);
  }, []);

  const exitEditMode = useCallback(() => {
    setEditMode(false);
  }, []);

  // ==========================================================================
  // NAVIGATOR STATE
  // ==========================================================================

  const toggleNavigatorDocked = useCallback(() => {
    setNavigatorDocked((prev) => !prev);
  }, []);

  const dockNavigator = useCallback(() => {
    setNavigatorDocked(true);
  }, []);

  const undockNavigator = useCallback(() => {
    setNavigatorDocked(false);
  }, []);

  // ==========================================================================
  // UNDO/REDO (Local operations placeholder)
  // ==========================================================================

  const canUndo = historyIndex > 0;
  const canRedo = historyIndex < history.length - 1;

  const undo = useCallback(() => {
    // TODO: Implement undo via server API or local history
    console.log("Undo not yet implemented with server-authoritative model");
  }, []);

  const redo = useCallback(() => {
    // TODO: Implement redo via server API or local history
    console.log("Redo not yet implemented with server-authoritative model");
  }, []);

  // ==========================================================================
  // VIEWS SUBTAB: Filtering and Grouping
  // ==========================================================================

  const toggleFilter = useCallback((filterId) => {
    setActiveFilters((prev) =>
      prev.includes(filterId)
        ? prev.filter((f) => f !== filterId)
        : [...prev, filterId]
    );
  }, []);

  const clearFilters = useCallback(() => {
    setActiveFilters([]);
    setSearchQuery("");
  }, []);

  // Filtered cells based on search and filters
  const filteredCells = useMemo(() => {
    let result = cells;

    // Apply search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (c) =>
          c.name.toLowerCase().includes(query) ||
          c.dataset.toLowerCase().includes(query)
      );
    }

    // Apply status filters
    if (activeFilters.includes("shared")) {
      result = result.filter((c) => c.isShared);
    }
    if (activeFilters.includes("linked")) {
      result = result.filter((c) => c.isLinked);
    }

    return result;
  }, [cells, searchQuery, activeFilters]);

  // Grouped cells by dataset
  const groupedCells = useMemo(() => {
    if (!groupByDataset) {
      return { ungrouped: filteredCells };
    }

    return filteredCells.reduce((acc, cell) => {
      const key = cell.dataset || "Unknown";
      if (!acc[key]) acc[key] = [];
      acc[key].push(cell);
      return acc;
    }, {});
  }, [filteredCells, groupByDataset]);

  // View expansion
  const toggleViewExpanded = useCallback((viewId) => {
    setExpandedViewId((prev) => (prev === viewId ? null : viewId));
  }, []);

  const collapseAllViews = useCallback(() => {
    setExpandedViewId(null);
  }, []);

  // ==========================================================================
  // RETURN API
  // ==========================================================================

  return {
    // Loading/connection state
    loading: canvasLoading,
    error: canvasError,
    isConnected,
    connectionState,

    // Panel state
    panelSubtab,
    setPanelSubtab,

    // Navigator state
    navigatorDocked,
    toggleNavigatorDocked,
    dockNavigator,
    undockNavigator,

    // Canvas state (from real data)
    canvas,
    canvasSize,
    viewport,
    cells,
    homepoint,
    zoom,
    isAtHome,

    // Canvas size controls
    setCanvasCols,
    setCanvasRows,
    incrementCols,
    decrementCols,
    incrementRows,
    decrementRows,
    checkCanReduceSize,

    // Viewport navigation
    moveViewport,
    navigateToCell,
    setHomepoint,
    setViewportPosition,

    // Zoom
    setZoom: setZoomLevel,
    zoomIn,
    zoomOut,

    // Cell helpers
    getCellAt,
    isInViewport,

    // Cell management (server-authoritative)
    closeView,
    resizeView,
    moveView,
    addPlacement,
    removePlacement,

    // Layout mode
    layoutMode,
    setLayoutMode,
    flowDirection,
    setFlowDirection,

    // Spawn size
    spawnSize,
    setSpawnSize,

    // Tools state
    tool,
    setTool,
    editMode,
    setEditMode,
    toggleEditMode,
    exitEditMode,
    dropMode,
    setDropMode,
    viewMode,
    setViewMode,

    // Undo/redo
    canUndo,
    canRedo,
    undo,
    redo,

    // Views state
    expandedViewId,
    toggleViewExpanded,
    collapseAllViews,
    searchQuery,
    setSearchQuery,
    activeFilters,
    toggleFilter,
    clearFilters,
    groupByDataset,
    setGroupByDataset,
    filteredCells,
    groupedCells,
  };
}

export default useLayoutPanel;
