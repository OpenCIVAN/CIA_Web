# Minimap Quick Ops Design Session Memory Log

**Date:** February 11, 2026
**Session Focus:** Minimap zoom-to-detail (Quick Ops), component reuse audit, old LayoutPanel extraction/cleanup
**Handoff Documents Produced:**
- `Minimap_Quick_Ops_Claude_Code_Handoff.md`
- `LayoutPanel_Extraction_Cleanup_Handoff.md`
- `EditMode_Migration_Handoff.md`

---

## Session Summary

Designed the "focused mode" for the CanvasMapPanel Minimap — a zoom-to-VG-detail layer that provides quick operations without opening the full VG Editor. Also audited the old LayoutPanel for reusable logic, identified obsolete components, and produced a cleanup roadmap.

---

## Key Decisions Made

### 1. Progressive Disclosure Chain
- **Single-click VG** → select (highlight + sync with list)
- **Double-click VG** → zoom-to-detail focused mode (quick ops)
- **"Edit →" button in focused mode** → open VG Editor panel

Previously, double-click was intended to open VG Editor directly. Repurposed to focused mode for progressive disclosure.

### 2. Minimap Zoom Behavior = Focus Zoom (Not Viewport Zoom)
Three zoom behaviors were considered:
- Focus zoom — zoom minimap into VG to show internals ← **CHOSEN**
- Viewport zoom — minimap zoom drives actual canvas viewport
- Drill-in — open VG Editor

Focus zoom makes the minimap interactive without changing what the user sees on the main canvas.

### 3. Seven Quick Operations
| Op | Quick Ops (Focused Mode) | VG Editor |
|---|---|---|
| Move/swap views | ✅ Drag between cells | ✅ Full drag system |
| Apply preset template | ✅ Template picker with "Fits"/"Requires Resize" sections | ✅ Custom template creation |
| Rename VG | ✅ Inline edit in header | ✅ Full metadata editing |
| Resize internal grid | ✅ ± rows/cols with orphan prevention | ✅ Same + custom arrangements |
| Resize canvas footprint | ✅ ± with conflict gating + directional picker | ✅ Same |
| Merge cells (simple) | ✅ Rectangular selection only | ✅ Complex multi-merge compositions |
| Split cell | ✅ Restore to original grid | ✅ Custom split configurations |

### 4. Template Picker Shows All Templates
Two sections: "Fits Current Size" (click to apply) and "Requires Resize" (auto-resizes internal grid). Templates blocked by footprint conflicts are visible but not clickable with explanation tooltip.

### 5. Footprint Expansion Uses Directional Picker
When expanding canvas footprint and both directions are free, a small inline ← → (or ↑ ↓) picker appears. When only one direction is free, expand immediately. When neither is free, block with conflict explanation.

### 6. Toolbar Position: Floating Action Bar
Quick ops toolbar floats above the minimap bottom edge (consistent with commit/discard bar and multi-select action bar patterns). Glassmorphism background per design tokens.

### 7. Empty Cell Assignment Reuses CompanionPanel
Clicking "+" on an empty cell triggers the CompanionPanel in "assignment mode" via a shared `viewAssignmentStore` (Zustand). CompanionPanel shows a target banner and adapts view items to show "Place"/"Move"/"Copy" based on source. This same mechanism will work for VG Editor later.

### 8. viewAssignmentStore in Shared Store
`viewAssignmentStore` lives in `src/ui/react/store/` as shared infrastructure. Uses callback pattern — requester passes `onAssign` and `onCancel` callbacks, so the store brokers the connection without knowing how to perform assignments. Both focused mode and VG Editor can use it.

### 9. Cell Context Menu: Yes, Full
Right-click/long-press on cells provides: View Info, Swap with..., Move to empty..., Duplicate to cell..., Quick Link (future/disabled), Remove from cell. Empty cells get: Assign View..., Paste view (future). Merged cells add: Split cell.

### 10. Old LayoutPanel Extraction Before Removal
Five items worth extracting before deleting old LayoutPanel:
1. Canvas size safety guards (orphan prevention, viewport auto-shrink)
2. Cell operations (remove/move/resize/merge/unmerge) — need transaction wrapping
3. Cell selection system (multi-select with modifiers) → `useCellSelection` hook
4. SpawnSizePicker + SPAWN_SIZES → shared component
5. QUICK_LAYOUTS + QuickLayoutBtn → `LayoutThumbnail` shared atom

Seven items to drop (not replicate): LAYOUT_MODES, FLOW_DIRECTIONS, DROP_MODES, DOCK_POSITIONS, VIEW_MODES, CanvasNavigator history reducer, FloatingCanvasNavigator.

### 11. editMode Migration = Separate Handoff
Old `editMode` is local useState boolean. New system wraps `canvasTransactionStore.enterEditMode(userId)` with lock acquisition, draft layer, inactivity timer, and Y.js broadcast. Tool state (SELECT/PAN) stays as local UI state in CanvasMapPanel — MERGE tool removed (merge is now selection + button action). DROP_MODES deprecated entirely.

### 12. Cleanup Timing: Wait for VG Drag-and-Drop
Don't extract or clean up until the VG drag-and-drop + canvasTransactionStore work lands. Extracting now would cause double work if the transaction store changes the operation API.

---

## Architecture Additions

### New Components
| Component | Location | Purpose |
|---|---|---|
| VGFocusedView | CanvasMapPanel/components/Minimap/ | Interactive internal cell grid at focused scale |
| VGFocusHeader | CanvasMapPanel/components/Minimap/ | Breadcrumb + editable name + dimension badges |
| FocusedCell | CanvasMapPanel/components/Minimap/ | Individual cell with view info or empty slot |
| DragGhost | CanvasMapPanel/components/Minimap/ | Ghost element during view drag |
| VGQuickOpsToolbar | CanvasMapPanel/components/QuickOps/ | Floating action bar with all quick ops |
| TemplatePicker | CanvasMapPanel/components/QuickOps/ | Popover with layout thumbnails |
| DimensionControls | CanvasMapPanel/components/QuickOps/ | Internal ± / footprint ± with conflict gating |
| CellContextMenu | CanvasMapPanel/components/QuickOps/ | Right-click menu for cells |
| DirectionPicker | components/common/ (atom) | Inline ← → / ↑ ↓ for ambiguous expansion |
| LayoutThumbnail | components/common/ (atom) | Mini grid preview (extracted from QuickLayoutBtn) |

### New Hooks
| Hook | Location | Purpose |
|---|---|---|
| useVGQuickOps | CanvasMapPanel/hooks/ | State machine, selection, validation, transaction integration |
| useInternalCellLayout | CanvasMapPanel/hooks/ | Shared cell layout math (extracted from VGBlock) |
| useCellSelection | hooks/ (shared) | Multi-select with modifiers (extracted from CanvasNavigator) |

### New Stores
| Store | Location | Purpose |
|---|---|---|
| viewAssignmentStore | store/ | Brokers view assignment between requesters and CompanionPanel |

### Shared Extractions
| Item | From | To |
|---|---|---|
| Internal cell layout math | VGBlock.jsx internalCells useMemo | useInternalCellLayout.js |
| QuickLayoutBtn | CanvasSubtab.jsx | LayoutThumbnail.jsx (common atom) |
| Cell selection system | CanvasNavigator.logic.js | useCellSelection.js (shared hook) |
| SpawnSizePicker | LayoutPanel SpawnSizePicker/ | components/common/SpawnSizePicker/ |
| SPAWN_SIZES + QUICK_LAYOUTS | LayoutPanel.logic.js + CanvasSubtab.jsx | constants/canvas.js + constants/layouts.js |
| Canvas size validation | LayoutPanel.logic.js | canvasValidation.js utility |

---

## State Machine

Full interaction state machine for focused mode:

```
IDLE → CELL_SELECTED → MULTI_SELECTED
IDLE → ASSIGNING_VIEW (via CompanionPanel)
IDLE → CONTEXT_MENU → SWAP_TARGETING / MOVE_TARGETING / CLONE_TARGETING
IDLE → DRAGGING_VIEW
IDLE → RENAMING
```

All states have clear exit paths (Escape, click-outside, completion). See handoff doc for full specification.

---

## Transaction Types (Quick Ops)

| Operation | Transaction Type | Undo |
|---|---|---|
| Move view | MOVE_VIEW | Move back |
| Swap views | SWAP_VIEWS | Reverse swap |
| Apply template | TEMPLATE_CHANGE | Restore previous |
| Rename | RENAME_VG | Restore name |
| Resize internal | RESIZE_INTERNAL | Restore dims + positions |
| Resize footprint | RESIZE_FOOTPRINT | Restore footprint |
| Merge cells | MERGE_CELLS | Split to originals |
| Split cell | SPLIT_CELL | Re-merge |
| Assign view | ASSIGN_VIEW | Unplace |
| Clone view | CLONE_VIEW | Remove clone |
| Remove view | REMOVE_VIEW | Re-assign |

---

## Cleanup Roadmap

**Phase 1:** Extract shared primitives (useInternalCellLayout, useCellSelection, LayoutThumbnail, SpawnSizePicker, canvas validation utils)
**Phase 2:** Verify CanvasMapPanel + Quick Ops covers all old functionality
**Phase 3:** Remove old components (NavigatorTab, LayoutTab, LayoutPanel, CanvasNavigator, FloatingCanvasNavigator, LEFT_PANEL_TABS entries)
**Phase 4:** Documentation cleanup (Architecture Clarification conflict, migration status update)

**Timing:** After VG drag-and-drop + Quick Ops implementation land. Cleanup should be a dedicated PR.

---

## Open Items / Future Work

1. **VR considerations:** Long-press context menu renders as floating card near controller ray. Menu items use touch target sizing.
2. **Keyboard accessibility:** Tab navigation through cells, Enter to select, Escape to exit. Needs implementation spec.
3. **CompanionPanel Datasets tab in assignment mode:** "Create new view" action creates view AND assigns to target cell in one step. Needs detailed spec.
4. **"Quick Link..." in context menu:** Disabled for now. Will be enabled when LinkManager integration is designed.
5. **"Paste view" in empty cell context menu:** Future clipboard feature. Disabled for now.
6. **Shared floating action bar component:** The floating toolbar pattern appears in commit/discard bar, multi-select bar, and now Quick Ops toolbar. Consider extracting a `FloatingActionBar` shared component.

---

## Related Sessions / Documents

- `VG_DragDrop_Transactional_Canvas_Session_Memory_Log.md` — Dual-mode editing, canvasTransactionStore, CanvasOperationsPanel
- `Canvas_Map_Tab_Content_Session_Memory_Log.md` — 3 tabs, minimap, D-pad
- `CompanionPanel_V3_Design_Session_Memory_Log.md` — 3 tabs, contextual filters, non-blocking usage
- `PanelShell_Unified_Workspace_Design_Session_Memory_Log.md` — Floating-first architecture, chrome levels, migration status
- `Canvas_Map_Panel_Architecture_Clarification.md` — Has conflicting versions (noted for cleanup)
- `Layout_Tab_V4-6_Claude_Code_Handoff.md` — Built-in layouts, ViewGroup/Viewport types
- `Layout_Tab_V4_Drill_In_Templates_Session_Memory_Log.md` — Design decisions on drill-in editor

---

*Session ended: February 11, 2026*
