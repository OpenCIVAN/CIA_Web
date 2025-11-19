# CIA Web: WebXR/VR Implementation Guide

A comprehensive guide to implementing VR features in CIA Web, from basics to advanced interactions.

---

## Table of Contents
1. [WebXR Fundamentals](#webxr-fundamentals)
2. [VR Architecture in CIA Web](#vr-architecture-in-cia-web)
3. [Step-by-Step Implementation](#step-by-step-implementation)
4. [Controller Input Handling](#controller-input-handling)
5. [Stereo Rendering](#stereo-rendering)
6. [Testing Without a Headset](#testing-without-a-headset)
7. [Common Issues & Solutions](#common-issues--solutions)
8. [Advanced Features](#advanced-features)

---

## WebXR Fundamentals

### What is WebXR?

**WebXR** is a browser API that lets web applications access VR/AR devices. Think of it as the bridge between your website and the user's headset.

**Key concepts:**

1. **XRSession** - Represents an active VR/AR session (like "being in VR mode")
2. **XRFrame** - One frame of rendering (60-90 times per second)
3. **XRPose** - The position and orientation of something (headset, controllers)
4. **XRInputSource** - Controllers, hands, or other input devices
5. **XRView** - One eye's view (left or right)

### Real-World Analogy

Imagine you're setting up a movie theater:
- **XRSession** = Opening the theater for business
- **XRFrame** = Each frame of the movie
- **XRPose** = Where each seat is positioned
- **XRInputSource** = The remote control for each seat
- **XRView** = The screen that each person sees

### The VR Rendering Loop

```
1. User clicks "Enter VR"
   ↓
2. Request XR session
   ↓
3. Session starts → Run render loop
   ↓
4. For each frame (90 times/second):
   - Get headset pose (where user is looking)
   - Get controller poses (where hands are)
   - Render left eye view
   - Render right eye view
   - Submit to headset
   ↓
5. User exits VR → Clean up session
```

---

## VR Architecture in CIA Web

### Two VR Modes

CIA Web supports **two different VR modes**:

#### 1. Instance VR (Per-Viewport)
**What it is:** Send ONE specific instance to the VR headset while other instances stay on desktop.

**Use case:** "I want to examine this brain scan in VR while keeping my analysis tools on my monitor."

**Implementation:** VTKInstanceHandler handles this

```javascript
// User clicks "Send to VR" on instance
await handler.enterInstanceVR(instanceData, xrSession);
// Now that instance renders in VR
// Desktop continues to work normally
```

#### 2. Application VR (Workspace)
**What it is:** The ENTIRE workspace goes into VR - you see all your instances floating in 3D space.

**Use case:** "I want to organize my viewports in 3D space and walk around my data lab."

**Implementation:** Global VR manager handles this

```javascript
// User clicks "Enter VR" button
await vrManager.enterApplicationVR();
// All instances adapt for VR context
// Workspace becomes a 3D environment
```

### Current Architecture Files

```
src/
├── vr/
│   └── vrModeManager.js           # Global VR state (desktop vs VR mode)
└── core/instances/types/vtk/
    └── vr/
        └── VTKVRController.js     # VTK-specific VR controller handling
```

**Status:** Both are **placeholder implementations** waiting for you to complete them!

---

## Step-by-Step Implementation

### Phase 1: Basic VR Session Management

Let's start by implementing the ability to enter VR mode.

#### Step 1: Check VR Support

**File:** `src/vr/vrModeManager.js`

```javascript
class VRModeManager {
  constructor() {
    this.currentMode = 'desktop'; // 'desktop' or 'vr'
    this.xrSession = null;
    this.xrReferenceSpace = null;
    this.listeners = [];
  }

  /**
   * Check if user's browser and device support VR
   */
  async checkVRSupport() {
    if (!navigator.xr) {
      console.warn('WebXR not supported in this browser');
      return false;
    }

    try {
      const supported = await navigator.xr.isSessionSupported('immersive-vr');
      if (supported) {
        console.log('✅ VR is supported!');
      } else {
        console.log('❌ VR headset not detected');
      }
      return supported;
    } catch (error) {
      console.error('Error checking VR support:', error);
      return false;
    }
  }

  /**
   * Enter VR mode
   */
  async enterVR() {
    const supported = await this.checkVRSupport();
    if (!supported) {
      alert('VR not supported. Connect a VR headset or use the WebXR emulator.');
      return null;
    }

    try {
      // Request VR session
      this.xrSession = await navigator.xr.requestSession('immersive-vr', {
        requiredFeatures: ['local-floor'],
        optionalFeatures: ['bounded-floor', 'hand-tracking']
      });

      console.log('🥽 VR session started!');

      // Set up reference space (coordinate system)
      this.xrReferenceSpace = await this.xrSession.requestReferenceSpace('local-floor');

      // Set up event listeners
      this.xrSession.addEventListener('end', this.onSessionEnd.bind(this));

      // Update mode
      this.setMode('vr');

      // Start render loop
      this.startRenderLoop();

      return this.xrSession;

    } catch (error) {
      console.error('Failed to enter VR:', error);
      alert(`Could not enter VR: ${error.message}`);
      return null;
    }
  }

  /**
   * Exit VR mode
   */
  async exitVR() {
    if (this.xrSession) {
      await this.xrSession.end();
      // onSessionEnd will be called automatically
    }
  }

  /**
   * Called when session ends
   */
  onSessionEnd() {
    console.log('🥽 VR session ended');
    this.xrSession = null;
    this.xrReferenceSpace = null;
    this.setMode('desktop');
  }

  /**
   * Start the VR render loop
   */
  startRenderLoop() {
    if (!this.xrSession) return;

    const onFrame = (time, frame) => {
      // Schedule next frame
      this.xrSession.requestAnimationFrame(onFrame);

      // Get viewer pose (where headset is)
      const pose = frame.getViewerPose(this.xrReferenceSpace);
      if (!pose) return;

      // Notify listeners (instances that need to render)
      this.notifyFrame(time, frame, pose);
    };

    this.xrSession.requestAnimationFrame(onFrame);
  }

  /**
   * Notify all listeners about a new frame
   */
  notifyFrame(time, frame, pose) {
    this.listeners.forEach(listener => {
      try {
        listener.onVRFrame(time, frame, pose);
      } catch (error) {
        console.error('Error in VR frame listener:', error);
      }
    });
  }

  /**
   * Register a listener for VR frames
   */
  addFrameListener(listener) {
    this.listeners.push(listener);
  }

  removeFrameListener(listener) {
    const index = this.listeners.indexOf(listener);
    if (index > -1) {
      this.listeners.splice(index, 1);
    }
  }

  // ... rest of your existing code
}

export const vrModeManager = new VRModeManager();
```

#### Step 2: Add VR Button to UI

**File:** `src/ui/react/components/toolbar/VRButton.jsx`

```javascript
import React, { useState, useEffect } from 'react';
import { vrModeManager } from '@VR/vrModeManager.js';

export function VRButton() {
  const [vrSupported, setVRSupported] = useState(false);
  const [vrActive, setVRActive] = useState(false);

  useEffect(() => {
    // Check VR support on mount
    vrModeManager.checkVRSupport().then(setVRSupported);

    // Listen for mode changes
    const handleModeChange = (mode) => {
      setVRActive(mode === 'vr');
    };

    vrModeManager.onModeChange(handleModeChange);

    return () => {
      // Cleanup if needed
    };
  }, []);

  const handleClick = async () => {
    if (vrActive) {
      await vrModeManager.exitVR();
    } else {
      await vrModeManager.enterVR();
    }
  };

  if (!vrSupported) {
    return (
      <button className="vr-button vr-button--disabled" disabled>
        🥽 VR Not Available
      </button>
    );
  }

  return (
    <button 
      className={`vr-button ${vrActive ? 'vr-button--active' : ''}`}
      onClick={handleClick}
    >
      {vrActive ? '🥽 Exit VR' : '🥽 Enter VR'}
    </button>
  );
}
```

**SCSS:** `src/ui/react/components/toolbar/VRButton.scss`

```scss
@import '../../styles/theme.scss';

.vr-button {
  @include button-primary;
  padding: $spacing-sm $spacing-md;
  font-size: $font-size-md;
  
  &--active {
    background: $color-success;
    animation: pulse 2s infinite;
  }
  
  &--disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.7; }
}
```

### Phase 2: Instance VR Integration

Now let's make VTK instances render in VR.

#### Step 3: Implement VTKInstanceHandler VR Methods

**File:** `src/core/instances/types/vtk/VTKInstanceHandler.js`

Replace the TODO stubs with real implementations:

```javascript
/**
 * Enter VR mode for this instance
 */
async enterInstanceVR(instanceData, xrSession) {
  console.log('🥽 Entering VR for VTK instance', instanceData.instanceId);

  const { sceneObjects } = instanceData;
  const { renderer, renderWindow, interactor } = sceneObjects;

  // Store original renderer settings
  const vrData = {
    xrSession,
    originalParent: renderer.getContainer(),
    renderWindowSize: renderWindow.getSize(),
  };

  // Get WebGL canvas
  const canvas = renderer.getCanvas();
  
  // Make canvas XR compatible
  const gl = canvas.getContext('webgl2', { xrCompatible: true });
  if (!gl) {
    throw new Error('Could not get WebGL2 context');
  }

  // Set up XR layers
  const glLayer = new XRWebGLLayer(xrSession, gl);
  await xrSession.updateRenderState({
    baseLayer: glLayer
  });

  // Register for frame updates
  vrData.frameListener = {
    onVRFrame: (time, frame, pose) => {
      this.renderVRFrame(instanceData, vrData, frame, pose);
    }
  };
  vrModeManager.addFrameListener(vrData.frameListener);

  return vrData;
}

/**
 * Render a VR frame (called 90 times per second)
 */
renderVRFrame(instanceData, vrData, frame, pose) {
  const { xrSession } = vrData;
  const { renderer, renderWindow } = instanceData.sceneObjects;
  
  // Get the WebGL layer
  const glLayer = xrSession.renderState.baseLayer;
  const gl = glLayer.context;

  // Bind framebuffer
  gl.bindFramebuffer(gl.FRAMEBUFFER, glLayer.framebuffer);

  // Render each eye
  for (const view of pose.views) {
    const viewport = glLayer.getViewport(view);
    
    // Set viewport for this eye
    gl.viewport(viewport.x, viewport.y, viewport.width, viewport.height);

    // Get camera from VTK
    const camera = renderer.getActiveCamera();

    // Update camera based on XR view
    this.updateCameraForVRView(camera, view);

    // Render
    renderer.render();
  }
}

/**
 * Update VTK camera to match XR view
 */
updateCameraForVRView(camera, xrView) {
  // XR view has transform matrix that positions the virtual camera
  const viewMatrix = xrView.transform.inverse.matrix;
  
  // Extract position from view matrix
  const position = [
    viewMatrix[12],
    viewMatrix[13],
    viewMatrix[14]
  ];

  // Extract view direction
  // (This is simplified - you may need more complex matrix math)
  const forward = [
    -viewMatrix[8],
    -viewMatrix[9],
    -viewMatrix[10]
  ];

  // Calculate focal point
  const focalPoint = [
    position[0] + forward[0],
    position[1] + forward[1],
    position[2] + forward[2]
  ];

  // Update VTK camera
  camera.setPosition(...position);
  camera.setFocalPoint(...focalPoint);
  camera.setViewUp(0, 1, 0); // Y-up

  // Update projection matrix
  camera.setProjectionMatrix(xrView.projectionMatrix);
}

/**
 * Exit VR mode
 */
async exitInstanceVR(instanceData, vrData) {
  console.log('🥽 Exiting VR for VTK instance', instanceData.instanceId);

  // Remove frame listener
  vrModeManager.removeFrameListener(vrData.frameListener);

  // Restore original settings
  const { renderer, renderWindow } = instanceData.sceneObjects;
  const camera = renderer.getActiveCamera();
  
  // Reset to desktop rendering
  camera.setProjectionMatrix(null); // Let VTK compute it
  renderWindow.render();
}

/**
 * Update instance while in VR (called every frame)
 */
async updateInstanceVR(instanceData, vrData, frame) {
  // This is called from the render loop
  // Most work happens in renderVRFrame
  // You can add frame-by-frame updates here if needed
}
```

### Phase 3: Controller Input

Now let's handle controller input (triggers, grips, etc.).

#### Step 4: Implement Controller Tracking

**File:** `src/core/instances/types/vtk/vr/VTKVRController.js`

Replace the placeholder with real implementation:

```javascript
class VRControllers {
  constructor() {
    this.instanceControllers = new Map(); // instanceId → controller data
  }

  /**
   * Initialize controllers for an instance
   */
  initialize(instanceId, sceneObjects, xrSession) {
    console.log('🎮 Initializing VR controllers for instance:', instanceId);

    const controllerData = {
      xrSession,
      sceneObjects,
      controllers: new Map(), // inputSource.handedness → controller state
      eventListeners: []
    };

    // Listen for controller connection
    xrSession.addEventListener('inputsourceschange', (event) => {
      this.onInputSourcesChange(instanceId, event);
    });

    // Listen for controller button presses
    xrSession.addEventListener('select', (event) => {
      this.onSelect(instanceId, event);
    });

    xrSession.addEventListener('selectstart', (event) => {
      this.onSelectStart(instanceId, event);
    });

    xrSession.addEventListener('selectend', (event) => {
      this.onSelectEnd(instanceId, event);
    });

    xrSession.addEventListener('squeeze', (event) => {
      this.onSqueeze(instanceId, event);
    });

    this.instanceControllers.set(instanceId, controllerData);
  }

  /**
   * Update controller poses (call this every frame)
   */
  updatePoses(instanceId, frame, referenceSpace) {
    const data = this.instanceControllers.get(instanceId);
    if (!data) return;

    const { xrSession, controllers } = data;

    // Update each controller's pose
    for (const inputSource of xrSession.inputSources) {
      if (!inputSource.gripSpace) continue;

      const pose = frame.getPose(inputSource.gripSpace, referenceSpace);
      if (!pose) continue;

      // Store pose
      const handedness = inputSource.handedness; // 'left' or 'right'
      let controller = controllers.get(handedness);
      
      if (!controller) {
        controller = {
          inputSource,
          pose: null,
          visualMesh: null // VTK mesh to visualize controller
        };
        controllers.set(handedness, controller);
        
        // Create visual representation
        this.createControllerVisual(instanceId, handedness);
      }

      controller.pose = pose;

      // Update visual position
      this.updateControllerVisual(instanceId, handedness, pose);
    }
  }

  /**
   * Create a visual mesh for a controller
   */
  createControllerVisual(instanceId, handedness) {
    const data = this.instanceControllers.get(instanceId);
    if (!data) return;

    const { sceneObjects } = data;
    const { renderer } = sceneObjects;

    // Import VTK modules (you may need to adjust imports)
    import('vtk.js/Sources/Filters/Sources/ConeSource')
      .then(({ default: vtkConeSource }) => {
        // Create cone to represent controller
        const coneSource = vtkConeSource.newInstance({
          height: 0.1,
          radius: 0.02,
          resolution: 16,
          direction: [0, 0, -1] // Point forward
        });

        const mapper = vtk.Rendering.Core.vtkMapper.newInstance();
        mapper.setInputConnection(coneSource.getOutputPort());

        const actor = vtk.Rendering.Core.vtkActor.newInstance();
        actor.setMapper(mapper);

        // Color code controllers
        const color = handedness === 'left' ? [1, 0, 0] : [0, 0, 1];
        actor.getProperty().setColor(...color);

        renderer.addActor(actor);

        // Store reference
        const controller = data.controllers.get(handedness);
        if (controller) {
          controller.visualMesh = actor;
        }
      });
  }

  /**
   * Update controller visual position
   */
  updateControllerVisual(instanceId, handedness, pose) {
    const data = this.instanceControllers.get(instanceId);
    if (!data) return;

    const controller = data.controllers.get(handedness);
    if (!controller || !controller.visualMesh) return;

    const { transform } = pose;
    const matrix = transform.matrix;

    // Extract position and orientation
    const position = [matrix[12], matrix[13], matrix[14]];
    
    // Apply to actor
    controller.visualMesh.setPosition(...position);
    
    // You can also set orientation if needed
    // (requires converting 4x4 matrix to VTK's orientation format)
  }

  /**
   * Handle trigger press (select button)
   */
  onSelect(instanceId, event) {
    console.log('🎮 Controller select (trigger):', event.inputSource.handedness);
    
    // Get ray from controller
    const pose = event.frame.getPose(
      event.inputSource.targetRaySpace,
      vrModeManager.xrReferenceSpace
    );

    if (pose) {
      // Cast ray to see what user is pointing at
      this.raycast(instanceId, pose);
    }
  }

  onSelectStart(instanceId, event) {
    console.log('🎮 Trigger pressed');
    // Trigger is being held down
  }

  onSelectEnd(instanceId, event) {
    console.log('🎮 Trigger released');
    // Trigger was released
  }

  /**
   * Handle grip press (side button)
   */
  onSqueeze(instanceId, event) {
    console.log('🎮 Controller squeeze (grip):', event.inputSource.handedness);
    // User pressed grip button - could be used for grabbing, teleporting, etc.
  }

  /**
   * Handle controller connection/disconnection
   */
  onInputSourcesChange(instanceId, event) {
    console.log('🎮 Controllers changed');
    event.added.forEach(source => {
      console.log('  Added:', source.handedness, source.targetRayMode);
    });
    event.removed.forEach(source => {
      console.log('  Removed:', source.handedness);
    });
  }

  /**
   * Raycast from controller to see what user is pointing at
   */
  raycast(instanceId, pose) {
    const data = this.instanceControllers.get(instanceId);
    if (!data) return;

    // Ray origin and direction
    const origin = [
      pose.transform.position.x,
      pose.transform.position.y,
      pose.transform.position.z
    ];

    const matrix = pose.transform.matrix;
    const direction = [
      -matrix[8],  // Forward direction from controller
      -matrix[9],
      -matrix[10]
    ];

    console.log('📍 Raycast from:', origin, 'direction:', direction);

    // TODO: Implement actual raycasting against VTK geometry
    // This would check if the ray hits any points/meshes
    // and trigger appropriate actions (select annotation, etc.)
  }

  /**
   * Clean up controllers for an instance
   */
  cleanup(instanceId) {
    const data = this.instanceControllers.get(instanceId);
    if (!data) return;

    const { sceneObjects, controllers } = data;
    const { renderer } = sceneObjects;

    // Remove visual meshes
    controllers.forEach(controller => {
      if (controller.visualMesh) {
        renderer.removeActor(controller.visualMesh);
      }
    });

    // Remove from map
    this.instanceControllers.delete(instanceId);
    
    console.log('🎮 Cleaned up VR controllers for instance:', instanceId);
  }
}

export const vrControllers = new VRControllers();
```

#### Step 5: Integrate Controllers with Render Loop

Update your VTK handler's render loop to update controllers:

```javascript
// In VTKInstanceHandler.js

renderVRFrame(instanceData, vrData, frame, pose) {
  // ... existing rendering code ...

  // Update controllers
  vrControllers.updatePoses(
    instanceData.instanceId,
    frame,
    vrModeManager.xrReferenceSpace
  );

  // ... rest of rendering ...
}
```

---

## Stereo Rendering

### Why Two Views?

VR headsets have two screens (left eye, right eye). To create the 3D effect, you need to render the scene **twice** - once from each eye's perspective.

### How VTK Handles This

VTK.js can be configured to render stereo automatically. However, with WebXR, you need to handle it manually:

```javascript
// For each frame
for (const view of pose.views) {
  // view.eye is 'left' or 'right'
  const viewport = glLayer.getViewport(view);
  
  // Set viewport (left half or right half of screen)
  gl.viewport(viewport.x, viewport.y, viewport.width, viewport.height);
  
  // Update camera for this eye
  this.updateCameraForVRView(camera, view);
  
  // Render
  renderer.render();
}
```

### IPD (Inter-Pupillary Distance)

The XR API automatically handles IPD - the distance between your eyes. Each `view` in `pose.views` has a slightly different position, creating the stereo effect.

---

## Testing Without a Headset

### Option 1: WebXR Emulator

**Chrome Extension:** [Immersive Web Emulator](https://chromewebstore.google.com/detail/immersive-web-emulator/cgffilbpcibhmcfbgggfhfolhkfbhmik)

**How to use:**
1. Install the extension
2. Open developer tools (F12)
3. Go to "WebXR" tab
4. Click "Enable" to simulate a headset
5. Use mouse to control head rotation
6. Use keyboard to move position

**Advantages:**
- No physical hardware needed
- Great for development
- Can test controller input

### Option 2: Physical Headset

**Supported devices:**
- Meta Quest 2/3/Pro
- Valve Index
- HTC Vive
- Windows Mixed Reality headsets

**How to use:**
1. Connect headset to PC (USB-C or wireless)
2. Open browser IN the headset
3. Navigate to your app (must be HTTPS!)
4. Click "Enter VR"

**Browser recommendations:**
- **Quest:** Built-in browser works great
- **PC VR:** Chrome or Edge with SteamVR running

---

## Common Issues & Solutions

### Issue: "Cannot read property 'requestSession' of undefined"

**Problem:** `navigator.xr` doesn't exist

**Solutions:**
1. Must be HTTPS (or localhost)
2. Browser must support WebXR
3. Check browser flags (Firefox requires enabling WebXR)

```javascript
// Always check before using
if (!navigator.xr) {
  console.error('WebXR not available');
  return;
}
```

### Issue: "Session request failed"

**Problem:** XR device not detected

**Solutions:**
1. Headset must be connected and powered on
2. Install WebXR Emulator extension for testing
3. Check that other VR apps work (test with [webxr.io](https://immersive-web.github.io/webxr-samples/))

### Issue: "Black screen in VR"

**Problem:** Rendering not reaching the headset

**Solutions:**
1. Make sure you're binding the XR framebuffer:
   ```javascript
   const glLayer = xrSession.renderState.baseLayer;
   gl.bindFramebuffer(gl.FRAMEBUFFER, glLayer.framebuffer);
   ```
2. Check that you're rendering to both eyes (loop through `pose.views`)
3. Verify viewport is set correctly for each eye

### Issue: "Controllers not showing up"

**Problem:** Controller tracking not initialized

**Solutions:**
1. Make sure you're calling `frame.getPose()` for each controller
2. Check that `inputSource.gripSpace` exists
3. Verify controllers are turned on and paired with headset

### Issue: "Everything is too big/small"

**Problem:** Scale mismatch between scene and real world

**Solutions:**
1. Use `local-floor` reference space (ground is at user's feet)
2. Scale your VTK scene appropriately
3. Remember: 1 unit in VTK should equal 1 meter in VR

```javascript
// Scale down if your data is too large
const scale = 0.001; // If your data is in millimeters
actor.setScale(scale, scale, scale);
```

---

## Advanced Features

### Hand Tracking

Instead of controllers, use real hand detection:

```javascript
const xrSession = await navigator.xr.requestSession('immersive-vr', {
  optionalFeatures: ['hand-tracking']
});

// Check if hand tracking is available
if (xrSession.inputSources) {
  for (const source of xrSession.inputSources) {
    if (source.hand) {
      // Hand tracking available!
      const joints = source.hand.values();
      // Access finger joints for precise interaction
    }
  }
}
```

### Teleportation

Move user to a new location:

```javascript
// Create a new reference space at target location
const offsetTransform = new XRRigidTransform({
  x: targetX,
  y: targetY,
  z: targetZ
});

const newRefSpace = referenceSpace.getOffsetReferenceSpace(offsetTransform);
// Use this new reference space for rendering
```

### Passthrough (Mixed Reality)

On Quest 3 and similar devices, show real world:

```javascript
const xrSession = await navigator.xr.requestSession('immersive-ar', {
  requiredFeatures: ['local-floor'],
  optionalFeatures: ['passthrough']
});
```

### Haptic Feedback

Make controllers vibrate:

```javascript
// On controller button press
if (inputSource.gamepad && inputSource.gamepad.hapticActuators) {
  const actuator = inputSource.gamepad.hapticActuators[0];
  actuator.pulse(0.5, 100); // 50% intensity for 100ms
}
```

---

## Next Steps

### Testing Checklist

- [ ] VR button appears in UI
- [ ] Clicking "Enter VR" launches VR mode
- [ ] Scene is visible in headset
- [ ] Both eyes render correctly (stereo works)
- [ ] Head tracking works (looking around)
- [ ] Controllers are visible
- [ ] Trigger button is detected
- [ ] Grip button is detected
- [ ] Performance is smooth (90 FPS)
- [ ] Exiting VR returns to desktop properly

### Feature Roadmap

**Phase 1: Basic VR** (You are here)
- ✅ Enter/exit VR
- ✅ Stereo rendering
- ✅ Head tracking
- ✅ Controller visualization

**Phase 2: Interaction**
- [ ] Raycast selection
- [ ] Annotation creation in VR
- [ ] Grab and move objects
- [ ] Scale and rotate with two hands

**Phase 3: Collaboration**
- [ ] See other users' avatars in VR
- [ ] See other users' controllers
- [ ] Voice chat spatialized in 3D
- [ ] Shared annotations appear for everyone

**Phase 4: Advanced**
- [ ] Teleportation
- [ ] Hand tracking
- [ ] Haptic feedback
- [ ] Performance optimizations

---

## Resources

### Official Documentation
- [WebXR Device API](https://www.w3.org/TR/webxr/) - Official spec
- [MDN WebXR Guide](https://developer.mozilla.org/en-US/docs/Web/API/WebXR_Device_API) - Excellent tutorials
- [Immersive Web Samples](https://immersive-web.github.io/webxr-samples/) - Working examples

### VTK.js Specific
- [VTK.js Examples](https://kitware.github.io/vtk-js/examples/) - Some VR examples
- [VTK.js API Docs](https://kitware.github.io/vtk-js/api/) - Full API reference

### Testing Tools
- [WebXR Emulator Extension](https://github.com/MozillaReality/WebXR-emulator-extension) - Test without headset
- [webxr.io](https://immersive-web.github.io/webxr-samples/) - Test your browser's WebXR support

### Community
- [WebXR Discord](https://discord.gg/Jt5tfaM) - Active community
- [VTK.js Discourse](https://discourse.vtk.org/) - VTK-specific help

Good luck with your VR implementation! Start with Phase 1, get that working, then move to interaction. VR is complex but incredibly rewarding when you see your data in 3D space! 🥽✨