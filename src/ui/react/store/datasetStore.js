// Zustand store for dataset metadata
// Works alongside dataCache (IndexedDB) which stores the actual binary data

import { create } from "zustand";

/**
 * Dataset Store
 *
 * Holds metadata about all datasets in the session.
 * Binary data lives in IndexedDB (dataCache), this just tracks what exists.
 *
 * Dataset Structure:
 * {
 *   id: string,              // Unique dataset ID (generated)
 *   name: string,            // Original filename
 *   hash: string,            // SHA-256 hash (key for IndexedDB)
 *   bounds: [xMin, xMax, yMin, yMax, zMin, zMax],
 *   pointCount: number,      // Number of points in dataset
 *   cellCount: number,       // Number of cells in dataset
 *   sizeBytes: number,       // File size in bytes
 *   uploadedBy: string,      // User ID who uploaded it
 *   uploadedAt: number,      // Timestamp
 *   annotations: Array       // Annotations for this dataset
 * }
 */
export const useDatasetStore = create((set, get) => ({
  // Map of dataset ID -> dataset metadata
  // Using Map instead of object for better performance with large datasets
  datasets: new Map(),

  // Currently active dataset (the one being viewed)
  activeDatasetId: null,

  /**
   * Add a new dataset to the store
   *
   * @param {string} id - Unique dataset ID
   * @param {Object} metadata - Dataset metadata
   */
  addDataset: (id, metadata) => {
    set((state) => {
      // Create new Map to trigger React rerender
      const newDatasets = new Map(state.datasets);
      newDatasets.set(id, {
        id,
        ...metadata,
        annotations: metadata.annotations || [],
      });

      console.log(`✅ Dataset added to store: ${metadata.name} (${id})`);

      return {
        datasets: newDatasets,
        // Set as active if no active dataset yet
        activeDatasetId: state.activeDatasetId || id,
      };
    });
  },

  /**
   * Get a specific dataset by ID
   *
   * @param {string} id - Dataset ID
   * @returns {Object|undefined} Dataset metadata or undefined if not found
   */
  getDataset: (id) => {
    return get().datasets.get(id);
  },

  /**
   * Get the currently active dataset
   *
   * @returns {Object|undefined} Active dataset metadata
   */
  getActiveDataset: () => {
    const state = get();
    return state.datasets.get(state.activeDatasetId);
  },

  /**
   * Set the active dataset
   *
   * @param {string} id - Dataset ID to make active
   */
  setActiveDataset: (id) => {
    const dataset = get().datasets.get(id);
    if (dataset) {
      set({ activeDatasetId: id });
      console.log(`✅ Active dataset set to: ${dataset.name}`);
    } else {
      console.warn(`⚠️  Cannot set active dataset: ${id} not found`);
    }
  },

  /**
   * Update dataset metadata
   * Useful for updating bounds, counts, etc. after processing
   *
   * @param {string} id - Dataset ID
   * @param {Object} updates - Partial metadata to update
   */
  updateDataset: (id, updates) => {
    set((state) => {
      const dataset = state.datasets.get(id);
      if (!dataset) {
        console.warn(`⚠️  Cannot update dataset: ${id} not found`);
        return state;
      }

      const newDatasets = new Map(state.datasets);
      newDatasets.set(id, {
        ...dataset,
        ...updates,
      });

      console.log(`✅ Dataset updated: ${dataset.name}`);
      return { datasets: newDatasets };
    });
  },

  /**
   * Add an annotation to a dataset
   * Annotations are scoped to datasets, not instances
   *
   * @param {string} datasetId - Dataset ID
   * @param {Object} annotation - Annotation object
   */
  addAnnotation: (datasetId, annotation) => {
    set((state) => {
      const dataset = state.datasets.get(datasetId);
      if (!dataset) {
        console.warn(
          `⚠️  Cannot add annotation: dataset ${datasetId} not found`
        );
        return state;
      }

      const newDatasets = new Map(state.datasets);
      const updatedDataset = {
        ...dataset,
        annotations: [...dataset.annotations, annotation],
      };
      newDatasets.set(datasetId, updatedDataset);

      console.log(`✅ Annotation added to dataset: ${dataset.name}`);
      return { datasets: newDatasets };
    });
  },

  /**
   * Update annotations for a dataset
   * Replaces all annotations with new array
   *
   * @param {string} datasetId - Dataset ID
   * @param {Array} annotations - New annotations array
   */
  updateAnnotations: (datasetId, annotations) => {
    set((state) => {
      const dataset = state.datasets.get(datasetId);
      if (!dataset) {
        console.warn(
          `⚠️  Cannot update annotations: dataset ${datasetId} not found`
        );
        return state;
      }

      const newDatasets = new Map(state.datasets);
      newDatasets.set(datasetId, {
        ...dataset,
        annotations,
      });

      console.log(
        `✅ Annotations updated for dataset: ${dataset.name} (${annotations.length} annotations)`
      );
      return { datasets: newDatasets };
    });
  },

  /**
   * Remove a dataset from the store
   * Note: This does NOT delete from IndexedDB, only removes from React state
   *
   * @param {string} id - Dataset ID to remove
   */
  removeDataset: (id) => {
    set((state) => {
      const dataset = state.datasets.get(id);
      if (!dataset) {
        console.warn(`⚠️  Cannot remove dataset: ${id} not found`);
        return state;
      }

      const newDatasets = new Map(state.datasets);
      newDatasets.delete(id);

      console.log(`✅ Dataset removed from store: ${dataset.name}`);

      // If we removed the active dataset, clear active
      const newActiveId =
        state.activeDatasetId === id
          ? newDatasets.size > 0
            ? newDatasets.keys().next().value
            : null
          : state.activeDatasetId;

      return {
        datasets: newDatasets,
        activeDatasetId: newActiveId,
      };
    });
  },

  /**
   * Get all datasets as an array
   * Useful for rendering lists
   *
   * @returns {Array} Array of dataset metadata objects
   */
  getAllDatasets: () => {
    return Array.from(get().datasets.values());
  },

  /**
   * Get count of datasets
   *
   * @returns {number} Number of datasets in store
   */
  getDatasetCount: () => {
    return get().datasets.size;
  },

  /**
   * Check if a dataset exists
   *
   * @param {string} id - Dataset ID
   * @returns {boolean} True if dataset exists
   */
  hasDataset: (id) => {
    return get().datasets.has(id);
  },

  /**
   * Find dataset by hash
   * Useful when receiving dataset metadata from Y.js
   *
   * @param {string} hash - SHA-256 hash to search for
   * @returns {Object|undefined} Dataset metadata or undefined
   */
  findDatasetByHash: (hash) => {
    const datasets = get().datasets;
    for (const dataset of datasets.values()) {
      if (dataset.hash === hash) {
        return dataset;
      }
    }
    return undefined;
  },

  /**
   * Clear all datasets from store
   * WARNING: This removes all dataset metadata from React state
   *
   * @returns {void}
   */
  clearAll: () => {
    set({
      datasets: new Map(),
      activeDatasetId: null,
    });
    console.log("✅ All datasets cleared from store");
  },
}));
