# ViewGroup & Links - Backend Architecture Handoff

**Date:** January 25, 2026  
**Purpose:** Implementation guide for ViewGroup data model and Link system  
**Related UI Handoff:** `ViewGroup_Selector_Links_Claude_Code_Handoff.md`

---

## Executive Summary

This document defines the backend architecture for ViewGroups and the two-layer Link system. Key principles:

1. **Everything is a ViewGroup** - UI hides solo ViewGroups, but data model is uniform
2. **Links are two layers** - View-to-view (foundation) and ViewGroup-to-ViewGroup (convenience)
3. **Originator Principle** - Who initiates a VG link determines whose individual links pause
4. **Collaboration-first** - Bidirectional sync = last write wins, no special handling needed

---

## Data Models

### ViewGroup

```typescript
interface ViewGroup {
  id: UUID;                    // Server-generated
  workspaceId: UUID;           // Parent workspace
  name: string | null;         // null = solo/hidden, required when 2+ views
  color: string;               // Always assigned (hex color)
  layout: LayoutConfig;        // Grid arrangement of views
  createdAt: DateTime;
  createdBy: UUID;             // User who created
  updatedAt: DateTime;
  
  // Derived/computed
  viewCount: number;           // Count of ViewConfigurations
  state: ViewGroupState;       // 'solo' | 'named' | 'explicit_solo' | 'empty'
}

type ViewGroupState = 'solo' | 'named' | 'explicit_solo' | 'empty';

interface LayoutConfig {
  type: 'single' | 'split-h' | 'split-v' | 'grid' | 'custom';
  columns?: number;
  rows?: number;
  areas?: LayoutArea[];        // For custom layouts
}

interface LayoutArea {
  viewConfigId: UUID;
  gridArea: string;            // CSS grid-area value
}
```

### ViewGroup State Rules

```typescript
function computeViewGroupState(viewGroup: ViewGroup): ViewGroupState {
  const viewCount = viewGroup.viewCount;
  const hasName = viewGroup.name !== null;
  
  if (viewCount === 0) return 'empty';
  if (viewCount === 1 && !hasName) return 'solo';
  if (viewCount === 1 && hasName) return 'explicit_solo';
  if (viewCount >= 2) return 'named'; // name is required at this point
  
  throw new Error('Invalid ViewGroup state');
}
```

### ViewConfiguration (View)

```typescript
interface ViewConfiguration {
  id: UUID;                    // Server-generated, auditable
  viewGroupId: UUID;           // Always has parent ViewGroup
  datasetId: UUID;
  viewType: string;            // 'vtk-slice', 'vtk-volume', 'plotly-scatter', etc.
  name: string | null;         // Optional custom name
  
  // View state (type-specific)
  camera: CameraState;
  filters: FilterConfig[];
  colorMap: ColorMapConfig;
  widgets: WidgetConfig[];
  // ... other type-specific state
  
  createdAt: DateTime;
  createdBy: UUID;
  updatedAt: DateTime;
}
```

### View-to-View Link

```typescript
interface ViewLink {
  id: UUID;
  sourceViewId: UUID;          // Leader (sends updates)
  targetViewId: UUID;          // Follower (receives updates)
  property: LinkProperty;      // Which property is linked
  mode: LinkMode;              // Direction of sync
  active: boolean;             // Whether link is currently active
  
  // Pause state (for VG link override)
  pausedByVGLink: UUID | null; // If paused, which VG link caused it
  
  // Reconciliation tracking (for unidirectional followers)
  followerLastSyncedAt: DateTime;
  followerDivergedAt: DateTime | null;
  leaderStateHash: string;     // Hash of leader's property state at last sync
  
  createdAt: DateTime;
  createdBy: UUID;
}

type LinkProperty = 
  | 'camera'           // All types
  | 'filters'          // All types
  | 'colors'           // vtk, chart
  | 'widgets'          // All types
  | 'cursors'          // All types
  | 'annotations'      // vtk, image
  | 'windowLevel'      // vtk-slice, vtk-volume
  | 'slicePosition'    // vtk-slice
  | 'timePosition';    // vtk-4d, timeseries

type LinkMode = 
  | 'follow'           // ← Target receives from source only
  | 'sync'             // ↔ Bidirectional
  | 'broadcast';       // → Source sends to target only

// Property applicability by view type
const PROPERTY_APPLICABLE_TYPES: Record<LinkProperty, string[]> = {
  camera: ['*'],                              // All types
  filters: ['*'],
  colors: ['vtk-*', 'plotly-*'],
  widgets: ['*'],
  cursors: ['*'],
  annotations: ['vtk-*', 'image'],
  windowLevel: ['vtk-slice', 'vtk-volume'],
  slicePosition: ['vtk-slice'],
  timePosition: ['vtk-4d', 'timeseries'],
};
```

### ViewGroup-to-ViewGroup Link

```typescript
interface ViewGroupLink {
  id: UUID;
  originatorGroupId: UUID;     // The group that initiated - their links pause
  targetGroupId: UUID;         // The group being linked to - unaffected
  mode: LinkMode;              // Same modes as view links
  properties: LinkProperty[];  // Which properties are linked
  active: boolean;
  
  createdAt: DateTime;
  createdBy: UUID;
}
```

### View Activity Tracking (for reconciliation)

```typescript
interface ViewActivity {
  viewId: UUID;
  userId: UUID;
  activeAt: DateTime;          // When user started interacting
  inactiveAt: DateTime | null; // When user stopped (null = still active)
}
```

---

## API Endpoints

### ViewGroup CRUD

```typescript
// Create ViewGroup (can be empty for templates)
POST /api/workspaces/:workspaceId/viewgroups
Body: {
  name?: string;               // Optional - null for solo
  color?: string;              // Optional - auto-assigned if omitted
  layout?: LayoutConfig;       // Optional - defaults to 'single'
}
Response: ViewGroup

// Get ViewGroup
GET /api/viewgroups/:id
Response: ViewGroup & { views: ViewConfiguration[] }

// Update ViewGroup
PATCH /api/viewgroups/:id
Body: {
  name?: string;
  color?: string;
  layout?: LayoutConfig;
}
Response: ViewGroup

// Delete ViewGroup
DELETE /api/viewgroups/:id
// Also deletes all contained ViewConfigurations

// Duplicate ViewGroup
POST /api/viewgroups/:id/duplicate
Body: {
  name: string;
  linkOption: 'keep_individual' | 'link_to_original' | 'no_links';
  linkDirection?: 'duplicate_follows' | 'original_follows';  // Only if link_to_original
}
Response: ViewGroup & { vgLink?: ViewGroupLink }

// Dissolve ViewGroup (split into solo ViewGroups)
POST /api/viewgroups/:id/dissolve
Response: { newViewGroups: ViewGroup[] }
```

### ViewGroup Auto-Creation (on view creation)

```typescript
// Create View - automatically creates solo ViewGroup if needed
POST /api/workspaces/:workspaceId/views
Body: {
  viewGroupId?: UUID;          // Optional - if omitted, creates new solo ViewGroup
  datasetId: UUID;
  viewType: string;
  // ... initial state
}
Response: ViewConfiguration & { viewGroup: ViewGroup }
```

### View-to-View Links

```typescript
// Create link
POST /api/links/view
Body: {
  sourceViewId: UUID;
  targetViewId: UUID;
  property: LinkProperty;
  mode: LinkMode;
}
Response: ViewLink

// Get links for a view
GET /api/views/:viewId/links
Query: { direction?: 'incoming' | 'outgoing' | 'all' }
Response: ViewLink[]

// Update link
PATCH /api/links/view/:id
Body: {
  mode?: LinkMode;
  active?: boolean;
}
Response: ViewLink

// Delete link
DELETE /api/links/view/:id
```

### ViewGroup-to-ViewGroup Links

```typescript
// Create VG link
POST /api/links/viewgroup
Body: {
  originatorGroupId: UUID;
  targetGroupId: UUID;
  mode: LinkMode;
  properties: LinkProperty[];
}
Response: ViewGroupLink
// Side effect: Pauses applicable individual links on originator

// Get VG links for a group
GET /api/viewgroups/:id/vglinks
Query: { role?: 'originator' | 'target' | 'all' }
Response: ViewGroupLink[]

// Update VG link
PATCH /api/links/viewgroup/:id
Body: {
  mode?: LinkMode;
  properties?: LinkProperty[];
  active?: boolean;
}
Response: ViewGroupLink
// Side effect: Updates which individual links are paused

// Delete VG link
DELETE /api/links/viewgroup/:id
// Side effect: Resumes paused individual links on originator
```

### Reconciliation

```typescript
// Check if view needs reconciliation
GET /api/views/:viewId/reconciliation-status
Response: {
  needsReconciliation: boolean;
  divergedLinks: Array<{
    linkId: UUID;
    property: LinkProperty;
    leaderChanged: boolean;
    followerChanged: boolean;
  }>;
}

// Perform reconciliation
POST /api/views/:viewId/reconcile
Body: {
  linkId: UUID;
  action: 'sync_to_leader' | 'keep_mine';
}
Response: ViewLink
```

---

## Core Business Logic

### 1. ViewGroup State Transitions

```typescript
async function onViewAddedToGroup(viewGroupId: UUID): Promise<void> {
  const group = await getViewGroup(viewGroupId);
  const newCount = group.viewCount + 1;
  
  if (newCount === 2 && group.name === null) {
    // Solo → Named: Auto-generate name
    const firstView = await getFirstViewInGroup(viewGroupId);
    const autoName = generateViewGroupName(firstView);
    await updateViewGroup(viewGroupId, { name: autoName });
  }
}

function generateViewGroupName(firstView: ViewConfiguration): string {
  if (firstView.name) {
    return `${firstView.name} Group`;
  }
  
  const typeDisplayNames: Record<string, string> = {
    'vtk-slice': 'Slice',
    'vtk-volume': 'Volume Render',
    'vtk-mesh': 'Mesh',
    'plotly-scatter': 'Scatter Plot',
    'plotly-line': 'Line Chart',
    // ... etc
  };
  
  const typeName = typeDisplayNames[firstView.viewType] || 'View';
  return `${typeName} Group`;
}

async function onViewRemovedFromGroup(viewGroupId: UUID): Promise<void> {
  const group = await getViewGroup(viewGroupId);
  const newCount = group.viewCount - 1;
  
  // Named → Explicit Solo: Keep the name (don't revert to hidden)
  // User invested in naming, preserve it
  
  if (newCount === 0) {
    // Empty group - keep or delete based on context
    // Templates: Keep
    // Runtime: Could prompt user or auto-delete
  }
}
```

### 2. VG Link Creation with Pause Logic

```typescript
async function createViewGroupLink(
  originatorGroupId: UUID,
  targetGroupId: UUID,
  mode: LinkMode,
  properties: LinkProperty[]
): Promise<ViewGroupLink> {
  // 1. Validate compatibility
  await validateVGLinkCompatibility(originatorGroupId, targetGroupId);
  
  // 2. Create the VG link
  const vgLink = await db.viewGroupLinks.create({
    originatorGroupId,
    targetGroupId,
    mode,
    properties,
    active: true,
  });
  
  // 3. Pause applicable individual links on originator
  await pauseOriginatorLinks(originatorGroupId, vgLink.id, properties);
  
  return vgLink;
}

async function pauseOriginatorLinks(
  originatorGroupId: UUID,
  vgLinkId: UUID,
  properties: LinkProperty[]
): Promise<void> {
  // Get all views in originator group
  const views = await getViewsInGroup(originatorGroupId);
  const viewIds = views.map(v => v.id);
  
  // Find individual links that should be paused
  // Only pause INCOMING unidirectional links (Follow mode)
  // Do NOT pause: Sync (bidirectional) or Broadcast (outgoing)
  const linksToProcess = await db.viewLinks.findMany({
    where: {
      targetViewId: { in: viewIds },  // Incoming to originator's views
      property: { in: properties },
      active: true,
      pausedByVGLink: null,           // Not already paused
    },
  });
  
  for (const link of linksToProcess) {
    if (link.mode === 'follow') {
      // This is an incoming unidirectional link - pause it
      await db.viewLinks.update({
        where: { id: link.id },
        data: { pausedByVGLink: vgLinkId },
      });
    }
    // Sync and Broadcast links are NOT paused
  }
}

async function deleteViewGroupLink(vgLinkId: UUID): Promise<void> {
  const vgLink = await db.viewGroupLinks.findUnique({ where: { id: vgLinkId } });
  
  // Resume paused links
  await db.viewLinks.updateMany({
    where: { pausedByVGLink: vgLinkId },
    data: { pausedByVGLink: null },
  });
  
  // Delete the VG link
  await db.viewGroupLinks.delete({ where: { id: vgLinkId } });
}
```

### 3. Link Sync Logic

```typescript
async function shouldSyncProperty(
  link: ViewLink,
  targetView: ViewConfiguration
): Promise<boolean> {
  // 1. Check if link is active
  if (!link.active) return false;
  
  // 2. Check if paused by VG link
  if (link.pausedByVGLink !== null) return false;
  
  // 3. Check if property is applicable to target view type
  const applicableTypes = PROPERTY_APPLICABLE_TYPES[link.property];
  if (!isTypeApplicable(targetView.viewType, applicableTypes)) return false;
  
  // 4. Check if target view is active (for unidirectional follow)
  if (link.mode === 'follow') {
    const isActive = await isViewActiveByUser(targetView.id);
    if (isActive) {
      // Follower is active - pause incoming, track for reconciliation
      await markFollowerDiverging(link.id);
      return false;
    }
  }
  
  return true;
}

function isTypeApplicable(viewType: string, applicableTypes: string[]): boolean {
  if (applicableTypes.includes('*')) return true;
  
  for (const pattern of applicableTypes) {
    if (pattern.endsWith('*')) {
      const prefix = pattern.slice(0, -1);
      if (viewType.startsWith(prefix)) return true;
    } else if (viewType === pattern) {
      return true;
    }
  }
  
  return false;
}
```

### 4. Reconciliation Logic

```typescript
async function checkReconciliationNeeded(
  viewId: UUID,
  userId: UUID
): Promise<ReconciliationStatus[]> {
  const results: ReconciliationStatus[] = [];
  
  // Get all incoming unidirectional links for this view
  const followLinks = await db.viewLinks.findMany({
    where: {
      targetViewId: viewId,
      mode: 'follow',
      active: true,
      pausedByVGLink: null,
    },
  });
  
  for (const link of followLinks) {
    // Check if leader has changed since last sync
    const leader = await getView(link.sourceViewId);
    const currentLeaderHash = computePropertyHash(leader, link.property);
    const leaderChanged = currentLeaderHash !== link.leaderStateHash;
    
    // Check if follower has diverged
    const followerChanged = link.followerDivergedAt !== null;
    
    if (leaderChanged || followerChanged) {
      results.push({
        linkId: link.id,
        property: link.property,
        leaderChanged,
        followerChanged,
      });
    }
  }
  
  return results;
}

async function performReconciliation(
  linkId: UUID,
  action: 'sync_to_leader' | 'keep_mine'
): Promise<void> {
  const link = await db.viewLinks.findUnique({ where: { id: linkId } });
  const leader = await getView(link.sourceViewId);
  const follower = await getView(link.targetViewId);
  
  if (action === 'sync_to_leader') {
    // Copy leader's property state to follower
    await syncPropertyToView(follower.id, link.property, leader);
  }
  
  // Update link tracking
  const newHash = computePropertyHash(leader, link.property);
  await db.viewLinks.update({
    where: { id: linkId },
    data: {
      followerLastSyncedAt: new Date(),
      followerDivergedAt: null,
      leaderStateHash: newHash,
    },
  });
}

function computePropertyHash(view: ViewConfiguration, property: LinkProperty): string {
  const propertyValue = view[property];
  return crypto.createHash('sha256')
    .update(JSON.stringify(propertyValue))
    .digest('hex')
    .substring(0, 16);
}
```

### 5. Duplication with Link Handling

```typescript
async function duplicateViewGroup(
  sourceGroupId: UUID,
  options: DuplicateOptions
): Promise<{ newGroup: ViewGroup; vgLink?: ViewGroupLink }> {
  const sourceGroup = await getViewGroup(sourceGroupId);
  
  // 1. Create new ViewGroup
  const newGroup = await db.viewGroups.create({
    data: {
      workspaceId: sourceGroup.workspaceId,
      name: options.name,
      color: options.color || generateNextColor(),
      layout: sourceGroup.layout,
    },
  });
  
  // 2. Duplicate all views
  const sourceViews = await getViewsInGroup(sourceGroupId);
  const viewIdMap = new Map<UUID, UUID>(); // old ID → new ID
  
  for (const view of sourceViews) {
    const newView = await duplicateView(view.id, { viewGroupId: newGroup.id });
    viewIdMap.set(view.id, newView.id);
  }
  
  // 3. Handle links based on option
  let vgLink: ViewGroupLink | undefined;
  
  switch (options.linkOption) {
    case 'keep_individual':
      // Copy individual links, pointing to same external targets
      await copyIndividualLinks(sourceGroupId, newGroup.id, viewIdMap);
      break;
      
    case 'link_to_original':
      // Create VG link between duplicate and original
      const originatorId = options.linkDirection === 'original_follows' 
        ? sourceGroupId 
        : newGroup.id;
      const targetId = options.linkDirection === 'original_follows'
        ? newGroup.id
        : sourceGroupId;
      
      vgLink = await createViewGroupLink(
        originatorId,
        targetId,
        'sync',
        ALL_LINK_PROPERTIES
      );
      break;
      
    case 'no_links':
      // Clean slate - do nothing
      break;
  }
  
  return { newGroup, vgLink };
}

async function copyIndividualLinks(
  sourceGroupId: UUID,
  newGroupId: UUID,
  viewIdMap: Map<UUID, UUID>
): Promise<void> {
  const sourceViews = await getViewsInGroup(sourceGroupId);
  
  for (const sourceView of sourceViews) {
    const newViewId = viewIdMap.get(sourceView.id)!;
    
    // Copy outgoing links (source → external)
    const outgoingLinks = await db.viewLinks.findMany({
      where: { sourceViewId: sourceView.id },
    });
    
    for (const link of outgoingLinks) {
      // Skip internal links (within the group being duplicated)
      if (viewIdMap.has(link.targetViewId)) continue;
      
      await db.viewLinks.create({
        data: {
          sourceViewId: newViewId,
          targetViewId: link.targetViewId,
          property: link.property,
          mode: link.mode,
          active: link.active,
        },
      });
    }
    
    // Copy incoming links (external → source)
    const incomingLinks = await db.viewLinks.findMany({
      where: { targetViewId: sourceView.id },
    });
    
    for (const link of incomingLinks) {
      // Skip internal links
      if (viewIdMap.has(link.sourceViewId)) continue;
      
      await db.viewLinks.create({
        data: {
          sourceViewId: link.sourceViewId,
          targetViewId: newViewId,
          property: link.property,
          mode: link.mode,
          active: link.active,
        },
      });
    }
  }
}
```

---

## Y.js Integration

### What Lives in Y.js (Ephemeral/Real-time)

```typescript
// Workspace-level Y.Doc structure
interface YWorkspaceState {
  // Active view per user (for instance tools targeting)
  activeViews: Y.Map<UUID, UUID>;  // userId → viewId
  
  // Cursor positions per user per view
  cursors: Y.Map<string, CursorState>;  // `${userId}:${viewId}` → cursor
  
  // Presence (who's in this workspace)
  presence: Y.Map<UUID, PresenceState>;  // userId → presence
  
  // Live property updates (camera, etc.) - NOT persisted
  liveState: Y.Map<string, any>;  // `${viewId}:${property}` → state
}
```

### What Lives in PostgreSQL (Persistent/Auditable)

```typescript
// All ViewGroups, ViewConfigurations, and Links
// Audit trail of who created/modified what
// Saved camera positions, filter configs, etc.
// Link definitions and pause states
```

### Sync Flow

```typescript
// User changes camera in View A
// 1. Update Y.js liveState immediately (for real-time feel)
yWorkspace.liveState.set(`${viewA.id}:camera`, newCameraState);

// 2. Debounce persist to PostgreSQL (500ms)
debouncedPersist(viewA.id, 'camera', newCameraState);

// 3. Link sync evaluates:
for (const link of outgoingCameraLinks(viewA.id)) {
  if (await shouldSyncProperty(link, getView(link.targetViewId))) {
    // Update target via Y.js for real-time
    yWorkspace.liveState.set(`${link.targetViewId}:camera`, newCameraState);
    // Persist target's new state
    debouncedPersist(link.targetViewId, 'camera', newCameraState);
  }
}
```

---

## Database Schema (PostgreSQL)

```sql
-- ViewGroups
CREATE TABLE view_groups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  name VARCHAR(255),  -- NULL for solo/hidden
  color VARCHAR(7) NOT NULL,  -- Hex color
  layout JSONB NOT NULL DEFAULT '{"type": "single"}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by UUID NOT NULL REFERENCES users(id),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  CONSTRAINT valid_color CHECK (color ~ '^#[0-9A-Fa-f]{6}$')
);

-- Index for workspace queries
CREATE INDEX idx_view_groups_workspace ON view_groups(workspace_id);

-- ViewConfigurations
CREATE TABLE view_configurations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  view_group_id UUID NOT NULL REFERENCES view_groups(id) ON DELETE CASCADE,
  dataset_id UUID NOT NULL REFERENCES datasets(id),
  view_type VARCHAR(50) NOT NULL,
  name VARCHAR(255),
  
  -- State stored as JSONB for flexibility
  camera JSONB,
  filters JSONB,
  color_map JSONB,
  widgets JSONB,
  window_level JSONB,
  slice_position JSONB,
  time_position JSONB,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by UUID NOT NULL REFERENCES users(id),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_view_configs_group ON view_configurations(view_group_id);
CREATE INDEX idx_view_configs_dataset ON view_configurations(dataset_id);

-- View-to-View Links
CREATE TABLE view_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source_view_id UUID NOT NULL REFERENCES view_configurations(id) ON DELETE CASCADE,
  target_view_id UUID NOT NULL REFERENCES view_configurations(id) ON DELETE CASCADE,
  property VARCHAR(50) NOT NULL,
  mode VARCHAR(20) NOT NULL CHECK (mode IN ('follow', 'sync', 'broadcast')),
  active BOOLEAN NOT NULL DEFAULT TRUE,
  
  -- Pause state
  paused_by_vg_link UUID REFERENCES view_group_links(id) ON DELETE SET NULL,
  
  -- Reconciliation tracking
  follower_last_synced_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  follower_diverged_at TIMESTAMPTZ,
  leader_state_hash VARCHAR(16),
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by UUID NOT NULL REFERENCES users(id),
  
  -- Prevent duplicate links
  UNIQUE(source_view_id, target_view_id, property)
);

CREATE INDEX idx_view_links_source ON view_links(source_view_id);
CREATE INDEX idx_view_links_target ON view_links(target_view_id);
CREATE INDEX idx_view_links_paused ON view_links(paused_by_vg_link) WHERE paused_by_vg_link IS NOT NULL;

-- ViewGroup-to-ViewGroup Links
CREATE TABLE view_group_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  originator_group_id UUID NOT NULL REFERENCES view_groups(id) ON DELETE CASCADE,
  target_group_id UUID NOT NULL REFERENCES view_groups(id) ON DELETE CASCADE,
  mode VARCHAR(20) NOT NULL CHECK (mode IN ('follow', 'sync', 'broadcast')),
  properties JSONB NOT NULL,  -- Array of property names
  active BOOLEAN NOT NULL DEFAULT TRUE,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by UUID NOT NULL REFERENCES users(id),
  
  -- Prevent duplicate VG links
  UNIQUE(originator_group_id, target_group_id)
);

CREATE INDEX idx_vg_links_originator ON view_group_links(originator_group_id);
CREATE INDEX idx_vg_links_target ON view_group_links(target_group_id);

-- View Activity (for reconciliation)
CREATE TABLE view_activity (
  view_id UUID NOT NULL REFERENCES view_configurations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id),
  active_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  inactive_at TIMESTAMPTZ,
  
  PRIMARY KEY (view_id, user_id, active_at)
);

CREATE INDEX idx_view_activity_active ON view_activity(view_id, user_id) 
  WHERE inactive_at IS NULL;

-- Audit log for research compliance
CREATE TABLE audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_type VARCHAR(50) NOT NULL,
  entity_id UUID NOT NULL,
  action VARCHAR(50) NOT NULL,
  old_value JSONB,
  new_value JSONB,
  user_id UUID NOT NULL REFERENCES users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_audit_entity ON audit_log(entity_type, entity_id);
CREATE INDEX idx_audit_time ON audit_log(created_at);
```

---

## Testing Scenarios

### ViewGroup State Transitions

```typescript
describe('ViewGroup States', () => {
  test('new view creates solo ViewGroup', async () => {
    const view = await createView({ datasetId, viewType: 'vtk-slice' });
    expect(view.viewGroup.name).toBeNull();
    expect(view.viewGroup.state).toBe('solo');
  });
  
  test('adding second view auto-names group', async () => {
    const view1 = await createView({ datasetId, viewType: 'vtk-slice' });
    const view2 = await createView({ 
      viewGroupId: view1.viewGroupId, 
      viewType: 'vtk-volume' 
    });
    
    const group = await getViewGroup(view1.viewGroupId);
    expect(group.name).toBe('Slice Group');  // Based on first view
    expect(group.state).toBe('named');
  });
  
  test('removing views preserves name (explicit solo)', async () => {
    // ... create group with 2 views, then remove one
    expect(group.name).toBe('Slice Group');  // Name preserved
    expect(group.state).toBe('explicit_solo');
  });
});
```

### Link Pause Behavior

```typescript
describe('Originator Principle', () => {
  test('VG link pauses originator follow links only', async () => {
    // Setup: View W in GroupB has follow link from View V
    const linkVtoW = await createViewLink({
      sourceViewId: viewV.id,
      targetViewId: viewW.id,
      property: 'camera',
      mode: 'follow',
    });
    
    // Create VG link with GroupB as originator
    await createViewGroupLink({
      originatorGroupId: groupB.id,
      targetGroupId: groupA.id,
      mode: 'sync',
      properties: ['camera'],
    });
    
    // Check: linkVtoW should be paused
    const updatedLink = await getViewLink(linkVtoW.id);
    expect(updatedLink.pausedByVGLink).not.toBeNull();
  });
  
  test('VG link does NOT pause sync links', async () => {
    // Setup: View W has bidirectional sync with View V
    const linkVtoW = await createViewLink({
      sourceViewId: viewV.id,
      targetViewId: viewW.id,
      property: 'camera',
      mode: 'sync',
    });
    
    // Create VG link
    await createViewGroupLink({ /* ... */ });
    
    // Check: sync link should NOT be paused
    const updatedLink = await getViewLink(linkVtoW.id);
    expect(updatedLink.pausedByVGLink).toBeNull();
  });
  
  test('VG link does NOT pause broadcast links', async () => {
    // ... similar test for broadcast mode
  });
  
  test('target group links are unaffected', async () => {
    // Setup: View Y in GroupA (target) has follow link
    const linkXtoY = await createViewLink({
      sourceViewId: viewX.id,  // External view
      targetViewId: viewY.id,  // In GroupA (target)
      property: 'camera',
      mode: 'follow',
    });
    
    // Create VG link with GroupB as originator, GroupA as target
    await createViewGroupLink({
      originatorGroupId: groupB.id,
      targetGroupId: groupA.id,
      mode: 'sync',
      properties: ['camera'],
    });
    
    // Check: GroupA's links should be unaffected
    const updatedLink = await getViewLink(linkXtoY.id);
    expect(updatedLink.pausedByVGLink).toBeNull();
  });
});
```

### Duplication

```typescript
describe('ViewGroup Duplication', () => {
  test('duplicate follows original by default', async () => {
    const { newGroup, vgLink } = await duplicateViewGroup(originalGroup.id, {
      name: 'Copy',
      linkOption: 'link_to_original',
      // linkDirection defaults to 'duplicate_follows'
    });
    
    expect(vgLink.originatorGroupId).toBe(newGroup.id);
    expect(vgLink.targetGroupId).toBe(originalGroup.id);
  });
  
  test('can reverse direction so original follows duplicate', async () => {
    const { newGroup, vgLink } = await duplicateViewGroup(originalGroup.id, {
      name: 'Experimental',
      linkOption: 'link_to_original',
      linkDirection: 'original_follows',
    });
    
    expect(vgLink.originatorGroupId).toBe(originalGroup.id);
    expect(vgLink.targetGroupId).toBe(newGroup.id);
  });
});
```

---

## Implementation Checklist

### Phase 1: Core Data Model
- [ ] ViewGroup table and CRUD
- [ ] ViewConfiguration table and CRUD
- [ ] Auto-create solo ViewGroup on view creation
- [ ] Auto-name on second view added
- [ ] State preservation on view removal

### Phase 2: View-to-View Links
- [ ] ViewLink table and CRUD
- [ ] Link property applicability checking
- [ ] Link mode handling (follow/sync/broadcast)
- [ ] Y.js integration for real-time sync

### Phase 3: ViewGroup Links
- [ ] ViewGroupLink table and CRUD
- [ ] Originator principle implementation
- [ ] Pause/resume individual links
- [ ] Property-level VG linking

### Phase 4: Reconciliation
- [ ] View activity tracking
- [ ] Divergence detection
- [ ] Leader state hashing
- [ ] Reconciliation API endpoints

### Phase 5: Duplication
- [ ] Full duplication with all options
- [ ] Link copying logic
- [ ] Direction toggle

---

## Questions for Implementation

1. **Color palette:** Should ViewGroups use a fixed palette or allow custom colors?
2. **Audit granularity:** Log every camera change or debounce to significant changes?
3. **Reconciliation UX:** Auto-show prompt or wait for user to access view?
4. **VG link creation:** Require both parties' consent or unilateral?
