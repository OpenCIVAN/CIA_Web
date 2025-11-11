// src/core/instances/types/InstanceTypeInterface.js
// Defines the contract that all instance type plugins must implement
// This is the foundation of the plugin architecture

/**
 * InstanceTypeHandler Interface
 *
 * All instance type plugins (VTK, Plotly, custom visualizations, etc.)
 * must implement this interface. The core system interacts with instances
 * ONLY through this interface, never through direct implementation.
 *
 * This enables contributors to add new visualization types without
 * modifying core code. They just create a new handler, implement
 * these methods, and register it.
 *
 * Philosophy:
 * - The core asks "what" should happen (show annotations, load data)
 * - The handler decides "how" it happens for this specific type
 * - Contributors work within their handler without touching core
 */
export class InstanceTypeHandler {
  /**
   * Get the unique identifier for this instance type
   * Examples: 'vtk', 'plotly', 'threejs', 'custom-webgl'
   *
   * @returns {string} Type identifier
   */
  getType() {
    throw new Error("InstanceTypeHandler.getType() must be implemented");
  }

  /**
   * Get human-readable name for this instance type
   * Used in UI to show what kind of instance this is
   *
   * @returns {string} Display name
   */
  getDisplayName() {
    throw new Error("InstanceTypeHandler.getDisplayName() must be implemented");
  }

  /**
   * Initialize a new instance in the provided container
   *
   * This is where you set up your rendering pipeline. For VTK, this
   * means creating renderers and cameras. For Plotly, this means
   * initializing the plot. For custom WebGL, this means setting up
   * your WebGL context.
   *
   * @param {HTMLElement} containerElement - DOM element to render into
   * @param {Object} options - Instance configuration
   * @param {string} options.instanceId - Unique instance ID
   * @param {string} options.datasetId - Optional dataset to load
   * @returns {Object} Instance-specific data (saved to instance metadata)
   */
  async initialize(containerElement, options) {
    throw new Error("InstanceTypeHandler.initialize() must be implemented");
  }

  /**
   * Clean up instance resources
   *
   * Called when instance is deleted. Must dispose of all resources
   * to prevent memory leaks. For VTK, this means deleting VTK objects.
   * For WebGL, this means disposing of buffers and contexts.
   *
   * @param {Object} instanceData - The data returned from initialize()
   */
  async cleanup(instanceData) {
    throw new Error("InstanceTypeHandler.cleanup() must be implemented");
  }

  /**
   * Load data into this instance
   *
   * The handler receives the dataset metadata and polydata/data object.
   * It's responsible for rendering that data in its specific way.
   * VTK uses polydata directly. Plotly might transform it to traces.
   *
   * @param {Object} instanceData - Instance-specific data
   * @param {Object} dataset - Dataset metadata
   * @param {Object} data - The actual data (polydata, JSON, etc.)
   */
  async loadData(instanceData, dataset, data) {
    throw new Error("InstanceTypeHandler.loadData() must be implemented");
  }

  /**
   * Get available tools/widgets for this instance type
   *
   * Returns configuration for tools that should be shown in the
   * instance toolbar. Each tool includes an ID, label, icon, and
   * callback. The core just renders buttons - the handler handles
   * what happens when clicked.
   *
   * @param {Object} instanceData - Instance-specific data
   * @returns {Array<Object>} Tool configurations
   *
   * Example return value:
   * [
   *   {
   *     id: 'clip',
   *     label: 'Clip Plane',
   *     icon: 'scissors',
   *     onClick: () => this.activateClipWidget(instanceData)
   *   },
   *   {
   *     id: 'measure',
   *     label: 'Measure',
   *     icon: 'ruler',
   *     onClick: () => this.activateMeasureWidget(instanceData)
   *   }
   * ]
   */
  getTools(instanceData) {
    // Default: no tools
    return [];
  }

  /**
   * Get instance header information
   *
   * Returns data to display in the instance viewport header.
   * This might include stats, current view info, or type-specific
   * indicators. The core renders this but doesn't care what it means.
   *
   * @param {Object} instanceData - Instance-specific data
   * @returns {Object} Header info
   *
   * Example return value:
   * {
   *   stats: [
   *     { label: 'Points', value: '142,573' },
   *     { label: 'Polygons', value: '284,001' }
   *   ],
   *   indicators: [
   *     { icon: 'cube', label: '3D View', color: '#4CAF50' }
   *   ]
   * }
   */
  getHeaderInfo(instanceData) {
    // Default: no extra info
    return { stats: [], indicators: [] };
  }

  // =========================================================================
  // COLLABORATIVE FEATURES
  // These methods handle how collaborative features work for this type
  // =========================================================================

  /**
   * Show/hide collaborative cursors
   *
   * The global system tells the instance "show cursors for these users"
   * or "hide all cursors". The handler decides how to render them.
   * VTK projects them into 3D space. Plotly might show them as markers.
   *
   * @param {Object} instanceData - Instance-specific data
   * @param {boolean} visible - Should cursors be visible
   * @param {Array<Object>} users - Users whose cursors to show
   */
  async setCursorVisibility(instanceData, visible, users = []) {
    // Default: do nothing (some instance types may not support cursors)
  }

  /**
   * Update cursor position for a user
   *
   * Called when a remote user moves their cursor. The handler receives
   * the cursor data (which is type-specific) and renders it appropriately.
   *
   * @param {Object} instanceData - Instance-specific data
   * @param {string} userId - User whose cursor moved
   * @param {Object} cursorData - Cursor position/data (type-specific)
   */
  async updateCursor(instanceData, userId, cursorData) {
    // Default: do nothing
  }

  /**
   * Show/hide annotations
   *
   * The global system tells the instance "show annotations" or "hide them".
   * The handler decides how to render annotations for this data type.
   * VTK projects them into 3D. Plotly might show them as plot annotations.
   *
   * @param {Object} instanceData - Instance-specific data
   * @param {boolean} visible - Should annotations be visible
   * @param {Array<Object>} annotations - Annotations to show
   */
  async setAnnotationVisibility(instanceData, visible, annotations = []) {
    // Default: do nothing
  }

  /**
   * Add a new annotation
   *
   * Called when user creates an annotation. The handler is responsible
   * for capturing the annotation data in a type-specific way and
   * returning it so it can be synced.
   *
   * @param {Object} instanceData - Instance-specific data
   * @param {Object} annotationData - Annotation details
   * @returns {Object} Complete annotation with type-specific data
   */
  async addAnnotation(instanceData, annotationData) {
    // Default: no annotation support
    return null;
  }

  /**
   * Synchronize camera/view state from another user
   *
   * When users are in "follow mode", the handler receives camera state
   * from the followed user and applies it to this instance.
   *
   * @param {Object} instanceData - Instance-specific data
   * @param {Object} cameraState - Camera/view state (type-specific)
   */
  async syncCamera(instanceData, cameraState) {
    // Default: do nothing
  }

  /**
   * Get current camera/view state
   *
   * Returns the current camera/view state in a format that can be
   * synced to other users. The format is type-specific.
   *
   * @param {Object} instanceData - Instance-specific data
   * @returns {Object} Camera/view state
   */
  async getCameraState(instanceData) {
    // Default: no camera state
    return null;
  }

  // =========================================================================
  // VR CAPABILITY DECLARATION
  // These methods tell the core what VR features this type supports
  // =========================================================================

  /**
   * Does this instance type support viewing in VR?
   *
   * If true, the instance can be "sent to VR" where it renders in an
   * immersive headset while other instances remain on desktop.
   *
   * @returns {boolean} True if instance can render in VR
   */
  supportsInstanceVR() {
    // Default: no VR support
    return false;
  }

  /**
   * Does this instance type adapt when the entire app is in VR mode?
   *
   * If true, the instance can adjust its rendering when the whole
   * application switches to VR (e.g., the user puts on a headset and
   * sees the entire workspace in 3D space).
   *
   * @returns {boolean} True if instance adapts to application VR mode
   */
  supportsApplicationVR() {
    // Default: no special handling for app VR mode
    return false;
  }

  /**
   * Get VR requirements and capabilities
   *
   * Returns detailed information about what VR features this type needs.
   * Used by the VR system to determine if it can launch VR mode.
   *
   * @returns {Object} VR capability details
   */
  getVRCapabilities() {
    return {
      instanceVR: this.supportsInstanceVR(),
      applicationVR: this.supportsApplicationVR(),

      requirements: {
        controllers: false,
        handTracking: false,
        roomScale: false,
        minFPS: 60,
      },

      optional: {
        eyeTracking: false,
        haptics: false,
        spatialAudio: false,
      },
    };
  }

  // =========================================================================
  // INSTANCE-LEVEL VR
  // "Send this specific instance to VR"
  // =========================================================================

  /**
   * Enter VR mode for this instance
   *
   * Called when user clicks "Send to VR" for this specific instance.
   * The instance should initialize VR rendering while the desktop view
   * continues to work for other instances.
   *
   * @param {Object} instanceData - Instance-specific data
   * @param {XRSession} xrSession - WebXR session
   * @returns {Promise<Object>} VR-specific data (stored separately)
   */
  async enterInstanceVR(instanceData, xrSession) {
    throw new Error(
      `${this.getDisplayName()} does not support instance-level VR. ` +
        `Set supportsInstanceVR() to true and implement this method.`
    );
  }

  /**
   * Exit VR mode for this instance
   *
   * Called when user exits VR for this specific instance.
   *
   * @param {Object} instanceData - Instance-specific data
   * @param {Object} vrData - VR data returned from enterInstanceVR
   */
  async exitInstanceVR(instanceData, vrData) {
    // Default: do nothing
  }

  /**
   * Update instance VR rendering
   *
   * Called every frame while in VR mode. The handler should render
   * the stereo views for left and right eyes.
   *
   * @param {Object} instanceData - Instance-specific data
   * @param {Object} vrData - VR-specific data
   * @param {XRFrame} frame - Current XR frame with pose data
   */
  async updateInstanceVR(instanceData, vrData, frame) {
    // Default: do nothing
  }

  /**
   * Handle VR controller input for this instance
   *
   * @param {Object} instanceData - Instance-specific data
   * @param {Object} vrData - VR-specific data
   * @param {XRInputSource} inputSource - Controller that generated input
   * @param {string} action - Action performed ('select', 'squeeze', 'trigger')
   * @param {Object} pose - Controller pose in space
   */
  async handleVRInput(instanceData, vrData, inputSource, action, pose) {
    // Default: do nothing
  }

  // =========================================================================
  // APPLICATION-LEVEL VR
  // "The entire app is now in VR"
  // =========================================================================

  /**
   * Notify instance that application entered VR mode
   *
   * Called when the ENTIRE application switches to VR mode.
   * The instance should adapt its rendering for this context.
   *
   * @param {Object} instanceData - Instance-specific data
   * @param {Object} vrContext - Global VR context information
   * @returns {Promise<Object>} Any VR adaptation state to store
   */
  async onApplicationVREnter(instanceData, vrContext) {
    // Default: do nothing special
    return null;
  }

  /**
   * Notify instance that application exited VR mode
   *
   * @param {Object} instanceData - Instance-specific data
   * @param {Object} vrAdaptationState - State from onApplicationVREnter
   */
  async onApplicationVRExit(instanceData, vrAdaptationState) {
    // Default: do nothing
  }

  /**
   * Get VR-optimized viewport settings
   *
   * When in application VR mode, instances might need different viewport
   * configurations.
   *
   * @param {Object} instanceData - Instance-specific data
   * @returns {Object} VR viewport settings
   */
  getVRViewportSettings(instanceData) {
    return {
      resolution: { width: 1920, height: 1920 },
      targetFPS: 90,
      multisampling: 4,
      viewDistance: 2.0,
      viewportSize: { width: 2.0, height: 1.5 },
    };
  }

  // =========================================================================
  // VR-SPECIFIC COLLABORATIVE FEATURES
  // =========================================================================

  /**
   * Render remote user avatars in VR
   *
   * @param {Object} instanceData - Instance-specific data
   * @param {Object} vrData - VR-specific data (if in instance VR)
   * @param {Array<Object>} users - Remote users with their VR poses
   */
  async renderVRAvatars(instanceData, vrData, users) {
    // Default: do nothing
  }

  /**
   * Render annotations in VR space
   *
   * @param {Object} instanceData - Instance-specific data
   * @param {Object} vrData - VR-specific data (if in instance VR)
   * @param {Array<Object>} annotations - Annotations to show
   */
  async renderVRAnnotations(instanceData, vrData, annotations) {
    // Default: use regular annotation rendering
    return this.setAnnotationVisibility(instanceData, true, annotations);
  }

  // =========================================================================
  // OPTIONAL ADVANCED FEATURES
  // These are optional and only needed for specific instance types
  // =========================================================================

  /**
   * Handle window resize
   *
   * Called when the instance viewport resizes. Some renderers need
   * to update their internal dimensions.
   *
   * @param {Object} instanceData - Instance-specific data
   * @param {number} width - New width
   * @param {number} height - New height
   */
  async onResize(instanceData, width, height) {
    // Default: do nothing (many renderers handle this automatically)
  }

  /**
   * Export instance content
   *
   * Returns the instance content in an exportable format.
   * VTK might return a screenshot or VTP file. Plotly might return JSON.
   *
   * @param {Object} instanceData - Instance-specific data
   * @param {string} format - Desired export format ('png', 'json', etc.)
   * @returns {Blob|string} Exported content
   */
  async export(instanceData, format) {
    throw new Error("Export not supported for this instance type");
  }

  /**
   * Check if this handler can handle a specific dataset type
   *
   * Used to determine if this instance type is compatible with a dataset.
   * VTK handler returns true for .vtp files. Plotly might return true for JSON.
   *
   * @param {Object} dataset - Dataset metadata
   * @returns {boolean} Can this handler display this dataset
   */
  canHandleDataset(dataset) {
    // Default: assume can handle any dataset
    return true;
  }
}

/**
 * Example skeleton for implementers:
 *
 * class MyCustomHandler extends InstanceTypeHandler {
 *   getType() { return 'my-custom-type'; }
 *   getDisplayName() { return 'My Custom Visualization'; }
 *
 *   async initialize(container, options) {
 *     // Set up your rendering system
 *     const myRenderer = createMyRenderer(container);
 *     return { renderer: myRenderer }; // Return instance data
 *   }
 *
 *   async cleanup(instanceData) {
 *     // Clean up resources
 *     instanceData.renderer.dispose();
 *   }
 *
 *   async loadData(instanceData, dataset, data) {
 *     // Render the data
 *     instanceData.renderer.setData(data);
 *   }
 *
 *   // Implement other methods as needed...
 * }
 */
