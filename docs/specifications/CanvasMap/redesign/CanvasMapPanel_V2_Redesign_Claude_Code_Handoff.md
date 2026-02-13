# CanvasMapPanel V2 Redesign — Claude Code Implementation Handoff

**Date:** February 12, 2026
**Status:** Ready for Implementation
**Priority:** HIGH — Core navigation panel, foundation for canvas interaction
**Prototype Reference:** `canvas-map-redesign-v2.jsx` (project knowledge)
**Design Session:** `CanvasMapPanel_V2_Redesign_Session_Memory_Log.md`
**Previous Handoffs:** `Minimap_Quick_Ops_Claude_Code_Handoff.md`, `EditMode_Migration_Handoff.md`

---

## Executive Summary

Redesign the CanvasMapPanel to fix usability issues identified in the current implementation at 350px width. The core problems are: VG action toolbar obscures the minimap, ~15 toolbar icons in a flat unstructured row, minimap squeezed to ~25% of panel height, and no clear information hierarchy.

The redesign introduces: workspace-aware header chrome, grouped mode tabs (Layout/Viewports/Team), always-on sticky grid labels, a dedicated VG context bar below the minimap (not floating on top of it), edit mode as a thin persistent bar, canvas expansion gutters on minimap edges, draggable viewport rectangle, and search with filter/sort dropdowns + quick status chips.

---

## What Changed from Current Implementation

| Aspect | Current | V2 Redesign |
|--------|---------|-------------|
| **Header** | Panel title + px badge | `Canvas Map · ◆ Workspace Name ▾` with switcher |
| **Toolbar** | ~15 icons in flat row | Mode tabs + contextual minimap toolbar |
| **Mode tabs** | Navigate, Layout, Links, Collaborate | Layout, Viewports, Team (3 tabs) |
| **VG actions** | 6 icons floating ON minimap | Context bar BELOW minimap when VG selected |
| **Grid labels** | Toggleable | Always on, sticky to edges |
| **VG/View toggle** | Exclusive segmented control | Removed — "internals" toggle handles it |
| **Dimension controls** | Always visible in header area | Contextual — only when VG selected |
| **Edit mode** | Badge in toolbar + separate amber bar | Single thin bar between toolbar and minimap |
| **D-pad** | Left side, large, takes horizontal space | Compact, inline with search row |
| **Search** | Basic text input | Search + Filter dropdown + Sort dropdown |
| **Quick chips** | Active, Linked, Shared, Starred (static) | Same chips, now dim non-matching VGs on minimap |
| **Links tab** | Tab in Canvas Map | Removed — gets dedicated LinkManager panel |
| **Nav tab** | Dedicated tab | Removed — D-pad persists across all tabs |
| **Canvas expansion** | ± buttons only | Edge gutters (directional) + ± buttons (bulk) |
| **Viewport** | Static rectangle on minimap | Draggable with VP label tab |
| **VG rename** | Not in context bar | Double-click name in context bar → inline edit |

---

## Architecture: Where This Fits

```
src/ui/react/components/panels/CanvasMapPanel/
├── CanvasMapPanel.jsx              ← PanelShell wrapper (EXISTS — update title/header)
├── CanvasMapContent.jsx            ← Main content orchestrator (EXISTS — major refactor)
├── CanvasMapContent.logic.js       ← Headless hook (EXISTS — extend with new state)
├── CanvasMapContent.scss           ← Styles (EXISTS — update)
├── constants.js                    ← Mode enums, defaults (EXISTS — update tabs)
├── index.js
├── components/
│   ├── Minimap/
│   │   ├── Minimap.jsx             ← EXISTS — add sticky labels, gutters, viewport drag
│   │   ├── Minimap.scss
│   │   ├── MinimapToolbar.jsx      ← NEW — extracted toolbar component
│   │   ├── MinimapToolbar.scss
│   │   ├── MinimapCanvas.jsx       ← NEW — grid rendering with gutters
│   │   ├── MinimapCanvas.scss
│   │   ├── ViewportOverlay.jsx     ← NEW — draggable viewport rectangle
│   │   ├── ViewportOverlay.scss
│   │   └── CanvasGutter.jsx        ← NEW — edge expansion zones
│   ├── VGContextBar/
│   │   ├── VGContextBar.jsx        ← NEW — replaces floating action overlay
│   │   ├── VGContextBar.scss
│   │   └── VGDimensionControls.jsx ← NEW — extracted INT/FTP ± controls
│   ├── EditModeBar/
│   │   ├── EditModeBar.jsx         ← NEW — session status bar
│   │   └── EditModeBar.scss
│   ├── WorkspaceSelector/
│   │   ├── WorkspaceSelector.jsx   ← NEW — header workspace breadcrumb
│   │   └── WorkspaceSelector.scss
│   ├── SearchFilterBar/
│   │   ├── SearchFilterBar.jsx     ← NEW — search + filter + sort + chips
│   │   ├── SearchFilterBar.scss
│   │   ├── FilterDropdown.jsx      ← NEW — type + placement filters
│   │   └── SortDropdown.jsx        ← NEW — sort options dropdown
│   ├── FocusedMode/
│   │   ├── FocusedModeOverlay.jsx  ← NEW — quick ops cell grid overlay
│   │   └── FocusedModeOverlay.scss
│   ├── NavigationControls/
│   │   ├── DPad.jsx                ← EXISTS — make more compact
│   │   └── DPad.scss
│   ├── VGListItem/
│   │   ├── VGListItem.jsx          ← EXISTS — add active/starred indicators
│   │   └── VGListItem.scss
│   ├── CompanionPanel/             ← Being relocated per CompanionPanel_V3 handoff
│   └── LayoutPanel/                ← EXISTS — refactor to use new context bar
│       ├── LayoutPanel.jsx
│       ├── LayoutPanel.logic.js
│       └── NavigatePanel.jsx
│           LinksPanel.jsx          ← REMOVE — moving to LinkManager
│           TeamPanel.jsx
└── hooks/
    ├── useMinimapInteraction.js    ← NEW — pan, zoom, VG select, viewport drag
    └── useCanvasExpansion.js       ← NEW — gutter click handlers
```

---

## Phase 1: Header Chrome & Workspace Selector

### 1a: Update PanelShell Header

The PanelShell `title` prop currently renders "Canvas" with a map icon. Update to render a compound header with workspace context.

**Header layout:** `Canvas Map · ◆ My Workspace ▾ [spacer] [Companion] [−] [⛶]`

```jsx
// In CanvasMapPanel.jsx — pass custom header content to PanelShell
<PanelShell
  panelId={CANVAS_MAP_PANEL_ID}
  title="Canvas Map"
  chrome={CHROME_LEVELS.FULL}
  renderHeaderContent={({ sizeMode }) => (
    <div className="canvas-map-header">
      <span className="canvas-map-header__title">Canvas Map</span>
      <span className="canvas-map-header__separator">·</span>
      <WorkspaceSelector
        activeWorkspace={activeWorkspace}
        workspaces={availableWorkspaces}
        onSelect={handleWorkspaceChange}
      />
    </div>
  )}
  // ...
>
```

**Note:** If PanelShell doesn't support `renderHeaderContent`, extend it. The header already supports custom actions via the `actions` prop — workspace selector may fit there, but ideally it's inline with the title.

### 1b: WorkspaceSelector Component

```jsx
/**
 * @component WorkspaceSelector
 * @description Breadcrumb-style workspace switcher in panel header.
 * Shows active workspace name with color diamond and dropdown to switch.
 *
 * @param {Object} activeWorkspace - { id, name, color }
 * @param {Array} workspaces - Available workspaces
 * @param {Function} onSelect - Callback when workspace changes
 */
```

**Behavior:**
- Default: Shows `◆ WorkspaceName ▾` (diamond uses workspace color)
- Click: Opens dropdown listing all workspaces for this room
- Dropdown shows checkmark on active workspace
- Selecting a different workspace switches the canvas map to that workspace's canvas
- Workspace data comes from the room/workspace store (Y.js synced)

**Why this matters:** When users tile multiple workspaces with Canvas Map panels open, they need to immediately know which map belongs to which workspace. The workspace name is the spatial anchor.

---

## Phase 2: Mode Tabs (Layout / Viewports / Team)

### What Changed

**Removed tabs:**
- **Navigate** — Redundant. The D-pad persists across all tabs and the minimap click-to-pan is always available. Navigation doesn't need its own tab.
- **Links** — Moving to a dedicated LinkManager panel. Link configurations (follow/bidirectional/broadcast modes, selective sync of camera/filters/widgets) are complex enough to warrant their own panel rather than a tab.

**Remaining tabs:**
| Tab | Purpose | Content Below List |
|-----|---------|-------------------|
| **Layout** | Primary. VG list, canvas structure, templates | VG list with filters |
| **Viewports** | Viewport management, assignments | Viewport list |
| **Team** | Collaborator presence, cursors, who's-where | Collaborator list |

### Implementation

Update `constants.js`:

```js
// OLD
export const MAP_MODES = {
  NAVIGATE: 'navigate',
  LAYOUT: 'layout',
  LINKS: 'links',
  COLLABORATE: 'collaborate',
};

// NEW
export const MAP_MODES = {
  LAYOUT: 'layout',
  VIEWPORTS: 'viewports',
  TEAM: 'team',
};
```

The D-pad renders in a shared area above the tabs, visible regardless of which tab is active. Remove the NavigatePanel component — its functionality (D-pad, bookmarks, position) is distributed between the persistent D-pad area and the footer.

---

## Phase 3: Minimap Toolbar (Simplified)

### What Changed

The toolbar row between mode tabs and the minimap is now leaner:

**Always visible:** `[−] zoom% [+] [Fit]`

**Contextual by tab:**
- Layout tab: `[Viewports toggle] [Internals toggle] | [Bookmarks]`
- Viewports tab: `[Viewports toggle]`
- Team tab: `[Show cursors toggle]`

### Removed Controls

- **Grid label toggle** — Labels are always on. Users reference cells by coordinate (A1, B3) in collaboration. Never hide them.
- **VG/View segmented control** — Replaced entirely by the "Internals" eye toggle. VGs are always visible (they're the structural unit). The internals toggle adds/removes view-level detail inside VGs. This is simpler and more intuitive.

### Implementation

```jsx
/**
 * @component MinimapToolbar
 * @description Compact toolbar above minimap with zoom controls and
 * tab-contextual visibility toggles.
 *
 * @param {number} zoom - Current zoom level (50-200)
 * @param {string} activeTab - Current mode tab
 * @param {boolean} showInternals - Show view cells inside VGs
 * @param {boolean} showViewports - Show viewport rectangles
 */
```

---

## Phase 4: Always-On Sticky Grid Labels

### Behavior

Column labels (A, B, C...) and row labels (1, 2, 3...) are always visible and stick to the edges of the minimap scroll container.

- **Column labels:** Stick to the top edge. When the user scrolls vertically, column labels stay pinned at the top.
- **Row labels:** Stick to the left edge. When the user scrolls horizontally, row labels stay pinned at the left.
- **Labels slide with content:** When panning horizontally, column labels scroll horizontally to stay aligned with their columns. Same for rows vertically.

### CSS Implementation

```scss
.minimap__column-labels {
  position: sticky;
  top: 0;
  z-index: 5;
  background: $minimap-bg; // Must match to hide content scrolling behind
}

.minimap__row-labels {
  position: sticky;
  left: 0;
  z-index: 5;
  background: $minimap-bg;
}
```

This is the same pattern as frozen rows/columns in spreadsheet applications. The minimap scroll container must have `overflow: auto` for sticky positioning to work.

---

## Phase 5: Edit Mode Bar

### Behavior

When the user enters edit mode (via "Edit Layout" button or by clicking a canvas expansion gutter), a thin amber bar appears between the minimap toolbar and the minimap:

```
[✏ EDITING] 2 changes · 3:42  [Undo] [Redo]  [Discard] [Done]
```

**Key decisions:**
- **Does NOT replace tabs.** Users may need to switch to the Team tab to see collaborator positions while editing layout.
- **Single row, ~26px height.** The current implementation uses two rows (toolbar badge + separate bar below minimap) — this consolidates.
- **Timer ticks live.** Passive awareness of how long the edit session has been open.
- **Change count updates on each operation.** Helps users track scope of their edits.
- **Minimap gets subtle amber top border** during edit mode for ambient mode awareness.
- **Auto-enters edit mode** when canvas expansion gutters are clicked.

### Integration with canvasTransactionStore

```js
// EditModeBar reads from canvasTransactionStore
const { isEditing, changeCount, sessionDuration, undo, redo, commit, discard } = useCanvasTransaction();
```

See `EditMode_Migration_Handoff.md` for the full migration from LayoutPanel local state to canvasTransactionStore.

---

## Phase 6: VG Context Bar & Dimension Controls

### The Core Fix

**Problem:** Current implementation floats 6 action icons (edit, +, duplicate, save, share, delete) directly ON TOP of the minimap cells when a VG is selected. This obscures the content the user is trying to interact with.

**Solution:** A dedicated context bar that appears BELOW the minimap (between minimap and the resize divider) when any VG is selected. The minimap stays clean and fully visible.

### VG Context Bar

```jsx
/**
 * @component VGContextBar
 * @description Shows selected VG info + actions below minimap.
 * Persists in both selected and focused (Quick Ops) states.
 *
 * @param {Object} vg - Selected ViewGroup
 * @param {boolean} focused - Whether in focused/Quick Ops mode
 * @param {Function} onEdit - Enter focused mode
 * @param {Function} onExitFocus - Exit focused mode (back to canvas)
 * @param {Function} onDeselect - Deselect VG
 */
```

**Layout — Selected state (not focused):**
```
[🟦 color dot] [VG Name (dbl-click to rename)] [2x2 badge] | [✏ edit] [📋 dup] [💾 save] [↗ share] [🗑 del] | [✕]
```

**Layout — Focused state (Quick Ops):**
```
[← Canvas] | [🟦 color dot] [VG Name (dbl-click to rename)] [2x2 badge] | [📋 dup] [💾 save] [↗ share] [🗑 del]
```

Key differences in focused state:
- `← Canvas` breadcrumb replaces `✕` close button (click to exit focused mode)
- `✏ edit` button hidden (already in focused mode)
- All other action buttons persist — you're MORE engaged with this VG, not less

### VG Name Inline Editing

Double-click the VG name text → transforms into inline `<input>`:
- Input gets focus + text selected
- Teal underline indicates edit state
- Enter commits rename
- Escape cancels (reverts to original name)
- Blur commits
- Rename dispatches to the VG store / Y.js doc

### VG Dimension Controls

Appears directly below the context bar when a VG is selected:

```
[INT] [−] 2 [+] × [−] 2 [+]  |  [FTP] [−] 2 [+] × [−] 2 [+]  [A1:B2]
```

- **INT** = Internal grid (rows × cols inside the VG)
- **FTP** = Footprint (canvas cells the VG occupies)
- **A1:B2** = Cell range the VG occupies

These controls only appear when a VG is selected. They are NOT always visible in the header (that was the old design).

---

## Phase 7: Focused Mode (Quick Ops) Overlay

### Behavior

Double-click a VG on the minimap → enters focused mode. The focused overlay replaces the minimap area ONLY (positioned `absolute` within the minimap container). The context bar and dimension controls persist above it.

The overlay contains:
1. **Cell grid** — Large editable cells showing view assignments. Empty cells show `[+] Empty`. Filled cells show view name + type badge.
2. **Quick Ops floating toolbar** — Bottom-center of the overlay: `[Template ▾] | [Merge] [Split] | [Editor]`

### Visual Stack in Focused Mode

```
[Mode Tabs]
[Minimap Toolbar]
[Edit Mode Bar — if editing]
[VG Context Bar — with ← Canvas breadcrumb]
[VG Dimension Controls]
[═══ FOCUSED OVERLAY ═══]  ← position: absolute over minimap area
  [Cell Grid]
  [Quick Ops Toolbar]
[═══════════════════════]
[Resize Divider]
[Bottom Section]
```

### Exit Focused Mode

- Click `← Canvas` in the context bar
- Press Escape

### Canvas Expansion Gutters in Focused Mode

The gutters from the minimap should also appear in focused mode at the VG level — showing available expansion directions for the VG footprint. This is more discoverable than the abstract ± buttons because you can literally see adjacent empty cells or occupied VGs that would conflict.

---

## Phase 8: Canvas Expansion Gutters

### Minimap-Level Gutters

Subtle expansion zones on all four edges of the canvas grid:

```
         [+ hover zone — add row above]
[+ left]  ┌─────────────────────────┐  [+ right]
           │                         │
           │       Canvas Grid       │
           │                         │
           └─────────────────────────┘
         [+ hover zone — add row below]
```

**Behavior:**
- Default: Invisible (just empty space around grid)
- Hover: Dashed border appears with subtle teal `+` icon
- Click: Adds one row/column in that direction
- If edit mode not active, auto-enters edit mode
- Change count increments
- Grid labels update to show new column/row

### Direction for ± Buttons

The ± buttons in VG Dimension Controls handle bulk changes (add 8 rows at once). Default behavior:
- **+column** → appends to the right
- **+row** → appends to the bottom
- **Shift+click** → prepends (adds to the left / top)

Gutters are directional by nature (you click the edge where you want growth). ± buttons are abstract but faster for bulk operations. Both coexist.

---

## Phase 9: Draggable Viewport on Minimap

### Behavior

The cyan viewport rectangle on the minimap becomes draggable:

- **Hover over viewport:** Cursor changes to `grab`
- **Click and drag:** Viewport slides to new grid position. D-pad center badge updates live to show new position.
- **Label tab:** Small tag at top-left corner of viewport showing "VP1" (or viewport name). This is both the identifier and the grab affordance.
- **Multiple viewports:** Non-active viewports render with dashed cyan outline (vs solid for active). Click a non-active one to make it active before dragging.

### Implementation

```jsx
/**
 * @component ViewportOverlay
 * @description Draggable viewport rectangle on the minimap.
 *
 * @param {Object} viewport - { id, name, row, col, rs, cs }
 * @param {boolean} isActive - Whether this is the active viewport
 * @param {Function} onDragEnd - Called with new { row, col } position
 * @param {Function} onActivate - Called when non-active viewport clicked
 */
```

Use pointer events (not HTML5 Drag API) for smooth dragging. Convert pixel delta to grid cell offset using cell size + gap. Snap to grid on drop.

---

## Phase 10: Search, Filter, Sort & Quick Chips

### Layout

The bottom section between D-pad and list has this structure:

```
[D-Pad]  [🔍 Search views, datasets...   ✕]
         [Filter ▾]  [Sort ▾]

Quick: [All 5] [Active 1] [Linked 0] [Shared 0] [Starred 2]

────────────────────────────────────────────
[On Canvas]  [Views]                  [5 VG]
────────────────────────────────────────────
[VG List / View List]
```

### Search Behavior

Search affects BOTH the minimap and the list simultaneously:
- **Minimap:** Non-matching VGs dim to ~30% opacity. They are NEVER hidden — spatial position matters for context. Matching VGs stay at full brightness.
- **List:** Filters to only show matching items.
- **Matching:** VG name OR any view name within the VG.

### Filter Dropdown

Two sections with a divider:

**Type:**
- All types
- VTK
- Chart
- Text
- Image

**Placement:**
- All
- Explicit
- Implicit

### Sort Dropdown

- Name A→Z
- Name Z→A
- Position (grid order, top-left to bottom-right)
- View count
- Recently modified

### Quick Chips

```
Quick: [All 5] [Active 1] [Linked 0] [Shared 0] [Starred 2]
```

- **All** — No filter, shows everything
- **Active** — VGs/views currently in an active instance
- **Linked** — VGs/views with link configurations
- **Shared** — VGs shared with collaborators
- **Starred** — User-starred items (bookmarks)

Chips with count 0 render dimmed (30% opacity) but still clickable. Selecting a chip affects both minimap (dimming) and list (filtering), same as search.

Chips work contextually: on the "On Canvas" bottom tab they filter VGs, on the "Views" tab they filter views.

### VG List Item Indicators

Each VG list row now shows:
- **Color dot** with green ring if VG is active
- **Star ★** (amber) if starred
- **Layout badge** (e.g., "2x2")
- **View count badge** (e.g., "3/4")

---

## Phase 11: Footer

Persistent footer at panel bottom:

```
[🏠 Home] [⊕ Set Home] [🔖 Bookmarks] [⚙ Settings]  [5×6 · 5 VG · 12 views]
```

- **Home:** Jump viewport to homepoint position
- **Set Home:** Set current viewport position as homepoint
- **Bookmarks:** Open bookmarks flyout
- **Settings:** Canvas Map settings (cell size, animation, etc.)
- **Stats:** Canvas dimensions + VG count + total view count (updates live when canvas expands)

---

## Companion Panel Integration

The CanvasMapPanel header includes a toggle button for the CompanionPanel. The CompanionPanel provides datasets, views, and ViewGroups for dragging onto the canvas — it is NOT duplicated inside the Canvas Map.

See `CompanionPanel_V3_Claude_Code_Handoff.md` for CompanionPanel implementation details.

The button in the Canvas Map header simply calls:
```js
togglePanel(COMPANION_PANEL_ID);
```

---

## Data Sources & Stores

| Component | Reads From | Writes To |
|-----------|------------|-----------|
| WorkspaceSelector | workspaceStore | workspaceStore.setActive() |
| Minimap | canvasStore (VGs, grid), viewportStore | — |
| MinimapToolbar | local UI state | local UI state |
| EditModeBar | canvasTransactionStore | canvasTransactionStore.commit/discard() |
| VGContextBar | canvasStore (selected VG) | canvasStore.renameVG() |
| VGDimensionControls | canvasStore (VG internals/footprint) | canvasTransactionStore |
| SearchFilterBar | local UI state | local UI state (filter callbacks) |
| Quick Chips | local UI state | local UI state (highlight callbacks) |
| CanvasGutter | canvasStore (dimensions) | canvasTransactionStore.addRow/addCol() |
| ViewportOverlay | viewportStore | viewportStore.moveViewport() |
| DPad | viewportStore (position) | viewportStore.moveViewport() |
| VGListItem | canvasStore (VGs) | canvasStore.selectVG() |

---

## Migration Notes

### Removed Components

- **TopBar / SecondaryTopBar** — Deleted in Dec 2024 cleanup. Don't reference.
- **LinksPanel** — Being extracted to dedicated LinkManager panel.
- **NavigatePanel** — Functionality distributed to persistent D-pad + footer.
- **Floating VG action toolbar** — Replaced by VGContextBar below minimap.

### Things NOT Changing

- **PanelShell wrapper** — CanvasMapPanel already uses PanelShell with FULL chrome.
- **Minimap rendering approach** — CSS grid-based minimap stays. Just adding sticky labels and gutters.
- **Y.js integration** — VG data, viewport positions, collaborator presence all still Y.js synced.
- **CompanionPanel** — Separate panel, separate handoff.

### Tab Content Mapping

| Old Tab | New Location |
|---------|-------------|
| Navigate → D-pad | Persistent area above tabs (all tabs) |
| Navigate → Bookmarks | Footer button + flyout |
| Layout → VG list | Layout tab (primary) |
| Links | Dedicated LinkManager panel |
| Collaborate → Viewports | Viewports tab |
| Collaborate → Team | Team tab |

---

## Implementation Order

1. **Header chrome** — WorkspaceSelector, updated PanelShell title
2. **Mode tabs** — Update constants, remove Navigate/Links, add Viewports
3. **Minimap toolbar** — Extract, simplify, remove VG/View toggle and grid label toggle
4. **Sticky grid labels** — CSS sticky positioning in minimap scroll container
5. **VGContextBar** — New component below minimap, replace floating action overlay
6. **VGDimensionControls** — Extract from wherever they currently live, make contextual
7. **Edit mode bar** — New thin row, wire to canvasTransactionStore
8. **Canvas gutters** — Hover zones on minimap edges
9. **Search/Filter/Sort** — SearchFilterBar with dropdowns
10. **Quick chips** — Status filter chips with minimap dimming
11. **Viewport drag** — ViewportOverlay with pointer-based drag
12. **Focused mode** — FocusedModeOverlay, headerless (context bar persists above)
13. **VG rename** — Inline edit in context bar
14. **Footer** — Homepoint, bookmarks, settings, stats
15. **DPad** — Make compact, move to persistent shared area

---

## Continuation Prompt

```
I'm continuing the CIA Web CanvasMapPanel V2 redesign implementation.

Please search project knowledge for:
- CanvasMapPanel_V2_Redesign_Claude_Code_Handoff.md (this document)
- canvas-map-redesign-v2.jsx (interactive prototype with all interactions)
- CanvasMapPanel.jsx and CanvasMapContent.jsx in the codebase
- CanvasMapTab.jsx (legacy LeftPanel version, being replaced)
- canvasTransactionStore / canvasHistoryStore (edit mode integration)
- EditMode_Migration_Handoff.md (useState → store migration)
- Minimap_Quick_Ops_Claude_Code_Handoff.md (focused mode spec)
- CompanionPanel_V3_Claude_Code_Handoff.md (companion panel integration)

Previous session established:
1. Workspace selector in header chrome (breadcrumb with dropdown)
2. Three tabs: Layout, Viewports, Team (removed Navigate + Links)
3. Always-on sticky grid labels (no toggle)
4. VG Context Bar below minimap (not floating on it)
5. Edit mode as thin amber bar (does NOT replace tabs)
6. Canvas expansion gutters on minimap edges
7. Draggable viewport rectangle with label tab
8. Search + Filter/Sort dropdowns + Quick Chips (Active/Linked/Shared/Starred)
9. Focused mode overlay is headerless (context bar + dimension controls persist above)
10. VG rename via double-click in context bar

I'd like to continue with [Phase N: specific phase from implementation order].
```

---

*Handoff created: February 12, 2026*
*Prototype: canvas-map-redesign-v2.jsx*
*Architecture: PanelShell floating-first, canvasTransactionStore for edit mode*
