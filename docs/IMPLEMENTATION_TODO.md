# Implementation TODO

Remaining unimplemented features extracted from archived specifications.
Specs are preserved in `docs/specifications/archive/` and git history.

**Created:** January 28, 2026

---

## High Priority

### Canvas Toolbar Footer (0% — not started)
*Source: `archive/toolsandcanvas/Widget_Creation_Part2_Claude_Code_Handoff.md`*

Shared toolbar for small-viewport canvas scenarios. Directory exists at
`src/ui/react/components/workspace/CanvasToolbarFooter/` but is empty. Specified components:
- `CanvasToolbarFooter.jsx` — main component with responsive layout
- Sections: history (undo/redo), activeView selector, overlays, measurements, viewControls, links, openTools
- `ActiveViewSelector` component
- `OverflowMenu` for responsive collapse behavior
- State synchronization with Instance Tools Panel
- Responsive breakpoints: 800px (full), 600px (medium), 0px (compact)

### Files Tab — Tag Filtering System (~35% implemented)
*Source: `archive/filestab/Files_Tab_V2_Claude_Code_Handoff.md`*

Basic file UI exists (FilesTabV2, NewFolderDialog, HelpPanel, GlobalFiltersBar). Tag system largely missing:
- Hybrid AND/OR filtering logic (OR within category, AND between categories)
- `TagChip` atom component (no standalone atom exists)
- `TagCheckbox` atom component (no standalone atom exists)
- `TagsDropdown` component
- `CollapsibleFilterBar` with search always visible
- `ActiveTagChips` row showing applied filters
- `useTagAnalysis` hook for tag counting
- Tag CRUD API endpoints (no server routes)
- Full folder navigation with breadcrumbs

### Session Recording Backend (schema + UI exist, backend logic missing)
*Source: `DOCUMENTATION_TRACKER.md`*

- Recording service to capture Y.js events
- REST endpoints: start/stop/list/playback
- MinIO storage for recording data
- Playback reconstruction logic

---

## Medium Priority

### Layout Tab — Multi-Select Operations (business logic unclear)
*Source: `archive/layouttab/Layout_Tab_V4-6_Claude_Code_Handoff.md`*

- UI for multi-select exists
- Combine, Link, Swap, Match operations — verify business logic is wired
- Combine: flatten into single ViewGroup (bounding rect logic?)
- Swap: exchange canvas positions (2 only)
- Match: make all same canvas size (largest? smallest? user choice?)

### Layout Tab — Custom Layout Template Persistence (missing)
*Source: `archive/layouttab/Layout_Tab_V4-6_Claude_Code_Handoff.md`*

- "Save current as template" button exists in spec
- No server endpoints for saving/loading custom layout templates
- TemplatesTabContent.jsx exists on frontend but no persistence backend

### ViewGroup Auto-Naming (server logic missing)
*Source: `archive/toolsandcanvas/ViewGroup Selector/backend/ViewGroup_Links_Backend_Architecture_Handoff.md`*

- When second view is added to a solo ViewGroup, auto-generate a name
- Examples: "Slice Group", "Volume Render Group"
- Should be automatic on view creation, not a separate API call
- No evidence of this logic in `server/src/routes/viewgroups.js`

---

## Low Priority

### Reusable Hybrid Filter Component
*Source: `archive/toolsandcanvas/Widget_Creation_Part2_Claude_Code_Handoff.md`*

- Responsive filter with breakpoints (compact, medium, full)
- Currently inline in various places, not extracted as reusable component

### ToggleSwitch Atom Component
*Source: `archive/toolsandcanvas/Widget_Creation_Part2_Claude_Code_Handoff.md`*

- Standalone toggle switch atom (no dedicated atom exists; only inline in AdminSettings)

### Link Reminder Toast
*Source: `archive/toolsandcanvas/ViewGroup Selector/ViewGroup_Selector_Links_Claude_Code_Handoff.md`*

- Toast notification when link state changes
- Shows once per session when activating linked ViewGroup
- "Disable Links" button to disable incoming sync

### ViewGroup Duplication Dialog (frontend)
*Source: `archive/toolsandcanvas/ViewGroup Selector/ViewGroup_Selector_Links_Claude_Code_Handoff.md`*

- Backend duplication logic exists (POST `/api/viewgroups/:id/duplicate`)
- Frontend dialog should offer three options: Keep individual, Link to original (default), No links
- Warning text for "Link to original" option

### Canvas Chrome — Info Bar Polish
*Source: `archive/canvaschrome/Canvas_Chrome_V5_Claude_Code_Handoff.md`*

- Size popout with canvas/viewport size presets (1×1, 2×2, 3×3, 4×4)
- Verify all responsive breakpoints (855px, 810px, 650px, 500px)

### Instance Tools — Widget Value Interaction
*Source: `archive/instancetools/Instance_Tools_V2_Claude_Code_Handoff.md`*

- Hover/click to copy widget values to clipboard

---

## Not Started (Future)

### VR Implementation
*Active specs in `docs/specifications/`*

- WebXR integration with VTK.js
- InstanceTypeHandler VR methods
- Collaborative VR (avatars, controllers)
- Spatial audio integration
- See: `VR_Interface_Design_Specification_v2.md`, `VR_First_Architecture_Migration_Strategy.md`

### CIAUI Framework (Separate Project)
*Active spec: `docs/specifications/CIAUI_Framework_Specification.md`*

- Custom WebGPU/WebXR UI framework
- Separate repository, not part of CIA_Web

---

## Documentation Upkeep

- `DOCUMENTATION_TRACKER.md` — last updated Dec 2025, needs refresh
- `ATOMIC_DESIGN.md` — component inventories are stale (organisms count has grown significantly)
- `guides/CONTRIBUTOR_GUIDE.md` — needs v2.0 architecture update
- `guides/BACKEND_SETUP.md` — needs update for completed features
