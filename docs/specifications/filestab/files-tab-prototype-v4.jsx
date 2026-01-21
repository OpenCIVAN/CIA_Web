import React, { useState, useRef, useCallback, useMemo } from 'react';
import { 
  Star, Database, Folder, ChevronDown, ChevronRight, 
  File, FileImage, Box, Eye, Plus, Search, 
  X, Loader2, GripHorizontal, User, Users, LayoutGrid,
  FolderOpen, Upload, MoreHorizontal, Target,
  ArrowUpRight, ArrowDownLeft, Check, AlertCircle,
  HelpCircle, RefreshCw, ChevronLeft, Info,
  FolderPlus, ArrowUpDown, SlidersHorizontal, List, Grid,
  Clock, Filter, ArrowUp, ArrowDown, Calendar, FileText,
  FolderTree, Home, ChevronUp
} from 'lucide-react';

// =============================================================================
// DESIGN TOKENS
// =============================================================================
const tokens = {
  colors: {
    bg: {
      primary: '#0a0a0f',
      secondary: '#12121a',
      tertiary: '#1a1a24',
      glass: 'rgba(255, 255, 255, 0.03)',
      glassHover: 'rgba(255, 255, 255, 0.06)',
      glassActive: 'rgba(255, 255, 255, 0.08)',
      elevated: '#1e1e2a',
    },
    border: {
      subtle: 'rgba(255, 255, 255, 0.06)',
      default: 'rgba(255, 255, 255, 0.1)',
    },
    text: {
      primary: '#e5e7eb',
      secondary: '#9ca3af',
      muted: '#6b7280',
    },
    accent: {
      amber: '#fbbf24',
      blue: '#3b82f6',
      green: '#34d399',
      teal: '#2dd4bf',
      purple: '#a855f7',
      pink: '#f472b6',
      red: '#ef4444',
      cyan: '#22d3ee',
    },
    state: {
      stored: 'transparent',
      loading: '#3b82f6',
      loaded: '#34d399',
      processing: '#fbbf24',
      error: '#ef4444',
    },
    scope: {
      ephemeral: '#6b7280',
      personal: '#a855f7',
      shared: '#3b82f6',
      workspace: '#34d399',
      project: '#fbbf24',
    }
  },
  spacing: { xs: 4, sm: 8, md: 12, lg: 16, xl: 24 },
  radius: { sm: 4, md: 6, lg: 8, xl: 12 },
  fontSize: { xs: 10, sm: 11, md: 12, lg: 14 },
};

// =============================================================================
// MOCK DATA - Enhanced with folders
// =============================================================================
const MOCK_FOLDERS = [
  { 
    id: 'folder-1', 
    name: 'Raw Scans', 
    parentId: null,
    children: ['f1', 'f2', 'folder-1a'],
  },
  { 
    id: 'folder-1a', 
    name: 'Session 1', 
    parentId: 'folder-1',
    children: ['f3'],
  },
  { 
    id: 'folder-2', 
    name: 'Processed', 
    parentId: null,
    children: ['f4'],
  },
  { 
    id: 'folder-3', 
    name: 'Reports', 
    parentId: null,
    children: ['f5', 'f6'],
  },
];

const MOCK_STARRED = [
  { id: 's1', name: 'brain_scan.nii.gz', type: 'nifti', starred: true, loadState: 'loaded', size: '45 MB', modifiedAt: '2025-01-20' },
  { id: 's2', name: 'project_notes.md', type: 'document', starred: true, loadState: 'stored', size: '12 KB', modifiedAt: '2025-01-19' },
  { id: 's3', name: 'heart_mri.dcm', type: 'dicom', starred: true, loadState: 'processing', size: '128 MB', modifiedAt: '2025-01-18' },
];

const MOCK_LOADED_DATASETS = [
  {
    id: 'd1', name: 'brain_scan.nii.gz', type: 'nifti', loadState: 'loaded', size: '45 MB',
    views: [
      { id: 'v1', name: 'Axial Slice', color: '#3b82f6', active: true, scope: 'workspace', users: 3 },
      { id: 'v2', name: '3D Volume', color: '#a855f7', active: false, scope: 'personal', users: 1 },
      { id: 'v3', name: 'Sagittal View', color: '#34d399', active: true, scope: 'project', users: 8 },
      { id: 'v4', name: 'Working View', color: '#6b7280', active: true, scope: 'ephemeral', users: 1 },
    ]
  },
  {
    id: 'd2', name: 'heart_mri.dcm', type: 'dicom', loadState: 'loaded', size: '128 MB',
    views: [
      { id: 'v5', name: 'Default View', color: '#f472b6', active: true, scope: 'shared', users: 2 },
    ]
  },
];

const MOCK_ALL_FILES = [
  { id: 'f1', name: 'brain_scan.nii.gz', type: 'nifti', loadState: 'loaded', size: '45 MB', starred: true, folderId: 'folder-1', modifiedAt: '2025-01-20' },
  { id: 'f2', name: 'heart_mri.dcm', type: 'dicom', loadState: 'processing', size: '128 MB', starred: true, folderId: 'folder-1', modifiedAt: '2025-01-18' },
  { id: 'f3', name: 'lung_ct.nii', type: 'nifti', loadState: 'stored', size: '89 MB', starred: false, folderId: 'folder-1a', modifiedAt: '2025-01-15' },
  { id: 'f4', name: 'segmented_brain.nii.gz', type: 'nifti', loadState: 'stored', size: '52 MB', starred: false, folderId: 'folder-2', modifiedAt: '2025-01-17' },
  { id: 'f5', name: 'project_notes.md', type: 'document', loadState: 'stored', size: '12 KB', starred: true, folderId: 'folder-3', modifiedAt: '2025-01-19' },
  { id: 'f6', name: 'analysis_report.pdf', type: 'document', loadState: 'stored', size: '2.4 MB', starred: false, folderId: 'folder-3', modifiedAt: '2025-01-14' },
  { id: 'f7', name: 'thumbnail.png', type: 'image', loadState: 'stored', size: '340 KB', starred: false, folderId: null, modifiedAt: '2025-01-10' },
  { id: 'f8', name: 'archived_scan.nii.gz', type: 'nifti', loadState: 'error', size: '67 MB', starred: false, folderId: null, modifiedAt: '2025-01-05' },
];

// =============================================================================
// SCOPE CONFIG
// =============================================================================
const SCOPE_CONFIG = {
  ephemeral: { icon: ({ size = 12, color }) => <div style={{ width: size, height: size, borderRadius: '50%', border: `1.5px dashed ${color || tokens.colors.scope.ephemeral}` }} />, label: 'Unsaved', color: tokens.colors.scope.ephemeral },
  personal: { icon: User, label: 'Personal', color: tokens.colors.scope.personal },
  shared: { icon: Users, label: 'Shared', color: tokens.colors.scope.shared },
  workspace: { icon: LayoutGrid, label: 'Workspace', color: tokens.colors.scope.workspace },
  project: { icon: FolderOpen, label: 'Project', color: tokens.colors.scope.project },
};

// =============================================================================
// ATOMS
// =============================================================================
const LoadStateIndicator = ({ state, size = 8 }) => {
  const color = tokens.colors.state[state] || 'transparent';
  const isAnimated = state === 'loading' || state === 'processing';
  if (state === 'stored') return null;
  return (
    <div className="relative flex-shrink-0" style={{ width: size, height: size }}>
      {isAnimated ? <Loader2 size={size} style={{ color }} className="animate-spin" /> : <div className="rounded-full" style={{ width: size, height: size, backgroundColor: color, boxShadow: `0 0 ${size}px ${color}40` }} />}
    </div>
  );
};

const FileTypeIcon = ({ type, size = 14 }) => {
  const props = { size, strokeWidth: 1.5 };
  switch (type) {
    case 'nifti': case 'dicom': return <Box {...props} style={{ color: tokens.colors.accent.teal }} />;
    case 'image': return <FileImage {...props} style={{ color: tokens.colors.accent.purple }} />;
    case 'document': return <FileText {...props} style={{ color: tokens.colors.accent.blue }} />;
    default: return <File {...props} style={{ color: tokens.colors.accent.blue }} />;
  }
};

const ColorDot = ({ color, size = 8, glow = false }) => (
  <div className="rounded-full flex-shrink-0" style={{ width: size, height: size, backgroundColor: color, boxShadow: glow ? `0 0 ${size}px ${color}60` : 'none' }} />
);

const ScopeIndicator = ({ scope, size = 12 }) => {
  const config = SCOPE_CONFIG[scope];
  if (!config) return null;
  const IconComponent = config.icon;
  return (
    <div className="flex items-center gap-1 flex-shrink-0" title={config.label}>
      {typeof IconComponent === 'function' && !IconComponent.prototype?.render 
        ? <IconComponent size={size} color={config.color} />
        : <IconComponent size={size} style={{ color: config.color }} />}
    </div>
  );
};

// =============================================================================
// MOLECULES
// =============================================================================

// Search Bar
const SearchBar = ({ value, onChange, placeholder = "Search..." }) => (
  <div className="flex items-center gap-2 px-2 py-1.5 mx-2 my-1.5 rounded-md" style={{ background: tokens.colors.bg.glass, border: `1px solid ${tokens.colors.border.subtle}` }}>
    <Search size={12} style={{ color: tokens.colors.text.muted }} />
    <input
      type="text"
      placeholder={placeholder}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="flex-1 bg-transparent border-none outline-none text-[11px]"
      style={{ color: tokens.colors.text.primary }}
    />
    {value && <X size={12} style={{ color: tokens.colors.text.muted, cursor: 'pointer' }} onClick={() => onChange('')} />}
  </div>
);

// Filter Chips
const FilterChips = ({ options, activeFilters, onChange, singleSelect = false }) => (
  <div className="flex gap-1 px-2 py-1 flex-wrap">
    {options.map(opt => {
      const isActive = singleSelect ? activeFilters === opt.id : activeFilters.includes(opt.id);
      return (
        <button
          key={opt.id}
          onClick={() => onChange(opt.id)}
          className="px-2 py-0.5 rounded text-[10px] font-medium transition-all flex items-center gap-1"
          style={{
            background: isActive ? (opt.color ? `${opt.color}20` : 'rgba(255,255,255,0.12)') : 'transparent',
            color: isActive ? (opt.color || tokens.colors.text.primary) : tokens.colors.text.muted,
            border: isActive ? `1px solid ${opt.color || 'rgba(255,255,255,0.2)'}` : '1px solid transparent',
          }}
        >
          {opt.icon && <opt.icon size={10} />}
          {opt.label}
          {opt.count !== undefined && <span className="opacity-60 text-[9px]">({opt.count})</span>}
        </button>
      );
    })}
  </div>
);

// Sort Dropdown
const SortDropdown = ({ value, onChange, options }) => {
  const [isOpen, setIsOpen] = useState(false);
  const current = options.find(o => o.id === value);
  
  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-1 px-2 py-1 rounded text-[10px] transition-all hover:bg-white/5"
        style={{ color: tokens.colors.text.muted }}
      >
        <ArrowUpDown size={10} />
        <span>{current?.label || 'Sort'}</span>
        <ChevronDown size={10} />
      </button>
      
      {isOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
          <div 
            className="absolute right-0 top-full mt-1 z-50 py-1 rounded-lg shadow-xl min-w-[120px]"
            style={{ background: tokens.colors.bg.elevated, border: `1px solid ${tokens.colors.border.default}` }}
          >
            {options.map(opt => (
              <button
                key={opt.id}
                onClick={() => { onChange(opt.id); setIsOpen(false); }}
                className="w-full flex items-center gap-2 px-3 py-2 text-[11px] transition-all hover:bg-white/5"
                style={{ color: value === opt.id ? tokens.colors.text.primary : tokens.colors.text.muted }}
              >
                {opt.icon && <opt.icon size={12} />}
                {opt.label}
                {value === opt.id && <Check size={12} className="ml-auto" style={{ color: tokens.colors.accent.green }} />}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
};

// View Mode Toggle
const ViewModeToggle = ({ value, onChange }) => (
  <div className="flex rounded overflow-hidden" style={{ border: `1px solid ${tokens.colors.border.subtle}` }}>
    <button
      onClick={() => onChange('list')}
      className="p-1.5 transition-all"
      style={{ background: value === 'list' ? tokens.colors.bg.glassActive : 'transparent', color: value === 'list' ? tokens.colors.text.primary : tokens.colors.text.muted }}
    >
      <List size={12} />
    </button>
    <button
      onClick={() => onChange('grid')}
      className="p-1.5 transition-all"
      style={{ background: value === 'grid' ? tokens.colors.bg.glassActive : 'transparent', color: value === 'grid' ? tokens.colors.text.primary : tokens.colors.text.muted }}
    >
      <Grid size={12} />
    </button>
  </div>
);

// File Item (List View)
const FileItemList = ({ file, showStar = true, showFolder = false, indent = 0, onToggleStar, onLoad }) => {
  const [isHovered, setIsHovered] = useState(false);
  const canLoad = file.loadState === 'stored' && (file.type === 'nifti' || file.type === 'dicom');
  
  return (
    <div 
      className="flex items-center gap-2 px-3 py-1.5 rounded cursor-pointer transition-all"
      style={{ 
        background: file.loadState === 'loaded' ? 'rgba(52,211,153,0.04)' : isHovered ? tokens.colors.bg.glassHover : 'transparent',
        marginLeft: indent * 16,
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <FileTypeIcon type={file.type} size={14} />
      <span className="flex-1 text-[11px] truncate" style={{ color: tokens.colors.text.primary }}>{file.name}</span>
      
      {canLoad && isHovered ? (
        <button
          onClick={(e) => { e.stopPropagation(); onLoad?.(file.id); }}
          className="flex items-center gap-1 px-2 py-0.5 rounded text-[9px] font-medium"
          style={{ color: tokens.colors.accent.teal, background: `${tokens.colors.accent.teal}15` }}
        >
          <Upload size={10} /> Load
        </button>
      ) : (
        <LoadStateIndicator state={file.loadState} size={8} />
      )}
      
      {showStar && (
        <Star 
          size={12} 
          fill={file.starred ? tokens.colors.accent.amber : 'none'}
          stroke={file.starred ? tokens.colors.accent.amber : tokens.colors.text.muted}
          style={{ opacity: file.starred ? 1 : 0.4, cursor: 'pointer' }}
          onClick={(e) => { e.stopPropagation(); onToggleStar?.(file.id); }}
        />
      )}
      <span className="text-[9px] min-w-[40px] text-right" style={{ color: tokens.colors.text.muted }}>{file.size}</span>
    </div>
  );
};

// Folder Item
const FolderItem = ({ folder, files, allFolders, expanded, onToggle, depth = 0, onFileLoad, onToggleStar }) => {
  const childFolders = allFolders.filter(f => f.parentId === folder.id);
  const childFiles = files.filter(f => f.folderId === folder.id);
  const totalItems = childFolders.length + childFiles.length;
  
  return (
    <div>
      <div 
        onClick={onToggle}
        className="flex items-center gap-2 px-3 py-1.5 rounded cursor-pointer transition-all hover:bg-white/5"
        style={{ marginLeft: depth * 16 }}
      >
        {expanded ? <ChevronDown size={10} className="text-gray-500" /> : <ChevronRight size={10} className="text-gray-500" />}
        <Folder size={14} style={{ color: tokens.colors.accent.amber }} />
        <span className="flex-1 text-[11px] font-medium" style={{ color: tokens.colors.text.primary }}>{folder.name}</span>
        <span className="text-[9px]" style={{ color: tokens.colors.text.muted }}>{totalItems}</span>
      </div>
      
      {expanded && (
        <div>
          {childFolders.map(childFolder => (
            <FolderItemWrapper 
              key={childFolder.id} 
              folder={childFolder} 
              files={files}
              allFolders={allFolders}
              depth={depth + 1}
              onFileLoad={onFileLoad}
              onToggleStar={onToggleStar}
            />
          ))}
          {childFiles.map(file => (
            <FileItemList 
              key={file.id} 
              file={file} 
              indent={depth + 1} 
              onLoad={onFileLoad}
              onToggleStar={onToggleStar}
            />
          ))}
        </div>
      )}
    </div>
  );
};

// Folder wrapper with state
const FolderItemWrapper = ({ folder, files, allFolders, depth, onFileLoad, onToggleStar }) => {
  const [expanded, setExpanded] = useState(depth < 1); // Auto-expand first level
  return (
    <FolderItem 
      folder={folder} 
      files={files}
      allFolders={allFolders}
      expanded={expanded} 
      onToggle={() => setExpanded(!expanded)}
      depth={depth}
      onFileLoad={onFileLoad}
      onToggleStar={onToggleStar}
    />
  );
};

// Breadcrumb Navigation
const Breadcrumb = ({ path, onNavigate }) => (
  <div className="flex items-center gap-1 px-2 py-1.5 text-[10px] overflow-x-auto" style={{ borderBottom: `1px solid ${tokens.colors.border.subtle}` }}>
    <button 
      onClick={() => onNavigate(null)}
      className="flex items-center gap-1 px-1.5 py-0.5 rounded hover:bg-white/5 flex-shrink-0"
      style={{ color: path.length === 0 ? tokens.colors.text.primary : tokens.colors.text.muted }}
    >
      <Home size={10} />
      <span>Root</span>
    </button>
    {path.map((segment, idx) => (
      <React.Fragment key={segment.id}>
        <ChevronRight size={10} style={{ color: tokens.colors.text.muted }} className="flex-shrink-0" />
        <button 
          onClick={() => onNavigate(segment.id)}
          className="px-1.5 py-0.5 rounded hover:bg-white/5 truncate max-w-[80px] flex-shrink-0"
          style={{ color: idx === path.length - 1 ? tokens.colors.text.primary : tokens.colors.text.muted }}
        >
          {segment.name}
        </button>
      </React.Fragment>
    ))}
  </div>
);

// Section Header (Resizable)
const SectionHeader = ({ icon: Icon, label, count, color, expanded, onToggle, collapsible = true, disabled = false }) => (
  <div
    onClick={collapsible && !disabled ? onToggle : undefined}
    className="flex items-center gap-2 px-3 py-2 select-none"
    style={{ 
      background: tokens.colors.bg.glass, 
      borderBottom: `1px solid ${tokens.colors.border.subtle}`, 
      cursor: collapsible && !disabled ? 'pointer' : 'default',
      opacity: disabled ? 0.5 : 1,
    }}
  >
    {collapsible && (expanded ? <ChevronDown size={10} className="text-gray-500" /> : <ChevronRight size={10} className="text-gray-500" />)}
    <Icon size={12} style={{ color }} />
    <span className="flex-1 text-[11px] font-semibold" style={{ color: tokens.colors.text.primary }}>{label}</span>
    <span className="text-[10px]" style={{ color: tokens.colors.text.muted }}>{count}</span>
  </div>
);

// Resize Handle
const ResizeHandle = ({ onMouseDown }) => (
  <div
    onMouseDown={onMouseDown}
    className="h-1.5 flex items-center justify-center cursor-row-resize transition-colors hover:bg-white/5"
    style={{ background: tokens.colors.bg.tertiary, borderTop: `1px solid ${tokens.colors.border.subtle}`, borderBottom: `1px solid ${tokens.colors.border.subtle}` }}
  >
    <GripHorizontal size={12} className="text-gray-600 opacity-50" />
  </div>
);

// Empty State
const EmptyState = ({ icon: Icon, title, subtitle, small = false }) => (
  <div className={`flex flex-col items-center justify-center gap-2 ${small ? 'py-4' : 'p-6'}`} style={{ color: tokens.colors.text.muted }}>
    <Icon size={small ? 24 : 32} strokeWidth={1} style={{ opacity: 0.4 }} />
    <span className={`${small ? 'text-[11px]' : 'text-[12px]'} font-medium`}>{title}</span>
    {subtitle && <span className={`${small ? 'text-[10px]' : 'text-[11px]'} opacity-60 text-center`}>{subtitle}</span>}
  </div>
);

// Tab Button
const TabButton = ({ active, icon: Icon, label, count, color, onClick, showLabel = true }) => (
  <button
    onClick={onClick}
    className="flex-1 flex items-center justify-center gap-1 px-3 py-2 transition-all"
    style={{
      background: active ? `${color}10` : 'transparent',
      borderBottom: `2px solid ${active ? color : 'transparent'}`,
      color: active ? color : tokens.colors.text.muted,
      fontSize: 11, fontWeight: 500,
    }}
  >
    <Icon size={12} />
    {showLabel && label && <span>{label}</span>}
    {count !== undefined && (
      <span className="text-[9px] px-1.5 py-0.5 rounded" style={{ background: active ? `${color}20` : 'rgba(255,255,255,0.08)', color: active ? color : tokens.colors.text.muted }}>
        {count}
      </span>
    )}
  </button>
);

// Panel Footer
const PanelFooter = ({ onHelp, onUpload, onRefresh }) => (
  <div className="flex items-center gap-2 px-3 py-2 flex-shrink-0" style={{ borderTop: `1px solid ${tokens.colors.border.subtle}`, background: tokens.colors.bg.glass }}>
    <button onClick={onHelp} className="flex items-center justify-center p-2 rounded-lg transition-all hover:bg-white/10" style={{ minWidth: 36, minHeight: 36 }} title="Help">
      <HelpCircle size={16} style={{ color: tokens.colors.accent.cyan }} />
    </button>
    <button onClick={onUpload} className="flex-1 flex items-center justify-center gap-2 py-2 rounded-lg transition-all hover:opacity-90" style={{ background: tokens.colors.accent.blue, color: 'white', minHeight: 36 }}>
      <Upload size={14} />
      <span className="text-[11px] font-medium">Upload Files</span>
    </button>
    <button onClick={onRefresh} className="flex items-center justify-center p-2 rounded-lg transition-all hover:bg-white/10" style={{ minWidth: 36, minHeight: 36 }} title="Refresh">
      <RefreshCw size={16} style={{ color: tokens.colors.text.muted }} />
    </button>
  </div>
);

// =============================================================================
// ORGANISMS
// =============================================================================

// Starred Section
const StarredSection = ({ items, expanded, onToggle, height, onResizeStart, onToggleStar }) => {
  const [filter, setFilter] = useState('all');
  
  const filterOptions = [
    { id: 'all', label: 'All', count: items.length },
    { id: 'datasets', label: 'Datasets', icon: Box, count: items.filter(f => f.type === 'nifti' || f.type === 'dicom').length, color: tokens.colors.accent.teal },
    { id: 'files', label: 'Files', icon: FileText, count: items.filter(f => f.type === 'document' || f.type === 'image').length, color: tokens.colors.accent.blue },
  ];
  
  const filteredItems = useMemo(() => {
    if (filter === 'all') return items;
    if (filter === 'datasets') return items.filter(f => f.type === 'nifti' || f.type === 'dicom');
    return items.filter(f => f.type === 'document' || f.type === 'image');
  }, [items, filter]);

  const isEmpty = items.length === 0;

  return (
    <div className="flex flex-col flex-shrink-0" style={{ height: expanded && !isEmpty ? height : 'auto', minHeight: expanded && !isEmpty ? 80 : 'auto' }}>
      <SectionHeader icon={Star} label="Starred" count={items.length} color={tokens.colors.accent.amber} expanded={expanded} onToggle={onToggle} collapsible={!isEmpty} disabled={isEmpty} />
      
      {isEmpty && (
        <div className="flex items-center gap-2 px-3 py-2" style={{ background: tokens.colors.bg.glass }}>
          <Star size={12} style={{ color: tokens.colors.text.muted, opacity: 0.4 }} />
          <span className="text-[10px]" style={{ color: tokens.colors.text.muted }}>Star files for quick access</span>
        </div>
      )}
      
      {expanded && !isEmpty && (
        <>
          <FilterChips options={filterOptions} activeFilters={filter} onChange={setFilter} singleSelect />
          <div className="flex-1 overflow-auto px-1">
            {filteredItems.map(file => <FileItemList key={file.id} file={file} showStar={false} onToggleStar={onToggleStar} />)}
          </div>
          <ResizeHandle onMouseDown={onResizeStart} />
        </>
      )}
    </div>
  );
};

// Dataset Tree Item
const DatasetTreeItem = ({ dataset, expanded, onToggle }) => (
  <div>
    <div onClick={onToggle} className="flex items-center gap-2 px-3 py-2 rounded cursor-pointer transition-all hover:bg-white/5" style={{ background: tokens.colors.bg.glass }}>
      {expanded ? <ChevronDown size={12} className="text-gray-500" /> : <ChevronRight size={12} className="text-gray-500" />}
      <Database size={14} style={{ color: tokens.colors.accent.teal }} />
      <span className="flex-1 text-[11px] font-medium truncate" style={{ color: tokens.colors.text.primary }}>{dataset.name}</span>
      <Check size={10} style={{ color: tokens.colors.accent.green }} />
      <span className="text-[10px] px-1.5 py-0.5 rounded bg-white/5" style={{ color: tokens.colors.text.muted }}>{dataset.views.length}</span>
    </div>
    
    {expanded && (
      <div className="ml-5 mt-0.5">
        {dataset.views.map(view => (
          <div key={view.id} className="flex items-center gap-2 px-3 py-1.5 rounded cursor-pointer transition-all hover:bg-white/5 ml-2" style={{ borderLeft: `2px solid ${view.color}40` }}>
            <ColorDot color={view.color} size={8} glow={view.active} />
            <Eye size={12} className="text-gray-500" />
            <span className="flex-1 text-[11px] truncate" style={{ color: tokens.colors.text.secondary }}>{view.name}</span>
            <ScopeIndicator scope={view.scope} size={10} />
            {view.active && <span className="text-[8px] px-1 py-0.5 rounded uppercase" style={{ background: `${tokens.colors.accent.green}20`, color: tokens.colors.accent.green }}>Active</span>}
          </div>
        ))}
        <button className="flex items-center gap-1 px-3 py-1.5 ml-2 text-[10px] opacity-60 hover:opacity-100" style={{ color: tokens.colors.text.muted }}>
          <Plus size={10} /><span>Create View</span>
        </button>
      </div>
    )}
  </div>
);

// Tabbed Files Browser
const TabbedFilesBrowser = ({ loadedDatasets, allFiles, folders, activeTab, onTabChange }) => {
  const [expandedDatasets, setExpandedDatasets] = useState(new Set(['d1']));
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('name');
  const [viewMode, setViewMode] = useState('list');
  const [typeFilters, setTypeFilters] = useState([]);
  const [currentFolderId, setCurrentFolderId] = useState(null);
  
  const toggleDataset = (id) => {
    setExpandedDatasets(prev => { const next = new Set(prev); next.has(id) ? next.delete(id) : next.add(id); return next; });
  };
  
  const toggleTypeFilter = (type) => {
    setTypeFilters(prev => prev.includes(type) ? prev.filter(t => t !== type) : [...prev, type]);
  };
  
  const sortOptions = [
    { id: 'name', label: 'Name', icon: ArrowDown },
    { id: 'date', label: 'Date Modified', icon: Calendar },
    { id: 'size', label: 'Size', icon: ArrowUp },
    { id: 'type', label: 'Type', icon: FileText },
  ];
  
  const typeFilterOptions = [
    { id: 'nifti', label: 'NIfTI', color: tokens.colors.accent.teal },
    { id: 'dicom', label: 'DICOM', color: tokens.colors.accent.teal },
    { id: 'document', label: 'Docs', color: tokens.colors.accent.blue },
    { id: 'image', label: 'Images', color: tokens.colors.accent.purple },
  ];
  
  // Build breadcrumb path
  const buildPath = (folderId) => {
    const path = [];
    let current = folders.find(f => f.id === folderId);
    while (current) {
      path.unshift(current);
      current = folders.find(f => f.id === current.parentId);
    }
    return path;
  };
  
  const breadcrumbPath = buildPath(currentFolderId);
  const rootFolders = folders.filter(f => f.parentId === (currentFolderId || null));
  const rootFiles = allFiles.filter(f => f.folderId === currentFolderId);
  
  // Filter and sort files
  const filteredFiles = useMemo(() => {
    let result = rootFiles;
    
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = allFiles.filter(f => f.name.toLowerCase().includes(q));
    }
    
    if (typeFilters.length > 0) {
      result = result.filter(f => typeFilters.includes(f.type));
    }
    
    // Sort
    result.sort((a, b) => {
      switch (sortBy) {
        case 'date': return new Date(b.modifiedAt) - new Date(a.modifiedAt);
        case 'size': return parseInt(b.size) - parseInt(a.size);
        case 'type': return a.type.localeCompare(b.type);
        default: return a.name.localeCompare(b.name);
      }
    });
    
    return result;
  }, [rootFiles, allFiles, searchQuery, typeFilters, sortBy]);

  return (
    <div className="flex flex-col flex-1 min-h-0">
      {/* Tabs */}
      <div className="flex flex-shrink-0" style={{ borderBottom: `1px solid ${tokens.colors.border.subtle}` }}>
        <TabButton active={activeTab === 'loaded'} icon={Database} label="Loaded" count={loadedDatasets.length} color={tokens.colors.accent.teal} onClick={() => onTabChange('loaded')} />
        <TabButton active={activeTab === 'all'} icon={Folder} label="All Files" count={allFiles.length} color={tokens.colors.accent.blue} onClick={() => onTabChange('all')} />
      </div>
      
      {/* All Files Tab Content */}
      {activeTab === 'all' && (
        <>
          {/* Breadcrumb */}
          <Breadcrumb path={breadcrumbPath} onNavigate={setCurrentFolderId} />
          
          {/* Search */}
          <SearchBar value={searchQuery} onChange={setSearchQuery} placeholder="Search files..." />
          
          {/* Toolbar: Filters + Sort + View Mode */}
          <div className="flex items-center justify-between px-2 py-1" style={{ borderBottom: `1px solid ${tokens.colors.border.subtle}` }}>
            <FilterChips options={typeFilterOptions} activeFilters={typeFilters} onChange={toggleTypeFilter} />
            <div className="flex items-center gap-2">
              <SortDropdown value={sortBy} onChange={setSortBy} options={sortOptions} />
              <ViewModeToggle value={viewMode} onChange={setViewMode} />
            </div>
          </div>
          
          {/* File List */}
          <div className="flex-1 overflow-auto p-1">
            {/* Folders first */}
            {!searchQuery && rootFolders.map(folder => (
              <FolderItemWrapper 
                key={folder.id} 
                folder={folder} 
                files={allFiles}
                allFolders={folders}
                depth={0}
              />
            ))}
            
            {/* Then files */}
            {filteredFiles.length > 0 ? (
              filteredFiles.map(file => <FileItemList key={file.id} file={file} showStar />)
            ) : searchQuery ? (
              <EmptyState icon={Search} title="No files found" subtitle={`No results for "${searchQuery}"`} small />
            ) : null}
          </div>
        </>
      )}
      
      {/* Loaded Datasets Tab Content */}
      {activeTab === 'loaded' && (
        <div className="flex-1 overflow-auto p-1">
          {loadedDatasets.length > 0 ? (
            loadedDatasets.map(ds => (
              <DatasetTreeItem key={ds.id} dataset={ds} expanded={expandedDatasets.has(ds.id)} onToggle={() => toggleDataset(ds.id)} />
            ))
          ) : (
            <EmptyState icon={Database} title="No datasets loaded" subtitle="in this workspace" />
          )}
        </div>
      )}
    </div>
  );
};

// Compact Mode Panel
const CompactFilesPanel = ({ starredFiles, loadedDatasets, allFiles, folders, containerWidth }) => {
  const [activeTab, setActiveTab] = useState(starredFiles.length > 0 ? 'starred' : 'loaded');
  const [expandedDatasets, setExpandedDatasets] = useState(new Set(['d1']));
  const [searchQuery, setSearchQuery] = useState('');
  
  const toggleDataset = (id) => { setExpandedDatasets(prev => { const next = new Set(prev); next.has(id) ? next.delete(id) : next.add(id); return next; }); };
  
  const showLabels = containerWidth > 280;
  
  const filteredFiles = useMemo(() => {
    if (!searchQuery.trim()) return allFiles;
    return allFiles.filter(f => f.name.toLowerCase().includes(searchQuery.toLowerCase()));
  }, [allFiles, searchQuery]);

  return (
    <div className="flex flex-col h-full">
      {/* 3-Tab Bar */}
      <div className="flex flex-shrink-0" style={{ borderBottom: `1px solid ${tokens.colors.border.subtle}` }}>
        <TabButton active={activeTab === 'starred'} icon={Star} label={showLabels ? "Starred" : ""} count={starredFiles.length} color={tokens.colors.accent.amber} onClick={() => setActiveTab('starred')} showLabel={showLabels} />
        <TabButton active={activeTab === 'loaded'} icon={Database} label={showLabels ? "Loaded" : ""} count={loadedDatasets.length} color={tokens.colors.accent.teal} onClick={() => setActiveTab('loaded')} showLabel={showLabels} />
        <TabButton active={activeTab === 'all'} icon={Folder} label={showLabels ? "All" : ""} count={allFiles.length} color={tokens.colors.accent.blue} onClick={() => setActiveTab('all')} showLabel={showLabels} />
      </div>
      
      {/* Search (for All tab) */}
      {activeTab === 'all' && <SearchBar value={searchQuery} onChange={setSearchQuery} placeholder="Search..." />}
      
      {/* Content */}
      <div className="flex-1 overflow-auto p-1">
        {activeTab === 'starred' && (
          starredFiles.length > 0 
            ? starredFiles.map(file => <FileItemList key={file.id} file={file} showStar={false} />)
            : <EmptyState icon={Star} title="No starred items" small />
        )}
        {activeTab === 'loaded' && (
          loadedDatasets.length > 0 
            ? loadedDatasets.map(ds => <DatasetTreeItem key={ds.id} dataset={ds} expanded={expandedDatasets.has(ds.id)} onToggle={() => toggleDataset(ds.id)} />)
            : <EmptyState icon={Database} title="No datasets loaded" small />
        )}
        {activeTab === 'all' && (
          filteredFiles.length > 0 
            ? filteredFiles.map(file => <FileItemList key={file.id} file={file} showStar />)
            : <EmptyState icon={Folder} title="No files found" small />
        )}
      </div>
    </div>
  );
};

// =============================================================================
// MAIN COMPONENT
// =============================================================================
export default function FilesTabPrototypeV4() {
  const [containerHeight, setContainerHeight] = useState(550);
  const [containerWidth, setContainerWidth] = useState(340);
  const [starredExpanded, setStarredExpanded] = useState(true);
  const [starredHeight, setStarredHeight] = useState(140);
  const [activeTab, setActiveTab] = useState('all');
  const [isResizing, setIsResizing] = useState(false);
  
  const COMPACT_THRESHOLD = 300;
  const isCompactMode = containerHeight < COMPACT_THRESHOLD;
  
  const handleResizeStart = useCallback((e) => {
    e.preventDefault();
    setIsResizing(true);
    const startY = e.clientY;
    const startHeight = starredHeight;
    
    const handleMouseMove = (moveEvent) => {
      const delta = moveEvent.clientY - startY;
      setStarredHeight(Math.max(80, Math.min(250, startHeight + delta)));
    };
    
    const handleMouseUp = () => {
      setIsResizing(false);
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
    
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  }, [starredHeight]);

  return (
    <div className="min-h-screen p-6" style={{ fontFamily: "'Inter', sans-serif", background: tokens.colors.bg.primary }}>
      {/* Header */}
      <div className="mb-6 text-center">
        <h1 className="text-xl font-bold mb-2" style={{ color: tokens.colors.text.primary }}>
          Files Tab V4 - Complete Feature Set
        </h1>
        <p className="text-[13px]" style={{ color: tokens.colors.text.secondary }}>
          Folders, search, filter, sort, starred section, responsive modes
        </p>
      </div>
      
      {/* Demo Controls */}
      <div className="mb-6 p-4 rounded-lg max-w-[700px] mx-auto" style={{ background: tokens.colors.bg.secondary, border: `1px solid ${tokens.colors.border.subtle}` }}>
        <div className="text-[12px] font-semibold mb-3" style={{ color: tokens.colors.text.primary }}>🎛️ Demo Controls</div>
        <div className="flex gap-6 items-center flex-wrap">
          <label className="flex items-center gap-2 text-[11px]" style={{ color: tokens.colors.text.secondary }}>
            Height:
            <input type="range" min={200} max={650} value={containerHeight} onChange={(e) => setContainerHeight(Number(e.target.value))} className="w-28" />
            <span className="min-w-[45px] font-semibold" style={{ color: isCompactMode ? tokens.colors.accent.amber : tokens.colors.accent.green }}>{containerHeight}px</span>
          </label>
          <label className="flex items-center gap-2 text-[11px]" style={{ color: tokens.colors.text.secondary }}>
            Width:
            <input type="range" min={260} max={400} value={containerWidth} onChange={(e) => setContainerWidth(Number(e.target.value))} className="w-28" />
            <span className="min-w-[45px] font-semibold" style={{ color: tokens.colors.text.primary }}>{containerWidth}px</span>
          </label>
          <span className="px-2.5 py-1 rounded text-[10px] font-semibold" style={{ 
            background: isCompactMode ? `${tokens.colors.accent.amber}20` : `${tokens.colors.accent.green}20`,
            color: isCompactMode ? tokens.colors.accent.amber : tokens.colors.accent.green 
          }}>
            {isCompactMode ? '📱 Compact' : '🖥️ Full'}
          </span>
        </div>
      </div>
      
      <div className="flex gap-8 justify-center items-start flex-wrap">
        {/* Files Tab Panel */}
        <div 
          className="overflow-hidden flex flex-col rounded-lg"
          style={{
            width: containerWidth, 
            height: containerHeight,
            background: tokens.colors.bg.secondary,
            border: `1px solid ${tokens.colors.border.default}`,
            transition: isResizing ? 'none' : 'all 0.3s ease',
          }}
        >
          {/* Panel Header */}
          <div className="flex items-center gap-2 px-3 py-2 flex-shrink-0" style={{ borderBottom: `1px solid ${tokens.colors.border.subtle}`, background: `linear-gradient(180deg, ${tokens.colors.accent.blue}15 0%, transparent 100%)` }}>
            <Folder size={14} style={{ color: tokens.colors.accent.blue }} />
            <span className="flex-1 text-[12px] font-semibold" style={{ color: tokens.colors.text.primary }}>Files</span>
            <span className="text-[10px]" style={{ color: tokens.colors.text.muted }}>{MOCK_ALL_FILES.length} total</span>
          </div>
          
          {/* Content */}
          <div className="flex-1 flex flex-col min-h-0">
            {isCompactMode ? (
              <CompactFilesPanel 
                starredFiles={MOCK_STARRED} 
                loadedDatasets={MOCK_LOADED_DATASETS} 
                allFiles={MOCK_ALL_FILES}
                folders={MOCK_FOLDERS}
                containerWidth={containerWidth}
              />
            ) : (
              <>
                <StarredSection 
                  items={MOCK_STARRED} 
                  expanded={starredExpanded} 
                  onToggle={() => setStarredExpanded(!starredExpanded)} 
                  height={starredHeight} 
                  onResizeStart={handleResizeStart}
                />
                <TabbedFilesBrowser 
                  loadedDatasets={MOCK_LOADED_DATASETS} 
                  allFiles={MOCK_ALL_FILES}
                  folders={MOCK_FOLDERS}
                  activeTab={activeTab} 
                  onTabChange={setActiveTab} 
                />
              </>
            )}
          </div>
          
          {/* Footer */}
          <PanelFooter 
            onHelp={() => console.log('Help')}
            onUpload={() => console.log('Upload')}
            onRefresh={() => console.log('Refresh')}
          />
        </div>
        
        {/* Feature Summary */}
        <div className="p-5 rounded-lg" style={{ width: 320, background: tokens.colors.bg.secondary, border: `1px solid ${tokens.colors.border.subtle}` }}>
          <div className="text-[13px] font-semibold mb-4" style={{ color: tokens.colors.text.primary }}>✨ V4 Features</div>
          
          <div className="space-y-3 text-[11px]" style={{ color: tokens.colors.text.secondary }}>
            <div className="p-3 rounded-lg" style={{ background: tokens.colors.bg.glass }}>
              <div className="font-medium mb-1 flex items-center gap-2" style={{ color: tokens.colors.accent.amber }}>
                <Star size={12} /> Starred Section
              </div>
              <p>Resizable top section with filter chips (All/Datasets/Files)</p>
            </div>
            
            <div className="p-3 rounded-lg" style={{ background: tokens.colors.bg.glass }}>
              <div className="font-medium mb-1 flex items-center gap-2" style={{ color: tokens.colors.accent.amber }}>
                <FolderTree size={12} /> Folder System
              </div>
              <p>Nested folders with breadcrumb navigation. Project-level organization.</p>
            </div>
            
            <div className="p-3 rounded-lg" style={{ background: tokens.colors.bg.glass }}>
              <div className="font-medium mb-1 flex items-center gap-2" style={{ color: tokens.colors.accent.blue }}>
                <Search size={12} /> Search
              </div>
              <p>Search across all files. Clears folder context when searching.</p>
            </div>
            
            <div className="p-3 rounded-lg" style={{ background: tokens.colors.bg.glass }}>
              <div className="font-medium mb-1 flex items-center gap-2" style={{ color: tokens.colors.accent.purple }}>
                <Filter size={12} /> Filter & Sort
              </div>
              <p>Filter by type (NIfTI, DICOM, Docs, Images). Sort by name, date, size, type.</p>
            </div>
            
            <div className="p-3 rounded-lg" style={{ background: tokens.colors.bg.glass }}>
              <div className="font-medium mb-1 flex items-center gap-2" style={{ color: tokens.colors.accent.green }}>
                <LayoutGrid size={12} /> View Modes
              </div>
              <p>List and grid views (grid not fully implemented in prototype).</p>
            </div>
            
            <div className="p-3 rounded-lg" style={{ background: tokens.colors.bg.glass }}>
              <div className="font-medium mb-1 flex items-center gap-2" style={{ color: tokens.colors.accent.cyan }}>
                <HelpCircle size={12} /> Footer Actions
              </div>
              <p>Help, Upload Files, Refresh buttons always accessible.</p>
            </div>
          </div>
        </div>
      </div>
      
      {/* Folder Structure Reference */}
      <div className="mt-8 p-5 rounded-lg max-w-[700px] mx-auto" style={{ background: tokens.colors.bg.secondary, border: `1px solid ${tokens.colors.border.subtle}` }}>
        <div className="text-[13px] font-semibold mb-3" style={{ color: tokens.colors.text.primary }}>📁 Folder Structure (Project-Level)</div>
        <div className="font-mono text-[11px] leading-relaxed p-3 rounded" style={{ background: tokens.colors.bg.glass, color: tokens.colors.text.secondary }}>
          <div><span style={{ color: tokens.colors.accent.amber }}>📁</span> Raw Scans/</div>
          <div className="ml-4"><span style={{ color: tokens.colors.accent.amber }}>📁</span> Session 1/</div>
          <div className="ml-8"><span style={{ color: tokens.colors.accent.teal }}>📦</span> lung_ct.nii</div>
          <div className="ml-4"><span style={{ color: tokens.colors.accent.teal }}>📦</span> brain_scan.nii.gz <span style={{ color: tokens.colors.accent.green }}>●</span></div>
          <div className="ml-4"><span style={{ color: tokens.colors.accent.teal }}>📦</span> heart_mri.dcm <span style={{ color: tokens.colors.accent.amber }}>●</span></div>
          <div><span style={{ color: tokens.colors.accent.amber }}>📁</span> Processed/</div>
          <div className="ml-4"><span style={{ color: tokens.colors.accent.teal }}>📦</span> segmented_brain.nii.gz</div>
          <div><span style={{ color: tokens.colors.accent.amber }}>📁</span> Reports/</div>
          <div className="ml-4"><span style={{ color: tokens.colors.accent.blue }}>📄</span> project_notes.md</div>
          <div className="ml-4"><span style={{ color: tokens.colors.accent.blue }}>📄</span> analysis_report.pdf</div>
          <div><span style={{ color: tokens.colors.accent.purple }}>🖼️</span> thumbnail.png <span className="text-[9px] opacity-60">(unfiled)</span></div>
        </div>
      </div>
    </div>
  );
}
