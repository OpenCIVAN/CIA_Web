// src/core/config/storage.js
import { config } from "@Core/config/clientConfig.js";
export { logStorageConfig } from "@Core/config/clientConfig.js";
import { ServerStorageProvider } from "@Core/data/providers/ServerStorageProvider.js";
import { DatasetManagerAdapter } from "@Core/data/managers/DatasetManagerAdapter.js";
import { dataCache } from "@Services/storage/dataCache.js";
import { files as log } from "@Utils/logger.js";

/**
 * Initialize storage provider with automatic fallback
 *
 * This function implements the storage initialization strategy:
 * 1. If USE_SERVER_STORAGE is true, try to connect to the server
 * 2. If server connection fails OR USE_SERVER_STORAGE is false, use local storage
 * 3. Return both the provider and what mode we're in
 *
 * The automatic fallback ensures the app can work even if the server is down,
 * providing graceful degradation from full server functionality to local-only mode.
 *
 * @returns {Promise<{provider: StorageProvider, mode: string}>}
 */
export async function initializeStorageProvider() {
  if (config.use) {
    log.debug("Creating server storage provider...");
    const provider = new ServerStorageProvider(
      config.apiBaseUrl,
      config.defaultSessionId
    );

    try {
      await provider.initialize();
      log.debug("Server storage provider ready");
      return { provider, mode: "server" };
    } catch (error) {
      log.warn("Server storage provider failed:", error.message);
      log.warn("Falling back to local storage...");
      // Fall through to local storage initialization below
    }
  }

  // Either USE_SERVER_STORAGE is false, or server initialization failed
  log.debug("Creating local storage adapter...");

  // Initialize the data cache if needed
  if (dataCache && typeof dataCache.initialize === "function") {
    await dataCache.initialize();
  }

  const provider = new DatasetManagerAdapter(dataCache);
  await provider.initialize();
  log.debug("Local storage provider ready");

  return { provider, mode: "local" };
}
