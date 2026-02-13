/**
 * PanelShellContext
 *
 * State management for the PanelShell component system.
 * Handles panel positions, sizes, z-index, and persistence.
 */

import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { STORAGE_KEY, BASE_Z_INDEX, MAX_Z_INDEX } from './constants';

// =============================================================================
// CONTEXT
// =============================================================================

const PanelShellContext = createContext(null);

/**
 * Hook to access PanelShell context
 * @throws {Error} If used outside of PanelShellProvider
 */
export function usePanelShell() {
  const context = useContext(PanelShellContext);
  if (!context) {
    throw new Error('usePanelShell must be used within PanelShellProvider');
  }
  return context;
}

// =============================================================================
// PROVIDER
// =============================================================================

/**
 * @typedef {Object} PanelState
 * @property {string} id - Panel identifier
 * @property {boolean} isOpen - Whether panel is visible
 * @property {{x: number, y: number}} position - Screen position
 * @property {{width: number, height: number}} size - Panel dimensions
 * @property {number} zIndex - Stack order
 * @property {boolean} minimized - Whether panel is minimized
 */

/**
 * Provider for PanelShell state management
 */
export function PanelShellProvider({ children }) {
  const [panels, setPanels] = useState({});
  const [topZIndex, setTopZIndex] = useState(BASE_Z_INDEX);

  /**
   * Get the next z-index, normalizing all panels if we'd exceed MAX_Z_INDEX.
   * Returns { nextZ, normalizedPanels } — normalizedPanels is null if no reset needed.
   */
  const getNextZIndex = useCallback((currentPanels, currentTop) => {
    const nextZ = currentTop + 1;
    if (nextZ <= MAX_Z_INDEX) return { nextZ, normalizedPanels: null };

    // Normalize: reassign z-indices preserving relative order
    const entries = Object.entries(currentPanels);
    const sorted = entries.slice().sort((a, b) => (a[1].zIndex || 0) - (b[1].zIndex || 0));
    const normalizedPanels = {};
    sorted.forEach(([id, panel], i) => {
      normalizedPanels[id] = { ...panel, zIndex: BASE_Z_INDEX + i };
    });
    return { nextZ: BASE_Z_INDEX + entries.length, normalizedPanels };
  }, []);

  // Load saved state from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.panels) {
          setPanels(parsed.panels);
          // Restore top z-index, clamped to MAX_Z_INDEX
          const maxZ = Object.values(parsed.panels).reduce(
            (max, p) => Math.max(max, p.zIndex || BASE_Z_INDEX),
            BASE_Z_INDEX
          );
          setTopZIndex(Math.min(maxZ, MAX_Z_INDEX));
        }
      }
    } catch (e) {
      console.warn('Failed to load panel state:', e);
    }
  }, []);

  // Save state on change (debounced would be better for performance)
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ panels }));
    } catch (e) {
      console.warn('Failed to save panel state:', e);
    }
  }, [panels]);

  /**
   * Open a panel with optional configuration
   */
  const openPanel = useCallback((panelId, config = {}) => {
    setPanels(prev => {
      const existing = prev[panelId];
      const { nextZ, normalizedPanels } = getNextZIndex(prev, topZIndex);
      const base = normalizedPanels || prev;

      setTopZIndex(nextZ);
      return {
        ...base,
        [panelId]: {
          id: panelId,
          isOpen: true,
          position: config.position || existing?.position || { x: 100, y: 100 },
          size: config.size || existing?.size || { width: 320, height: 400 },
          zIndex: nextZ,
          minimized: false,
          ...config,
        },
      };
    });
  }, [topZIndex, getNextZIndex]);

  /**
   * Close a panel (keeps state for reopening)
   */
  const closePanel = useCallback((panelId) => {
    setPanels(prev => ({
      ...prev,
      [panelId]: { ...prev[panelId], isOpen: false },
    }));
  }, []);

  /**
   * Toggle a panel open/closed
   */
  const togglePanel = useCallback((panelId, config = {}) => {
    setPanels(prev => {
      const existing = prev[panelId];
      if (existing?.isOpen) {
        return {
          ...prev,
          [panelId]: { ...existing, isOpen: false },
        };
      }
      // Opening panel
      const { nextZ, normalizedPanels } = getNextZIndex(prev, topZIndex);
      const base = normalizedPanels || prev;
      setTopZIndex(nextZ);
      return {
        ...base,
        [panelId]: {
          id: panelId,
          isOpen: true,
          position: existing?.position || config.position || { x: 100, y: 100 },
          size: existing?.size || config.size || { width: 320, height: 400 },
          zIndex: nextZ,
          minimized: false,
          ...config,
        },
      };
    });
  }, [topZIndex, getNextZIndex]);

  /**
   * Update panel position
   */
  const updatePosition = useCallback((panelId, position) => {
    setPanels(prev => {
      if (!prev[panelId]) return prev;
      return {
        ...prev,
        [panelId]: { ...prev[panelId], position },
      };
    });
  }, []);

  /**
   * Update panel size
   */
  const updateSize = useCallback((panelId, size) => {
    setPanels(prev => {
      if (!prev[panelId]) return prev;
      return {
        ...prev,
        [panelId]: { ...prev[panelId], size },
      };
    });
  }, []);

  /**
   * Bring panel to front (highest z-index)
   */
  const bringToFront = useCallback((panelId) => {
    setPanels(prev => {
      if (!prev[panelId]) return prev;
      const { nextZ, normalizedPanels } = getNextZIndex(prev, topZIndex);
      const base = normalizedPanels || prev;
      setTopZIndex(nextZ);
      return {
        ...base,
        [panelId]: { ...base[panelId], zIndex: nextZ },
      };
    });
  }, [topZIndex, getNextZIndex]);

  /**
   * Toggle panel minimized state
   */
  const toggleMinimize = useCallback((panelId) => {
    setPanels(prev => {
      if (!prev[panelId]) return prev;
      return {
        ...prev,
        [panelId]: { ...prev[panelId], minimized: !prev[panelId].minimized },
      };
    });
  }, []);

  /**
   * Get panel state by ID
   */
  const getPanelState = useCallback((panelId) => {
    return panels[panelId] || null;
  }, [panels]);

  /**
   * Check if panel is currently open
   */
  const isPanelOpen = useCallback((panelId) => {
    return panels[panelId]?.isOpen || false;
  }, [panels]);

  /**
   * Get all open panels
   */
  const getOpenPanels = useCallback(() => {
    return Object.values(panels).filter(p => p.isOpen);
  }, [panels]);

  const value = {
    panels,
    openPanel,
    closePanel,
    togglePanel,
    updatePosition,
    updateSize,
    bringToFront,
    toggleMinimize,
    getPanelState,
    isPanelOpen,
    getOpenPanels,
  };

  return (
    <PanelShellContext.Provider value={value}>
      {children}
    </PanelShellContext.Provider>
  );
}

export default PanelShellContext;
