/**
 * @file LocalVtkFallbackRenderer.js
 * @description Thin wrapper for hybrid rendering mode.
 *
 * In RENDER_MODE=hybrid, attempts to use the Python VTK render server first.
 * If the server is unreachable or returns an error, falls back to the existing
 * client-side VTK.js path via VTKInstanceHandler.
 *
 * Usage (hybrid mode only — other modes use dedicated paths):
 *
 *   import { LocalVtkFallbackRenderer } from '@/rendering/LocalVtkFallbackRenderer.js';
 *   const renderer = new LocalVtkFallbackRenderer();
 *   const { mode } = await renderer.tryLoad(datasetId, path, container);
 *   // mode === 'server' | 'local'
 */

import remoteRenderClient from '@Services/RemoteRenderClient.js';
import { config } from '@Core/config/clientConfig.js';

/** How long to wait for a server health check before falling back (ms). */
const SERVER_PROBE_TIMEOUT_MS = 3000;

/**
 * Probe whether the render server is reachable.
 * @returns {Promise<boolean>}
 */
export async function probeRenderServer() {
    const serverUrl = config.renderServerUrl || 'http://localhost:7001';
    const healthUrl = `${serverUrl}/health`;

    try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), SERVER_PROBE_TIMEOUT_MS);

        const resp = await fetch(healthUrl, { signal: controller.signal });
        clearTimeout(timeout);

        if (resp.ok) {
            const data = await resp.json();
            console.log('[RenderServer] health check OK:', data.vtk_version);
            return true;
        }
        return false;
    } catch {
        console.warn('[RenderServer] health check failed — server may be offline');
        return false;
    }
}

/**
 * Fetch the server dataset list for the UI.
 * Returns empty array if server is unreachable.
 * @returns {Promise<Array<{ id, name, path, type, sizeBytes, sizeMB }>>}
 */
export async function fetchServerDatasets() {
    const serverUrl = config.renderServerUrl || 'http://localhost:7001';

    try {
        const resp = await fetch(`${serverUrl}/datasets`);
        if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
        const datasets = await resp.json();
        console.log('[RenderServer] server datasets:', datasets.map(d => d.id));
        return datasets;
    } catch (err) {
        console.warn('[RenderServer] could not fetch dataset list:', err.message);
        return [];
    }
}
