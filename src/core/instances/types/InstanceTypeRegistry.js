// src/core/instances/types/InstanceTypeRegistry.js
// Central registry for instance type plugins
// This is how the core discovers and uses type handlers

/**
 * InstanceTypeRegistry
 *
 * The registry is the bridge between the core system and type-specific handlers.
 * It maintains a map of type identifiers to handler instances, and provides
 * methods for registering new types and retrieving handlers.
 *
 * When the application initializes, each instance type plugin registers itself
 * with this registry. From that point on, the core system can create instances
 * of any registered type without knowing implementation details.
 *
 * This is the key to the plugin architecture. Contributors add a new type by:
 * 1. Creating a handler class that implements InstanceTypeHandler
 * 2. Calling registry.register(handler) during app initialization
 * 3. That's it! The core system automatically knows how to use it.
 */
class InstanceTypeRegistry {
  constructor() {
    // Map of type identifier → handler instance
    // Example: { 'vtk': vtkHandlerInstance, 'plotly': plotlyHandlerInstance }
    this.handlers = new Map();

    console.log("📋 InstanceTypeRegistry: Created");
  }

  /**
   * Register a new instance type handler
   *
   * Call this during app initialization to make a new type available.
   * The handler must implement the InstanceTypeHandler interface.
   *
   * @param {InstanceTypeHandler} handler - Handler instance to register
   *
   * @example
   * import { vtkInstanceHandler } from './types/VTKInstanceHandler.js';
   * registry.register(vtkInstanceHandler);
   */
  register(handler) {
    const type = handler.getType();

    if (this.handlers.has(type)) {
      console.warn(
        `⚠️ Registry: Type '${type}' already registered, overwriting`
      );
    }

    this.handlers.set(type, handler);
    console.log(
      `✅ Registry: Registered type '${type}' (${handler.getDisplayName()})`
    );
  }

  /**
   * Get handler for a specific type
   *
   * Returns the handler that knows how to work with this instance type.
   * Throws an error if the type isn't registered - this catches typos and
   * missing registrations early.
   *
   * @param {string} type - Type identifier (e.g., 'vtk', 'plotly')
   * @returns {InstanceTypeHandler} Handler for this type
   * @throws {Error} If type not registered
   */
  getHandler(type) {
    const handler = this.handlers.get(type);

    if (!handler) {
      throw new Error(
        `Instance type '${type}' not registered. ` +
          `Available types: ${this.getAvailableTypes().join(", ")}`
      );
    }

    return handler;
  }

  /**
   * Check if a type is registered
   *
   * @param {string} type - Type identifier
   * @returns {boolean} True if type is registered
   */
  hasType(type) {
    return this.handlers.has(type);
  }

  /**
   * Get list of all registered type identifiers
   *
   * @returns {string[]} Array of type identifiers
   */
  getAvailableTypes() {
    return Array.from(this.handlers.keys());
  }

  /**
   * Get list of all registered handlers with their display names
   *
   * Useful for UI that lets users choose an instance type.
   *
   * @returns {Array<Object>} Array of {type, displayName, handler}
   *
   * @example
   * const types = registry.getAvailableHandlers();
   * // Returns: [
   * //   { type: 'vtk', displayName: 'VTK 3D View', handler: vtkHandler },
   * //   { type: 'plotly', displayName: 'Plotly Chart', handler: plotlyHandler }
   * // ]
   */
  getAvailableHandlers() {
    return Array.from(this.handlers.entries()).map(([type, handler]) => ({
      type,
      displayName: handler.getDisplayName(),
      handler,
    }));
  }

  /**
   * Find handlers that can display a specific dataset
   *
   * Some handlers can only work with specific data types. This method
   * asks each handler if it can handle the dataset and returns compatible ones.
   *
   * @param {Object} dataset - Dataset metadata
   * @returns {Array<Object>} Compatible handlers with their types
   *
   * @example
   * const vtpDataset = { name: 'model.vtp', ... };
   * const handlers = registry.getCompatibleHandlers(vtpDataset);
   * // Returns: [{ type: 'vtk', displayName: 'VTK 3D View', handler }]
   */
  getCompatibleHandlers(dataset) {
    const compatible = [];

    for (const [type, handler] of this.handlers.entries()) {
      if (handler.canHandleDataset(dataset)) {
        compatible.push({
          type,
          displayName: handler.getDisplayName(),
          handler,
        });
      }
    }

    return compatible;
  }

  /**
   * Unregister a type (rarely needed, mainly for testing)
   *
   * @param {string} type - Type identifier to unregister
   */
  unregister(type) {
    if (this.handlers.delete(type)) {
      console.log(`✅ Registry: Unregistered type '${type}'`);
    }
  }

  /**
   * Clear all registered types (mainly for testing)
   */
  clear() {
    this.handlers.clear();
    console.log("✅ Registry: Cleared all types");
  }
}

// Export singleton registry
export const instanceTypeRegistry = new InstanceTypeRegistry();

/**
 * Convenience function to register instance types during app initialization
 *
 * Import this in your app initialization code and call it to register
 * all your instance type plugins in one place.
 *
 * @example
 * // In appInitializer.js:
 * import { registerDefaultInstanceTypes } from '@Core/instances/types/InstanceTypeRegistry.js';
 *
 * async function initializeApp() {
 *   // ... other initialization ...
 *   registerDefaultInstanceTypes();
 *   // Now all instance types are available
 * }
 */
export function registerDefaultInstanceTypes() {
  console.log("📋 Registering default instance types...");

  // Import and register VTK handler
  import("./VTKInstanceHandler.js").then((module) => {
    instanceTypeRegistry.register(module.vtkInstanceHandler);
  });

  // Contributors: Add your instance types here!
  // import('./PlotlyInstanceHandler.js').then(module => {
  //   instanceTypeRegistry.register(module.plotlyInstanceHandler);
  // });

  // import('./ThreeJSInstanceHandler.js').then(module => {
  //   instanceTypeRegistry.register(module.threeJSInstanceHandler);
  // });
}
