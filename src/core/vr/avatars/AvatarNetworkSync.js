// src/core/vr/avatars/AvatarNetworkSync.js
// Y.js adapter for the avatar system.
//
// RESPONSIBILITIES:
// - Metadata sync (avatarUrl, isSpeaking, displayName, color) via yAvatars map
// - Remote pose reception via cia:vr-participant-update custom event
//   (pose is already sent by VRParticipantSync — do NOT duplicate that path)
// - Remote leave detection via cia:vr-participant-left custom event
//
// What this does NOT do:
// - Send pose data (VRParticipantSync owns that)
// - Create Y.js maps (yjsSetup.js owns that)

import { vr as log } from '@Utils/logger.js';
import {
  yAvatars,
  syncAvatarToYjs,
} from '@Collaboration/yjs/yjsSetup.js';
import { getUserId } from '@Collaboration/presence/userManagement.js';

export class AvatarNetworkSync {
  constructor() {
    this._remotePoseCb = null;
    this._remotePresenceCb = null;
    this._remoteLeaveCb = null;

    this._yjsObserverCleanup = null;
    this._updateEventHandler = null;
    this._leaveEventHandler = null;

    this._localUserId = null;
    this._lastSentPresence = null;
  }

  /**
   * Start listening for remote avatar events.
   */
  initialize() {
    this._localUserId = getUserId();

    // Remote POSE updates arrive as custom window events dispatched by VRParticipantSync
    this._updateEventHandler = (e) => this._onParticipantUpdate(e.detail);
    this._leaveEventHandler = (e) => this._onParticipantLeft(e.detail);
    window.addEventListener('cia:vr-participant-update', this._updateEventHandler);
    window.addEventListener('cia:vr-participant-left', this._leaveEventHandler);

    // Remote PRESENCE (metadata) via Y.js avatar map
    const observer = (event) => {
      const myId = this._localUserId;
      event.changes.keys.forEach((change, userId) => {
        if (userId === myId) return;
        const data = yAvatars.get(userId);
        if (!data) return;
        try {
          this._remotePresenceCb?.(userId, data);
        } catch (err) {
          log.error('AvatarNetworkSync presence callback error:', err);
        }
      });
    };
    yAvatars.observe(observer);
    this._yjsObserverCleanup = () => yAvatars.unobserve(observer);

    log.debug('AvatarNetworkSync initialized');
  }

  /**
   * Broadcast local user avatar metadata (not pose).
   * @param {{ avatarUrl?: string, displayName: string, color: string, isSpeaking?: boolean }} state
   */
  sendLocalPresence(state) {
    const userId = this._localUserId;
    if (!userId) return;

    // Skip if nothing changed
    const serialized = JSON.stringify(state);
    if (serialized === this._lastSentPresence) return;
    this._lastSentPresence = serialized;

    syncAvatarToYjs(userId, {
      displayName: state.displayName,
      color: state.color,
      avatarUrl: state.avatarUrl || null,
      isSpeaking: state.isSpeaking || false,
    });
  }

  /**
   * Register callback for remote pose updates.
   * @param {function(string, import('./AvatarTypes.js').AvatarPose): void} callback
   */
  onRemotePose(callback) {
    this._remotePoseCb = callback;
  }

  /**
   * Register callback for remote presence/metadata updates.
   * @param {function(string, object): void} callback
   */
  onRemotePresence(callback) {
    this._remotePresenceCb = callback;
  }

  /**
   * Register callback for when a remote user leaves.
   * @param {function(string): void} callback
   */
  onRemoteLeave(callback) {
    this._remoteLeaveCb = callback;
  }

  dispose() {
    window.removeEventListener('cia:vr-participant-update', this._updateEventHandler);
    window.removeEventListener('cia:vr-participant-left', this._leaveEventHandler);
    this._yjsObserverCleanup?.();
    this._remotePoseCb = null;
    this._remotePresenceCb = null;
    this._remoteLeaveCb = null;
    this._lastSentPresence = null;
    log.debug('AvatarNetworkSync disposed');
  }

  // ---------------------------------------------------------------------------

  _onParticipantUpdate(detail) {
    const userId = detail?.odUserId;
    if (!userId || userId === this._localUserId) return;

    const data = detail?.data;
    if (!data) return;

    // Reconstruct AvatarPose from VRParticipantSync serialized format
    const pose = this._toPose(data);
    if (pose) {
      try {
        this._remotePoseCb?.(userId, pose);
      } catch (err) {
        log.error('AvatarNetworkSync pose callback error:', err);
      }
    }
  }

  _onParticipantLeft(detail) {
    const userId = detail?.odUserId;
    if (!userId || userId === this._localUserId) return;
    try {
      this._remoteLeaveCb?.(userId);
    } catch (err) {
      log.error('AvatarNetworkSync leave callback error:', err);
    }
  }

  /**
   * Convert VRParticipantSync serialized data to AvatarPose.
   * @private
   */
  _toPose(data) {
    if (!data.headPose?.position) return null;

    const toLimb = (p, visible) => ({
      position: p?.position || null,
      orientation: p?.orientation || null,
      visible: !!(visible && p?.position),
    });

    return {
      head: toLimb(data.headPose, true),
      leftHand: toLimb(data.leftHandPose, true),
      rightHand: toLimb(data.rightHandPose, true),
      pointer: { origin: null, direction: null, visible: false },
      timestamp: data.timestamp || Date.now(),
    };
  }
}

export default AvatarNetworkSync;
