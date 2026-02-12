/**
 * @file canvasTransactionStore.js
 * @description Zustand store for canvas operation history with undo/redo support
 * AND transactional editing (Edit Layout mode).
 *
 * Modes:
 * - 'quick' (default): Operations execute immediately and push to history.
 * - 'transactional': Operations are staged in a draft and only applied on commit.
 *
 * @example
 * import { useCanvasHistory, canvasHistory } from '@UI/react/store/canvasTransactionStore';
 *
 * // Record an operation (mode-aware)
 * canvasHistory.record({
 *   type: 'MOVE',
 *   description: 'Move view to B2',
 *   undo: () => movePlacement(id, oldRow, oldCol),
 *   redo: () => movePlacement(id, newRow, newCol),
 * });
 *
 * // Transaction workflow
 * canvasHistory.enterEditMode(snapshot);
 * // ... stage changes via record() ...
 * canvasHistory.commitTransaction();   // or discardTransaction()
 */

import { create } from "zustand";
import { toast } from "@UI/react/store/toastStore";
import { canvasLockService } from "@Services/canvasLockService";
import { syncCanvasEditingToYjs } from "@Collaboration/yjs/yjsSetup";

/**
 * Maximum number of operations to keep in history
 */
const MAX_HISTORY_SIZE = 50;

/**
 * Operation type definitions with icons and colors
 */
export const OPERATION_TYPES = {
  MOVE: { icon: 'move', color: 'green', label: 'Move' },
  SWAP: { icon: 'swapHoriz', color: 'amber', label: 'Swap' },
  ADD: { icon: 'add', color: 'blue', label: 'Add' },
  DELETE: { icon: 'trash', color: 'red', label: 'Delete' },
  RESIZE: { icon: 'aspectRatio', color: 'purple', label: 'Resize' },
  MERGE: { icon: 'merge', color: 'purple', label: 'Merge' },
  UNMERGE: { icon: 'layers', color: 'amber', label: 'Unmerge' },
  CANVAS_RESIZE: { icon: 'grid3x3', color: 'blue', label: 'Canvas Resize' },
  BATCH: { icon: 'layers', color: 'teal', label: 'Batch' },
};

/**
 * @typedef {Object} HistoryEntry
 * @property {string} id - Unique entry identifier
 * @property {string} type - Operation type (from OPERATION_TYPES)
 * @property {string} description - Human-readable description
 * @property {Function} undo - Function to undo this operation
 * @property {Function} redo - Function to redo this operation
 * @property {number} timestamp - When the operation occurred
 */

let entryIdCounter = 0;

/**
 * Deep-clone a plain object (positions, dimensions, etc.)
 */
function deepClone(obj) {
  if (obj == null || typeof obj !== 'object') return obj;
  return JSON.parse(JSON.stringify(obj));
}

/**
 * Zustand store for canvas operation history + transactional editing
 */
export const useCanvasHistory = create((set, get) => ({
  // ── History stacks ──────────────────────────────────────────────────────
  past: [],
  future: [],

  // Operation flags to prevent recording during undo/redo
  isUndoing: false,
  isRedoing: false,

  // ── Transaction state ───────────────────────────────────────────────────
  mode: 'quick', // 'quick' | 'transactional'
  draft: {
    operations: [],
    snapshot: null,
    canvasSnapshot: null,
  },
  lock: null,            // { id, canvasId, lockedBy, lockedByName, expiresAt, timeRemaining } | null
  remoteLock: null,      // { canvasId, lockedBy, lockedByName, expiresAt, timeRemaining } | null — another user's lock
  timeRemaining: null,   // seconds, updated by heartbeat interval
  auditLog: [],          // append-only audit entries
  savePoints: [],        // { id, name, operationIndex, timestamp }
  reactions: {},         // { [changeId]: [{ userId, userName, userColor, emoji, timestamp }] }

  // ── Y.js draft broadcast ────────────────────────────────────────────────
  /**
   * Broadcast current draft state to Y.js for collaborative preview.
   * Called after each draft mutation (record, revert, reactions, enter/exit edit mode).
   */
  _broadcastDraft: () => {
    const state = get();
    if (state.mode !== 'transactional') {
      syncCanvasEditingToYjs(state.lock?.lockedBy, null);
      return;
    }
    syncCanvasEditingToYjs(state.lock?.lockedBy, {
      operations: state.draft.operations.map((op) => ({
        id: op.id,
        type: op.type,
        description: op.description,
        timestamp: op.timestamp,
      })),
      reactions: state.reactions,
      snapshot: state.draft.snapshot,
      timestamp: Date.now(),
    });
  },

  // ── Mode-aware record ───────────────────────────────────────────────────
  /**
   * Record a new operation.
   * - quick mode: execute redo() immediately, push to past[], clear future[]
   * - transactional mode: push to draft.operations[] WITHOUT executing
   */
  record: ({ type, description, undo, redo }) => {
    const state = get();

    // Don't record if we're in the middle of undo/redo
    if (state.isUndoing || state.isRedoing) {
      return;
    }

    const entry = {
      id: `op-${++entryIdCounter}-${Date.now()}`,
      type,
      description,
      undo,
      redo,
      timestamp: Date.now(),
    };

    if (state.mode === 'transactional') {
      // Stage to draft – caller is responsible for visual updates
      set((s) => ({
        draft: {
          ...s.draft,
          operations: [...s.draft.operations, entry],
        },
        auditLog: [...s.auditLog, { action: 'stage', entryId: entry.id, type, description, timestamp: Date.now() }],
      }));
      get()._broadcastDraft();
      return;
    }

    // Quick mode – existing behavior
    set((s) => {
      let newPast = [...s.past, entry];
      if (newPast.length > MAX_HISTORY_SIZE) {
        newPast = newPast.slice(-MAX_HISTORY_SIZE);
      }
      return {
        past: newPast,
        future: [],
        auditLog: [...s.auditLog, { action: 'quickRecord', type, description, timestamp: Date.now() }],
      };
    });
  },

  // ── Enter / Exit Edit Mode ──────────────────────────────────────────────
  /**
   * Enter transactional edit mode.
   * Acquires a server lock on the canvas, then sets local state.
   *
   * @param {Object} snapshot - Deep clone of current VG positions + canvas dims
   * @param {Object} [snapshot.viewGroups] - Array of { id, position: {row,col,rowSpan,colSpan} }
   * @param {Object} [snapshot.canvasDimensions] - { rows, cols }
   * @param {Object} [options]
   * @param {string} [options.canvasId] - Canvas ID for server lock
   * @param {string} [options.userName] - Current user display name
   * @returns {Promise<{ success: boolean, conflict?: Object }>}
   */
  enterEditMode: async (snapshot, options = {}) => {
    const state = get();
    if (state.mode === 'transactional') return { success: true }; // already in edit mode

    // Attempt to acquire server lock if canvasId is provided
    let serverLock = null;
    if (options.canvasId) {
      try {
        const result = await canvasLockService.tryAcquire(options.canvasId, {
          userName: options.userName,
        });
        if (!result.success) {
          // Another user holds the lock
          const lockedBy = result.conflict?.lockedByName || 'another user';
          toast.error(`Canvas is locked by ${lockedBy}`);
          return { success: false, conflict: result.conflict };
        }
        serverLock = result.lock;
      } catch (err) {
        console.error('[canvasTransaction] Failed to acquire lock:', err);
        toast.error('Failed to acquire canvas lock');
        return { success: false };
      }
    }

    set({
      mode: 'transactional',
      draft: {
        operations: [],
        snapshot: deepClone(snapshot?.viewGroups || null),
        canvasSnapshot: deepClone(snapshot?.canvasDimensions || null),
      },
      lock: serverLock,
      timeRemaining: serverLock?.timeRemaining || null,
      savePoints: [],
      auditLog: [...state.auditLog, { action: 'enterEditMode', timestamp: Date.now() }],
    });

    get()._broadcastDraft();
    return { success: true };
  },

  /**
   * Commit all staged operations as a single BATCH entry in history.
   * Releases the server lock after committing.
   */
  commitTransaction: async () => {
    const state = get();
    if (state.mode !== 'transactional') return;

    const ops = state.draft.operations;
    const serverLock = state.lock;

    if (ops.length === 0) {
      // Nothing to commit – release lock and exit edit mode
      if (serverLock?.canvasId) {
        try { await canvasLockService.release(serverLock.canvasId); } catch (err) {
          console.warn('[canvasTransaction] lock release failed:', err);
        }
      }
      set({
        mode: 'quick',
        draft: { operations: [], snapshot: null, canvasSnapshot: null },
        lock: null,
        timeRemaining: null,
        savePoints: [],
      });
      get()._broadcastDraft(); // Clear remote draft
      toast.info('No changes to commit');
      return;
    }

    // Execute all redo operations in order
    for (const op of ops) {
      try {
        await op.redo();
      } catch (err) {
        console.error('[canvasTransaction] redo failed during commit:', err);
      }
    }

    // Wrap as a single BATCH entry in history
    const batchEntry = {
      id: `op-${++entryIdCounter}-${Date.now()}`,
      type: 'BATCH',
      description: `Batch: ${ops.length} change${ops.length !== 1 ? 's' : ''}`,
      undo: async () => {
        // Undo in reverse order
        for (let i = ops.length - 1; i >= 0; i--) {
          try { await ops[i].undo(); } catch (err) {
            console.error('[canvasTransaction] batch undo failed:', err);
          }
        }
      },
      redo: async () => {
        for (const op of ops) {
          try { await op.redo(); } catch (err) {
            console.error('[canvasTransaction] batch redo failed:', err);
          }
        }
      },
      timestamp: Date.now(),
    };

    // Release server lock
    if (serverLock?.canvasId) {
      try { await canvasLockService.release(serverLock.canvasId); } catch (err) {
        console.warn('[canvasTransaction] lock release failed:', err);
      }
    }

    set((s) => {
      let newPast = [...s.past, batchEntry];
      if (newPast.length > MAX_HISTORY_SIZE) {
        newPast = newPast.slice(-MAX_HISTORY_SIZE);
      }
      return {
        past: newPast,
        future: [],
        mode: 'quick',
        draft: { operations: [], snapshot: null, canvasSnapshot: null },
        lock: null,
        timeRemaining: null,
        savePoints: [],
        auditLog: [...s.auditLog, {
          action: 'commit',
          entryId: batchEntry.id,
          opCount: ops.length,
          operations: ops.map((o) => ({ type: o.type, description: o.description })),
          timestamp: Date.now(),
        }],
      };
    });

    get()._broadcastDraft(); // Clear remote draft
    toast.success(`Committed ${ops.length} change${ops.length !== 1 ? 's' : ''}`);
  },

  /**
   * Discard all staged operations (call undo in reverse) and exit edit mode.
   * Releases the server lock after discarding.
   */
  discardTransaction: async () => {
    const state = get();
    if (state.mode !== 'transactional') return;

    const ops = state.draft.operations;
    const serverLock = state.lock;

    // Undo staged operations in reverse order
    for (let i = ops.length - 1; i >= 0; i--) {
      try {
        await ops[i].undo();
      } catch (err) {
        console.error('[canvasTransaction] undo failed during discard:', err);
      }
    }

    // Release server lock
    if (serverLock?.canvasId) {
      try { await canvasLockService.release(serverLock.canvasId); } catch (err) {
        console.warn('[canvasTransaction] lock release failed:', err);
      }
    }

    set((s) => ({
      mode: 'quick',
      draft: { operations: [], snapshot: null, canvasSnapshot: null },
      lock: null,
      timeRemaining: null,
      savePoints: [],
      auditLog: [...s.auditLog, { action: 'discard', opCount: ops.length, timestamp: Date.now() }],
    }));

    get()._broadcastDraft(); // Clear remote draft
    toast.info('Changes discarded');
  },

  /**
   * Revert a specific staged operation by id.
   */
  revertDraftOperation: async (operationId) => {
    const state = get();
    if (state.mode !== 'transactional') return;

    const idx = state.draft.operations.findIndex((op) => op.id === operationId);
    if (idx === -1) return;

    const op = state.draft.operations[idx];
    try {
      await op.undo();
    } catch (err) {
      console.error('[canvasTransaction] revert failed:', err);
    }

    set((s) => ({
      draft: {
        ...s.draft,
        operations: s.draft.operations.filter((o) => o.id !== operationId),
      },
      auditLog: [...s.auditLog, { action: 'revertOp', operationId, timestamp: Date.now() }],
    }));
    get()._broadcastDraft();
  },

  /**
   * Create a named save point within the current transaction.
   */
  createSavePoint: (name) => {
    const state = get();
    if (state.mode !== 'transactional') return;

    const savePoint = {
      id: `sp-${Date.now()}`,
      name: name || `Save Point ${state.savePoints.length + 1}`,
      operationIndex: state.draft.operations.length,
      timestamp: Date.now(),
    };

    set((s) => ({
      savePoints: [...s.savePoints, savePoint],
    }));
  },

  /**
   * Revert to a save point – undo all operations after the save point index.
   */
  revertToSavePoint: async (savePointId) => {
    const state = get();
    if (state.mode !== 'transactional') return;

    const sp = state.savePoints.find((s) => s.id === savePointId);
    if (!sp) return;

    const ops = state.draft.operations;
    // Undo operations from the end back to the save point index
    for (let i = ops.length - 1; i >= sp.operationIndex; i--) {
      try {
        await ops[i].undo();
      } catch (err) {
        console.error('[canvasTransaction] revert to save point failed:', err);
      }
    }

    set((s) => ({
      draft: {
        ...s.draft,
        operations: s.draft.operations.slice(0, sp.operationIndex),
      },
      savePoints: s.savePoints.filter((p) => p.operationIndex <= sp.operationIndex),
      auditLog: [...s.auditLog, { action: 'revertToSavePoint', savePointId, timestamp: Date.now() }],
    }));
  },

  // ── Reactions ──────────────────────────────────────────────────────────
  addReaction: (changeId, { userId, userName, userColor, emoji }) => {
    set((s) => {
      const existing = s.reactions[changeId] || [];
      if (existing.some((r) => r.userId === userId && r.emoji === emoji)) return s;
      return {
        reactions: {
          ...s.reactions,
          [changeId]: [...existing, { userId, userName, userColor, emoji, timestamp: Date.now() }],
        },
      };
    });
    get()._broadcastDraft();
  },

  removeReaction: (changeId, userId, emoji) => {
    set((s) => {
      const existing = s.reactions[changeId] || [];
      return {
        reactions: {
          ...s.reactions,
          [changeId]: existing.filter((r) => !(r.userId === userId && r.emoji === emoji)),
        },
      };
    });
    get()._broadcastDraft();
  },

  // ── Remote lock (another user's lock) ──────────────────────────────────
  setRemoteLock: (lockData) => set({ remoteLock: lockData }),
  clearRemoteLock: () => set({ remoteLock: null }),

  // ── Lock management ─────────────────────────────────────────────────────
  /**
   * Extend the current server lock.
   * @returns {Promise<boolean>} Whether extension succeeded
   */
  extendLock: async () => {
    const state = get();
    if (!state.lock?.canvasId) return false;

    try {
      const result = await canvasLockService.extend(state.lock.canvasId);
      set((s) => ({
        lock: { ...s.lock, expiresAt: result.expiresAt, extendCount: result.extendCount },
        timeRemaining: result.timeRemaining,
        auditLog: [...s.auditLog, {
          action: 'extendLock',
          extendCount: result.extendCount,
          timeRemaining: result.timeRemaining,
          timestamp: Date.now(),
        }],
      }));
      return true;
    } catch (err) {
      console.error('[canvasTransaction] lock extension failed:', err);
      if (err.status === 400) {
        toast.warning('Maximum lock extensions reached');
      }
      return false;
    }
  },

  /**
   * Refresh lock status from server (for heartbeat / countdown).
   */
  refreshLockStatus: async () => {
    const state = get();
    if (!state.lock?.canvasId) return;

    try {
      const status = await canvasLockService.getStatus(state.lock.canvasId);
      if (status.locked && status.lock) {
        set({ timeRemaining: status.lock.timeRemaining });
      } else {
        // Lock expired on server
        console.warn('[canvasTransaction] Lock expired on server');
        set((s) => ({
          lock: null,
          timeRemaining: 0,
          auditLog: [...s.auditLog, {
            action: 'lockExpired',
            timestamp: Date.now(),
          }],
        }));
        toast.warning('Canvas lock expired — please save your changes');
      }
    } catch (err) {
      console.error('[canvasTransaction] lock status refresh failed:', err);
    }
  },

  // ── Standard undo / redo (quick mode only) ──────────────────────────────
  /**
   * Undo the last operation
   */
  undo: async () => {
    const state = get();
    if (state.past.length === 0 || state.isUndoing || state.isRedoing) {
      return;
    }

    const entry = state.past[state.past.length - 1];

    set({ isUndoing: true });

    try {
      await entry.undo();

      set((state) => ({
        past: state.past.slice(0, -1),
        future: [entry, ...state.future],
        isUndoing: false,
      }));

      toast.info(`Undo: ${entry.description}`, {
        actionLabel: 'Redo',
        onAction: () => get().redo(),
        duration: 3000,
      });
    } catch (error) {
      console.error('Undo failed:', error);
      set({ isUndoing: false });
      toast.error(`Failed to undo: ${entry.description}`);
    }
  },

  /**
   * Redo the last undone operation
   */
  redo: async () => {
    const state = get();
    if (state.future.length === 0 || state.isUndoing || state.isRedoing) {
      return;
    }

    const entry = state.future[0];

    set({ isRedoing: true });

    try {
      await entry.redo();

      set((state) => ({
        past: [...state.past, entry],
        future: state.future.slice(1),
        isRedoing: false,
      }));

      toast.info(`Redo: ${entry.description}`, {
        actionLabel: 'Undo',
        onAction: () => get().undo(),
        duration: 3000,
      });
    } catch (error) {
      console.error('Redo failed:', error);
      set({ isRedoing: false });
      toast.error(`Failed to redo: ${entry.description}`);
    }
  },

  /**
   * Clear all history
   */
  clear: () => {
    set({ past: [], future: [] });
  },

  /**
   * Get undo availability
   */
  get canUndo() {
    return get().past.length > 0 && !get().isUndoing && !get().isRedoing;
  },

  /**
   * Get redo availability
   */
  get canRedo() {
    return get().future.length > 0 && !get().isUndoing && !get().isRedoing;
  },
}));

// ── Selectors (for use in components) ─────────────────────────────────────

/**
 * @returns {boolean} Whether we are in transactional edit mode
 */
export const selectIsEditMode = (state) => state.mode === 'transactional';

/**
 * @returns {Array} Pending draft operations
 */
export const selectPendingChanges = (state) => state.draft.operations;

/**
 * @returns {number} Count of pending draft operations
 */
export const selectPendingChangeCount = (state) => state.draft.operations.length;

/**
 * @returns {boolean} Whether commit is available (edit mode + changes)
 */
export const selectCanCommit = (state) =>
  state.mode === 'transactional' && state.draft.operations.length > 0;

// ── Convenience imperative API ────────────────────────────────────────────

/**
 * Convenience object for imperative access to canvas history
 */
export const canvasHistory = {
  record: (entry) => useCanvasHistory.getState().record(entry),
  undo: () => useCanvasHistory.getState().undo(),
  redo: () => useCanvasHistory.getState().redo(),
  clear: () => useCanvasHistory.getState().clear(),

  // Transaction methods
  enterEditMode: (snapshot, options) => useCanvasHistory.getState().enterEditMode(snapshot, options),
  commitTransaction: () => useCanvasHistory.getState().commitTransaction(),
  discardTransaction: () => useCanvasHistory.getState().discardTransaction(),
  revertDraftOperation: (id) => useCanvasHistory.getState().revertDraftOperation(id),
  createSavePoint: (name) => useCanvasHistory.getState().createSavePoint(name),
  revertToSavePoint: (id) => useCanvasHistory.getState().revertToSavePoint(id),

  // Lock methods
  extendLock: () => useCanvasHistory.getState().extendLock(),
  refreshLockStatus: () => useCanvasHistory.getState().refreshLockStatus(),

  // Reaction methods
  addReaction: (changeId, data) => useCanvasHistory.getState().addReaction(changeId, data),
  removeReaction: (changeId, userId, emoji) => useCanvasHistory.getState().removeReaction(changeId, userId, emoji),

  // Remote lock methods
  setRemoteLock: (data) => useCanvasHistory.getState().setRemoteLock(data),
  clearRemoteLock: () => useCanvasHistory.getState().clearRemoteLock(),

  canUndo: () => {
    const state = useCanvasHistory.getState();
    return state.past.length > 0 && !state.isUndoing && !state.isRedoing;
  },
  canRedo: () => {
    const state = useCanvasHistory.getState();
    return state.future.length > 0 && !state.isUndoing && !state.isRedoing;
  },
  getState: () => useCanvasHistory.getState(),
};

export default useCanvasHistory;
