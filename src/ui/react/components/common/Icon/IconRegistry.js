import * as MaterialIcons from "@mui/icons-material";

// Icon registry with semantic names (Material icons only)
const ICON_MAP = {
  // VR & 3D
  vr: "ViewInArOutlined",
  rotate3d: "ThreeDRotationOutlined",
  gesture: "GestureOutlined",
  spatialAudio: "SpatialAudioOffOutlined",
  volume3d: "ViewInArOutlined",

  // Navigation
  pan: "OpenWithOutlined",
  zoom: "ZoomInOutlined",
  fit: "CenterFocusStrongOutlined",
  reset: "RefreshOutlined",
  camera: "CameraAltOutlined",
  eye: "VisibilityOutlined",
  eyeOff: "VisibilityOffOutlined",
  fullscreen: "FullscreenOutlined",

  // Tools
  clip: "ContentCutOutlined",
  measure: "StraightenOutlined",
  annotate: "CommentOutlined",
  colorMap: "PaletteOutlined",
  representation: "LayersOutlined",
  filter: "FilterAltOutlined",

  // Data
  dataset: "DatasetOutlined",
  file: "DescriptionOutlined",
  image: "ImageOutlined",
  download: "DownloadOutlined",
  upload: "UploadOutlined",

  // UI Actions
  close: "CloseOutlined",
  add: "AddOutlined",
  check: "CheckOutlined",
  delete: "DeleteOutlined",
  copy: "ContentCopyOutlined",
  settings: "SettingsOutlined",
  menu: "MoreHorizOutlined",
  menuVertical: "MoreVertOutlined",
  undo: "UndoOutlined",
  redo: "RedoOutlined",
  search: "SearchOutlined",
  link: "LinkOutlined",
  pin: "PushPinOutlined",
  grid: "GridViewOutlined",
  tools: "BuildOutlined",

  // Collaboration
  users: "GroupOutlined",
  mic: "MicOutlined",
  play: "PlayArrowOutlined",
  pause: "PauseOutlined",

  // Scientific
  biotech: "BiotechOutlined",
  science: "ScienceOutlined",
  microscope: "BiotechOutlined",
  memory: "MemoryOutlined",
};

// Custom icons registered at runtime (for plugins)
const customIcons = {};

/**
 * Get icon component by semantic name
 * @param {string} name - Semantic icon name
 * @returns {React.Component} Icon component
 */
export function getIcon(name) {
  // Check custom icons first (plugins)
  if (customIcons[name]) {
    return customIcons[name];
  }

  // Get from registry
  const iconName = ICON_MAP[name];
  if (!iconName) {
    console.warn(`Unknown icon: ${name}`);
    return MaterialIcons.HelpOutlineOutlined;
  }

  return MaterialIcons[iconName] || MaterialIcons.HelpOutlineOutlined;
}

/**
 * Icon component with semantic naming
 * @example <Icon name="vr" size={20} />
 */
export function Icon({ name, size = 24, color, className, ...props }) {
  const IconComponent = getIcon(name);
  return (
    <IconComponent
      size={size}
      style={{ color }}
      className={className}
      {...props}
    />
  );
}

/**
 * Register custom icon (for plugins)
 * @param {string} name - Icon name
 * @param {React.Component} component - Icon component
 */
export function registerIcon(name, component) {
  if (ICON_MAP[name]) {
    console.warn(`Overwriting existing icon: ${name}`);
  }
  customIcons[name] = component;
}

/**
 * Get current icon library
 * @returns {'material'}
 */
export function getIconLibrary() {
  return "material";
}

/**
 * Check if icon exists
 * @param {string} name
 * @returns {boolean}
 */
export function hasIcon(name) {
  return name in ICON_MAP || name in customIcons;
}

/**
 * Get all available icon names
 * @returns {string[]}
 */
export function getAvailableIcons() {
  return [...Object.keys(ICON_MAP), ...Object.keys(customIcons)];
}
