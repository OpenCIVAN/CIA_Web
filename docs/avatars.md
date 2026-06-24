# Avatar System

OpenCIVAN includes a modular avatar subsystem for collaborative WebXR sessions. Avatars show who is present, where they are looking, what they are pointing at, and whether they are speaking.

---

## What is implemented

| Feature | Status |
|---|---|
| Procedural fallback avatar (head + hands + pointer ray) | ✅ |
| Name label above head | ✅ |
| Speaking indicator on label | ✅ |
| VRM avatar loading (`@pixiv/three-vrm`) | ✅ |
| VRM upper-body pose (head + arms) | ✅ |
| Remote pose sync via Y.js | ✅ |
| Pose interpolation / smoothing | ✅ |
| Stale avatar hiding (5s timeout) | ✅ |
| Desktop mode fallback | ✅ |
| Scale-aware avatar sizing | ✅ via `VRScaleVisibility` |
| Avatar enable/disable toggle | ✅ via `vrAvatarSystem.setEnabled(bool)` |

---

## What is not yet implemented

- Full-body IK (lower body, legs)
- Hand tracking (finger joints) — infrastructure exists, visuals not wired
- Lip sync
- Custom emotes or gestures
- Multiple simultaneous avatar representations for the same user (e.g. hologram in desktop mode)
- Perfect billboard rotation (labels face -Z world direction; see Known Limitations)

---

## Architecture

```
VRExplorationManager
  │  calls initialize/update/dispose on
  ▼
VRAvatarSystem  (src/core/instances/types/vtk/vr/VTKVRAvatars.js)
  │  delegates to
  ▼
AvatarManager  (src/core/vr/avatars/AvatarManager.js)
  ├── LocalAvatarController   — extracts local pose from XR inputState
  ├── AvatarNetworkSync       — Y.js adapter (metadata + remote event dispatch)
  └── Map<userId, RemoteAvatarController>
          ├── SimpleAvatarFallback  — VTK.js geometry (default)
          └── VRMAvatar             — Three.js VRM billboard (when avatarUrl set)
```

---

## Why VRM

[VRM](https://vrm.dev/en/) is an open, glTF-based format for humanoid avatars. It is platform-independent, supported by a growing ecosystem of tools (Blender, VRoid Studio), and backed by `@pixiv/three-vrm` which is MIT-licensed and actively maintained.

Ready Player Me and Meta Avatars are explicitly **not** required dependencies. Both can be added as optional integrations that provide a VRM URL or replace the avatar loader module.

---

## Fallback avatar

When no `avatarUrl` is set, or when VRM loading fails, `SimpleAvatarFallback` is used automatically. It renders:

- **Head** — sphere (r = 0.12 m) in the user's presence color
- **Left hand** — small sphere (r = 0.04 m), color-shifted blue
- **Right hand** — small sphere (r = 0.04 m), color-shifted red
- **Pointer ray** — thin line extending 0.8 m from the right hand
- **Name label** — canvas-texture plane floating 0.28 m above head

No external files are required.

---

## How to provide a VRM avatar

Call `vrAvatarSystem.setLocalAvatarUrl(url)` after a session has started:

```javascript
import { vrAvatarSystem } from '@Core/instances/types/vtk/vr/VTKVRAvatars.js';

// During or after VR session start:
vrAvatarSystem.setLocalAvatarUrl('https://your-cdn.example.com/avatar.vrm');

// Revert to procedural fallback:
vrAvatarSystem.setLocalAvatarUrl(null);
```

The URL is broadcast to remote users via the `yAvatars` Y.js map so they will also load your VRM.

VRM files are **not** committed to this repository. Host them on a CDN or local server.

---

## How local pose tracking works

`LocalAvatarController` receives `inputState` from `VRExplorationManager._onFrame()` every frame and extracts:

| Source | Destination |
|---|---|
| `viewerPose.transform` | Head position + orientation |
| `inputSource.gripSpace` pose | Left/right hand position + orientation |
| `inputSource.targetRaySpace` pose | Pointer ray origin + direction |

Pose updates are throttled to 20 fps (50 ms) before being passed to `VRParticipantSync`, which writes to the `vr-participants-<sessionId>` Y.js map.

---

## How remote avatar sync works

Two Y.js channels carry different data:

| Channel | Frequency | Contents |
|---|---|---|
| `vr-participants-<sessionId>` Y.js map | ~20 fps | Head + hand poses (managed by `VRParticipantSync`) |
| `avatars` Y.js map | On-change | `displayName`, `color`, `avatarUrl`, `isSpeaking` |

Remote pose changes trigger a `cia:vr-participant-update` window event (dispatched by `VRParticipantSync`). `AvatarNetworkSync` listens to this event and calls `RemoteAvatarController.receivePose()`.

`RemoteAvatarController` interpolates the pose smoothly (lerp position, slerp orientation) and applies the VR-space → scene-space coordinate transform before updating VTK.js actor positions.

---

## Coordinate systems

| Space | Description |
|---|---|
| **WebXR local-floor** | Meters, Y-up, origin at floor. Used in network transport. |
| **VTK scene space** | Dataset units. Conversion: `scenePos = (vrPos / vrScale) + vrOrigin` |

`RemoteAvatarController._toScenePose()` applies this transform using `vrContext.vrScale` and `vrContext.vrOrigin` (updated live by `VRExplorationManager` each frame).

---

## VRM rendering approach

VRM avatars are rendered to a hidden `<canvas>` by a separate Three.js `WebGLRenderer`. The pixel data is uploaded to a VTK.js texture on a billboard plane when the pose changes. This avoids the fragile pattern of sharing a WebGL context between VTK.js and Three.js in WebXR.

**Performance note**: `gl.readPixels()` stalls the GPU pipeline. The texture upload only occurs when the pose is dirtied (at most 20 times/second). For large sessions (10+ users), prefer `SimpleAvatarFallback` by leaving `avatarUrl` unset.

---

## Known limitations

- **Label orientation**: Name labels are oriented toward world -Z by default. They face the local user's head once the first pose is received, but may be readable from only one side in practice. Proper billboarding would require knowing the local eye position each frame — this is a planned improvement.
- **VRM lower body**: Hips and legs are not animated. Only the head and upper arms are updated.
- **First-frame flicker**: The VRM billboard becomes visible only after the first texture upload (~50 ms after loading).
- **VRM cache**: `VRMAvatar` caches loaded models by URL in memory. The cache is never evicted. For long sessions with many different VRM URLs, monitor memory usage.

---

## Future extensions

| Feature | Notes |
|---|---|
| **Ready Player Me** | Can serve as a VRM source — RPM supports glTF export; wrap in a `VRMAvatarLoader` that fetches from RPM API |
| **Meta Avatars SDK** | Platform-specific module for Quest; would bypass VRM loading entirely on that platform |
| **Full-body IK** | Requires at least hip + feet tracking (available with Quest Pro body tracking) |
| **Lip sync** | Drive VRM blendShapes from LiveKit `ActiveSpeakersChanged` audio analysis |
| **Hand tracking joints** | XRHand interface poses are gathered; wire them into `SimpleAvatarFallback._ensureHandActors()` (see `VRControllerRenderer.js` for the pattern) |
| **Accessibility settings** | Color-blind-friendly avatar colors, high-contrast labels, scale adjustments |

---

## Disabling avatars

```javascript
import { vrAvatarSystem } from '@Core/instances/types/vtk/vr/VTKVRAvatars.js';

vrAvatarSystem.setEnabled(false);  // hides all remote avatars
vrAvatarSystem.setEnabled(true);   // restores them
```

Avatar data continues to sync over the network regardless of this flag. Only the VTK.js actor visibility is toggled.
