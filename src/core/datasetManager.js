// src/core/datasetManager.js
// Updated for new architecture with proper sync/async handling

import vtkXMLPolyDataReader from "@kitware/vtk.js/IO/XML/XMLPolyDataReader";
import { yDatasets } from "../collaboration/yjsSetup.js";
import { syncDatasetToYjs } from "../collaboration/yjsSetup.js";
import { getUserId, getUserName } from "../collaboration/userManagement.js";
import { dataCache } from "../services/dataCache.js";
import { useDatasetStore } from "../ui/react/store/datasetStore.js";
import { generateDatasetId } from "../utils/idGenerator.js";

class DatasetManager {
  constructor() {
    this.datasets = new Map(); // Local polydata cache
    this.loadingDatasets = new Set();
    this.listeners = [];
    this._initialized = false;
  }

  initialize() {
    if (this._initialized) return;
    this._initialized = true;
    console.log("📦 Dataset manager initialized");
  }

  /**
   * Check if dataset with this filename already exists
   */
  findDatasetByFilename(filename) {
    const allDatasets = useDatasetStore.getState().getAllDatasets();
    return allDatasets.find((ds) => ds.name === filename);
  }

  /**
   * Load dataset from File object
   * SYNCHRONOUS metadata updates, file stored in IndexedDB
   */

  /**
   * Load dataset from File object
   * ENHANCED WITH DETAILED LOGGING
   */
  async loadDataset(file, publicPath = null) {
    const startTime = Date.now();
    console.log("📂 ========================================");
    console.log(`📂 Loading dataset: ${file.name}`);
    console.log(`📂 File size: ${(file.size / 1024).toFixed(2)} KB`);
    console.log("📂 ========================================");

    try {
      // Step 1: Generate ID
      const datasetId = generateDatasetId();
      console.log(
        `  ✅ [${Date.now() - startTime}ms] Generated ID: ${datasetId}`
      );

      // Step 2: Parse VTP
      console.log(`  ⏳ [${Date.now() - startTime}ms] Parsing VTP file...`);
      const arrayBuffer = await file.arrayBuffer();
      const reader = vtkXMLPolyDataReader.newInstance();
      reader.parseAsArrayBuffer(arrayBuffer);
      const polydata = reader.getOutputData();

      if (!polydata) {
        throw new Error("Failed to parse VTP file");
      }

      const pointCount = polydata.getPoints()
        ? polydata.getPoints().getNumberOfValues() / 3
        : 0;
      console.log(
        `  ✅ [${
          Date.now() - startTime
        }ms] VTP parsed: ${pointCount.toLocaleString()} points`
      );

      // Step 3: Store in IndexedDB
      console.log(`  ⏳ [${Date.now() - startTime}ms] Storing in IndexedDB...`);
      const hash = await dataCache.storeDataset(file);
      console.log(
        `  ✅ [${Date.now() - startTime}ms] Cached with hash: ${hash.substring(
          0,
          16
        )}...`
      );

      // Step 4: Check for duplicates
      const existingByHash = useDatasetStore.getState().findDatasetByHash(hash);
      if (existingByHash) {
        console.log(
          `  ⚠️  [${
            Date.now() - startTime
          }ms] Duplicate file detected (hash match)`
        );
        console.log(`     Using existing ID: ${existingByHash.id}`);

        // Store polydata locally
        this.datasets.set(existingByHash.id, {
          id: existingByHash.id,
          name: file.name,
          polydata,
          metadata: existingByHash,
        });

        console.log(
          `  ✅ [${
            Date.now() - startTime
          }ms] Polydata stored for existing dataset`
        );
        console.log(
          `  🔍 Verification: has polydata = ${this.datasets.has(
            existingByHash.id
          )}`
        );

        this._notifyListeners();
        console.log(
          "📂 ======================================== DONE (duplicate)"
        );
        return existingByHash.id;
      }

      // Step 5: Create metadata
      const metadata = {
        id: datasetId,
        name: file.name,
        hash,
        bounds: polydata.getBounds(),
        pointCount,
        cellCount: polydata.getNumberOfCells(),
        sizeBytes: file.size,
        uploadedBy: getUserId(),
        uploadedByName: getUserName(),
        uploadedAt: Date.now(),
        publicPath: publicPath,
        annotations: [],
      };
      console.log(`  ✅ [${Date.now() - startTime}ms] Metadata created`);

      // Step 6: 🔥 CRITICAL - Store polydata locally FIRST
      console.log(
        `  ⏳ [${Date.now() - startTime}ms] Storing polydata in memory...`
      );
      this.datasets.set(datasetId, {
        id: datasetId,
        name: file.name,
        polydata,
        metadata,
      });

      // 🔥 VERIFY IT WAS STORED
      const verification = this.datasets.get(datasetId);
      console.log(
        `  ✅ [${Date.now() - startTime}ms] Polydata stored in memory`
      );
      console.log(
        `  🔍 Verification: has dataset = ${this.datasets.has(datasetId)}`
      );
      console.log(
        `  🔍 Verification: has polydata = ${!!verification?.polydata}`
      );
      console.log(
        `  🔍 Verification: polydata points = ${
          verification?.polydata?.getPoints()?.getNumberOfPoints() || 0
        }`
      );

      // Step 7: Add to Zustand
      console.log(
        `  ⏳ [${Date.now() - startTime}ms] Adding to Zustand store...`
      );
      useDatasetStore.getState().addDataset(datasetId, metadata);
      console.log(`  ✅ [${Date.now() - startTime}ms] Added to Zustand`);

      // Step 8: Sync to Y.js
      console.log(`  ⏳ [${Date.now() - startTime}ms] Syncing to Y.js...`);
      syncDatasetToYjs(datasetId, metadata);
      console.log(`  ✅ [${Date.now() - startTime}ms] Synced to Y.js`);

      // Step 9: Notify listeners
      console.log(`  ⏳ [${Date.now() - startTime}ms] Notifying listeners...`);
      this._notifyListeners();
      console.log(`  ✅ [${Date.now() - startTime}ms] Listeners notified`);

      const totalTime = Date.now() - startTime;
      console.log("📂 ========================================");
      console.log(`📂 ✅ Dataset loaded successfully in ${totalTime}ms`);
      console.log(`📂 ID: ${datasetId}`);
      console.log(`📂 Name: ${file.name}`);
      console.log(`📂 Points: ${pointCount.toLocaleString()}`);
      console.log("📂 ========================================");

      return datasetId;
    } catch (error) {
      const errorTime = Date.now() - startTime;
      console.error("📂 ========================================");
      console.error(`📂 ❌ Failed to load dataset after ${errorTime}ms`);
      console.error(`📂 Error: ${error.message}`);
      console.error("📂 ========================================");
      console.error(error);
      throw new Error(`Failed to load ${file.name}: ${error.message}`);
    }
  }

  /**
   * Load dataset polydata from cache (for remote users)
   * Returns null if not available (doesn't throw)
   */
  async loadPolydataFromCache(datasetId) {
    // Check if already loaded
    if (this.datasets.has(datasetId)) {
      const existing = this.datasets.get(datasetId);
      if (existing.polydata) {
        return existing.polydata;
      }
    }

    // Check if already loading
    if (this.loadingDatasets.has(datasetId)) {
      console.log(`⏳ Already loading ${datasetId}, waiting...`);

      // Wait for the other load to complete (max 30 seconds)
      let attempts = 0;
      while (attempts < 60 && this.loadingDatasets.has(datasetId)) {
        await new Promise((resolve) => setTimeout(resolve, 500));
        attempts++;
      }

      // Check if it's now available
      const existing = this.datasets.get(datasetId);
      return existing?.polydata || null;
    }

    const metadata = useDatasetStore.getState().getDataset(datasetId);
    if (!metadata) {
      console.warn(`⚠️  Dataset metadata not in Zustand: ${datasetId}`);
      return null;
    }

    if (!metadata.hash) {
      console.warn(`⚠️  Dataset missing hash: ${datasetId}`);
      return null;
    }

    this.loadingDatasets.add(datasetId);
    console.log(`📥 Loading polydata from cache: ${metadata.name}`);

    try {
      const cached = await dataCache.getDataset(metadata.hash);

      if (!cached) {
        console.warn(`⚠️  File not in cache: ${metadata.name}`);

        // 🔥 ADD THIS: Try to fetch if it's a public file
        if (metadata.publicPath) {
          console.log(`📥 Attempting to fetch from: ${metadata.publicPath}`);

          try {
            const response = await fetch(metadata.publicPath);
            if (!response.ok) {
              throw new Error(`HTTP ${response.status}`);
            }

            const blob = await response.blob();
            const file = new File([blob], metadata.name, {
              type: "application/octet-stream",
            });

            // Store in cache for future use
            await dataCache.storeDataset(file);
            console.log(`✅ Public file fetched and cached`);

            // Now get it from cache (recursive call, but now it exists)
            return this.loadPolydataFromCache(datasetId);
          } catch (fetchError) {
            console.error(`❌ Failed to fetch public file:`, fetchError);
            return null;
          }
        }

        console.log(`   Hash: ${metadata.hash.substring(0, 16)}...`);
        console.log(`   User must upload matching file to view`);
        return null;
      }

      const reader = vtkXMLPolyDataReader.newInstance();
      reader.parseAsArrayBuffer(cached.data);
      const polydata = reader.getOutputData();

      if (!polydata) {
        throw new Error("Failed to parse cached VTP");
      }

      // ✅ Store successfully loaded polydata
      this.datasets.set(datasetId, {
        id: datasetId,
        name: metadata.name,
        polydata,
        metadata,
      });

      console.log(`✅ Polydata loaded from cache: ${metadata.name}`);
      this._notifyListeners();

      return polydata;
    } catch (error) {
      console.error(`❌ Failed to load polydata from cache:`, error);

      // 🔥 CRITICAL: Don't store failed datasets - just return null
      // This prevents creating entries with null polydata
      return null;
    } finally {
      this.loadingDatasets.delete(datasetId);
    }
  }

  /**
   * Get dataset SYNCHRONOUSLY (only returns if already loaded)
   * Use this in loops, UI rendering, etc.
   */
  /**
   * Get dataset SYNCHRONOUSLY with logging
   */
  getDatasetSync(datasetId) {
    const dataset = this.datasets.get(datasetId);

    // Add debug logging
    if (!dataset) {
      console.warn(`⚠️  getDatasetSync(${datasetId}): NOT FOUND in local Map`);
      console.log(
        `   Available datasets in Map: ${
          Array.from(this.datasets.keys()).join(", ") || "none"
        }`
      );
    } else if (!dataset.polydata) {
      console.warn(`⚠️  getDatasetSync(${datasetId}): Found but NO POLYDATA`);
    } else {
      console.log(
        `✅ getDatasetSync(${datasetId}): Found with polydata (${
          dataset.polydata.getPoints()?.getNumberOfPoints() || 0
        } points)`
      );
    }

    return dataset;
  }

  /**
   * Get dataset ASYNCHRONOUSLY (loads from cache if needed)
   * Use this when you can wait for loading
   */
  async getDataset(datasetId) {
    if (this.datasets.has(datasetId)) {
      return this.datasets.get(datasetId);
    }

    await this.loadPolydataFromCache(datasetId);
    return this.datasets.get(datasetId);
  }

  /**
   * Get all datasets (metadata only)
   * Returns array with consistent field names
   */
  getAllDatasets() {
    const datasets = useDatasetStore.getState().getAllDatasets();

    return datasets.map((metadata) => {
      const localDataset = this.datasets.get(metadata.id);

      return {
        id: metadata.id,
        // ✅ FIX: Ensure consistent field names
        filename: metadata.name || metadata.filename || "Unknown",
        name: metadata.name || metadata.filename || "Unknown",
        hash: metadata.hash,
        bounds: metadata.bounds,
        pointCount: metadata.pointCount,
        cellCount: metadata.cellCount,
        sizeBytes: metadata.sizeBytes,
        uploadedBy: metadata.uploadedBy,
        uploadedByName: metadata.uploadedByName,
        uploadedAt: metadata.uploadedAt,
        publicPath: metadata.publicPath,
        // Local state flags
        hasPolydata: this.datasets.has(metadata.id) && !!localDataset?.polydata,
        isLoading: this.loadingDatasets.has(metadata.id),
      };
    });
  }

  /**
   * Remove dataset
   */
  removeDataset(datasetId) {
    this.datasets.delete(datasetId);
    useDatasetStore.getState().removeDataset(datasetId);
    yDatasets.delete(datasetId);
    this._notifyListeners();
    console.log(`🗑️ Dataset removed: ${datasetId}`);
  }

  /**
   * Listen for dataset changes
   */
  onChange(callback) {
    this.listeners.push(callback);
    return () => {
      const index = this.listeners.indexOf(callback);
      if (index > -1) this.listeners.splice(index, 1);
    };
  }

  _notifyListeners() {
    this.listeners.forEach((cb) => {
      try {
        cb();
      } catch (error) {
        console.error("Error in dataset listener:", error);
      }
    });
  }
}

export const datasetManager = new DatasetManager();
