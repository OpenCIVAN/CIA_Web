// src/core/instances/workspaceManager.js
// Type-agnostic workspace manager using the plugin architecture

import { generateInstanceId } from "@Utils/idGenerator.js";
import { getHandlerForType } from "@Core/instances/types/instanceTypesInit.js";
import { getUserId } from "@Collaboration/presence/userManagement.js";
import { yInstances } from "@Collaboration/yjs/yjsSetup.js";
import { datasetManager } from "@Init/appInitializer.js";

/**
 * WorkspaceManager
 *
 * Manages instance windows that can start TYPELESS and become typed when data loads.
 * This enables truly generic instances that adapt to their content.
 */
class WorkspaceManager {
  constructor() {
    this.instances = new Map();
    this.activeInstanceId = null;
    this._initialized = false;
    this.listeners = new Set();

    console.log("🎨 WorkspaceManager created (type-agnostic)");
  }

  initialize() {
    if (this._initialized) {
      console.log("⚠️  WorkspaceManager already initialized");
      return;
    }

    this._initialized = true;
    console.log("✅ WorkspaceManager initialized");
  }

  /**
   * Create a new instance in the specified container
   *
   * Type can be NULL - instance will determine type when data loads.
   *
   * @param {HTMLElement} containerElement - DOM element to render into
   * @param {string|null} type - Instance type ('vtk', 'plot', etc.) or null for typeless
   * @param {Object} options - Instance configuration
   * @returns {string} The instance ID
   */
  async createInstance(containerElement, type = null, options = {}) {
    if (!containerElement) {
      throw new Error("Container element is required for createInstance");
    }

    const instanceId = options.instanceId || generateInstanceId();
    const { viewConfigId, datasetId } = options;

    if (this.instances.has(instanceId)) {
      console.warn(
        `⚠️  Instance ${instanceId} already exists, skipping creation`
      );
      return instanceId;
    }

    console.log(`🎨 Creating ${type || "typeless"} instance: ${instanceId}`);

    try {
      // Create instance metadata (handler will be initialized later if needed)
      const instance = {
        instanceId,
        type: type, // Can be null - will be set when data loads
        container: containerElement,
        handler: null, // Will be set when type is determined
        instanceData: null, // Will be set when handler initializes
        datasetId: datasetId || null,
        viewConfigId: viewConfigId || null,
        createdAt: Date.now(),
        lastActive: Date.now(),
      };

      // If type is provided, initialize handler immediately
      if (type) {
        await this._initializeHandler(instance, type);
      }

      // Store instance
      this.instances.set(instanceId, instance);

      // Set as active
      this.activeInstanceId = instanceId;

      console.log(`✅ Instance created: ${instanceId} (${type || "typeless"})`);
      console.log(`   Total instances: ${this.instances.size}`);

      // Notify listeners
      this._notifyListeners();

      return instanceId;
    } catch (error) {
      console.error(`❌ Failed to create instance:`, error);
      throw error;
    }
  }

  /**
   * Initialize handler for an instance
   * @private
   */
  async _initializeHandler(instance, type) {
    console.log(
      `🔌 Initializing ${type} handler for instance ${instance.instanceId}`
    );

    const handler = getHandlerForType(type);
    const instanceData = await handler.initialize(instance.container, {
      instanceId: instance.instanceId,
      datasetId: instance.datasetId,
      viewConfigId: instance.viewConfigId,
    });

    instance.handler = handler;
    instance.instanceData = instanceData;
    instance.type = type;

    console.log(`✅ Handler initialized for instance ${instance.instanceId}`);
  }

  /**
   * Load data into an instance
   *
   * If instance doesn't have a type, this will determine it from the dataset.
   *
   * @param {string} instanceId - Instance to load data into
   * @param {string} datasetId - Dataset to load
   */
  async loadDataIntoInstance(instanceId, datasetId) {
    const instance = this.getInstance(instanceId);
    if (!instance) {
      throw new Error(`Instance ${instanceId} not found`);
    }

    try {
      console.log(
        `📊 Loading dataset ${datasetId} into instance ${instanceId}`
      );

      // Get the dataset
      const dataset = datasetManager.getDataset(datasetId);
      if (!dataset) {
        throw new Error(`Dataset ${datasetId} not found`);
      }

      // CRITICAL: If instance doesn't have a type yet, determine it from dataset
      if (!instance.type) {
        const inferredType = this._inferTypeFromDataset(dataset);
        console.log(`🔍 Instance ${instanceId} type inferred: ${inferredType}`);

        // Initialize the handler now that we know the type
        await this._initializeHandler(instance, inferredType);
      }

      // Load the actual file data
      const polydata = await datasetManager.loadPolydata(datasetId);
      if (!polydata) {
        throw new Error(`Failed to load polydata for dataset ${datasetId}`);
      }

      // Tell the handler to render the data
      await instance.handler.loadData(instance.instanceData, dataset, polydata);

      // Update instance metadata
      instance.datasetId = datasetId;
      instance.lastActive = Date.now();

      console.log(`✅ Dataset loaded into instance ${instanceId}`);

      // Notify listeners so UI updates (toolbar should appear now)
      this._notifyListeners();
    } catch (error) {
      console.error(
        `❌ Failed to load dataset into instance ${instanceId}:`,
        error
      );
      throw error;
    }
  }

  /**
   * Infer instance type from dataset
   * @private
   */
  _inferTypeFromDataset(dataset) {
    const typeMap = {
      vtp: "vtk",
      vti: "vtk",
      vtu: "vtk",
      csv: "plot",
      json: "plot",
      png: "image",
      jpg: "image",
      jpeg: "image",
    };

    const fileType = dataset.fileType.toLowerCase();
    return typeMap[fileType] || "vtk"; // Default to vtk if unknown
  }

  /**
   * Delete an instance
   */
  async deleteInstance(instanceId) {
    const instance = this.getInstance(instanceId);
    if (!instance) {
      console.warn(`⚠️  Instance ${instanceId} not found`);
      return;
    }

    console.log(`🗑️  Deleting instance: ${instanceId}`);

    try {
      // Clean up handler if it exists
      if (instance.handler && instance.instanceData) {
        await instance.handler.cleanup(instance.instanceData);
      }

      // Remove from map
      this.instances.delete(instanceId);

      // Clear active if this was active
      if (this.activeInstanceId === instanceId) {
        this.activeInstanceId = null;
      }

      console.log(`✅ Instance deleted: ${instanceId}`);
      console.log(`   Remaining instances: ${this.instances.size}`);

      // Notify listeners
      this._notifyListeners();
    } catch (error) {
      console.error(`❌ Error deleting instance ${instanceId}:`, error);
      throw error;
    }
  }

  /**
   * Get an instance by ID
   */
  getInstance(instanceId) {
    return this.instances.get(instanceId) || null;
  }

  /**
   * Get all instance IDs
   */
  getAllInstanceIds() {
    return Array.from(this.instances.keys());
  }

  /**
   * Get the total number of instances
   */
  getInstanceCount() {
    return this.instances.size;
  }

  /**
   * Get instances by type
   */
  getInstancesByType(type) {
    const instances = [];
    for (const [id, instance] of this.instances.entries()) {
      if (instance.type === type) {
        instances.push(instance);
      }
    }
    return instances;
  }

  /**
   * Get available tools for an instance
   * Returns empty array if instance has no type/handler yet
   */
  getInstanceTools(instanceId) {
    const instance = this.getInstance(instanceId);
    if (!instance || !instance.handler || !instance.type) {
      return []; // No tools for typeless instances
    }

    return instance.handler.getTools(instance.instanceData);
  }

  /**
   * Get header information for an instance
   * Returns default info if instance has no type yet
   */
  getInstanceHeaderInfo(instanceId) {
    const instance = this.getInstance(instanceId);
    if (!instance) {
      return { title: "Unknown", stats: {} };
    }

    if (!instance.handler || !instance.type) {
      return {
        title: "Empty Instance",
        stats: { status: "Waiting for data" },
      };
    }

    return instance.handler.getHeaderInfo(instance.instanceData);
  }

  /**
   * Set the active instance
   */
  setActiveInstance(instanceId) {
    if (!this.instances.has(instanceId)) {
      console.warn(
        `⚠️  Cannot set non-existent instance as active: ${instanceId}`
      );
      return;
    }

    this.activeInstanceId = instanceId;
    const instance = this.instances.get(instanceId);
    instance.lastActive = Date.now();

    this._notifyListeners();
  }

  /**
   * Get the currently active instance
   */
  getActiveInstance() {
    if (!this.activeInstanceId) {
      return null;
    }
    return this.getInstance(this.activeInstanceId);
  }

  /**
   * Check if manager is initialized
   */
  isInitialized() {
    return this._initialized;
  }

  // =========================================================================
  // LISTENER MANAGEMENT FOR REACT INTEGRATION
  // =========================================================================

  addListener(callback) {
    this.listeners.add(callback);
  }

  removeListener(callback) {
    this.listeners.delete(callback);
  }

  _notifyListeners() {
    this.listeners.forEach((callback) => {
      try {
        callback();
      } catch (error) {
        console.error("❌ Error in workspace listener:", error);
      }
    });
  }
}

// Create and export singleton
export const workspaceManager = new WorkspaceManager();
export { WorkspaceManager };
