// src/init/appInitializer.js
// Complete, clean initialization for CIA Web with multi-instance support

import { sessionManager } from "@Core/session/sessionManager.js";
import { initializeTensorFlow } from "@Services/tensorflow/tensorflowSetup.js";
import { dataCache } from "@Services/storage/dataCache.js";
import { initializeYjsProvider } from "@Collaboration/yjs/yjsSetup.js";
import { presenceSystem } from "@Collaboration/presence/presenceSystem.js";
import { datasetManager } from "@Core/datasets/datasetManager.js";
import { visualizationManager } from "@Core/visualizationManager.js";
import { annotationSystem } from "@Collaboration/annotations/annotationSystem.js";
import {
  initializeAllObservers,
  markSystemReady,
} from "@Collaboration/yjs/yjsObservers.js";
import { textChat } from "@Collaboration/communication/textChat.js";
import { vrModeManager } from "@VR/vrModeManager.js";
import { vrControllers } from "@VR/controllers/vrControllers.js";
import { vrAvatarSystem } from "@VR/avatars/vrAvatarSystem.js";
import { vrSpatialUI } from "@VR/ui/vrSpatialUI.js";
import { workspaceManager } from "@Core/instances/workspaceManager.js";

// Import the new systems we're adding
let syncManager = null;
let instanceCollaboration = null;
let instanceTools = null;

/**
 * Phase 1: Pre-React Initialization
 * Initialize core services that don't depend on UI
 */
export async function initializePhase1() {
  console.log("🚀 Phase 1: Core Services Initialization");
  console.log("==================================");

  try {
    // Session management
    console.log("📋 Initializing session...");
    sessionManager.initializeFromURL();
    console.log(`✅ Session initialized - Room: ${sessionManager.getRoomId()}`);

    // Data cache - check if it has initialize method
    console.log("💾 Setting up data cache...");
    if (dataCache) {
      // Check if dataCache has an initialize method
      if (typeof dataCache.initialize === "function") {
        dataCache.initialize();
        console.log("✅ Data cache initialized");
      } else {
        // dataCache might be auto-initialized or not need initialization
        console.log("✅ Data cache ready (auto-initialized)");
      }

      // Log available methods for debugging
      const methods = Object.getOwnPropertyNames(
        Object.getPrototypeOf(dataCache)
      ).filter(
        (name) =>
          typeof dataCache[name] === "function" && name !== "constructor"
      );
      if (methods.length > 0) {
        console.log(`   Available dataCache methods: ${methods.join(", ")}`);
      }
    } else {
      console.warn("⚠️ Data cache not available - continuing without it");
    }

    // TensorFlow setup for algorithms
    console.log("🧠 Setting up TensorFlow...");
    try {
      if (
        initializeTensorFlow &&
        typeof initializeTensorFlow.initialize === "function"
      ) {
        await initializeTensorFlow.initialize();
        console.log("✅ TensorFlow ready");
      } else {
        console.warn(
          "⚠️ TensorFlow setup not available - algorithms may be limited"
        );
      }
    } catch (tfError) {
      console.warn("⚠️ TensorFlow initialization failed:", tfError.message);
      console.log("   Continuing without TensorFlow support");
    }

    // Y.js provider for collaboration
    console.log("🔗 Initializing Y.js provider...");
    if (typeof initializeYjsProvider === "function") {
      initializeYjsProvider();
      console.log("✅ Y.js provider connected");
    } else {
      console.error("❌ Y.js provider initialization not found");
      throw new Error("Collaboration system is required");
    }

    console.log("✅ Phase 1 complete - Core services ready");
    console.log("");
  } catch (error) {
    console.error("❌ Phase 1 initialization failed:", error);
    throw error;
  }
}

/**
 * Phase 2: Post-Username Initialization
 * Initialize user-dependent services
 */
export async function initializePhase2() {
  console.log("🚀 Phase 2: User Services Initialization");
  console.log("=====================================");

  try {
    // Presence system
    console.log("👥 Initializing presence system...");
    if (
      presenceSystem &&
      typeof presenceSystem.initializePresence === "function"
    ) {
      presenceSystem.initializePresence();
      console.log("✅ Presence system ready");
    } else {
      console.warn("⚠️ Presence manager not available");
    }

    // Data managers
    console.log("📦 Initializing data managers...");

    // Initialize dataset manager
    if (datasetManager) {
      if (typeof datasetManager.initialize === "function") {
        datasetManager.initialize();
      }
      console.log("   ✓ Dataset manager ready");
    }

    // Initialize visualization manager
    if (visualizationManager) {
      if (typeof visualizationManager.initialize === "function") {
        visualizationManager.initialize();
      }
      console.log("   ✓ Visualization manager ready");
    }

    // Initialize annotation system
    if (annotationSystem) {
      if (typeof annotationSystem.initialize === "function") {
        annotationSystem.initialize();
      }
      console.log("   ✓ Annotation system ready");
    }

    console.log("✅ Data managers ready");

    // Y.js observers
    console.log("👁️ Setting up Y.js observers...");
    try {
      if (typeof initializeAllObservers === "function") {
        initializeAllObservers();
      }
      if (typeof markSystemReady === "function") {
        markSystemReady();
      }
      console.log("✅ Y.js observers active");
    } catch (observerError) {
      console.warn(
        "⚠️ Y.js observers partially failed:",
        observerError.message
      );
    }

    // Text chat
    console.log("💬 Initializing text chat...");
    if (textChat && typeof textChat.initialize === "function") {
      try {
        textChat.initialize();
        console.log("✅ Text chat ready");
      } catch (chatError) {
        console.warn("⚠️ Text chat failed:", chatError.message);
      }
    } else {
      console.warn("⚠️ Text chat not available");
    }

    // VR systems (non-blocking)
    console.log("🥽 Initializing VR systems...");
    try {
      const vrSystems = [
        {
          name: "vrModeManager",
          obj: vrModeManager,
          method: "setupVRDetection",
        },
        { name: "vrControllers", obj: vrControllers, method: "initialize" },
        { name: "vrAvatarSystem", obj: vrAvatarSystem, method: "initialize" },
        { name: "vrSpatialUI", obj: vrSpatialUI, method: "initialize" },
      ];

      let vrInitialized = 0;
      vrSystems.forEach((system) => {
        if (system.obj && typeof system.obj[system.method] === "function") {
          try {
            system.obj[system.method]();
            vrInitialized++;
          } catch (e) {
            console.log(`   ⚠️ ${system.name} failed: ${e.message}`);
          }
        }
      });

      if (vrInitialized > 0) {
        console.log(`✅ VR systems ready (${vrInitialized}/4 initialized)`);
      } else {
        console.log("⚠️ VR systems not available");
      }
    } catch (vrError) {
      console.warn("⚠️ VR systems error:", vrError.message);
    }

    // Initialize workspace manager
    console.log("🎨 Initializing workspace manager...");
    if (workspaceManager && typeof workspaceManager.initialize === "function") {
      workspaceManager.initialize();
      console.log("✅ Workspace manager ready");
    } else {
      console.warn("⚠️ Workspace manager may already be initialized");
    }

    console.log("✅ Phase 2 complete - User services ready");
    console.log("");
  } catch (error) {
    console.error("❌ Phase 2 initialization failed:", error);
    throw error;
  }
}

/**
 * Phase 3: Post-React Initialization
 * Initialize collaboration and enhancement systems
 */
export async function initializePhase3() {
  console.log("🚀 Phase 3: Enhanced Systems Initialization");
  console.log("========================================");

  try {
    // Dynamically import the enhanced systems to avoid circular dependencies
    console.log("📦 Loading enhanced systems...");

    const modules = [];

    // Try to load sync manager
    try {
      const syncModule = await import("@Collaboration/sync/syncManager.js");
      if (syncModule?.syncManager) {
        modules.push({ name: "syncManager", instance: syncModule.syncManager });
      }
    } catch (e) {
      console.log("   Sync manager not available");
    }

    // Try to load instance collaboration
    try {
      const collabModule = await import(
        "@Collaboration/perInstance/instanceCollaboration.js"
      );
      if (collabModule?.instanceCollaboration) {
        modules.push({
          name: "instanceCollaboration",
          instance: collabModule.instanceCollaboration,
        });
      }
    } catch (e) {
      console.log("   Instance collaboration not available");
    }

    // Try to load instance tools
    try {
      const toolsModule = await import("@Core/instances/instanceTools.js");
      if (toolsModule?.instanceTools) {
        modules.push({
          name: "instanceTools",
          instance: toolsModule.instanceTools,
        });
      }
    } catch (e) {
      console.log("   Instance tools not available");
    }

    // Initialize available modules
    modules.forEach((module) => {
      if (module.name === "syncManager") {
        syncManager = module.instance;
        if (typeof syncManager.initialize === "function") {
          syncManager.initialize();
          console.log("✅ Sync manager initialized");
        }
      } else if (module.name === "instanceCollaboration") {
        instanceCollaboration = module.instance;
        console.log("✅ Instance collaboration loaded");
      } else if (module.name === "instanceTools") {
        instanceTools = module.instance;
        console.log("✅ Instance tools loaded");
      }
    });

    if (modules.length === 0) {
      console.log(
        "⚠️ No enhanced systems available - using basic features only"
      );
    }

    // Set up instance creation hooks
    setupInstanceHooks();
    console.log("✅ Instance hooks configured");

    // Set up debug helpers
    setupDebugHelpers();
    console.log("✅ Debug helpers available");

    console.log("✅ Phase 3 complete - All systems initialized");
    console.log("");
    console.log("🎉 CIA Web fully initialized and ready!");
    console.log("📝 Debug commands available via window.CIA");
  } catch (error) {
    console.error("⚠️ Phase 3 partial failure:", error);
    // Non-critical failure - app can still work without enhanced features
    console.log("Continuing without some enhanced features");
  }
}

/**
 * Set up hooks for instance creation/deletion
 */
function setupInstanceHooks() {
  if (!workspaceManager) {
    console.log("⚠️ Workspace manager not available for hooks");
    return;
  }

  // Only set up hooks if we have the enhanced systems
  if (!instanceCollaboration && !instanceTools) {
    console.log("⚠️ No enhanced systems for instance hooks");
    return;
  }

  // Store original methods
  const originalCreateInstance =
    workspaceManager.createInstance.bind(workspaceManager);
  const originalDeleteInstance =
    workspaceManager.deleteInstance.bind(workspaceManager);

  // Override createInstance to add enhancements
  workspaceManager.createInstance = function (containerElement, options = {}) {
    // Call original method
    const instanceId = originalCreateInstance(containerElement, options);

    if (!instanceId) return null;

    // Get the instance
    const instance = workspaceManager.getInstance(instanceId);

    if (instance) {
      // Add collaboration features if available
      if (instanceCollaboration) {
        try {
          instanceCollaboration.initializeForInstance(
            instanceId,
            instance.sceneObjects
          );
          instanceCollaboration.setCursorTracking(instanceId, true);
          console.log(`🤝 Collaboration enabled for instance: ${instanceId}`);
        } catch (error) {
          console.warn(
            `⚠️ Could not initialize collaboration for ${instanceId}:`,
            error
          );
        }
      }

      // Add tools if available
      if (instanceTools) {
        try {
          instanceTools.initializeTools(instanceId, instance.sceneObjects);
          console.log(`🛠️ Tools enabled for instance: ${instanceId}`);
        } catch (error) {
          console.warn(
            `⚠️ Could not initialize tools for ${instanceId}:`,
            error
          );
        }
      }
    }

    return instanceId;
  };

  // Override deleteInstance to clean up enhancements
  workspaceManager.deleteInstance = function (instanceId) {
    // Clean up enhancements first
    if (instanceCollaboration) {
      try {
        instanceCollaboration.cleanupInstance(instanceId);
      } catch (error) {
        console.warn(
          `⚠️ Error cleaning up collaboration for ${instanceId}:`,
          error
        );
      }
    }

    if (instanceTools) {
      try {
        instanceTools.cleanupTools(instanceId);
      } catch (error) {
        console.warn(`⚠️ Error cleaning up tools for ${instanceId}:`, error);
      }
    }

    // Call original method
    originalDeleteInstance(instanceId);
  };

  console.log("   Instance hooks installed");
}

/**
 * Set up debug helpers for console access
 */
function setupDebugHelpers() {
  // Create CIA namespace if it doesn't exist
  if (typeof window !== "undefined") {
    window.CIA = window.CIA || {};

    // Add core managers
    window.CIA.workspaceManager = workspaceManager;
    window.CIA.datasetManager = datasetManager;
    window.CIA.visualizationManager = visualizationManager;
    window.CIA.annotationSystem = annotationSystem;
    window.CIA.dataCache = dataCache;

    // Add enhanced systems if available
    if (syncManager) window.CIA.syncManager = syncManager;
    if (instanceCollaboration)
      window.CIA.instanceCollaboration = instanceCollaboration;
    if (instanceTools) window.CIA.instanceTools = instanceTools;

    // Add helper functions
    window.CIA.listInstances = () => {
      const ids = workspaceManager.getAllInstanceIds();
      console.log(`📊 Active instances: ${ids.length}`);
      ids.forEach((id) => {
        const inst = workspaceManager.getInstance(id);
        console.log(
          `  • ${id.slice(-8)}: dataset=${
            inst?.datasetId?.slice(-8) || "none"
          }, active=${id === workspaceManager.activeInstanceId}`
        );
      });
      return ids;
    };

    window.CIA.listDatasets = () => {
      const datasets = datasetManager.getAllDatasets
        ? datasetManager.getAllDatasets()
        : [];
      if (datasets.length === 0) {
        console.log("No datasets loaded");
        return [];
      }
      console.table(
        datasets.map((d) => ({
          id: d.id?.slice(-8),
          name: d.name,
          points: d.pointCount,
          loaded: d.hasPolydata,
        }))
      );
      return datasets;
    };

    window.CIA.getSyncStatus = () => {
      if (syncManager && typeof syncManager.getSyncStatus === "function") {
        return syncManager.getSyncStatus();
      } else {
        return { status: "Sync manager not available" };
      }
    };

    window.CIA.help = () => {
      console.log("🔧 CIA Web Debug Commands:");
      console.log("  CIA.listInstances() - List all active instances");
      console.log("  CIA.listDatasets() - List all loaded datasets");
      console.log("  CIA.getSyncStatus() - Get synchronization status");
      console.log("  CIA.workspaceManager - Access workspace manager");
      console.log("  CIA.datasetManager - Access dataset manager");
      console.log("  CIA.dataCache - Access data cache");
      if (syncManager) {
        console.log("  CIA.syncManager.forceSyncAll() - Force sync all data");
      }
      if (instanceTools) {
        console.log(
          "  CIA.instanceTools.resetCamera(instanceId) - Reset camera for instance"
        );
      }
      console.log("\nType any command to try it!");
    };

    // Log what's available
    console.log("   Debug helpers installed");
  }
}

/**
 * Main initialization function
 * Call this from your app entry point
 */
export async function initializeCIAWeb() {
  console.log("====================================");
  console.log("🚀 Initializing CIA Web Application");
  console.log("====================================");
  console.log("");

  try {
    // Run all initialization phases in order
    await initializePhase1();
    await initializePhase2();
    await initializePhase3();

    console.log("====================================");
    console.log("✅ CIA Web Ready!");
    console.log("Type CIA.help() in console for debug commands");
    console.log("====================================");

    return true;
  } catch (error) {
    console.error("❌ Fatal initialization error:", error);
    return false;
  }
}

// Export individual phases for backward compatibility
export default {
  initializePhase1,
  initializePhase2,
  initializePhase3,
  initializeCIAWeb,
};
