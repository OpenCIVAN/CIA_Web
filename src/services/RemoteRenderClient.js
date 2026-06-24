/**
 * @file RemoteRenderClient.js
 * @description WebSocket client for the CIA_Web Python VTK render server.
 *
 * Manages connection, session lifecycle, dataset loading, camera updates,
 * and frame streaming. Designed as a singleton — one shared connection per tab.
 *
 * Protocol:
 *   Client → Server: loadDataset | cameraUpdate | setRepresentation | resetCamera | ping
 *   Server → Client: connected | datasetLoaded | frame | error | pong
 */

import { config } from '@Core/config/clientConfig.js';

const DEFAULT_WS_URL = '/render-ws';
const PING_INTERVAL_MS = 30_000;

class RemoteRenderClient {
    constructor() {
        this._ws = null;
        this._sessionId = null;
        this._connected = false;
        this._connecting = false;

        /** Pending promise resolvers keyed by response type */
        this._pending = new Map();
        /** Metadata received from datasetLoaded, waiting for frame */
        this._pendingMeta = null;

        this._frameCallbacks = new Set();
        this._errorCallbacks = new Set();
        this._connectWaiters = [];
        this._pingInterval = null;
    }

    get isConnected() {
        return this._connected && this._ws?.readyState === WebSocket.OPEN;
    }

    get sessionId() {
        return this._sessionId;
    }

    // =========================================================================
    // PUBLIC API
    // =========================================================================

    /**
     * Open WebSocket connection to the render server.
     * @returns {Promise<string>} Resolves with session ID.
     */
    connect() {
        console.log('[RenderMode]', config.renderMode);

        if (this.isConnected) {
            console.log('[RenderServer] already connected, session:', this._sessionId);
            return Promise.resolve(this._sessionId);
        }

        if (this._connecting) {
            return new Promise((resolve, reject) => {
                this._connectWaiters.push({ resolve, reject });
            });
        }

        this._connecting = true;
        const wsUrl = config.renderWsUrl || DEFAULT_WS_URL;
        console.log('[RenderServer] connecting to', wsUrl);

        return new Promise((resolve, reject) => {
            try {
                this._ws = new WebSocket(wsUrl);

                this._ws.onopen = () => {
                    console.log('[RenderServer] WebSocket open');
                };

                this._ws.onmessage = (ev) => this._handleMessage(ev.data);

                this._ws.onclose = (ev) => {
                    console.log('[RenderServer] WebSocket closed:', ev.code, ev.reason);
                    this._onDisconnect();
                };

                this._ws.onerror = () => {
                    console.warn('[RenderServer] WebSocket error — is the render server running?');
                    this._connecting = false;
                    const err = new Error(
                        'Render server unreachable. Start: cd server/render_server && uvicorn app:app --port 7000'
                    );
                    reject(err);
                    this._connectWaiters.forEach(w => w.reject(err));
                    this._connectWaiters = [];
                };

                // Will be resolved when 'connected' message arrives
                this._pending.set('connected', {
                    resolve: (sid) => {
                        resolve(sid);
                        this._connectWaiters.forEach(w => w.resolve(sid));
                        this._connectWaiters = [];
                    },
                    reject,
                });
            } catch (err) {
                this._connecting = false;
                reject(err);
            }
        });
    }

    disconnect() {
        this._stopPing();
        this._ws?.close();
        this._ws = null;
        this._onDisconnect();
        console.log('[RenderServer] disconnected');
    }

    /**
     * Load a dataset on the render server.
     * @param {string} datasetId  - Dataset id known to the server
     * @param {string} path       - Absolute path on the server's filesystem
     * @returns {Promise<{ metadata, image, width, height, camera }>}
     */
    async loadDataset(datasetId, path) {
        await this._ensureConnected();
        console.log('[RenderServer] loading dataset:', { id: datasetId, path });
        console.log('[RenderServer] session:', this._sessionId);

        return new Promise((resolve, reject) => {
            this._pending.set('datasetLoaded', { resolve, reject });
            this._send({ type: 'loadDataset', datasetId, path });
        });
    }

    /**
     * Send a camera update and receive a new frame.
     * @param {{ position, focalPoint, viewUp, zoom? }} camera
     * @returns {Promise<{ image, width, height, camera? }>}
     */
    async updateCamera(camera) {
        await this._ensureConnected();
        return new Promise((resolve, reject) => {
            this._pending.set('cameraFrame', { resolve, reject });
            this._send({ type: 'cameraUpdate', camera });
        });
    }

    /**
     * Reset camera to fit the loaded dataset.
     * @returns {Promise<{ image, width, height, camera }>}
     */
    async resetCamera() {
        await this._ensureConnected();
        return new Promise((resolve, reject) => {
            this._pending.set('resetFrame', { resolve, reject });
            this._send({ type: 'resetCamera' });
        });
    }

    /**
     * Change visual representation.
     * @param {'surface'|'wireframe'|'points'} representation
     */
    async setRepresentation(representation) {
        await this._ensureConnected();
        this._send({ type: 'setRepresentation', representation });
    }

    /**
     * Register a live frame callback (fires on every incoming frame).
     * @param {Function} cb - Called with { image: dataUrl, width, height, camera? }
     * @returns {Function} Unsubscribe
     */
    onFrame(cb) {
        this._frameCallbacks.add(cb);
        return () => this._frameCallbacks.delete(cb);
    }

    /**
     * Register an error callback.
     * @param {Function} cb - Called with { message, stage }
     * @returns {Function} Unsubscribe
     */
    onError(cb) {
        this._errorCallbacks.add(cb);
        return () => this._errorCallbacks.delete(cb);
    }

    // =========================================================================
    // PRIVATE
    // =========================================================================

    async _ensureConnected() {
        if (!this.isConnected) {
            await this.connect();
        }
    }

    _send(msg) {
        if (this._ws?.readyState !== WebSocket.OPEN) {
            console.warn('[RenderServer] send skipped (not connected):', msg.type);
            return;
        }
        this._ws.send(JSON.stringify(msg));
        console.log('[RenderServer] sent:', msg.type);
    }

    _handleMessage(raw) {
        let msg;
        try {
            msg = JSON.parse(raw);
        } catch {
            console.warn('[RenderServer] unparseable message:', raw);
            return;
        }

        const { type } = msg;
        console.log('[RenderServer] received:', type);

        switch (type) {
            case 'connected': {
                this._sessionId = msg.sessionId;
                this._connected = true;
                this._connecting = false;
                console.log('[RenderServer] session:', this._sessionId);
                this._startPing();
                const r = this._pending.get('connected');
                if (r) {
                    this._pending.delete('connected');
                    r.resolve(this._sessionId);
                }
                break;
            }

            case 'datasetLoaded': {
                console.log('[RenderServer] server response metadata:', msg.metadata);
                this._pendingMeta = msg;
                break;
            }

            case 'frame': {
                const dataUrl = `data:image/png;base64,${msg.image}`;
                const size = msg.image?.length ?? 0;
                console.log('[RenderServer] frame received, size:', size, 'bytes (base64)');

                const frame = {
                    image: dataUrl,
                    width: msg.width,
                    height: msg.height,
                    camera: msg.camera,
                };

                // Notify live frame subscribers
                this._frameCallbacks.forEach(cb => cb(frame));

                // Resolve datasetLoaded promise (waits for first frame)
                const loadR = this._pending.get('datasetLoaded');
                if (loadR && this._pendingMeta) {
                    this._pending.delete('datasetLoaded');
                    loadR.resolve({ ...this._pendingMeta, ...frame });
                    this._pendingMeta = null;
                }

                // Resolve camera update promise
                const camR = this._pending.get('cameraFrame');
                if (camR) {
                    this._pending.delete('cameraFrame');
                    camR.resolve(frame);
                }

                // Resolve reset promise
                const resetR = this._pending.get('resetFrame');
                if (resetR) {
                    this._pending.delete('resetFrame');
                    resetR.resolve(frame);
                }
                break;
            }

            case 'error': {
                console.warn('[RenderServer] error:', msg.message, '| stage:', msg.stage);
                this._errorCallbacks.forEach(cb => cb({ message: msg.message, stage: msg.stage }));
                // Reject all pending promises except 'connected'
                for (const [key, r] of this._pending) {
                    if (key !== 'connected') {
                        r.reject(new Error(msg.message));
                        this._pending.delete(key);
                    }
                }
                break;
            }

            case 'pong':
                break;

            default:
                console.log('[RenderServer] unknown message type:', type);
        }
    }

    _onDisconnect() {
        this._connected = false;
        this._connecting = false;
        this._sessionId = null;
        this._stopPing();
    }

    _startPing() {
        this._stopPing();
        this._pingInterval = setInterval(() => {
            if (this.isConnected) this._send({ type: 'ping' });
        }, PING_INTERVAL_MS);
    }

    _stopPing() {
        if (this._pingInterval) {
            clearInterval(this._pingInterval);
            this._pingInterval = null;
        }
    }
}

/** Singleton — one shared connection per browser tab. */
export const remoteRenderClient = new RemoteRenderClient();
export default remoteRenderClient;
