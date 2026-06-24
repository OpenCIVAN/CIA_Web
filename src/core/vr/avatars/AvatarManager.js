// src/core/vr/avatars/AvatarManager.js
// Central coordinator for the VR avatar subsystem.
//
// One instance is created per VR exploration session and disposed when the
// session ends. VRExplorationManager drives the lifecycle.

import { vr as log } from '@Utils/logger.js';
import { getUserId, getUserName, getUserColor } from '@Collaboration/presence/userManagement.js';
import { LocalAvatarController } from './LocalAvatarController.js';
import { RemoteAvatarController } from './RemoteAvatarController.js';
import { AvatarNetworkSync } from './AvatarNetworkSync.js';
import { VRMAvatar } from './VRMAvatar.js';

export class AvatarManager {
  constructor() {
    this._renderer = null;
    this._session = null;
    this._vrContext = null;

    this._localController = new LocalAvatarController();
    this._networkSync = new AvatarNetworkSync();
    this._remotes = new Map(); // userId -> RemoteAvatarController

    this._localUserInfo = null;
    this._localAvatarUrl = null;
    this._enabled = true;
  }

  // ===========================================================================
  // PUBLIC API
  // ===========================================================================

  /**
   * Initialize the avatar system for an active VR session.
   *
   * @param {object} renderer - VTK.js renderer (from vrContext.sceneObjects.renderer)
   * @param {object} session - VRExplorationSession
   * @param {object} vrContext - Live vrContext from VRExplorationManager
   *   (vrContext.vrScale and vrContext.vrOrigin are updated in-place each frame)
   */
  initialize(renderer, session, vrContext) {
    this._renderer = renderer;
    this._session = session;
    this._vrContext = vrContext;

    this._localUserInfo = {
      userId: getUserId(),
      displayName: getUserName(),
      color: getUserColor(),
      avatarUrl: this._localAvatarUrl,
      isLocal: true,
    };

    // Wire network sync callbacks
    this._networkSync.onRemotePose((userId, pose) => this._onRemotePose(userId, pose));
    this._networkSync.onRemotePresence((userId, state) => this._onRemotePresence(userId, state));
    this._networkSync.onRemoteLeave((userId) => this.removeRemoteUser(userId));
    this._networkSync.initialize();

    // Broadcast local metadata so remotes can show our name/color/url
    this._networkSync.sendLocalPresence({
      displayName: this._localUserInfo.displayName,
      color: this._localUserInfo.color,
      avatarUrl: this._localAvatarUrl,
    });

    // Add any participants that were already in the session when we joined
    if (session?.getParticipants) {
      for (const p of session.getParticipants()) {
        if (p.odUserId !== this._localUserInfo.userId) {
          this.addRemoteUser({
            userId: p.odUserId,
            displayName: p.userName,
            color: p.userColor,
          });
        }
      }
    }

    log.info('AvatarManager initialized for session:', session?.id);
  }

  /**
   * Update avatars for the current frame.
   * Called by VRExplorationManager._onFrame() after gathering inputState.
   *
   * @param {number} deltaTime - seconds since last frame
   * @param {object} inputState - from VRExplorationManager._gatherInputState()
   */
  update(deltaTime, inputState) {
    if (!this._enabled) return;

    // Extract and throttle local pose
    this._localController.update(inputState);

    // Compute local head position in scene space for label orientation
    const localPose = this._localController.getLatestPose();
    let localHeadScene = null;
    if (localPose?.head?.position) {
      const { x, y, z } = localPose.head.position;
      const { vrScale = 1, vrOrigin = [0, 0, 0] } = this._vrContext || {};
      localHeadScene = [
        x / vrScale + vrOrigin[0],
        y / vrScale + vrOrigin[1],
        z / vrScale + vrOrigin[2],
      ];
    }

    // Update all remote avatars
    for (const remote of this._remotes.values()) {
      remote.update(deltaTime, localHeadScene);
    }
  }

  /**
   * Set the local user's VRM avatar URL.
   * Pass null to revert to procedural fallback.
   * @param {string|null} url
   */
  setLocalAvatarUrl(url) {
    this._localAvatarUrl = url;
    if (this._localUserInfo) {
      this._localUserInfo.avatarUrl = url;
      this._networkSync.sendLocalPresence({
        displayName: this._localUserInfo.displayName,
        color: this._localUserInfo.color,
        avatarUrl: url,
      });
    }
  }

  /**
   * @param {import('./AvatarTypes.js').AvatarUserInfo} userInfo
   */
  addRemoteUser(userInfo) {
    if (this._remotes.has(userInfo.userId)) return;

    const controller = new RemoteAvatarController(userInfo);
    controller.initialize(this._renderer, this._vrContext);
    this._remotes.set(userInfo.userId, controller);

    log.debug('Remote avatar added:', userInfo.userId, userInfo.displayName);
  }

  /**
   * @param {string} userId
   */
  removeRemoteUser(userId) {
    const controller = this._remotes.get(userId);
    if (!controller) return;
    controller.dispose();
    this._remotes.delete(userId);
    log.debug('Remote avatar removed:', userId);
  }

  setEnabled(enabled) {
    this._enabled = enabled;
    for (const remote of this._remotes.values()) {
      remote._avatar?.setVisible(enabled);
    }
  }

  dispose() {
    for (const remote of this._remotes.values()) remote.dispose();
    this._remotes.clear();
    this._localController.dispose();
    this._networkSync.dispose();
    this._renderer = null;
    this._session = null;
    this._vrContext = null;
    log.debug('AvatarManager disposed');
  }

  // ===========================================================================
  // PRIVATE
  // ===========================================================================

  _onRemotePose(userId, pose) {
    let controller = this._remotes.get(userId);
    if (!controller) {
      // Auto-create avatar for new remote user (metadata arrives later via yAvatars)
      controller = new RemoteAvatarController({
        userId,
        displayName: userId.slice(0, 8),
        color: '#888888',
      });
      controller.initialize(this._renderer, this._vrContext);
      this._remotes.set(userId, controller);
    }
    controller.receivePose(pose);
  }

  _onRemotePresence(userId, data) {
    let controller = this._remotes.get(userId);
    if (!controller) {
      this.addRemoteUser({
        userId,
        displayName: data.displayName || userId.slice(0, 8),
        color: data.color || '#888888',
        avatarUrl: data.avatarUrl || null,
      });
      controller = this._remotes.get(userId);
    }

    controller?.receivePresence({
      userInfo: {
        userId,
        displayName: data.displayName,
        color: data.color,
        avatarUrl: data.avatarUrl,
      },
      speaking: data.isSpeaking || false,
    });
  }
}

export default AvatarManager;
