# Minimap Zoom-to-Detail (Quick Ops) — Claude Code Implementation Handoff

**Date:** February 11, 2026
**Status:** Ready for Implementation (after VG drag-and-drop lands)
**Priority:** High — Core interaction layer between minimap overview and VG Editor
**Design Session:** `Minimap_Quick_Ops_Design_Session_Memory_Log.md`
**Dependencies:** canvasTransactionStore (in progress), VG drag-and-drop (in progress)

---

## Executive Summary

Add a "focused mode" to the existing Minimap component that activates on double-click of a VG. The minimap zooms into the VG showing its internal cell structure at interactive scale, with a floating toolbar for quick operations (move views, apply templates, rename, resize, merge, split). This sits between the minimap overview (read-only spatial awareness) and the full VG Editor (complex composition work).

**Progressive disclosure chain:** Single-click → select VG on minimap. Double-click → zoom-to-detail (quick ops). "Edit" button → open VG Editor panel.

---

## Architecture Overview

### Component Tree (Focused Mode)

```
Minimap.jsx (existing — add focusedVGId branch)
├── [focusedVGId === null] Normal mode (existing, unchanged)
│   ├── MinimapGrid
│   ├── VGBlock (per VG, with showInternals)
│   ├── ViewportIndicator
│   ├── CollaboratorIndicator
│   └── LinkLines
│
└── [focusedVGId !== null] Focused mode (NEW)
    ├── MinimapGrid (dimmed, desaturated)
    ├── VGBlock (per non-focused VG, dimmed at 30% opacity)
    ├── VGFocusHeader ← NEW
    │   ├── Breadcrumb "← Canvas"
    │   ├── ColorDot + InlineEditName (double-click to rename)
    │   └── DimensionBadges (internal grid + canvas footprint)
    ├── VGFocusedView ← NEW
    │   ├── FocusedCell (per cell) ← NEW
    │   │   ├── ViewInfo (type icon, name, dataset) — if occupied
    │   │   └── EmptySlot ("+", dashed border) — if empty
    │   ├── SelectionOverlay (amber ring on selected cells)
    │   └── DragGhost (during view swap drag)
    └── VGQuickOpsToolbar ← NEW (floating action bar)
        ├── TemplatePicker ← NEW (popover)
        │   └── LayoutThumbnail (extracted from QuickLayoutBtn)
        ├── DimensionControls (internal ± / footprint ±)
        │   └── DirectionPicker ← NEW (inline ← → / ↑ ↓)
        ├── MergeButton (gated: valid rectangular selection)
        ├── SplitButton (gated: merged cell selected)
        └── EditButton → opens VG Editor panel
```

### New Hooks

```
useVGQuickOps.js ← NEW
├── Cell selection state (multi-select with Shift, rectangular validation)
├── Merge/split validation logic
├── Resize conflict checks (footprint vs canvas neighbors)
├── Template compatibility filtering ("Fits" vs "Requires Resize")
├── Footprint expansion direction detection
├── View drag-to-swap state machine
└── Transaction integration (record() calls for each operation)

useInternalCellLayout.js ← EXTRACTED from VGBlock.jsx
├── getInternalCells(layout, dimensions, views)
├── Shared between VGBlock (minimap scale) and VGFocusedView (interactive scale)
└── Handles: standard grid, merged-top (1+2), merged-right (2+1), custom
```

### New Shared Store

```
viewAssignmentStore.js ← NEW (Zustand)
├── target: { vgId, cellRow, cellCol, vgName, vgColor, source, onAssign, onCancel }
├── requestAssignment(target) — called by focused mode or VG Editor
├── completeAssignment(view, mode) — called by CompanionPanel
├── cancelAssignment() — clears target
└── Selectors: isActive, targetCellRef
```

### Shared Components to Extract

```
LayoutThumbnail.jsx ← EXTRACTED from QuickLayoutBtn (CanvasSubtab)
├── Mini grid preview of a layout definition
├── Used by: TemplatePicker, CompanionPanel VG tab, VG list items
└── Props: layout, size, highlighted, onClick

DirectionPicker.jsx ← NEW shared atom
├── Inline ← → or ↑ ↓ arrow buttons for ambiguous expansion
├── Auto-dismisses on selection or Escape
└── Props: axis ('row'|'col'), onSelect(direction), disabledDirections[]
```

---

## File Organization

```
src/ui/react/components/panels/CanvasMapPanel/
├── components/
│   ├── Minimap/
│   │   ├── Minimap.jsx                    ← MODIFY (add focused mode branch)
│   │   ├── VGBlock.jsx                    ← MODIFY (extract cell layout math)
│   │   ├── VGFocusedView.jsx              ← NEW
│   │   ├── VGFocusedView.scss             ← NEW
│   │   ├── VGFocusHeader.jsx              ← NEW
│   │   ├── FocusedCell.jsx                ← NEW
│   │   └── DragGhost.jsx                  ← NEW
│   ├── QuickOps/
│   │   ├── VGQuickOpsToolbar.jsx          ← NEW
│   │   ├── VGQuickOpsToolbar.scss         ← NEW
│   │   ├── TemplatePicker.jsx             ← NEW
│   │   ├── DimensionControls.jsx          ← NEW
│   │   └── CellContextMenu.jsx            ← NEW
├── hooks/
│   ├── useVGQuickOps.js                   ← NEW
│   ├── useInternalCellLayout.js           ← EXTRACTED from VGBlock
│   └── ... (existing hooks unchanged)

src/ui/react/store/
├── viewAssignmentStore.js                 ← NEW

src/ui/react/components/common/ (or atoms/)
├── LayoutThumbnail.jsx                    ← EXTRACTED from QuickLayoutBtn
├── DirectionPicker.jsx                    ← NEW
```

---

## Zoom Transition Specification

### Entry

**Trigger:** Double-click VG on minimap (`onVGDoubleClick` — already wired in useCanvasMapState)

**Current behavior:** `handleVGDoubleClick` sets `focusedVGId` and switches to LAYOUT map mode. Repurpose this — instead of opening VG Editor, enter focused mode.

**Animation (~200ms ease-out):**
1. Minimap pans and scales to center the target VG
2. Non-focused VGBlocks fade to 30% opacity + desaturate
3. Focused VG scales up (internal cells ≥ 40px each)
4. Internal cell structure fades in with view metadata
5. Quick ops toolbar slides up from bottom edge (100ms)
6. VGFocusHeader slides in at top

### Exit

**Triggers:** "← Canvas" breadcrumb, Escape key, click outside focused area

**Animation (~150ms, slightly faster for snap):**
1. Reverse of entry — cells shrink, opacity restores
2. Return to previous minimap zoom/pan position

### During Focus

- Minimap still pannable/zoomable but surrounding VGs stay dimmed
- Viewport indicator still visible but dimmed
- The MapToolbar and tab content below minimap remain accessible

---

## Quick Operations Specification

### Op 1: Move / Swap Views Between Cells

**Trigger:** Pointer drag from occupied cell to another cell

**Interaction:**
1. Pointer down on occupied cell → subtle lift effect (scale 1.02, shadow)
2. Drag starts after 4px threshold
3. Ghost follows cursor (semi-transparent view icon + name)
4. Source cell shows dashed outline at reduced opacity
5. **Drop on empty cell** → move (view relocates, source becomes empty)
6. **Drop on occupied cell** → swap (both views exchange positions, bidirectional arrow indicator on hover)
7. Drop outside grid → cancel

**Transaction:** Records `SWAP_VIEWS` or `MOVE_VIEW` via `canvasTransactionStore.record()`. Mode-aware (Quick = auto-commit, Transactional = staged to draft).

### Op 2: Apply Preset Template

**Trigger:** Click template picker button in floating toolbar

**Popover content — two sections:**

| Section | Contents | Behavior |
|---------|----------|----------|
| **Fits Current Size** | Templates matching current internal grid dimensions | Click to apply immediately |
| **Requires Resize** | All other templates, each with "→ NxM" badge | Click auto-resizes internal grid + applies. Templates requiring footprint expansion into occupied canvas cells show warning icon + "Blocked — conflicts with [VG name]" tooltip (visible but not clickable) |

**Hover preview:** Grid cells morph to show proposed layout. Existing views redistribute left-to-right, top-to-bottom.

**View overflow:** If new template has fewer cells than current views → confirmation: "N views won't fit. Move to unplaced?" with specific view names.

**Transaction:** Records `TEMPLATE_CHANGE` with full before/after state.

### Op 3: Rename VG

**Trigger:** Double-click VG name in VGFocusHeader

**Interaction:** Inline edit — text pre-selected, Enter to save, Escape to cancel, auto-save on blur. Same pattern as VG list items throughout the app.

**Transaction:** Records `RENAME_VG`.

### Op 4: Resize Internal Grid

**Trigger:** ± buttons in "Internal" section of DimensionControls

**Plus:** Adds row/column to internal grid. Cells animate in smoothly.

**Minus with orphan prevention:**
- If row/column being removed is empty → instant removal
- If row/column contains views → amber warning state on minus button, confirmation tooltip: "Row 3 contains 2 views. Remove anyway? Views will become unplaced."

**Limits:** Min 1×1, max 10×10.

**Footprint suggestion:** When internal grid exceeds canvas footprint, inline suggestion appears: "Grid is 2×3, footprint is 2×2. [Expand footprint →]" — one-click action, not automatic.

**Transaction:** Records `RESIZE_INTERNAL`.

### Op 5: Resize Canvas Footprint

**Trigger:** ± buttons in "Footprint" section of DimensionControls

**Conflict gating:**
- System checks canvas neighbors in both possible expansion directions
- **Both directions free** → show DirectionPicker (← → for cols, ↑ ↓ for rows). Each arrow tooltips the target cell reference (e.g., "← Expand to column A" / "→ Expand to column D"). Picker auto-dismisses after selection.
- **One direction free** → expand immediately in that direction, no picker
- **Neither direction free** → plus button disabled with red tint, tooltip: "Blocked — [VG name] at C1", conflicting VG briefly highlights through dimmed overlay

**Shrink content check:** If footprint shrinks below internal grid → warning: "Footprint will be smaller than internal grid (2×3 > 2×2). Views may be clipped."

**Reverse suggestion:** When footprint is larger than internal grid, suggest: "Footprint is 3×2, grid is 2×2. [Shrink footprint →]" to reclaim canvas space.

**Display:** "Footprint: A1:B2 (2 × 2)" with ± controls and cell reference.

**Transaction:** Records `RESIZE_FOOTPRINT` (canvas-level operation).

### Op 6: Merge Cells

**Trigger:** Select 2+ adjacent cells, click "Merge" in toolbar

**Selection:** Click cell to select (amber ring). Shift+click to add adjacent cells.

**Validation:** Merge button enabled ONLY when selected cells form a rectangle. Non-rectangular selections (L-shape, non-contiguous) → disabled with tooltip: "Select a rectangular area to merge."

**Hover preview:** On merge button hover, selected cells' internal borders fade, single merged outline appears.

**View handling:**
- 0 views in selection → instant merge
- 1 view → that view occupies merged cell
- Multiple views → confirmation: "Keep which view? [View A] [View B] — others become unplaced"

**Quick mode limitation:** Simple rectangular merge only. Complex multi-merge compositions → use VG Editor.

**Transaction:** Records `MERGE_CELLS`.

### Op 7: Split Cell

**Trigger:** Select 1 merged cell, click "Split" in toolbar

**Validation:** Split button enabled ONLY when exactly 1 merged cell is selected.

**Behavior:** Merged cell divides into original constituent grid cells. View from merged cell goes to top-left cell. Other cells become empty.

**Quick mode limitation:** Always splits to original grid positions. Custom split configurations → VG Editor.

**Transaction:** Records `SPLIT_CELL`.

---

## Quick Ops Floating Toolbar Layout

```
┌────────────────────────────────────────────────────────────┐
│  [▦ Template ▾]  │  Internal: -[2]+ × -[3]+  │  [Merge]  │
│                  │  Footprint: -[2]+ × -[2]+  │  [Split]  │
│                  │  A1:B2                      │  [Edit ➜] │
└────────────────────────────────────────────────────────────┘
```

**Three sections:**
- **Left:** Template picker button with current layout mini-preview + dropdown chevron
- **Center:** Two-row dimension controls. Top = internal grid ±. Bottom = footprint ± + cell ref. Suggestion links appear here contextually.
- **Right:** Merge/Split (context-gated) + "Edit →" button (opens VG Editor, visually distinct)

**Positioning:** Absolutely positioned, centered horizontally, ~8px above minimap container bottom edge. Glassmorphism background per design tokens. Doesn't overlap active cells — overlaps dimmed surrounding area.

**Animation:** Slide-up + fade in (100ms) on focus mode entry. Reverse on exit.

---

## Empty Cell → View Assignment via CompanionPanel

### Flow

1. User clicks "+" on empty cell in focused VG
2. `useVGQuickOps` calls `viewAssignmentStore.requestAssignment()` with target cell info + callbacks
3. CompanionPanel opens/focuses with Views tab active
4. CompanionPanel detects `isActive` from store, enters assignment mode

### CompanionPanel Assignment Mode

**Target indicator banner** (below tabs, above content):
```
┌──────────────────────────────────────┐
│  🎯 Assigning to: VG Name → Cell B2  │
│                            [Cancel ✕] │
└──────────────────────────────────────┘
```
- VG color dot + name + cell reference
- Amber accent to indicate temporary state
- Cancel clears target, returns to normal mode

**View item behavior changes:**
- Each view item gets a "Place" button (or entire row clickable)
- Click assigns view to target cell → banner dismisses → normal mode
- Drag still works as usual

**Section priority:**
- "Unplaced" views promoted to top with highlighted section header + blue accent
- Views in target VG show current cell ref + "Move" label (assigning would vacate source)
- Views in other VGs show "Copy" label (new instance created)

**Assignment modes (determined by source):**
| View Source | Label | Behavior | Transaction Type |
|---|---|---|---|
| Unplaced | "Place" | Assign to cell | `ASSIGN_VIEW` |
| Same VG | "Move" | Move from current cell (source becomes empty) | `MOVE_VIEW` |
| Other VG | "Copy" | New ViewConfiguration instance | `CLONE_VIEW` |

**"+ New View from Dataset" action** at bottom of list → opens CompanionPanel Datasets tab (doesn't replicate creation flow)

### viewAssignmentStore.js

```javascript
// src/ui/react/store/viewAssignmentStore.js
import { create } from 'zustand';
import { colToLetter } from '@UI/react/components/panels/CanvasMapPanel/utils/gridUtils';

const useViewAssignmentStore = create((set, get) => ({
  target: null,
  // target shape: {
  //   vgId: string,
  //   cellRow: number,
  //   cellCol: number,
  //   vgName: string,
  //   vgColor: string,
  //   source: 'focused-mode' | 'vg-editor',
  //   onAssign: (view, mode) => void,
  //   onCancel: () => void,
  // }

  requestAssignment: (target) => set({ target }),

  completeAssignment: (view, mode) => {
    const { target } = get();
    target?.onAssign?.(view, mode);
    set({ target: null });
  },

  cancelAssignment: () => {
    const { target } = get();
    target?.onCancel?.();
    set({ target: null });
  },

  // Computed
  get isActive() { return get().target !== null; },
  get targetCellRef() {
    const t = get().target;
    if (!t) return null;
    return `${t.vgName} → ${colToLetter(t.cellCol)}${t.cellRow + 1}`;
  },
}));

export default useViewAssignmentStore;
```

### Cancellation Paths
- Click "Cancel ✕" on banner
- Press Escape
- Click outside both CompanionPanel and focused minimap
- Exit focused mode entirely
- Target cell shows pulsing amber outline while waiting

---

## Cell Context Menu

**Trigger:** Right-click (desktop) or long-press (VR/touch) on any cell

### Occupied Cell Menu

| Action | Icon | Behavior |
|--------|------|----------|
| View Info | 📋 | Non-modal info card: type, dataset, filters, links, "Open in Instance Tools" link |
| Swap with... | ↔️ | Enter swap-targeting mode: other occupied cells pulse, click to swap |
| Move to empty... | 📤 | Enter move-targeting mode: empty cells highlight, click to move |
| Duplicate to cell... | 📋 | Enter clone-targeting mode: empty cells highlight, click to clone |
| ─ separator ─ | | |
| Quick Link... | 🔗 | Future feature — disabled for now |
| ─ separator ─ | | |
| Remove from cell | ❌ | View becomes unplaced. Quick Mode: confirmation. Transactional: staged. |

### Empty Cell Menu

| Action | Icon | Behavior |
|--------|------|----------|
| Assign View... | ➕ | Triggers CompanionPanel assignment mode |
| Paste view | 📋 | If view was "copied" — future feature |

### Merged Cell (appends to above)

| Action | Icon | Behavior |
|--------|------|----------|
| ─ separator ─ | | |
| Split cell | ✂️ | Same as toolbar split |

### Targeting Modes (from context menu)

"Swap with..." / "Move to empty..." / "Duplicate to cell..." enter temporary targeting modes:
- Valid target cells get pulsing border
- Click target → execute operation → return to IDLE
- Escape or click empty space → cancel → return to IDLE

---

## Interaction State Machine

```
IDLE (focused, no interaction)
  ├── Click occupied cell → CELL_SELECTED
  ├── Click empty cell "+" → ASSIGNING_VIEW
  ├── Right-click cell → CONTEXT_MENU
  ├── Double-click name → RENAMING
  ├── Pointer down + hold on occupied cell → DRAGGING_VIEW
  └── Click toolbar button → respective sub-state

CELL_SELECTED
  ├── Shift+click adjacent → MULTI_SELECTED
  ├── Click same cell → IDLE (deselect)
  ├── Click different occupied cell → CELL_SELECTED (new)
  ├── Click empty cell "+" → ASSIGNING_VIEW
  ├── Right-click → CONTEXT_MENU
  ├── "Merge" (valid rectangle) → IDLE (executed)
  ├── "Split" (merged cell) → IDLE (executed)
  └── Escape → IDLE

MULTI_SELECTED
  ├── Shift+click → add/remove from selection
  ├── "Merge" (valid rectangle) → IDLE (executed)
  ├── Right-click → CONTEXT_MENU
  ├── Click non-selected cell → CELL_SELECTED
  └── Escape → IDLE

DRAGGING_VIEW
  ├── Drop on empty cell → IDLE (move)
  ├── Drop on occupied cell → IDLE (swap)
  ├── Drop outside grid → IDLE (cancelled)
  └── Escape → IDLE (cancelled)

RENAMING
  ├── Enter → IDLE (saved)
  ├── Escape → IDLE (cancelled)
  └── Blur → IDLE (saved)

ASSIGNING_VIEW
  ├── View selected in CompanionPanel → IDLE (assigned)
  ├── Cancel in CompanionPanel → IDLE
  ├── Escape → IDLE (cancelled)
  └── Exit focused mode → IDLE (assignment cleared)

CONTEXT_MENU
  ├── Click action → executes, → IDLE (or sub-state)
  │   ├── "Swap with..." → SWAP_TARGETING
  │   ├── "Move to empty..." → MOVE_TARGETING
  │   ├── "Duplicate to cell..." → CLONE_TARGETING
  │   ├── "Assign View..." → ASSIGNING_VIEW
  │   └── Other actions → IDLE
  ├── Click outside → IDLE
  └── Escape → IDLE

SWAP_TARGETING
  ├── Click occupied cell → IDLE (swap executed)
  ├── Escape → IDLE (cancelled)
  └── Click empty space → IDLE (cancelled)

MOVE_TARGETING
  ├── Click empty cell → IDLE (move executed)
  ├── Escape → IDLE (cancelled)
  └── Click empty space → IDLE (cancelled)

CLONE_TARGETING
  ├── Click empty cell → IDLE (clone executed)
  ├── Escape → IDLE (cancelled)
  └── Click empty space → IDLE (cancelled)
```

---

## Transaction Integration

All operations route through `canvasTransactionStore.record()`:

| Quick Op | Operation Type | Undo Behavior |
|---|---|---|
| Move view to empty cell | `MOVE_VIEW` | Move back to original cell |
| Swap two views | `SWAP_VIEWS` | Reverse the swap |
| Apply template | `TEMPLATE_CHANGE` | Restore previous layout + positions |
| Rename VG | `RENAME_VG` | Restore previous name |
| Resize internal grid | `RESIZE_INTERNAL` | Restore previous dims + positions |
| Resize footprint | `RESIZE_FOOTPRINT` | Restore previous footprint |
| Merge cells | `MERGE_CELLS` | Split back to originals |
| Split cell | `SPLIT_CELL` | Re-merge |
| Assign view | `ASSIGN_VIEW` | Remove from cell (unplace) |
| Clone view | `CLONE_VIEW` | Remove clone + delete instance |
| Remove from cell | `REMOVE_VIEW` | Re-assign to cell |

**Mode behavior:** Quick Mode = auto-commit each op. Transactional Mode = stage to draft. Focused mode doesn't branch — `record()` handles it.

**Focused mode works in both modes.** In Transactional Mode, staged changes show indicators on cells ("MOVED", "NEW", etc.), and the commit/discard bar remains visible in CanvasMapPanel header.

---

## Key Extraction: useInternalCellLayout

Extract from existing `VGBlock.jsx` `internalCells` useMemo:

```javascript
// src/ui/react/components/panels/CanvasMapPanel/hooks/useInternalCellLayout.js

/**
 * Shared internal cell layout calculation.
 * Used by VGBlock (minimap scale, non-interactive) and
 * VGFocusedView (focused scale, interactive).
 */
export function getInternalCells(layout, containerWidth, containerHeight, views, padding, internalGap) {
  const cells = [];
  const { rows, cols, merged } = layout;
  const contentWidth = containerWidth - padding * 2;
  const contentHeight = containerHeight - padding * 2;
  const cellWidth = (contentWidth - (cols - 1) * internalGap) / cols;
  const cellHeight = (contentHeight - (rows - 1) * internalGap) / rows;

  if (merged === 'top') {
    // 1+2 layout: full-width top, two bottom cells
    // ... (existing logic from VGBlock)
  } else if (merged === 'right') {
    // 2+1 layout: two left cells, full-height right
    // ... (existing logic from VGBlock)
  } else {
    // Standard grid
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const idx = r * cols + c;
        cells.push({
          row: r,
          col: c,
          x: padding + c * (cellWidth + internalGap),
          y: padding + r * (cellHeight + internalGap),
          width: cellWidth,
          height: cellHeight,
          filled: idx < views.length,
          view: views[idx] || null,
          isMerged: false,
          mergeSpan: { rows: 1, cols: 1 },
        });
      }
    }
  }
  return cells;
}
```

Both VGBlock and VGFocusedView call this with different padding/gap values for their scale.

---

## Existing Code Integration Points

### Files to Modify

| File | Change |
|------|--------|
| `CanvasMapPanel/components/Minimap/Minimap.jsx` | Add `focusedVGId` branch that renders VGFocusedView + VGFocusHeader |
| `CanvasMapPanel/components/Minimap/VGBlock.jsx` | Extract `internalCells` math to useInternalCellLayout, import shared function |
| `CanvasMapPanel/hooks/useCanvasMapState.js` | `handleVGDoubleClick` now enters focused mode (not VG Editor). Add `exitFocusMode()` handler. |
| `CanvasMapPanel/hooks/useMinimapCellSize.js` | Already has `isFocused` flag — verify FOCUSED_CELL_SIZE is correct |
| `CompanionPanel/CompanionPanel.jsx` | Add `viewAssignmentStore` consumption — target banner, click-to-assign behavior |

### Files That Stay Unchanged

- `PanelShell/` — focused mode is internal to Minimap
- `canvasTransactionStore` — just uses existing `record()` API
- `CanvasMapContent.jsx` — doesn't need to know about focus mode
- VTK instance types — unaffected
- Y.js core — unaffected

---

## Implementation Order

### Phase 1: Foundation
1. Create `useInternalCellLayout.js` — extract from VGBlock
2. Update VGBlock to import shared layout function
3. Create `viewAssignmentStore.js`
4. Create `DirectionPicker.jsx` atom
5. Extract `LayoutThumbnail.jsx` from old QuickLayoutBtn

### Phase 2: Core Focused View
6. Create `VGFocusHeader.jsx`
7. Create `FocusedCell.jsx`
8. Create `VGFocusedView.jsx` — renders interactive cell grid
9. Create `useVGQuickOps.js` — state machine, selection, validation
10. Modify `Minimap.jsx` to branch on `focusedVGId`
11. Add zoom/pan animation for transition

### Phase 3: Quick Ops Toolbar
12. Create `VGQuickOpsToolbar.jsx` — floating bar
13. Create `DimensionControls.jsx` — internal ± / footprint ± with conflict gating
14. Create `TemplatePicker.jsx` — popover with Fits/Requires Resize sections
15. Wire merge/split buttons with validation

### Phase 4: Interactions
16. Implement drag-to-swap within FocusedCell grid
17. Create `CellContextMenu.jsx` — right-click menus
18. Implement SWAP_TARGETING / MOVE_TARGETING / CLONE_TARGETING modes
19. Wire CompanionPanel assignment mode (target banner, click behavior)

### Phase 5: Polish
20. Transition animations (zoom in/out, toolbar slide)
21. Dimming/desaturation of non-focused VGs
22. Pulsing amber outline on target cell during assignment
23. Hover previews on template picker
24. Keyboard accessibility (Tab navigation, Escape exits)

---

## Acceptance Criteria

- [ ] Double-click VG on minimap enters focused mode with smooth zoom animation
- [ ] Internal cells render at interactive scale (≥40px) with view metadata
- [ ] All 7 quick ops work: move/swap, template, rename, resize internal, resize footprint, merge, split
- [ ] Footprint resize checks canvas neighbors and shows directional picker when ambiguous
- [ ] Template picker shows "Fits" / "Requires Resize" sections with blocked state for conflicts
- [ ] Empty cell click triggers CompanionPanel assignment mode via viewAssignmentStore
- [ ] Right-click context menu works on all cell types
- [ ] All operations record through canvasTransactionStore (mode-aware)
- [ ] "← Canvas" breadcrumb, Escape, click-outside all exit focused mode
- [ ] "Edit →" button opens VG Editor panel
- [ ] Works in both Quick Mode and Transactional Edit Mode

---

*Handoff created: February 11, 2026*
*Design session: Minimap Quick Ops Design*
*Dependencies: canvasTransactionStore, VG drag-and-drop*
