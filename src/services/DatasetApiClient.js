/**
 * @file DatasetApiClient.js
 * @description HTTP client for the CIA_Web Python VTK render server.
 *
 * Wraps the render server's REST endpoints for dataset listing, loading,
 * and camera control (HTTP fallback for non-WebSocket interactions).
 *
 * For interactive rendering, prefer RemoteRenderClient (WebSocket).
 * Use this for: health checks, dataset listing, one-shot frame requests.
 */

import { config } from '@Core/config/clientConfig.js';

function serverUrl(path) {
    // In dev, webpack proxies /render-api → http://localhost:7000
    return `/render-api${path}`;
}

/**
 * Check render server health.
 * @returns {Promise<{ ok, vtk_available, vtk_version, dataset_count } | null>}
 *   null if server unreachable.
 */
export async function checkServerHealth() {
    try {
        const resp = await fetch(serverUrl('/health'), { signal: AbortSignal.timeout(3000) });
        if (!resp.ok) return null;
        const data = await resp.json();
        console.log('[DatasetApiClient] server health:', data);
        return data;
    } catch {
        console.warn('[DatasetApiClient] render server unreachable');
        return null;
    }
}

/**
 * Fetch all datasets discoverable by the render server.
 * @returns {Promise<Array<{ id, name, path, type, sizeBytes, sizeMB }>>}
 */
export async function fetchDatasets() {
    const resp = await fetch(serverUrl('/datasets'));
    if (!resp.ok) throw new Error(`Datasets fetch failed: HTTP ${resp.status}`);
    const list = await resp.json();
    console.log('[DatasetApiClient] datasets returned by server:', list.map(d => d.id));
    return list;
}

/**
 * Load a dataset on the render server and receive metadata + first frame.
 *
 * @param {string} datasetId
 * @param {string} path - Absolute path on the server
 * @param {string} [sessionId] - Reuse an existing session
 * @returns {Promise<{ ok, sessionId, datasetId, metadata, camera, frame, frameWidth, frameHeight }>}
 */
export async function loadDataset(datasetId, path, sessionId = null) {
    console.log('[DatasetApiClient] POST /load:', { datasetId, path });
    const resp = await fetch(serverUrl('/load'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ datasetId, path, sessionId }),
    });
    if (!resp.ok) {
        const err = await resp.json().catch(() => ({}));
        throw new Error(err.detail || err.message || `Load failed: HTTP ${resp.status}`);
    }
    const data = await resp.json();
    console.log('[DatasetApiClient] server response metadata:', data.metadata);
    console.log('[DatasetApiClient] session ID:', data.sessionId);
    return data;
}

/**
 * Update camera and receive a new rendered frame.
 *
 * @param {string} sessionId
 * @param {{ position, focalPoint, viewUp, zoom? }} camera
 * @returns {Promise<{ ok, sessionId, camera, frame, frameWidth, frameHeight }>}
 */
export async function updateCamera(sessionId, camera) {
    const resp = await fetch(serverUrl('/camera'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId, ...camera }),
    });
    if (!resp.ok) {
        const err = await resp.json().catch(() => ({}));
        throw new Error(err.detail || err.message || `Camera update failed: HTTP ${resp.status}`);
    }
    return resp.json();
}

/**
 * Get the latest rendered PNG frame as a Blob URL.
 *
 * @param {string} sessionId
 * @returns {Promise<string>} Object URL pointing to PNG data
 */
export async function getFrameUrl(sessionId) {
    const resp = await fetch(`${serverUrl('/frame')}?sessionId=${encodeURIComponent(sessionId)}`);
    if (!resp.ok) throw new Error(`Frame fetch failed: HTTP ${resp.status}`);
    const blob = await resp.blob();
    return URL.createObjectURL(blob);
}
