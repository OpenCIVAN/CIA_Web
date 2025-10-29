// ----------------------------------------------------------------------------
// Application Initialization
// ----------------------------------------------------------------------------

// For streamlined VR development install the WebXR emulator extension
// https://github.com/MozillaReality/WebXR-emulator-extension

import { voiceChat } from "./collaboration/voiceChat.js";
import { getUserName, setupUserName, initializeNameEditor } from "./collaboration/userManagement.js";
import { modeManager } from "./core/modeManager.js";
import { adaptiveUI } from "./ui/adaptiveUI.js";
import { vrControllers } from "./vr/vrControllers.js";
import { vrAvatarSystem } from "./vr/vrAvatars.js";
import { vrSpatialUI } from "./vr/vrSpatialUI.js";

import {
  initializeLogging,
  logInfo,
  logSuccess,
  logProgress,
} from "./ui/logging.js";
import {
  initializeTensorFlow,
  logMemoryUsage,
  cleanupTensors,
} from "./utils/tensorflowSetup.js";
import { initializeScene } from "./core/scene.js";
import { setupFileHandler } from "./core/fileHandler.js";
import {
  setupDimensionalityReductionControls,
  getReductionMethod,
  getReductionComponents,
  setReductionMethod,
  setReductionComponents,
} from "./ui/controls.js";
import { textChat } from './collaboration/textChat.js';
import { addCursorControls } from "./ui/cursorControls.js";
import { addAnnotationControls } from "./ui/annotationControls.js";
import { initializePeopleControls } from "./ui/peopleControls.js";
import { initializeTextChatControls } from "./ui/textChatControls.js";
import { initializeVoiceChatControls } from "./ui/voiceChatControls.js";
import { initializeCursorSystem } from "./collaboration/cursors.js";
import { setupActorSync } from "./collaboration/actorSync.js";
import { setupReductionSync } from "./collaboration/reductionSync.js";
import { toggleDimensionalityReduction } from "./core/reductionController.js";
import { setupViewportInteraction } from "./ui/viewportInteraction.js";
import { annotationRenderer } from "./core/annotationRenderer.js";

// Get room name from URL or use default
function getRoomName() {
  const params = new URLSearchParams(window.location.search);
  return params.get("room") || "default-analytics-room";
}

async function initializeApplication() {
  logInfo("Starting VTK.js with TensorFlow.js Application...");

  // Initialize logging system first
  initializeLogging();

  // Initialize TensorFlow.js
  const tfReady = await initializeTensorFlow();
  if (!tfReady) {
    console.error("TensorFlow.js failed to initialize, PCA will not work");
  }

  // Initialize 3D scene
  initializeScene();
  logProgress("3D scene initialized");

  // Setup file handling
  setupFileHandler();
  logProgress("File handler ready");

  // Get room name for collaboration
  const roomName = getRoomName();
  logProgress(`Joining room: ${roomName}`);

  // Setup user name BEFORE connecting to Yjs and voice chat
  await setupUserName();
  logProgress("User name configured");

  // Initialize text chat system (only once!)
  textChat.initialize();
  logProgress("Text chat system initialized");

  // Initialize VR systems (non-blocking)
  try {
    modeManager.setupVRDetection();
    logProgress("VR detection initialized");

    adaptiveUI.initialize();
    logProgress("Adaptive UI initialized");

    vrControllers.initialize();
    logProgress("VR controllers initialized");

    vrAvatarSystem.initialize();
    logProgress("VR avatar system initialized");

    vrSpatialUI.initialize();
    logProgress("VR spatial UI initialized");
  } catch (error) {
    console.warn("VR systems failed to initialize (non-critical):", error);
  }

  // Setup collaboration features
  setupActorSync();
  logProgress("Actor synchronization ready");

  setupReductionSync(
    toggleDimensionalityReduction,
    getReductionMethod,
    getReductionComponents,
    setReductionMethod,
    setReductionComponents
  );
  logProgress("Reduction synchronization ready");

  // Initialize collaborative cursor system
  initializeCursorSystem();

  // Setup viewport interaction (must be before annotation renderer)
  setupViewportInteraction();

  // Initialize annotation renderer after scene is ready
  setTimeout(() => {
    annotationRenderer.initialize();
    logProgress("Annotation renderer initialized");
  }, 500);

  // Add UI controls with delay to ensure DOM is ready
  setTimeout(() => {
    console.log("🔧 Starting to add controls...");

    try {
      // LEFT PANEL: Data controls
      console.log("Adding dimensionality reduction controls...");
      setupDimensionalityReductionControls(toggleDimensionalityReduction);
      logProgress("Data controls added");
    } catch (error) {
      console.error("Failed to add data controls:", error);
    }

    try {
      // RIGHT PANEL: Annotations only
      console.log("Adding annotation controls...");
      addAnnotationControls();
      logProgress("Annotation controls added");
    } catch (error) {
      console.error("Failed to add annotation controls:", error);
    }

    try {
      // COLLABORATION PANEL: Name editor
      console.log("Initializing name editor...");
      initializeNameEditor();
      logProgress("Name editor initialized");
    } catch (error) {
      console.error("Failed to initialize name editor:", error);
    }

    try {
      // COLLABORATION PANEL: People list
      console.log("Initializing people controls...");
      initializePeopleControls();
      logProgress("People controls initialized");
    } catch (error) {
      console.error("Failed to initialize people controls:", error);
    }

    try {
      // COLLABORATION PANEL: Text chat
      console.log("Initializing text chat UI...");
      initializeTextChatControls();
      logProgress("Text chat UI initialized");
    } catch (error) {
      console.error("Failed to initialize text chat UI:", error);
    }

    try {
      // COLLABORATION PANEL: Voice chat
      console.log("Initializing voice chat controls...");
      initializeVoiceChatControls(roomName);
      logProgress("Voice chat controls initialized");
    } catch (error) {
      console.error("Failed to initialize voice chat controls:", error);
    }

    try {
      // Cursor visibility controls
      console.log("Adding cursor controls...");
      addCursorControls();
      logProgress("Cursor controls added");
    } catch (error) {
      console.error("Failed to add cursor controls:", error);
    }

    console.log("✅ Finished adding controls");
  }, 1000);

  // Voice chat will connect when user clicks "Join Voice Chat" button
  logProgress("Voice chat ready - click 'Join Voice Chat' to connect");

  logSuccess("Application initialized successfully!");
  logInfo("Available features:");
  logProgress("  ✓ VTP file loading and visualization");
  logProgress("  ✓ WebXR/VR support");
  logProgress("  ✓ PCA with TensorFlow.js (optimized memory management)");
  logProgress("  ✓ t-SNE and UMAP (pure JavaScript implementations)");
  logProgress("  ✓ Real-time collaboration (Yjs)");
  logProgress("  ✓ Collaborative cursors");
  logProgress("  ✓ Voice & text chat");
  logProgress("  ✓ Annotations");
  logProgress("  ✓ Advanced logging and performance monitoring");
  logProgress(
    "  ✓ Automatic optimization for datasets from 100 to 1,000,000+ points"
  );
  logInfo(`Load a VTP file to get started! Room: ${roomName}`);
  logMemoryUsage("on startup");
}

// Set up cleanup on page unload
if (typeof window !== "undefined") {
  window.addEventListener("beforeunload", () => {
    cleanupTensors();
    voiceChat.disconnect();
  });
}

// Expose functions for debugging
if (typeof window !== "undefined") {
  window.debugAPI = {
    toggleReduction: toggleDimensionalityReduction,
    logMemory: logMemoryUsage,
    cleanup: cleanupTensors,
    getReductionMethod,
    getReductionComponents,
    voiceChat,
    textChat,
  };

  console.log("Debug API available at window.debugAPI");
}

// Start the application
initializeApplication().catch((error) => {
  console.error("Failed to initialize application:", error);
});