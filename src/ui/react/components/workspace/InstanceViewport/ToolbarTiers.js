// src/ui/react/components/workspace/InstanceViewport/ToolbarTiers.js
// Tool group definitions and tier configurations for the overlay toolbar system

import {
  IconPencil,
  IconRuler,
  IconCircle,
  IconArrowRight,
  IconEye,
  IconPalette,
  IconLayers,
  IconGrid3x3,
  IconBox,
  IconMaximize,
  IconUsers,
  IconShare,
  IconMessageSquare,
  IconVideo,
  IconUndo,
  IconRedo,
  IconTools,
  IconMoreHorizontal,
  IconSettings,
  IconVR,
  IconMove,
  IconZoomIn,
  IconRotateCcw,
} from '@UI/react/components/common/Icon';

import {
  TitleOutlined as IconType,
  GpsFixedOutlined as IconCrosshair,
  SquareOutlined as IconSquare,
  CenterFocusStrongOutlined as IconFocus,
  CropFreeOutlined as IconScan,
  NearMeOutlined as IconMousePointer,
} from '@mui/icons-material';

// ============================================================================
// TOOL GROUPS - Organized by functionality
// ============================================================================

export const TOOL_GROUPS = {
  annotate: {
    id: "annotate",
    label: "Annotate",
    icon: IconPencil,
    description: "Drawing and annotation tools",
    tools: [
      { id: "pencil", label: "Pencil", icon: IconPencil, shortcut: "P" },
      { id: "text", label: "Text", icon: IconType, shortcut: "T" },
      { id: "measure", label: "Measure", icon: IconRuler, shortcut: "M" },
      { id: "crosshair", label: "Crosshair", icon: IconCrosshair },
      { id: "rectangle", label: "Rectangle", icon: IconSquare },
      { id: "circle", label: "Circle", icon: IconCircle },
      { id: "arrow", label: "Arrow", icon: IconArrowRight },
    ],
  },
  view: {
    id: "view",
    label: "View",
    icon: IconEye,
    description: "Camera and view controls",
    tools: [
      { id: "orbit", label: "Orbit", icon: IconEye },
      { id: "pan", label: "Pan", icon: IconMove },
      { id: "zoom", label: "Zoom", icon: IconZoomIn },
      { id: "reset-view", label: "Reset View", icon: IconRotateCcw, shortcut: "R" },
      { id: "focus", label: "Focus Selection", icon: IconFocus },
      { id: "fullscreen", label: "Fullscreen", icon: IconMaximize, shortcut: "F" },
    ],
  },
  visual: {
    id: "visual",
    label: "Visual",
    icon: IconPalette,
    description: "Visual styling and appearance",
    tools: [
      { id: "colormap", label: "Colormap", icon: IconPalette },
      { id: "layers", label: "Layers", icon: IconLayers },
      { id: "grid", label: "Grid", icon: IconGrid3x3 },
      { id: "bounds", label: "Bounds", icon: IconBox },
    ],
  },
  collab: {
    id: "collab",
    label: "Collaborate",
    icon: IconUsers,
    description: "Collaboration tools",
    tools: [
      { id: "cursors", label: "Show Cursors", icon: IconUsers },
      { id: "share", label: "Share View", icon: IconShare },
      { id: "comment", label: "Comment", icon: IconMessageSquare },
      { id: "record", label: "Record", icon: IconVideo },
    ],
  },
};

// ============================================================================
// GLOBAL TOOLS - Always visible on right side
// ============================================================================

export const GLOBAL_TOOLS = {
  instanceTools: {
    id: "instance-tools",
    label: "Instance Tools",
    icon: IconTools,
    description: "Open instance tools panel",
    shortcut: "I",
  },
  more: {
    id: "more",
    label: "More",
    icon: IconMoreHorizontal,
    description: "Additional options",
  },
};

// ============================================================================
// HISTORY TOOLS - Undo/Redo
// ============================================================================

export const HISTORY_TOOLS = {
  undo: {
    id: "undo",
    label: "Undo",
    icon: IconUndo,
    shortcut: "Ctrl+Z",
  },
  redo: {
    id: "redo",
    label: "Redo",
    icon: IconRedo,
    shortcut: "Ctrl+Shift+Z",
  },
};

// ============================================================================
// NAVIGATION BAR TOOLS - Bottom bar controls
// ============================================================================

export const NAV_TOOLS = {
  pan: { id: "nav-pan", label: "Pan", icon: IconMove },
  zoom: { id: "nav-zoom", label: "Zoom", icon: IconZoomIn },
  rotate: { id: "nav-rotate", label: "Rotate", icon: IconRotateCcw },
  fit: { id: "nav-fit", label: "Fit", icon: IconScan },
  oneToOne: { id: "nav-1to1", label: "1:1", icon: null },
};

// ============================================================================
// CORNER CONTROL TOOLS - For small viewport fallback
// ============================================================================

export const CORNER_TOOLS = {
  instanceTools: {
    id: "corner-instance-tools",
    label: "Instance Tools",
    icon: IconTools,
  },
  vrMode: {
    id: "corner-vr",
    label: "VR Mode",
    icon: IconVR,
  },
  settings: {
    id: "corner-settings",
    label: "Settings",
    icon: IconSettings,
  },
};

// ============================================================================
// GEAR ONLY DROPDOWN ITEMS - For super tiny viewports
// ============================================================================

export const GEAR_DROPDOWN_ITEMS = [
  {
    id: "gear-instance-tools",
    label: "Instance Tools",
    icon: IconTools,
    primary: true,
  },
  { id: "gear-vr", label: "VR Mode", icon: IconVR },
  { id: "gear-maximize", label: "Maximize", icon: IconMaximize },
  { id: "gear-duplicate", label: "Duplicate", icon: null },
  { id: "gear-close", label: "Close", icon: null },
];

// ============================================================================
// TIER CONFIGURATIONS - What shows at each breakpoint
// ============================================================================

export const TIER_CONFIG = {
  expanded: {
    // All individual tool buttons
    showAnnotateGroup: false,
    showViewGroup: false,
    showVisualGroup: false,
    showIndividualTools: true,
    showCollabGroup: false,
    showHistoryButtons: true,
    cursorToolVisible: true,
    groupsAsDropdowns: false,
    iconsOnly: false,
  },
  standard: {
    // Annotate button + View/Visual dropdowns + Cursor + Undo/Redo
    showAnnotateGroup: true,
    showViewGroup: true,
    showVisualGroup: true,
    showIndividualTools: false,
    showCollabGroup: false,
    showHistoryButtons: true,
    cursorToolVisible: true,
    groupsAsDropdowns: true,
    iconsOnly: false,
  },
  compact: {
    // All groups as labeled dropdown buttons
    showAnnotateGroup: true,
    showViewGroup: true,
    showVisualGroup: true,
    showIndividualTools: false,
    showCollabGroup: true,
    showHistoryButtons: true,
    cursorToolVisible: false,
    groupsAsDropdowns: true,
    iconsOnly: false,
  },
  mini: {
    // Icon-only group dropdown buttons
    showAnnotateGroup: true,
    showViewGroup: true,
    showVisualGroup: true,
    showIndividualTools: false,
    showCollabGroup: true,
    showHistoryButtons: false,
    cursorToolVisible: false,
    groupsAsDropdowns: true,
    iconsOnly: true,
  },
};

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Get the tier configuration for a given UI mode
 * @param {'expanded'|'standard'|'compact'|'mini'} uiMode
 * @returns {Object} Tier configuration
 */
export const getTierConfig = (uiMode) => {
  return TIER_CONFIG[uiMode] || TIER_CONFIG.mini;
};

/**
 * Filter tools array based on tier configuration
 * @param {Array} tools - Array of tools from workspaceManager
 * @param {Object} tierConfig - Configuration for current tier
 * @returns {Object} Organized tools by group
 */
export const organizeToolsForTier = (tools, tierConfig) => {
  // For now, return the tools as-is organized by their group property
  // In a real implementation, this would filter and organize based on tier
  const organized = {
    annotate: [],
    view: [],
    visual: [],
    collab: [],
    other: [],
  };

  tools.forEach((tool) => {
    const group = tool.group || "other";
    if (organized[group]) {
      organized[group].push(tool);
    } else {
      organized.other.push(tool);
    }
  });

  return organized;
};

/**
 * Get tool groups to display based on UI mode
 * @param {'expanded'|'standard'|'compact'|'mini'} uiMode
 * @returns {Array} Array of group IDs to show
 */
export const getVisibleGroups = (uiMode) => {
  const config = getTierConfig(uiMode);
  const groups = [];

  if (config.showAnnotateGroup) groups.push("annotate");
  if (config.showViewGroup) groups.push("view");
  if (config.showVisualGroup) groups.push("visual");
  if (config.showCollabGroup) groups.push("collab");

  return groups;
};

// ============================================================================
// INSTANCE COLORS - For color assignment
// ============================================================================

export const INSTANCE_COLORS = [
  { name: "blue", hex: "#60a5fa", cssVar: "$color-accent-blue" },
  { name: "green", hex: "#34d399", cssVar: "$color-accent-green" },
  { name: "purple", hex: "#c084fc", cssVar: "$color-accent-purple" },
  { name: "pink", hex: "#fb7185", cssVar: "$color-accent-pink" },
  { name: "amber", hex: "#fbbf24", cssVar: "$color-accent-amber" },
  { name: "teal", hex: "#7dd3fc", cssVar: "$color-accent-teal" },
];

/**
 * Get color for an instance based on creation index
 * @param {number} index - Instance creation index
 * @returns {Object} Color object with name and hex
 */
export const getInstanceColor = (index) => {
  return INSTANCE_COLORS[index % INSTANCE_COLORS.length];
};

export default {
  TOOL_GROUPS,
  GLOBAL_TOOLS,
  HISTORY_TOOLS,
  NAV_TOOLS,
  CORNER_TOOLS,
  GEAR_DROPDOWN_ITEMS,
  TIER_CONFIG,
  INSTANCE_COLORS,
  getTierConfig,
  organizeToolsForTier,
  getVisibleGroups,
  getInstanceColor,
};
