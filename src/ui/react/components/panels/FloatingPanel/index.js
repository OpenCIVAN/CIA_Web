// src/ui/react/components/panels/FloatingPanel/index.js
// Floating Panel exports
//
// UPDATED: Now includes ScratchPad floating panel exports

// Core floating panel components
export { FloatingPanel, FloatingPanelPortal } from "./FloatingPanel.jsx";
export { PopOutButton } from "./PopOutButton.jsx";
export { AllFloatingPanels } from "./AllFloatingPanels.jsx";

// Context and hooks
export {
  FloatingPanelProvider,
  useFloatingPanels,
  usePanelPopOut,
  FLOATING_PANEL_DEFAULTS,
  VR_PANEL_POSITIONS,
} from "./FloatingPanelContext.jsx";

// ScratchPad floating panel
export {
  ScratchPadFloating,
  useScratchPadFloating,
  SCRATCHPAD_PANEL_ID,
  SCRATCHPAD_CONFIG,
} from "./ScratchPadFloating.jsx";
