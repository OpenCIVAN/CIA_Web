# Files Tab Implementation Handoff for Claude Code

## Quick Start

You're implementing a redesigned Files Tab for CIA Web. The design is complete with interactive prototypes.

**Reference Files:**
- `Files_Tab_Redesign_Session_Memory_Log.md` - Full design documentation
- `files-tab-prototype-v4.jsx` - Visual reference (React prototype)
- Existing: `src/ui/react/components/panels/LeftPanel/tabs/FilesTab/`

---

## What You're Building

### Layout Overview

```
┌─────────────────────────────────────┐
│ 📁 Files                    8 total │
├─────────────────────────────────────┤
│ 🔍 [Search all files...          ]  │  ← NEW: Global search
│ [NIfTI][DICOM][Docs][Img]    Sort▼  │  ← NEW: Global filters
├─────────────────────────────────────┤
│ ▼ ⭐ Starred               2 of 3   │  ← MODIFIED: Filter-aware counts
│   file list...                      │
│   [Show all ↗] (when filtered)      │  ← NEW: Filter bypass
│ ═══════════════════════════════════ │  ← Resize handle (exists)
├─────────────────────────────────────┤
│ [📦 Loaded (2)] [📁 All Files (5)] │  ← MODIFIED: Loaded shows datasets+views
├─────────────────────────────────────┤
│ 🏠 Root / Raw Scans                 │  ← NEW: Breadcrumb (All Files only)
│   📁 folders + 📄 files             │  ← NEW: Folder tree
├─────────────────────────────────────┤
│ [?]  [    ⬆ Upload Files    ]  [⟳] │  ← NEW: Panel footer
└─────────────────────────────────────┘
```

**Compact Mode (<300px height):** Collapses to 3 tabs: Starred / Loaded / All Files

---

## New Components to Create

### Atoms

| Component | Purpose | Key Props |
|-----------|---------|-----------|
| `LoadStateIndicator` | Colored dot/spinner for file state | `state: 'stored'|'loading'|'loaded'|'processing'|'error'`, `size` |
| `ScopeIndicator` | Icon showing view scope level | `scope: 'ephemeral'|'personal'|'shared'|'workspace'|'project'`, `size` |

### Molecules

| Component | Purpose | Key Props |
|-----------|---------|-----------|
| `FilterChips` | Horizontal toggleable chips | `options`, `activeFilters`, `onChange`, `singleSelect?` |
| `SortDropdown` | Sort option selector | `value`, `onChange`, `options` |
| `GlobalFiltersBar` | Composes search + filters + sort | `filters`, `onFiltersChange` |
| `Breadcrumb` | Folder path navigation | `path`, `onNavigate` |
| `FolderItem` | Expandable folder row | `folder`, `expanded`, `onToggle`, `depth` |
| `FileItemList` | Enhanced file row | `file`, `showStar`, `showLoadButton`, `onLoad`, `onToggleStar` |
| `PanelFooter` | Help + Upload + Refresh | `onHelp`, `onUpload`, `onRefresh` |

### Organisms

| Component | Purpose |
|-----------|---------|
| `StarredSection` | Collapsible/resizable top section with filter bypass |
| `TabbedFilesBrowser` | Bottom section with Loaded/All tabs |
| `CompactFilesPanel` | 3-tab compact mode layout |
| `FloatingCard` | VR-friendly draggable panel container |
| `HelpPanel` | Contextual help with 3 tabs |
| `PromotePanel` | View promotion wizard (3 steps) |
| `DemotePanel` | View demotion confirmation |

---

## Critical Implementation Details

### 1. All Atoms Must Use useAdaptive()

```jsx
import { useAdaptive } from '@UI/react/context';

const LoadStateIndicator = ({ state, size = 8 }) => {
  const { tokens, isVR } = useAdaptive();
  const actualSize = isVR ? size * 1.5 : size;
  // ...
};
```

### 2. Global Filter State

```javascript
// useGlobalFilters.js
const useGlobalFilters = () => {
  const [filters, setFilters] = useState({
    searchQuery: '',
    typeFilters: [], // ['nifti', 'dicom', 'document', 'image']
    sortBy: 'name',
    sortOrder: 'asc',
  });
  
  // Filter logic for each section
  const applyFilters = (items) => {
    let result = items;
    
    if (filters.searchQuery) {
      result = result.filter(item => 
        item.name.toLowerCase().includes(filters.searchQuery.toLowerCase())
      );
    }
    
    if (filters.typeFilters.length > 0) {
      result = result.filter(item => filters.typeFilters.includes(item.type));
    }
    
    // Sort...
    
    return result;
  };
  
  return { filters, setFilters, applyFilters };
};
```

### 3. Starred Section Filter Awareness

```jsx
const StarredSection = ({ items, filters, ... }) => {
  const filteredItems = applyFilters(items);
  const hiddenCount = items.length - filteredItems.length;
  const hasActiveFilters = filters.searchQuery || filters.typeFilters.length > 0;
  
  return (
    <div>
      <SectionHeader 
        label="Starred" 
        count={hasActiveFilters ? `${filteredItems.length} of ${items.length}` : items.length}
      />
      {/* ... items ... */}
      {hiddenCount > 0 && (
        <button onClick={onShowAll}>
          {hiddenCount} items hidden by filters [Show all ↗]
        </button>
      )}
    </div>
  );
};
```

### 4. View Scope Configuration

```javascript
// constants/viewScopes.js
export const SCOPE_CONFIG = {
  ephemeral: {
    label: 'Unsaved',
    color: '#6b7280',
    icon: 'circle-dashed',
    description: 'Working view (session only)',
    canPromoteTo: ['personal'],
    canDemoteTo: [],
  },
  personal: {
    label: 'Personal',
    color: '#a855f7',
    icon: 'user',
    description: 'Saved to your account',
    canPromoteTo: ['shared', 'workspace'],
    canDemoteTo: [],
  },
  shared: {
    label: 'Shared',
    color: '#3b82f6',
    icon: 'users',
    description: 'Shared with specific people',
    canPromoteTo: ['workspace'],
    canDemoteTo: ['personal'],
  },
  workspace: {
    label: 'Workspace',
    color: '#34d399',
    icon: 'layout-grid',
    description: 'Available to workspace members',
    canPromoteTo: ['project'],
    canDemoteTo: ['personal'],
  },
  project: {
    label: 'Project',
    color: '#fbbf24',
    icon: 'folder-open',
    description: 'Project-level template',
    canPromoteTo: [],
    canDemoteTo: ['workspace'],
  },
};
```

### 5. Responsive Mode Hook

```javascript
// useResponsiveMode.js
const useResponsiveMode = (containerRef, heightThreshold = 300) => {
  const [dimensions, setDimensions] = useState({ width: 320, height: 500 });
  
  useEffect(() => {
    if (!containerRef.current) return;
    
    const observer = new ResizeObserver(([entry]) => {
      setDimensions({
        width: entry.contentRect.width,
        height: entry.contentRect.height,
      });
    });
    
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);
  
  return {
    ...dimensions,
    isCompact: dimensions.height < heightThreshold,
    showLabels: dimensions.width > 280,
  };
};
```

### 6. Floating Card (VR-Friendly)

```jsx
const FloatingCard = ({ title, icon, color, onClose, children }) => {
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const { tokens } = useAdaptive();
  
  const handleDragStart = (e) => {
    // Implement drag-to-reposition
  };
  
  return (
    <div 
      style={{
        position: 'absolute',
        transform: `translate(${position.x}px, ${position.y}px)`,
        minWidth: 280,
        background: tokens.colors?.bg?.elevated || '#1e1e2a',
        borderRadius: tokens.radius?.lg || 8,
        boxShadow: '0 0 40px rgba(0,0,0,0.5)',
      }}
    >
      {/* Drag handle */}
      <div onMouseDown={handleDragStart} style={{ cursor: 'move', padding: 8 }}>
        <div style={{ width: 32, height: 4, background: '#666', borderRadius: 2, margin: '0 auto' }} />
      </div>
      
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', padding: '12px 16px' }}>
        {icon}
        <span style={{ flex: 1, fontWeight: 600 }}>{title}</span>
        <button 
          onClick={onClose}
          style={{ minWidth: 44, minHeight: 44 }} // VR touch target
        >
          <X size={16} />
        </button>
      </div>
      
      {/* Content */}
      <div style={{ padding: 16 }}>
        {children}
      </div>
    </div>
  );
};
```

---

## File Type Configuration

```javascript
export const FILE_TYPES = {
  nifti: {
    extensions: ['.nii', '.nii.gz'],
    icon: 'box',
    color: '#2dd4bf', // teal
    label: 'NIfTI',
    canLoad: true,
  },
  dicom: {
    extensions: ['.dcm', '.dicom'],
    icon: 'box',
    color: '#2dd4bf',
    label: 'DICOM',
    canLoad: true,
  },
  document: {
    extensions: ['.md', '.pdf', '.txt', '.doc', '.docx'],
    icon: 'file-text',
    color: '#3b82f6', // blue
    label: 'Document',
    canLoad: false,
  },
  image: {
    extensions: ['.png', '.jpg', '.jpeg', '.gif', '.webp'],
    icon: 'file-image',
    color: '#a855f7', // purple
    label: 'Image',
    canLoad: false,
  },
};
```

---

## Implementation Checklist

### Phase 1: Atoms
- [ ] LoadStateIndicator with useAdaptive
- [ ] ScopeIndicator with useAdaptive
- [ ] Verify ColorDot exists or create

### Phase 2: Filter Components
- [ ] FilterChips (multi + single select modes)
- [ ] SortDropdown
- [ ] ViewModeToggle (list/grid)
- [ ] GlobalFiltersBar (composes above)
- [ ] useGlobalFilters hook

### Phase 3: File/Folder Components
- [ ] FileItemList (enhanced with load button, hover states)
- [ ] FolderItem (expandable with children)
- [ ] Breadcrumb navigation
- [ ] DatasetTreeItem (dataset + views)
- [ ] ViewItem (with scope indicator + quick actions)

### Phase 4: Section Organisms
- [ ] StarredSection (with filter bypass)
- [ ] TabbedFilesBrowser
- [ ] CompactFilesPanel
- [ ] PanelFooter
- [ ] useResponsiveMode hook

### Phase 5: Floating Panels
- [ ] FloatingCard base
- [ ] HelpPanel (3 tabs)
- [ ] PromotePanel (3 steps)
- [ ] DemotePanel (confirmation)

### Phase 6: Integration
- [ ] Refactor FilesTab.jsx
- [ ] Wire up all hooks and state
- [ ] Test responsive mode transitions
- [ ] Test all interactions

---

## Color Reference

```scss
// State colors
$state-stored: transparent;
$state-loading: #3b82f6;
$state-loaded: #34d399;
$state-processing: #fbbf24;
$state-error: #ef4444;

// Scope colors
$scope-ephemeral: #6b7280;
$scope-personal: #a855f7;
$scope-shared: #3b82f6;
$scope-workspace: #34d399;
$scope-project: #fbbf24;

// Accent colors (existing)
$accent-amber: #fbbf24;   // Starred
$accent-blue: #3b82f6;    // Files/folders
$accent-teal: #2dd4bf;    // Datasets
$accent-cyan: #22d3ee;    // Help
$accent-purple: #a855f7;  // Images
$accent-green: #34d399;   // Loaded/success
$accent-red: #ef4444;     // Error
```

---

## Questions? 

Refer to `Files_Tab_Redesign_Session_Memory_Log.md` for full design rationale and decisions.

The V4 prototype (`files-tab-prototype-v4.jsx`) shows the complete visual design - use it as reference for styling and interactions.
