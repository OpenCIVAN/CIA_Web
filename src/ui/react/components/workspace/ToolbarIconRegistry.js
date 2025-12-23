// CLEAN PATTERN: Map semantic icon names, not tool IDs

import { ui as log } from "@Utils/logger.js";
import { createSlashedIcon } from "@UI/react/components/common/IconOverlay";

import {
  // Geometry & 3D
  IconBox,
  IconCircle,
  IconLayers,

  // Measurement & Analysis
  IconRuler,
  IconMove,

  // Camera & View
  IconCamera,
  IconEye,
  IconEyeOff,
  IconZoomIn,
  IconZoomOut,

  // Tools & Editing
  IconScissors,
  IconRotateCcw,

  // Visual Properties
  IconSun,
  IconPalette,
  IconGrid3x3,
  IconCircleDot,

  // Navigation
  IconMaximize,
  IconMinimize,

  // UI Actions
  IconAdd,
  IconEdit,
  IconDelete,
  IconCheck,
  IconClose,
  IconRefresh,
  IconDownload,
  IconUpload,
  IconSettings,
  IconSliders,
  IconInfo,

  // Communication
  IconMessageSquare,

  // Data
  IconDatabase,
  IconFile,
} from '@UI/react/components/common/Icon';

import {
  SquareOutlined as IconSquare,
  ChangeHistoryOutlined as IconTriangle,
  BarChartOutlined as IconBarChart,
  TrendingUpOutlined as IconTrendingUp,
  HubOutlined as IconNetwork,
  CenterFocusStrongOutlined as IconFocus,
  AutoFixHighOutlined as IconWand,
  ThreeDRotationOutlined as IconRotateCw,
  ViewInArOutlined as IconMove3d,
  ContrastOutlined as IconContrast,
  GradientOutlined as IconRainbow,
  AcUnitOutlined as IconThermometerSnowflake,
  WbSunnyOutlined as IconThermometerSun,
  DarkModeOutlined as IconEclipse,
  GridOnOutlined as IconGrid,
  OpacityOutlined as IconDroplet,
  ExploreOutlined as IconCompass,
  ArchitectureOutlined as IconPencilRuler,
  WallpaperOutlined as IconWallpaper,
  SouthEastOutlined as IconCornerDownRight,
  SouthWestOutlined as IconCornerDownLeft,
  NorthEastOutlined as IconCornerUpRight,
  NorthWestOutlined as IconCornerUpLeft,
} from '@mui/icons-material';

const SlashedCompass = createSlashedIcon(IconCompass);
const SlashedGrid = createSlashedIcon(IconGrid);
const SlashedRuler = createSlashedIcon(IconRuler);

/**
 * ICON REGISTRY
 *
 * Maps semantic icon NAMES to Lucide components.
 * Tool definitions reference these names via the `icon` property.
 *
 * PATTERN:
 * - Use lowercase-with-hyphens for names
 * - Keep names semantic, not tool-specific
 * - Allow multiple tools to share one icon
 * - Add aliases for common variations
 *
 * USAGE IN TOOLS:
 * {
 *   id: "my-specific-tool",        ← Unique tool ID
 *   icon: "compass",               ← Semantic icon name
 *   label: "My Tool"
 * }
 */
const TOOL_ICON_MAP = {
  // ==========================================================================
  // GEOMETRY & 3D
  // Used by: general shapes, bounds, primitives
  // ==========================================================================
  box: IconBox,
  cube: IconBox,
  square: IconSquare,
  circle: IconCircle,
  triangle: IconTriangle,
  layers: IconLayers,

  // ==========================================================================
  // MEASUREMENT & ANALYSIS
  // Used by: measurement tools, statistics, data analysis
  // ==========================================================================
  ruler: IconRuler,
  measure: IconRuler, // Alias
  "ruler-off": SlashedRuler,
  "measure-off": SlashedRuler,
  "bar-chart": IconBarChart,
  trend: IconTrendingUp,
  network: IconNetwork,
  graph: IconNetwork, // Alias

  // ==========================================================================
  // CAMERA & VIEWING
  // Used by: camera controls, view presets, zoom
  // ==========================================================================
  camera: IconCamera,
  eye: IconEye,
  "eye-off": IconEyeOff,
  focus: IconFocus,
  "zoom-in": IconZoomIn,
  "zoom-out": IconZoomOut,

  // ==========================================================================
  // TOOLS & MANIPULATION
  // Used by: transform, clipping, editing tools
  // ==========================================================================
  scissors: IconScissors,
  clip: IconScissors, // Alias
  wand: IconWand,
  transform: IconWand, // Alias
  move: IconMove,
  translate: IconMove, // Alias
  "rotate-cw": IconRotateCw,
  "rotate-ccw": IconRotateCcw,
  rotate: IconRotateCw, // Alias
  "move-3d": IconMove3d,
  axes: IconMove3d, // Alias

  // ==========================================================================
  // VISUAL PROPERTIES
  // Used by: colormaps, lighting, rendering options
  // ==========================================================================
  palette: IconPalette,
  colormap: IconPalette, // Alias
  sun: IconSun,
  lighting: IconSun, // Alias
  contrast: IconContrast,
  rainbow: IconRainbow,
  "temp-cold": IconThermometerSnowflake,
  "temp-hot": IconThermometerSun,
  eclipse: IconEclipse,
  grayscale: IconEclipse, // Alias
  wallpaper: IconWallpaper,
  texture: IconWallpaper, // Alias
  grid: IconGrid,
  "grid-off": SlashedGrid,
  "grid-3x3": IconGrid3x3,
  points: IconCircleDot,
  droplet: IconDroplet,

  // ==========================================================================
  // NAVIGATION & ORIENTATION
  // Used by: orientation cube, navigation aids
  // ==========================================================================
  compass: IconCompass,
  "compass-off": SlashedCompass,

  // ==========================================================================
  // CORNER POSITIONING
  // Used by: widget positioning controls
  // ==========================================================================
  "corner-down-right": IconCornerDownRight,
  "corner-down-left": IconCornerDownLeft,
  "corner-up-right": IconCornerUpRight,
  "corner-up-left": IconCornerUpLeft,
  "corner-br": IconCornerDownRight, // Alias
  "corner-bl": IconCornerDownLeft, // Alias
  "corner-tr": IconCornerUpRight, // Alias
  "corner-tl": IconCornerUpLeft, // Alias

  // ==========================================================================
  // ANNOTATIONS & COMMUNICATION
  // Used by: annotations, notes, measurements display
  // ==========================================================================
  message: IconMessageSquare,
  annotation: IconMessageSquare, // Alias
  note: IconMessageSquare, // Alias
  "pencil-ruler": IconPencilRuler,

  // ==========================================================================
  // UI ACTIONS
  // Used by: buttons, confirmations, common actions
  // ==========================================================================
  plus: IconAdd,
  add: IconAdd, // Alias
  edit: IconEdit,
  delete: IconDelete,
  trash: IconDelete, // Alias
  check: IconCheck,
  confirm: IconCheck, // Alias
  x: IconClose,
  cancel: IconClose, // Alias
  close: IconClose, // Alias
  refresh: IconRefresh,
  reload: IconRefresh, // Alias
  fullscreen: IconMaximize,
  maximize: IconMaximize, // Alias
  minimize: IconMinimize,

  // ==========================================================================
  // DATA & FILES
  // Used by: data info, import/export
  // ==========================================================================
  database: IconDatabase,
  data: IconDatabase, // Alias
  file: IconFile,
  document: IconFile, // Alias
  download: IconDownload,
  export: IconDownload, // Alias
  upload: IconUpload,
  import: IconUpload, // Alias

  // ==========================================================================
  // SETTINGS & INFO
  // Used by: configuration, properties, information
  // ==========================================================================
  settings: IconSettings,
  config: IconSettings, // Alias
  sliders: IconSliders,
  properties: IconSliders, // Alias
  controls: IconSliders, // Alias
  info: IconInfo,
  help: IconInfo, // Alias

  // ==========================================================================
  // FALLBACK
  // ==========================================================================
  default: IconBox,
};

/**
 * Get Material icon component for a tool
 *
 * Priority order:
 * 1. Explicit icon provided by tool definition (tool.icon)
 * 2. Tool's ID if it matches an icon name (tool.id)
 * 3. Default fallback (IconBox)
 *
 * @param {string} toolId - The tool's unique ID
 * @param {string} [toolIcon] - Optional explicit icon name from tool.icon
 * @returns {React.Component} Material icon component
 */
export function getToolIcon(toolId, toolIcon) {
  // Priority 1: Explicit icon name provided
  if (toolIcon && TOOL_ICON_MAP[toolIcon]) {
    return TOOL_ICON_MAP[toolIcon];
  }

  // Priority 2: Tool ID matches an icon name
  if (TOOL_ICON_MAP[toolId]) {
    return TOOL_ICON_MAP[toolId];
  }

  // Priority 3: Default fallback
  log.warn(`No icon mapping for tool: ${toolId}, using default`);
  log.debug(
    `Hint: Add 'icon: "icon-name"' to tool definition or add mapping: "${toolId}": IconComponent`
  );
  return TOOL_ICON_MAP["default"];
}

/**
 * Check if an icon name exists
 *
 * @param {string} iconName - Icon name to check
 * @returns {boolean}
 */
export function hasIconMapping(iconName) {
  return iconName in TOOL_ICON_MAP;
}

/**
 * Get all available icon names
 * Useful for documentation and debugging
 *
 * @returns {string[]} Array of all icon names
 */
export function getAvailableIcons() {
  return Object.keys(TOOL_ICON_MAP);
}

/**
 * Register a new icon at runtime
 * Allows features/plugins to add their own icons
 *
 * @param {string} iconName - Name to register
 * @param {React.Component} iconComponent - Material icon component
 */
export function registerIcon(iconName, iconComponent) {
  if (TOOL_ICON_MAP[iconName]) {
    log.warn(`Overwriting existing icon mapping: ${iconName}`);
  }
  TOOL_ICON_MAP[iconName] = iconComponent;
}

/**
 * USAGE EXAMPLES
 *
 * Example 1: Explicit icon (recommended)
 * ----------------------------------------
 * {
 *   id: "orientation-cube-toggle",
 *   icon: "compass",          ← References TOOL_ICON_MAP["compass"]
 *   label: "Orientation"
 * }
 *
 * Example 2: Multiple tools, same icon
 * ----------------------------------------
 * {
 *   id: "line-measurement",
 *   icon: "ruler",            ← Reuses "ruler"
 *   label: "Line"
 * }
 * {
 *   id: "distance-tool",
 *   icon: "ruler",            ← Same icon!
 *   label: "Distance"
 * }
 *
 * Example 3: Using aliases
 * ----------------------------------------
 * {
 *   id: "import-data",
 *   icon: "upload",           ← Or "import" - both work!
 *   label: "Import"
 * }
 *
 * Example 4: ID fallback (less flexible)
 * ----------------------------------------
 * {
 *   id: "compass",            ← If no icon property, uses ID
 *   label: "Orientation"      ← Works if TOOL_ICON_MAP["compass"] exists
 * }
 */
