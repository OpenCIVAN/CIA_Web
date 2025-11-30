/**
 * GridLayoutPreview Logic Hook
 *
 * Headless logic for the GridLayoutPreview component.
 * Handles grid state, navigation, edit mode, and collaboration features.
 */

import { useState, useCallback, useMemo, useReducer, useEffect } from "react";

// Action types for undo/redo
const ACTIONS = {
  SET_PLACEMENTS: "SET_PLACEMENTS",
  MOVE_PLACEMENT: "MOVE_PLACEMENT",
  SWAP_PLACEMENTS: "SWAP_PLACEMENTS",
  RESIZE_PLACEMENT: "RESIZE_PLACEMENT",
  MERGE_CELLS: "MERGE_CELLS",
  SPLIT_CELL: "SPLIT_CELL",
  ADD_ROW: "ADD_ROW",
  REMOVE_ROW: "REMOVE_ROW",
  ADD_COLUMN: "ADD_COLUMN",
  REMOVE_COLUMN: "REMOVE_COLUMN",
  UNDO: "UNDO",
  REDO: "REDO",
  APPLY_CHANGES: "APPLY_CHANGES",
  CANCEL_CHANGES: "CANCEL_CHANGES",
};

// Initial state
const createInitialState = (
  initialPlacements = [],
  gridSize = { rows: 4, cols: 4 }
) => ({
  placements: initialPlacements,
  pendingPlacements: null, // null = no pending changes
  gridSize,
  pendingGridSize: null,
  history: [],
  historyIndex: -1,
  isDirty: false,
});

// Reducer for grid state management
function gridReducer(state, action) {
  switch (action.type) {
    case ACTIONS.SET_PLACEMENTS: {
      return {
        ...state,
        placements: action.payload,
        pendingPlacements: null,
        isDirty: false,
      };
    }

    case ACTIONS.MOVE_PLACEMENT: {
      const { placementId, toRow, toCol } = action.payload;
      const newPlacements = (state.pendingPlacements || state.placements).map(
        (p) => (p.id === placementId ? { ...p, row: toRow, col: toCol } : p)
      );
      return {
        ...state,
        pendingPlacements: newPlacements,
        isDirty: true,
      };
    }

    case ACTIONS.SWAP_PLACEMENTS: {
      const { placementId1, placementId2 } = action.payload;
      const placements = state.pendingPlacements || state.placements;
      const p1 = placements.find((p) => p.id === placementId1);
      const p2 = placements.find((p) => p.id === placementId2);

      if (!p1 || !p2) return state;

      const newPlacements = placements.map((p) => {
        if (p.id === placementId1) {
          return { ...p, row: p2.row, col: p2.col };
        }
        if (p.id === placementId2) {
          return { ...p, row: p1.row, col: p1.col };
        }
        return p;
      });

      return {
        ...state,
        pendingPlacements: newPlacements,
        isDirty: true,
      };
    }

    case ACTIONS.RESIZE_PLACEMENT: {
      const { placementId, rowSpan, colSpan } = action.payload;
      const newPlacements = (state.pendingPlacements || state.placements).map(
        (p) => (p.id === placementId ? { ...p, rowSpan, colSpan } : p)
      );
      return {
        ...state,
        pendingPlacements: newPlacements,
        isDirty: true,
      };
    }

    case ACTIONS.MERGE_CELLS: {
      const { startRow, startCol, endRow, endCol, placementId } =
        action.payload;
      const rowSpan = endRow - startRow + 1;
      const colSpan = endCol - startCol + 1;

      const newPlacements = (state.pendingPlacements || state.placements).map(
        (p) =>
          p.id === placementId
            ? { ...p, row: startRow, col: startCol, rowSpan, colSpan }
            : p
      );

      return {
        ...state,
        pendingPlacements: newPlacements,
        isDirty: true,
      };
    }

    case ACTIONS.SPLIT_CELL: {
      const { placementId } = action.payload;
      const newPlacements = (state.pendingPlacements || state.placements).map(
        (p) => (p.id === placementId ? { ...p, rowSpan: 1, colSpan: 1 } : p)
      );
      return {
        ...state,
        pendingPlacements: newPlacements,
        isDirty: true,
      };
    }

    case ACTIONS.ADD_ROW: {
      const newGridSize = {
        ...(state.pendingGridSize || state.gridSize),
        rows: (state.pendingGridSize || state.gridSize).rows + 1,
      };
      return {
        ...state,
        pendingGridSize: newGridSize,
        isDirty: true,
      };
    }

    case ACTIONS.REMOVE_ROW: {
      const currentSize = state.pendingGridSize || state.gridSize;
      if (currentSize.rows <= 1) return state;

      const newGridSize = {
        ...currentSize,
        rows: currentSize.rows - 1,
      };
      return {
        ...state,
        pendingGridSize: newGridSize,
        isDirty: true,
      };
    }

    case ACTIONS.ADD_COLUMN: {
      const newGridSize = {
        ...(state.pendingGridSize || state.gridSize),
        cols: (state.pendingGridSize || state.gridSize).cols + 1,
      };
      return {
        ...state,
        pendingGridSize: newGridSize,
        isDirty: true,
      };
    }

    case ACTIONS.REMOVE_COLUMN: {
      const currentSize = state.pendingGridSize || state.gridSize;
      if (currentSize.cols <= 1) return state;

      const newGridSize = {
        ...currentSize,
        cols: currentSize.cols - 1,
      };
      return {
        ...state,
        pendingGridSize: newGridSize,
        isDirty: true,
      };
    }

    case ACTIONS.APPLY_CHANGES: {
      if (!state.isDirty) return state;

      const newHistory = [
        ...state.history.slice(0, state.historyIndex + 1),
        {
          placements: state.placements,
          gridSize: state.gridSize,
        },
      ];

      return {
        ...state,
        placements: state.pendingPlacements || state.placements,
        gridSize: state.pendingGridSize || state.gridSize,
        pendingPlacements: null,
        pendingGridSize: null,
        history: newHistory,
        historyIndex: newHistory.length - 1,
        isDirty: false,
      };
    }

    case ACTIONS.CANCEL_CHANGES: {
      return {
        ...state,
        pendingPlacements: null,
        pendingGridSize: null,
        isDirty: false,
      };
    }

    case ACTIONS.UNDO: {
      if (state.historyIndex < 0) return state;

      const prevState = state.history[state.historyIndex];
      return {
        ...state,
        placements: prevState.placements,
        gridSize: prevState.gridSize,
        historyIndex: state.historyIndex - 1,
      };
    }

    case ACTIONS.REDO: {
      if (state.historyIndex >= state.history.length - 1) return state;

      const nextState = state.history[state.historyIndex + 1];
      return {
        ...state,
        placements: nextState.placements,
        gridSize: nextState.gridSize,
        historyIndex: state.historyIndex + 1,
      };
    }

    default:
      return state;
  }
}

/**
 * Main logic hook for GridLayoutPreview
 */
export function useGridLayoutPreview({
  initialPlacements = [],
  initialGridSize = { rows: 4, cols: 4 },
  onApply,
  onNavigate,
}) {
  // Grid state with undo/redo support
  const [state, dispatch] = useReducer(
    gridReducer,
    createInitialState(initialPlacements, initialGridSize)
  );

  // Viewport state
  const [viewport, setViewport] = useState({
    row: 0,
    col: 0,
    zoom: 1,
  });

  // Edit mode state
  const [isEditMode, setIsEditMode] = useState(false);
  const [dragState, setDragState] = useState(null);
  const [selectedCells, setSelectedCells] = useState([]);

  // Homepoint
  const [homepoint, setHomepoint] = useState({ row: 0, col: 0 });

  // Current placements (pending or committed)
  const placements = state.pendingPlacements || state.placements;
  const gridSize = state.pendingGridSize || state.gridSize;

  // Generate grid cells with placement info
  const gridCells = useMemo(() => {
    const cells = [];
    const placementMap = new Map();

    // Build placement map for quick lookup
    placements.forEach((p) => {
      for (let r = p.row; r < p.row + (p.rowSpan || 1); r++) {
        for (let c = p.col; c < p.col + (p.colSpan || 1); c++) {
          const key = `${r}-${c}`;
          placementMap.set(key, {
            placement: p,
            isOrigin: r === p.row && c === p.col,
          });
        }
      }
    });

    // Generate all cells
    for (let row = 0; row < gridSize.rows; row++) {
      for (let col = 0; col < gridSize.cols; col++) {
        const key = `${row}-${col}`;
        const placementInfo = placementMap.get(key);

        if (placementInfo) {
          if (placementInfo.isOrigin) {
            cells.push({
              row,
              col,
              type: "placement",
              placement: placementInfo.placement,
            });
          }
          // Skip non-origin cells of spanning placements
        } else {
          cells.push({
            row,
            col,
            type: "empty",
            placement: null,
          });
        }
      }
    }

    return cells;
  }, [placements, gridSize]);

  // Overlap detection
  const overlaps = useMemo(() => {
    const cellOccupancy = new Map();
    const overlappingPlacements = new Set();

    placements.forEach((p) => {
      for (let r = p.row; r < p.row + (p.rowSpan || 1); r++) {
        for (let c = p.col; c < p.col + (p.colSpan || 1); c++) {
          const key = `${r}-${c}`;
          if (cellOccupancy.has(key)) {
            overlappingPlacements.add(p.id);
            overlappingPlacements.add(cellOccupancy.get(key));
          } else {
            cellOccupancy.set(key, p.id);
          }
        }
      }
    });

    return overlappingPlacements;
  }, [placements]);

  // Navigation actions
  const navigateViewport = useCallback(
    (direction) => {
      setViewport((prev) => {
        const newViewport = { ...prev };
        switch (direction) {
          case "up":
            newViewport.row = Math.max(0, prev.row - 1);
            break;
          case "down":
            newViewport.row = Math.min(gridSize.rows - 1, prev.row + 1);
            break;
          case "left":
            newViewport.col = Math.max(0, prev.col - 1);
            break;
          case "right":
            newViewport.col = Math.min(gridSize.cols - 1, prev.col + 1);
            break;
        }
        onNavigate?.(newViewport);
        return newViewport;
      });
    },
    [gridSize, onNavigate]
  );

  const navigateToCell = useCallback(
    (row, col) => {
      const newViewport = { ...viewport, row, col };
      setViewport(newViewport);
      onNavigate?.(newViewport);
    },
    [viewport, onNavigate]
  );

  const navigateHome = useCallback(() => {
    navigateToCell(homepoint.row, homepoint.col);
  }, [homepoint, navigateToCell]);

  const setZoom = useCallback((zoom) => {
    setViewport((prev) => ({
      ...prev,
      zoom: Math.max(0.5, Math.min(2, zoom)),
    }));
  }, []);

  // Edit actions
  const movePlacement = useCallback((placementId, toRow, toCol) => {
    dispatch({
      type: ACTIONS.MOVE_PLACEMENT,
      payload: { placementId, toRow, toCol },
    });
  }, []);

  const swapPlacements = useCallback((placementId1, placementId2) => {
    dispatch({
      type: ACTIONS.SWAP_PLACEMENTS,
      payload: { placementId1, placementId2 },
    });
  }, []);

  const resizePlacement = useCallback((placementId, rowSpan, colSpan) => {
    dispatch({
      type: ACTIONS.RESIZE_PLACEMENT,
      payload: { placementId, rowSpan, colSpan },
    });
  }, []);

  const mergeCells = useCallback(
    (startRow, startCol, endRow, endCol, placementId) => {
      dispatch({
        type: ACTIONS.MERGE_CELLS,
        payload: { startRow, startCol, endRow, endCol, placementId },
      });
    },
    []
  );

  const splitCell = useCallback((placementId) => {
    dispatch({ type: ACTIONS.SPLIT_CELL, payload: { placementId } });
  }, []);

  // Grid size actions
  const addRow = useCallback(() => {
    dispatch({ type: ACTIONS.ADD_ROW });
  }, []);

  const removeRow = useCallback(() => {
    dispatch({ type: ACTIONS.REMOVE_ROW });
  }, []);

  const addColumn = useCallback(() => {
    dispatch({ type: ACTIONS.ADD_COLUMN });
  }, []);

  const removeColumn = useCallback(() => {
    dispatch({ type: ACTIONS.REMOVE_COLUMN });
  }, []);

  // Apply/Cancel
  const applyChanges = useCallback(() => {
    dispatch({ type: ACTIONS.APPLY_CHANGES });
    onApply?.(placements, gridSize);
  }, [placements, gridSize, onApply]);

  const cancelChanges = useCallback(() => {
    dispatch({ type: ACTIONS.CANCEL_CHANGES });
  }, []);

  // Undo/Redo
  const undo = useCallback(() => {
    dispatch({ type: ACTIONS.UNDO });
  }, []);

  const redo = useCallback(() => {
    dispatch({ type: ACTIONS.REDO });
  }, []);

  // Drag and drop handlers
  const startDrag = useCallback((placementId, startRow, startCol) => {
    setDragState({
      placementId,
      startRow,
      startCol,
      currentRow: startRow,
      currentCol: startCol,
    });
  }, []);

  const updateDrag = useCallback((row, col) => {
    setDragState((prev) =>
      prev ? { ...prev, currentRow: row, currentCol: col } : null
    );
  }, []);

  const endDrag = useCallback(
    (targetRow, targetCol) => {
      if (!dragState) return;

      const targetPlacement = placements.find(
        (p) =>
          p.row === targetRow &&
          p.col === targetCol &&
          p.id !== dragState.placementId
      );

      if (targetPlacement) {
        // Swap with existing placement
        swapPlacements(dragState.placementId, targetPlacement.id);
      } else {
        // Move to empty cell
        movePlacement(dragState.placementId, targetRow, targetCol);
      }

      setDragState(null);
    },
    [dragState, placements, swapPlacements, movePlacement]
  );

  const cancelDrag = useCallback(() => {
    setDragState(null);
  }, []);

  // Cell selection for merging
  const toggleCellSelection = useCallback((row, col) => {
    setSelectedCells((prev) => {
      const key = `${row}-${col}`;
      const isSelected = prev.some((c) => c.row === row && c.col === col);

      if (isSelected) {
        return prev.filter((c) => !(c.row === row && c.col === col));
      } else {
        return [...prev, { row, col }];
      }
    });
  }, []);

  const clearCellSelection = useCallback(() => {
    setSelectedCells([]);
  }, []);

  // Check if cells can be merged (adjacent and form rectangle)
  const canMergeSelectedCells = useMemo(() => {
    if (selectedCells.length < 2) return false;

    const rows = selectedCells.map((c) => c.row);
    const cols = selectedCells.map((c) => c.col);
    const minRow = Math.min(...rows);
    const maxRow = Math.max(...rows);
    const minCol = Math.min(...cols);
    const maxCol = Math.max(...cols);

    // Check if selection forms a complete rectangle
    const expectedCount = (maxRow - minRow + 1) * (maxCol - minCol + 1);
    return selectedCells.length === expectedCount;
  }, [selectedCells]);

  // Update placements when initialPlacements changes
  useEffect(() => {
    dispatch({ type: ACTIONS.SET_PLACEMENTS, payload: initialPlacements });
  }, [initialPlacements]);

  return {
    // State
    placements,
    gridSize,
    gridCells,
    viewport,
    overlaps,
    isDirty: state.isDirty,
    isEditMode,
    dragState,
    selectedCells,
    homepoint,
    canUndo: state.historyIndex >= 0,
    canRedo: state.historyIndex < state.history.length - 1,
    canMergeSelectedCells,

    // Edit mode
    setIsEditMode,

    // Navigation
    navigateViewport,
    navigateToCell,
    navigateHome,
    setZoom,
    setHomepoint,

    // Edit actions
    movePlacement,
    swapPlacements,
    resizePlacement,
    mergeCells,
    splitCell,
    addRow,
    removeRow,
    addColumn,
    removeColumn,

    // Apply/Cancel
    applyChanges,
    cancelChanges,

    // Undo/Redo
    undo,
    redo,

    // Drag and drop
    startDrag,
    updateDrag,
    endDrag,
    cancelDrag,

    // Cell selection
    toggleCellSelection,
    clearCellSelection,
  };
}

export default useGridLayoutPreview;
