# ViewGroup Selector & Footer 2 Links - Design Session Memory Log

**Date:** January 25, 2026  
**Session Type:** UI/UX Design Exploration + Backend Architecture  
**Artifacts Created:**
- `viewgroup-selector-v1.jsx` - Initial prototype
- `viewgroup-selector-v2.jsx` - Enhanced links, duplication dialog
- `viewgroup-selector-v3.jsx` - Fixed responsive breakpoints (FINAL)
- `ViewGroup_Selector_Links_Claude_Code_Handoff.md` - UI Implementation guide
- `ViewGroup_Links_Backend_Architecture_Handoff.md` - Backend implementation guide (NEW)

---

## Session Context

This session continued from the Room Header & Canvas Tabs work (Parts 1 & 2). We focused on the ViewGroup Selector component in Footer 2 and discovered significant design work needed for the Links system.

**Part 2** pivoted to backend architecture discussions to establish the data model and behavioral rules for ViewGroups and Links before implementation.

### Previous Work Referenced
- `canvas-comprehensive-v3.jsx` - Comprehensive canvas prototype (1807 lines)
- `Room_Header_Canvas_Tabs_Session_Memory_Log_Part2.md` - Previous session decisions
- Existing `ViewLinkingService` and `LinkManagerPanels` components in codebase

---

## Part 1: UI/UX Design Decisions

### 1. ViewGroup Selector Location & Behavior
**Decision:** ViewGroup Selector lives in Footer 2, right-center area
- Trigger button shows color dot + name (responsive)
- Click opens dropdown with search, list, and create actions
- Active ViewGroup = Selected ViewGroup (same as Instance Tools pattern)

### 2. Settings Popover (Option C - Hybrid)
**Decision:** Quick settings popover with "Edit in Layout Tab" link
- Popover handles: Name, Color, Layout dropdown, ViewGroup links
- Actions: Save as Template, Duplicate, Delete
- "Edit in Layout Tab" for advanced/comprehensive editing
- Rationale: Speed for common tasks, full control available via floating panels

### 3. "Go To" Behavior (Option D - All)
**Decision:** Go To action does pan + zoom + highlight
- Smooth pan canvas to center on ViewGroup
- Zoom to fit if needed
- Flash border highlight for visual confirmation
- Can be preference-controlled later

### 4. Create New Flow (Option C - Quick Create with Advanced)
**Decision:** Quick templates inline, Advanced opens Layout Tab
- Quick Create shows 5 layout templates (Single, 1+2, 2×2, 3-up, 2+1)
- "From Saved" section ALWAYS visible (shows empty state if no templates)
- "Advanced: Open Layout Tab" for full canvas grid control
- Rationale: Discoverability of save-as-template feature

### 5. Links Architecture - Major Enhancement
**Decision:** Links are NOT just toggles - they show what you're linked to

**Footer 2 Link Indicators:**
- Full mode: Individual indicators per property with counts
- Compact mode: Single button with colored dots
- Minimal mode: Single button with total count
- Click any → Opens popover with details and "Open Link Manager" button

**Link Properties (6 universal + type-specific):**
1. Camera (teal) - all types
2. Filters (purple) - all types
3. Colors (pink) - vtk, chart
4. Widgets (amber) - all types
5. Cursors (cyan) - all types
6. Annotations (orange) - vtk, image
7. Window/Level (blue) - vtk-slice, vtk-volume
8. Slice Position (green) - vtk-slice
9. Time Position (amber) - vtk-4d, timeseries

**Link Modes (existing from codebase):**
- Follow (←) - Receive updates only
- Sync (↔) - Bidirectional
- Broadcast (→) - Send updates only

### 6. Duplication with Link Handling
**Decision:** Dialog asks how to handle links with 3 options + direction toggle

| Option | Default | Behavior |
|--------|---------|----------|
| Keep individual links | No | Copy inherits same targets |
| **Link to original** | **Yes** | ViewGroup-to-ViewGroup sync |
| No links | No | Clean slate |

**Direction toggle (when "Link to original" selected):**
- **Duplicate follows Original** (default) - New group syncs to original
- **Original follows Duplicate** - Original syncs to new group (for experimental branches)

**Critical:** When "Link to original" selected:
- Individual links are RETAINED but PAUSED (not disabled/deleted)
- If ViewGroup link is later broken, individual links can resume
- Prevents data loss while avoiding conflicting sync

### 7. Link Reminder Toast
**Decision:** One-time reminder when activating linked ViewGroup
- Shows total link count and "syncing with other views" message
- "Got it" dismisses and allows sync
- "Disable Links" turns off incoming sync
- NOT a blocking confirmation - this is synchronous collaboration

**Philosophy:** Always-on sync for synchronous collaboration. Don't ask on every change, just remind once so users know their view may shift.

### 8. ViewGroup-to-ViewGroup Linking
**Decision:** Only allowed for compatible ViewGroups
- Must be duplicates (spawn from same) OR
- Must have compatible layouts (same view count)
- Individual View-to-View linking always available for flexibility
- ViewGroup linking is convenience layer, not restriction

---

## Part 2: Backend Architecture Decisions

### 9. ViewGroup Requirement Model
**Decision:** Everything is a ViewGroup, but UI hides solo ViewGroups

**Data Model:**
```
ViewConfiguration (view) → always belongs to → ViewGroup → always belongs to → Workspace
```

**UI Presentation:**
| Scenario | Backend State | UI Presentation |
|----------|---------------|-----------------|
| Single view opened | View in auto-created ViewGroup | Shows as solo view, no ViewGroup chrome |
| User adds second view | Same ViewGroup gains second member | ViewGroup selector appears, auto-named |
| User explicitly creates ViewGroup | Named ViewGroup created | Full ViewGroup UI immediately |
| User drags solo view into existing ViewGroup | View moves to that ViewGroup | Solo view disappears, ViewGroup gains member |

**Rationale:** Zero friction for quick meetings, progressive complexity for advanced collaboration.

### 10. ViewGroup States
**Decision:** Four distinct states based on view count and naming

| State | View Count | Name | UI Visibility |
|-------|------------|------|---------------|
| **Solo** | 1 | null | Hidden - appears as independent view |
| **Named** | 2+ | required | Full ViewGroup chrome |
| **Explicit Solo** | 1 | set | Full ViewGroup chrome (user chose this) |
| **Empty** | 0 | set | Template/placeholder with "Add views" prompt |

### 11. ViewGroup Auto-Naming
**Decision:** Name based on first view type when transitioning Solo → Named

| First View Type | Auto-Generated Name |
|-----------------|---------------------|
| Axial Slice | "Axial Slice Group" |
| Volume Render | "Volume Render Group" |
| Scatter Plot | "Scatter Plot Group" |
| Custom named view | "{View Name} Group" |

**Behavior:** If first view is removed, name stays (it's just a label now).

### 12. ViewGroup State Transitions
**Decision:** Preserve user intent during transitions

| Transition | Behavior |
|------------|----------|
| Solo → Named | Auto-name, show ViewGroup chrome |
| Named → Solo | **Stay visible** (Explicit Solo), preserve name |
| Solo → Explicit Solo | User manually names via "Name this ViewGroup" action |
| Named → Multiple Solos | "Dissolve ViewGroup" creates new Solo for each view |

**Rationale:** Users invest in naming; reverting would feel like data loss.

### 13. Link Hierarchy Architecture
**Decision:** Two-layer system with view-to-view as foundation

```
LAYER 1: View-to-View Links (Foundation)
─────────────────────────────────────────
• Always exist at this level
• Each property linked independently
• Can link any view to any other view
• Modes: Follow (←) / Sync (↔) / Broadcast (→)

LAYER 2: ViewGroup Links (Convenience Layer)
─────────────────────────────────────────────
• Links ALL views in GroupA ↔ ALL views in GroupB
• When ACTIVE: Originator's individual links are PAUSED
• When INACTIVE: Individual links resume
• Toggle on/off without destroying either layer
```

### 14. The Originator Principle
**Decision:** The group that initiates a VG link has their individual links affected; target is unaffected

**Core Rule:** Initiating a VG link is a commitment that affects YOUR workflow, not theirs.

| VG Link Mode | Who Initiates | Whose Individual Links Pause |
|--------------|---------------|------------------------------|
| **Follow (←)** | Follower (GroupB) | GroupB's links pause |
| **Sync (↔)** | Initiator (GroupB) | GroupB's links pause |
| **Broadcast (→)** | Broadcaster (GroupB) | GroupB's links pause |

**Target group behavior:** "GroupB chose to follow us, whatever, doesn't affect me"

### 15. Which Individual Links Pause
**Decision:** Only pause incoming links that would conflict; never pause bidirectional or outgoing

| Originator's Link Type | Direction | Pause? | Reasoning |
|------------------------|-----------|--------|-----------|
| **Sync (↔)** | Both | **No** | Collaborative chain, last write wins |
| **Follow (←)** | Incoming | **Yes** | Two incoming sources would conflict |
| **Broadcast (→)** | Outgoing | **No** | Can send to multiple targets |

**Key Insight:** Bidirectional sync means both parties agreed to be the same collaborative space. It's not a competing signal—it's an extension of the same surface.

### 16. Active Follower Conflict Resolution
**Decision:** When unidirectional follower is active, pause incoming and reconcile later

**State Machine:**
```
FOLLOWING (synced) → User activates view → PAUSED (user has control)
PAUSED → User makes changes → DIVERGED (tracked)
DIVERGED → User re-enters after leaving → RECONCILE (prompt if leader changed)
```

**Reconciliation Prompt (only if leader changed while diverged):**
```
┌────────────────────────────────────────────┐
│  📷 Camera link paused while you were away │
│                                            │
│  "Axial Slice" has moved. Sync your camera?│
│                                            │
│  [Keep Mine]  [Sync to Leader]  [Preview]  │
└────────────────────────────────────────────┘
```

**Note:** Bidirectional sync never needs reconciliation—last write wins is the agreement.

### 17. Duplication Direction Default
**Decision:** Duplicate is originator by default (follows original)

**Rationale:** The duplicate is the "new thing that wants to follow the established thing."

**User override:** Toggle in duplication dialog allows reverse (original follows duplicate) for experimental branches or teaching scenarios.

---

## Responsive Breakpoints (Final)

### Footer 2 Breakpoints

| Mode | Width | Links | ViewGroup | Labels | Type-specific |
|------|-------|-------|-----------|--------|---------------|
| Full | ≥900px | All expanded | Full name | ✅ | ✅ |
| Compact | 600-899px | Dots | Truncated | ❌ | ❌ |
| Minimal | 450-599px | Count only | Color dot | ❌ | ❌ |
| Min-width | <450px | Enforce min | — | — | — |

### Workspace Minimum Sizes

```typescript
const sizing = {
  minWorkspaceWidth: 450,    // Enforced minimum
  minWorkspaceHeight: 300,
  minCanvasWidth: 280,       // Individual tiles
  minCanvasHeight: 200,
  minPopoutWidth: 200,
  minPopoutHeight: 150,
};
```

---

## Components Designed

### New Components
1. **ViewGroupSelectorTrigger** - Responsive button (full/compact/minimal)
2. **ViewGroupSelectorDropdown** - Search, list, create
3. **ViewGroupRow** - Row with name, view count, link indicator, actions
4. **CreateViewGroupPopover** - Quick templates + From Saved + Advanced
5. **ViewGroupSettingsPopover** - Quick settings with Layout Tab link
6. **DuplicationDialog** - Link handling options with direction toggle
7. **CollapsedLinksIndicator** - Compact/minimal link display
8. **LinksPopover** - Full link list with property details
9. **LinkPropertyPopover** - Single property detail/config
10. **LinkReminderToast** - One-time activation reminder
11. **ReconciliationPrompt** - For diverged unidirectional followers

### Enhanced Components
1. **Footer2** - Added ViewGroup selector and responsive links
2. **LinkPropertyIndicator** - Now shows count, not just toggle

---

## Integration Notes

### Existing Code to Integrate With
- `ViewLinkingService` - Already handles link operations
- `LINK_PROPERTIES` in `linkConstants.js` - Property definitions
- `LINK_MODES` in `linkConstants.js` - Mode definitions
- `ViewLinkManager` - Full link configuration panel
- `ModeSelector` - Three-way toggle component
- `GroupMembersList` - Shows members in link group

### Backend Considerations (for Claude Code)
- See `ViewGroup_Links_Backend_Architecture_Handoff.md` for full implementation guide
- Link properties need `applicableTypes` field in database
- ViewGroup-to-ViewGroup linking needs new relationship type with originator tracking
- Individual links need `pausedByVGLink` field
- Reconciliation requires tracking `followerLastSyncedAt`, `followerDivergedAt`, `leaderStateHash`

---

## Open Items for Future Sessions

### Not Addressed This Session
1. **Canvas breadcrumb navigation** - "Workspace > ViewGroup > View" path
2. **VR mode UI adaptations** - How these components transform for VR
3. **Permission/guest view indicators** - Guest restrictions in canvas
4. **Recording/Playback UI** - Session recording for scientific reproducibility
5. **Subset selector integration** - How subsets interact with ViewGroups

### Questions Answered This Session
1. ~~Should ViewGroup templates include link configurations?~~ → Templates are for layout, links are runtime
2. ~~How do saved ViewGroups interact with different datasets?~~ → ViewGroups contain ViewConfigurations which reference datasets
3. ~~What happens to links when a view type changes?~~ → Type-specific links become inapplicable, universal links persist

### Questions for Later
1. Should reconciliation auto-sync if follower made no changes?
2. How do VG links interact with permissions (can guest initiate VG link)?
3. Maximum depth of link chains (A→B→C→D)?

---

## Prototype Files

### viewgroup-selector-v3.jsx (FINAL)
- Full responsive Footer 2
- All three modes working (Full/Compact/Minimal)
- ViewGroup Selector with dropdown
- Collapsed links with colored dots
- LinksPopover and LinkPropertyPopover
- DuplicationDialog with link options
- LinkReminderToast

### Test Controls in Prototype
- Width slider (400-1200px) with breakpoint markers
- Mode indicator showing current responsive mode
- "Empty State" toggle
- "Test Duplication" button
- "Link Reminder" button

---

## Design Tokens Used

```typescript
const tokens = {
  colors: {
    accent: { 
      purple: '#a855f7',  // ViewGroup default, broadcast mode
      blue: '#3b82f6',    // Window/Level links
      cyan: '#22d3ee',    // Cursors, follow mode
      green: '#22c55e',   // Slice position, success
      amber: '#f59e0b',   // Widgets, warnings
      pink: '#ec4899',    // Colors/colorMaps
      red: '#ef4444',     // Delete, unlink
      teal: '#14b8a6',    // Camera, sync mode, VR
      orange: '#fb923c',  // Annotations
    },
  },
  sizing: {
    touchTarget: 44,
    touchTargetLg: 56,
    minWorkspaceWidth: 450,
    minWorkspaceHeight: 300,
  },
};
```

---

## Continuation Prompt

To continue this work in a new chat, use:

> "I'm continuing the ViewGroup and Links architecture work. Please read the `ViewGroup_Selector_Links_Design_Session_Memory_Log.md` file in project knowledge to restore context. Part 1 covered UI design (final prototype: `viewgroup-selector-v3.jsx`). Part 2 covered backend architecture including the Originator Principle for VG links, link hierarchy, and reconciliation for unidirectional followers. Implementation handoffs are in `ViewGroup_Selector_Links_Claude_Code_Handoff.md` (UI) and `ViewGroup_Links_Backend_Architecture_Handoff.md` (Backend)."

---

## Session Statistics

- **Duration:** Extended session (2 parts)
- **Prototype iterations:** 3 (v1, v2, v3)
- **Design questions resolved:** 17
- **New components designed:** 11
- **Existing components enhanced:** 2
- **Handoff documents:** 2 (UI + Backend)
