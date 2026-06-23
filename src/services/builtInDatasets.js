// src/services/builtInDatasets.js
// Loads the built-in VTP sample dataset manifest from public/vtp_files/manifest.json
// and registers each entry with DatasetManager so the app always shows them.
//
// Called non-blocking during Phase 1 init — a manifest failure never blocks startup.

import { dataset as log } from '@Utils/logger.js';

const MANIFEST_URL = '/vtp_files/manifest.json';

/**
 * Fetch the built-in dataset manifest and register each entry with DatasetManager.
 *
 * @param {import('@Core/data/managers/DatasetManager').DatasetManager} datasetManager
 * @returns {Promise<number>} Number of datasets registered
 */
export async function loadBuiltInDatasets(datasetManager) {
  if (!datasetManager) {
    log.warn('builtInDatasets: DatasetManager not ready, skipping');
    return 0;
  }

  let manifest;
  try {
    const res = await fetch(MANIFEST_URL);
    if (!res.ok) {
      throw new Error(`HTTP ${res.status} ${res.statusText}`);
    }
    manifest = await res.json();
  } catch (err) {
    log.warn(`builtInDatasets: Failed to load manifest (${MANIFEST_URL}):`, err.message);
    // Emit a non-fatal app event so UI can show a soft warning
    window.dispatchEvent(
      new CustomEvent('cia:builtin-datasets-unavailable', {
        detail: { reason: err.message },
      })
    );
    return 0;
  }

  if (!Array.isArray(manifest)) {
    log.warn('builtInDatasets: manifest.json is not an array — skipping');
    return 0;
  }

  let count = 0;
  for (const entry of manifest) {
    if (!entry.id || !entry.path) {
      log.warn('builtInDatasets: Skipping malformed manifest entry:', entry);
      continue;
    }
    try {
      datasetManager.addBuiltInDataset(entry);
      count++;
    } catch (err) {
      log.warn(`builtInDatasets: Failed to register "${entry.name}":`, err.message);
    }
  }

  log.info(`builtInDatasets: Registered ${count} built-in dataset(s)`);
  return count;
}
