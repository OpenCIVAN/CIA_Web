// src/core/instances/types/vtk/vr/VTKVRAvatars.js
// Thin adapter between VRExplorationManager and the AvatarManager.
// VRExplorationManager calls initialize/update/dispose on this singleton.

import { vr as log } from '@Utils/logger.js';
import { AvatarManager } from '@Core/vr/avatars/AvatarManager.js';

class VRAvatarSystem {
  constructor() {
    this._manager = null;
  }

  /**
   * @param {object} renderer - VTK.js renderer
   * @param {object} session - VRExplorationSession
   * @param {object} vrContext - Live vrContext (vrScale/vrOrigin mutated in-place)
   */
  initialize(renderer, session, vrContext) {
    if (this._manager) {
      log.warn('VRAvatarSystem already initialized — disposing previous session');
      this._manager.dispose();
    }
    this._manager = new AvatarManager();
    this._manager.initialize(renderer, session, vrContext);
    log.info('VRAvatarSystem initialized');
  }

  /**
   * @param {number} deltaTime - seconds since last frame
   * @param {object} inputState - from VRExplorationManager._gatherInputState()
   */
  update(deltaTime, inputState) {
    this._manager?.update(deltaTime, inputState);
  }

  /** Enable or disable avatar rendering without disposing the session. */
  setEnabled(enabled) {
    this._manager?.setEnabled(enabled);
  }

  /**
   * Set the local user's VRM avatar URL.
   * @param {string|null} url
   */
  setLocalAvatarUrl(url) {
    this._manager?.setLocalAvatarUrl(url);
  }

  dispose() {
    this._manager?.dispose();
    this._manager = null;
    log.debug('VRAvatarSystem disposed');
  }
}

export const vrAvatarSystem = new VRAvatarSystem();
export default vrAvatarSystem;
