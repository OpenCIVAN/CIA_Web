// src/core/vr/avatars/RemoteAvatarController.js
// Manages a single remote user's avatar in the VR scene.
// Handles visual representation, pose interpolation, stale detection,
// and VR-space → scene-space coordinate transform.

import { vr as log } from '@Utils/logger.js';
import { SimpleAvatarFallback } from './SimpleAvatarFallback.js';
import { VRMAvatar } from './VRMAvatar.js';

const STALE_TIMEOUT_MS = 5000;
const LERP_ALPHA = 0.22; // per-frame interpolation factor at 90fps (~100ms settle)

export class RemoteAvatarController {
  /**
   * @param {import('./AvatarTypes.js').AvatarUserInfo} userInfo
   */
  constructor(userInfo) {
    this._userInfo = userInfo;
    this._renderer = null;
    this._vrContext = null; // holds vrScale and vrOrigin (mutated in place each frame)

    this._avatar = null;    // SimpleAvatarFallback or VRMAvatar
    this._usingVRM = false;

    this._targetPose = null;  // latest received pose (VR space)
    this._smoothPose = null;  // current interpolated pose (scene space)

    this._lastUpdateTime = 0;
    this._stale = false;
    this._visible = true;
  }

  /**
   * @param {object} renderer - VTK.js renderer
   * @param {object} vrContext - Reference to live vrContext from VRExplorationManager
   *   (vrContext.vrScale and vrContext.vrOrigin are updated each frame)
   */
  initialize(renderer, vrContext) {
    this._renderer = renderer;
    this._vrContext = vrContext;

    this._avatar = new SimpleAvatarFallback();
    this._avatar.create(renderer, this._userInfo);

    log.debug('RemoteAvatarController initialized for:', this._userInfo.userId);
  }

  /**
   * Receive a new pose update from the network (VR space positions).
   * @param {import('./AvatarTypes.js').AvatarPose} pose
   */
  receivePose(pose) {
    this._targetPose = pose;
    this._lastUpdateTime = Date.now();

    if (this._stale) {
      this._stale = false;
      this._avatar.setVisible(true);
    }
  }

  /**
   * Receive presence metadata (speaking state, avatarUrl, etc.)
   * @param {import('./AvatarTypes.js').AvatarPresenceState} state
   */
  receivePresence(state) {
    if (state.speaking !== undefined) {
      this._avatar.setSpeaking(!!state.speaking);
    }

    const newUrl = state.userInfo?.avatarUrl;
    if (newUrl && newUrl !== this._userInfo.avatarUrl) {
      this._userInfo = { ...this._userInfo, avatarUrl: newUrl };
      this._loadVRMAvatar(newUrl);
    }
  }

  /**
   * Called every frame by AvatarManager.
   * @param {number} deltaTime - seconds since last frame
   * @param {number[]} localHeadScenePos - [x, y, z] local user head in scene space
   */
  update(deltaTime, localHeadScenePos) {
    const now = Date.now();

    // Stale check
    if (this._lastUpdateTime && now - this._lastUpdateTime > STALE_TIMEOUT_MS) {
      if (!this._stale) {
        this._stale = true;
        this._avatar.setVisible(false);
        log.debug('RemoteAvatar stale:', this._userInfo.userId);
      }
      return;
    }

    if (!this._targetPose) return;

    // Interpolate toward target
    this._smoothPose = this._interpolate(this._smoothPose, this._targetPose, deltaTime);

    // Transform VR space → scene space
    const scenePose = this._toScenePose(this._smoothPose);

    this._avatar.updatePose(scenePose);

    // Orient label to face local user
    if (localHeadScenePos) {
      this._avatar.faceLabelToward(...localHeadScenePos);
    }
  }

  /**
   * Switch to a VRM avatar from a URL.
   * Falls back to SimpleAvatarFallback on failure.
   * @param {string} url
   */
  async _loadVRMAvatar(url) {
    if (this._usingVRM) return;

    const vrm = new VRMAvatar();
    vrm.onFail((err) => {
      log.warn('VRM load failed for remote user, keeping fallback:', err.message);
      vrm.dispose(this._renderer);
    });
    vrm.onLoad(() => {
      // Swap out the fallback
      this._avatar.dispose(this._renderer);
      this._avatar = vrm;
      this._usingVRM = true;
    });

    await vrm.load(url, this._userInfo, this._renderer);
  }

  dispose() {
    this._avatar?.dispose(this._renderer);
    this._avatar = null;
  }

  // ---------------------------------------------------------------------------

  /**
   * Lerp position, slerp orientation toward target.
   * @private
   */
  _interpolate(current, target, deltaTime) {
    if (!current) return this._clonePose(target);

    const alpha = Math.min(1, LERP_ALPHA + deltaTime * 3);

    return {
      head: this._interpLimb(current.head, target.head, alpha),
      leftHand: this._interpLimb(current.leftHand, target.leftHand, alpha),
      rightHand: this._interpLimb(current.rightHand, target.rightHand, alpha),
      pointer: target.pointer, // don't interpolate pointer — snappy is better
      timestamp: target.timestamp,
    };
  }

  _interpLimb(cur, tgt, alpha) {
    if (!cur?.position || !tgt?.position) return tgt;
    return {
      position: this._lerpVec3(cur.position, tgt.position, alpha),
      orientation: cur.orientation && tgt.orientation
        ? this._slerpQuat(cur.orientation, tgt.orientation, alpha)
        : tgt.orientation,
      visible: tgt.visible,
    };
  }

  _lerpVec3(a, b, t) {
    return {
      x: a.x + (b.x - a.x) * t,
      y: a.y + (b.y - a.y) * t,
      z: a.z + (b.z - a.z) * t,
    };
  }

  _slerpQuat(a, b, t) {
    let dot = a.x * b.x + a.y * b.y + a.z * b.z + a.w * b.w;
    // Ensure shortest path
    const bFlip = dot < 0 ? { x: -b.x, y: -b.y, z: -b.z, w: -b.w } : b;
    dot = Math.abs(dot);

    if (dot > 0.9995) {
      // Very close — linear is fine
      return this._normalizeQuat({
        x: a.x + (bFlip.x - a.x) * t,
        y: a.y + (bFlip.y - a.y) * t,
        z: a.z + (bFlip.z - a.z) * t,
        w: a.w + (bFlip.w - a.w) * t,
      });
    }

    const theta0 = Math.acos(dot);
    const theta = theta0 * t;
    const sinTheta = Math.sin(theta);
    const sinTheta0 = Math.sin(theta0);
    const s0 = Math.cos(theta) - (dot * sinTheta) / sinTheta0;
    const s1 = sinTheta / sinTheta0;

    return {
      x: a.x * s0 + bFlip.x * s1,
      y: a.y * s0 + bFlip.y * s1,
      z: a.z * s0 + bFlip.z * s1,
      w: a.w * s0 + bFlip.w * s1,
    };
  }

  _normalizeQuat(q) {
    const len = Math.sqrt(q.x ** 2 + q.y ** 2 + q.z ** 2 + q.w ** 2) || 1;
    return { x: q.x / len, y: q.y / len, z: q.z / len, w: q.w / len };
  }

  /**
   * Convert a pose from WebXR local-floor space (meters) to VTK scene space.
   * Uses vrContext.vrScale and vrContext.vrOrigin (updated live by VRExplorationManager).
   * @private
   */
  _toScenePose(pose) {
    if (!pose) return null;
    const { vrScale = 1, vrOrigin = [0, 0, 0] } = this._vrContext || {};

    const toScene = (p) =>
      p
        ? {
            x: p.x / vrScale + vrOrigin[0],
            y: p.y / vrScale + vrOrigin[1],
            z: p.z / vrScale + vrOrigin[2],
          }
        : null;

    const toSceneLimb = (limb) =>
      limb
        ? { ...limb, position: toScene(limb.position) }
        : null;

    const toScenePointer = (ptr) => {
      if (!ptr) return null;
      return {
        ...ptr,
        origin: toScene(ptr.origin),
        // direction is a unit vector — no translation/scale needed
        direction: ptr.direction,
      };
    };

    return {
      head: toSceneLimb(pose.head),
      leftHand: toSceneLimb(pose.leftHand),
      rightHand: toSceneLimb(pose.rightHand),
      pointer: toScenePointer(pose.pointer),
      timestamp: pose.timestamp,
    };
  }

  _clonePose(pose) {
    return JSON.parse(JSON.stringify(pose));
  }
}

export default RemoteAvatarController;
