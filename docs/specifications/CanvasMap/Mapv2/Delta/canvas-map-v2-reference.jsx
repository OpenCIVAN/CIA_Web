/**
 * =============================================================================
 * CANVAS MAP V2 - REFERENCE IMPLEMENTATION
 * =============================================================================
 * 
 * This prototype demonstrates the COMPLETE Canvas Map V2 design with:
 * 
 * 1. SIDE QUICK NAV TOOLBAR - Always visible, configurable left/right
 * 2. COMPANION PANEL - Collapsible Views & Datasets for drag-drop
 * 3. MINIMAP PANNING - Drag to pan when content exceeds viewport
 * 4. CURSOR CONTROLS - Consolidated in Team mode with per-user toggles
 * 5. GLASSMORPHISM STYLING - Blue-tinted UI chrome, moonlight pastels
 * 6. RESPONSIVE SIZEMODE - Adapts UI density based on panel width
 * 7. CONFIGURABLE HANDEDNESS - User preference for toolbar position
 * 
 * IMPORTANT: This file contains extensive comments explaining WHY each
 * design decision was made. Claude Code should preserve the architecture
 * while adapting to real data hooks.
 * 
 * @author Beth's Design Sessions - January 2026
 * @version 2.0.0
 */

import React, { useState, useCallback, useMemo, memo, useRef, useEffect } from 'react';
import {
  Eye, EyeOff, ZoomIn, ZoomOut, Home, Bookmark, BookmarkPlus,
  ChevronDown, ChevronRight, Plus, ChevronLeft, Package, Layers, Hash,
  MoreHorizontal, Radio, Crosshair, Scan, Search, GitBranch, Compass, Users,
  LayoutGrid, Frame, Link2, PanelRightOpen, PanelRightClose,
  Database, MousePointer2, Move
} from 'lucide-react';

// =============================================================================
// DESIGN TOKENS
// =============================================================================
/**
 * CRITICAL: These tokens match the actual CIA Web theme.
 * 
 * The color system has THREE distinct purposes:
 * 1. UI Chrome (blue-tinted) - Panel backgrounds, borders, glass effects
 * 2. Canvas (neutral) - Minimap background, cells - MUST be neutral for data accuracy
 * 3. Accents (moonlight pastels) - Mode colors, highlights, interactive elements
 * 
 * DO NOT use generic grays. The blue tint creates visual cohesion.
 */
const tokens = {
  colors: {
    // UI Chrome - Blue-tinted backgrounds (NOT pure grays!)
    bg: {
      base: '#020406',       // Darkest - page background
      primary: '#060a12',    // Panel backgrounds
      secondary: '#0c1220',  // Elevated surfaces
      tertiary: '#121a2e',   // Toolbars, headers
      elevated: '#18223c',   // Hover states
      // Canvas backgrounds - NEUTRAL (no blue tint) for data accuracy
      canvas: '#030303',
      canvasCell: '#080808',
    },
    // Glass effects - Blue-tinted transparency
    glass: {
      subtle: 'rgba(96, 165, 250, 0.03)',   // Barely visible
      light: 'rgba(96, 165, 250, 0.05)',    // Hover backgrounds
      medium: 'rgba(96, 165, 250, 0.08)',   // Active states
      strong: 'rgba(96, 165, 250, 0.12)',   // Emphasis
      panel: 'rgba(8, 14, 24, 0.88)',       // Panel overlay with blur
    },
    // Borders - White with varying opacity
    border: {
      subtle: 'rgba(255, 255, 255, 0.06)',
      default: 'rgba(255, 255, 255, 0.10)',
      medium: 'rgba(255, 255, 255, 0.15)',
      strong: 'rgba(255, 255, 255, 0.20)',
    },
    // Text - White with varying opacity
    text: {
      primary: 'rgba(255, 255, 255, 0.95)',
      secondary: 'rgba(255, 255, 255, 0.75)',
      tertiary: 'rgba(255, 255, 255, 0.55)',
      muted: 'rgba(255, 255, 255, 0.35)',
    },
    // Moonlight Pastel Accents - Vibrant but not harsh
    accent: {
      blue: '#60a5fa',    // Primary actions
      purple: '#c084fc',  // Links mode
      pink: '#fb7185',    // Alerts, VG colors
      amber: '#fbbf24',   // Team mode, warnings
      green: '#34d399',   // Layout mode, success
      teal: '#7dd3fc',    // Viewports, secondary
      indigo: '#a78bfa',  // VG colors
      red: '#f87171',     // Broadcasting, danger
      cyan: '#22d3ee',    // Cursors
    },
    // Mode-specific colors
    mode: {
      navigate: '#60a5fa',  // Blue - exploration
      layout: '#34d399',    // Green - building
      links: '#c084fc',     // Purple - connections
      team: '#fbbf24',      // Amber - collaboration
    },
  },
  // Blur values for glassmorphism
  blur: {
    subtle: 'blur(8px)',
    medium: 'blur(12px)',
    strong: 'blur(16px)',
  },
  // Shadows
  shadow: {
    glass: '0 8px 32px rgba(0, 0, 0, 0.4), inset 0 1px 1px rgba(255, 255, 255, 0.05)',
    glassLg: '0 12px 48px rgba(0, 0, 0, 0.5), inset 0 1px 2px rgba(255, 255, 255, 0.08)',
  },
  // Border radius
  radius: { xs: '2px', sm: '4px', md: '6px', lg: '8px', xl: '12px' },
  // Spacing
  spacing: { xs: '4px', sm: '8px', md: '12px', lg: '16px' },
  // Typography
  text: { xs: '10px', sm: '11px', md: '12px', lg: '13px' },
};

// =============================================================================
// MODE DEFINITIONS
// =============================================================================
/**
 * The Canvas Map has 4 modes. Each mode changes:
 * 1. What's shown on the minimap (overlays)
 * 2. What's in the contextual panel below
 * 3. What toolbar controls are available
 * 
 * Mode names are VERBS/ACTIONS, not nouns:
 * - Navigate (not "Navigation")
 * - Layout (not "Layouts" or "ViewGroups")
 * - Links (not "Connections")
 * - Team (not "Collaborators" or "Cursors")
 */
const MAP_MODES = {
  navigate: {
    id: 'navigate',
    name: 'Navigate',
    icon: Compass,
    color: tokens.colors.mode.navigate,
    description: 'Move around, find locations',
  },
  layout: {
    id: 'layout',
    name: 'Layout',
    icon: LayoutGrid,
    color: tokens.colors.mode.layout,
    description: 'Build and edit canvas',
  },
  links: {
    id: 'links',
    name: 'Links',
    icon: GitBranch,
    color: tokens.colors.mode.links,
    description: 'Manage connections',
  },
  team: {
    id: 'team',
    name: 'Team',
    icon: Users,
    color: tokens.colors.mode.team,
    description: 'Presence & cursors',
  },
};

// =============================================================================
// LAYOUT CONFIGURATIONS
// =============================================================================
/**
 * ViewGroup internal layouts. Each VG can have one of these arrangements.
 * The minimap shows these as small preview grids inside VG blocks.
 */
const LAYOUTS = {
  'single': { rows: 1, cols: 1, cells: 1 },
  'side-by-side': { rows: 1, cols: 2, cells: 2 },
  'stacked': { rows: 2, cols: 1, cells: 2 },
  '2x2': { rows: 2, cols: 2, cells: 4 },
  '1+2': { rows: 2, cols: 2, cells: 3 },
  '2+1': { rows: 2, cols: 2, cells: 3 },
};

/**
 * View type definitions with icons and colors.
 * These are used in the minimap internals and companion panel.
 */
const VIEW_TYPES = {
  volume: { icon: '🧊', color: tokens.colors.accent.purple, name: 'Volume' },
  slice: { icon: '🔲', color: tokens.colors.accent.blue, name: 'Slice' },
  data: { icon: '📊', color: tokens.colors.accent.green, name: 'Data Table' },
  chart: { icon: '📈', color: tokens.colors.accent.amber, name: 'Chart' },
  notes: { icon: '📝', color: tokens.colors.accent.pink, name: 'Notes' },
};

// =============================================================================
// SIZE MODE BREAKPOINTS
// =============================================================================
/**
 * CRITICAL: The panel adapts its UI density based on available width.
 * 
 * - COMPACT (<300px): Icons only in tabs, simplified lists, overflow menu
 * - STANDARD (300-440px): Full mode names, standard controls
 * - EXPANDED (>440px): All features visible, comfortable spacing
 * 
 * When companion panel is open, it consumes ~160px, so effective width shrinks.
 */
const SIZE_MODE_BREAKPOINTS = {
  compact: 300,
  expanded: 440,
};

const COMPANION_WIDTH = {
  compact: 140,
  standard: 160,
};

// =============================================================================
// MOCK DATA
// =============================================================================
// Canvas configuration - LARGER to demonstrate panning
const CANVAS = { rows: 6, cols: 6, homePosition: { row: 0, col: 0 } };

const VIEWGROUPS = [
  { id: 'vg-1', name: 'Brain Analysis', color: '#c084fc', isExplicit: true, layoutId: '1+2',
    position: { row: 0, col: 0, rowSpan: 2, colSpan: 2 },
    views: [{ id: 'v-1', type: 'volume', name: 'Main Volume' }, { id: 'v-2', type: 'slice', name: 'Axial' }, { id: 'v-3', type: 'data', name: 'Stats' }] },
  { id: 'vg-2', name: 'Tumor Review', color: '#fb7185', isExplicit: true, layoutId: '2x2',
    position: { row: 0, col: 2, rowSpan: 2, colSpan: 2 },
    views: [{ id: 'v-4', type: 'slice', name: 'Sagittal' }, { id: 'v-5', type: 'slice', name: 'Coronal' }, { id: 'v-6', type: 'volume', name: 'Overlay' }, { id: 'v-7', type: 'chart', name: 'Growth' }] },
  { id: 'vg-3', name: null, color: '#34d399', isExplicit: false, layoutId: 'single',
    position: { row: 2, col: 0, rowSpan: 1, colSpan: 1 },
    views: [{ id: 'v-8', type: 'notes', name: 'Session Notes' }] },
  { id: 'vg-4', name: 'Comparison', color: '#60a5fa', isExplicit: true, layoutId: 'side-by-side',
    position: { row: 2, col: 1, rowSpan: 1, colSpan: 2 },
    views: [{ id: 'v-9', type: 'slice', name: 'Pre-op' }, { id: 'v-10', type: 'slice', name: 'Post-op' }] },
  { id: 'vg-5', name: null, color: '#fbbf24', isExplicit: false, layoutId: 'single',
    position: { row: 2, col: 3, rowSpan: 1, colSpan: 1 },
    views: [{ id: 'v-11', type: 'chart', name: 'Timeline' }] },
  { id: 'vg-6', name: 'Reference Set', color: '#22d3ee', isExplicit: true, layoutId: '2x2',
    position: { row: 3, col: 0, rowSpan: 2, colSpan: 2 },
    views: [{ id: 'v-12', type: 'slice', name: 'Atlas A' }, { id: 'v-13', type: 'slice', name: 'Atlas B' }, { id: 'v-14', type: 'volume', name: 'Atlas 3D' }, { id: 'v-15', type: 'data', name: 'Atlas Data' }] },
  { id: 'vg-7', name: 'Measurements', color: '#a78bfa', isExplicit: true, layoutId: 'stacked',
    position: { row: 4, col: 3, rowSpan: 2, colSpan: 1 },
    views: [{ id: 'v-16', type: 'chart', name: 'Dimensions' }, { id: 'v-17', type: 'data', name: 'Values' }] },
];

const INACTIVE_VGS = [
  { id: 'vg-inactive-1', name: 'Old Comparison', color: '#a78bfa', isExplicit: true, layoutId: 'side-by-side', position: null, views: [{ id: 'vi-1', type: 'slice', name: 'Old Pre' }, { id: 'vi-2', type: 'slice', name: 'Old Post' }] },
];

const VG_LINKS = [
  { id: 'vgl-1', from: 'vg-1', to: 'vg-2', type: 'camera', mode: 'bidirectional' },
  { id: 'vgl-2', from: 'vg-1', to: 'vg-4', type: 'camera', mode: 'unidirectional' },
  { id: 'vgl-3', from: 'vg-6', to: 'vg-1', type: 'camera', mode: 'bidirectional' },
];

const VIEW_LINKS = [
  { id: 'vl-1', views: ['v-2', 'v-4', 'v-9'], type: 'windowLevel', mode: 'bidirectional' },
  { id: 'vl-2', views: ['v-1', 'v-6'], type: 'camera', mode: 'bidirectional' },
];

const VIEWPORTS = [
  { id: 'vp-1', name: 'Main', position: { row: 0, col: 0 }, size: { rows: 2, cols: 2 }, mode: 'snap', isPrimary: true },
  { id: 'vp-2', name: 'Detail', position: { row: 2, col: 1 }, size: { rows: 2, cols: 2 }, mode: 'free', isPrimary: false },
];

const COLLABORATORS = [
  { id: 'user-1', name: 'Dr. Sarah Chen', avatar: '👩‍⚕️', color: '#34d399', viewport: { row: 0, col: 2, rows: 2, cols: 2 }, cursor: { row: 1, col: 3 }, isBroadcasting: true, isOnline: true, showCursor: true },
  { id: 'user-2', name: 'Dr. James Wilson', avatar: '👨‍⚕️', color: '#fbbf24', viewport: { row: 2, col: 0, rows: 1, cols: 2 }, cursor: { row: 2, col: 1 }, isBroadcasting: false, isOnline: true, showCursor: true },
  { id: 'user-3', name: 'Resident Kim', avatar: '👨‍🎓', color: '#fb7185', viewport: { row: 4, col: 2, rows: 1, cols: 2 }, cursor: null, isBroadcasting: false, isOnline: true, showCursor: false },
  { id: 'user-4', name: 'Dr. Emily Park', avatar: '👩‍🔬', color: '#a78bfa', viewport: null, cursor: null, isBroadcasting: false, isOnline: true, showCursor: true },
  { id: 'user-5', name: 'Dr. Michael Torres', avatar: '👨‍⚕️', color: '#7dd3fc', viewport: { row: 3, col: 0, rows: 1, cols: 1 }, cursor: { row: 3, col: 1 }, isBroadcasting: true, isOnline: true, showCursor: true },
  { id: 'user-6', name: 'Dr. Lisa Wang', avatar: '👩‍⚕️', color: '#f87171', viewport: null, cursor: null, isBroadcasting: false, isOnline: false, showCursor: false },
];

const BOOKMARKS = [
  { id: 'bm-1', name: 'Pre-surgery baseline', position: { row: 0, col: 0 } },
  { id: 'bm-2', name: 'Tumor location', position: { row: 1, col: 2 } },
  { id: 'bm-3', name: 'Post-op comparison', position: { row: 2, col: 1 } },
  { id: 'bm-4', name: 'Reference atlas', position: { row: 3, col: 0 } },
];

const UNPLACED_VIEWS = [
  { id: 'uv-1', type: 'slice', name: 'Reference Atlas', vgId: null, vgName: null, vgColor: tokens.colors.text.muted },
  { id: 'uv-2', type: 'chart', name: 'Metrics Dashboard', vgId: null, vgName: null, vgColor: tokens.colors.text.muted },
];

const DATASETS = [
  { id: 'ds-1', name: 'patient_brain_mri.nii', type: 'NIfTI', size: '256 MB', icon: '🧠' },
  { id: 'ds-2', name: 'tumor_segmentation.nii', type: 'NIfTI', size: '64 MB', icon: '🎯' },
  { id: 'ds-3', name: 'measurements.csv', type: 'CSV', size: '2 KB', icon: '📊' },
];

// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================
/**
 * Convert column index to Excel-style letter.
 * 0 → 'A', 25 → 'Z', 26 → 'AA', etc.
 */
const colToLetter = (col) => {
  let result = '';
  let c = col;
  while (c >= 0) {
    result = String.fromCharCode((c % 26) + 65) + result;
    c = Math.floor(c / 26) - 1;
  }
  return result;
};

/**
 * Format cell position as Excel-style reference.
 * (row: 0, col: 0) → 'A1'
 */
const formatCellRef = (row, col) => `${colToLetter(col)}${row + 1}`;

/**
 * Format range as Excel-style reference.
 * (row: 0, col: 0, rowSpan: 2, colSpan: 2) → 'A1:B2'
 */
const formatRangeRef = (row, col, rowSpan, colSpan) => {
  const start = formatCellRef(row, col);
  if (rowSpan === 1 && colSpan === 1) return start;
  return `${start}:${formatCellRef(row + rowSpan - 1, col + colSpan - 1)}`;
};

/**
 * Get display name for ViewGroup.
 * Explicit VGs use their name.
 * Implicit VGs (single view) use the view's name.
 * Multi-view implicit VGs show "Group (N views)".
 */
const getVGDisplayName = (vg) => {
  if (vg.isExplicit && vg.name) return vg.name;
  if (vg.views.length === 1) return vg.views[0].name;
  return `Group (${vg.views.length} views)`;
};

// =============================================================================
// GLASSMORPHISM STYLE HELPERS
// =============================================================================
/**
 * Glass panel style - used for the main panel background.
 * Includes blur, saturation boost, and subtle inner glow.
 */
const glassPanel = {
  background: tokens.colors.glass.panel,
  backdropFilter: `${tokens.blur.medium} saturate(180%)`,
  WebkitBackdropFilter: `${tokens.blur.medium} saturate(180%)`,
  border: `1px solid ${tokens.colors.border.default}`,
  boxShadow: tokens.shadow.glassLg,
};

/**
 * Subtle glass style - used for interactive elements.
 */
const glassSubtle = {
  background: tokens.colors.glass.subtle,
  border: `1px solid ${tokens.colors.border.subtle}`,
};

// =============================================================================
// ATOMIC COMPONENTS
// =============================================================================

/**
 * ToolbarBtn - Small icon button for toolbars.
 * 
 * Features:
 * - 28x28px touch target
 * - Active state with color tint
 * - Disabled state with reduced opacity
 */
const ToolbarBtn = memo(({ icon: Icon, onClick, active, activeColor, title, size = 14, disabled, style }) => (
  <button
    onClick={onClick}
    title={title}
    disabled={disabled}
    style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      width: '28px',
      height: '28px',
      border: 'none',
      borderRadius: tokens.radius.sm,
      background: active ? `${activeColor || tokens.colors.accent.blue}20` : 'transparent',
      color: active ? (activeColor || tokens.colors.accent.blue) : tokens.colors.text.muted,
      cursor: disabled ? 'not-allowed' : 'pointer',
      opacity: disabled ? 0.4 : 1,
      transition: 'all 0.15s ease',
      flexShrink: 0,
      ...style,
    }}
  >
    <Icon size={size} />
  </button>
));

/**
 * Separator - Visual divider for toolbars.
 */
const Separator = ({ vertical = true }) => (
  <div style={{ 
    width: vertical ? '1px' : '100%', 
    height: vertical ? '16px' : '1px', 
    margin: vertical ? '0 4px' : '4px 0', 
    background: tokens.colors.border.default,
    flexShrink: 0,
  }} />
);

/**
 * Badge - Small count/status indicator.
 */
const Badge = ({ children, color = tokens.colors.accent.blue, variant = 'subtle' }) => (
  <span style={{
    padding: '1px 6px',
    borderRadius: '8px',
    fontSize: '9px',
    fontWeight: 600,
    background: variant === 'subtle' ? `${color}20` : color,
    color: variant === 'subtle' ? color : 'white',
  }}>
    {children}
  </span>
);

/**
 * SearchBar - Search input with icon.
 */
const SearchBar = ({ value, onChange, placeholder }) => (
  <div style={{
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    padding: '6px 10px',
    marginBottom: '8px',
    ...glassSubtle,
    borderRadius: tokens.radius.md,
  }}>
    <Search size={12} style={{ color: tokens.colors.text.muted, flexShrink: 0 }} />
    <input
      type="text"
      value={value || ''}
      onChange={(e) => onChange?.(e.target.value)}
      placeholder={placeholder}
      style={{
        flex: 1,
        border: 'none',
        background: 'transparent',
        color: tokens.colors.text.primary,
        fontSize: tokens.text.sm,
        outline: 'none',
        minWidth: 0,
      }}
    />
  </div>
);

/**
 * SectionHeader - Collapsible section title.
 */
const SectionHeader = ({ title, icon: Icon, color, count, action, collapsed, onToggle, style }) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px', ...style }}>
    {onToggle && (
      <button onClick={onToggle} style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', color: tokens.colors.text.muted, display: 'flex' }}>
        {collapsed ? <ChevronRight size={12} /> : <ChevronDown size={12} />}
      </button>
    )}
    {Icon && <Icon size={12} style={{ color: color || tokens.colors.text.muted }} />}
    <span style={{ fontSize: tokens.text.xs, fontWeight: 600, color: tokens.colors.text.muted, textTransform: 'uppercase', flex: 1 }}>{title}</span>
    {count !== undefined && <Badge color={color}>{count}</Badge>}
    {action}
  </div>
);

/**
 * FilterChip - Toggle filter button.
 */
const FilterChip = ({ label, count, active, onClick, color }) => (
  <button onClick={onClick} style={{
    display: 'flex', alignItems: 'center', gap: '4px', padding: '4px 8px', border: 'none', borderRadius: tokens.radius.sm,
    background: active ? (color || tokens.colors.accent.teal) : tokens.colors.glass.subtle,
    color: active ? 'white' : tokens.colors.text.muted, fontSize: tokens.text.xs, cursor: 'pointer', flexShrink: 0,
  }}>
    {label}
    {count !== undefined && <span style={{ opacity: 0.7 }}>{count}</span>}
  </button>
);

/**
 * ToggleGroup - Segmented button group.
 */
const ToggleGroup = ({ options, value, onChange }) => (
  <div style={{ display: 'flex', ...glassSubtle, borderRadius: tokens.radius.sm, padding: '2px' }}>
    {options.map(opt => (
      <button key={opt.id} onClick={() => onChange(opt.id)} style={{
        display: 'flex', alignItems: 'center', gap: '3px', padding: '4px 8px', border: 'none', borderRadius: '3px',
        background: value === opt.id ? (opt.color || tokens.colors.accent.teal) : 'transparent',
        color: value === opt.id ? 'white' : tokens.colors.text.muted, fontSize: '9px', fontWeight: 600, cursor: 'pointer',
      }}>
        {opt.icon && <opt.icon size={10} />}
        {opt.label}
        {opt.badge !== undefined && (
          <span style={{ padding: '0 4px', background: value === opt.id ? 'rgba(255,255,255,0.3)' : tokens.colors.glass.light, borderRadius: '6px' }}>{opt.badge}</span>
        )}
      </button>
    ))}
  </div>
);

/**
 * ToggleSwitch - On/off toggle.
 */
const ToggleSwitch = ({ checked, onChange, label, color = tokens.colors.accent.green }) => (
  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
    <div onClick={() => onChange(!checked)} style={{
      width: '32px', height: '18px', borderRadius: '9px',
      background: checked ? color : tokens.colors.glass.medium,
      border: `1px solid ${checked ? color : tokens.colors.border.default}`,
      position: 'relative', transition: 'all 0.15s ease',
    }}>
      <div style={{
        position: 'absolute', top: '2px', left: checked ? '16px' : '2px',
        width: '12px', height: '12px', borderRadius: '50%', background: 'white', transition: 'all 0.15s ease',
      }} />
    </div>
    {label && <span style={{ fontSize: tokens.text.sm, color: tokens.colors.text.secondary }}>{label}</span>}
  </label>
);

// =============================================================================
// LIST ITEM COMPONENTS
// =============================================================================

/**
 * LayoutMiniPreview - Tiny grid showing VG's internal layout.
 * Shows filled cells for views that exist.
 */
const LayoutMiniPreview = ({ layoutId, color, viewCount, size = 16 }) => {
  const layout = LAYOUTS[layoutId] || LAYOUTS.single;
  const cellSize = Math.floor((size - (layout.cols - 1)) / layout.cols);
  return (
    <div style={{ position: 'relative', width: size, height: size, flexShrink: 0 }}>
      {Array.from({ length: layout.cells }).map((_, i) => {
        const row = Math.floor(i / layout.cols);
        const col = i % layout.cols;
        return (
          <div key={i} style={{
            position: 'absolute', left: col * (cellSize + 1), top: row * (cellSize + 1),
            width: cellSize, height: cellSize, borderRadius: '1px',
            background: i < viewCount ? color : `${color}40`,
          }} />
        );
      })}
    </div>
  );
};

/**
 * VGListItem - ViewGroup in the contextual panel list.
 * Shows layout preview, name, position, view count.
 */
const VGListItem = ({ vg, displayName, isSelected, onClick, onDoubleClick, formatRangeRef, isInactive, isCompact }) => (
  <div onClick={onClick} onDoubleClick={onDoubleClick} draggable={!isInactive} style={{
    display: 'flex', alignItems: 'center', gap: '8px', padding: isCompact ? '6px' : '8px', marginBottom: '4px',
    background: isSelected ? `${vg.color}18` : tokens.colors.glass.subtle,
    border: `1px solid ${isSelected ? vg.color : 'transparent'}`, borderRadius: tokens.radius.md,
    cursor: isInactive ? 'default' : 'grab', opacity: isInactive ? 0.5 : 1, transition: 'all 0.15s ease',
  }}>
    <LayoutMiniPreview layoutId={vg.layoutId} color={vg.color} viewCount={vg.views.length} size={isCompact ? 14 : 18} />
    <span style={{ flex: 1, fontSize: tokens.text.sm, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{displayName}</span>
    {!isCompact && !isInactive && vg.position && (
      <span style={{ fontSize: '9px', color: tokens.colors.text.muted, fontFamily: 'monospace' }}>
        {formatRangeRef(vg.position.row, vg.position.col, vg.position.rowSpan, vg.position.colSpan)}
      </span>
    )}
    {!isCompact && !isInactive && <span style={{ fontSize: tokens.text.xs, color: tokens.colors.text.muted }}>{vg.views.length}v</span>}
    {!vg.isExplicit && !isInactive && !isCompact && <Badge color={tokens.colors.accent.amber}>implicit</Badge>}
    {isInactive && (
      <button onClick={(e) => e.stopPropagation()} style={{
        padding: '2px 6px', border: 'none', borderRadius: '3px',
        background: `${tokens.colors.accent.green}20`, color: tokens.colors.accent.green, fontSize: '9px', cursor: 'pointer',
      }}>Restore</button>
    )}
  </div>
);

/**
 * ViewListItem - Draggable view for companion panel.
 */
const ViewListItem = ({ view, isCompact, draggable = true }) => {
  const viewType = VIEW_TYPES[view.type];
  return (
    <div draggable={draggable} style={{
      display: 'flex', alignItems: 'center', gap: '8px', padding: isCompact ? '6px' : '8px', marginBottom: '4px',
      background: tokens.colors.glass.subtle, borderRadius: tokens.radius.md, cursor: draggable ? 'grab' : 'default',
      border: '1px solid transparent',
    }}>
      <span style={{ fontSize: isCompact ? '12px' : '14px' }}>{viewType?.icon}</span>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: tokens.text.sm, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{view.name}</div>
        {!isCompact && view.vgName && <div style={{ fontSize: tokens.text.xs, color: tokens.colors.text.muted }}>in {view.vgName}</div>}
      </div>
    </div>
  );
};

/**
 * DatasetItem - Draggable dataset for companion panel.
 */
const DatasetItem = ({ dataset, isCompact }) => (
  <div draggable style={{
    display: 'flex', alignItems: 'center', gap: '8px', padding: isCompact ? '6px' : '8px', marginBottom: '4px',
    background: tokens.colors.glass.subtle, borderRadius: tokens.radius.md, cursor: 'grab', border: '1px solid transparent',
  }}>
    <span style={{ fontSize: isCompact ? '12px' : '14px' }}>{dataset.icon}</span>
    <div style={{ flex: 1, minWidth: 0 }}>
      <div style={{ fontSize: tokens.text.sm, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{dataset.name}</div>
      {!isCompact && <div style={{ fontSize: tokens.text.xs, color: tokens.colors.text.muted }}>{dataset.type} • {dataset.size}</div>}
    </div>
  </div>
);

/**
 * BookmarkItem - Saved position in navigate mode.
 */
const BookmarkItem = ({ bookmark, formatCellRef, isCompact, onClick }) => (
  <div onClick={onClick} style={{
    display: 'flex', alignItems: 'center', gap: '8px', padding: isCompact ? '6px' : '8px', marginBottom: '4px',
    background: tokens.colors.glass.subtle, borderRadius: tokens.radius.md, cursor: 'pointer',
  }}>
    <Bookmark size={12} style={{ color: tokens.colors.accent.amber, flexShrink: 0 }} />
    <span style={{ flex: 1, fontSize: tokens.text.sm, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{bookmark.name}</span>
    {!isCompact && (
      <span style={{ fontSize: '9px', color: tokens.colors.accent.amber, fontFamily: 'monospace', padding: '2px 6px', background: `${tokens.colors.accent.amber}15`, borderRadius: '3px', flexShrink: 0 }}>
        {formatCellRef(bookmark.position.row, bookmark.position.col)}
      </span>
    )}
  </div>
);

/**
 * CollaboratorItem - Team member in Team mode.
 * Shows cursor toggle when in Team sub-tab.
 */
const CollaboratorItem = ({ collaborator, formatCellRef, isOffline, isCompact, showCursorToggle, onToggleCursor }) => (
  <div style={{
    display: 'flex', alignItems: 'center', gap: isCompact ? '8px' : '10px', padding: isCompact ? '8px' : '10px', marginBottom: '6px',
    background: tokens.colors.glass.subtle, border: `1px solid ${isOffline ? tokens.colors.border.subtle : `${collaborator.color}30`}`,
    borderRadius: tokens.radius.lg, opacity: isOffline ? 0.5 : 1,
  }}>
    <span style={{ fontSize: isCompact ? '14px' : '18px' }}>{collaborator.avatar}</span>
    <div style={{ flex: 1, minWidth: 0 }}>
      <div style={{ fontSize: tokens.text.sm, fontWeight: 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{collaborator.name}</div>
      {!isCompact && (
        <div style={{ fontSize: tokens.text.xs, color: tokens.colors.text.muted }}>
          {collaborator.viewport && formatCellRef ? (
            <>at <span style={{ fontFamily: 'monospace', color: collaborator.color }}>{formatCellRef(collaborator.viewport.row, collaborator.viewport.col)}</span></>
          ) : isOffline ? 'Last seen 2h ago' : 'No viewport open'}
        </div>
      )}
    </div>
    {/* CURSOR TOGGLE - Only shown in Team sub-tab */}
    {showCursorToggle && !isOffline && (
      <button onClick={() => onToggleCursor?.(collaborator.id)} title={collaborator.showCursor ? 'Hide cursor' : 'Show cursor'} style={{
        display: 'flex', alignItems: 'center', justifyContent: 'center', width: '24px', height: '24px', border: 'none', borderRadius: tokens.radius.sm,
        background: collaborator.showCursor ? `${collaborator.color}20` : 'transparent', color: collaborator.showCursor ? collaborator.color : tokens.colors.text.muted, cursor: 'pointer',
      }}>
        <MousePointer2 size={12} />
      </button>
    )}
    {collaborator.isBroadcasting && (
      <div style={{
        display: 'flex', alignItems: 'center', gap: '4px', padding: '4px 8px',
        background: `${tokens.colors.accent.red}20`, borderRadius: tokens.radius.sm, color: tokens.colors.accent.red, fontSize: tokens.text.xs, flexShrink: 0,
      }}>
        <Radio size={10} /> {!isCompact && 'Live'}
      </div>
    )}
    {!isOffline && !isCompact && (
      <button style={{
        padding: '5px 8px', border: 'none', borderRadius: tokens.radius.sm,
        background: `${collaborator.color}20`, color: collaborator.color, fontSize: tokens.text.xs, cursor: 'pointer', flexShrink: 0,
      }}>Follow</button>
    )}
  </div>
);

/**
 * ViewportItem - User's viewport in Team > Me.
 */
const ViewportItem = ({ viewport, isSelected, onClick, formatRangeRef, isCompact }) => (
  <div onClick={onClick} style={{
    display: 'flex', alignItems: 'center', gap: '8px', padding: '8px', marginBottom: '4px',
    background: isSelected ? `${tokens.colors.accent.teal}15` : tokens.colors.glass.subtle,
    border: `1px solid ${isSelected ? tokens.colors.accent.teal : 'transparent'}`, borderRadius: tokens.radius.md, cursor: 'pointer',
  }}>
    <div style={{ width: '18px', height: '12px', border: `2px ${viewport.mode === 'snap' ? 'solid' : 'dashed'} ${tokens.colors.accent.teal}`, borderRadius: '2px', flexShrink: 0 }} />
    <span style={{ flex: 1, fontSize: tokens.text.sm }}>{viewport.isPrimary && '★ '}{viewport.name}</span>
    {!isCompact && (
      <span style={{ fontSize: '9px', color: tokens.colors.accent.teal, fontFamily: 'monospace', fontWeight: 600 }}>
        {formatRangeRef(viewport.position.row, viewport.position.col, viewport.size.rows, viewport.size.cols)}
      </span>
    )}
  </div>
);

/**
 * LinkItem - VG or View link in Links mode.
 */
const LinkItem = ({ link, fromName, toName, fromColor, toColor, isHighlighted, onClick }) => (
  <div onClick={onClick} style={{
    display: 'flex', alignItems: 'center', gap: '8px', padding: '8px', marginBottom: '4px',
    background: isHighlighted ? `${tokens.colors.accent.purple}15` : tokens.colors.glass.subtle,
    border: `1px solid ${isHighlighted ? tokens.colors.accent.purple : 'transparent'}`, borderRadius: tokens.radius.md, cursor: 'pointer',
  }}>
    <div style={{ width: '8px', height: '8px', borderRadius: '2px', background: fromColor, flexShrink: 0 }} />
    <span style={{ fontSize: tokens.text.xs, color: tokens.colors.text.secondary, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{fromName}</span>
    <span style={{ color: tokens.colors.text.muted, flexShrink: 0 }}>{link.mode === 'bidirectional' ? '↔' : '→'}</span>
    <div style={{ width: '8px', height: '8px', borderRadius: '2px', background: toColor, flexShrink: 0 }} />
    <span style={{ fontSize: tokens.text.xs, color: tokens.colors.text.secondary, flex: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{toName}</span>
    <Badge color={tokens.colors.accent.purple}>{link.type}</Badge>
  </div>
);

// =============================================================================
// MINIMAP COMPONENTS
// =============================================================================

/**
 * VGBlock - ViewGroup rectangle on the minimap.
 * Shows name, internal layout (when enabled), selection state.
 * Ghosted when a link is highlighted and this VG isn't involved.
 */
const VGBlock = memo(({ vg, displayName, cellSize, isSelected, isGhosted, showInternals, onClick, onDoubleClick }) => {
  const gap = 4;
  const left = vg.position.col * (cellSize + gap);
  const top = vg.position.row * (cellSize + gap);
  const width = vg.position.colSpan * cellSize + (vg.position.colSpan - 1) * gap;
  const height = vg.position.rowSpan * cellSize + (vg.position.rowSpan - 1) * gap;
  
  return (
    <div onClick={onClick} onDoubleClick={onDoubleClick} style={{
      position: 'absolute', left, top, width, height,
      background: `${vg.color}${isGhosted ? '08' : isSelected ? '30' : '18'}`,
      border: `2px ${vg.isExplicit ? 'solid' : 'dashed'} ${vg.color}${isGhosted ? '30' : isSelected ? '' : '80'}`,
      borderRadius: tokens.radius.md, cursor: 'pointer', opacity: isGhosted ? 0.4 : 1,
      boxShadow: isSelected ? `0 0 12px ${vg.color}50` : 'none', transition: 'all 0.15s ease',
      display: 'flex', flexDirection: 'column', padding: '4px', overflow: 'hidden',
    }}>
      <span style={{ fontSize: cellSize > 40 ? '10px' : '8px', fontWeight: 600, color: vg.color, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
        {displayName}
      </span>
      {/* INTERNAL LAYOUT PREVIEW - Only in Layout mode with showInternals */}
      {showInternals && cellSize > 35 && (
        <div style={{
          flex: 1, display: 'grid',
          gridTemplateColumns: `repeat(${LAYOUTS[vg.layoutId]?.cols || 1}, 1fr)`,
          gridTemplateRows: `repeat(${LAYOUTS[vg.layoutId]?.rows || 1}, 1fr)`,
          gap: '2px', marginTop: '2px',
        }}>
          {vg.views.map((view) => (
            <div key={view.id} style={{
              background: `${vg.color}30`, borderRadius: '2px',
              display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '8px',
            }}>
              {VIEW_TYPES[view.type]?.icon}
            </div>
          ))}
        </div>
      )}
    </div>
  );
});

/**
 * ViewportIndicator - User's viewport rectangle on minimap.
 * Solid border for snap mode, dashed for free mode.
 */
const ViewportIndicator = memo(({ viewport, cellSize }) => {
  const gap = 4;
  const left = viewport.position.col * (cellSize + gap);
  const top = viewport.position.row * (cellSize + gap);
  const width = viewport.size.cols * cellSize + (viewport.size.cols - 1) * gap;
  const height = viewport.size.rows * cellSize + (viewport.size.rows - 1) * gap;
  
  return (
    <div style={{
      position: 'absolute', left, top, width, height,
      border: `2px ${viewport.mode === 'snap' ? 'solid' : 'dashed'} ${tokens.colors.accent.teal}`,
      borderRadius: tokens.radius.md, background: `${tokens.colors.accent.teal}08`, pointerEvents: 'none', zIndex: 15,
    }}>
      <div style={{
        position: 'absolute', top: '3px', left: '3px', padding: '2px 5px',
        background: tokens.colors.accent.teal, borderRadius: '3px', fontSize: '8px', fontWeight: 600, color: 'white',
      }}>
        {viewport.isPrimary && '★ '}{viewport.name}
      </div>
    </div>
  );
});

/**
 * CollaboratorIndicator - Collaborator's viewport on minimap.
 * Shows avatar and name (in Team mode), broadcasting indicator.
 */
const CollaboratorIndicator = memo(({ collaborator, cellSize, showName }) => {
  if (!collaborator.viewport) return null;
  const gap = 4;
  const left = collaborator.viewport.col * (cellSize + gap);
  const top = collaborator.viewport.row * (cellSize + gap);
  const width = collaborator.viewport.cols * cellSize + (collaborator.viewport.cols - 1) * gap;
  const height = collaborator.viewport.rows * cellSize + (collaborator.viewport.rows - 1) * gap;
  
  return (
    <div style={{
      position: 'absolute', left, top, width, height,
      border: `2px dashed ${collaborator.color}`, borderRadius: tokens.radius.md,
      background: `${collaborator.color}08`, pointerEvents: 'none', zIndex: 10,
    }}>
      <div style={{ position: 'absolute', top: '-8px', right: '4px', fontSize: showName ? '10px' : '12px', display: 'flex', alignItems: 'center', gap: '3px' }}>
        <span>{collaborator.avatar}</span>
        {showName && <span style={{ color: collaborator.color, fontSize: '9px', fontWeight: 500 }}>{collaborator.name.split(' ')[0]}</span>}
        {collaborator.isBroadcasting && <Radio size={8} style={{ color: tokens.colors.accent.red }} />}
      </div>
    </div>
  );
});

/**
 * CursorIndicator - Collaborator's cursor position on minimap.
 * Only shown when showCursor is true for that collaborator.
 */
const CursorIndicator = memo(({ collaborator, cellSize }) => {
  if (!collaborator.cursor || !collaborator.showCursor) return null;
  const gap = 4;
  const left = collaborator.cursor.col * (cellSize + gap) + cellSize / 2;
  const top = collaborator.cursor.row * (cellSize + gap) + cellSize / 2;
  
  return (
    <div style={{ position: 'absolute', left: left - 6, top: top - 6, pointerEvents: 'none', zIndex: 20 }}>
      <MousePointer2 size={12} style={{ color: collaborator.color, filter: `drop-shadow(0 0 2px ${collaborator.color})` }} />
    </div>
  );
});

// =============================================================================
// SIDE QUICK NAV TOOLBAR
// =============================================================================
/**
 * QuickNavToolbar - ALWAYS VISIBLE side toolbar with navigation shortcuts.
 * 
 * This is a KEY DESIGN DECISION: Quick nav is needed in ALL modes, not just Navigate.
 * Placing it on the side keeps it accessible without consuming contextual panel space.
 * 
 * User preference determines left/right placement (handedness).
 */
const QuickNavToolbar = ({ position = 'left', onGoHome, onSetHome, onFitAll, onAddBookmark }) => {
  const isLeft = position === 'left';
  return (
    <div style={{
      display: 'flex', flexDirection: 'column', gap: '4px', padding: '4px',
      background: tokens.colors.glass.subtle, borderRadius: tokens.radius.md, border: `1px solid ${tokens.colors.border.subtle}`,
      [isLeft ? 'marginRight' : 'marginLeft']: '8px',
    }}>
      <ToolbarBtn icon={Home} title="Go Home (H)" size={14} onClick={onGoHome} />
      <ToolbarBtn icon={Crosshair} title="Set Home Here" size={14} onClick={onSetHome} />
      <ToolbarBtn icon={Scan} title="Fit All (F)" size={14} onClick={onFitAll} />
      <Separator vertical={false} />
      <ToolbarBtn icon={BookmarkPlus} title="Add Bookmark (B)" size={14} activeColor={tokens.colors.accent.amber} onClick={onAddBookmark} />
    </div>
  );
};

// =============================================================================
// COMPANION PANEL (Views & Datasets)
// =============================================================================
/**
 * CompanionPanel - Collapsible side panel for drag-drop content.
 * 
 * Shows either Views or Datasets tab. Items can be dragged to minimap.
 * 
 * Purpose separation:
 * - Contextual panel = Managing what's ON canvas
 * - Companion panel = Adding NEW things to canvas
 */
const CompanionPanel = ({ isCompact }) => {
  const [activeSection, setActiveSection] = useState('views');
  const [searchQuery, setSearchQuery] = useState('');
  
  const filteredViews = UNPLACED_VIEWS.filter(v => v.name.toLowerCase().includes(searchQuery.toLowerCase()));
  const filteredDatasets = DATASETS.filter(d => d.name.toLowerCase().includes(searchQuery.toLowerCase()));
  
  return (
    <div style={{
      width: isCompact ? COMPANION_WIDTH.compact : COMPANION_WIDTH.standard,
      borderLeft: `1px solid ${tokens.colors.border.subtle}`,
      background: tokens.colors.bg.tertiary,
      display: 'flex', flexDirection: 'column', overflow: 'hidden', flexShrink: 0,
    }}>
      {/* Section tabs */}
      <div style={{ display: 'flex', borderBottom: `1px solid ${tokens.colors.border.subtle}` }}>
        <button onClick={() => setActiveSection('views')} style={{
          flex: 1, padding: '8px 4px', border: 'none', background: 'transparent',
          borderBottom: activeSection === 'views' ? `2px solid ${tokens.colors.accent.blue}` : '2px solid transparent',
          color: activeSection === 'views' ? tokens.colors.accent.blue : tokens.colors.text.muted,
          fontSize: tokens.text.xs, fontWeight: 500, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px',
        }}>
          <Eye size={12} />{!isCompact && 'Views'}
        </button>
        <button onClick={() => setActiveSection('datasets')} style={{
          flex: 1, padding: '8px 4px', border: 'none', background: 'transparent',
          borderBottom: activeSection === 'datasets' ? `2px solid ${tokens.colors.accent.teal}` : '2px solid transparent',
          color: activeSection === 'datasets' ? tokens.colors.accent.teal : tokens.colors.text.muted,
          fontSize: tokens.text.xs, fontWeight: 500, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px',
        }}>
          <Database size={12} />{!isCompact && 'Data'}
        </button>
      </div>
      
      {/* Content */}
      <div style={{ flex: 1, overflow: 'auto', padding: '8px' }}>
        <SearchBar value={searchQuery} onChange={setSearchQuery} placeholder="Search..." />
        <p style={{ fontSize: '9px', color: tokens.colors.text.muted, marginBottom: '8px' }}>Drag to minimap</p>
        {activeSection === 'views' ? (
          filteredViews.length > 0 ? filteredViews.map(view => <ViewListItem key={view.id} view={view} isCompact={isCompact} />)
          : <div style={{ padding: '12px', textAlign: 'center', color: tokens.colors.text.muted, fontSize: tokens.text.xs }}>All views placed</div>
        ) : (
          filteredDatasets.map(ds => <DatasetItem key={ds.id} dataset={ds} isCompact={isCompact} />)
        )}
      </div>
    </div>
  );
};

// =============================================================================
// PANNABLE MINIMAP CONTAINER
// =============================================================================
/**
 * PannableMinimap - Container with drag-to-pan when content exceeds viewport.
 * 
 * CRITICAL: This enables navigation on large canvases or when zoomed in.
 * 
 * Features:
 * - Drag to pan (mouse down + move)
 * - Edge fade indicators show when more content exists
 * - "Drag to pan" hint when panning is available
 * - Respects bounds (can't pan past edges)
 */
const PannableMinimap = ({ children, width, height, contentWidth, contentHeight }) => {
  const [isPanning, setIsPanning] = useState(false);
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });
  const [startPan, setStartPan] = useState({ x: 0, y: 0 });
  
  // Can we pan? Only if content exceeds container
  const canPan = contentWidth > width || contentHeight > height;
  const maxPanX = Math.max(0, contentWidth - width + 40);
  const maxPanY = Math.max(0, contentHeight - height + 40);
  
  const handleMouseDown = (e) => {
    if (!canPan) return;
    setIsPanning(true);
    setStartPan({ x: e.clientX - panOffset.x, y: e.clientY - panOffset.y });
  };
  
  const handleMouseMove = (e) => {
    if (!isPanning) return;
    const newX = Math.max(-maxPanX, Math.min(0, e.clientX - startPan.x));
    const newY = Math.max(-maxPanY, Math.min(0, e.clientY - startPan.y));
    setPanOffset({ x: newX, y: newY });
  };
  
  const handleMouseUp = () => setIsPanning(false);
  
  useEffect(() => {
    if (isPanning) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isPanning, startPan]);
  
  // Edge indicators - show gradient when content extends beyond view
  const showLeftEdge = panOffset.x < 0;
  const showRightEdge = panOffset.x > -maxPanX && maxPanX > 0;
  const showTopEdge = panOffset.y < 0;
  const showBottomEdge = panOffset.y > -maxPanY && maxPanY > 0;
  
  return (
    <div onMouseDown={handleMouseDown} style={{
      position: 'relative', width, height, overflow: 'hidden',
      cursor: canPan ? (isPanning ? 'grabbing' : 'grab') : 'default',
    }}>
      <div style={{
        transform: `translate(${panOffset.x}px, ${panOffset.y}px)`,
        transition: isPanning ? 'none' : 'transform 0.15s ease',
      }}>
        {children}
      </div>
      
      {/* Edge fade indicators */}
      {showLeftEdge && <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: '20px', background: `linear-gradient(to right, ${tokens.colors.bg.canvas}, transparent)`, pointerEvents: 'none' }} />}
      {showRightEdge && <div style={{ position: 'absolute', right: 0, top: 0, bottom: 0, width: '20px', background: `linear-gradient(to left, ${tokens.colors.bg.canvas}, transparent)`, pointerEvents: 'none' }} />}
      {showTopEdge && <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '20px', background: `linear-gradient(to bottom, ${tokens.colors.bg.canvas}, transparent)`, pointerEvents: 'none' }} />}
      {showBottomEdge && <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '20px', background: `linear-gradient(to top, ${tokens.colors.bg.canvas}, transparent)`, pointerEvents: 'none' }} />}
      
      {/* Pan hint */}
      {canPan && (
        <div style={{
          position: 'absolute', bottom: '4px', right: '4px', padding: '2px 6px',
          background: tokens.colors.glass.medium, borderRadius: tokens.radius.sm,
          fontSize: '9px', color: tokens.colors.text.muted, display: 'flex', alignItems: 'center', gap: '4px',
        }}>
          <Move size={10} /> Drag to pan
        </div>
      )}
    </div>
  );
};

// =============================================================================
// MAIN COMPONENT
// =============================================================================
/**
 * CanvasMapV2Reference - Complete reference implementation.
 * 
 * This component demonstrates the full Canvas Map V2 design with all features.
 * Use the width/height sliders to test responsive behavior.
 */
const CanvasMapV2Reference = () => {
  // =========================================================================
  // PANEL DIMENSIONS - Controlled for demo, would come from PanelShell
  // =========================================================================
  const [panelWidth, setPanelWidth] = useState(400);
  const [panelHeight, setPanelHeight] = useState(620);
  
  // =========================================================================
  // USER PREFERENCES - Would be persisted
  // =========================================================================
  const [toolbarPosition, setToolbarPosition] = useState('left'); // 'left' | 'right'
  const [companionOpen, setCompanionOpen] = useState(false);
  
  // =========================================================================
  // SIZE MODE - Computed from effective width
  // =========================================================================
  const companionWidth = companionOpen ? (panelWidth < SIZE_MODE_BREAKPOINTS.compact + COMPANION_WIDTH.standard ? COMPANION_WIDTH.compact : COMPANION_WIDTH.standard) : 0;
  const effectiveWidth = panelWidth - companionWidth;
  
  const sizeMode = useMemo(() => {
    if (effectiveWidth < SIZE_MODE_BREAKPOINTS.compact) return 'compact';
    if (effectiveWidth >= SIZE_MODE_BREAKPOINTS.expanded) return 'expanded';
    return 'standard';
  }, [effectiveWidth]);
  
  const isCompact = sizeMode === 'compact';

  // =========================================================================
  // CORE STATE
  // =========================================================================
  const [mapMode, setMapMode] = useState('navigate');
  const [displayMode, setDisplayMode] = useState('vg'); // 'vg' | 'view'
  const [minimapZoom, setMinimapZoom] = useState(100);
  const [showGridLabels, setShowGridLabels] = useState(true);
  const [showViewports, setShowViewports] = useState(true);
  const [showCollaborators, setShowCollaborators] = useState(true);
  const [showCursors, setShowCursors] = useState(true);
  const [showInternals, setShowInternals] = useState(true);
  const [linksSubTab, setLinksSubTab] = useState('vg'); // 'vg' | 'view'
  const [teamSubTab, setTeamSubTab] = useState('me');   // 'me' | 'team'
  
  // Team > Me settings
  const [myBroadcasting, setMyBroadcasting] = useState(false);
  const [myCursorColor, setMyCursorColor] = useState(tokens.colors.accent.cyan);
  const [myCursorVisible, setMyCursorVisible] = useState(true);
  
  // Selection
  const [selectedVGId, setSelectedVGId] = useState(null);
  const [selectedViewportId, setSelectedViewportId] = useState('vp-1');
  const [highlightedLinkId, setHighlightedLinkId] = useState(null);
  const [focusedVGId, setFocusedVGId] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Collaborator cursor visibility (local state, not shared)
  const [collaboratorCursors, setCollaboratorCursors] = useState(
    Object.fromEntries(COLLABORATORS.map(c => [c.id, c.showCursor]))
  );
  
  // Section collapse
  const [inactiveCollapsed, setInactiveCollapsed] = useState(true);
  
  // =========================================================================
  // DERIVED VALUES
  // =========================================================================
  const focusedVG = VIEWGROUPS.find(vg => vg.id === focusedVGId);
  const currentMode = MAP_MODES[mapMode];
  const onlineCount = COLLABORATORS.filter(c => c.isOnline).length;

  // Cell size calculation - RESPONSIVE to panel width
  const sideToolbarWidth = 40;
  const minimapCellSize = useMemo(() => {
    const labelsWidth = showGridLabels ? 24 : 0;
    const padding = 32;
    const availableWidth = panelWidth - labelsWidth - padding - sideToolbarWidth - companionWidth;
    const cols = focusedVGId ? (focusedVG?.position?.colSpan || 2) : CANVAS.cols;
    const gap = 4;
    const fitSize = Math.floor((availableWidth - (cols - 1) * gap) / cols);
    // Clamp between min and max, then apply zoom
    const baseSize = Math.min(55, Math.max(20, fitSize));
    return Math.floor(baseSize * (minimapZoom / 100));
  }, [panelWidth, minimapZoom, focusedVGId, focusedVG, showGridLabels, companionWidth]);

  // Collaborators with local cursor state
  const collaboratorsWithCursorState = COLLABORATORS.map(c => ({
    ...c,
    showCursor: collaboratorCursors[c.id] ?? c.showCursor,
  }));

  // Filter items
  const filteredVGs = VIEWGROUPS.filter(vg => getVGDisplayName(vg).toLowerCase().includes(searchQuery.toLowerCase()));
  const filteredBookmarks = BOOKMARKS.filter(bm => bm.name.toLowerCase().includes(searchQuery.toLowerCase()));

  // =========================================================================
  // HANDLERS
  // =========================================================================
  const handleModeChange = (mode) => { setMapMode(mode); setHighlightedLinkId(null); setSearchQuery(''); };
  const handleVGClick = (vgId) => setSelectedVGId(vgId);
  const handleVGDoubleClick = (vgId) => { setFocusedVGId(vgId); setMapMode('layout'); };
  const handleBackFromFocus = () => setFocusedVGId(null);
  const handleLinkClick = (linkId) => setHighlightedLinkId(highlightedLinkId === linkId ? null : linkId);
  const handleToggleCollaboratorCursor = (collabId) => setCollaboratorCursors(prev => ({ ...prev, [collabId]: !prev[collabId] }));

  // VG center for link lines
  const getVGCenter = (vgId) => {
    const vg = VIEWGROUPS.find(v => v.id === vgId);
    if (!vg) return null;
    const gap = 4;
    return {
      x: (vg.position.col + vg.position.colSpan / 2) * (minimapCellSize + gap),
      y: (vg.position.row + vg.position.rowSpan / 2) * (minimapCellSize + gap),
    };
  };

  // =========================================================================
  // LAYOUT CALCULATIONS
  // =========================================================================
  const headerHeight = 40;
  const toolbarHeight = 40;
  const footerHeight = 32;
  const chromeHeight = headerHeight + toolbarHeight + footerHeight;
  const contentHeight = panelHeight - chromeHeight;
  // IMPORTANT: Minimap takes ~55% of content area, contextual panel gets the rest
  const minimapHeight = Math.max(150, Math.floor(contentHeight * 0.55));

  // Minimap content size (for panning)
  const gap = 4;
  const gridContentWidth = CANVAS.cols * minimapCellSize + (CANVAS.cols - 1) * gap + (showGridLabels ? 24 : 0) + 20;
  const gridContentHeight = CANVAS.rows * minimapCellSize + (CANVAS.rows - 1) * gap + (showGridLabels ? 20 : 0) + 20;
  const minimapAreaWidth = panelWidth - sideToolbarWidth - companionWidth - 16;
  
  // =========================================================================
  // RENDER
  // =========================================================================
  return (
    <div style={{
      minHeight: '100vh', background: tokens.colors.bg.base, color: tokens.colors.text.primary,
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif', padding: '24px',
    }}>
      {/* Demo Header */}
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '20px', fontWeight: 600, marginBottom: '8px' }}>Canvas Map V2 - Reference Implementation</h1>
        <p style={{ fontSize: tokens.text.md, color: tokens.colors.text.secondary }}>
          Side toolbar • Companion panel • Team cursors • Minimap panning • Responsive sizing
        </p>
      </div>

      {/* Demo Controls */}
      <div style={{ display: 'flex', gap: '16px', marginBottom: '24px', alignItems: 'center', flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: tokens.text.sm, color: tokens.colors.text.muted }}>Width:</span>
          <input type="range" min="320" max="600" value={panelWidth} onChange={(e) => setPanelWidth(Number(e.target.value))} style={{ width: '120px' }} />
          <span style={{ fontSize: tokens.text.sm, fontFamily: 'monospace' }}>{panelWidth}px</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: tokens.text.sm, color: tokens.colors.text.muted }}>Height:</span>
          <input type="range" min="450" max="800" value={panelHeight} onChange={(e) => setPanelHeight(Number(e.target.value))} style={{ width: '120px' }} />
          <span style={{ fontSize: tokens.text.sm, fontFamily: 'monospace' }}>{panelHeight}px</span>
        </div>
        <Badge color={sizeMode === 'compact' ? tokens.colors.accent.red : sizeMode === 'expanded' ? tokens.colors.accent.green : tokens.colors.accent.blue}>
          {sizeMode.toUpperCase()}
        </Badge>
        <Separator />
        <ToggleGroup options={[{ id: 'left', label: 'Left' }, { id: 'right', label: 'Right' }]} value={toolbarPosition} onChange={setToolbarPosition} />
        <ToggleSwitch checked={companionOpen} onChange={setCompanionOpen} label="Companion" />
      </div>

      {/* ===================================================================== */}
      {/* PANEL - This is what gets wrapped in PanelShell in production */}
      {/* ===================================================================== */}
      <div style={{ width: panelWidth, height: panelHeight, ...glassPanel, borderRadius: tokens.radius.xl, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
        
        {/* BREADCRUMB - When focused on a VG */}
        {focusedVGId && focusedVG && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 12px', background: `${focusedVG.color}12`, borderBottom: `1px solid ${focusedVG.color}30` }}>
            <button onClick={handleBackFromFocus} style={{ display: 'flex', alignItems: 'center', gap: '4px', padding: '4px 8px', border: 'none', borderRadius: tokens.radius.sm, background: tokens.colors.glass.subtle, color: tokens.colors.text.secondary, fontSize: tokens.text.sm, cursor: 'pointer' }}>
              <ChevronLeft size={14} /> Canvas
            </button>
            <ChevronRight size={14} style={{ color: tokens.colors.text.muted }} />
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <div style={{ width: '10px', height: '10px', borderRadius: '3px', background: focusedVG.color }} />
              <span style={{ fontWeight: 600, color: focusedVG.color }}>{getVGDisplayName(focusedVG)}</span>
            </div>
          </div>
        )}

        {/* MODE TABS */}
        <div style={{ display: 'flex', background: tokens.colors.glass.light, borderBottom: `1px solid ${tokens.colors.border.subtle}`, height: headerHeight, flexShrink: 0 }}>
          {Object.values(MAP_MODES).map(mode => (
            <button key={mode.id} onClick={() => handleModeChange(mode.id)} title={mode.description} style={{
              flex: 1, padding: isCompact ? '8px 4px' : '10px 6px', border: 'none',
              background: mapMode === mode.id ? tokens.colors.bg.secondary : 'transparent',
              borderBottom: mapMode === mode.id ? `2px solid ${mode.color}` : '2px solid transparent',
              color: mapMode === mode.id ? mode.color : tokens.colors.text.muted,
              fontSize: tokens.text.sm, fontWeight: 500, cursor: 'pointer',
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '3px', transition: 'all 0.15s ease',
            }}>
              <mode.icon size={isCompact ? 14 : 16} />
              {!isCompact && mode.name}
            </button>
          ))}
        </div>

        {/* TOOLBAR */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', padding: '6px 8px', borderBottom: `1px solid ${tokens.colors.border.subtle}`, background: tokens.colors.glass.subtle, height: toolbarHeight, flexShrink: 0 }}>
          <ToolbarBtn icon={ZoomOut} onClick={() => setMinimapZoom(z => Math.max(50, z - 25))} title="Zoom out" />
          <span style={{ fontSize: '9px', color: tokens.colors.text.muted, minWidth: '28px', textAlign: 'center' }}>{minimapZoom}%</span>
          <ToolbarBtn icon={ZoomIn} onClick={() => setMinimapZoom(z => Math.min(200, z + 25))} title="Zoom in" />
          {!isCompact && (
            <>
              <Separator />
              <ToolbarBtn icon={Hash} active={showGridLabels} onClick={() => setShowGridLabels(!showGridLabels)} title="Grid labels" activeColor={tokens.colors.accent.purple} />
              <ToggleGroup options={[{ id: 'vg', label: 'VG', icon: Package, color: tokens.colors.accent.green }, { id: 'view', label: 'View', icon: Layers, color: tokens.colors.accent.teal }]} value={displayMode} onChange={setDisplayMode} />
            </>
          )}
          <Separator />
          {/* Mode-specific toolbar controls */}
          {mapMode === 'navigate' && !isCompact && (
            <>
              <ToolbarBtn icon={Eye} active={showViewports} onClick={() => setShowViewports(!showViewports)} title="Viewports" activeColor={tokens.colors.accent.teal} />
              <ToolbarBtn icon={Users} active={showCollaborators} onClick={() => setShowCollaborators(!showCollaborators)} title="Collaborators" activeColor={tokens.colors.accent.amber} />
            </>
          )}
          {mapMode === 'layout' && !isCompact && (
            <>
              <ToolbarBtn icon={Layers} active={showInternals} onClick={() => setShowInternals(!showInternals)} title="Show internals" activeColor={tokens.colors.accent.green} />
              <ToolbarBtn icon={Plus} title="Add VG" />
            </>
          )}
          {mapMode === 'links' && <ToggleGroup options={[{ id: 'vg', label: 'VG', color: tokens.colors.accent.purple }, { id: 'view', label: 'View', color: tokens.colors.accent.blue }]} value={linksSubTab} onChange={setLinksSubTab} />}
          {mapMode === 'team' && <ToggleGroup options={[{ id: 'me', label: 'Me', color: tokens.colors.accent.teal }, { id: 'team', label: 'Team', badge: onlineCount, color: tokens.colors.accent.amber }]} value={teamSubTab} onChange={setTeamSubTab} />}
          <div style={{ flex: 1 }} />
          <ToolbarBtn icon={companionOpen ? PanelRightClose : PanelRightOpen} active={companionOpen} onClick={() => setCompanionOpen(!companionOpen)} title="Views & Datasets" activeColor={tokens.colors.accent.teal} />
          {isCompact && <ToolbarBtn icon={MoreHorizontal} title="More options" />}
        </div>

        {/* MINIMAP AREA */}
        <div style={{ display: 'flex', height: minimapHeight, flexShrink: 0 }}>
          {/* SIDE QUICK NAV - LEFT */}
          {toolbarPosition === 'left' && (
            <div style={{ padding: '8px 0 8px 8px', display: 'flex', alignItems: 'flex-start' }}>
              <QuickNavToolbar position="left" />
            </div>
          )}
          
          {/* MINIMAP with panning */}
          <div style={{ flex: 1, background: tokens.colors.bg.canvas, position: 'relative', overflow: 'hidden' }}>
            <PannableMinimap width={minimapAreaWidth} height={minimapHeight - 16} contentWidth={gridContentWidth} contentHeight={gridContentHeight}>
              <div style={{ padding: '8px' }}>
                {/* Link lines SVG overlay */}
                {mapMode === 'links' && linksSubTab === 'vg' && displayMode === 'vg' && (
                  <svg style={{ position: 'absolute', top: showGridLabels ? 28 : 8, left: showGridLabels ? 32 : 8, width: CANVAS.cols * (minimapCellSize + 4), height: CANVAS.rows * (minimapCellSize + 4), pointerEvents: 'none', zIndex: 100 }}>
                    {VG_LINKS.map(link => {
                      const from = getVGCenter(link.from);
                      const to = getVGCenter(link.to);
                      if (!from || !to) return null;
                      const isHighlighted = highlightedLinkId === link.id;
                      const linkColor = link.type === 'camera' ? tokens.colors.accent.teal : tokens.colors.accent.purple;
                      return (
                        <g key={link.id} style={{ cursor: 'pointer' }} onClick={() => handleLinkClick(link.id)}>
                          <line x1={from.x} y1={from.y} x2={to.x} y2={to.y} stroke={linkColor} strokeWidth={isHighlighted ? 4 : 2} strokeOpacity={isHighlighted ? 1 : 0.5} strokeDasharray={link.mode === 'unidirectional' ? '6,4' : 'none'} style={{ filter: isHighlighted ? `drop-shadow(0 0 6px ${linkColor})` : 'none' }} />
                          {link.mode === 'unidirectional' && <circle cx={to.x} cy={to.y} r={5} fill={linkColor} opacity={isHighlighted ? 1 : 0.5} />}
                        </g>
                      );
                    })}
                  </svg>
                )}

                {/* Grid with labels */}
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  {showGridLabels && (
                    <div style={{ display: 'flex', marginLeft: '24px', marginBottom: '2px' }}>
                      {Array.from({ length: CANVAS.cols }).map((_, col) => (
                        <div key={col} style={{ width: minimapCellSize, marginRight: '4px', textAlign: 'center', fontSize: minimapCellSize > 40 ? '10px' : '8px', fontWeight: 600, color: tokens.colors.text.muted, fontFamily: 'monospace' }}>{colToLetter(col)}</div>
                      ))}
                    </div>
                  )}
                  <div style={{ display: 'flex' }}>
                    {showGridLabels && (
                      <div style={{ display: 'flex', flexDirection: 'column', marginRight: '2px' }}>
                        {Array.from({ length: CANVAS.rows }).map((_, row) => (
                          <div key={row} style={{ height: minimapCellSize, marginBottom: '4px', display: 'flex', alignItems: 'center', justifyContent: 'flex-end', paddingRight: '4px', fontSize: minimapCellSize > 40 ? '10px' : '8px', fontWeight: 600, color: tokens.colors.text.muted, fontFamily: 'monospace', minWidth: '20px' }}>{row + 1}</div>
                        ))}
                      </div>
                    )}
                    <div style={{ position: 'relative' }}>
                      {/* Background grid cells */}
                      <div style={{ display: 'grid', gridTemplateColumns: `repeat(${CANVAS.cols}, ${minimapCellSize}px)`, gridTemplateRows: `repeat(${CANVAS.rows}, ${minimapCellSize}px)`, gap: '4px' }}>
                        {Array.from({ length: CANVAS.rows * CANVAS.cols }).map((_, i) => (
                          <div key={i} style={{ background: tokens.colors.bg.canvasCell, borderRadius: tokens.radius.sm, border: `1px solid ${tokens.colors.border.subtle}` }} />
                        ))}
                      </div>
                      {/* VG Blocks */}
                      {displayMode === 'vg' && VIEWGROUPS.map(vg => {
                        const isInLink = highlightedLinkId && VG_LINKS.find(l => l.id === highlightedLinkId && (l.from === vg.id || l.to === vg.id));
                        const isGhosted = mapMode === 'links' && highlightedLinkId && !isInLink;
                        return <VGBlock key={vg.id} vg={vg} displayName={getVGDisplayName(vg)} cellSize={minimapCellSize} isSelected={selectedVGId === vg.id} isGhosted={isGhosted} showInternals={mapMode === 'layout' && showInternals} onClick={() => handleVGClick(vg.id)} onDoubleClick={() => handleVGDoubleClick(vg.id)} />;
                      })}
                      {/* Viewports */}
                      {showViewports && (mapMode === 'navigate' || mapMode === 'layout' || mapMode === 'team') && VIEWPORTS.map(vp => <ViewportIndicator key={vp.id} viewport={vp} cellSize={minimapCellSize} />)}
                      {/* Collaborators */}
                      {showCollaborators && (mapMode === 'navigate' || mapMode === 'team') && collaboratorsWithCursorState.filter(c => c.isOnline && c.viewport).map(c => <CollaboratorIndicator key={c.id} collaborator={c} cellSize={minimapCellSize} showName={mapMode === 'team'} />)}
                      {/* Cursors (Team mode only) */}
                      {showCursors && mapMode === 'team' && collaboratorsWithCursorState.filter(c => c.isOnline && c.cursor && c.showCursor).map(c => <CursorIndicator key={`cursor-${c.id}`} collaborator={c} cellSize={minimapCellSize} />)}
                    </div>
                  </div>
                </div>
              </div>
            </PannableMinimap>
          </div>
          
          {/* SIDE QUICK NAV - RIGHT */}
          {toolbarPosition === 'right' && (
            <div style={{ padding: '8px 8px 8px 0', display: 'flex', alignItems: 'flex-start' }}>
              <QuickNavToolbar position="right" />
            </div>
          )}
          
          {/* COMPANION PANEL */}
          {companionOpen && <CompanionPanel isCompact={isCompact} />}
        </div>

        {/* CONTEXTUAL PANEL - Content depends on mode */}
        <div style={{ flex: 1, borderTop: `1px solid ${tokens.colors.border.subtle}`, overflow: 'auto', background: tokens.colors.bg.secondary }}>
          <div style={{ padding: '12px' }}>
            {/* NAVIGATE MODE */}
            {mapMode === 'navigate' && !focusedVGId && (
              <>
                <SectionHeader title="Bookmarks" icon={Bookmark} color={tokens.colors.accent.amber} count={BOOKMARKS.length} />
                {!isCompact && <SearchBar value={searchQuery} onChange={setSearchQuery} placeholder="Search bookmarks..." />}
                {filteredBookmarks.map(bm => <BookmarkItem key={bm.id} bookmark={bm} formatCellRef={formatCellRef} isCompact={isCompact} />)}
                {filteredBookmarks.length === 0 && <div style={{ padding: '16px', textAlign: 'center', color: tokens.colors.text.muted, fontSize: tokens.text.sm }}>{searchQuery ? 'No matching bookmarks' : 'No bookmarks yet'}</div>}
              </>
            )}
            
            {/* LAYOUT MODE */}
            {mapMode === 'layout' && !focusedVGId && (
              <>
                <SectionHeader title="On Canvas" icon={Package} color={tokens.colors.accent.green} count={VIEWGROUPS.length} action={<ToolbarBtn icon={Plus} size={14} />} />
                {!isCompact && <SearchBar value={searchQuery} onChange={setSearchQuery} placeholder="Search groups..." />}
                {!isCompact && <div style={{ display: 'flex', gap: '4px', marginBottom: '8px', flexWrap: 'wrap' }}><FilterChip label="All" active /><FilterChip label="Explicit" count={VIEWGROUPS.filter(v => v.isExplicit).length} /><FilterChip label="Implicit" count={VIEWGROUPS.filter(v => !v.isExplicit).length} /></div>}
                {filteredVGs.map(vg => <VGListItem key={vg.id} vg={vg} displayName={getVGDisplayName(vg)} isSelected={selectedVGId === vg.id} isCompact={isCompact} onClick={() => handleVGClick(vg.id)} onDoubleClick={() => handleVGDoubleClick(vg.id)} formatRangeRef={formatRangeRef} />)}
                {INACTIVE_VGS.length > 0 && (
                  <>
                    <SectionHeader title="Inactive" icon={EyeOff} color={tokens.colors.text.muted} count={INACTIVE_VGS.length} collapsed={inactiveCollapsed} onToggle={() => setInactiveCollapsed(!inactiveCollapsed)} style={{ marginTop: '12px' }} />
                    {!inactiveCollapsed && INACTIVE_VGS.map(vg => <VGListItem key={vg.id} vg={vg} displayName={getVGDisplayName(vg)} isSelected={false} isInactive isCompact={isCompact} onClick={() => {}} onDoubleClick={() => {}} formatRangeRef={formatRangeRef} />)}
                  </>
                )}
              </>
            )}
            
            {/* LINKS MODE */}
            {mapMode === 'links' && (
              linksSubTab === 'vg' ? (
                <>
                  <SectionHeader title="ViewGroup Links" icon={GitBranch} color={tokens.colors.accent.purple} count={VG_LINKS.length} />
                  <p style={{ fontSize: tokens.text.xs, color: tokens.colors.text.muted, marginBottom: '8px' }}>Click a link to highlight</p>
                  {VG_LINKS.map(link => {
                    const fromVG = VIEWGROUPS.find(v => v.id === link.from);
                    const toVG = VIEWGROUPS.find(v => v.id === link.to);
                    return <LinkItem key={link.id} link={link} fromName={fromVG ? getVGDisplayName(fromVG) : '?'} toName={toVG ? getVGDisplayName(toVG) : '?'} fromColor={fromVG?.color} toColor={toVG?.color} isHighlighted={highlightedLinkId === link.id} onClick={() => handleLinkClick(link.id)} />;
                  })}
                </>
              ) : (
                <>
                  <SectionHeader title="View Links" icon={Layers} color={tokens.colors.accent.blue} count={VIEW_LINKS.length} />
                  <p style={{ fontSize: tokens.text.xs, color: tokens.colors.text.muted, marginBottom: '8px' }}>Links between individual views</p>
                  {VIEW_LINKS.map(link => (
                    <div key={link.id} style={{ padding: '8px', marginBottom: '4px', background: tokens.colors.glass.subtle, borderRadius: tokens.radius.md }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '4px' }}>
                        <Link2 size={10} style={{ color: tokens.colors.accent.blue }} />
                        <span style={{ fontSize: tokens.text.xs, fontWeight: 600 }}>{link.type}</span>
                        <span style={{ fontSize: '9px', color: tokens.colors.text.muted }}>• {link.mode}</span>
                      </div>
                      <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                        {link.views.map(vId => {
                          const allViews = VIEWGROUPS.flatMap(vg => vg.views);
                          const view = allViews.find(v => v.id === vId);
                          const viewType = view ? VIEW_TYPES[view.type] : null;
                          return view ? <span key={vId} style={{ padding: '2px 6px', background: `${viewType?.color}20`, color: viewType?.color, borderRadius: '3px', fontSize: '9px' }}>{view.name}</span> : null;
                        })}
                      </div>
                    </div>
                  ))}
                </>
              )
            )}
            
            {/* TEAM MODE */}
            {mapMode === 'team' && (
              teamSubTab === 'me' ? (
                <>
                  <SectionHeader title="My Viewports" icon={Frame} color={tokens.colors.accent.teal} count={VIEWPORTS.length} action={<ToolbarBtn icon={Plus} size={14} />} />
                  {VIEWPORTS.map(vp => <ViewportItem key={vp.id} viewport={vp} isSelected={selectedViewportId === vp.id} onClick={() => setSelectedViewportId(vp.id)} formatRangeRef={formatRangeRef} isCompact={isCompact} />)}
                  
                  <SectionHeader title="Broadcast" icon={Radio} color={tokens.colors.accent.red} style={{ marginTop: '12px' }} />
                  <div style={{ padding: '10px', background: tokens.colors.glass.subtle, borderRadius: tokens.radius.lg, marginBottom: '8px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                      <span style={{ fontSize: tokens.text.sm, color: tokens.colors.text.secondary }}>{myBroadcasting ? 'Broadcasting to team' : 'Not broadcasting'}</span>
                      <ToggleSwitch checked={myBroadcasting} onChange={setMyBroadcasting} color={tokens.colors.accent.red} />
                    </div>
                    {myBroadcasting && <div style={{ fontSize: tokens.text.xs, color: tokens.colors.accent.red, display: 'flex', alignItems: 'center', gap: '4px' }}><Radio size={10} /> Team can follow your viewport</div>}
                  </div>
                  
                  <SectionHeader title="My Cursor" icon={MousePointer2} color={tokens.colors.accent.cyan} style={{ marginTop: '12px' }} />
                  <div style={{ padding: '10px', background: tokens.colors.glass.subtle, borderRadius: tokens.radius.lg }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
                      <span style={{ fontSize: tokens.text.sm, color: tokens.colors.text.secondary }}>Visible to team</span>
                      <ToggleSwitch checked={myCursorVisible} onChange={setMyCursorVisible} color={tokens.colors.accent.cyan} />
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontSize: tokens.text.xs, color: tokens.colors.text.muted }}>Color:</span>
                      {[tokens.colors.accent.cyan, tokens.colors.accent.green, tokens.colors.accent.pink, tokens.colors.accent.amber, tokens.colors.accent.purple].map(color => (
                        <button key={color} onClick={() => setMyCursorColor(color)} style={{ width: '20px', height: '20px', borderRadius: '50%', background: color, border: myCursorColor === color ? '2px solid white' : '2px solid transparent', cursor: 'pointer' }} />
                      ))}
                    </div>
                  </div>
                </>
              ) : (
                <>
                  {!isCompact && <SearchBar value={searchQuery} onChange={setSearchQuery} placeholder="Search team..." />}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px', padding: '8px', background: tokens.colors.glass.subtle, borderRadius: tokens.radius.md }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><MousePointer2 size={14} style={{ color: tokens.colors.accent.cyan }} /><span style={{ fontSize: tokens.text.sm }}>Show Cursors</span></div>
                    <ToggleSwitch checked={showCursors} onChange={setShowCursors} color={tokens.colors.accent.cyan} />
                  </div>
                  <div style={{ display: 'flex', gap: '4px', marginBottom: '10px', flexWrap: 'wrap' }}>
                    <FilterChip label={`Online ${onlineCount}`} active color={tokens.colors.accent.green} />
                    <FilterChip label={`All ${COLLABORATORS.length}`} />
                    <FilterChip label={`📡 Live ${COLLABORATORS.filter(c => c.isBroadcasting).length}`} color={tokens.colors.accent.red} />
                  </div>
                  {collaboratorsWithCursorState.filter(c => c.isBroadcasting).length > 0 && (
                    <>
                      <div style={{ fontSize: tokens.text.xs, color: tokens.colors.accent.red, fontWeight: 600, marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '4px' }}><Radio size={10} /> BROADCASTING</div>
                      {collaboratorsWithCursorState.filter(c => c.isBroadcasting).map(c => <CollaboratorItem key={c.id} collaborator={c} formatCellRef={formatCellRef} isCompact={isCompact} showCursorToggle onToggleCursor={handleToggleCollaboratorCursor} />)}
                    </>
                  )}
                  {collaboratorsWithCursorState.filter(c => c.isOnline && !c.isBroadcasting).length > 0 && (
                    <>
                      <div style={{ fontSize: tokens.text.xs, color: tokens.colors.accent.green, fontWeight: 600, marginTop: '12px', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '4px' }}><div style={{ width: '6px', height: '6px', borderRadius: '50%', background: tokens.colors.accent.green }} /> ONLINE</div>
                      {collaboratorsWithCursorState.filter(c => c.isOnline && !c.isBroadcasting).map(c => <CollaboratorItem key={c.id} collaborator={c} formatCellRef={formatCellRef} isCompact={isCompact} showCursorToggle onToggleCursor={handleToggleCollaboratorCursor} />)}
                    </>
                  )}
                  {COLLABORATORS.filter(c => !c.isOnline).length > 0 && (
                    <>
                      <div style={{ fontSize: tokens.text.xs, color: tokens.colors.text.muted, fontWeight: 600, marginTop: '12px', marginBottom: '6px' }}>OFFLINE</div>
                      {COLLABORATORS.filter(c => !c.isOnline).map(c => <CollaboratorItem key={c.id} collaborator={c} formatCellRef={formatCellRef} isOffline isCompact={isCompact} />)}
                    </>
                  )}
                </>
              )
            )}
          </div>
        </div>

        {/* FOOTER */}
        <div style={{ padding: '8px 12px', borderTop: `1px solid ${tokens.colors.border.subtle}`, background: tokens.colors.glass.subtle, fontSize: tokens.text.xs, color: tokens.colors.text.muted, display: 'flex', alignItems: 'center', gap: '8px', height: footerHeight, flexShrink: 0 }}>
          <span style={{ flex: 1 }}>{focusedVGId ? `Editing: ${getVGDisplayName(focusedVG)}` : `${currentMode.name} • ${isCompact ? '' : currentMode.description}`}</span>
          {selectedViewportId && VIEWPORTS.find(v => v.id === selectedViewportId) && (
            <span style={{ fontFamily: 'monospace', color: tokens.colors.accent.teal, padding: '2px 6px', background: `${tokens.colors.accent.teal}15`, borderRadius: '3px' }}>
              {formatRangeRef(VIEWPORTS.find(v => v.id === selectedViewportId).position.row, VIEWPORTS.find(v => v.id === selectedViewportId).position.col, VIEWPORTS.find(v => v.id === selectedViewportId).size.rows, VIEWPORTS.find(v => v.id === selectedViewportId).size.cols)}
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

export default CanvasMapV2Reference;
