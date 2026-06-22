# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What This Is

**CIA Web** — Collaborative Immersive Analytics platform for real-time multi-user 3D scientific visualization. Stack: React 18 + VTK.js + WebXR frontend (Webpack), Node.js Express API, Y.js WebSocket server, Keycloak auth, PostgreSQL, MinIO object storage, Redis + BullMQ job queues, LiveKit voice, Python VTK worker, and Node thumbnail worker.

## Commands

### Frontend (Webpack, port 8081)
```bash
npm start                  # HTTPS dev server (needs certs/key.pem + certs/cert.pem)
npm run start:http         # HTTP mode (USE_HTTP=true) — for LiveKit testing
npm run dev                # Frontend + API server + Y.js WebSocket together
npm run dev:full           # All of above + LiveKit token server + LiveKit
npm run build              # Production bundle (also runs buildManifestRegistry.ts)
npm run typecheck          # TypeScript/JSDoc check without emitting
npm run clean:cache        # Clear Webpack filesystem cache
```

### Tests
```bash
npm test                   # Vitest in watch mode
npm run test:run           # Single run (CI)
npm run test:coverage      # Coverage report (v8, HTML output)
```
Tests live in `src/**/*.test.{js,jsx,ts,tsx}`. jsdom environment. Coverage scope: `src/ui/react/components/`.

### Backend Services (Docker)
```bash
./scripts/start.sh         # Start all Docker services
./scripts/stop.sh          # Stop (keep data)
./scripts/stop.sh --clean  # Stop + wipe volumes
./scripts/restart.sh       # Quick restart
./scripts/check-services.sh  # Health check all services
./scripts/rebuild-api.sh   # Rebuild only API container
```

### Database
```bash
./scripts/reset-database.sh          # Interactive wipe + reinit from init.sql
./scripts/reset-database.sh --quick  # No prompts
./scripts/reset-database.sh --rebuild # Reset + rebuild Docker images
./scripts/setup-local-auth.sh        # Create Keycloak test users
./scripts/load-demo-files.sh         # Upload demo VTP files
./scripts/seed-mock-users.sh         # Seed mock users for collab testing
```
After DB reset, also clear browser IndexedDB:
```javascript
indexedDB.deleteDatabase('cia-datasets'); location.reload();
```

### Storybook
```bash
npm run storybook          # Component development (port 6006)
```

## Service URLs

| Service | URL | Dev credentials |
|---------|-----|----------------|
| Frontend | https://localhost:8081 | accept self-signed cert |
| API | http://localhost:3001 | — |
| Y.js WebSocket | ws://localhost:9001 | — |
| MinIO Console | http://localhost:9002 | minioadmin / minioadmin |
| Keycloak | http://localhost:8080 | admin / admin123 |
| PostgreSQL | localhost:5432 | ciauser / ciadevpassword |
| Redis | localhost:6379 | — |
| LiveKit | ws://localhost:7880 | — |

## Architecture

```
Frontend (Webpack, src/)
├── ui/react/              React components + styles
│   ├── components/        Atomic design: atoms → molecules → organisms
│   ├── context/           React Context providers (AdaptiveContext for theming)
│   └── styles/            Design tokens, SCSS (light theme)
├── core/                  Business logic — NO direct React dependencies
│   ├── instances/types/vtk/  VTK.js 3D/2D visualization handlers
│   ├── managers/          Singleton data managers (source of truth)
│   ├── events/            EventBus (pub/sub for cross-module comms)
│   ├── session/           User session state
│   └── collaboration/     Y.js presence, cursors, shared editing
├── services/              High-level ops — UI calls these, not managers
│   ├── voice/             LiveKit room + command + feedback services
│   ├── storage/           IndexedDB (storageService), query cache, GC
│   ├── thumbnails/        Snapshot capture and caching
│   ├── authService.js     Keycloak OIDC
│   ├── apiClient.js       HTTP client (proxied to :3001 in dev)
│   └── syncService.js     Server state reconciliation
├── utils/                 Pure functions, no upstream imports
├── algorithms/            t-SNE, UMAP, PCA (client-side)
└── vr/                    WebXR / VR mode management

Backend (server/src/)
├── routes/                Express routes (views, workspaces, files, compute, matrix…)
├── services/              jobQueue, matrixBridge, recording, thumbnail, yjs persistence
└── middleware/            Auth (Keycloak JWT or DEV_BYPASS_AUTH header)

Workers
├── workers/vtk-python/    Python VTK compute worker (BullMQ consumer via Redis)
└── workers/thumbnail-node/ Puppeteer-based thumbnail renderer (BullMQ consumer)
```

**Dependency direction** (never reverse):
```
UI Components → Services → Managers → Core (EventBus, models) → Utils
```

## Path Aliases (webpack.config.js + vitest.config.js)

| Alias | Resolves to |
|-------|------------|
| `@UI` | `src/ui` |
| `@Services` | `src/services` |
| `@Utils` | `src/utils` |
| `@Core` | `src/core` |
| `@VTK` | `src/core/instances/types/vtk` |
| `@Init` | `src/init` |
| `@Algorithms` | `src/algorithms` |
| `@VR` | `src/vr` |

Vitest only has `@UI` and `@Utils` aliased — tests importing `@Core` or `@Services` need additional alias setup.

## Key Import Patterns

```javascript
// Components — always use barrel, not deep paths
import { Button, Badge, Icon, SearchInput } from '@UI/react/components';
import { FloatingPanel } from '@UI/react/components/layout';

// Services
import { viewLifecycleService, authService, apiClient, eventBus, BUS_EVENTS } from '@Services';
import { voiceRoomService } from '@Services/voice';

// Utils
import { hexToRgb, rgbToHex, lerpColor } from '@Utils/colorHelpers.js';  // color ops
import { logger } from '@Utils/logger.js';
import { generateId } from '@Utils/idGenerator.js';

// Theme colors (always from context, never hardcoded)
import { useAdaptive } from '@UI/react/context/AdaptiveContext.jsx';
const { colors } = useAdaptive();
```

## Dev Bypass Auth

Set `DEV_BYPASS_AUTH=true` in `.env` to skip Keycloak. Then pass user via header:
```bash
curl http://localhost:3001/api/workspaces \
  -H "x-user-id: 00000000-0000-0000-0000-000000000002"
```
Fixed dev UUIDs: `...0001` = System, `...0002` = CIA Admin (default), `...0003` = Alice, `...0004` = Bob, `...0005` = Viewer.

## Global Defines (injected by Webpack DefinePlugin)

`__API_BASE_URL__`, `__YJS_WS_URL__`, `__KEYCLOAK_URL__`, `__KEYCLOAK_REALM__`, `__KEYCLOAK_CLIENT_ID__`, `__LIVEKIT_URL__`, `__LIVEKIT_TOKEN_URL__`, `__DEV_BYPASS_AUTH__`. Set overrides in `.env`.

## Two Entry Points

- `src/index.js` → `index.html` (main app)
- `src/embed.js` → `embed.html` (embeddable widget)

## Matrix Federation

Optional Matrix/Synapse chat federation, toggled via `MATRIX_FEDERATION_ENABLED`. Requires a separate `cia_matrix_network` Docker network. Config in `server/matrix-config/`.
