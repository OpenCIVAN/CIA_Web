# Architecture Overview

This document explains the architecture and extensibility of the CIA Web App.

## Current State (Phase 1)

### Core Technologies

- **VTK.js**: 3D visualization
- **React**: UI components
- **Y.js**: Real-time collaboration (in-memory)
- **WebRTC**: Voice chat

### Architecture Layers

```
┌─────────────────────────────────────┐
│         React UI Layer              │  Components, layouts
├─────────────────────────────────────┤
│    Collaboration Managers           │  Presence, datasets, visualizations
├─────────────────────────────────────┤
│         Y.js State (In-Memory)      │  Real-time sync
├─────────────────────────────────────┤
│       VTK.js (Outside React)        │  3D rendering
└─────────────────────────────────────┘
```

### Key Managers

**DatasetManager** (`src/core/data/managers/DatasetManager.js`)

- NEW three-layer architecture: Dataset → ViewConfiguration → InstanceWindow
- Loads and stores VTP files via IndexedDB
- Tracks dataset metadata (bounds, point count, etc.)
- Syncs metadata via Y.js (binary data stays local)
- Event-driven: emits 'datasetLoaded', 'datasetUpdated', 'datasetRemoved'

**WorkspaceManager** (`src/core/instances/workspaceManager.js`)

- Type-agnostic instance management (VTK, Plotly, Three.js, etc.)
- Uses InstanceTypeHandler plugin pattern
- Delegates to specific handlers (VTKInstanceHandler, etc.)
- Manages multi-instance grid layout

**PresenceSystem** (`src/collaboration/presence/presenceSystem.js`)

- Tracks online users via Y.js Awareness
- Heartbeat system for activity detection
- Status tracking (active/idle/away)
- Notifies React components of presence changes

### Plugin Architecture

**InstanceTypeHandler** (`src/core/instances/types/InstanceTypeInterface.js`)

- Base class for all instance types
- Reference implementation: VTKInstanceHandler
- Methods: initialize(), cleanup(), loadData(), getTools()
- Makes system extensible without modifying core code

**VTKInstanceHandler** (`src/core/instances/types/vtk/VTKInstanceHandler.js`)

- Reference implementation for VTK.js visualizations
- Demonstrates proper handler pattern
- Features: reduction, annotations, VR (coming)
- Blueprint for contributors adding new instance types

## Extension Points

### Adding Backend Persistence

**Current**: Y.js in-memory only (lost on server restart)

**To Add Persistence**:

1. Set up backend database (PostgreSQL recommended)
2. Create `server/persistence.js` with PersistenceManager
3. Hook into Y.js update events to save state
4. Load persisted state on connection

See `TODO (Backend)` markers in code for specific integration points.

**Files to modify**:

- `src/collaboration/yjsSetup.js` - Add persistence provider
- Create `server/persistence.js` - Backend save/load logic
- Create `server/database/schema.sql` - Database tables

### Adding Multiple Groups

**Current**: Single shared space for everyone

**To Add Groups**:

1. Add `yGroups` map to Y.js setup
2. Nest visualizations under group IDs
3. Add group membership tracking
4. Update UI to show/switch groups

See `TODO (Groups)` markers in code.

**Files to modify**:

- `src/collaboration/yjsSetup.js` - Add yGroups map
- `src/core/visualizationManager.js` - Group scoping logic
- Create `src/collaboration/groupManager.js`
- UI components for group switching

### Adding Access Control

**Current**: Everything is public to all connected users

**To Add Access Control**:

1. Add authentication system
2. Add role-based permissions
3. Check permissions before operations
4. Add audit logging

See `TODO (Access Control)` markers.

## Contributing

### Code Style

- Use JSDoc comments for public methods
- Add TODO markers for future extensibility
- Keep managers focused on single responsibility
- Avoid tight coupling between systems

### Adding Features

1. Check if extension point exists (look for TODO markers)
2. If adding new domain, create new manager
3. Add Y.js map if state needs syncing
4. Update this doc with new extension points

### Testing

- Test with multiple browser tabs (simulates multiple users)
- Check console for sync messages
- Verify state persists across tabs

## Questions?

Open an issue or join our Discord (link TBD)
