# Files Tab V2 Implementation Handoff for Claude Code

## Quick Start

You're implementing the redesigned Files Tab V7 with Tags for CIA Web. This builds on the original handoff with significant new features.

**Reference Files:**
- `Files_Tab_Claude_Code_Handoff.md` - Original handoff (still valid for base concepts)
- `Files_Tab_Redesign_Session_Memory_Log.md` - Full design documentation
- `FilesTabV7WithTags.jsx` - **NEW** Complete visual reference prototype
- Existing: `src/ui/react/components/panels/LeftPanel/tabs/FilesTab/`

---

## What's New in V7

| Feature | Description |
|---------|-------------|
| **Collapsible Filter Bar** | Search always visible, category chips collapse to save space |
| **Folder System** | Nested folders with breadcrumb navigation |
| **Tag System** | Project-level tags with categories for research organization |
| **Hybrid AND/OR Filtering** | Smart tag filtering logic for research workflows |
| **File-Level Tag Display** | Tags shown as colored chips under filenames |
| **Tag Creation** | On-the-fly tag creation when admin-enabled |

---

## Layout Overview (V7)

```
┌─────────────────────────────────────┐
│ 📁 Files                   13 total │  ← Header
├─────────────────────────────────────┤
│ 🔍 [Search...    ] [⚙][🏷][↕Name]  │  ← Search + Filter + Tags + Sort
│ [Vol][3D][Docs][Img][Data]  Clear   │  ← Collapsible category chips
│ Tags: [Pre-op ×] [Control ×]        │  ← Active tag chips
│ ⚠ 3 filters active      Clear all   │  ← Filter indicator
├─────────────────────────────────────┤
│ ▼ ⭐ Starred               3/6  All │  ← Filter-aware with bypass
│   file list (compact)...            │
│   [3 hidden] [Show all →]           │
│ ═══════════════════════════════════ │  ← Resize handle
├─────────────────────────────────────┤
│ [📁 All (8)] [📦 Loaded (2)]        │  ← Tabs with filtered counts
├─────────────────────────────────────┤
│ 🏠 Root > Raw Scans                 │  ← Breadcrumb navigation
│   📁 Session 1              3       │  ← Nested folders
│   📁 Session 2              2       │
│   📄 brain_scan.nii.gz    45 MB     │  ← Files with tags
│       [Pre-op] [Control]            │
├─────────────────────────────────────┤
│ [?]  [📁+] [   ⬆ Upload   ]   [⟳]  │  ← Footer with Help + NewFolder
└─────────────────────────────────────┘
```

---

## Data Models

### Tag Category (Admin-defined)

```typescript
interface TagCategory {
  id: string;           // 'phase', 'cohort', 'status', etc.
  label: string;        // 'Study Phase'
  color: string;        // '#8b5cf6'
  order: number;        // Display order
  projectId: string;    // Scope to project
}

// Default categories (admins can customize)
const DEFAULT_TAG_CATEGORIES = {
  subject: { label: 'Subject', color: '#3b82f6', order: 1 },
  phase: { label: 'Study Phase', color: '#8b5cf6', order: 2 },
  status: { label: 'Status', color: '#f59e0b', order: 3 },
  cohort: { label: 'Cohort', color: '#10b981', order: 4 },
  session: { label: 'Session', color: '#ec4899', order: 5 },
  custom: { label: 'Custom', color: '#6b7280', order: 99 },
};
```

### Tag

```typescript
interface Tag {
  id: string;           // 'tag-preop'
  name: string;         // 'Pre-op'
  categoryId: string;   // References TagCategory.id
  projectId: string;    // Scope to project
  createdBy: string;    // User ID who created
  createdAt: string;    // ISO timestamp
}
```

### File (Extended)

```typescript
interface FileItem {
  id: string;
  name: string;
  type: string;         // 'nifti', 'dicom', 'pdf', etc.
  category: string;     // 'volumetric', 'documents', etc.
  loadState: 'stored' | 'loading' | 'loaded' | 'processing' | 'error';
  size: string;
  folderId: string | null;  // Parent folder or null for root
  tagIds: string[];         // Array of Tag IDs (NEW)
  starred: boolean;
  starredAt?: string;
  modifiedAt: string;
}
```

### Folder

```typescript
interface Folder {
  id: string;
  name: string;
  parentId: string | null;  // null = root level
  color: string | null;     // Optional custom color
  projectId: string;
  createdBy: string;
  createdAt: string;
}
```

### Project Settings

```typescript
interface ProjectSettings {
  allowUserTagCreation: boolean;  // Can non-admins create tags?
  // ... other settings
}
```

### Filter State

```typescript
interface FilterState {
  searchQuery: string;
  categoryFilters: string[];  // File type categories: ['volumetric', 'documents']
  typeFilters: string[];      // Specific types: ['nifti', 'dicom']
  tagFilters: string[];       // Tag IDs: ['tag-preop', 'tag-control']
  sortBy: 'name' | 'date' | 'size' | 'type';
  sortOrder: 'asc' | 'desc';
}
```

---

## New Components to Create

### Atoms

| Component | Purpose | Key Props |
|-----------|---------|-----------|
| `TagChip` | Displays a single tag | `tag`, `category`, `onRemove?`, `size` |
| `TagCheckbox` | Checkbox for tag selection | `tag`, `category`, `checked`, `onChange`, `count` |

### Molecules

| Component | Purpose | Key Props |
|-----------|---------|-----------|
| `TagsDropdown` | Categorized tag selector | `isOpen`, `tags`, `tagsByCategory`, `selectedTags`, `onToggle`, `onClose`, `allowCreation`, `onCreateTag` |
| `CollapsibleFilterBar` | Search + collapsible filters | `filters`, `onFiltersChange`, `availableCategories`, `tags`, `tagsByCategory`, `isExpanded`, `onToggleExpand` |
| `ActiveTagChips` | Row of selected tag chips | `selectedTags`, `onRemoveTag`, `onClearAll` |
| `NewFolderDialog` | Modal for folder creation | `isOpen`, `onClose`, `onSubmit`, `folders`, `currentFolderId` |
| `HelpPanel` | Contextual help floating card | `isOpen`, `onClose` |

### Organisms

| Component | Purpose |
|-----------|---------|
| `FilesTabV7` | Main container with all new features |

---

## Critical Implementation Details

### 1. Hybrid AND/OR Tag Filter Logic

This is the **most important** new logic. Research teams need intuitive filtering:

```typescript
/**
 * Tag Filter Logic:
 * - OR within same tag category (Pre-op OR Post-op)
 * - AND between different tag categories (Pre-op AND Control)
 * - AND with file type categories (Volumetric AND Pre-op)
 */
const applyTagFilters = (files: FileItem[], tagFilters: string[], tags: Tag[]): FileItem[] => {
  if (tagFilters.length === 0) return files;
  
  // Group selected tags by their category
  const selectedByCategory: Record<string, string[]> = {};
  tagFilters.forEach(tagId => {
    const tag = tags.find(t => t.id === tagId);
    if (tag) {
      if (!selectedByCategory[tag.categoryId]) {
        selectedByCategory[tag.categoryId] = [];
      }
      selectedByCategory[tag.categoryId].push(tagId);
    }
  });
  
  // Filter: file must match ALL categories (AND)
  // Within each category, file must match ANY selected tag (OR)
  return files.filter(file => {
    const fileTags = file.tagIds || [];
    
    return Object.entries(selectedByCategory).every(([categoryId, categoryTagIds]) => {
      // OR within category: file must have at least one of these tags
      return categoryTagIds.some(tagId => fileTags.includes(tagId));
    });
  });
};
```

**Example:**
```
Selected tags: [Pre-op, Post-op] (both in "Phase" category)
               [Control] (in "Cohort" category)

Logic: (Pre-op OR Post-op) AND Control

File with tags [Pre-op, Control] → ✅ PASS
File with tags [Post-op, Control] → ✅ PASS  
File with tags [Pre-op, Experimental] → ❌ FAIL (no Control)
File with tags [Baseline, Control] → ❌ FAIL (no Pre-op or Post-op)
```

### 2. Tag Analysis Hook

```typescript
const useTagAnalysis = (files: FileItem[], tags: Tag[]) => {
  return useMemo(() => {
    // Count files per tag
    const tagCounts: Record<string, number> = {};
    files.forEach(file => {
      (file.tagIds || []).forEach(tagId => {
        tagCounts[tagId] = (tagCounts[tagId] || 0) + 1;
      });
    });
    
    // Group tags by category with counts
    const tagsByCategory: Record<string, TagCategoryWithTags> = {};
    Object.values(TAG_CATEGORIES)
      .sort((a, b) => a.order - b.order)
      .forEach(cat => {
        tagsByCategory[cat.id] = {
          ...cat,
          tags: tags
            .filter(t => t.categoryId === cat.id)
            .map(t => ({ ...t, count: tagCounts[t.id] || 0 })),
        };
      });
    
    return { tagCounts, tagsByCategory };
  }, [files, tags]);
};
```

### 3. Tags Dropdown Component

```tsx
const TagsDropdown = ({
  isOpen,
  onClose,
  tags,
  tagsByCategory,
  selectedTags,
  onToggleTag,
  allowCreation,
  onCreateTag,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newTagName, setNewTagName] = useState('');
  const [newTagCategory, setNewTagCategory] = useState('custom');
  
  if (!isOpen) return null;
  
  // Filter tags by search
  const filteredCategories = Object.entries(tagsByCategory)
    .map(([catId, catData]) => ({
      ...catData,
      tags: catData.tags.filter(t => 
        t.name.toLowerCase().includes(searchQuery.toLowerCase())
      ),
    }))
    .filter(cat => cat.tags.length > 0);
  
  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 z-40" onClick={onClose} />
      
      {/* Dropdown */}
      <div className="absolute left-0 top-full mt-1 z-50 w-64 max-h-80 ...">
        {/* Search */}
        <SearchInput value={searchQuery} onChange={setSearchQuery} />
        
        {/* Tag list by category */}
        <div className="overflow-auto">
          {filteredCategories.map(cat => (
            <div key={cat.id}>
              <CategoryHeader label={cat.label} color={cat.color} />
              {cat.tags.map(tag => (
                <TagCheckbox
                  key={tag.id}
                  tag={tag}
                  category={cat}
                  checked={selectedTags.includes(tag.id)}
                  onChange={() => onToggleTag(tag.id)}
                  count={tag.count}
                />
              ))}
            </div>
          ))}
        </div>
        
        {/* Create new tag (if allowed) */}
        {allowCreation && (
          <CreateTagForm
            show={showCreateForm}
            onToggle={() => setShowCreateForm(!showCreateForm)}
            name={newTagName}
            onNameChange={setNewTagName}
            category={newTagCategory}
            onCategoryChange={setNewTagCategory}
            onSubmit={() => {
              onCreateTag({ name: newTagName, categoryId: newTagCategory });
              setNewTagName('');
              setShowCreateForm(false);
            }}
          />
        )}
      </div>
    </>
  );
};
```

### 4. Help Panel Implementation

```tsx
interface HelpPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

const HelpPanel = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'filters' | 'shortcuts'>('overview');
  
  if (!isOpen) return null;
  
  return (
    <FloatingCard
      title="Files Help"
      icon={<HelpCircle />}
      color={tokens.colors.accent.cyan}
      onClose={onClose}
    >
      {/* Tab bar */}
      <div className="flex border-b">
        <TabButton active={activeTab === 'overview'} onClick={() => setActiveTab('overview')}>
          Overview
        </TabButton>
        <TabButton active={activeTab === 'filters'} onClick={() => setActiveTab('filters')}>
          Filters & Tags
        </TabButton>
        <TabButton active={activeTab === 'shortcuts'} onClick={() => setActiveTab('shortcuts')}>
          Shortcuts
        </TabButton>
      </div>
      
      {/* Tab content */}
      <div className="p-4">
        {activeTab === 'overview' && <HelpOverviewContent />}
        {activeTab === 'filters' && <HelpFiltersContent />}
        {activeTab === 'shortcuts' && <HelpShortcutsContent />}
      </div>
    </FloatingCard>
  );
};

const HelpOverviewContent = () => (
  <div className="space-y-4 text-sm">
    <section>
      <h3 className="font-semibold mb-2">File Organization</h3>
      <ul className="space-y-1 text-muted">
        <li>• <strong>Starred</strong> - Quick access to important files</li>
        <li>• <strong>All Files</strong> - Browse folders and files</li>
        <li>• <strong>Loaded</strong> - Currently active datasets</li>
      </ul>
    </section>
    
    <section>
      <h3 className="font-semibold mb-2">File States</h3>
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-transparent border border-gray-500" />
          <span>Stored - Available to load</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-blue-500" />
          <span>Loading - Being loaded into memory</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-green-500" />
          <span>Loaded - Ready for visualization</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-amber-500" />
          <span>Processing - Server computation active</span>
        </div>
      </div>
    </section>
    
    <section>
      <h3 className="font-semibold mb-2">Quick Actions</h3>
      <ul className="space-y-1 text-muted">
        <li>• Click ⭐ to star/unstar files</li>
        <li>• Hover volumetric files for "Load" button</li>
        <li>• Click folders to expand/collapse</li>
        <li>• Use breadcrumbs to navigate up</li>
      </ul>
    </section>
  </div>
);

const HelpFiltersContent = () => (
  <div className="space-y-4 text-sm">
    <section>
      <h3 className="font-semibold mb-2">Category Filters</h3>
      <p className="text-muted mb-2">
        Click category chips to filter by file type. Right-click for specific types.
      </p>
      <div className="flex flex-wrap gap-1">
        <span className="px-2 py-1 rounded text-xs bg-teal-500/20 text-teal-400">Vol</span>
        <span className="px-2 py-1 rounded text-xs bg-green-500/20 text-green-400">3D</span>
        <span className="px-2 py-1 rounded text-xs bg-blue-500/20 text-blue-400">Docs</span>
        <span className="px-2 py-1 rounded text-xs bg-purple-500/20 text-purple-400">Img</span>
      </div>
    </section>
    
    <section>
      <h3 className="font-semibold mb-2">Tag Filtering</h3>
      <p className="text-muted mb-2">
        Tags use smart AND/OR logic:
      </p>
      <ul className="space-y-1 text-muted">
        <li>• <strong>Within category</strong>: OR (Pre-op OR Post-op)</li>
        <li>• <strong>Between categories</strong>: AND (Pre-op AND Control)</li>
      </ul>
      <div className="mt-2 p-2 rounded bg-glass text-xs">
        Example: Select "Pre-op" + "Post-op" (Phase) and "Control" (Cohort)<br/>
        Result: Files that are (Pre-op OR Post-op) AND in Control group
      </div>
    </section>
    
    <section>
      <h3 className="font-semibold mb-2">Starred Filter Bypass</h3>
      <p className="text-muted">
        When filters hide starred items, click "Show all" to temporarily bypass 
        filters in the Starred section. Changing filters re-applies them.
      </p>
    </section>
  </div>
);

const HelpShortcutsContent = () => (
  <div className="space-y-4 text-sm">
    <section>
      <h3 className="font-semibold mb-2">Keyboard Shortcuts</h3>
      <div className="space-y-2">
        <div className="flex justify-between">
          <span className="text-muted">Search files</span>
          <kbd className="px-2 py-1 rounded bg-glass text-xs">/</kbd>
        </div>
        <div className="flex justify-between">
          <span className="text-muted">Clear filters</span>
          <kbd className="px-2 py-1 rounded bg-glass text-xs">Esc</kbd>
        </div>
        <div className="flex justify-between">
          <span className="text-muted">Toggle starred section</span>
          <kbd className="px-2 py-1 rounded bg-glass text-xs">S</kbd>
        </div>
        <div className="flex justify-between">
          <span className="text-muted">New folder</span>
          <kbd className="px-2 py-1 rounded bg-glass text-xs">N</kbd>
        </div>
        <div className="flex justify-between">
          <span className="text-muted">Upload files</span>
          <kbd className="px-2 py-1 rounded bg-glass text-xs">U</kbd>
        </div>
      </div>
    </section>
    
    <section>
      <h3 className="font-semibold mb-2">Mouse Actions</h3>
      <div className="space-y-1 text-muted">
        <div>• <strong>Right-click</strong> category chip → Type submenu</div>
        <div>• <strong>Drag</strong> resize handle → Adjust starred height</div>
        <div>• <strong>Double-click</strong> folder → Open and navigate</div>
      </div>
    </section>
  </div>
);
```

### 5. New Folder Dialog Implementation

```tsx
interface NewFolderDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: { name: string; parentId: string | null; color?: string }) => void;
  folders: Folder[];
  currentFolderId: string | null;
}

const NewFolderDialog = ({ isOpen, onClose, onSubmit, folders, currentFolderId }) => {
  const [name, setName] = useState('');
  const [parentId, setParentId] = useState<string | null>(currentFolderId);
  const [selectedColor, setSelectedColor] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  // Reset state when dialog opens
  useEffect(() => {
    if (isOpen) {
      setName('');
      setParentId(currentFolderId);
      setSelectedColor(null);
      setError(null);
    }
  }, [isOpen, currentFolderId]);
  
  // Get root-level folders for parent selection
  const rootFolders = folders.filter(f => f.parentId === null);
  
  // Color options
  const colorOptions = [
    { id: null, label: 'Default', color: tokens.colors.accent.amber },
    { id: 'teal', label: 'Teal', color: tokens.colors.accent.teal },
    { id: 'green', label: 'Green', color: tokens.colors.accent.green },
    { id: 'blue', label: 'Blue', color: tokens.colors.accent.blue },
    { id: 'purple', label: 'Purple', color: tokens.colors.accent.purple },
    { id: 'pink', label: 'Pink', color: tokens.colors.accent.pink },
    { id: 'orange', label: 'Orange', color: tokens.colors.accent.orange },
  ];
  
  const handleSubmit = () => {
    // Validation
    if (!name.trim()) {
      setError('Folder name is required');
      return;
    }
    
    // Check for duplicate names in same parent
    const siblings = folders.filter(f => f.parentId === parentId);
    if (siblings.some(f => f.name.toLowerCase() === name.trim().toLowerCase())) {
      setError('A folder with this name already exists here');
      return;
    }
    
    onSubmit({
      name: name.trim(),
      parentId,
      color: selectedColor ? colorOptions.find(c => c.id === selectedColor)?.color : null,
    });
    onClose();
  };
  
  if (!isOpen) return null;
  
  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="w-72 rounded-lg p-4" style={{ background: tokens.colors.bg.elevated }}>
        {/* Header */}
        <div className="flex items-center gap-2 mb-4">
          <FolderPlus size={18} style={{ color: tokens.colors.accent.amber }} />
          <span className="text-sm font-semibold">New Folder</span>
        </div>
        
        {/* Name input */}
        <div className="mb-3">
          <label className="text-xs text-muted mb-1 block">Name</label>
          <input
            type="text"
            value={name}
            onChange={(e) => { setName(e.target.value); setError(null); }}
            onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
            placeholder="Folder name..."
            autoFocus
            className="w-full px-3 py-2 rounded text-sm"
            style={{ 
              background: tokens.colors.bg.glass, 
              border: `1px solid ${error ? tokens.colors.accent.red : tokens.colors.border.default}`,
            }}
          />
          {error && <span className="text-xs text-red-500 mt-1">{error}</span>}
        </div>
        
        {/* Parent folder select */}
        <div className="mb-3">
          <label className="text-xs text-muted mb-1 block">Location</label>
          <select
            value={parentId || ''}
            onChange={(e) => setParentId(e.target.value || null)}
            className="w-full px-3 py-2 rounded text-sm"
            style={{ background: tokens.colors.bg.glass, border: `1px solid ${tokens.colors.border.default}` }}
          >
            <option value="">Root</option>
            {rootFolders.map(f => (
              <option key={f.id} value={f.id}>{f.name}</option>
            ))}
          </select>
        </div>
        
        {/* Color picker */}
        <div className="mb-4">
          <label className="text-xs text-muted mb-2 block">Color (optional)</label>
          <div className="flex gap-2 flex-wrap">
            {colorOptions.map(opt => (
              <button
                key={opt.id || 'default'}
                onClick={() => setSelectedColor(opt.id)}
                className="w-6 h-6 rounded-full border-2 transition-transform hover:scale-110"
                style={{ 
                  background: opt.color,
                  borderColor: selectedColor === opt.id ? 'white' : 'transparent',
                }}
                title={opt.label}
              />
            ))}
          </div>
        </div>
        
        {/* Actions */}
        <div className="flex gap-2">
          <button
            onClick={onClose}
            className="flex-1 py-2 rounded text-sm"
            style={{ background: tokens.colors.bg.glass, color: tokens.colors.text.muted }}
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={!name.trim()}
            className="flex-1 py-2 rounded text-sm font-medium"
            style={{ 
              background: tokens.colors.accent.blue, 
              color: 'white',
              opacity: name.trim() ? 1 : 0.5,
            }}
          >
            Create
          </button>
        </div>
      </div>
    </div>
  );
};
```

### 6. File Item with Tags

```tsx
const FileItem = ({ file, tags, showStar = true, compact = false, onLoad, onToggleStar }) => {
  const [isHovered, setIsHovered] = useState(false);
  const { tokens, isVR } = useAdaptive();
  
  const canLoad = file.loadState === 'stored' && 
    ['nifti', 'dicom', 'nrrd', 'stl'].includes(file.type);
  
  // Get tag objects for display (max 2 visible)
  const fileTags = (file.tagIds || [])
    .map(id => tags.find(t => t.id === id))
    .filter(Boolean)
    .slice(0, 2);
  const moreTagsCount = (file.tagIds || []).length - fileTags.length;
  
  return (
    <div
      className="flex items-center gap-2 px-2 py-1 rounded cursor-pointer transition-all"
      style={{
        background: file.loadState === 'loaded' 
          ? 'rgba(52,211,153,0.04)' 
          : isHovered ? tokens.colors.bg.glassHover : 'transparent',
        minHeight: isVR ? 48 : (compact ? 28 : 32),
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <FileTypeIcon category={file.category} size={compact ? 12 : 14} />
      
      <div className="flex-1 min-w-0">
        <span className="text-xs truncate block" style={{ color: tokens.colors.text.primary }}>
          {file.name}
        </span>
        
        {/* Tag chips (non-compact mode only) */}
        {!compact && fileTags.length > 0 && (
          <div className="flex gap-1 mt-0.5">
            {fileTags.map(tag => {
              const cat = TAG_CATEGORIES[tag.categoryId];
              return (
                <span
                  key={tag.id}
                  className="text-xs px-1 rounded"
                  style={{ 
                    background: `${cat.color}15`, 
                    color: cat.color, 
                    fontSize: 9,
                  }}
                >
                  {tag.name}
                </span>
              );
            })}
            {moreTagsCount > 0 && (
              <span className="text-xs" style={{ color: tokens.colors.text.muted, fontSize: 9 }}>
                +{moreTagsCount}
              </span>
            )}
          </div>
        )}
      </div>
      
      {/* Load button or state indicator */}
      {canLoad && isHovered ? (
        <button
          onClick={(e) => { e.stopPropagation(); onLoad?.(file.id); }}
          className="flex items-center gap-1 px-1.5 py-0.5 rounded text-xs font-medium"
          style={{ 
            color: tokens.colors.accent.teal, 
            background: `${tokens.colors.accent.teal}15`,
            minHeight: isVR ? 44 : 'auto', // VR touch target
          }}
        >
          <Upload size={10} /> Load
        </button>
      ) : (
        <LoadStateIndicator state={file.loadState} size={8} />
      )}
      
      {/* Star toggle */}
      {showStar && (
        <button
          onClick={(e) => { e.stopPropagation(); onToggleStar?.(file.id); }}
          style={{ minWidth: isVR ? 44 : 'auto', minHeight: isVR ? 44 : 'auto' }}
        >
          <Star
            size={11}
            fill={file.starred ? tokens.colors.accent.amber : 'none'}
            stroke={file.starred ? tokens.colors.accent.amber : tokens.colors.text.muted}
            style={{ opacity: file.starred ? 1 : 0.3 }}
          />
        </button>
      )}
      
      {/* File size (non-compact) */}
      {!compact && (
        <span className="text-xs min-w-9 text-right" style={{ color: tokens.colors.text.muted }}>
          {file.size}
        </span>
      )}
    </div>
  );
};
```

---

## API Integration

### Tag Endpoints

```typescript
// GET /api/projects/:projectId/tag-categories
// Returns: TagCategory[]

// GET /api/projects/:projectId/tags
// Returns: Tag[]

// POST /api/projects/:projectId/tags
// Body: { name: string, categoryId: string }
// Returns: Tag

// DELETE /api/projects/:projectId/tags/:tagId
// Returns: { success: boolean }

// PUT /api/files/:fileId/tags
// Body: { tagIds: string[] }
// Returns: FileItem
```

### Folder Endpoints

```typescript
// GET /api/projects/:projectId/folders
// Returns: Folder[]

// POST /api/projects/:projectId/folders
// Body: { name: string, parentId: string | null, color?: string }
// Returns: Folder

// PUT /api/folders/:folderId
// Body: { name?: string, parentId?: string | null, color?: string }
// Returns: Folder

// DELETE /api/folders/:folderId
// Query: ?moveFilesTo=folderId|root
// Returns: { success: boolean }
```

---

## Implementation Checklist

### Phase 1: Data Layer
- [ ] Add `tagIds: string[]` to File model
- [ ] Create TagCategory model
- [ ] Create Tag model  
- [ ] Create Folder model (if not exists)
- [ ] Add ProjectSettings.allowUserTagCreation
- [ ] Create API endpoints for tags/folders

### Phase 2: Hooks
- [ ] `useTagAnalysis(files, tags)` - counts and grouping
- [ ] `useFileTypeAnalysis(files)` - category/type analysis
- [ ] `useGlobalFilters()` - extended with tagFilters
- [ ] Update `applyFilters()` with hybrid AND/OR logic

### Phase 3: Atoms & Molecules
- [ ] `TagChip` component
- [ ] `TagCheckbox` component
- [ ] `TagsDropdown` component
- [ ] `CollapsibleFilterBar` component
- [ ] `ActiveTagChips` component

### Phase 4: Dialogs
- [ ] `HelpPanel` with 3 tabs (Overview, Filters & Tags, Shortcuts)
- [ ] `NewFolderDialog` with validation and color picker

### Phase 5: Integration
- [ ] Update `FileItem` to display tags
- [ ] Update `StarredSection` with tag filter support
- [ ] Wire up keyboard shortcuts
- [ ] Test all filter combinations
- [ ] Test VR mode (touch targets, scaling)

---

## Color Reference (Extended)

```scss
// Tag category colors (defaults)
$tag-subject: #3b82f6;      // Blue
$tag-phase: #8b5cf6;        // Purple
$tag-status: #f59e0b;       // Amber
$tag-cohort: #10b981;       // Emerald
$tag-session: #ec4899;      // Pink
$tag-custom: #6b7280;       // Gray

// Existing accent colors
$accent-amber: #fbbf24;     // Starred, default folders
$accent-blue: #3b82f6;      // Files panel
$accent-teal: #2dd4bf;      // Volumetric, loaded
$accent-cyan: #22d3ee;      // Help
$accent-purple: #a855f7;    // Images
$accent-green: #34d399;     // 3D models, success
$accent-orange: #f97316;    // Data files
$accent-red: #ef4444;       // Error

// State colors
$state-stored: transparent;
$state-loading: #3b82f6;
$state-loaded: #34d399;
$state-processing: #fbbf24;
$state-error: #ef4444;
```

---

## Questions?

- **Design reference**: `FilesTabV7WithTags.jsx` prototype
- **Original handoff**: `Files_Tab_Claude_Code_Handoff.md`
- **Full design log**: `Files_Tab_Redesign_Session_Memory_Log.md`
