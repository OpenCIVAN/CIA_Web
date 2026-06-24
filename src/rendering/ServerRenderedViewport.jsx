/**
 * @file ServerRenderedViewport.jsx
 * @description React component that displays server-rendered VTK frames.
 *
 * Shows an <img> element updated with PNG frames from the Python VTK render server.
 * Translates mouse/wheel events into camera commands sent to the server.
 *
 * Props:
 *   datasetId {string}  - Dataset ID known to the render server
 *   path      {string}  - Server-side absolute path to the dataset file
 *   fileType  {string}  - 'vtp' | 'vtu' | 'vti'
 *   onClose   {Function} - Optional close handler
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import remoteRenderClient from '@Services/RemoteRenderClient.js';
import { config } from '@Core/config/clientConfig.js';
import './ServerRenderedViewport.scss';

export function ServerRenderedViewport({ datasetId, path, fileType, onClose }) {
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [offline, setOffline] = useState(false);
    const [frameUrl, setFrameUrl] = useState(null);
    const [metadata, setMetadata] = useState(null);
    const [cameraState, setCameraState] = useState(null);

    const dragRef = useRef({ active: false, lastX: 0, lastY: 0, button: 0 });
    const cameraRef = useRef(null); // mirror of cameraState for callbacks
    const pendingUpdate = useRef(false);

    // =========================================================================
    // MOUNT: Load dataset
    // =========================================================================

    useEffect(() => {
        let cancelled = false;

        console.log('[RenderMode]', config.renderMode);
        console.log('[RenderServer] ServerRenderedViewport mounting:', { datasetId, path, fileType });

        async function load() {
            setLoading(true);
            setError(null);
            setOffline(false);

            try {
                console.log('[RenderServer] loading dataset:', { id: datasetId, path });
                const result = await remoteRenderClient.loadDataset(datasetId, path);
                if (cancelled) return;

                console.log('[RenderServer] server response metadata:', result.metadata);
                console.log('[RenderServer] frame received, size:', result.image?.length ?? 0, 'bytes');

                setMetadata(result.metadata);
                setCameraState(result.camera);
                cameraRef.current = result.camera;
                setFrameUrl(result.image);
                setLoading(false);

            } catch (err) {
                if (cancelled) return;
                console.warn('[RenderServer] error:', err.message);
                const isOffline = err.message?.includes('unreachable') ||
                    err.message?.includes('not available');
                setError(err.message || 'Failed to connect to render server');
                setOffline(isOffline);
                setLoading(false);
            }
        }

        load();

        const unsubFrame = remoteRenderClient.onFrame((frame) => {
            if (!cancelled) {
                setFrameUrl(frame.image);
                if (frame.camera) {
                    setCameraState(frame.camera);
                    cameraRef.current = frame.camera;
                }
            }
        });

        const unsubError = remoteRenderClient.onError(({ message }) => {
            if (!cancelled) setError(message);
        });

        return () => {
            cancelled = true;
            unsubFrame();
            unsubError();
        };
    }, [datasetId, path]);

    // =========================================================================
    // CAMERA MATH
    // =========================================================================

    const computeOrbit = useCallback((dx, dy) => {
        const cam = cameraRef.current;
        if (!cam) return null;

        const { position, focalPoint, viewUp } = cam;
        const fx = position[0] - focalPoint[0];
        const fy = position[1] - focalPoint[1];
        const fz = position[2] - focalPoint[2];
        const dist = Math.sqrt(fx * fx + fy * fy + fz * fz);
        if (dist < 1e-10) return null;

        const sens = 0.005;
        const cosAz = Math.cos(-dx * sens);
        const sinAz = Math.sin(-dx * sens);
        const cosEl = Math.cos(-dy * sens);
        const sinEl = Math.sin(-dy * sens);

        // Horizontal rotation around viewUp
        const up = viewUp ?? [0, 1, 0];
        const nx1 = fx * cosAz + (up[1] * fz - up[2] * fy) * sinAz;
        const ny1 = fy * cosAz + (up[2] * fx - up[0] * fz) * sinAz;
        const nz1 = fz * cosAz + (up[0] * fy - up[1] * fx) * sinAz;

        // Right vector (cross of viewDir and up)
        const vl = [fx / dist, fy / dist, fz / dist];
        const right = [
            up[1] * vl[2] - up[2] * vl[1],
            up[2] * vl[0] - up[0] * vl[2],
            up[0] * vl[1] - up[1] * vl[0],
        ];
        const rl = Math.sqrt(right[0] ** 2 + right[1] ** 2 + right[2] ** 2) || 1;
        const rn = right.map(v => v / rl);

        // Vertical rotation around right vector
        const nx2 = nx1 * cosEl + (rn[1] * nz1 - rn[2] * ny1) * sinEl;
        const ny2 = ny1 * cosEl + (rn[2] * nx1 - rn[0] * nz1) * sinEl;
        const nz2 = nz1 * cosEl + (rn[0] * ny1 - rn[1] * nx1) * sinEl;

        return {
            position: [focalPoint[0] + nx2, focalPoint[1] + ny2, focalPoint[2] + nz2],
            focalPoint,
            viewUp: up,
        };
    }, []);

    const computePan = useCallback((dx, dy) => {
        const cam = cameraRef.current;
        if (!cam) return null;

        const { position, focalPoint, viewUp } = cam;
        const fx = position[0] - focalPoint[0];
        const fy = position[1] - focalPoint[1];
        const fz = position[2] - focalPoint[2];
        const dist = Math.sqrt(fx * fx + fy * fy + fz * fz);
        const panSpeed = dist * 0.001;
        const up = viewUp ?? [0, 1, 0];

        const norm = [fx / dist, fy / dist, fz / dist];
        const right = [
            up[1] * norm[2] - up[2] * norm[1],
            up[2] * norm[0] - up[0] * norm[2],
            up[0] * norm[1] - up[1] * norm[0],
        ];
        const rl = Math.sqrt(right[0] ** 2 + right[1] ** 2 + right[2] ** 2) || 1;

        const offX = -dx * panSpeed;
        const offY = dy * panSpeed;

        const shift = [
            right[0] / rl * offX + up[0] * offY,
            right[1] / rl * offX + up[1] * offY,
            right[2] / rl * offX + up[2] * offY,
        ];

        return {
            position: position.map((v, i) => v + shift[i]),
            focalPoint: focalPoint.map((v, i) => v + shift[i]),
            viewUp: up,
        };
    }, []);

    // =========================================================================
    // MOUSE HANDLERS
    // =========================================================================

    const handleMouseDown = useCallback((e) => {
        e.preventDefault();
        dragRef.current = { active: true, lastX: e.clientX, lastY: e.clientY, button: e.button };
    }, []);

    const handleMouseMove = useCallback(async (e) => {
        if (!dragRef.current.active || pendingUpdate.current || !frameUrl) return;

        const dx = e.clientX - dragRef.current.lastX;
        const dy = e.clientY - dragRef.current.lastY;
        dragRef.current.lastX = e.clientX;
        dragRef.current.lastY = e.clientY;

        if (Math.abs(dx) < 1 && Math.abs(dy) < 1) return;

        const newCam = dragRef.current.button === 2
            ? computePan(dx, dy)
            : computeOrbit(dx, dy);

        if (!newCam) return;

        pendingUpdate.current = true;
        try {
            await remoteRenderClient.updateCamera(newCam);
            cameraRef.current = { ...cameraRef.current, ...newCam };
        } catch (err) {
            console.warn('[RenderServer] camera update failed:', err.message);
        } finally {
            pendingUpdate.current = false;
        }
    }, [frameUrl, computeOrbit, computePan]);

    const handleMouseUp = useCallback(() => {
        dragRef.current.active = false;
    }, []);

    const handleWheel = useCallback(async (e) => {
        e.preventDefault();
        if (!cameraRef.current || pendingUpdate.current) return;

        const { position, focalPoint, viewUp } = cameraRef.current;
        const factor = e.deltaY > 0 ? 1.1 : 0.9;
        const newPos = position.map((v, i) => focalPoint[i] + (v - focalPoint[i]) * factor);
        const newCam = { position: newPos, focalPoint, viewUp: viewUp ?? [0, 1, 0] };

        pendingUpdate.current = true;
        try {
            await remoteRenderClient.updateCamera(newCam);
            cameraRef.current = { ...cameraRef.current, ...newCam };
        } catch (err) {
            console.warn('[RenderServer] zoom failed:', err.message);
        } finally {
            pendingUpdate.current = false;
        }
    }, []);

    const handleResetCamera = useCallback(async () => {
        try {
            await remoteRenderClient.resetCamera();
        } catch (err) {
            console.warn('[RenderServer] reset camera failed:', err.message);
        }
    }, []);

    const handleContextMenu = useCallback(e => e.preventDefault(), []);

    // =========================================================================
    // RENDER
    // =========================================================================

    if (offline) {
        return (
            <div className="srv-vp srv-vp--offline">
                <div className="srv-vp__message">
                    <div className="srv-vp__message-icon">⚠</div>
                    <strong>Rendering server is not available.</strong>
                    <p>Start the backend server or switch to local rendering mode.</p>
                    <code>cd server/render_server &amp;&amp; uvicorn app:app --port 7000</code>
                    {error && <p className="srv-vp__error-detail">{error}</p>}
                </div>
            </div>
        );
    }

    return (
        <div
            className="srv-vp"
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            onWheel={handleWheel}
            onContextMenu={handleContextMenu}
        >
            {/* Toolbar */}
            <div className="srv-vp__toolbar">
                <span className="srv-vp__badge">
                    {fileType?.toUpperCase() || 'VTK'} · Server
                </span>
                <button className="srv-vp__btn" onClick={handleResetCamera} title="Reset camera">
                    ⟳
                </button>
                {onClose && (
                    <button
                        className="srv-vp__btn srv-vp__btn--close"
                        onClick={onClose}
                        title="Close"
                    >
                        ✕
                    </button>
                )}
            </div>

            {/* Loading state */}
            {loading && (
                <div className="srv-vp__loading">
                    <div className="srv-vp__spinner" />
                    <span>Loading {datasetId} on server…</span>
                </div>
            )}

            {/* Error state */}
            {error && !loading && !frameUrl && (
                <div className="srv-vp__error">
                    <span>⚠ {error}</span>
                </div>
            )}

            {/* Server-rendered frame */}
            {frameUrl && (
                <img
                    src={frameUrl}
                    alt={`Server-rendered: ${datasetId}`}
                    className="srv-vp__frame"
                    draggable={false}
                />
            )}

            {/* Metadata overlay */}
            {metadata && !loading && (
                <div className="srv-vp__meta">
                    {metadata.pointCount?.toLocaleString()} pts
                    {metadata.cellCount > 0 && ` · ${metadata.cellCount.toLocaleString()} cells`}
                </div>
            )}
        </div>
    );
}

export default ServerRenderedViewport;
