# Specification Archive Notes

**Last Updated:** January 28, 2026

This document tracks which specifications have been archived and what supersedes them.

---

## Archive History

### January 28, 2026

Bulk cleanup: archived all implemented specification folders (linking, filestab, layouttab, navigator, instancetools, canvaschrome, toolsandcanvas) and 6 root-level implemented specs. Remaining unimplemented features extracted to `docs/IMPLEMENTATION_TODO.md`. Also deleted `docs/archive/legacy/` and `docs/archive/prototypes/` (git history preserves them), and deleted `docs/prototypes/`.

### January 25, 2026

The following specifications were archived as part of the toolsandcanvas redesign consolidation.

---

## Archived Specifications

### 1. Canvas_Area_Design_Specification.md

**Archived:** January 25, 2026
**Reason:** Partially superseded by newer toolsandcanvas specifications

| Section | Status | Superseded By |
|---------|--------|---------------|
| CanvasGrid, CanvasCell | ✅ Still relevant | Extracted to `Canvas_Interaction_Systems_Specification.md` |
| Drop Zone System | ✅ Still relevant | Extracted to `Canvas_Interaction_Systems_Specification.md` |
| InstanceViewport | ✅ Still relevant | Base component still applies |
| **InstanceHeader** | ❌ Superseded | `toolsandcanvas/RoomHeader/` → Mini Canvas Header, Full Canvas Header |
| **InstanceToolbar (mini)** | ❌ Superseded | `toolsandcanvas/Widget_Creation_Part2` → Canvas Toolbar Footer (shared toolbar) |
| ThumbnailLayer | ✅ Still relevant | Extracted to `Canvas_Interaction_Systems_Specification.md` |
| SelectionManager | ✅ Still relevant | Extracted to `Canvas_Interaction_Systems_Specification.md` |
| **Canvas Navigator Popout** | ❌ Superseded | `toolsandcanvas/RoomHeader/` → Popout Windows with snap behavior |
| **Floating Instance Tools Panel** | ❌ Superseded | `toolsandcanvas/Widget_Creation_Part2` → Panel is now floating + Canvas Toolbar Footer |
| FloatingPanels System | Partial | Detailed in `FloatingPanel_Component_Specification.md` |

**Notes:**
- The new architecture introduces Rooms → Workspaces → Views hierarchy
- Per-instance toolbars replaced by shared Canvas Toolbar Footer (better for small viewports)
- Popout windows now have snap-to-edge behavior and are managed by PopoutManager

---

### 2. Adaptive_Components_Implementation_Prompt.md

**Archived:** January 25, 2026
**Reason:** Components are already adaptive by default

**What happened:**
- The base components (Button, Toggle, Slider, Section, Icon, etc.) already use `useAdaptive()` internally
- They automatically adapt sizing for Desktop vs VR modes
- No separate "Adaptive" wrapper components needed
- The AdaptiveContext with tokens already exists at `src/ui/react/context/AdaptiveContext.jsx`

**Superseded by:**
- Built-in adaptive behavior in `/src/ui/react/components/atoms/` and `/src/ui/react/components/molecules/`
- AdaptiveContext at `/src/ui/react/context/AdaptiveContext.jsx`

---

## Current Active Specifications

Only VR and framework specs remain active (not yet implemented):

| File | Status | Notes |
|------|--------|-------|
| `CIAUI_Framework_Specification.md` | Active | Separate WebGPU/WebXR framework project |
| `VR_First_Architecture_Migration_Strategy.md` | Active | VR migration strategy |
| `VR_Interface_Design_Specification_v2.md` | Active | VR interface design |

---

## January 28, 2026 — Bulk Archive

The following were archived after cross-referencing against source code.
Unimplemented items were extracted to `docs/IMPLEMENTATION_TODO.md`.

### Root-level specs (implemented)
- `Atomic_Component_Decomposition_Spec.md` — Atomic design system fully implemented
- `Canvas_Interaction_Systems_Specification.md` — Drop zones, thumbnails, selection implemented
- `FloatingPanel_Component_Specification.md` — FloatingPanel system implemented
- `Left_Panel_Design_Specification.md` — Left panel implemented
- `Right_Panel_Design_Specification.md` — Right panel implemented
- `TransformControl_Implementation_Package.md` — Transform controls implemented

### Folder specs (substantially implemented)
- `linking/` — View linking system (50+ source files, ~95%)
- `filestab/` — Files tab (~35%, tag system gaps in TODO)
- `layouttab/` — Layout tab (~72%)
- `navigator/` — Navigator (~76%, bookmarks missing)
- `instancetools/` — Instance tools (~82%)
- `canvaschrome/` — Canvas chrome (~78%)
- `toolsandcanvas/` — Room header, workspace bar, viewgroup selector, widget creation (~85%)

---

## Previously Archived

- `volumetric/` — Volumetric data handling specs
- `panel_overlay/` — Panel overlay system (replaced by FloatingPanel)
- `VR_Accessibility_Settings_Panel_Specification.md` — VR accessibility settings
- `Canvas_Area_Design_Specification.md` — Partially superseded by toolsandcanvas
- `Adaptive_Components_Implementation_Prompt.md` — Adaptive behavior built into atoms
