/**
 * @file viewAssignmentStore.js
 * @description Zustand store that brokers view-to-cell assignments between
 * requesters (focused mode, VG Editor) and the CompanionPanel.
 *
 * @example
 * import { useViewAssignment, viewAssignment } from '@UI/react/store/viewAssignmentStore';
 *
 * // Request an assignment (from focused view)
 * viewAssignment.request({
 *   vgId: 'vg-1',
 *   cellRow: 0,
 *   cellCol: 1,
 *   vgName: 'Analysis',
 *   vgColor: '#4a90d9',
 *   source: 'focusedView',
 *   onAssign: (view, mode) => { ... },
 *   onCancel: () => { ... },
 * });
 *
 * // Complete (from companion panel)
 * viewAssignment.complete(selectedView, 'replace');
 *
 * // Cancel
 * viewAssignment.cancel();
 */

import { create } from 'zustand';
import { colToLetter } from '@UI/react/components/panels/CanvasMapPanel/utils/gridUtils';

/**
 * Zustand store for view-to-cell assignment brokering
 */
export const useViewAssignment = create((set, get) => ({
  /**
   * Current assignment target, or null when idle.
   * @type {{ vgId: string, cellRow: number, cellCol: number, vgName: string, vgColor: string, source: string, onAssign: Function, onCancel: Function } | null}
   */
  target: null,

  /**
   * Request an assignment — sets the active target.
   * @param {Object} target - Assignment target details
   */
  requestAssignment: (target) => {
    set({ target });
  },

  /**
   * Complete the assignment — calls target.onAssign and clears state.
   * @param {Object} view - The selected view to assign
   * @param {string} mode - Assignment mode (e.g. 'replace', 'swap')
   */
  completeAssignment: (view, mode) => {
    const { target } = get();
    if (target?.onAssign) {
      target.onAssign(view, mode);
    }
    set({ target: null });
  },

  /**
   * Cancel the assignment — calls target.onCancel and clears state.
   */
  cancelAssignment: () => {
    const { target } = get();
    if (target?.onCancel) {
      target.onCancel();
    }
    set({ target: null });
  },
}));

// ── Selectors ─────────────────────────────────────────────────────────────────

/** @returns {boolean} Whether an assignment is currently in progress */
export const selectIsAssigning = (s) => s.target !== null;

/** @returns {string|null} Formatted cell reference like "Analysis → B2" */
export const selectTargetCellRef = (s) => {
  if (!s.target) return null;
  const { vgName, cellRow, cellCol } = s.target;
  const cellRef = `${colToLetter(cellCol)}${cellRow + 1}`;
  return `${vgName} → ${cellRef}`;
};

// ── Convenience imperative API ────────────────────────────────────────────────

/**
 * Imperative access to view assignment actions
 */
export const viewAssignment = {
  request: (target) => useViewAssignment.getState().requestAssignment(target),
  complete: (view, mode) => useViewAssignment.getState().completeAssignment(view, mode),
  cancel: () => useViewAssignment.getState().cancelAssignment(),
  getState: () => useViewAssignment.getState(),
};

export default useViewAssignment;
