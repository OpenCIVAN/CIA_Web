# editMode Migration to canvasTransactionStore — Claude Code Handoff

**Date:** February 11, 2026
**Status:** Ready for Implementation (after VG drag-and-drop canvasTransactionStore work lands)
**Priority:** Medium — Required before old LayoutPanel can be removed
**Design Session:** `Minimap_Quick_Ops_Design_Session_Memory_Log.md`
**Dependencies:** canvasTransactionStore (in progress via VG drag-and-drop handoff)

---

## Executive Summary

Migrate the `editMode`, `toggleEditMode`, `exitEditMode`, `tool`, and `dropMode` state from `LayoutPanel.logic.js` (local useState) to the `canvasTransactionStore` (global, collaborative, transactional). The old implementation is a simple boolean toggle with no locking, no draft layer, no timeout, and no collaboration awareness. The new system provides all of those via the transaction store architecture.

---

## Current Implementation (Old)

**File:** `src/ui/react/components/panels/LayoutPanel/LayoutPanel.logic.js`

```javascript
// Simple boolean — no locking, no draft, no timeout
const [editMode, setEditMode] = useState(false);

const toggleEditMode = useCallback(() => {
  setEditMode(prev => !prev);
}, []);

const exitEditMode = useCallback(() => {
  setEditMode(false);
}, []);

// Tool state — purely local
const [tool, setTool] = useState(TOOLS.SELECT);  // SELECT | PAN | MERGE
const [dropMode, setDropMode] = useState(DROP_MODES.ADD);  // ADD | REPLACE
```

**Problems with current approach:**
1. Local state — other users don't know someone is editing
2. No locking — multiple users can enter edit mode simultaneously, causing conflicts
3. No draft layer — changes commit immediately, no way to preview/discard
4. No timeout — user can leave edit mode active indefinitely
5. No undo granularity — CanvasNavigator has its own separate undo/redo reducer
6. Tool state is coupled to the panel component, not the editing session

---

## Target Implementation (New)

**File:** `src/ui/react/store/canvasTransactionStore.js` (being created as part of VG drag-and-drop work)

The VG drag-and-drop handoff (`VG_DragDrop_Transactional_Canvas_Session_Memory_Log.md`) already specifies the dual-mode system:

- **Quick Mode** (default) — Individual operations auto-commit via `record()`
- **Transactional Edit Mode** — User explicitly enters edit mode, changes stage to draft, commit/discard at the end

The old `editMode` maps directly to Transactional Edit Mode.

### Migration Mapping

| Old (LayoutPanel.logic.js) | New (canvasTransactionStore) | Notes |
|---|---|---|
| `editMode` (boolean) | `isEditMode` (derived from transaction state) | True when active transaction exists |
| `toggleEditMode()` | `enterEditMode(userId)` / `commitTransaction()` | Enter acquires lock + creates draft. "Done" commits. |
| `exitEditMode()` | `discardTransaction()` | Discards draft, releases lock |
| `tool` (SELECT/PAN/MERGE) | See "Tool State" section below | Needs design decision |
| `dropMode` (ADD/REPLACE) | DEPRECATED | Replaced by smart placement algorithm |

### enterEditMode(userId) Should:
1. Acquire a collaborative lock (broadcast via Y.js so other users see "User X is editing layout")
2. Clone committed canvas state into a draft layer
3. Start an inactivity timer (configurable, e.g., 5 minutes — warn at 4, auto-discard at 5)
4. Set `isEditMode = true` in the store
5. Broadcast editing state to other users

### commitTransaction() Should:
1. Apply all staged operations from draft to committed state
2. Sync to server via canvasManager
3. Release lock
4. Clear draft layer
5. Broadcast commit to other users
6. Set `isEditMode = false`

### discardTransaction() Should:
1. Discard draft layer (all staged operations lost)
2. Release lock
3. Broadcast discard to other users
4. Set `isEditMode = false`

---

## Tool State Disposition

The old `tool` state (SELECT/PAN/MERGE) needs a decision:

### Option A: Keep in canvasTransactionStore (Session-Scoped)
Tool state is part of the editing session. When you enter edit mode, the tool defaults to SELECT. When you exit, tool state is cleared. Other users see what tool you're using (visible in collaboration overlay).

### Option B: Keep in CanvasMapPanel Local State (UI-Only)
Tool state is purely a UI concern — it affects cursor appearance and click behavior but doesn't need to be collaborative or transactional. The tool is always available (even outside edit mode for Quick Mode operations).

**Recommendation: Option B.** Tool state doesn't need collaboration awareness or persistence. It's local UI state that affects how clicks are interpreted. The CanvasMapPanel (or `useVGQuickOps` for focused mode) can manage this locally. The tool just determines which handler runs on cell click.

**Implementation:**
```javascript
// In useCanvasMapState.js or useVGQuickOps.js
const [activeTool, setActiveTool] = useState('select'); // 'select' | 'pan'
// Note: MERGE tool is removed — merge is now a toolbar button action on selection,
// not a tool mode. This simplifies the tool set to just select vs pan.
```

The old MERGE tool let you click cells to add them to a merge selection. The new design uses standard multi-select (Shift+click) with a separate Merge button — no tool mode needed.

---

## dropMode Deprecation

The old `dropMode` (ADD/REPLACE/SWAP/INSERT) is fully replaced by the smart placement algorithm from the VG drag-and-drop design:

- **Quick Mode:** Drop auto-commits. Placement logic determines whether to fill empty space, swap, or overflow.
- **Transactional Mode:** Drop stages to draft. User sees preview before committing.

No explicit drop mode selector is needed. Remove `DROP_MODES` constant and all references.

---

## CanvasNavigator.logic.js Undo/Redo Migration

**Source:** `CanvasNavigator.logic.js` has its own `useReducer`-based undo/redo with `MARK_SAVED` / `RESET_TO_SAVED` pattern.

This is superseded by `canvasTransactionStore` save points:

| Old (CanvasNavigator) | New (canvasTransactionStore) |
|---|---|
| `PUSH_STATE` action | `record()` — adds operation to history |
| `UNDO` action | `undo()` — pops last operation |
| `REDO` action | `redo()` — re-applies undone operation |
| `MARK_SAVED` action | `createSavePoint(name)` — named snapshot |
| `RESET_TO_SAVED` action | `revertToSavePoint(id)` — restore snapshot |

**The CanvasNavigator's entire history reducer can be deleted.** The transaction store provides the same capabilities with proper transaction awareness.

---

## Consumers That Need Updating

### 1. CanvasSubtab (old — will be deleted)

Currently consumes from LayoutPanel.logic:
```javascript
const { editMode, toggleEditMode, tool, setTool, dropMode, setDropMode, canUndo, canRedo, undo, redo } = logic;
```

This component is being deleted as part of the LayoutPanel cleanup. No migration needed — just ensure the CanvasMapPanel's Layout tab and Quick Ops toolbar provide equivalent controls.

### 2. CanvasNavigator (old — will be deleted)

Has its own edit mode awareness and undo/redo. Being deleted. No migration needed.

### 3. CanvasMapPanel Layout Tab (current)

Needs to add edit mode awareness:
- "Edit Layout" button calls `enterEditMode(userId)`
- Commit/discard bar appears (already designed in VG drag-and-drop handoff)
- Read `isEditMode`, `canUndo`, `canRedo`, `undo`, `redo` from canvasTransactionStore

### 4. Minimap Quick Ops (new)

The Quick Ops toolbar works in both modes:
- Quick Mode: Each op auto-commits via `record()`
- Transactional Mode: Ops stage to draft, commit/discard bar visible in CanvasMapPanel header

The Quick Ops toolbar does NOT have its own edit mode toggle — it inherits whatever mode the canvas is in.

### 5. CanvasOperationsPanel

Already being wired to canvasTransactionStore as part of VG drag-and-drop work. No additional changes needed for editMode migration.

---

## Implementation Steps

### Step 1: Verify canvasTransactionStore Has Required API

After VG drag-and-drop implementation lands, verify the store exposes:
- `isEditMode` — boolean (derived from active transaction)
- `enterEditMode(userId)` — acquires lock, creates draft
- `commitTransaction()` — applies draft, releases lock
- `discardTransaction()` — drops draft, releases lock
- `record(operation)` — mode-aware (auto-commit in Quick, stage in Transactional)
- `canUndo`, `canRedo`, `undo()`, `redo()`
- `createSavePoint(name)`, `revertToSavePoint(id)`

If any are missing, add them before proceeding.

### Step 2: Add Tool State to CanvasMapPanel

Add `activeTool` local state to `useCanvasMapState.js`:
```javascript
const [activeTool, setActiveTool] = useState('select'); // 'select' | 'pan'
```

Remove MERGE from tool options — merge is now a selection + button action.

### Step 3: Wire CanvasMapPanel Layout Tab

The Layout tab needs:
- "Edit Layout" button that calls `enterEditMode(userId)`
- Commit/discard bar (already designed in VG drag-and-drop)
- Undo/redo buttons reading from store

### Step 4: Remove Old editMode References

After wiring is complete, search codebase for all references to:
- `editMode` from LayoutPanel.logic.js
- `toggleEditMode` from LayoutPanel.logic.js
- `exitEditMode` from LayoutPanel.logic.js
- `TOOLS.MERGE` (deprecated)
- `DROP_MODES` (deprecated)
- `dropMode` (deprecated)

Ensure none remain except in the files being deleted in the LayoutPanel cleanup.

### Step 5: Remove CanvasNavigator History Reducer

Delete the entire undo/redo reducer from `CanvasNavigator.logic.js`. This file is being deleted in the cleanup, but if anything references its history system, redirect to `canvasTransactionStore`.

---

## Acceptance Criteria

- [ ] `isEditMode` reads from canvasTransactionStore, not local useState
- [ ] `enterEditMode(userId)` acquires lock and creates draft
- [ ] `commitTransaction()` applies draft and releases lock
- [ ] `discardTransaction()` drops draft and releases lock
- [ ] Tool state lives in CanvasMapPanel local state (select/pan only)
- [ ] MERGE tool removed (merge is selection + button)
- [ ] DROP_MODES removed entirely
- [ ] CanvasNavigator history reducer no longer used
- [ ] All undo/redo flows through canvasTransactionStore
- [ ] Other users see "User X is editing layout" when someone enters edit mode

---

*Handoff created: February 11, 2026*
*Design session: Minimap Quick Ops / Component Cleanup Audit*
*Related: VG_DragDrop_Transactional_Canvas_Session_Memory_Log.md*
