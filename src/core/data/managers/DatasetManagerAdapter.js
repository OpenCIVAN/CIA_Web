// src/core/data/managers/DatasetManagerAdapter.js

/**
 * DatasetManagerAdapter
 *
 * Adapts your existing dataCache (which uses SHA-256 hashing) to the
 * interface expected by the new DatasetManager.
 *
 * Why this adapter exists:
 * - Your dataCache uses: storeDataset(), getDataset(), deleteDataset()
 * - DatasetManager expects: storeFile(), getFile(), removeFile()
 * - Your dataCache returns hashes as keys, which is perfect for deduplication
 * - This adapter translates between these interfaces without changing working code
 *
 * This is a BRIDGE pattern - it lets us use your well-designed cache
 * with the new architecture without rewriting either side.
 */

export class DatasetManagerAdapter {
  constructor(dataCache) {
    // Store reference to your existing dataCache
    this._cache = dataCache;

    // Track which hashes correspond to which cache operations
    // This helps with debugging and understanding cache state
    this._hashRegistry = new Map(); // hash → { filename, timestamp }

    console.log("🔌 DatasetManagerAdapter: Created");
  }

  /**
   * Initialize the adapter
   * This ensures the underlying cache is ready
   */
  async initialize() {
    console.log("🔌 DatasetManagerAdapter: Initializing...");

    // Your dataCache initializes on first use, but we can trigger it explicitly
    if (this._cache.initDB && typeof this._cache.initDB === "function") {
      await this._cache.initDB();
    }

    console.log("✅ DatasetManagerAdapter: Ready");
  }

  /**
   * Store a file in the cache
   *
   * This translates DatasetManager's storeFile() to dataCache's storeDataset()
   *
   * @param {File} file - The file to store
   * @returns {Promise<string>} - Hash of the stored file (used as cache key)
   */
  async storeFile(file) {
    console.log(`🔌 Adapter: Storing file "${file.name}"`);

    try {
      // Call your existing dataCache.storeDataset()
      // This returns the SHA-256 hash of the file
      const hash = await this._cache.storeDataset(file);

      // Track this hash for debugging
      this._hashRegistry.set(hash, {
        filename: file.name,
        size: file.size,
        timestamp: Date.now(),
      });

      console.log(
        `✅ Adapter: File stored with hash ${hash.substring(0, 16)}...`
      );

      // Return the hash - this becomes the file reference in Dataset objects
      return hash;
    } catch (error) {
      console.error("❌ Adapter: Failed to store file:", error);
      throw error;
    }
  }

  /**
   * Retrieve a file from the cache
   *
   * This translates DatasetManager's getFile() to dataCache's getDataset()
   *
   * @param {string} cacheKey - The hash returned from storeFile()
   * @returns {Promise<File>} - The original file object
   */
  async getFile(cacheKey) {
    console.log(
      `🔌 Adapter: Retrieving file with key ${cacheKey.substring(0, 16)}...`
    );

    try {
      // Call your existing dataCache.getDataset()
      // This returns { hash, name, data, storedAt, sizeBytes }
      const cached = await this._cache.getDataset(cacheKey);

      if (!cached) {
        console.warn(
          `⚠️ Adapter: File not found for key ${cacheKey.substring(0, 16)}...`
        );
        return null;
      }

      // Convert the cached data back to a File object
      // The data is stored as an ArrayBuffer, so we convert it back
      const blob = new Blob([cached.data]);
      const file = new File([blob], cached.name, {
        type: "application/octet-stream",
        lastModified: cached.storedAt,
      });

      console.log(`✅ Adapter: File retrieved: "${cached.name}"`);

      return file;
    } catch (error) {
      console.error("❌ Adapter: Failed to retrieve file:", error);
      throw error;
    }
  }

  /**
   * Check if a file exists in the cache
   *
   * @param {string} cacheKey - The hash to check
   * @returns {Promise<boolean>} - Whether the file exists
   */
  async hasFile(cacheKey) {
    try {
      return await this._cache.hasDataset(cacheKey);
    } catch (error) {
      console.error("❌ Adapter: Error checking file existence:", error);
      return false;
    }
  }

  /**
   * Remove a file from the cache
   *
   * This translates DatasetManager's removeFile() to dataCache's deleteDataset()
   *
   * @param {string} cacheKey - The hash of the file to remove
   * @returns {Promise<boolean>} - Whether removal was successful
   */
  async removeFile(cacheKey) {
    console.log(
      `🔌 Adapter: Removing file with key ${cacheKey.substring(0, 16)}...`
    );

    try {
      const result = await this._cache.deleteDataset(cacheKey);

      // Clean up our tracking registry
      this._hashRegistry.delete(cacheKey);

      console.log(`✅ Adapter: File removed`);

      return result;
    } catch (error) {
      console.error("❌ Adapter: Failed to remove file:", error);
      throw error;
    }
  }

  /**
   * Get statistics about the cache
   * Useful for debugging and UI display
   *
   * @returns {Promise<object>} - Cache statistics
   */
  async getStats() {
    try {
      // Use your existing listDatasets() to get cache contents
      const datasets = await this._cache.listDatasets();

      const stats = {
        count: datasets.length,
        totalSize: datasets.reduce((sum, ds) => sum + (ds.sizeBytes || 0), 0),
        files: datasets.map((ds) => ({
          hash: ds.hash.substring(0, 16) + "...",
          name: ds.name,
          size: ds.sizeBytes,
          cached: new Date(ds.storedAt).toLocaleString(),
        })),
      };

      return stats;
    } catch (error) {
      console.error("❌ Adapter: Failed to get stats:", error);
      return {
        count: 0,
        totalSize: 0,
        files: [],
      };
    }
  }

  /**
   * Calculate hash for a file without storing it
   * Useful for checking if a file already exists before uploading
   *
   * @param {File} file - File to hash
   * @returns {Promise<string>} - SHA-256 hash
   */
  async calculateHash(file) {
    return await this._cache.hashFile(file);
  }

  /**
   * Clear all cached files
   * WARNING: This is destructive!
   *
   * @returns {Promise<boolean>} - Whether clear was successful
   */
  async clearAll() {
    console.warn("🔌 Adapter: Clearing all cached files!");

    try {
      const result = await this._cache.clearAll();
      this._hashRegistry.clear();
      return result;
    } catch (error) {
      console.error("❌ Adapter: Failed to clear cache:", error);
      return false;
    }
  }
}

/**
 * USAGE EXAMPLE:
 *
 * import { dataCache } from '@Services/storage/dataCache.js';
 * import { DatasetManagerAdapter } from '@Core/data/managers/DatasetManagerAdapter.js';
 * import { DatasetManager } from '@Core/data/managers/DatasetManager.js';
 *
 * // Create adapter wrapping your existing cache
 * const cacheAdapter = new DatasetManagerAdapter(dataCache);
 * await cacheAdapter.initialize();
 *
 * // Create DatasetManager using the adapter
 * const datasetManager = new DatasetManager();
 * await datasetManager.initialize(cacheAdapter);
 *
 * // Now DatasetManager works with your existing dataCache seamlessly!
 * const dataset = await datasetManager.addDataset(file, userId);
 *
 * // Behind the scenes:
 * // 1. DatasetManager calls adapter.storeFile(file)
 * // 2. Adapter calls dataCache.storeDataset(file)
 * // 3. dataCache returns hash
 * // 4. Adapter returns hash to DatasetManager
 * // 5. DatasetManager stores hash as file reference in Dataset object
 */
