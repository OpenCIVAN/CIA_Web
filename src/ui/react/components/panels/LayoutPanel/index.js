// src/ui/react/components/panels/LayoutPanel/index.js
// Layout Panel exports — trimmed after cleanup.
//
// The visual LayoutPanel, FloatingCanvasNavigator, CanvasNavigator, subtabs,
// and SpawnSizePicker have been removed (superseded by CanvasMapPanel).
//
// What remains:
// - LayoutPanelContext + LayoutPanelProvider (still consumed by useViewContextLogic, PopoutButtons)
// - useLayoutPanel hook (canvas state provider for context consumers)
// - DOCK_POSITIONS (used by PopoutButtons — will be removed in follow-up)

// =============================================================================
// CONTEXT & HOOKS
// =============================================================================

export {
  LayoutPanelProvider,
  useLayoutPanelContext,
  useLayoutPanelLogic,
  useNavigatorDocked,
  DOCK_POSITIONS,
} from "./LayoutPanelContext";

// =============================================================================
// LOGIC HOOK & CONSTANTS
// =============================================================================

export {
  useLayoutPanel,
  SPAWN_SIZES,
  parseSpawnSize,
} from "./LayoutPanel.logic";
