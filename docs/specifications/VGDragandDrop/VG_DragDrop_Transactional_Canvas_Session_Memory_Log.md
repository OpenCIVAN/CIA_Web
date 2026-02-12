# VG Drag-and-Drop & Transactional Canvas Editing — Session Memory Log

**Date:** February 11, 2026  
**Session Focus:** Designing ViewGroup template drag-and-drop interactions + transactional canvas editing mode with locking, draft layers, and collaborative awareness  
**Previous Sessions:** Canvas Map Tabs Design, CompanionPanel V3, VG Editor, Layout Tab V4 series, PanelShell Architecture, Canvas Map Panel Design

---

## Summary

Designed a complete two-mode canvas editing system: **Quick Mode** (immediate auto-commit drag-and-drop) and **Transactional Edit Mode** (staged changes with full canvas lock, draft layer, reactions, timeout, and atomic commit). Unified this with the existing `CanvasOperationsPanel` and `canvasHistoryStore` into a single `canvasTransactionStore` architecture where the visual editing layer (CanvasMapPanel) and the monitoring dashboard (CanvasOperationsPanel) read from the same Zustand store.

---

## Key Decisions Made

### 1. Two Editing Modes

| Mode | Behavior | Use Case |
|------|----------|----------|
| **Quick Mode** (default) | Each drag-and-drop auto-commits immediately | Everyday fast workflow — add a VG, done |
| **Transactional Edit Mode** | All changes staged, reviewed, committed atomically | Restructuring layouts, complex rearrangements |

Quick mode = `git commit` per action. Transactional mode = working branch that gets merged on commit.

### 2. Transactional Edit Mode — Lock & Collaboration

| Aspect | Decision |
|--------|----------|
| **Lock scope** | Full canvas lock — others can't modify any layout during a transaction |
| **Collaborator visibility** | Live 'draft' layer they can toggle on/off — see proposed changes in real-time |
| **Timeout** | Configurable per-workspace with sensible default (5min recommended). Prompt: "Still editing? Extend / Commit / Discard" |
| **Collaborator feedback** | Inline reactions on draft changes (👍 ⚠️ ❓ 🎯) — lightweight approval flow |
| **Undo on commit** | Full undo available in session history (revert to pre-commit state via save points) |
| **CanvasOpsPanel on edit** | Optional — toast notification with "Open Operations Panel" button, not auto-open |

### 3. Unified Store: canvasTransactionStore

**Decision:** Extend existing `canvasHistoryStore.js` into `canvasTransactionStore.js` (not replace, not keep both).

**Rationale:** Transactions are a superset of history. The existing `record()`, `undo()`, `redo()` API stays identical — behavior changes based on mode. Existing consumers don't break. One store = one source of truth for both CanvasMapPanel and CanvasOperationsPanel.

### 4. Two Panels, One Store

| Panel | Role | Lives In |
|-------|------|----------|
| **CanvasMapPanel** | Visual interaction layer — drag VGs, see ghosts, commit bar | PanelShell floating panel (left area) |
| **CanvasOperationsPanel** | Monitoring dashboard — pending ops, audit log, users, save points | PanelShell floating panel (opens on demand) |

Both read from `canvasTransactionStore`. The "Edit Layout" button lives in CanvasMapPanel. When entering edit mode, a toast appears: "Edit session started — [Open Operations Panel]".

### 5. Smart Placement Algorithm

Center-on-cursor positioning with spiral search outward for nearest valid empty space. Auto-expands canvas in direction closest to cursor when no space available.

```
findSmartPosition(canvas, tRows, tCols, cursorRow, cursorCol, existingVGs)
  → { row, col, expanded, newRows, newCols, valid }
```

### 6. Drop Zone Detection

Uses `document.elementsFromPoint()` + `data-dropzone` attributes on minimap/canvas elements, NOT bounding rect math (fragile in iframe environments). All overlay elements (ghosts, labels, grid lines) have `pointerEvents: 'none'`.

### 7. Drag Interaction Pattern

Uses pointer events (`pointerdown`/`pointermove`/`pointerup`) instead of HTML5 Drag API (unreliable in artifact/iframe contexts). Custom floating drag preview follows cursor.

---

## Drag-and-Drop Interaction Specification

### Template Types (from CompanionPanel → ViewGroups tab)

- **Templates tab:** Empty structural shells (create new VG) — dashed borders
- **ViewGroups tab:** Populated clones with views/config (duplicate existing VG) — solid borders

### Drop Targets

Both **minimap** (in CanvasMapPanel) and **main canvas** accept drops.

### Visual Feedback Layers

1. **Drag Preview** (cursor-attached): Floating card with layout mini-preview, name, dimensions. Follows cursor via window pointermove listener.

2. **Ghost Footprint** (on grid): Colored outline at smart-placed position showing internal cell structure. Smooth CSS transitions (0.12s ease-out) between positions as cursor moves.

3. **Expansion Preview** (contextual): When auto-expand needed, hatched overlay + dimension badge shows proposed canvas growth.

### Post-Drop Behavior

- **Quick mode:** VG created immediately, toast confirms placement
- **Transactional mode:** VG staged in draft, change logged in pending list
- **Empty template → would drill into VG Editor** (noted in toast)
- **Populated clone → stays on canvas** (clone confirmed in toast)
- **Panel stays open** after drop for rapid sequential placement

### Move Interaction (Transactional Mode Only)

In edit mode, existing VGs become draggable on minimap/canvas:
- `pointerdown` on VG starts move (cursor changes to grab)
- Same ghost footprint + smart placement as template drag
- Original position shown at 30% opacity during drag
- Drop records a MOVE change in the pending log
- Original VG fades, ghost animates to new position

### Remove Interaction (Transactional Mode Only)

- ✕ button on each VG in minimap (small, top-right corner) and main canvas (in header bar)
- Records REMOVE change in pending log
- VG removed from draft state immediately
- Collaborators see red dashed outline at original position with "Removing" label

---

## Transactional Edit Mode — Detailed Flow

### Entering Edit Mode

1. User clicks "✏ Edit Layout" button in CanvasMapPanel header
2. `canvasTransactionStore.enterEditMode(userId)` called
3. Server request acquires canvas lock (full lock on layout operations)
4. Draft state created: deep clone of committed VGs + canvas
5. Timer starts (configurable, default 5min)
6. Visual changes: amber accent on CanvasMapPanel header, "EDITING" badge, commit/discard bar appears
7. Toast: "Edit session started — [Open Operations Panel]"
8. Y.js broadcasts lock state to all collaborators

### During Edit Mode

- **Add VGs:** Drag from CompanionPanel → staged in draft, logged as ADD change
- **Move VGs:** Drag existing VGs on minimap/canvas → staged, logged as MOVE change
- **Remove VGs:** Click ✕ → staged, logged as REMOVE change
- **Undo per-change:** Each change in pending log has individual undo button
- **Timer:** Countdown visible in header. At expiry → "Still editing?" prompt

### Committing

1. User clicks "✓ Commit (N)" button
2. `canvasTransactionStore.commitTransaction()` called
3. Auto-creates save point of pre-commit state (for full undo)
4. All draft changes applied atomically via `Y.doc.transact()`
5. Lock released via server
6. Audit log entries created for each change (includes userId, timestamp, detail)
7. All collaborators receive Y.js update — see instant layout change
8. Toast: "Layout committed — N changes applied"

### Discarding

1. User clicks "✕ Discard" button
2. Draft state destroyed, committed state unchanged
3. Lock released
4. Toast: "Draft discarded — layout unchanged"

### Timeout Flow

1. Timer reaches 0 → modal: "Still editing? Your edit session is about to expire. Other collaborators are waiting."
2. Three options: **Extend** (adds configurable increment), **Commit** (applies changes), **Discard** (rolls back)
3. If no response after second timeout → auto-discard + lock release (prevents abandoned locks)

### Collaborator Experience

1. See lock banner: "Canvas locked by [User] — Editing layout · N pending changes"
2. Draft layer toggle (checkbox): when ON, see:
   - New VGs at proposed positions (with "NEW" badge, slightly transparent)
   - Moved VGs at new positions (with "MOVED" badge) + red dashed outline at original position
   - Removed VGs shown as red dashed outline with "Removing" label
3. Inline reactions on each pending change in CanvasOperationsPanel's Transaction tab
4. Can use voice chat (LiveKit) to discuss proposed changes in real-time
5. Cannot modify canvas layout until lock releases

---

## canvasTransactionStore Architecture

### Extension of canvasHistoryStore

The store is renamed from `canvasHistoryStore.js` → `canvasTransactionStore.js` with a compatibility re-export at the old path.

```javascript
// canvasHistoryStore.js (compat shim)
export { useCanvasHistory, canvasHistory } from './canvasTransactionStore';
```

### Store Shape

```javascript
canvasTransactionStore = {
  // ── EXISTING (unchanged API) ──────────────────────────────
  past: HistoryEntry[],           // Undo stack (max 50)
  future: HistoryEntry[],         // Redo stack
  isUndoing: boolean,
  isRedoing: boolean,
  
  record(entry),                  // Mode-aware: quick → execute+audit, transactional → stage
  undo(),                         // In transaction: undo last staged change
  redo(),                         // In transaction: redo last undone staged change
  clear(),
  
  // Existing selectors
  canUndo: boolean,
  canRedo: boolean,
  
  // Existing OPERATION_TYPES (MOVE, SWAP, ADD, DELETE, RESIZE, MERGE, etc.)

  // ── NEW: Transaction Layer ────────────────────────────────
  mode: 'quick' | 'transactional',
  
  lock: {
    userId: string,
    userName: string,
    startedAt: number,            // timestamp
    expiresAt: number,            // timestamp
    extendCount: number,          // how many times extended
  } | null,
  
  draft: {
    snapshot: object,             // Deep clone of committed state at transaction start
    changeLog: ChangeEntry[],     // Ordered list of staged changes
  } | null,
  
  timeRemaining: number | null,   // Seconds remaining (null when not editing)
  timeoutConfig: {
    defaultSeconds: number,       // Configurable per-workspace (default 300)
    extensionSeconds: number,     // How much each "Extend" adds (default 300)
    maxExtensions: number,        // Cap on extensions (default 5)
  },
  
  // Transaction actions
  enterEditMode(userId, userName),  // Acquires lock, clones state, starts timer
  commitTransaction(),              // Applies draft atomically, creates save point, releases lock
  discardTransaction(),             // Destroys draft, releases lock
  extendTimeout(),                  // Adds extensionSeconds to timer
  
  // Transaction selectors
  isEditMode: boolean,
  isLocked: boolean,
  lockOwner: { userId, userName } | null,
  pendingChanges: ChangeEntry[],
  pendingChangeCount: number,
  canCommit: boolean,               // isEditMode && pendingChangeCount > 0
  
  // ── NEW: Save Points ──────────────────────────────────────
  savePoints: SavePoint[],
  
  createSavePoint(label),           // Snapshot current committed state
  revertToSavePoint(id),            // Restore committed state from snapshot
  deleteSavePoint(id),
  
  // ── NEW: Audit Trail ──────────────────────────────────────
  auditLog: AuditEntry[],          // Append-only, never pruned (persisted to server)
  
  getAuditRange(startTime, endTime),
  
  // ── NEW: Reactions (Collaborative) ────────────────────────
  reactions: { [changeId]: Reaction[] },
  
  addReaction(changeId, userId, emoji),
  removeReaction(changeId, userId, emoji),
};
```

### Type Definitions

```typescript
interface ChangeEntry {
  id: string;
  type: 'ADD' | 'MOVE' | 'REMOVE' | 'RESIZE' | 'MERGE' | 'CANVAS_RESIZE';
  label: string;                    // Human-readable: 'Added "2×2 Grid"'
  detail: string;                   // Context: 'At B3 (2×2)'
  timestamp: number;
  // For undo within transaction:
  undo: () => void;                 // Reverts this specific change in draft
  redo: () => void;                 // Re-applies this specific change in draft
}

interface SavePoint {
  id: string;
  label: string;                    // User-provided or auto-generated
  snapshot: object;                 // Deep clone of committed state
  createdAt: number;
  createdBy: string;                // userId
  auto: boolean;                    // true for auto-created (pre-commit)
}

interface AuditEntry {
  id: string;
  type: string;                     // OPERATION_TYPES key
  userId: string;
  userName: string;
  mode: 'quick' | 'transactional'; // Which mode generated this
  transactionId: string | null;     // Groups changes from same transaction
  description: string;
  detail: string;
  timestamp: number;
}

interface Reaction {
  userId: string;
  userName: string;
  userColor: string;
  emoji: string;                    // 👍 ⚠️ ❓ 🎯
  timestamp: number;
}
```

### Mode-Aware record() Behavior

```javascript
record(entry) {
  const { mode, draft } = get();
  
  if (mode === 'quick') {
    // Execute immediately (existing behavior)
    entry.redo();
    // Add to undo stack
    set(state => ({
      past: [...state.past.slice(-MAX_HISTORY_SIZE + 1), { ...entry, id: nextId(), timestamp: Date.now() }],
      future: [],
    }));
    // Append to audit log
    appendAudit(entry, 'quick', null);
  }
  
  if (mode === 'transactional') {
    // Stage to draft — do NOT execute against committed state
    // Instead, apply to draft state
    const changeEntry = { ...entry, id: nextId(), timestamp: Date.now() };
    set(state => ({
      draft: {
        ...state.draft,
        changeLog: [...state.draft.changeLog, changeEntry],
      },
    }));
    // Don't append to audit yet — audit happens on commit
  }
}
```

### Y.js Integration

```javascript
commitTransaction() {
  const { draft, lock } = get();
  if (!draft || !lock) return;
  
  const transactionId = generateId();
  
  // Auto-create save point of pre-commit state
  get().createSavePoint(`Before: ${draft.changeLog.length} changes`);
  
  // Apply all changes atomically via Y.js
  yDoc.transact(() => {
    draft.changeLog.forEach(change => {
      change.redo();  // Each change applies to Y.js shared state
    });
  }, 'canvas-transaction-commit');
  
  // Log all changes to audit trail with shared transactionId
  draft.changeLog.forEach(change => {
    appendAudit(change, 'transactional', transactionId);
  });
  
  // Release lock via server
  releaseLock(lock.userId);
  
  // Clean up
  set({ mode: 'quick', draft: null, lock: null, timeRemaining: null });
}
```

### Server Lock Protocol

```
POST /api/sessions/:sessionId/canvas/lock
  Body: { userId, userName, timeoutSeconds }
  Response: { lockId, expiresAt } | 409 Conflict (already locked)

PUT /api/sessions/:sessionId/canvas/lock/:lockId/extend
  Body: { additionalSeconds }
  Response: { expiresAt }

DELETE /api/sessions/:sessionId/canvas/lock/:lockId
  Response: 204 (lock released)

// Server-side: auto-releases lock after expiry + grace period
// Broadcasts lock state changes via Y.js awareness
```

---

## Panel Relationship Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                   canvasTransactionStore                      │
│                      (Zustand)                                │
│                                                               │
│  mode | lock | draft | savePoints | auditLog | reactions     │
│  record() | undo() | redo() | commit() | discard()           │
└──────────┬─────────────────────────────────┬────────────────┘
           │                                 │
    ┌──────▼──────────────┐       ┌─────────▼────────────────┐
    │   CanvasMapPanel     │       │  CanvasOperationsPanel    │
    │   (Visual Editing)   │       │  (Monitoring Dashboard)   │
    │                      │       │                           │
    │  "Edit Layout" btn   │       │  Transaction tab:         │
    │  Minimap w/ ghosts   │       │    pending changes        │
    │  Drag-to-move VGs    │       │    + undo per-change      │
    │  Drag-to-add VGs     │       │    + reactions             │
    │  Remove buttons      │       │  Audit Log tab:           │
    │  Commit/Discard bar  │       │    full history + filter  │
    │                      │       │  Users tab:               │
    │  Main canvas also    │       │    lock info + who's on   │
    │  accepts drops       │       │  Save Points tab:         │
    └──────────────────────┘       │    create/revert/delete   │
                                   └───────────────────────────┘
```

---

## Existing Code Integration Points

### Files That Need Modification

| File | Change |
|------|--------|
| `src/ui/react/store/canvasHistoryStore.js` | Rename → `canvasTransactionStore.js`, extend with transaction/lock/savepoint/audit state |
| `src/ui/react/store/canvasHistoryStore.js` (old path) | Keep as re-export shim for backward compat |
| `src/ui/react/components/panels/FloatingPanel/CanvasOperationsPanel.jsx` | Wire to `canvasTransactionStore` instead of prop-based `pendingOperations`/`transactions` |
| `src/ui/react/CIAWebApp.jsx` | Remove prop-based wiring for CanvasOpsPanel, let it read from store directly |
| `src/ui/react/components/panels/CanvasMapPanel/CanvasMapContent.jsx` | Add "Edit Layout" button, commit/discard bar, drag-to-move for VGs |
| `src/ui/react/components/panels/LayoutPanel/LayoutPanel.logic.js` | Existing `editMode`/`toggleEditMode` should delegate to `canvasTransactionStore` |
| `src/ui/react/components/panels/LayoutPanel/components/CanvasNavigator/CanvasNavigator.logic.js` | MARK_SAVED / RESET_TO_SAVED should use save points from transaction store |

### Files That Stay Unchanged

- `PanelShell/` — both panels already use PanelShell architecture
- `CompanionPanel/` — drag source for templates, doesn't need mode awareness
- VTK instance types — canvas editing doesn't affect instance rendering
- Y.js core — `doc.transact()` is already available, just not used for layout yet

### LayoutPanel.logic.js editMode Migration

The existing `editMode`, `toggleEditMode`, `exitEditMode` in LayoutPanel.logic.js currently manage local panel state. These should become thin wrappers around the store:

```javascript
// Before (local state):
const [editMode, setEditMode] = useState(false);
const toggleEditMode = () => setEditMode(!editMode);

// After (store-driven):
const { isEditMode, enterEditMode, discardTransaction } = useCanvasTransaction();
const toggleEditMode = () => isEditMode ? discardTransaction() : enterEditMode(userId);
```

---

## Session Recording Implications

Transactions create cleaner recording segments:
- Quick mode: each `record()` is a discrete event in the recording
- Transactional mode: the recording shows: "User X entered edit mode" → brief pause → "User X committed N changes" (atomic)
- Playback skips the micro-mutations during edit mode — shows before/after states
- The `transactionId` in audit entries lets the recording system group related changes

---

## VR Considerations

- **Edit mode in VR:** "Edit Layout" on wrist menu or canvas operations quick-action
- **Draft visualization:** Translucent/ghosted VGs overlaid on current layout (holographic preview)
- **Commit gesture:** Two-hand confirm gesture or wrist-menu button
- **Timeout prompt:** Appears as a floating dialog anchored to user's view
- **Collaborator reactions:** Emoji appear as floating indicators near the relevant VG in 3D space
- **Move VGs in VR:** Point laser at VG, grip to grab, move, release to place (same smart placement)

---

## Implementation Order

### Phase 1: Store Foundation
1. Rename `canvasHistoryStore.js` → `canvasTransactionStore.js`
2. Add transaction state (mode, lock, draft, timeRemaining)
3. Add save points state and actions
4. Add audit trail state
5. Make `record()` mode-aware
6. Create re-export shim at old path
7. Add server lock endpoints (`/canvas/lock`)

### Phase 2: CanvasMapPanel Visual Editing
8. Add "Edit Layout" button to CanvasMapPanel header
9. Implement commit/discard bar
10. Make VGs draggable in edit mode (pointer events, same pattern as template drag)
11. Add remove buttons on VGs in edit mode
12. Connect to store: all visual state reads from `canvasTransactionStore`
13. Ghost footprints + smart placement (already prototyped)

### Phase 3: CanvasOperationsPanel Wiring
14. Remove prop-based data flow from CIAWebApp.jsx
15. Wire Transaction tab to `store.draft.changeLog`
16. Wire Audit tab to `store.auditLog`
17. Wire Users tab to `store.lock` + Y.js awareness
18. Wire Save Points tab to `store.savePoints`
19. Add reaction UI to Transaction tab

### Phase 4: Collaboration
20. Y.js awareness for lock state broadcasting
21. Draft layer toggle for non-editing collaborators
22. Visual indicators: "NEW", "MOVED", "Removing" on VGs
23. Original position ghost outlines (red dashed)
24. Reaction sync via Y.js awareness

### Phase 5: Timeout & Polish
25. Timer countdown with configurable duration
26. "Still editing?" prompt modal
27. Auto-discard on second timeout
28. Toast notification system for edit mode entry
29. Session recording integration

---

## Prototypes Created

| File | Description |
|------|-------------|
| `vg-drag-drop-v3.jsx` | Quick mode: pointer-based drag-and-drop with smart placement, elementsFromPoint detection |
| `vg-drag-drop-transactional.jsx` | Both modes: Quick + Transactional with lock, draft layer, reactions, timeout, commit/discard, collaborator view toggle |

---

## Continuation Prompt

```
I'm continuing the CIA Web transactional canvas editing system. 

Please search project knowledge for:
- VG_DragDrop_Transactional_Canvas_Session_Memory_Log.md (this document)
- canvasHistoryStore.js in the codebase (being extended into canvasTransactionStore)
- CanvasOperationsPanel in the codebase
- CanvasMapPanel and CanvasMapContent in the codebase
- LayoutPanel.logic.js (has editMode that needs migration)

Previous session established:
1. Two modes: Quick (auto-commit) and Transactional (staged + atomic commit)
2. canvasHistoryStore extends into canvasTransactionStore (same API, adds transaction/lock/savepoint/audit)
3. CanvasMapPanel = visual editing layer, CanvasOperationsPanel = monitoring dashboard — both read from same store
4. Full canvas lock during transactions, draft layer visible to collaborators
5. Configurable timeout with "Still editing?" prompt
6. Inline reactions on pending changes (lightweight approval)
7. Full undo via save points (auto-created pre-commit)
8. Smart placement algorithm with spiral search + auto-expand
9. Pointer-based drag (not HTML5 Drag API) with elementsFromPoint detection

I'd like to continue with [Phase 1: Store Foundation / Phase 2: Visual Editing / etc.].
```

---

*Session memory log created: February 11, 2026*
*Prototypes: vg-drag-drop-v3.jsx, vg-drag-drop-transactional.jsx*
*Architecture: canvasTransactionStore unifying canvasHistoryStore + CanvasOperationsPanel*
