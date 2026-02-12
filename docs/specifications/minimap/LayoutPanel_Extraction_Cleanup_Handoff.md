# Old LayoutPanel → CanvasMapPanel Extraction + Cleanup — Claude Code Handoff

**Date:** February 11, 2026
**Status:** Ready for Implementation (after VG drag-and-drop + Minimap Quick Ops land)
**Priority:** Medium — Technical debt cleanup, prevents contributor confusion
**Design Session:** `Minimap_Quick_Ops_Design_Session_Memory_Log.md`
**Dependencies:** VG drag-and-drop (in progress), canvasTransactionStore (in progress)

---

## Executive Summary

The old LayoutPanel (`panels/LayoutPanel/`) and its associated LeftPanel tabs (`NavigatorTab`, `LayoutTab`) are superseded by the CanvasMapPanel + PanelShell architecture. Before removing them, extract reusable logic and constants that the new system needs. Then remove the old components and clean up registrations.

---

## Context: Why This Cleanup Matters

Two parallel implementations exist for canvas layout management:
- **Old:** `LayoutPanel` with `CanvasSubtab`, `ViewsSubtab`, `CanvasNavigator`, plus `LeftPanel/tabs/NavigatorTab` and `LeftPanel/tabs/LayoutTab`
- **New:** `CanvasMapPanel` with 4 modes (Navigate/Layout/Links/Collaborate), persistent Minimap, CompanionPanel, and now Minimap Quick Ops

The old code is functional and contains well-tested logic. But leaving both in the codebase will confuse contributors who won't know which pattern to follow. The PanelShell architecture is the target — the old LeftPanel tab pattern should not be extended.

---

## Phase 1: Extract Reusable Logic

### 1.1 Canvas Size Safety Guards

**Source:** `LayoutPanel.logic.js` — `setCanvasRows` and `setCanvasCols`

**What to extract:** The orphan prevention logic that checks `maxOccupiedRow`/`maxOccupiedCol` from actual placements before allowing canvas shrink, and the viewport auto-shrink when canvas becomes smaller than viewport.

**Key logic pattern:**
```javascript
// Check if reduction would orphan views
const maxOccupiedRow = (canvas.placements || []).reduce(
  (max, p) => Math.max(max, p.row + (p.rowSpan || 1)),
  0
);
if (value < maxOccupiedRow) {
  log.warn(`Cannot reduce rows to ${value}: views occupy up to row ${maxOccupiedRow}`);
  return;
}
// If canvas shrinks below viewport, shrink viewport too
if (value < localViewportSize.rows) {
  setViewportSizeRows(value);
}
```

**Target location:** These guards should be utility functions in `canvasTransactionStore.js` or a shared `canvasValidation.js` utility, called by both the Minimap Quick Ops footprint resize and any other canvas resize entry point.

```
src/ui/react/store/canvasValidation.js ← NEW
├── canShrinkRows(canvas, targetRows) → { allowed: boolean, maxOccupied: number, conflictingViews: View[] }
├── canShrinkCols(canvas, targetCols) → { allowed: boolean, maxOccupied: number, conflictingViews: View[] }
├── getExpansionDirections(canvas, vgId, axis) → { directions: ('left'|'right'|'up'|'down')[], conflicts: Map }
└── adjustViewportForCanvasResize(newCanvasSize, currentViewportSize) → { rows, cols }
```

### 1.2 Cell Operations

**Source:** `LayoutPanel.logic.js` — `removePlacement`, `movePlacement`, `resizePlacement`, `mergeCells`, `unmergeCells`

**What to extract:** These call `canvasManager` with the correct parameters. The operation logic is sound but needs to route through `canvasTransactionStore.record()` instead of directly calling canvasManager.

**Target:** Wrap as operation creators for the transaction store:

```javascript
// In canvasTransactionStore.js or useCanvasOperations.js
const moveView = (placementId, targetRow, targetCol) => {
  record({
    type: 'MOVE_VIEW',
    execute: () => canvasManager.movePlacement(placementId, targetRow, targetCol),
    undo: () => canvasManager.movePlacement(placementId, originalRow, originalCol),
  });
};
```

### 1.3 Cell Selection System

**Source:** `CanvasNavigator.logic.js` — `selectCell`, `toggleCellSelection`, `selectCellRange`, `selectAllCells`, `clearSelection`, `isCellSelected`, `handleCellClick`

**What to extract:** Complete multi-select implementation with modifier key support (Shift+click for range, Ctrl/Cmd+click for toggle).

**Target:** Extract to `useCellSelection.js` hook in a shared location. Used by both Minimap Quick Ops (`useVGQuickOps.js`) and potentially the VG Editor.

```
src/ui/react/hooks/useCellSelection.js ← NEW (extracted)
├── selectedCellIds: Set
├── selectCell(id) — single select (clears others)
├── toggleCellSelection(id) — Ctrl/Cmd+click
├── selectCellRange(fromId, toId) — Shift+click
├── selectAllCells(cellIds)
├── clearSelection()
├── isCellSelected(id) → boolean
├── handleCellClick(id, event) — routes to correct action based on modifiers
├── isValidRectangle() → boolean — for merge validation
└── getSelectionBounds() → { minRow, maxRow, minCol, maxCol }
```

### 1.4 SpawnSizePicker + SPAWN_SIZES

**Source:** `CanvasSubtab.jsx` (component) + `LayoutPanel.logic.js` (constants)

**What to extract:** The `SPAWN_SIZES` constant map and `SpawnSizePicker` component. The concept of "default size for new views" is needed by CanvasMapPanel.

**Target:** Move component to `components/common/SpawnSizePicker/` or `components/composed/SpawnSizePicker/`. Move constants to a shared canvas constants file.

```
src/ui/react/components/common/SpawnSizePicker/
├── SpawnSizePicker.jsx
└── SpawnSizePicker.scss

src/ui/react/constants/canvas.js (or canvasMapPanel/utils/constants.js)
├── SPAWN_SIZES
└── parseSpawnSize()
```

### 1.5 Quick Layouts + LayoutThumbnail

**Source:** `CanvasSubtab.jsx` — `QUICK_LAYOUTS` constant and `QuickLayoutBtn` component

**What to extract:** Layout definitions and the mini grid preview component. The Minimap Quick Ops TemplatePicker uses this. Also reusable in CompanionPanel VG tab and VG list items.

**Target:** Extract `QuickLayoutBtn` → rename to `LayoutThumbnail` as a shared atom:

```
src/ui/react/components/common/LayoutThumbnail/
├── LayoutThumbnail.jsx  — mini grid preview of a layout
└── LayoutThumbnail.scss

src/ui/react/constants/layouts.js
├── QUICK_LAYOUTS — built-in layout definitions
├── BUILTIN_LAYOUTS — from Layout_Tab_V4-6_Claude_Code_Handoff.md
└── (merge both sets into single source of truth)
```

---

## Phase 2: Verify CanvasMapPanel Covers All Functionality

Before removing old components, verify feature parity:

| Old Feature | Old Location | New Location | Status |
|---|---|---|---|
| D-pad navigation | NavigatorTab | CanvasMapPanel D-pad strip | ✅ Implemented |
| Position display | NavigatorTab | CanvasMapPanel Navigate mode | ✅ Implemented |
| Canvas zoom | NavigatorTab + CanvasNavigator | CanvasMapPanel minimapZoom | ✅ Implemented |
| Minimap with cells | CanvasNavigator | CanvasMapPanel Minimap | ✅ Implemented |
| Canvas size controls (rows/cols) | CanvasSubtab | Quick Ops DimensionControls | ⏳ Comes with Quick Ops |
| New view spawn size | CanvasSubtab SpawnSizePicker | Needs migration (Phase 1.4) | ⏳ Extract first |
| Quick layout presets | CanvasSubtab QUICK_LAYOUTS | Quick Ops TemplatePicker | ⏳ Comes with Quick Ops |
| Layout mode (Grid/Flow) | CanvasSubtab | DROPPED — VG canvas doesn't use flow | ✅ N/A |
| Tool selection (Select/Pan/Merge) | CanvasSubtab | Quick Ops cell selection + merge | ⏳ Comes with Quick Ops |
| Edit mode toggle | CanvasSubtab | canvasTransactionStore | ⏳ Separate handoff |
| Undo/redo | CanvasSubtab + CanvasNavigator | canvasTransactionStore | ⏳ In progress |
| Drop mode (Replace/Swap/Insert) | CanvasSubtab | DROPPED — replaced by smart placement | ✅ N/A |
| View list with search/filter | ViewsSubtab | CompanionPanel Views tab | ✅ Redesigned |
| Group by dataset | ViewsSubtab | CompanionPanel contextual filters | ✅ Redesigned |
| View close/delete | ViewsSubtab | CompanionPanel + context menu | ✅ Redesigned |
| View size change | ViewsSubtab | Quick Ops resize | ⏳ Comes with Quick Ops |
| Cell selection + merge | CanvasNavigator edit mode | Quick Ops merge/split | ⏳ Comes with Quick Ops |
| Homepoint | CanvasNavigator | CanvasMapPanel Navigate mode | ✅ Implemented |
| Collaborator tracking | CanvasNavigator presence mode | CanvasMapPanel Collaborate tab | ✅ Implemented |
| Dock position system | LayoutPanelContext DOCK_POSITIONS | DROPPED — PanelShell replaces | ✅ N/A |

**Blockers for removal:** Quick Ops implementation must land first. SpawnSizePicker extraction must happen first.

---

## Phase 3: Remove Superseded Components

### 3.1 Remove Old LeftPanel Tabs

| Path | Action |
|------|--------|
| `panels/LeftPanel/tabs/NavigatorTab/` | DELETE entire directory |
| `panels/LeftPanel/tabs/LayoutTab/` | DELETE entire directory |

### 3.2 Remove Old LayoutPanel

| Path | Action |
|------|--------|
| `panels/LayoutPanel/LayoutPanel.jsx` | DELETE |
| `panels/LayoutPanel/LayoutPanel.logic.js` | DELETE (after extracting items from Phase 1) |
| `panels/LayoutPanel/LayoutPanel.scss` | DELETE |
| `panels/LayoutPanel/LayoutPanelContext.jsx` | DELETE (DOCK_POSITIONS superseded by PanelShell) |
| `panels/LayoutPanel/subtabs/CanvasSubtab.jsx` | DELETE (after extracting QUICK_LAYOUTS, SpawnSizePicker) |
| `panels/LayoutPanel/subtabs/CanvasSubtab.scss` | DELETE |
| `panels/LayoutPanel/subtabs/ViewsSubtab.jsx` | DELETE (CompanionPanel Views tab replaces) |
| `panels/LayoutPanel/subtabs/ViewsSubtab.scss` | DELETE |
| `panels/LayoutPanel/components/CanvasNavigator/` | DELETE entire directory |
| `panels/LayoutPanel/components/SpawnSizePicker/` | DELETE (after extraction to shared) |

### 3.3 Clean Up LeftPanel Registry

**File:** `panels/LeftPanel/LeftPanelContext.jsx`

Remove `navigator` and `layout` from `LEFT_PANEL_TABS` registry. These tabs are fully superseded by CanvasMapPanel.

Currently registered (per audit):
- files, datasets, layout, navigator, tools, annotations, bookmarks, cursors

After cleanup:
- files, datasets, tools, annotations, bookmarks, cursors

### 3.4 Remove Duplicate CanvasMapTab (Old Location)

**Check if exists:** `panels/LeftPanel/tabs/CanvasMapTab/` — This was the old LeftPanel tab version before migration to PanelShell. If it still exists, DELETE entire directory. The current implementation is at `panels/CanvasMapPanel/`.

### 3.5 Remove FloatingCanvasNavigator

**Check for:** Any `FloatingCanvasNavigator` component referenced in `CIAWebApp.jsx` or elsewhere. This was part of the old dock position system. Remove the component and any conditional rendering logic.

---

## Phase 4: Documentation Cleanup

### 4.1 Architecture Clarification Conflict

`Canvas_Map_Panel_Architecture_Clarification.md` has TWO conflicting versions in project knowledge:
- **Original:** "CanvasMapTab should be a Left Panel Tab"  
- **Updated:** "Use PanelShell (new architecture)"

**Action:** The updated version is correct. Mark the original as superseded or remove it. Add a clear header: "⚠️ SUPERSEDED — CanvasMapPanel uses PanelShell architecture. See PanelShell_Unified_Workspace_Design_Session_Memory_Log.md"

### 4.2 Update Migration Status

Update `PanelShell_Unified_Workspace_Design_Session_Memory_Log.md` migration table:

| Panel | Status Before | Status After |
|---|---|---|
| Navigator | 🔄 In Progress | ✅ Complete (absorbed into CanvasMapPanel) |
| Layout | (not listed) | ✅ Complete (absorbed into CanvasMapPanel) |

---

## Constants to NOT Replicate

These constants from the old LayoutPanel are explicitly deprecated and should NOT be carried forward:

| Constant | Location | Reason |
|---|---|---|
| `LAYOUT_MODES` (FREE/FLOW/GRID) | LayoutPanel.logic.js | VG canvas model doesn't use flow layout |
| `FLOW_DIRECTIONS` (ROW/COLUMN) | LayoutPanel.logic.js | Tied to deprecated flow mode |
| `DROP_MODES` (REPLACE/SWAP/INSERT) | LayoutPanel.logic.js | Replaced by smart placement algorithm |
| `DOCK_POSITIONS` (6 positions) | LayoutPanel.logic.js + LayoutPanelContext | PanelShell replaces entirely |
| `VIEW_MODES` (DETAILED/COMPACT/MINIMAL) | LayoutPanel.logic.js | CompanionPanel has own view modes |
| `INSTANCE_COLORS` | LayoutPanel.logic.js | Check if duplicated elsewhere; if not, move to shared constants |

---

## Implementation Order

1. **Phase 1.1-1.5:** Extract all reusable items to shared locations
2. **Phase 2:** Verify feature parity checklist (may reveal gaps)
3. **Phase 1 verification:** Ensure VGBlock still works after useInternalCellLayout extraction
4. **Phase 3.1-3.5:** Remove old components (single PR ideally for clean diff)
5. **Phase 4:** Documentation cleanup

**Important:** Phase 3 should be a dedicated cleanup PR, separate from feature work. This makes it easy to review and revert if something breaks.

---

## Acceptance Criteria

- [ ] All Phase 1 extractions complete and functional in new locations
- [ ] VGBlock renders correctly using extracted `useInternalCellLayout`
- [ ] Old LayoutPanel, NavigatorTab, LayoutTab directories deleted
- [ ] `LEFT_PANEL_TABS` registry cleaned (navigator, layout removed)
- [ ] FloatingCanvasNavigator removed
- [ ] No imports referencing deleted paths remain in codebase
- [ ] Architecture Clarification doc conflict resolved
- [ ] Migration status updated in PanelShell session memory log

---

*Handoff created: February 11, 2026*
*Design session: Minimap Quick Ops / Component Cleanup Audit*
