// src/core/vr/avatars/LocalAvatarController.js
// Extracts the local user's avatar pose from VRExplorationManager frame data.
// Does NOT render anything — only produces AvatarPose objects for network sync.

import { vr as log } from '@Utils/logger.js';

const THROTTLE_MS = 50; // 20 fps, matching VRParticipantSync throttle

/**
 * Reads head and hand pose from the inputState delivered each VR frame and
 * converts it to the AvatarPose format expected by the network sync layer.
 *
 * Usage: call update(inputState) in the VR frame loop, then read getLatestPose()
 * or subscribe via onPose(callback).
 */
export class LocalAvatarController {
  constructor() {
    this._latestPose = null;
    this._poseCallbacks = [];
    this._lastEmitTime = 0;
  }

  /**
   * Process an inputState object from VRExplorationManager._gatherInputState().
   * Throttled internally to THROTTLE_MS.
   *
   * @param {object} inputState
   */
  update(inputState) {
    const now = Date.now();
    if (now - this._lastEmitTime < THROTTLE_MS) return;

    const pose = this._extractPose(inputState);
    if (!pose) return;

    this._latestPose = pose;
    this._lastEmitTime = now;

    for (const cb of this._poseCallbacks) {
      try { cb(pose); } catch (e) { log.error('LocalAvatarController pose callback error:', e); }
    }
  }

  /** @returns {import('./AvatarTypes.js').AvatarPose|null} */
  getLatestPose() {
    return this._latestPose;
  }

  /**
   * @param {function(import('./AvatarTypes.js').AvatarPose): void} callback
   * @returns {function(): void} unsubscribe
   */
  onPose(callback) {
    this._poseCallbacks.push(callback);
    return () => {
      this._poseCallbacks = this._poseCallbacks.filter((c) => c !== callback);
    };
  }

  dispose() {
    this._poseCallbacks = [];
    this._latestPose = null;
  }

  // ---------------------------------------------------------------------------

  /**
   * Convert XRRigidTransform-based inputState into a serializable AvatarPose.
   * Positions remain in WebXR local-floor space (meters).
   * RemoteAvatarController applies VR→scene transform when rendering.
   *
   * @private
   */
  _extractPose(inputState) {
    const head = this._extractLimb(inputState?.headPose, true);

    const leftController = inputState?.controllers?.left;
    const rightController = inputState?.controllers?.right;

    const leftHand = this._extractLimb(leftController?.pose, leftController != null);
    const rightHand = this._extractLimb(rightController?.pose, rightController != null);

    // Pointer ray: prefer right hand targetRay, fall back to left
    const pointerRaw = rightController?.targetRay || leftController?.targetRay;
    const pointer = this._extractPointer(pointerRaw, pointerRaw != null);

    if (!head.position) return null;

    return {
      head,
      leftHand,
      rightHand,
      pointer,
      timestamp: Date.now(),
    };
  }

  _extractLimb(transform, visible) {
    if (!transform?.position) {
      return { position: null, orientation: null, visible: false };
    }
    return {
      position: {
        x: transform.position.x,
        y: transform.position.y,
        z: transform.position.z,
      },
      orientation: transform.orientation
        ? {
            x: transform.orientation.x,
            y: transform.orientation.y,
            z: transform.orientation.z,
            w: transform.orientation.w,
          }
        : null,
      visible: !!visible,
    };
  }

  _extractPointer(transform, visible) {
    if (!transform?.position || !transform?.matrix) {
      return { origin: null, direction: null, visible: false };
    }
    // Forward direction is -Z column of the 4x4 column-major matrix
    const m = transform.matrix;
    const len = Math.sqrt(m[8] ** 2 + m[9] ** 2 + m[10] ** 2) || 1;
    return {
      origin: { x: transform.position.x, y: transform.position.y, z: transform.position.z },
      direction: { x: -m[8] / len, y: -m[9] / len, z: -m[10] / len },
      visible: !!visible,
    };
  }
}

export default LocalAvatarController;
