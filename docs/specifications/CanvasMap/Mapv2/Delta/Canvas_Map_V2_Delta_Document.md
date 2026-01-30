# Canvas Map V2 - Implementation Delta Document

**Current File:** `canvas-map-refined.jsx`  
**Target Design:** `canvas-map-v2-reference.jsx`  
**Status:** ~40% complete - Major features missing

---

## Executive Summary

The current implementation captures the basic mode structure but is missing ALL V2 key features:
- ❌ No side quick-nav toolbar
- ❌ No companion panel
- ❌ No minimap panning
- ❌ No cursor controls
- ❌ No responsive sizeMode
- ❌ Wrong color tokens (not blue-tinted)
- ❌ No glassmorphism effects
- ❌ Fixed sizing instead of responsive

---

## 1. COLOR TOKENS - WRONG

### Current (WRONG)
```javascript
colors: {
  bg: {
    primary: '#0a0a0f',      // ❌ Pure dark gray
    secondary: '#12121a',    // ❌ Pure dark gray
    tertiary: '#1a1a24',     // ❌ Pure dark gray
    glass: 'rgba(255,255,255,0.03)',  // ❌ White-based
    ...
  },
```

### Target (CORRECT)
```javascript
colors: {
  bg: {
    base: '#020406',         // ✅ Blue-tinted darkest
    primary: '#060a12',      // ✅ Blue-tinted
    secondary: '#0c1220',    // ✅ Blue-tinted
    tertiary: '#121a2e',     // ✅ Blue-tinted
    elevated: '#18223c',     // ✅ Blue-tinted
    // Canvas MUST be neutral for data accuracy
    canvas: '#030303',       // ✅ Neutral
    canvasCell: '#080808',   // ✅ Neutral
  },
  glass: {
    subtle: 'rgba(96, 165, 250, 0.03)',   // ✅ Blue-tinted
    light: 'rgba(96, 165, 250, 0.05)',    // ✅ Blue-tinted
    medium: 'rgba(96, 165, 250, 0.08)',   // ✅ Blue-tinted
    strong: 'rgba(96, 165, 250, 0.12)',   // ✅ Blue-tinted
    panel: 'rgba(8, 14, 24, 0.88)',       // ✅ Blue-tinted with blur
  },
```

**Why it matters:** The blue tint creates visual cohesion with CIA Web's theme. Pure grays look flat and disconnected.

---

## 2. GLASSMORPHISM - MISSING

### Current (MISSING)
```javascript
// Panel wrapper uses flat background
style={{
  background: tokens.colors.bg.secondary,  // ❌ Flat color
  borderRadius: '12px',
```

### Target (CORRECT)
```javascript
const glassPanel = {
  background: tokens.colors.glass.panel,
  backdropFilter: 'blur(12px) saturate(180%)',
  WebkitBackdropFilter: 'blur(12px) saturate(180%)',
  border: `1px solid ${tokens.colors.border.default}`,
  boxShadow: '0 12px 48px rgba(0, 0, 0, 0.5), inset 0 1px 2px rgba(255, 255, 255, 0.08)',
};

// Panel wrapper
style={{ ...glassPanel, borderRadius: tokens.radius.xl }}
```

---

## 3. RESPONSIVE SIZE MODE - MISSING

### Current (FIXED)
```javascript
// Fixed 400px width, no adaptation
<div style={{ width: '400px', ... }}>
```

### Target (RESPONSIVE)
```javascript
// Calculate effective width
const companionWidth = companionOpen ? COMPANION_WIDTH.standard : 0;
const effectiveWidth = panelWidth - companionWidth;

// Determine size mode
const sizeMode = useMemo(() => {
  if (effectiveWidth < 300) return 'compact';
  if (effectiveWidth >= 440) return 'expanded';
  return 'standard';
}, [effectiveWidth]);

const isCompact = sizeMode === 'compact';

// Apply throughout:
// - Mode tabs: icons only in compact
// - List items: simplified in compact
// - Search bars: hidden in compact
// - Toolbar controls: overflow menu in compact
```

**Adaptation Examples:**

| Element | Compact (<300px) | Standard | Expanded (>440px) |
|---------|-----------------|----------|-------------------|
| Mode tabs | Icons only | Icon + name | Icon + name |
| VG list items | Small preview, name only | + position + count | + implicit badge |
| Search bars | Hidden | Shown | Shown |
| Toolbar | Overflow menu | Core controls | All controls |
| Collaborator items | Avatar + name | + location | + Follow button |

---

## 4. SIDE QUICK NAV TOOLBAR - MISSING ENTIRELY

### Current
Quick nav buttons are buried in Navigate mode's contextual panel:
```javascript
{mapMode === 'navigate' && (
  <div style={{ display: 'flex', gap: '6px', ... }}>
    <ActionBtn icon={Home} label="Go Home" />
    <ActionBtn icon={Crosshair} label="Set Home" />
    ...
  </div>
)}
```
❌ Only visible in Navigate mode
❌ Takes up contextual panel space
❌ Not always accessible

### Target
Persistent side toolbar ALWAYS visible:
```jsx
const QuickNavToolbar = ({ position = 'left' }) => (
  <div style={{
    display: 'flex', 
    flexDirection: 'column', 
    gap: '4px', 
    padding: '4px',
    background: tokens.colors.glass.subtle,
    borderRadius: tokens.radius.md,
    [position === 'left' ? 'marginRight' : 'marginLeft']: '8px',
  }}>
    <ToolbarBtn icon={Home} title="Go Home (H)" />
    <ToolbarBtn icon={Crosshair} title="Set Home Here" />
    <ToolbarBtn icon={Scan} title="Fit All (F)" />
    <Separator vertical={false} />
    <ToolbarBtn icon={BookmarkPlus} title="Add Bookmark (B)" />
  </div>
);

// In minimap area layout:
<div style={{ display: 'flex', height: minimapHeight }}>
  {toolbarPosition === 'left' && <QuickNavToolbar position="left" />}
  <Minimap />
  {toolbarPosition === 'right' && <QuickNavToolbar position="right" />}
  {companionOpen && <CompanionPanel />}
</div>
```

**User Preference:** `toolbarPosition: 'left' | 'right'` for handedness

---

## 5. COMPANION PANEL - MISSING ENTIRELY

### Current
Has toggle button but **no panel rendered**:
```javascript
const [sidePanelOpen, setSidePanelOpen] = useState(false);
// ... toggle button exists ...
// But NO actual panel component!
```

### Target
Full companion panel with Views & Datasets tabs:
```jsx
const CompanionPanel = ({ isCompact }) => {
  const [activeSection, setActiveSection] = useState('views');
  const [searchQuery, setSearchQuery] = useState('');
  
  return (
    <div style={{
      width: isCompact ? 140 : 160,
      borderLeft: `1px solid ${tokens.colors.border.subtle}`,
      background: tokens.colors.bg.tertiary,
      display: 'flex', 
      flexDirection: 'column',
      flexShrink: 0,
    }}>
      {/* Tab switcher */}
      <div style={{ display: 'flex', borderBottom: '...' }}>
        <button onClick={() => setActiveSection('views')}>
          <Eye size={12} /> {!isCompact && 'Views'}
        </button>
        <button onClick={() => setActiveSection('datasets')}>
          <Database size={12} /> {!isCompact && 'Data'}
        </button>
      </div>
      
      {/* Content */}
      <div style={{ flex: 1, overflow: 'auto', padding: '8px' }}>
        <SearchBar placeholder="Search..." />
        <p>Drag to minimap</p>
        {activeSection === 'views' 
          ? unplacedViews.map(v => <ViewListItem view={v} />)
          : datasets.map(d => <DatasetItem dataset={d} />)
        }
      </div>
    </div>
  );
};
```

---

## 6. MINIMAP PANNING - MISSING ENTIRELY

### Current
Simple overflow auto - no drag panning:
```javascript
<div style={{
  overflow: 'auto',  // ❌ Just scrollbars
  ...
}}>
```

### Target
Custom drag-to-pan with edge indicators:
```jsx
const PannableMinimap = ({ children, width, height, contentWidth, contentHeight }) => {
  const [isPanning, setIsPanning] = useState(false);
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });
  const [startPan, setStartPan] = useState({ x: 0, y: 0 });
  
  const canPan = contentWidth > width || contentHeight > height;
  const maxPanX = Math.max(0, contentWidth - width + 40);
  const maxPanY = Math.max(0, contentHeight - height + 40);
  
  const handleMouseDown = (e) => {
    if (!canPan) return;
    setIsPanning(true);
    setStartPan({ x: e.clientX - panOffset.x, y: e.clientY - panOffset.y });
  };
  
  // ... mouse move/up handlers ...
  
  return (
    <div 
      onMouseDown={handleMouseDown}
      style={{
        cursor: canPan ? (isPanning ? 'grabbing' : 'grab') : 'default',
        overflow: 'hidden',
      }}
    >
      <div style={{ transform: `translate(${panOffset.x}px, ${panOffset.y}px)` }}>
        {children}
      </div>
      
      {/* Edge fade indicators */}
      {panOffset.x < 0 && <div className="edge-fade-left" />}
      {panOffset.x > -maxPanX && <div className="edge-fade-right" />}
      
      {/* Pan hint */}
      {canPan && <div className="pan-hint"><Move /> Drag to pan</div>}
    </div>
  );
};
```

---

## 7. CURSOR CONTROLS IN TEAM MODE - MISSING

### Current
Basic collaborator list only:
```javascript
{mapMode === 'collaborate' && collaborateSubTab === 'team' && (
  // Just lists collaborators, no cursor controls
  {COLLABORATORS.filter(c => c.isOnline).map(c => (
    <CollaboratorItem collaborator={c} />
  ))}
)}
```

### Target
Full cursor management in Team mode:

**Team > Me sub-tab:**
```jsx
// My Viewports section
<SectionHeader title="My Viewports" />
{viewports.map(vp => <ViewportItem />)}

// Broadcast section
<SectionHeader title="Broadcast" />
<ToggleSwitch 
  checked={myBroadcasting} 
  onChange={setMyBroadcasting}
  label="Broadcasting to team"
/>

// My Cursor section
<SectionHeader title="My Cursor" />
<ToggleSwitch 
  checked={myCursorVisible} 
  onChange={setMyCursorVisible}
  label="Visible to team"
/>
<div className="cursor-color-picker">
  {CURSOR_COLORS.map(color => (
    <button 
      style={{ background: color, borderRadius: '50%' }}
      onClick={() => setMyCursorColor(color)}
    />
  ))}
</div>
```

**Team > Team sub-tab:**
```jsx
// Master cursor toggle
<div className="master-toggle">
  <MousePointer2 /> Show Cursors
  <ToggleSwitch checked={showCursors} onChange={setShowCursors} />
</div>

// Filter chips
<FilterChip label="Online" count={onlineCount} active />
<FilterChip label="Broadcasting" count={broadcastingCount} />

// Collaborator list WITH cursor toggles
{collaborators.map(c => (
  <CollaboratorItem 
    collaborator={c}
    showCursorToggle={true}  // ← NEW
    onToggleCursor={handleToggleCursor}  // ← NEW
  />
))}
```

**Cursor indicators on minimap:**
```jsx
// In minimap rendering (Team mode only)
{showCursors && mapMode === 'team' && collaborators
  .filter(c => c.isOnline && c.cursor && c.showCursor)
  .map(c => (
    <CursorIndicator 
      key={`cursor-${c.id}`}
      collaborator={c} 
      cellSize={minimapCellSize} 
    />
  ))
}
```

---

## 8. RESPONSIVE CELL SIZE - MISSING

### Current (FIXED)
```javascript
const minimapCellSize = useMemo(() => {
  const baseSize = focusedVGId ? 60 : 42;  // ❌ Fixed base
  return Math.floor(baseSize * (minimapZoom / 100));
}, [minimapZoom, focusedVGId]);
```

### Target (RESPONSIVE)
```javascript
const minimapCellSize = useMemo(() => {
  const labelsWidth = showGridLabels ? 24 : 0;
  const padding = 32;
  const sideToolbarWidth = 40;
  
  // Calculate available width for grid
  const availableWidth = panelWidth - labelsWidth - padding - sideToolbarWidth - companionWidth;
  
  // Calculate how many columns to fit
  const cols = focusedVGId ? (focusedVG?.position?.colSpan || 2) : CANVAS.cols;
  const gap = 4;
  
  // Calculate cell size that fits
  const fitSize = Math.floor((availableWidth - (cols - 1) * gap) / cols);
  
  // Clamp between min (20) and max (55)
  const baseSize = Math.min(55, Math.max(20, fitSize));
  
  // Apply zoom
  return Math.floor(baseSize * (minimapZoom / 100));
}, [panelWidth, minimapZoom, focusedVGId, focusedVG, showGridLabels, companionWidth]);
```

---

## 9. HEIGHT DISTRIBUTION - WRONG

### Current (FIXED)
```javascript
<div style={{ minHeight: '260px' }}>  // ❌ Fixed minimap height
  {/* Minimap */}
</div>
<div style={{ maxHeight: '240px' }}>  // ❌ Fixed contextual height
  {/* Contextual panel */}
</div>
```

### Target (DYNAMIC)
```javascript
// Calculate available heights
const headerHeight = 40;
const toolbarHeight = 40;
const footerHeight = 32;
const chromeHeight = headerHeight + toolbarHeight + footerHeight;
const contentHeight = panelHeight - chromeHeight;

// Minimap takes 55%, contextual gets rest
const minimapHeight = Math.max(150, Math.floor(contentHeight * 0.55));

<div style={{ height: minimapHeight }}>
  {/* Minimap */}
</div>
<div style={{ flex: 1, overflow: 'auto' }}>
  {/* Contextual panel - fills remaining space */}
</div>
```

---

## 10. MODE NAMING - WRONG

### Current
```javascript
collaborate: {
  id: 'collaborate',  // ❌ Too long
  name: 'Team',       // ✅ Display name is correct
```

### Target
```javascript
team: {
  id: 'team',         // ✅ Consistent short ID
  name: 'Team',       // ✅ Display name
```

---

## Summary of Missing State

```javascript
// USER PREFERENCES (persist)
const [toolbarPosition, setToolbarPosition] = useState('left'); // ❌ MISSING
const [companionOpen, setCompanionOpen] = useState(false);      // Exists but panel missing

// TEAM > ME SETTINGS
const [myBroadcasting, setMyBroadcasting] = useState(false);    // ❌ MISSING
const [myCursorColor, setMyCursorColor] = useState('#22d3ee');  // ❌ MISSING
const [myCursorVisible, setMyCursorVisible] = useState(true);   // ❌ MISSING

// CURSOR VISIBILITY (per-collaborator, local only)
const [collaboratorCursors, setCollaboratorCursors] = useState( // ❌ MISSING
  Object.fromEntries(COLLABORATORS.map(c => [c.id, c.showCursor]))
);

// MASTER TOGGLES
const [showCursors, setShowCursors] = useState(true);           // ❌ MISSING
```

---

## Implementation Priority

### Phase 1: Foundation (Do First)
1. ✏️ Fix color tokens (blue-tinted)
2. ✏️ Add glassmorphism styles
3. ✏️ Implement sizeMode calculation
4. ✏️ Fix height distribution (55/45 split)
5. ✏️ Fix responsive cell size calculation

### Phase 2: Side Toolbar
6. ➕ Create QuickNavToolbar component
7. ➕ Add toolbarPosition state
8. ✏️ Update minimap area layout

### Phase 3: Companion Panel
9. ➕ Create CompanionPanel component
10. ✏️ Wire up companionOpen toggle
11. ➕ Make all list items responsive to isCompact

### Phase 4: Minimap Panning
12. ➕ Create PannableMinimap component
13. ➕ Add edge fade indicators
14. ➕ Add pan hint

### Phase 5: Team Mode Cursors
15. ➕ Add cursor state management
16. ✏️ Update CollaboratorItem with cursor toggle
17. ➕ Create CursorIndicator component
18. ➕ Create Team > Me sub-tab content
19. ✏️ Update Team > Team sub-tab content

---

## Reference Files

- **Reference Prototype:** `/home/claude/canvas-map-v2-reference.jsx`
- **Implementation Guide:** `Canvas_Map_Panel_Claude_Code_Handoff.md`
- **Session Log:** `Canvas_Map_V2_Design_Session_Memory_Log.md`

---

*Document created: January 29, 2026*
