/*
import React, { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import { 
  Search, X, ChevronDown, Check, Filter, Tag, ArrowDownAZ, ArrowUpDown, 
  Star, CheckCircle, Users, Link2, Compass, Grid3X3, Layers, UserCircle2,
  Home, Target, Maximize2, Bookmark, Plus, Minus, Eye, EyeOff, Settings,
  ChevronLeft, ChevronRight, ChevronUp, MoreHorizontal, Grip, PanelRightClose, 
  Database, Box, BarChart3, Table2, Image, FileText, Radio, Circle, Move,
  GripVertical, Crosshair, Palette, Volume2, VolumeX, Navigation, MapPin,
  PanelLeftClose, PanelRightOpen, Scan, SlidersHorizontal, LayoutGrid,
  Unlink, BookmarkPlus, Trash2, ExternalLink,
  MousePointer2, Hand, ZoomIn, ZoomOut, RotateCcw, Layers2, Activity
} from 'lucide-react';

const tokens = {
  colors: {
    bg: {
      base: '#020406',
      primary: '#060a12',
      secondary: '#0c1220',
      tertiary: '#121a2e',
      hover: 'rgba(96, 165, 250, 0.08)',
      active: 'rgba(96, 165, 250, 0.15)',
    },
    glass: {
      subtle: 'rgba(96, 165, 250, 0.03)',
      light: 'rgba(96, 165, 250, 0.05)',
      medium: 'rgba(96, 165, 250, 0.08)',
      strong: 'rgba(96, 165, 250, 0.12)',
    },
    border: {
      subtle: 'rgba(96, 165, 250, 0.08)',
      default: 'rgba(96, 165, 250, 0.15)',
      focus: 'rgba(59, 130, 246, 0.5)',
    },
    text: {
      primary: 'rgba(248, 250, 252, 0.95)',
      secondary: 'rgba(203, 213, 225, 0.8)',
      muted: 'rgba(148, 163, 184, 0.6)',
    },
    accent: {
      blue: '#3b82f6',
      cyan: '#22d3ee',
      purple: '#a855f7',
      amber: '#f59e0b',
      green: '#22c55e',
      red: '#ef4444',
      teal: '#14b8a6',
      pink: '#ec4899',
    },
    canvas: {
      bg: '#030303',
      cell: '#080808',
      cellHover: '#0f0f12',
      gridLine: 'rgba(96, 165, 250, 0.04)',
      gridLineMajor: 'rgba(96, 165, 250, 0.10)',
    },
  },
  radius: { xs: '2px', sm: '4px', md: '6px', lg: '8px', xl: '12px' },
  fontSize: { xs: '9px', sm: '10px', md: '11px', lg: '12px', xl: '13px' },
  spacing: { xs: '4px', sm: '6px', md: '8px', lg: '12px', xl: '16px' },
};

const VIEW_TYPES = {
  volume: { icon: Box, color: '#a855f7', label: 'Volume', category: 'analysis' },
  slice: { icon: Layers2, color: '#3b82f6', label: 'Slice', category: 'analysis' },
  mpr: { icon: Grid3X3, color: '#22d3ee', label: 'MPR', category: 'analysis' },
  mesh: { icon: Box, color: '#14b8a6', label: '3D Mesh', category: 'visualization' },
  surface: { icon: Layers, color: '#22c55e', label: 'Surface', category: 'visualization' },
  pointcloud: { icon: Circle, color: '#8b5cf6', label: 'Point Cloud', category: 'visualization' },
  chart: { icon: BarChart3, color: '#f59e0b', label: 'Chart', category: 'data' },
  table: { icon: Table2, color: '#3b82f6', label: 'Table', category: 'data' },
  stats: { icon: Activity, color: '#22c55e', label: 'Statistics', category: 'data' },
  image: { icon: Image, color: '#ec4899', label: 'Image', category: 'media' },
  annotation: { icon: FileText, color: '#f59e0b', label: 'Annotation', category: 'media' },
};

const TYPE_CATEGORIES = [
  { id: 'analysis', label: 'Analysis', icon: BarChart3, types: ['volume', 'slice', 'mpr'] },
  { id: 'visualization', label: 'Visualization', icon: Box, types: ['mesh', 'surface', 'pointcloud'] },
  { id: 'data', label: 'Data Views', icon: Table2, types: ['chart', 'table', 'stats'] },
  { id: 'media', label: 'Media', icon: Image, types: ['image', 'annotation'] },
];

const ALL_TAGS = [
  { id: 'brain', name: 'Brain', category: 'anatomy' },
  { id: 'cardiac', name: 'Cardiac', category: 'anatomy' },
  { id: 'spine', name: 'Spine', category: 'anatomy' },
  { id: 'mri', name: 'MRI', category: 'modality' },
  { id: 'ct', name: 'CT', category: 'modality' },
  { id: 'analysis', name: 'Analysis', category: 'workflow' },
  { id: 'reference', name: 'Reference', category: 'workflow' },
];

const QUICK_FILTERS = [
  { id: 'active', label: 'Active', icon: CheckCircle, predicate: (item) => item.isActive !== false },
  { id: 'linked', label: 'Linked', icon: Link2, predicate: (item) => item.isLinked },
  { id: 'shared', label: 'Shared', icon: Users, predicate: (item) => item.isShared },
  { id: 'starred', label: 'Starred', icon: Star, predicate: (item) => item.isStarred },
];

const SORT_OPTIONS = [
  { value: 'position', label: 'Position (A1→)', shortLabel: 'Position', icon: Grid3X3 },
  { value: 'name-asc', label: 'Name (A→Z)', shortLabel: 'Name ↑', icon: ArrowDownAZ },
  { value: 'name-desc', label: 'Name (Z→A)', shortLabel: 'Name ↓', icon: ArrowDownAZ },
  { value: 'type', label: 'By Type', shortLabel: 'Type', icon: Layers },
  { value: 'recent', label: 'Recently Modified', shortLabel: 'Recent', icon: ArrowUpDown },
];

const CANVAS = { rows: 10, cols: 10 };

const MOCK_VIEWGROUPS = [
  { 
    id: 'vg-1', name: 'Brain Analysis', color: '#a855f7',
    isExplicit: true, layoutId: '1+2',
    position: { row: 0, col: 0, rowSpan: 3, colSpan: 4 },
    views: [
      { id: 'v-1', type: 'volume', name: 'Main Volume', gridPos: { row: 0, col: 0, rowSpan: 2, colSpan: 2 } },
      { id: 'v-2', type: 'slice', name: 'Axial Slice', gridPos: { row: 0, col: 2, rowSpan: 1, colSpan: 2 } },
      { id: 'v-3', type: 'stats', name: 'ROI Statistics', gridPos: { row: 1, col: 2, rowSpan: 1, colSpan: 2 } },
    ],
    isActive: true, isLinked: true, isShared: true, isStarred: true, tags: ['brain', 'mri'],
  },
  { 
    id: 'vg-2', name: 'Data Explorer', color: '#22c55e',
    isExplicit: true, layoutId: 'side-by-side',
    position: { row: 0, col: 5, rowSpan: 2, colSpan: 4 },
    views: [
      { id: 'v-4', type: 'chart', name: 'Timeline Chart', gridPos: { row: 0, col: 0, rowSpan: 2, colSpan: 2 } },
      { id: 'v-5', type: 'table', name: 'Data Table', gridPos: { row: 0, col: 2, rowSpan: 2, colSpan: 2 } },
    ],
    isActive: true, isLinked: false, isShared: false, isStarred: false, tags: ['analysis'],
  },
  { 
    id: 'vg-3', name: 'Heart Mesh', color: '#ef4444',
    isExplicit: false, layoutId: 'single',
    position: { row: 4, col: 1, rowSpan: 3, colSpan: 3 },
    views: [
      { id: 'v-6', type: 'mesh', name: 'Heart 3D Model', gridPos: { row: 0, col: 0, rowSpan: 3, colSpan: 3 } },
    ],
    isActive: true, isLinked: true, isShared: true, isStarred: false, tags: ['cardiac'],
  },
  { 
    id: 'vg-4', name: 'Reference Images', color: '#f59e0b',
    isExplicit: true, layoutId: '2x2',
    position: { row: 5, col: 5, rowSpan: 4, colSpan: 4 },
    views: [
      { id: 'v-7', type: 'image', name: 'X-Ray Chest', gridPos: { row: 0, col: 0, rowSpan: 2, colSpan: 2 } },
      { id: 'v-8', type: 'image', name: 'CT Slice', gridPos: { row: 0, col: 2, rowSpan: 2, colSpan: 2 } },
      { id: 'v-9', type: 'image', name: 'MRI T1', gridPos: { row: 2, col: 0, rowSpan: 2, colSpan: 2 } },
      { id: 'v-10', type: 'annotation', name: 'Clinical Notes', gridPos: { row: 2, col: 2, rowSpan: 2, colSpan: 2 } },
    ],
    isActive: false, isLinked: false, isShared: false, isStarred: true, tags: ['ct', 'mri', 'reference'],
  },
];

const MOCK_DATASETS = [
  { id: 'ds-1', name: 'brain_scan_001.nii', type: 'nifti', size: '52 MB', isLoaded: true },
  { id: 'ds-2', name: 'patient_metrics.csv', type: 'csv', size: '1.2 MB', isLoaded: true },
  { id: 'ds-3', name: 'heart_mesh.vtk', type: 'vtk', size: '15 MB', isLoaded: true },
  { id: 'ds-4', name: 'xray_chest.png', type: 'image', size: '2 MB', isLoaded: false },
  { id: 'ds-5', name: 'ct_series.dcm', type: 'dicom', size: '125 MB', isLoaded: false },
];

const MOCK_UNPLACED_VIEWS = [
  { id: 'uv-1', type: 'volume', name: 'Spine Volume', datasetId: 'ds-7', isActive: true, isLinked: false, isShared: false, isStarred: false },
  { id: 'uv-2', type: 'chart', name: 'Trend Analysis', datasetId: null, isActive: true, isLinked: false, isShared: false, isStarred: true },
];

const MOCK_VIEWPORT = {
  id: 'main', name: 'Main',
  position: { row: 0, col: 0 },
  size: { rows: 5, cols: 5 },
  isPrimary: true,
};

const MOCK_COLLABORATORS = [
  { id: 'u-1', name: 'Alice Chen', color: '#22c55e', avatar: 'AC', viewportPos: { row: 2, col: 3 }, cursorPos: { row: 2.5, col: 4.2 }, isOnline: true, isBroadcasting: true },
  { id: 'u-2', name: 'Bob Smith', color: '#3b82f6', avatar: 'BS', viewportPos: { row: 5, col: 5 }, cursorPos: { row: 6.1, col: 7.3 }, isOnline: true, isBroadcasting: false },
  { id: 'u-3', name: 'Carol Davis', color: '#f59e0b', avatar: 'CD', viewportPos: null, cursorPos: null, isOnline: false, isBroadcasting: false },
];

const MOCK_BOOKMARKS = [
  { id: 'bm-1', name: 'Brain Overview', position: { row: 0, col: 0 }, isStarred: true, isActive: true },
  { id: 'bm-2', name: 'Heart Detail', position: { row: 4, col: 1 }, isStarred: false, isActive: true },
  { id: 'bm-3', name: 'Reference Gallery', position: { row: 5, col: 5 }, isStarred: true, isActive: true },
];

const MOCK_VG_LINKS = [
  { id: 'link-1', from: 'vg-1', to: 'vg-3', type: 'camera', mode: 'bidirectional' },
  { id: 'link-2', from: 'vg-1', to: 'vg-2', type: 'filter', mode: 'unidirectional' },
];

const MAP_MODES = { NAVIGATE: 'navigate', LAYOUT: 'layout', LINKS: 'links', TEAM: 'team' };
const DISPLAY_MODES = { VG: 'vg', VIEW: 'view' };
const COMPANION_TABS = { VIEWS: 'views', DATASETS: 'datasets' };

const MODE_CONFIG = {
  [MAP_MODES.NAVIGATE]: { label: 'Navigate', icon: Compass, color: tokens.colors.accent.blue },
  [MAP_MODES.LAYOUT]: { label: 'Layout', icon: Grid3X3, color: tokens.colors.accent.purple },
  [MAP_MODES.LINKS]: { label: 'Links', icon: Link2, color: tokens.colors.accent.cyan },
  [MAP_MODES.TEAM]: { label: 'Team', icon: Users, color: tokens.colors.accent.green },
};

const colToLetter = (col) => String.fromCharCode(65 + col);
const formatCellRef = (row, col) => `${colToLetter(col)}${row + 1}`;

const flattenViewsToCanvas = (viewGroups) => {
  const views = [];
  viewGroups.forEach(vg => {
    if (!vg.position) return;
    vg.views?.forEach((view) => {
      const gp = view.gridPos || { row: 0, col: 0, rowSpan: 1, colSpan: 1 };
      views.push({
        ...view,
        vgId: vg.id,
        vgName: vg.name,
        vgColor: vg.color,
        canvasRow: vg.position.row + gp.row,
        canvasCol: vg.position.col + gp.col,
        rowSpan: gp.rowSpan || 1,
        colSpan: gp.colSpan || 1,
      });
    });
  });
  return views;
};

function useListFilter({ searchFields = (item) => [item.name || ''], quickFilterDefs = [], initialState = {} }) {
  const [searchQuery, setSearchQuery] = useState(initialState.search || '');
  const [selectedTypes, setSelectedTypes] = useState(initialState.types || []);
  const [selectedTags, setSelectedTags] = useState(initialState.tags || []);
  const [quickFilters, setQuickFilters] = useState(initialState.quickFilters || []);
  const [sortBy, setSortBy] = useState(initialState.sortBy || 'position');

  const toggleType = useCallback((typeId) => {
    setSelectedTypes(prev => prev.includes(typeId) ? prev.filter(t => t !== typeId) : [...prev, typeId]);
  }, []);

  const toggleTag = useCallback((tagId) => {
    setSelectedTags(prev => prev.includes(tagId) ? prev.filter(t => t !== tagId) : [...prev, tagId]);
  }, []);

  const toggleQuickFilter = useCallback((filterId) => {
    setQuickFilters(prev => prev.includes(filterId) ? prev.filter(f => f !== filterId) : [...prev, filterId]);
  }, []);

  const clearAll = useCallback(() => {
    setSearchQuery('');
    setSelectedTypes([]);
    setSelectedTags([]);
    setQuickFilters([]);
  }, []);

  const hasActiveFilters = searchQuery.trim() !== '' || selectedTypes.length > 0 || selectedTags.length > 0 || quickFilters.length > 0;
  const activeFilterCount = (searchQuery.trim() ? 1 : 0) + selectedTypes.length + selectedTags.length + quickFilters.length;

  const applyFilters = useCallback((items) => {
    let result = [...items];
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(item => searchFields(item).some(f => f?.toLowerCase().includes(q)));
    }
    if (selectedTypes.length > 0) {
      result = result.filter(item => {
        const types = item.views?.map(v => v.type) || [item.type];
        return types.some(t => selectedTypes.includes(t));
      });
    }
    if (selectedTags.length > 0) {
      result = result.filter(item => item.tags?.some(t => selectedTags.includes(t)));
    }
    if (quickFilters.length > 0) {
      result = result.filter(item => quickFilters.every(fid => {
        const def = quickFilterDefs.find(d => d.id === fid);
        return def ? def.predicate(item) : true;
      }));
    }
    result.sort((a, b) => {
      if (sortBy === 'name-asc') return (a.name || '').localeCompare(b.name || '');
      if (sortBy === 'name-desc') return (b.name || '').localeCompare(a.name || '');
      if (sortBy === 'type') return ((a.type || a.views?.[0]?.type) || '').localeCompare((b.type || b.views?.[0]?.type) || '');
      if (sortBy === 'position') {
        const ap = (a.position?.row ?? a.canvasRow ?? 99) * 100 + (a.position?.col ?? a.canvasCol ?? 99);
        const bp = (b.position?.row ?? b.canvasRow ?? 99) * 100 + (b.position?.col ?? b.canvasCol ?? 99);
        return ap - bp;
      }
      return 0;
    });
    return result;
  }, [searchQuery, selectedTypes, selectedTags, quickFilters, sortBy, searchFields, quickFilterDefs]);

  return {
    searchQuery, setSearchQuery,
    selectedTypes, toggleType, setSelectedTypes,
    selectedTags, toggleTag, setSelectedTags,
    quickFilters, toggleQuickFilter,
    sortBy, setSortBy,
    hasActiveFilters, activeFilterCount,
    clearAll, applyFilters,
  };
}

const FilterToolbar = ({ filter, sizeMode }) => {
  const [activeDropdown, setActiveDropdown] = useState(null);
  const isCompact = sizeMode === 'compact';
  const isMinimal = sizeMode === 'minimal';
  
  return (
    <div style={{ borderBottom: `1px solid ${tokens.colors.border.subtle}` }}>
      <div style={{
        display: 'flex', alignItems: 'center', gap: tokens.spacing.sm,
        padding: `${tokens.spacing.sm} ${tokens.spacing.md}`,
        background: tokens.colors.bg.secondary,
      }}>
        <div style={{
          flex: 1, display: 'flex', alignItems: 'center', gap: tokens.spacing.xs,
          padding: `${tokens.spacing.xs} ${tokens.spacing.sm}`,
          background: tokens.colors.bg.tertiary,
          borderRadius: tokens.radius.md,
          border: `1px solid ${tokens.colors.border.subtle}`,
          minWidth: 0,
        }}>
          <Search size={12} style={{ color: tokens.colors.text.muted, flexShrink: 0 }} />
          <input
            type="text"
            value={filter.searchQuery}
            onChange={(e) => filter.setSearchQuery(e.target.value)}
            placeholder="Search..."
            style={{
              flex: 1, background: 'transparent', border: 'none', outline: 'none',
              color: tokens.colors.text.primary, fontSize: tokens.fontSize.sm, minWidth: 0,
            }}
          />
          {filter.searchQuery && (
            <button onClick={() => filter.setSearchQuery('')} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, display: 'flex' }}>
              <X size={10} style={{ color: tokens.colors.text.muted }} />
            </button>
          )}
        </div>
        
        <div style={{ position: 'relative' }}>
          <button
            onClick={() => setActiveDropdown(activeDropdown === 'sort' ? null : 'sort')}
            style={{
              display: 'flex', alignItems: 'center', gap: '4px',
              padding: `${tokens.spacing.xs} ${tokens.spacing.sm}`,
              background: 'transparent',
              border: `1px solid ${tokens.colors.border.subtle}`,
              borderRadius: tokens.radius.md,
              color: tokens.colors.text.secondary,
              cursor: 'pointer', fontSize: tokens.fontSize.sm,
            }}
          >
            <ArrowUpDown size={12} />
            {!isCompact && !isMinimal && <span>{SORT_OPTIONS.find(o => o.value === filter.sortBy)?.shortLabel}</span>}
            <ChevronDown size={10} />
          </button>
          
          {activeDropdown === 'sort' && (
            <div style={{
              position: 'absolute', top: '100%', right: 0, marginTop: 4, zIndex: 1000,
              width: 180, background: tokens.colors.bg.primary,
              border: `1px solid ${tokens.colors.border.default}`,
              borderRadius: tokens.radius.lg, boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
              padding: tokens.spacing.xs,
            }}>
              {SORT_OPTIONS.map(opt => {
                const isActive = filter.sortBy === opt.value;
                const Icon = opt.icon;
                return (
                  <button
                    key={opt.value}
                    onClick={() => { filter.setSortBy(opt.value); setActiveDropdown(null); }}
                    style={{
                      display: 'flex', alignItems: 'center', gap: tokens.spacing.sm, width: '100%',
                      padding: '8px 10px',
                      background: isActive ? tokens.colors.glass.medium : 'transparent',
                      border: 'none', borderRadius: tokens.radius.sm,
                      color: isActive ? tokens.colors.accent.blue : tokens.colors.text.secondary,
                      cursor: 'pointer', textAlign: 'left',
                    }}
                  >
                    <Icon size={12} />
                    <span style={{ flex: 1, fontSize: tokens.fontSize.sm }}>{opt.label}</span>
                    {isActive && <Check size={12} />}
                  </button>
                );
              })}
            </div>
          )}
        </div>
        
        {filter.hasActiveFilters && (
          <button onClick={filter.clearAll} style={{ padding: tokens.spacing.xs, background: 'transparent', border: 'none', cursor: 'pointer', color: tokens.colors.text.muted }}>
            <X size={14} />
          </button>
        )}
      </div>
      
      <div style={{
        display: 'flex', alignItems: 'center', gap: tokens.spacing.xs,
        padding: `${tokens.spacing.xs} ${tokens.spacing.md}`,
        background: tokens.colors.glass.subtle,
        flexWrap: 'nowrap', overflow: 'hidden',
      }}>
        <span style={{ fontSize: tokens.fontSize.xs, color: tokens.colors.text.muted, flexShrink: 0 }}>Quick:</span>
        {QUICK_FILTERS.map(qf => {
          const isActive = filter.quickFilters.includes(qf.id);
          const Icon = qf.icon;
          return (
            <button
              key={qf.id}
              onClick={() => filter.toggleQuickFilter(qf.id)}
              style={{
                display: 'flex', alignItems: 'center', gap: '3px',
                padding: '3px 8px',
                background: isActive ? tokens.colors.glass.strong : tokens.colors.glass.subtle,
                border: `1px solid ${isActive ? tokens.colors.accent.blue : tokens.colors.border.subtle}`,
                borderRadius: tokens.radius.lg,
                color: isActive ? tokens.colors.accent.blue : tokens.colors.text.secondary,
                cursor: 'pointer', fontSize: tokens.fontSize.xs, whiteSpace: 'nowrap',
              }}
            >
              <Icon size={10} />
              {!isCompact && <span>{qf.label}</span>}
            </button>
          );
        })}
      </div>
    </div>
  );
};

const GridPaperBackground = ({ rows, cols, cellSize, gap, visible }) => {
  if (!visible) return null;
  const gridWidth = cols * (cellSize + gap) - gap;
  const gridHeight = rows * (cellSize + gap) - gap;
  const MAJOR_INTERVAL = 5;
  
  return (
    <svg style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none', zIndex: 0 }}>
      <defs>
        <pattern id="minorGrid" width={cellSize + gap} height={cellSize + gap} patternUnits="userSpaceOnUse">
          <path d={`M ${cellSize + gap} 0 L 0 0 0 ${cellSize + gap}`} fill="none" stroke={tokens.colors.canvas.gridLine} strokeWidth="0.5" />
        </pattern>
        <pattern id="majorGrid" width={(cellSize + gap) * MAJOR_INTERVAL} height={(cellSize + gap) * MAJOR_INTERVAL} patternUnits="userSpaceOnUse">
          <rect width={(cellSize + gap) * MAJOR_INTERVAL} height={(cellSize + gap) * MAJOR_INTERVAL} fill="url(#minorGrid)" />
          <path d={`M ${(cellSize + gap) * MAJOR_INTERVAL} 0 L 0 0 0 ${(cellSize + gap) * MAJOR_INTERVAL}`} fill="none" stroke={tokens.colors.canvas.gridLineMajor} strokeWidth="1" />
        </pattern>
      </defs>
      <rect width={gridWidth} height={gridHeight} fill="url(#majorGrid)" />
      <rect x="0" y="0" width={gridWidth} height={gridHeight} fill="none" stroke={tokens.colors.canvas.gridLineMajor} strokeWidth="1" />
    </svg>
  );
};

const DPadControls = ({ position, onMove, onGoHome, homePosition, compact }) => {
  const isAtHome = position.row === homePosition.row && position.col === homePosition.col;
  const size = compact ? 24 : 28;
  
  const btnStyle = {
    width: size, height: size,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    background: tokens.colors.glass.medium,
    border: `1px solid ${tokens.colors.border.subtle}`,
    borderRadius: tokens.radius.sm,
    color: tokens.colors.text.secondary,
    cursor: 'pointer',
  };
  
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px' }}>
      <button onClick={() => onMove('up')} style={btnStyle}><ChevronUp size={compact ? 12 : 14} /></button>
      <div style={{ display: 'flex', gap: '2px' }}>
        <button onClick={() => onMove('left')} style={btnStyle}><ChevronLeft size={compact ? 12 : 14} /></button>
        <button onClick={onGoHome} style={{ ...btnStyle, background: isAtHome ? `${tokens.colors.accent.amber}30` : tokens.colors.glass.medium, color: isAtHome ? tokens.colors.accent.amber : tokens.colors.text.muted, border: isAtHome ? `1px solid ${tokens.colors.accent.amber}` : btnStyle.border }}>
          <Home size={compact ? 10 : 12} />
        </button>
        <button onClick={() => onMove('right')} style={btnStyle}><ChevronRight size={compact ? 12 : 14} /></button>
      </div>
      <button onClick={() => onMove('down')} style={btnStyle}><ChevronDown size={compact ? 12 : 14} /></button>
    </div>
  );
};

const CompanionPanel = ({ isOpen, onClose, activeTab, setActiveTab, viewGroups, unplacedViews, datasets, filter, onDragStart }) => {
  if (!isOpen) return null;
  
  const allViews = useMemo(() => {
    const placed = viewGroups.flatMap(vg => 
      (vg.views || []).map(v => ({ ...v, vgId: vg.id, vgName: vg.name, vgColor: vg.color, isPlaced: true, isActive: vg.isActive, isLinked: vg.isLinked, isShared: vg.isShared, isStarred: vg.isStarred }))
    );
    const unplaced = unplacedViews.map(v => ({ ...v, isPlaced: false }));
    return [...placed, ...unplaced];
  }, [viewGroups, unplacedViews]);
  
  const filteredViews = filter.applyFilters(allViews);
  
  return (
    <div style={{
      width: 160,
      background: tokens.colors.bg.secondary,
      borderLeft: `1px solid ${tokens.colors.border.subtle}`,
      display: 'flex', flexDirection: 'column',
      overflow: 'hidden',
    }}>
      <div style={{ display: 'flex', borderBottom: `1px solid ${tokens.colors.border.subtle}` }}>
        {[
          { id: COMPANION_TABS.VIEWS, label: 'Views', icon: Layers, count: allViews.length },
          { id: COMPANION_TABS.DATASETS, label: 'Data', icon: Database, count: datasets.length },
        ].map(tab => {
          const isActive = activeTab === tab.id;
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px',
                padding: tokens.spacing.sm,
                background: isActive ? tokens.colors.glass.medium : 'transparent',
                border: 'none',
                borderBottom: `2px solid ${isActive ? tokens.colors.accent.blue : 'transparent'}`,
                color: isActive ? tokens.colors.accent.blue : tokens.colors.text.muted,
                cursor: 'pointer', fontSize: tokens.fontSize.xs,
              }}
            >
              <Icon size={12} />
              <span>{tab.count}</span>
            </button>
          );
        })}
        <button onClick={onClose} style={{ padding: '4px 8px', background: 'transparent', border: 'none', color: tokens.colors.text.muted, cursor: 'pointer' }}>
          <X size={12} />
        </button>
      </div>
      
      <div style={{ flex: 1, overflow: 'auto', padding: tokens.spacing.xs }}>
        {activeTab === COMPANION_TABS.VIEWS && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: tokens.spacing.xs }}>
            <div style={{ fontSize: '9px', color: tokens.colors.text.muted, padding: '2px 4px' }}>
              Drag to place on canvas
            </div>
            {filteredViews.map(view => {
              const viewType = VIEW_TYPES[view.type] || VIEW_TYPES.image;
              const Icon = viewType.icon;
              return (
                <div
                  key={view.id}
                  draggable
                  onDragStart={(e) => onDragStart(e, 'view', view)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: tokens.spacing.xs,
                    padding: tokens.spacing.xs,
                    background: tokens.colors.glass.subtle,
                    border: `1px solid ${tokens.colors.border.subtle}`,
                    borderRadius: tokens.radius.sm,
                    borderLeft: `3px solid ${view.vgColor || viewType.color}`,
                    cursor: 'grab',
                    opacity: view.isPlaced ? 1 : 0.7,
                  }}
                >
                  <GripVertical size={10} style={{ color: tokens.colors.text.muted, flexShrink: 0 }} />
                  <Icon size={12} style={{ color: viewType.color, flexShrink: 0 }} />
                  <div style={{ flex: 1, minWidth: 0, overflow: 'hidden' }}>
                    <div style={{ fontSize: tokens.fontSize.xs, color: tokens.colors.text.primary, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {view.name}
                    </div>
                    {view.vgName && (
                      <div style={{ fontSize: '8px', color: tokens.colors.text.muted, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {view.vgName}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
        
        {activeTab === COMPANION_TABS.DATASETS && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: tokens.spacing.xs }}>
            <div style={{ fontSize: '9px', color: tokens.colors.text.muted, padding: '2px 4px' }}>
              Drag to create new view
            </div>
            {datasets.map(ds => (
              <div
                key={ds.id}
                draggable
                onDragStart={(e) => onDragStart(e, 'dataset', ds)}
                style={{
                  display: 'flex', alignItems: 'center', gap: tokens.spacing.xs,
                  padding: tokens.spacing.xs,
                  background: tokens.colors.glass.subtle,
                  border: `1px solid ${tokens.colors.border.subtle}`,
                  borderRadius: tokens.radius.sm,
                  cursor: 'grab',
                  opacity: ds.isLoaded ? 1 : 0.6,
                }}
              >
                <GripVertical size={10} style={{ color: tokens.colors.text.muted, flexShrink: 0 }} />
                <Database size={12} style={{ color: ds.isLoaded ? tokens.colors.accent.green : tokens.colors.text.muted, flexShrink: 0 }} />
                <div style={{ flex: 1, minWidth: 0, overflow: 'hidden' }}>
                  <div style={{ fontSize: tokens.fontSize.xs, color: tokens.colors.text.primary, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {ds.name}
                  </div>
                  <div style={{ fontSize: '8px', color: tokens.colors.text.muted }}>
                    {ds.type} · {ds.size}
                  </div>
                </div>
                {ds.isLoaded && <CheckCircle size={10} style={{ color: tokens.colors.accent.green, flexShrink: 0 }} />}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

const VGBlock = ({ vg, cellSize, gap, isSelected, onClick }) => {
  const { position, color, name, isExplicit, views } = vg;
  const width = position.colSpan * cellSize + (position.colSpan - 1) * gap;
  const height = position.rowSpan * cellSize + (position.rowSpan - 1) * gap;
  const left = position.col * (cellSize + gap);
  const top = position.row * (cellSize + gap);
  
  return (
    <div
      onClick={onClick}
      style={{
        position: 'absolute', left, top, width, height,
        background: `${color}20`,
        border: `2px ${isExplicit ? 'solid' : 'dashed'} ${color}80`,
        borderRadius: tokens.radius.md,
        cursor: 'pointer',
        boxShadow: isSelected ? `0 0 16px ${color}50, inset 0 0 24px ${color}10` : 'none',
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        overflow: 'hidden', zIndex: isSelected ? 10 : 1,
        transition: 'box-shadow 0.15s ease',
      }}
    >
      <span style={{
        fontSize: cellSize > 35 ? tokens.fontSize.sm : tokens.fontSize.xs,
        fontWeight: 600, color: tokens.colors.text.primary,
        textShadow: '0 1px 3px rgba(0,0,0,0.9)',
        textAlign: 'center', padding: '2px 4px',
        maxWidth: '100%', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
      }}>
        {name}
      </span>
      {cellSize > 40 && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginTop: '2px' }}>
          <span style={{ fontSize: tokens.fontSize.xs, color, fontFamily: 'monospace', fontWeight: 600 }}>
            {formatCellRef(position.row, position.col)}
          </span>
          <span style={{ fontSize: tokens.fontSize.xs, color: tokens.colors.text.muted }}>
            {views?.length || 0}v
          </span>
        </div>
      )}
    </div>
  );
};

const ViewCell = ({ view, cellSize, gap, isSelected, onClick }) => {
  const viewType = VIEW_TYPES[view.type] || VIEW_TYPES.image;
  const Icon = viewType.icon;
  const left = view.canvasCol * (cellSize + gap);
  const top = view.canvasRow * (cellSize + gap);
  const width = (view.colSpan || 1) * cellSize + ((view.colSpan || 1) - 1) * gap;
  const height = (view.rowSpan || 1) * cellSize + ((view.rowSpan || 1) - 1) * gap;
  
  return (
    <div
      onClick={onClick}
      style={{
        position: 'absolute', left, top, width, height,
        background: `${viewType.color}20`,
        border: `1px solid ${viewType.color}60`,
        borderRadius: tokens.radius.sm,
        cursor: 'pointer',
        boxShadow: isSelected ? `0 0 8px ${viewType.color}50` : 'none',
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        gap: 2, zIndex: isSelected ? 10 : 1,
      }}
    >
      <Icon size={Math.min(16, cellSize * 0.4)} style={{ color: viewType.color }} />
      {cellSize > 40 && (
        <span style={{
          fontSize: '8px', color: tokens.colors.text.secondary,
          textAlign: 'center', maxWidth: '100%', padding: '0 2px',
          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
        }}>
          {view.name}
        </span>
      )}
    </div>
  );
};

const ViewportIndicator = ({ viewport, cellSize, gap, isDragging, onMouseDown }) => {
  const { position, size, name, isPrimary } = viewport;
  const width = size.cols * cellSize + (size.cols - 1) * gap;
  const height = size.rows * cellSize + (size.rows - 1) * gap;
  const left = position.col * (cellSize + gap);
  const top = position.row * (cellSize + gap);
  
  return (
    <div
      onMouseDown={onMouseDown}
      style={{
        position: 'absolute', left, top, width, height,
        border: `2px solid ${tokens.colors.accent.cyan}`,
        borderRadius: tokens.radius.md,
        background: `${tokens.colors.accent.cyan}08`,
        boxShadow: `0 0 12px ${tokens.colors.accent.cyan}30`,
        cursor: isDragging ? 'grabbing' : 'grab',
        zIndex: 50,
      }}
    >
      <span style={{
        position: 'absolute', bottom: 4, left: 6,
        fontSize: tokens.fontSize.xs, fontWeight: 600, color: tokens.colors.accent.cyan,
        background: `${tokens.colors.bg.primary}dd`,
        padding: '1px 6px', borderRadius: tokens.radius.sm, textTransform: 'uppercase',
      }}>
        {name}
      </span>
      {isPrimary && (
        <div style={{
          position: 'absolute', top: -6, right: -6,
          width: 12, height: 12, background: tokens.colors.accent.amber, borderRadius: '50%',
          border: `2px solid ${tokens.colors.bg.primary}`,
          boxShadow: `0 0 6px ${tokens.colors.accent.amber}`,
        }} />
      )}
      <div style={{ position: 'absolute', top: 4, right: 6, color: tokens.colors.accent.cyan, opacity: 0.7 }}>
        <Move size={10} />
      </div>
    </div>
  );
};

const CollaboratorIndicators = ({ collaborators, cellSize, gap, showCursors }) => (
  <>
    {collaborators.filter(c => c.isOnline && c.viewportPos).map(collab => {
      const vpLeft = collab.viewportPos.col * (cellSize + gap);
      const vpTop = collab.viewportPos.row * (cellSize + gap);
      
      return (
        <React.Fragment key={collab.id}>
          <div style={{
            position: 'absolute', left: vpLeft, top: vpTop,
            width: cellSize * 3 + gap * 2, height: cellSize * 3 + gap * 2,
            border: `2px dashed ${collab.color}50`,
            borderRadius: tokens.radius.md,
            pointerEvents: 'none', zIndex: 45,
          }} />
          <div
            style={{
              position: 'absolute',
              left: vpLeft + cellSize * 3 + gap * 2 - 10,
              top: vpTop - 10,
              width: 20, height: 20,
              background: collab.color, borderRadius: '50%',
              border: `2px solid ${tokens.colors.bg.primary}`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '8px', fontWeight: 700, color: 'white',
              zIndex: 60,
              boxShadow: collab.isBroadcasting ? `0 0 8px ${collab.color}, 0 0 16px ${collab.color}` : `0 0 6px ${collab.color}`,
            }}
            title={collab.name}
          >
            {collab.avatar}
            {collab.isBroadcasting && (
              <div style={{
                position: 'absolute', bottom: -2, right: -2,
                width: 8, height: 8, background: tokens.colors.accent.red, borderRadius: '50%',
                border: `1px solid ${tokens.colors.bg.primary}`,
              }} />
            )}
          </div>
          {showCursors && collab.cursorPos && (
            <div style={{
              position: 'absolute',
              left: collab.cursorPos.col * (cellSize + gap) - 4,
              top: collab.cursorPos.row * (cellSize + gap) - 4,
              color: collab.color, zIndex: 65, pointerEvents: 'none',
              filter: `drop-shadow(0 0 4px ${collab.color})`,
            }}>
              <MousePointer2 size={12} fill={collab.color} />
            </div>
          )}
        </React.Fragment>
      );
    })}
  </>
);

const LinkLines = ({ links, viewGroups, cellSize, gap, highlightedId, onLinkClick }) => {
  const getCenter = (vgId) => {
    const vg = viewGroups.find(v => v.id === vgId);
    if (!vg?.position) return null;
    return {
      x: vg.position.col * (cellSize + gap) + (vg.position.colSpan * cellSize + (vg.position.colSpan - 1) * gap) / 2,
      y: vg.position.row * (cellSize + gap) + (vg.position.rowSpan * cellSize + (vg.position.rowSpan - 1) * gap) / 2,
    };
  };
  
  return (
    <svg style={{ position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 5 }}>
      {links.map(link => {
        const from = getCenter(link.from);
        const to = getCenter(link.to);
        if (!from || !to) return null;
        const isHighlighted = highlightedId === link.id;
        const color = link.type === 'camera' ? tokens.colors.accent.cyan : tokens.colors.accent.purple;
        return (
          <g key={link.id} onClick={() => onLinkClick(link.id)} style={{ cursor: 'pointer', pointerEvents: 'stroke' }}>
            <line x1={from.x} y1={from.y} x2={to.x} y2={to.y}
              stroke={color} strokeWidth={isHighlighted ? 4 : 2}
              strokeOpacity={isHighlighted ? 1 : 0.6}
              strokeDasharray={link.mode === 'unidirectional' ? '6,4' : 'none'}
            />
            {link.mode === 'bidirectional' && (
              <>
                <circle cx={from.x} cy={from.y} r={4} fill={color} opacity={0.8} />
                <circle cx={to.x} cy={to.y} r={4} fill={color} opacity={0.8} />
              </>
            )}
          </g>
        );
      })}
    </svg>
  );
};

const ModeTabs = ({ activeMode, onModeChange, sizeMode }) => {
  const isCompact = sizeMode === 'compact';
  return (
    <div style={{ display: 'flex', borderBottom: `1px solid ${tokens.colors.border.subtle}`, background: tokens.colors.bg.secondary }}>
      {Object.entries(MODE_CONFIG).map(([mode, config]) => {
        const isActive = activeMode === mode;
        const Icon = config.icon;
        return (
          <button key={mode} onClick={() => onModeChange(mode)} style={{
            flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: tokens.spacing.xs,
            padding: `${tokens.spacing.sm} ${tokens.spacing.md}`,
            background: isActive ? tokens.colors.glass.medium : 'transparent',
            border: 'none', borderBottom: `2px solid ${isActive ? config.color : 'transparent'}`,
            color: isActive ? config.color : tokens.colors.text.muted,
            cursor: 'pointer', fontSize: tokens.fontSize.sm, fontWeight: isActive ? 600 : 400,
          }}>
            <Icon size={14} />
            {!isCompact && <span>{config.label}</span>}
          </button>
        );
      })}
    </div>
  );
};

const MapToolbar = ({ displayMode, setDisplayMode, showGridLabels, toggleGridLabels, showGridPaper, toggleGridPaper, showViewports, toggleViewports, showCollaborators, toggleCollaborators, minimapZoom, onZoomIn, onZoomOut, onZoomReset, companionOpen, toggleCompanion, sizeMode }) => {
  const isCompact = sizeMode === 'compact';
  
  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: tokens.spacing.md,
      padding: `${tokens.spacing.xs} ${tokens.spacing.md}`,
      background: tokens.colors.bg.tertiary, borderBottom: `1px solid ${tokens.colors.border.subtle}`,
    }}>
      <div style={{ display: 'flex', background: tokens.colors.bg.secondary, borderRadius: tokens.radius.md, padding: '2px', border: `1px solid ${tokens.colors.border.subtle}` }}>
        {[{ mode: DISPLAY_MODES.VG, label: 'VG', icon: Grid3X3 }, { mode: DISPLAY_MODES.VIEW, label: 'View', icon: Layers }].map(({ mode, label, icon: Icon }) => {
          const isActive = displayMode === mode;
          return (
            <button key={mode} onClick={() => setDisplayMode(mode)} style={{
              display: 'flex', alignItems: 'center', gap: '4px', padding: '4px 10px',
              background: isActive ? tokens.colors.glass.medium : 'transparent',
              border: 'none', borderRadius: tokens.radius.sm,
              color: isActive ? tokens.colors.accent.blue : tokens.colors.text.muted,
              cursor: 'pointer', fontSize: tokens.fontSize.sm, fontWeight: isActive ? 600 : 400,
            }}>
              <Icon size={12} />
              {!isCompact && <span>{label}</span>}
            </button>
          );
        })}
      </div>
      
      <div style={{ display: 'flex', gap: '4px' }}>
        {[
          { active: showGridPaper, toggle: toggleGridPaper, icon: LayoutGrid, label: 'Grid' },
          { active: showGridLabels, toggle: toggleGridLabels, icon: Grid3X3, label: 'Labels' },
          { active: showViewports, toggle: toggleViewports, icon: Scan, label: 'Viewport' },
          { active: showCollaborators, toggle: toggleCollaborators, icon: Users, label: 'Team' },
        ].map((item, i) => (
          <button key={i} onClick={item.toggle} title={item.label} style={{
            width: 26, height: 26, display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: item.active ? tokens.colors.glass.medium : 'transparent',
            border: `1px solid ${item.active ? tokens.colors.accent.blue : tokens.colors.border.subtle}`,
            borderRadius: tokens.radius.sm, color: item.active ? tokens.colors.accent.blue : tokens.colors.text.muted, cursor: 'pointer',
          }}>
            <item.icon size={12} />
          </button>
        ))}
      </div>
      
      <div style={{ display: 'flex', alignItems: 'center', gap: tokens.spacing.sm }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '2px' }}>
          <button onClick={onZoomOut} style={{ width: 22, height: 22, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'transparent', border: `1px solid ${tokens.colors.border.subtle}`, borderRadius: tokens.radius.sm, color: tokens.colors.text.muted, cursor: 'pointer' }}><Minus size={10} /></button>
          <button onClick={onZoomReset} style={{ minWidth: 36, height: 22, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'transparent', border: `1px solid ${tokens.colors.border.subtle}`, borderRadius: tokens.radius.sm, color: tokens.colors.text.muted, cursor: 'pointer', fontSize: tokens.fontSize.xs }}>{minimapZoom}%</button>
          <button onClick={onZoomIn} style={{ width: 22, height: 22, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'transparent', border: `1px solid ${tokens.colors.border.subtle}`, borderRadius: tokens.radius.sm, color: tokens.colors.text.muted, cursor: 'pointer' }}><Plus size={10} /></button>
        </div>
        
        <button onClick={toggleCompanion} title={companionOpen ? 'Hide panel' : 'Show Views & Datasets'} style={{
          width: 26, height: 26, display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: companionOpen ? tokens.colors.glass.medium : 'transparent',
          border: `1px solid ${companionOpen ? tokens.colors.accent.blue : tokens.colors.border.subtle}`,
          borderRadius: tokens.radius.sm, color: companionOpen ? tokens.colors.accent.blue : tokens.colors.text.muted, cursor: 'pointer',
        }}>
          {companionOpen ? <PanelRightClose size={12} /> : <PanelRightOpen size={12} />}
        </button>
      </div>
    </div>
  );
};

const ContextualPanelContent = ({ mode, viewport, setViewport, homePosition, viewGroups, selectedVGId, setSelectedVGId, links, highlightedLinkId, setHighlightedLinkId, collaborators, showCursors, setShowCursors, bookmarks, filter, sizeMode }) => {
  const handleMove = (dir) => {
    setViewport(prev => ({
      ...prev,
      position: {
        row: Math.max(0, Math.min(CANVAS.rows - prev.size.rows, prev.position.row + (dir === 'up' ? -1 : dir === 'down' ? 1 : 0))),
        col: Math.max(0, Math.min(CANVAS.cols - prev.size.cols, prev.position.col + (dir === 'left' ? -1 : dir === 'right' ? 1 : 0))),
      },
    }));
  };
  
  const filteredVGs = filter.applyFilters(viewGroups);
  const activeVGs = filteredVGs.filter(vg => vg.position);
  
  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
      <FilterToolbar filter={filter} sizeMode={sizeMode} />
      
      <div style={{ flex: 1, overflow: 'auto', padding: tokens.spacing.md }}>
        {mode === MAP_MODES.NAVIGATE && (
          <>
            <div style={{ display: 'flex', alignItems: 'center', gap: tokens.spacing.lg, marginBottom: tokens.spacing.lg }}>
              <DPadControls position={viewport.position} homePosition={homePosition} onMove={handleMove} onGoHome={() => setViewport(p => ({ ...p, position: homePosition }))} />
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: tokens.fontSize.sm, color: tokens.colors.text.muted, marginBottom: '2px' }}>Current Position</div>
                <div style={{ fontSize: '20px', fontWeight: 700, fontFamily: 'monospace', color: tokens.colors.accent.amber }}>
                  {formatCellRef(viewport.position.row, viewport.position.col)}
                </div>
                <div style={{ fontSize: tokens.fontSize.xs, color: tokens.colors.text.muted, marginTop: '2px' }}>
                  Viewport: {viewport.size.cols}×{viewport.size.rows}
                </div>
              </div>
            </div>
            
            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: tokens.spacing.sm }}>
                <span style={{ fontSize: tokens.fontSize.sm, fontWeight: 600, color: tokens.colors.text.secondary }}>Bookmarks</span>
                <button style={{ padding: '2px 8px', background: tokens.colors.glass.subtle, border: 'none', borderRadius: tokens.radius.md, color: tokens.colors.accent.cyan, cursor: 'pointer', fontSize: tokens.fontSize.xs, display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <Plus size={10} /> Add
                </button>
              </div>
              {filter.applyFilters(bookmarks).map(bm => (
                <div key={bm.id} onClick={() => setViewport(p => ({ ...p, position: bm.position }))} style={{
                  display: 'flex', alignItems: 'center', gap: tokens.spacing.sm,
                  padding: tokens.spacing.sm, marginBottom: tokens.spacing.xs,
                  background: tokens.colors.glass.subtle, border: `1px solid ${tokens.colors.border.subtle}`,
                  borderRadius: tokens.radius.md, cursor: 'pointer',
                }}>
                  {bm.isStarred ? <Star size={12} fill={tokens.colors.accent.amber} style={{ color: tokens.colors.accent.amber }} /> : <Bookmark size={12} style={{ color: tokens.colors.text.muted }} />}
                  <span style={{ flex: 1, fontSize: tokens.fontSize.sm, color: tokens.colors.text.primary }}>{bm.name}</span>
                  <span style={{ fontSize: tokens.fontSize.xs, color: tokens.colors.accent.amber, fontFamily: 'monospace', fontWeight: 600 }}>{formatCellRef(bm.position.row, bm.position.col)}</span>
                </div>
              ))}
            </div>
          </>
        )}
        
        {mode === MAP_MODES.LAYOUT && (
          <>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: tokens.spacing.sm }}>
              <span style={{ fontSize: tokens.fontSize.sm, fontWeight: 600, color: tokens.colors.text.secondary }}>On Canvas</span>
              <span style={{ fontSize: tokens.fontSize.xs, color: tokens.colors.text.muted, background: tokens.colors.glass.medium, padding: '2px 8px', borderRadius: tokens.radius.lg }}>{activeVGs.length}</span>
            </div>
            {activeVGs.map(vg => (
              <div key={vg.id} onClick={() => setSelectedVGId(vg.id)} style={{
                display: 'flex', alignItems: 'center', gap: tokens.spacing.sm,
                padding: tokens.spacing.sm, marginBottom: tokens.spacing.xs,
                background: selectedVGId === vg.id ? tokens.colors.glass.medium : tokens.colors.glass.subtle,
                border: `1px solid ${selectedVGId === vg.id ? vg.color : tokens.colors.border.subtle}`,
                borderRadius: tokens.radius.md, borderLeft: `3px solid ${vg.color}`, cursor: 'pointer',
              }}>
                <span style={{ flex: 1, fontSize: tokens.fontSize.sm, color: tokens.colors.text.primary, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{vg.name}</span>
                <span style={{ fontSize: tokens.fontSize.xs, color: vg.color, fontFamily: 'monospace', fontWeight: 600 }}>{formatCellRef(vg.position.row, vg.position.col)}</span>
                <span style={{ fontSize: tokens.fontSize.xs, color: tokens.colors.text.muted }}>{vg.views?.length || 0}v</span>
              </div>
            ))}
          </>
        )}
        
        {mode === MAP_MODES.LINKS && (
          <>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: tokens.spacing.sm }}>
              <span style={{ fontSize: tokens.fontSize.sm, fontWeight: 600, color: tokens.colors.text.secondary }}>VG Links</span>
              <button style={{ padding: '2px 8px', background: tokens.colors.glass.subtle, border: 'none', borderRadius: tokens.radius.md, color: tokens.colors.accent.cyan, cursor: 'pointer', fontSize: tokens.fontSize.xs, display: 'flex', alignItems: 'center', gap: '4px' }}>
                <Plus size={10} /> Create
              </button>
            </div>
            {links.map(link => {
              const fromVG = viewGroups.find(v => v.id === link.from);
              const toVG = viewGroups.find(v => v.id === link.to);
              const isHighlighted = highlightedLinkId === link.id;
              const color = link.type === 'camera' ? tokens.colors.accent.cyan : tokens.colors.accent.purple;
              return (
                <div key={link.id} onClick={() => setHighlightedLinkId(isHighlighted ? null : link.id)} style={{
                  padding: tokens.spacing.sm, marginBottom: tokens.spacing.xs,
                  background: isHighlighted ? tokens.colors.glass.medium : tokens.colors.glass.subtle,
                  border: `1px solid ${isHighlighted ? color : tokens.colors.border.subtle}`,
                  borderRadius: tokens.radius.md, cursor: 'pointer',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: tokens.spacing.sm, marginBottom: '4px' }}>
                    <div style={{ width: 8, height: 8, borderRadius: '50%', background: fromVG?.color }} />
                    <span style={{ fontSize: tokens.fontSize.sm, color: tokens.colors.text.primary }}>{fromVG?.name}</span>
                    <span style={{ color }}>{link.mode === 'bidirectional' ? '⟷' : '→'}</span>
                    <span style={{ fontSize: tokens.fontSize.sm, color: tokens.colors.text.primary }}>{toVG?.name}</span>
                    <div style={{ width: 8, height: 8, borderRadius: '50%', background: toVG?.color }} />
                  </div>
                  <span style={{ fontSize: tokens.fontSize.xs, padding: '2px 6px', background: `${color}20`, color, borderRadius: tokens.radius.sm }}>{link.type}</span>
                </div>
              );
            })}
          </>
        )}
        
        {mode === MAP_MODES.TEAM && (
          <>
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: tokens.spacing.sm, marginBottom: tokens.spacing.lg,
              background: tokens.colors.glass.subtle, borderRadius: tokens.radius.md,
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: tokens.spacing.sm }}>
                <MousePointer2 size={14} style={{ color: tokens.colors.text.muted }} />
                <span style={{ fontSize: tokens.fontSize.sm, color: tokens.colors.text.primary }}>Show cursors</span>
              </div>
              <button onClick={() => setShowCursors(!showCursors)} style={{
                width: 40, height: 22, borderRadius: 11,
                background: showCursors ? tokens.colors.accent.green : tokens.colors.bg.tertiary,
                border: 'none', cursor: 'pointer', position: 'relative',
              }}>
                <div style={{
                  position: 'absolute', top: 2, left: showCursors ? 20 : 2,
                  width: 18, height: 18, borderRadius: '50%', background: 'white',
                  transition: 'left 0.2s',
                }} />
              </button>
            </div>
            
            <div style={{ fontSize: tokens.fontSize.sm, fontWeight: 600, color: tokens.colors.text.secondary, marginBottom: tokens.spacing.sm }}>
              Online ({collaborators.filter(c => c.isOnline).length})
            </div>
            {collaborators.filter(c => c.isOnline).map(collab => (
              <div key={collab.id} style={{
                display: 'flex', alignItems: 'center', gap: tokens.spacing.sm,
                padding: tokens.spacing.sm, marginBottom: tokens.spacing.xs,
                background: tokens.colors.glass.subtle, border: `1px solid ${tokens.colors.border.subtle}`,
                borderRadius: tokens.radius.md,
              }}>
                <div style={{
                  width: 24, height: 24, borderRadius: '50%', background: collab.color,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '10px', fontWeight: 700, color: 'white',
                }}>
                  {collab.avatar}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: tokens.fontSize.sm, color: tokens.colors.text.primary }}>{collab.name}</div>
                  {collab.isBroadcasting && (
                    <div style={{ fontSize: tokens.fontSize.xs, color: tokens.colors.accent.red, display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <Radio size={10} /> Broadcasting
                    </div>
                  )}
                </div>
                <button style={{ padding: '4px 8px', background: tokens.colors.glass.medium, border: 'none', borderRadius: tokens.radius.sm, color: tokens.colors.accent.blue, cursor: 'pointer', fontSize: tokens.fontSize.xs }}>
                  Follow
                </button>
              </div>
            ))}
          </>
        )}
      </div>
    </div>
  );
};

const CanvasMapV2Complete = () => {
  const [panelWidth, setPanelWidth] = useState(480);
  const [panelHeight, setPanelHeight] = useState(650);
  const [mapMode, setMapMode] = useState(MAP_MODES.LAYOUT);
  const [displayMode, setDisplayMode] = useState(DISPLAY_MODES.VG);
  const [selectedVGId, setSelectedVGId] = useState('vg-1');
  const [highlightedLinkId, setHighlightedLinkId] = useState(null);
  const [showGridLabels, setShowGridLabels] = useState(true);
  const [showGridPaper, setShowGridPaper] = useState(true);
  const [showViewports, setShowViewports] = useState(true);
  const [showCollaborators, setShowCollaborators] = useState(true);
  const [showCursors, setShowCursors] = useState(true);
  const [minimapZoom, setMinimapZoom] = useState(100);
  const [companionOpen, setCompanionOpen] = useState(true);
  const [companionTab, setCompanionTab] = useState(COMPANION_TABS.VIEWS);
  const [viewport, setViewport] = useState(MOCK_VIEWPORT);
  const [homePosition] = useState({ row: 0, col: 0 });
  const [isDraggingViewport] = useState(false);
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });
  
  const filter = useListFilter({
    searchFields: (item) => [item.name, ...(item.views?.map(v => v.name) || []), ...(item.tags || [])],
    quickFilterDefs: QUICK_FILTERS,
  });
  
  const sizeMode = panelWidth < 320 ? 'minimal' : panelWidth < 400 ? 'compact' : 'standard';
  const companionWidth = companionOpen ? 160 : 0;
  const labelSize = 20;
  const padding = 12;
  const dpadWidth = 76;
  
  const availableWidth = panelWidth - companionWidth - padding * 2 - (showGridLabels ? labelSize : 0) - dpadWidth - 8;
  const minimapHeight = Math.floor((panelHeight - 200) * 0.55);
  const availableHeight = minimapHeight - padding * 2 - (showGridLabels ? labelSize : 0);
  const gap = 3;
  
  const cellSizeW = Math.floor((availableWidth - (CANVAS.cols - 1) * gap) / CANVAS.cols);
  const cellSizeH = Math.floor((availableHeight - (CANVAS.rows - 1) * gap) / CANVAS.rows);
  const cellSize = Math.min(50, Math.max(18, Math.min(cellSizeW, cellSizeH)));
  
  const flattenedViews = useMemo(() => flattenViewsToCanvas(MOCK_VIEWGROUPS), []);
  const filteredVGs = filter.applyFilters(MOCK_VIEWGROUPS);
  const visibleVGs = filteredVGs.filter(vg => vg.position);
  
  const handleMove = (dir) => {
    setViewport(prev => ({
      ...prev,
      position: {
        row: Math.max(0, Math.min(CANVAS.rows - prev.size.rows, prev.position.row + (dir === 'up' ? -1 : dir === 'down' ? 1 : 0))),
        col: Math.max(0, Math.min(CANVAS.cols - prev.size.cols, prev.position.col + (dir === 'left' ? -1 : dir === 'right' ? 1 : 0))),
      },
    }));
  };
  
  const handleDragStart = (e, type, data) => {
    e.dataTransfer.setData('application/json', JSON.stringify({ type, data }));
  };
  
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: tokens.spacing.lg, padding: tokens.spacing.xl, background: '#0a0a0f', minHeight: '100vh' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: tokens.spacing.lg, flexWrap: 'wrap', padding: tokens.spacing.md, background: tokens.colors.bg.secondary, borderRadius: tokens.radius.lg }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: tokens.spacing.sm }}>
          <span style={{ fontSize: tokens.fontSize.sm, color: tokens.colors.text.muted }}>Width:</span>
          <input type="range" min="300" max="700" value={panelWidth} onChange={(e) => setPanelWidth(Number(e.target.value))} style={{ width: 100 }} />
          <span style={{ fontSize: tokens.fontSize.sm, color: tokens.colors.text.secondary, minWidth: 45 }}>{panelWidth}px</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: tokens.spacing.sm }}>
          <span style={{ fontSize: tokens.fontSize.sm, color: tokens.colors.text.muted }}>Height:</span>
          <input type="range" min="500" max="900" value={panelHeight} onChange={(e) => setPanelHeight(Number(e.target.value))} style={{ width: 100 }} />
          <span style={{ fontSize: tokens.fontSize.sm, color: tokens.colors.text.secondary, minWidth: 45 }}>{panelHeight}px</span>
        </div>
        <span style={{ padding: '4px 12px', background: tokens.colors.glass.medium, borderRadius: tokens.radius.md, fontSize: tokens.fontSize.sm, color: tokens.colors.accent.blue }}>{sizeMode}</span>
      </div>
      
      <div style={{
        width: panelWidth, height: panelHeight,
        background: tokens.colors.bg.primary,
        borderRadius: tokens.radius.lg,
        border: `1px solid ${tokens.colors.border.default}`,
        overflow: 'hidden', display: 'flex', flexDirection: 'column',
        boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
      }}>
        <div style={{
          display: 'flex', alignItems: 'center', gap: tokens.spacing.sm,
          padding: `${tokens.spacing.sm} ${tokens.spacing.md}`,
          background: tokens.colors.bg.tertiary, borderBottom: `1px solid ${tokens.colors.border.subtle}`,
        }}>
          <Grip size={12} style={{ color: tokens.colors.text.muted }} />
          <Compass size={14} style={{ color: tokens.colors.accent.blue }} />
          <span style={{ flex: 1, fontSize: tokens.fontSize.md, fontWeight: 600, color: tokens.colors.text.primary, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Canvas</span>
          <button style={{ width: 20, height: 20, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'transparent', border: 'none', color: tokens.colors.text.muted, cursor: 'pointer' }}><X size={14} /></button>
        </div>
        
        <ModeTabs activeMode={mapMode} onModeChange={setMapMode} sizeMode={sizeMode} />
        
        <MapToolbar
          displayMode={displayMode} setDisplayMode={setDisplayMode}
          showGridLabels={showGridLabels} toggleGridLabels={() => setShowGridLabels(p => !p)}
          showGridPaper={showGridPaper} toggleGridPaper={() => setShowGridPaper(p => !p)}
          showViewports={showViewports} toggleViewports={() => setShowViewports(p => !p)}
          showCollaborators={showCollaborators} toggleCollaborators={() => setShowCollaborators(p => !p)}
          minimapZoom={minimapZoom}
          onZoomIn={() => setMinimapZoom(p => Math.min(150, p + 10))}
          onZoomOut={() => setMinimapZoom(p => Math.max(50, p - 10))}
          onZoomReset={() => setMinimapZoom(100)}
          companionOpen={companionOpen} toggleCompanion={() => setCompanionOpen(p => !p)}
          sizeMode={sizeMode}
        />
        
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          <div style={{ flex: '55 1 0%', display: 'flex', background: tokens.colors.canvas.bg }}>
            <div style={{ padding: tokens.spacing.sm, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: tokens.spacing.sm }}>
              <DPadControls
                position={viewport.position}
                homePosition={homePosition}
                onMove={handleMove}
                onGoHome={() => setViewport(p => ({ ...p, position: homePosition }))}
                compact={sizeMode === 'compact' || sizeMode === 'minimal'}
              />
              <div style={{
                padding: '4px 8px',
                background: tokens.colors.glass.medium,
                borderRadius: tokens.radius.md,
                fontSize: tokens.fontSize.sm,
                fontFamily: 'monospace',
                fontWeight: 600,
                color: tokens.colors.accent.amber,
              }}>
                {formatCellRef(viewport.position.row, viewport.position.col)}
              </div>
            </div>
            
            <div style={{
              flex: 1,
              position: 'relative',
              background: tokens.colors.canvas.cell,
              borderRadius: tokens.radius.md,
              margin: `${tokens.spacing.sm} ${tokens.spacing.sm} ${tokens.spacing.sm} 0`,
              overflow: 'hidden',
              cursor: 'grab',
            }}>
              <div style={{
                position: 'absolute',
                top: showGridLabels ? labelSize : 0,
                left: showGridLabels ? labelSize : 0,
                transform: `translate(${panOffset.x}px, ${panOffset.y}px)`,
              }}>
                <GridPaperBackground rows={CANVAS.rows} cols={CANVAS.cols} cellSize={cellSize} gap={gap} visible={showGridPaper} />
                
                {mapMode === MAP_MODES.LINKS && (
                  <LinkLines links={MOCK_VG_LINKS} viewGroups={MOCK_VIEWGROUPS} cellSize={cellSize} gap={gap} highlightedId={highlightedLinkId} onLinkClick={setHighlightedLinkId} />
                )}
                
                {displayMode === DISPLAY_MODES.VG && visibleVGs.map(vg => (
                  <VGBlock key={vg.id} vg={vg} cellSize={cellSize} gap={gap} isSelected={selectedVGId === vg.id} onClick={() => setSelectedVGId(vg.id)} />
                ))}
                
                {displayMode === DISPLAY_MODES.VIEW && flattenedViews.map(view => (
                  <ViewCell key={view.id} view={view} cellSize={cellSize} gap={gap} isSelected={selectedVGId === view.vgId} onClick={() => setSelectedVGId(view.vgId)} />
                ))}
                
                {showViewports && (
                  <ViewportIndicator viewport={viewport} cellSize={cellSize} gap={gap} isDragging={isDraggingViewport} onMouseDown={() => {}} />
                )}
                
                {showCollaborators && (
                  <CollaboratorIndicators collaborators={MOCK_COLLABORATORS} cellSize={cellSize} gap={gap} showCursors={showCursors} />
                )}
              </div>
              
              {showGridLabels && (
                <div style={{ position: 'absolute', top: 0, left: labelSize, display: 'flex', height: labelSize }}>
                  {Array.from({ length: CANVAS.cols }).map((_, col) => (
                    <div key={col} style={{
                      width: cellSize, marginRight: col < CANVAS.cols - 1 ? gap : 0,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: tokens.fontSize.xs, fontWeight: 600, color: tokens.colors.accent.amber, fontFamily: 'monospace',
                    }}>
                      {colToLetter(col)}
                    </div>
                  ))}
                </div>
              )}
              
              {showGridLabels && (
                <div style={{ position: 'absolute', top: labelSize, left: 0, display: 'flex', flexDirection: 'column', width: labelSize }}>
                  {Array.from({ length: CANVAS.rows }).map((_, row) => (
                    <div key={row} style={{
                      height: cellSize, marginBottom: row < CANVAS.rows - 1 ? gap : 0,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: tokens.fontSize.xs, fontWeight: 600, color: tokens.colors.accent.amber, fontFamily: 'monospace',
                    }}>
                      {row + 1}
                    </div>
                  ))}
                </div>
              )}
            </div>
            
            <CompanionPanel
              isOpen={companionOpen}
              onClose={() => setCompanionOpen(false)}
              activeTab={companionTab}
              setActiveTab={setCompanionTab}
              viewGroups={MOCK_VIEWGROUPS}
              unplacedViews={MOCK_UNPLACED_VIEWS}
              datasets={MOCK_DATASETS}
              filter={filter}
              onDragStart={handleDragStart}
            />
          </div>
          
          <div style={{ flex: '45 1 0%', borderTop: `1px solid ${tokens.colors.border.subtle}`, background: tokens.colors.bg.secondary, overflow: 'hidden' }}>
            <ContextualPanelContent
              mode={mapMode}
              viewport={viewport}
              setViewport={setViewport}
              homePosition={homePosition}
              viewGroups={MOCK_VIEWGROUPS}
              selectedVGId={selectedVGId}
              setSelectedVGId={setSelectedVGId}
              links={MOCK_VG_LINKS}
              highlightedLinkId={highlightedLinkId}
              setHighlightedLinkId={setHighlightedLinkId}
              collaborators={MOCK_COLLABORATORS}
              showCursors={showCursors}
              setShowCursors={setShowCursors}
              bookmarks={MOCK_BOOKMARKS}
              filter={filter}
              sizeMode={sizeMode}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default CanvasMapV2Complete;
*/