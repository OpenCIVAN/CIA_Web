import React, { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import { 
  Star, Database, Folder, ChevronDown, ChevronRight, 
  File, Box, Search, X, Loader2, GripHorizontal, 
  Upload, Check, HelpCircle, RefreshCw, ArrowUpDown, 
  Filter, ArrowDown, Calendar, FileText,
  Home, RotateCcw, Clock, Sparkles, Image, FileSpreadsheet, FileCode,
  FileArchive, Film, Layers, FolderPlus, Tag, Plus
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
      orange: '#f97316',
    },
    state: {
      stored: 'transparent',
      loading: '#3b82f6',
      loaded: '#34d399',
      processing: '#fbbf24',
    },
  },
};

// =============================================================================
// FILE TYPE CATEGORIES
// =============================================================================
const FILE_TYPE_CATEGORIES = {
  volumetric: { id: 'volumetric', label: 'Volumetric', shortLabel: 'Vol', icon: Database, color: tokens.colors.accent.teal, types: ['nifti', 'dicom', 'nrrd', 'stl'] },
  models: { id: 'models', label: '3D Models', shortLabel: '3D', icon: Box, color: tokens.colors.accent.green, types: ['obj', 'ply', 'gltf'] },
  documents: { id: 'documents', label: 'Docs', shortLabel: 'Docs', icon: FileText, color: tokens.colors.accent.blue, types: ['pdf', 'markdown', 'document'] },
  images: { id: 'images', label: 'Images', shortLabel: 'Img', icon: Image, color: tokens.colors.accent.purple, types: ['image', 'png', 'jpg', 'svg'] },
  data: { id: 'data', label: 'Data', shortLabel: 'Data', icon: FileSpreadsheet, color: tokens.colors.accent.orange, types: ['csv', 'json', 'spreadsheet'] },
  code: { id: 'code', label: 'Code', shortLabel: 'Code', icon: FileCode, color: tokens.colors.accent.green, types: ['python', 'notebook'] },
};

const getCategoryForType = (type) => {
  for (const [catId, cat] of Object.entries(FILE_TYPE_CATEGORIES)) {
    if (cat.types.includes(type)) return catId;
  }
  return 'other';
};

// =============================================================================
// TAG CATEGORIES (Admin-defined)
// =============================================================================
const TAG_CATEGORIES = {
  subject: { id: 'subject', label: 'Subject', color: '#3b82f6', order: 1 },
  phase: { id: 'phase', label: 'Study Phase', color: '#8b5cf6', order: 2 },
  status: { id: 'status', label: 'Status', color: '#f59e0b', order: 3 },
  cohort: { id: 'cohort', label: 'Cohort', color: '#10b981', order: 4 },
  session: { id: 'session', label: 'Session', color: '#ec4899', order: 5 },
  custom: { id: 'custom', label: 'Custom', color: '#6b7280', order: 6 },
};

// =============================================================================
// MOCK TAGS
// =============================================================================
const MOCK_TAGS = [
  // Subject tags
  { id: 'tag-subj-001', name: 'Patient-001', categoryId: 'subject' },
  { id: 'tag-subj-002', name: 'Patient-002', categoryId: 'subject' },
  { id: 'tag-subj-003', name: 'Patient-003', categoryId: 'subject' },
  // Phase tags
  { id: 'tag-preop', name: 'Pre-op', categoryId: 'phase' },
  { id: 'tag-postop', name: 'Post-op', categoryId: 'phase' },
  { id: 'tag-baseline', name: 'Baseline', categoryId: 'phase' },
  { id: 'tag-followup', name: 'Follow-up', categoryId: 'phase' },
  // Status tags
  { id: 'tag-review', name: 'Needs Review', categoryId: 'status' },
  { id: 'tag-approved', name: 'Approved', categoryId: 'status' },
  { id: 'tag-inprogress', name: 'In Progress', categoryId: 'status' },
  // Cohort tags
  { id: 'tag-control', name: 'Control', categoryId: 'cohort' },
  { id: 'tag-experimental', name: 'Experimental', categoryId: 'cohort' },
  { id: 'tag-excluded', name: 'Excluded', categoryId: 'cohort' },
  // Session tags
  { id: 'tag-sess1', name: 'Session 1', categoryId: 'session' },
  { id: 'tag-sess2', name: 'Session 2', categoryId: 'session' },
  // Custom tags
  { id: 'tag-interesting', name: 'Interesting', categoryId: 'custom' },
  { id: 'tag-artifact', name: 'Has Artifact', categoryId: 'custom' },
];

// =============================================================================
// MOCK FOLDERS
// =============================================================================
const MOCK_FOLDERS = [
  { id: 'folder-1', name: 'Raw Scans', parentId: null, color: tokens.colors.accent.teal },
  { id: 'folder-1a', name: 'Session 1', parentId: 'folder-1', color: null },
  { id: 'folder-1b', name: 'Session 2', parentId: 'folder-1', color: null },
  { id: 'folder-2', name: 'Processed', parentId: null, color: tokens.colors.accent.green },
  { id: 'folder-3', name: 'Reports', parentId: null, color: tokens.colors.accent.blue },
  { id: 'folder-4', name: 'Analysis', parentId: null, color: tokens.colors.accent.orange },
  { id: 'folder-5', name: 'Empty Folder', parentId: null, color: tokens.colors.accent.purple },
];

// =============================================================================
// MOCK FILES (with tags!)
// =============================================================================
const MOCK_FILES = [
  { id: 'f1', name: 'brain_scan.nii.gz', type: 'nifti', category: 'volumetric', loadState: 'loaded', size: '45 MB', starred: true, starredAt: '2025-01-20T10:00:00', modifiedAt: '2025-01-20', folderId: 'folder-1', tagIds: ['tag-subj-001', 'tag-preop', 'tag-control', 'tag-approved'] },
  { id: 'f2', name: 'heart_mri.dcm', type: 'dicom', category: 'volumetric', loadState: 'processing', size: '128 MB', starred: true, starredAt: '2025-01-19T14:30:00', modifiedAt: '2025-01-18', folderId: 'folder-1', tagIds: ['tag-subj-001', 'tag-postop', 'tag-control', 'tag-review'] },
  { id: 'f3', name: 'lung_ct.nii', type: 'nifti', category: 'volumetric', loadState: 'stored', size: '89 MB', starred: true, starredAt: '2025-01-18T09:00:00', modifiedAt: '2025-01-15', folderId: 'folder-1a', tagIds: ['tag-subj-002', 'tag-preop', 'tag-experimental', 'tag-sess1'] },
  { id: 'f4', name: 'segmented_brain.nii.gz', type: 'nifti', category: 'volumetric', loadState: 'stored', size: '52 MB', starred: false, modifiedAt: '2025-01-17', folderId: 'folder-2', tagIds: ['tag-subj-001', 'tag-preop', 'tag-control', 'tag-approved', 'tag-interesting'] },
  { id: 'f5', name: 'spine_model.stl', type: 'stl', category: 'volumetric', loadState: 'stored', size: '12 MB', starred: false, modifiedAt: '2025-01-14', folderId: 'folder-2', tagIds: ['tag-subj-003', 'tag-baseline', 'tag-experimental'] },
  { id: 'f6', name: 'project_notes.md', type: 'markdown', category: 'documents', loadState: 'stored', size: '12 KB', starred: true, starredAt: '2025-01-17T16:00:00', modifiedAt: '2025-01-19', folderId: 'folder-3', tagIds: ['tag-approved'] },
  { id: 'f7', name: 'analysis_report.pdf', type: 'pdf', category: 'documents', loadState: 'stored', size: '2.4 MB', starred: false, modifiedAt: '2025-01-14', folderId: 'folder-3', tagIds: ['tag-subj-001', 'tag-preop', 'tag-inprogress'] },
  { id: 'f8', name: 'followup_scan.nii', type: 'nifti', category: 'volumetric', loadState: 'stored', size: '67 MB', starred: false, modifiedAt: '2025-01-12', folderId: 'folder-1b', tagIds: ['tag-subj-002', 'tag-followup', 'tag-experimental', 'tag-sess2', 'tag-artifact'] },
  { id: 'f9', name: 'thumbnail.png', type: 'image', category: 'images', loadState: 'stored', size: '340 KB', starred: true, starredAt: '2025-01-16T11:00:00', modifiedAt: '2025-01-10', folderId: null, tagIds: [] },
  { id: 'f10', name: 'measurements.csv', type: 'csv', category: 'data', loadState: 'stored', size: '1.2 MB', starred: false, modifiedAt: '2025-01-16', folderId: 'folder-4', tagIds: ['tag-subj-001', 'tag-subj-002', 'tag-control', 'tag-experimental'] },
  { id: 'f11', name: 'results.xlsx', type: 'spreadsheet', category: 'data', loadState: 'stored', size: '890 KB', starred: true, starredAt: '2025-01-15T08:00:00', modifiedAt: '2025-01-13', folderId: 'folder-4', tagIds: ['tag-approved'] },
  { id: 'f12', name: 'analysis.py', type: 'python', category: 'code', loadState: 'stored', size: '8 KB', starred: false, modifiedAt: '2025-01-11', folderId: 'folder-4', tagIds: [] },
  { id: 'f13', name: 'excluded_scan.dcm', type: 'dicom', category: 'volumetric', loadState: 'stored', size: '95 MB', starred: false, modifiedAt: '2025-01-09', folderId: 'folder-1', tagIds: ['tag-subj-003', 'tag-baseline', 'tag-excluded', 'tag-artifact'] },
];

const MOCK_STARRED = MOCK_FILES.filter(f => f.starred);

// Project settings (mock)
const PROJECT_SETTINGS = { allowUserTagCreation: true };

// =============================================================================
// HOOKS
// =============================================================================
const useFileTypeAnalysis = (files) => {
  return useMemo(() => {
    const typeCount = {};
    const categoryCount = {};
    files.forEach(file => {
      typeCount[file.type] = (typeCount[file.type] || 0) + 1;
      const category = file.category || getCategoryForType(file.type);
      categoryCount[category] = (categoryCount[category] || 0) + 1;
    });
    const availableCategories = Object.entries(FILE_TYPE_CATEGORIES)
      .filter(([id]) => categoryCount[id] > 0)
      .map(([id, cat]) => ({ ...cat, count: categoryCount[id] }));
    const availableTypes = Object.entries(typeCount).map(([type, count]) => ({
      id: type, label: type.charAt(0).toUpperCase() + type.slice(1), count, category: getCategoryForType(type),
    }));
    return { availableCategories, availableTypes };
  }, [files]);
};

const useTagAnalysis = (files, tags) => {
  return useMemo(() => {
    const tagCounts = {};
    files.forEach(file => {
      (file.tagIds || []).forEach(tagId => {
        tagCounts[tagId] = (tagCounts[tagId] || 0) + 1;
      });
    });
    
    // Group tags by category with counts
    const tagsByCategory = {};
    Object.values(TAG_CATEGORIES).sort((a, b) => a.order - b.order).forEach(cat => {
      tagsByCategory[cat.id] = {
        ...cat,
        tags: tags.filter(t => t.categoryId === cat.id).map(t => ({ ...t, count: tagCounts[t.id] || 0 })),
      };
    });
    
    return { tagCounts, tagsByCategory };
  }, [files, tags]);
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

const FileTypeIcon = ({ category, size = 14 }) => {
  const cat = FILE_TYPE_CATEGORIES[category];
  if (cat) {
    const IconComponent = cat.icon;
    return <IconComponent size={size} strokeWidth={1.5} style={{ color: cat.color }} />;
  }
  return <File size={size} strokeWidth={1.5} style={{ color: tokens.colors.text.muted }} />;
};

// =============================================================================
// TAGS DROPDOWN
// =============================================================================
const TagsDropdown = ({ isOpen, onClose, tags, tagsByCategory, selectedTags, onToggleTag, onCreateTag, allowCreation }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [newTagName, setNewTagName] = useState('');
  const [newTagCategory, setNewTagCategory] = useState('custom');
  const [showCreateForm, setShowCreateForm] = useState(false);
  
  if (!isOpen) return null;
  
  const filteredCategories = Object.entries(tagsByCategory).map(([catId, catData]) => ({
    ...catData,
    tags: catData.tags.filter(t => t.name.toLowerCase().includes(searchQuery.toLowerCase())),
  })).filter(cat => cat.tags.length > 0);
  
  const handleCreate = () => {
    if (newTagName.trim()) {
      onCreateTag({ name: newTagName.trim(), categoryId: newTagCategory });
      setNewTagName('');
      setShowCreateForm(false);
    }
  };

  return (
    <>
      <div className="fixed inset-0 z-40" onClick={onClose} />
      <div className="absolute left-0 top-full mt-1 z-50 rounded-lg shadow-xl w-64 max-h-80 overflow-hidden flex flex-col" style={{ background: tokens.colors.bg.elevated, border: `1px solid ${tokens.colors.border.default}` }}>
        {/* Search */}
        <div className="p-2" style={{ borderBottom: `1px solid ${tokens.colors.border.subtle}` }}>
          <div className="flex items-center gap-2 px-2 py-1 rounded" style={{ background: tokens.colors.bg.glass, border: `1px solid ${tokens.colors.border.subtle}` }}>
            <Search size={12} style={{ color: tokens.colors.text.muted }} />
            <input
              type="text"
              placeholder="Search tags..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex-1 bg-transparent border-none outline-none text-xs"
              style={{ color: tokens.colors.text.primary }}
            />
          </div>
        </div>
        
        {/* Tag list */}
        <div className="flex-1 overflow-auto">
          {filteredCategories.map(cat => (
            <div key={cat.id}>
              <div className="px-3 py-1.5 text-xs font-medium uppercase tracking-wide sticky top-0" style={{ background: tokens.colors.bg.elevated, color: cat.color }}>
                {cat.label}
              </div>
              {cat.tags.map(tag => {
                const isSelected = selectedTags.includes(tag.id);
                return (
                  <button
                    key={tag.id}
                    onClick={() => onToggleTag(tag.id)}
                    className="w-full flex items-center gap-2 px-3 py-1.5 text-xs hover:bg-white/5 transition-all"
                    style={{ color: isSelected ? tokens.colors.text.primary : tokens.colors.text.muted }}
                  >
                    <div className="w-4 h-4 rounded border flex items-center justify-center" style={{ borderColor: cat.color, background: isSelected ? cat.color : 'transparent' }}>
                      {isSelected && <Check size={10} style={{ color: '#fff' }} />}
                    </div>
                    <span className="flex-1 text-left">{tag.name}</span>
                    <span className="opacity-50">{tag.count}</span>
                  </button>
                );
              })}
            </div>
          ))}
          
          {filteredCategories.length === 0 && (
            <div className="p-4 text-center text-xs" style={{ color: tokens.colors.text.muted }}>
              No tags match "{searchQuery}"
            </div>
          )}
        </div>
        
        {/* Create new tag */}
        {allowCreation && (
          <div style={{ borderTop: `1px solid ${tokens.colors.border.subtle}` }}>
            {!showCreateForm ? (
              <button onClick={() => setShowCreateForm(true)} className="w-full flex items-center gap-2 px-3 py-2 text-xs hover:bg-white/5" style={{ color: tokens.colors.accent.blue }}>
                <Plus size={12} /> New Tag
              </button>
            ) : (
              <div className="p-2 space-y-2">
                <input
                  type="text"
                  placeholder="Tag name..."
                  value={newTagName}
                  onChange={(e) => setNewTagName(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
                  autoFocus
                  className="w-full px-2 py-1 rounded text-xs"
                  style={{ background: tokens.colors.bg.glass, border: `1px solid ${tokens.colors.border.default}`, color: tokens.colors.text.primary }}
                />
                <select
                  value={newTagCategory}
                  onChange={(e) => setNewTagCategory(e.target.value)}
                  className="w-full px-2 py-1 rounded text-xs"
                  style={{ background: tokens.colors.bg.glass, border: `1px solid ${tokens.colors.border.default}`, color: tokens.colors.text.primary }}
                >
                  {Object.values(TAG_CATEGORIES).map(cat => (
                    <option key={cat.id} value={cat.id}>{cat.label}</option>
                  ))}
                </select>
                <div className="flex gap-2">
                  <button onClick={() => setShowCreateForm(false)} className="flex-1 py-1 rounded text-xs" style={{ background: tokens.colors.bg.glass, color: tokens.colors.text.muted }}>Cancel</button>
                  <button onClick={handleCreate} disabled={!newTagName.trim()} className="flex-1 py-1 rounded text-xs" style={{ background: tokens.colors.accent.blue, color: 'white', opacity: newTagName.trim() ? 1 : 0.5 }}>Create</button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </>
  );
};

// =============================================================================
// COLLAPSIBLE FILTER BAR (with Tags)
// =============================================================================
const CollapsibleFilterBar = ({ filters, onFiltersChange, availableCategories, availableTypes, tags, tagsByCategory, isExpanded, onToggleExpand }) => {
  const [expandedCategory, setExpandedCategory] = useState(null);
  const [showSortDropdown, setShowSortDropdown] = useState(false);
  const [showTagsDropdown, setShowTagsDropdown] = useState(false);
  const { searchQuery, categoryFilters, typeFilters, tagFilters, sortBy } = filters;
  
  const hasActiveFilters = searchQuery.trim() || categoryFilters.length > 0 || typeFilters.length > 0 || tagFilters.length > 0;
  const activeFilterCount = categoryFilters.length + typeFilters.length + tagFilters.length + (searchQuery ? 1 : 0);
  
  const toggleCategory = (catId) => {
    const newFilters = categoryFilters.includes(catId) ? categoryFilters.filter(c => c !== catId) : [...categoryFilters, catId];
    const typesInCategory = availableTypes.filter(t => t.category === catId).map(t => t.id);
    const newTypeFilters = typeFilters.filter(t => !typesInCategory.includes(t));
    onFiltersChange({ ...filters, categoryFilters: newFilters, typeFilters: newTypeFilters });
  };
  
  const toggleType = (typeId) => {
    const newFilters = typeFilters.includes(typeId) ? typeFilters.filter(t => t !== typeId) : [...typeFilters, typeId];
    onFiltersChange({ ...filters, typeFilters: newFilters });
  };
  
  const toggleTag = (tagId) => {
    const newFilters = tagFilters.includes(tagId) ? tagFilters.filter(t => t !== tagId) : [...tagFilters, tagId];
    onFiltersChange({ ...filters, tagFilters: newFilters });
  };
  
  const clearFilters = () => {
    onFiltersChange({ ...filters, searchQuery: '', categoryFilters: [], typeFilters: [], tagFilters: [] });
  };
  
  const sortOptions = [
    { id: 'name', label: 'Name', icon: ArrowDown },
    { id: 'date', label: 'Date', icon: Calendar },
    { id: 'size', label: 'Size', icon: ArrowDown },
    { id: 'type', label: 'Type', icon: Layers },
  ];
  
  // Get tag info for display
  const selectedTagObjects = tagFilters.map(id => tags.find(t => t.id === id)).filter(Boolean);

  return (
    <div className="flex flex-col" style={{ borderBottom: `1px solid ${tokens.colors.border.subtle}` }}>
      {/* Search row */}
      <div className="flex items-center gap-1.5 px-2 py-1.5">
        <div className="flex-1 flex items-center gap-2 px-2 py-1 rounded-md" style={{ background: tokens.colors.bg.glass, border: `1px solid ${tokens.colors.border.subtle}` }}>
          <Search size={12} style={{ color: tokens.colors.text.muted }} />
          <input type="text" placeholder="Search..." value={searchQuery} onChange={(e) => onFiltersChange({ ...filters, searchQuery: e.target.value })} className="flex-1 bg-transparent border-none outline-none text-xs min-w-0" style={{ color: tokens.colors.text.primary }} />
          {searchQuery && <X size={10} className="cursor-pointer" style={{ color: tokens.colors.text.muted }} onClick={() => onFiltersChange({ ...filters, searchQuery: '' })} />}
        </div>
        
        {/* Filter expand */}
        <button onClick={onToggleExpand} className="flex items-center gap-1 px-1.5 py-1 rounded-md" style={{ background: (categoryFilters.length > 0 || typeFilters.length > 0) ? `${tokens.colors.accent.amber}15` : tokens.colors.bg.glass, border: `1px solid ${(categoryFilters.length > 0 || typeFilters.length > 0) ? tokens.colors.accent.amber + '40' : tokens.colors.border.subtle}`, color: (categoryFilters.length > 0 || typeFilters.length > 0) ? tokens.colors.accent.amber : tokens.colors.text.muted }}>
          <Filter size={11} />
          <ChevronDown size={9} style={{ transform: isExpanded ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
        </button>
        
        {/* Tags dropdown */}
        <div className="relative">
          <button onClick={() => setShowTagsDropdown(!showTagsDropdown)} className="flex items-center gap-1 px-1.5 py-1 rounded-md" style={{ background: tagFilters.length > 0 ? `${tokens.colors.accent.purple}15` : tokens.colors.bg.glass, border: `1px solid ${tagFilters.length > 0 ? tokens.colors.accent.purple + '40' : tokens.colors.border.subtle}`, color: tagFilters.length > 0 ? tokens.colors.accent.purple : tokens.colors.text.muted }}>
            <Tag size={11} />
            {tagFilters.length > 0 && <span className="text-xs font-medium">{tagFilters.length}</span>}
            <ChevronDown size={9} />
          </button>
          <TagsDropdown
            isOpen={showTagsDropdown}
            onClose={() => setShowTagsDropdown(false)}
            tags={tags}
            tagsByCategory={tagsByCategory}
            selectedTags={tagFilters}
            onToggleTag={toggleTag}
            onCreateTag={(newTag) => console.log('Create tag:', newTag)}
            allowCreation={PROJECT_SETTINGS.allowUserTagCreation}
          />
        </div>
        
        {/* Sort */}
        <div className="relative">
          <button onClick={() => setShowSortDropdown(!showSortDropdown)} className="flex items-center gap-1 px-1.5 py-1 rounded-md hover:bg-white/5" style={{ color: tokens.colors.text.muted }}>
            <ArrowUpDown size={11} />
            <span className="text-xs">{sortOptions.find(s => s.id === sortBy)?.label}</span>
          </button>
          {showSortDropdown && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setShowSortDropdown(false)} />
              <div className="absolute right-0 top-full mt-1 z-50 py-1 rounded-lg shadow-xl min-w-24" style={{ background: tokens.colors.bg.elevated, border: `1px solid ${tokens.colors.border.default}` }}>
                {sortOptions.map(opt => (
                  <button key={opt.id} onClick={() => { onFiltersChange({ ...filters, sortBy: opt.id }); setShowSortDropdown(false); }} className="w-full flex items-center gap-2 px-3 py-1.5 text-xs hover:bg-white/5" style={{ color: sortBy === opt.id ? tokens.colors.text.primary : tokens.colors.text.muted }}>
                    {opt.label}
                    {sortBy === opt.id && <Check size={10} className="ml-auto" style={{ color: tokens.colors.accent.green }} />}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
      
      {/* Category chips - collapsible */}
      {isExpanded && (
        <div className="px-2 pb-2">
          <div className="flex flex-wrap gap-1">
            {availableCategories.map(cat => {
              const isActive = categoryFilters.includes(cat.id);
              const hasTypeFilters = typeFilters.some(t => availableTypes.find(at => at.id === t)?.category === cat.id);
              const typesForCat = availableTypes.filter(t => t.category === cat.id);
              const IconComponent = cat.icon;
              return (
                <div key={cat.id} className="relative">
                  <button onClick={() => toggleCategory(cat.id)} onContextMenu={(e) => { e.preventDefault(); setExpandedCategory(expandedCategory === cat.id ? null : cat.id); }} className="flex items-center gap-1 px-1.5 py-0.5 rounded text-xs font-medium" style={{ background: isActive || hasTypeFilters ? `${cat.color}20` : 'transparent', color: isActive || hasTypeFilters ? cat.color : tokens.colors.text.muted, border: `1px solid ${isActive || hasTypeFilters ? cat.color + '40' : 'transparent'}` }} title="Right-click for types">
                    <IconComponent size={10} />
                    <span>{cat.shortLabel}</span>
                    <span className="opacity-50">{cat.count}</span>
                  </button>
                  {expandedCategory === cat.id && typesForCat.length > 0 && (
                    <>
                      <div className="fixed inset-0 z-40" onClick={() => setExpandedCategory(null)} />
                      <div className="absolute left-0 top-full mt-1 z-50 py-1 rounded-lg shadow-xl min-w-28" style={{ background: tokens.colors.bg.elevated, border: `1px solid ${tokens.colors.border.default}` }}>
                        {typesForCat.map(type => (
                          <button key={type.id} onClick={() => toggleType(type.id)} className="w-full flex items-center justify-between gap-2 px-3 py-1.5 text-xs hover:bg-white/5" style={{ color: typeFilters.includes(type.id) ? tokens.colors.text.primary : tokens.colors.text.muted }}>
                            <span>{type.label}</span>
                            <div className="flex items-center gap-1">
                              <span className="opacity-50">{type.count}</span>
                              {typeFilters.includes(type.id) && <Check size={10} style={{ color: cat.color }} />}
                            </div>
                          </button>
                        ))}
                      </div>
                    </>
                  )}
                </div>
              );
            })}
            {(categoryFilters.length > 0 || typeFilters.length > 0) && (
              <button onClick={() => onFiltersChange({ ...filters, categoryFilters: [], typeFilters: [] })} className="flex items-center gap-1 px-1.5 py-0.5 rounded text-xs hover:bg-white/10" style={{ color: tokens.colors.text.muted }}>
                <X size={10} /> Clear
              </button>
            )}
          </div>
        </div>
      )}
      
      {/* Active tag chips */}
      {selectedTagObjects.length > 0 && (
        <div className="flex items-center gap-1 px-2 pb-1.5 flex-wrap">
          <span className="text-xs" style={{ color: tokens.colors.text.muted }}>Tags:</span>
          {selectedTagObjects.map(tag => {
            const cat = TAG_CATEGORIES[tag.categoryId];
            return (
              <span key={tag.id} className="flex items-center gap-1 px-1.5 py-0.5 rounded text-xs" style={{ background: `${cat.color}20`, color: cat.color }}>
                {tag.name}
                <X size={8} className="cursor-pointer opacity-60 hover:opacity-100" onClick={() => toggleTag(tag.id)} />
              </span>
            );
          })}
        </div>
      )}
      
      {/* Filter indicator */}
      {hasActiveFilters && (
        <div className="px-2 pb-1.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1 text-xs px-2 py-0.5 rounded" style={{ background: `${tokens.colors.accent.amber}15`, color: tokens.colors.accent.amber }}>
              <Filter size={8} /> {activeFilterCount} filter{activeFilterCount !== 1 ? 's' : ''} active
            </div>
            <button onClick={clearFilters} className="text-xs px-2 py-0.5 rounded hover:bg-white/10" style={{ color: tokens.colors.text.muted }}>Clear all</button>
          </div>
        </div>
      )}
    </div>
  );
};

// =============================================================================
// FILE ITEM (with tag display)
// =============================================================================
const FileItem = ({ file, tags, showStar = true, compact = false }) => {
  const [isHovered, setIsHovered] = useState(false);
  const canLoad = file.loadState === 'stored' && ['nifti', 'dicom', 'nrrd', 'stl'].includes(file.type);
  const fileTags = (file.tagIds || []).map(id => tags.find(t => t.id === id)).filter(Boolean).slice(0, 2);
  
  return (
    <div className="flex items-center gap-2 px-2 py-1 rounded cursor-pointer transition-all" style={{ background: file.loadState === 'loaded' ? 'rgba(52,211,153,0.04)' : isHovered ? tokens.colors.bg.glassHover : 'transparent', minHeight: compact ? 28 : 32 }} onMouseEnter={() => setIsHovered(true)} onMouseLeave={() => setIsHovered(false)}>
      <FileTypeIcon category={file.category} size={compact ? 12 : 14} />
      <div className="flex-1 min-w-0">
        <span className="text-xs truncate block" style={{ color: tokens.colors.text.primary }}>{file.name}</span>
        {!compact && fileTags.length > 0 && (
          <div className="flex gap-1 mt-0.5">
            {fileTags.map(tag => {
              const cat = TAG_CATEGORIES[tag.categoryId];
              return <span key={tag.id} className="text-xs px-1 rounded" style={{ background: `${cat.color}15`, color: cat.color, fontSize: 9 }}>{tag.name}</span>;
            })}
            {file.tagIds.length > 2 && <span className="text-xs" style={{ color: tokens.colors.text.muted, fontSize: 9 }}>+{file.tagIds.length - 2}</span>}
          </div>
        )}
      </div>
      
      {canLoad && isHovered ? (
        <button className="flex items-center gap-1 px-1.5 py-0.5 rounded text-xs font-medium" style={{ color: tokens.colors.accent.teal, background: `${tokens.colors.accent.teal}15` }}>
          <Upload size={10} /> Load
        </button>
      ) : (
        <LoadStateIndicator state={file.loadState} size={8} />
      )}
      
      {showStar && <Star size={11} fill={file.starred ? tokens.colors.accent.amber : 'none'} stroke={file.starred ? tokens.colors.accent.amber : tokens.colors.text.muted} style={{ opacity: file.starred ? 1 : 0.3, flexShrink: 0 }} />}
      {!compact && <span className="text-xs min-w-9 text-right" style={{ color: tokens.colors.text.muted }}>{file.size}</span>}
    </div>
  );
};

// =============================================================================
// FOLDER ITEM
// =============================================================================
const FolderItem = ({ folder, files, allFolders, tags, expanded, onToggle, depth = 0 }) => {
  const childFolders = allFolders.filter(f => f.parentId === folder.id);
  const childFiles = files.filter(f => f.folderId === folder.id);
  const totalItems = childFolders.length + childFiles.length;
  const isEmpty = totalItems === 0;
  
  return (
    <div>
      <div onClick={onToggle} className="flex items-center gap-2 px-2 py-1 rounded cursor-pointer hover:bg-white/5" style={{ marginLeft: depth * 12 }}>
        {!isEmpty ? (expanded ? <ChevronDown size={10} style={{ color: tokens.colors.text.muted }} /> : <ChevronRight size={10} style={{ color: tokens.colors.text.muted }} />) : <span className="w-2.5" />}
        <Folder size={14} style={{ color: folder.color || tokens.colors.accent.amber }} />
        <span className="flex-1 text-xs font-medium" style={{ color: tokens.colors.text.primary }}>{folder.name}</span>
        {isEmpty ? <span className="text-xs italic" style={{ color: tokens.colors.text.muted }}>empty</span> : <span className="text-xs" style={{ color: tokens.colors.text.muted }}>{totalItems}</span>}
      </div>
      {expanded && !isEmpty && (
        <div>
          {childFolders.map(cf => <FolderItemWrapper key={cf.id} folder={cf} files={files} allFolders={allFolders} tags={tags} depth={depth + 1} />)}
          {childFiles.map(file => <div key={file.id} style={{ marginLeft: (depth + 1) * 12 }}><FileItem file={file} tags={tags} showStar /></div>)}
        </div>
      )}
    </div>
  );
};

const FolderItemWrapper = ({ folder, files, allFolders, tags, depth }) => {
  const [expanded, setExpanded] = useState(depth < 1);
  return <FolderItem folder={folder} files={files} allFolders={allFolders} tags={tags} expanded={expanded} onToggle={() => setExpanded(!expanded)} depth={depth} />;
};

// =============================================================================
// BREADCRUMB
// =============================================================================
const Breadcrumb = ({ path, onNavigate }) => (
  <div className="flex items-center gap-1 px-2 py-1 text-xs overflow-x-auto" style={{ borderBottom: `1px solid ${tokens.colors.border.subtle}` }}>
    <button onClick={() => onNavigate(null)} className="flex items-center gap-1 px-1.5 py-0.5 rounded hover:bg-white/5 flex-shrink-0" style={{ color: path.length === 0 ? tokens.colors.text.primary : tokens.colors.text.muted }}><Home size={10} /><span>Root</span></button>
    {path.map((segment, idx) => (
      <React.Fragment key={segment.id}>
        <ChevronRight size={10} style={{ color: tokens.colors.text.muted }} />
        <button onClick={() => onNavigate(segment.id)} className="px-1.5 py-0.5 rounded hover:bg-white/5 truncate max-w-20" style={{ color: idx === path.length - 1 ? tokens.colors.text.primary : tokens.colors.text.muted }}>{segment.name}</button>
      </React.Fragment>
    ))}
  </div>
);

// =============================================================================
// STARRED SECTION
// =============================================================================
const StarredSection = ({ items, tags, filters, applyFilters, expanded, onToggle, height, onResizeStart }) => {
  const [bypassFilters, setBypassFilters] = useState(false);
  const [starredSort, setStarredSort] = useState('recent');
  const [showSortDropdown, setShowSortDropdown] = useState(false);
  
  const hasGlobalFilters = filters.searchQuery.trim() || filters.categoryFilters.length > 0 || filters.typeFilters.length > 0 || filters.tagFilters.length > 0;
  
  const prevFiltersRef = useRef(filters);
  useEffect(() => {
    if (bypassFilters && hasGlobalFilters) {
      const changed = JSON.stringify(prevFiltersRef.current) !== JSON.stringify(filters);
      if (changed) setBypassFilters(false);
    }
    prevFiltersRef.current = filters;
  }, [filters, bypassFilters, hasGlobalFilters]);
  
  const afterGlobalFilters = useMemo(() => {
    if (bypassFilters || !hasGlobalFilters) return items;
    return applyFilters(items, filters);
  }, [items, filters, applyFilters, bypassFilters, hasGlobalFilters]);
  
  const displayedItems = useMemo(() => {
    const sorted = [...afterGlobalFilters];
    switch (starredSort) {
      case 'recent': return sorted.sort((a, b) => new Date(b.starredAt || 0) - new Date(a.starredAt || 0));
      case 'name': return sorted.sort((a, b) => a.name.localeCompare(b.name));
      case 'modified': return sorted.sort((a, b) => new Date(b.modifiedAt) - new Date(a.modifiedAt));
      default: return sorted;
    }
  }, [afterGlobalFilters, starredSort]);
  
  const hiddenCount = hasGlobalFilters && !bypassFilters ? items.length - afterGlobalFilters.length : 0;
  const isEmpty = items.length === 0;
  
  const sortOptions = [{ id: 'recent', label: 'Recently Starred', icon: Sparkles }, { id: 'name', label: 'Name', icon: ArrowDown }, { id: 'modified', label: 'Modified', icon: Clock }];

  return (
    <div className="flex flex-col flex-shrink-0" style={{ height: expanded && !isEmpty ? height : 'auto', background: bypassFilters ? `${tokens.colors.accent.amber}05` : 'transparent' }}>
      <div className="flex items-center gap-2 px-2 py-1.5 select-none" style={{ background: tokens.colors.bg.glass, borderBottom: `1px solid ${tokens.colors.border.subtle}`, cursor: isEmpty ? 'default' : 'pointer' }}>
        <span onClick={isEmpty ? undefined : onToggle} className="flex items-center gap-2 flex-1">
          {!isEmpty && (expanded ? <ChevronDown size={10} className="text-gray-500" /> : <ChevronRight size={10} className="text-gray-500" />)}
          <Star size={12} style={{ color: tokens.colors.accent.amber }} />
          <span className="text-xs font-semibold" style={{ color: tokens.colors.text.primary }}>Starred</span>
        </span>
        <span className="text-xs" style={{ color: tokens.colors.text.muted }}>{hasGlobalFilters && !bypassFilters ? `${afterGlobalFilters.length}/${items.length}` : items.length}</span>
        {bypassFilters && hasGlobalFilters && <span className="text-xs px-1 py-0.5 rounded" style={{ background: `${tokens.colors.accent.amber}20`, color: tokens.colors.accent.amber }}>All</span>}
        {expanded && !isEmpty && (
          <div className="relative">
            <button onClick={(e) => { e.stopPropagation(); setShowSortDropdown(!showSortDropdown); }} className="p-1 rounded hover:bg-white/10" style={{ color: tokens.colors.text.muted }}><ArrowUpDown size={10} /></button>
            {showSortDropdown && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setShowSortDropdown(false)} />
                <div className="absolute right-0 top-full mt-1 z-50 py-1 rounded-lg shadow-xl min-w-32" style={{ background: tokens.colors.bg.elevated, border: `1px solid ${tokens.colors.border.default}` }}>
                  {sortOptions.map(opt => (
                    <button key={opt.id} onClick={() => { setStarredSort(opt.id); setShowSortDropdown(false); }} className="w-full flex items-center gap-2 px-3 py-1.5 text-xs hover:bg-white/5" style={{ color: starredSort === opt.id ? tokens.colors.text.primary : tokens.colors.text.muted }}>
                      <opt.icon size={10} />{opt.label}{starredSort === opt.id && <Check size={10} className="ml-auto" style={{ color: tokens.colors.accent.amber }} />}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
        )}
      </div>
      {isEmpty && <div className="flex items-center gap-2 px-3 py-2 text-xs" style={{ color: tokens.colors.text.muted }}><Star size={12} style={{ opacity: 0.4 }} />Star files for quick access</div>}
      {expanded && !isEmpty && (
        <>
          <div className="flex-1 overflow-auto px-1 py-1">
            {displayedItems.map(file => <FileItem key={file.id} file={file} tags={tags} showStar={false} compact />)}
            {displayedItems.length === 0 && <div className="flex flex-col items-center py-3 text-xs" style={{ color: tokens.colors.text.muted }}><Search size={16} style={{ opacity: 0.4 }} /><span className="mt-1">No matches</span></div>}
          </div>
          {hiddenCount > 0 && !bypassFilters && <button onClick={() => setBypassFilters(true)} className="flex items-center justify-between px-2 py-1.5 text-xs hover:bg-white/5" style={{ borderTop: `1px solid ${tokens.colors.border.subtle}`, color: tokens.colors.text.muted }}><span>{hiddenCount} hidden</span><span style={{ color: tokens.colors.accent.amber }}>Show all</span></button>}
          {bypassFilters && hasGlobalFilters && <button onClick={() => setBypassFilters(false)} className="flex items-center justify-center gap-1 px-2 py-1.5 text-xs hover:bg-white/5" style={{ borderTop: `1px solid ${tokens.colors.border.subtle}`, color: tokens.colors.accent.amber }}><RotateCcw size={10} />Apply filters</button>}
          <div onMouseDown={onResizeStart} className="h-1 flex items-center justify-center cursor-row-resize hover:bg-white/5" style={{ background: tokens.colors.bg.tertiary }}><GripHorizontal size={10} className="text-gray-600 opacity-50" /></div>
        </>
      )}
    </div>
  );
};

// =============================================================================
// TAB BUTTON & FOOTER
// =============================================================================
const TabButton = ({ active, icon: Icon, label, count, color, onClick }) => (
  <button onClick={onClick} className="flex-1 flex items-center justify-center gap-1 px-2 py-1.5" style={{ background: active ? `${color}10` : 'transparent', borderBottom: `2px solid ${active ? color : 'transparent'}`, color: active ? color : tokens.colors.text.muted }}>
    <Icon size={12} /><span className="text-xs font-medium">{label}</span><span className="text-xs px-1.5 py-0.5 rounded" style={{ background: active ? `${color}20` : 'rgba(255,255,255,0.05)' }}>{count}</span>
  </button>
);

const PanelFooter = ({ onHelp, onUpload, onRefresh, onNewFolder }) => (
  <div className="flex items-center gap-1 px-2 py-1.5 flex-shrink-0" style={{ borderTop: `1px solid ${tokens.colors.border.subtle}`, background: tokens.colors.bg.glass }}>
    <button onClick={onHelp} className="p-1.5 rounded hover:bg-white/10"><HelpCircle size={14} style={{ color: tokens.colors.accent.cyan }} /></button>
    <button onClick={onNewFolder} className="p-1.5 rounded hover:bg-white/10"><FolderPlus size={14} style={{ color: tokens.colors.accent.amber }} /></button>
    <button onClick={onUpload} className="flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded hover:opacity-90" style={{ background: tokens.colors.accent.blue, color: 'white' }}><Upload size={12} /><span className="text-xs font-medium">Upload</span></button>
    <button onClick={onRefresh} className="p-1.5 rounded hover:bg-white/10"><RefreshCw size={14} style={{ color: tokens.colors.text.muted }} /></button>
  </div>
);

// =============================================================================
// MAIN COMPONENT
// =============================================================================
export default function FilesTabV7WithTags() {
  const [containerHeight, setContainerHeight] = useState(580);
  const [containerWidth, setContainerWidth] = useState(340);
  const [starredExpanded, setStarredExpanded] = useState(true);
  const [starredHeight, setStarredHeight] = useState(140);
  const [filterExpanded, setFilterExpanded] = useState(false);
  const [activeTab, setActiveTab] = useState('all');
  const [currentFolderId, setCurrentFolderId] = useState(null);
  const [folders, setFolders] = useState(MOCK_FOLDERS);
  const [tags, setTags] = useState(MOCK_TAGS);
  
  const [filters, setFilters] = useState({ searchQuery: '', categoryFilters: [], typeFilters: [], tagFilters: [], sortBy: 'name' });
  
  const { availableCategories, availableTypes } = useFileTypeAnalysis(MOCK_FILES);
  const { tagsByCategory } = useTagAnalysis(MOCK_FILES, tags);
  
  // Filter function with hybrid AND/OR logic for tags
  const applyFilters = useCallback((items, filterState) => {
    let result = [...items];
    
    // Search
    if (filterState.searchQuery.trim()) {
      const q = filterState.searchQuery.toLowerCase();
      result = result.filter(f => f.name.toLowerCase().includes(q));
    }
    
    // Category filters (OR within)
    if (filterState.categoryFilters.length > 0) {
      result = result.filter(f => filterState.categoryFilters.includes(f.category));
    }
    
    // Type filters (OR within)
    if (filterState.typeFilters.length > 0) {
      result = result.filter(f => filterState.typeFilters.includes(f.type));
    }
    
    // Tag filters - Hybrid AND/OR logic
    if (filterState.tagFilters.length > 0) {
      // Group selected tags by category
      const selectedByCategory = {};
      filterState.tagFilters.forEach(tagId => {
        const tag = tags.find(t => t.id === tagId);
        if (tag) {
          if (!selectedByCategory[tag.categoryId]) selectedByCategory[tag.categoryId] = [];
          selectedByCategory[tag.categoryId].push(tagId);
        }
      });
      
      // File must match: (any tag from cat1) AND (any tag from cat2) AND ...
      result = result.filter(file => {
        return Object.entries(selectedByCategory).every(([catId, catTags]) => {
          // OR within category: file must have at least one of the selected tags in this category
          return catTags.some(tagId => (file.tagIds || []).includes(tagId));
        });
      });
    }
    
    // Sort
    result.sort((a, b) => {
      switch (filterState.sortBy) {
        case 'date': return new Date(b.modifiedAt) - new Date(a.modifiedAt);
        case 'size': return parseInt(b.size) - parseInt(a.size);
        case 'type': return (a.category || '').localeCompare(b.category || '');
        default: return a.name.localeCompare(b.name);
      }
    });
    
    return result;
  }, [tags]);
  
  const handleResizeStart = useCallback((e) => {
    e.preventDefault();
    const startY = e.clientY;
    const startHeight = starredHeight;
    const handleMouseMove = (moveEvent) => setStarredHeight(Math.max(80, Math.min(250, startHeight + (moveEvent.clientY - startY))));
    const handleMouseUp = () => { document.removeEventListener('mousemove', handleMouseMove); document.removeEventListener('mouseup', handleMouseUp); };
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  }, [starredHeight]);
  
  const buildPath = (folderId) => {
    const path = [];
    let current = folders.find(f => f.id === folderId);
    while (current) { path.unshift(current); current = folders.find(f => f.id === current.parentId); }
    return path;
  };
  
  const breadcrumbPath = buildPath(currentFolderId);
  const filteredAllFiles = applyFilters(MOCK_FILES, filters);
  const loadedFiles = MOCK_FILES.filter(f => f.loadState === 'loaded' || f.loadState === 'processing');
  const currentFolderFiles = currentFolderId ? MOCK_FILES.filter(f => f.folderId === currentFolderId) : MOCK_FILES.filter(f => !f.folderId);
  const currentFolderFolders = folders.filter(f => f.parentId === currentFolderId);

  return (
    <div className="min-h-screen p-4" style={{ fontFamily: "'Inter', sans-serif", background: tokens.colors.bg.primary }}>
      <div className="mb-3 text-center">
        <h1 className="text-lg font-bold" style={{ color: tokens.colors.text.primary }}>Files Tab V7 + Tags</h1>
        <p className="text-xs" style={{ color: tokens.colors.text.secondary }}>Hybrid AND/OR tag filtering - Category + Type + Tag filters combine</p>
      </div>
      
      {/* Demo Controls */}
      <div className="mb-3 p-2 rounded-lg max-w-3xl mx-auto" style={{ background: tokens.colors.bg.secondary, border: `1px solid ${tokens.colors.border.subtle}` }}>
        <div className="flex gap-3 items-center flex-wrap justify-between">
          <label className="flex items-center gap-2 text-xs" style={{ color: tokens.colors.text.secondary }}>
            {containerWidth}x{containerHeight}
            <input type="range" min={300} max={400} value={containerWidth} onChange={(e) => setContainerWidth(Number(e.target.value))} className="w-14" />
            <input type="range" min={450} max={700} value={containerHeight} onChange={(e) => setContainerHeight(Number(e.target.value))} className="w-14" />
          </label>
          <div className="flex gap-1.5 flex-wrap">
            <button onClick={() => setFilters({ ...filters, tagFilters: ['tag-preop'] })} className="px-2 py-1 rounded text-xs" style={{ background: `${TAG_CATEGORIES.phase.color}20`, color: TAG_CATEGORIES.phase.color }}>Pre-op</button>
            <button onClick={() => setFilters({ ...filters, tagFilters: ['tag-preop', 'tag-control'] })} className="px-2 py-1 rounded text-xs" style={{ background: `${tokens.colors.accent.green}20`, color: tokens.colors.accent.green }}>Pre-op + Control</button>
            <button onClick={() => setFilters({ ...filters, categoryFilters: ['volumetric'], tagFilters: ['tag-preop'] })} className="px-2 py-1 rounded text-xs" style={{ background: `${tokens.colors.accent.teal}20`, color: tokens.colors.accent.teal }}>Vol + Pre-op</button>
            <button onClick={() => setFilters({ searchQuery: '', categoryFilters: [], typeFilters: [], tagFilters: [], sortBy: 'name' })} className="px-2 py-1 rounded text-xs" style={{ background: tokens.colors.bg.glass, color: tokens.colors.text.muted }}>Clear</button>
          </div>
        </div>
      </div>
      
      <div className="flex gap-4 justify-center items-start flex-wrap">
        {/* Main Panel */}
        <div className="overflow-hidden flex flex-col rounded-lg relative" style={{ width: containerWidth, height: containerHeight, background: tokens.colors.bg.secondary, border: `1px solid ${tokens.colors.border.default}` }}>
          <div className="flex items-center gap-2 px-3 py-2 flex-shrink-0" style={{ borderBottom: `1px solid ${tokens.colors.border.subtle}`, background: `linear-gradient(180deg, ${tokens.colors.accent.blue}10 0%, transparent 100%)` }}>
            <Folder size={14} style={{ color: tokens.colors.accent.blue }} />
            <span className="flex-1 text-xs font-semibold" style={{ color: tokens.colors.text.primary }}>Files</span>
            <span className="text-xs" style={{ color: tokens.colors.text.muted }}>{MOCK_FILES.length}</span>
          </div>
          
          <CollapsibleFilterBar filters={filters} onFiltersChange={setFilters} availableCategories={availableCategories} availableTypes={availableTypes} tags={tags} tagsByCategory={tagsByCategory} isExpanded={filterExpanded} onToggleExpand={() => setFilterExpanded(!filterExpanded)} />
          
          <div className="flex-1 flex flex-col min-h-0">
            <StarredSection items={MOCK_STARRED} tags={tags} filters={filters} applyFilters={applyFilters} expanded={starredExpanded} onToggle={() => setStarredExpanded(!starredExpanded)} height={starredHeight} onResizeStart={handleResizeStart} />
            
            <div className="flex flex-shrink-0" style={{ borderBottom: `1px solid ${tokens.colors.border.subtle}` }}>
              <TabButton active={activeTab === 'all'} icon={Folder} label="All" count={filteredAllFiles.length} color={tokens.colors.accent.blue} onClick={() => setActiveTab('all')} />
              <TabButton active={activeTab === 'loaded'} icon={Database} label="Loaded" count={loadedFiles.length} color={tokens.colors.accent.teal} onClick={() => setActiveTab('loaded')} />
            </div>
            
            {activeTab === 'all' && (
              <div className="flex-1 flex flex-col min-h-0">
                <Breadcrumb path={breadcrumbPath} onNavigate={setCurrentFolderId} />
                <div className="flex-1 overflow-auto p-1">
                  {currentFolderFolders.map(folder => <FolderItemWrapper key={folder.id} folder={folder} files={MOCK_FILES} allFolders={folders} tags={tags} depth={0} />)}
                  {applyFilters(currentFolderFiles, filters).map(file => <FileItem key={file.id} file={file} tags={tags} showStar />)}
                  {currentFolderFolders.length === 0 && currentFolderFiles.length === 0 && <div className="flex flex-col items-center p-4" style={{ color: tokens.colors.text.muted }}><Search size={24} style={{ opacity: 0.4 }} /><span className="text-xs mt-2">Empty folder</span></div>}
                </div>
              </div>
            )}
            {activeTab === 'loaded' && (
              <div className="flex-1 overflow-auto p-1">
                {loadedFiles.length > 0 ? loadedFiles.map(file => <FileItem key={file.id} file={file} tags={tags} showStar />) : <div className="flex flex-col items-center p-4" style={{ color: tokens.colors.text.muted }}><Database size={24} style={{ opacity: 0.4 }} /><span className="text-xs mt-2">No loaded datasets</span></div>}
              </div>
            )}
          </div>
          
          <PanelFooter onHelp={() => {}} onUpload={() => {}} onRefresh={() => {}} onNewFolder={() => {}} />
        </div>
        
        {/* Feature Doc */}
        <div className="p-3 rounded-lg" style={{ width: 300, background: tokens.colors.bg.secondary, border: `1px solid ${tokens.colors.border.subtle}` }}>
          <div className="text-sm font-semibold mb-2" style={{ color: tokens.colors.text.primary }}>Tag System</div>
          <div className="space-y-2 text-xs" style={{ color: tokens.colors.text.secondary }}>
            <div className="p-2 rounded" style={{ background: `${tokens.colors.accent.purple}10` }}>
              <div className="font-medium mb-1" style={{ color: tokens.colors.accent.purple }}>Tag Categories</div>
              <div className="flex flex-wrap gap-1 mt-1">
                {Object.values(TAG_CATEGORIES).map(cat => (
                  <span key={cat.id} className="px-1.5 py-0.5 rounded text-xs" style={{ background: `${cat.color}20`, color: cat.color }}>{cat.label}</span>
                ))}
              </div>
            </div>
            <div className="p-2 rounded" style={{ background: tokens.colors.bg.glass }}>
              <div className="font-medium mb-1" style={{ color: tokens.colors.accent.blue }}>Hybrid AND/OR Logic</div>
              <p className="opacity-80">Within same category: <strong>OR</strong></p>
              <p className="opacity-80">Between categories: <strong>AND</strong></p>
              <p className="mt-1 text-xs opacity-60">e.g., "(Pre-op OR Post-op) AND Control"</p>
            </div>
            <div className="p-2 rounded" style={{ background: tokens.colors.bg.glass }}>
              <div className="font-medium mb-1" style={{ color: tokens.colors.accent.amber }}>Try It</div>
              <ol className="list-decimal ml-4 space-y-0.5 opacity-80">
                <li>Click "Tags" button</li>
                <li>Select "Pre-op" under Phase</li>
                <li>Select "Control" under Cohort</li>
                <li>See files matching BOTH</li>
              </ol>
            </div>
            <div className="p-2 rounded" style={{ background: tokens.colors.bg.glass }}>
              <div className="font-medium mb-1" style={{ color: tokens.colors.accent.green }}>File Tags</div>
              <p className="opacity-80">Tags shown under filename. Max 2 visible + count.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
