// src/core/vr/avatars/AvatarTypes.js
// Shared type definitions for the VR avatar system

/**
 * @typedef {Object} AvatarUserInfo
 * @property {string} userId
 * @property {string} displayName
 * @property {string} color - CSS hex color, e.g. '#ff6b6b'
 * @property {string} [avatarUrl] - URL to a .vrm file; omit to use procedural fallback
 * @property {boolean} [isLocal] - True for the local user's own avatar
 */

/**
 * @typedef {Object} AvatarPosePoint
 * @property {number} x
 * @property {number} y
 * @property {number} z
 */

/**
 * @typedef {Object} AvatarPoseOrientation
 * @property {number} x
 * @property {number} y
 * @property {number} z
 * @property {number} w
 */

/**
 * @typedef {Object} AvatarLimbPose
 * @property {AvatarPosePoint|null} position - Position in VR floor space (meters)
 * @property {AvatarPoseOrientation|null} orientation
 * @property {boolean} visible
 */

/**
 * @typedef {Object} AvatarPointer
 * @property {AvatarPosePoint|null} origin
 * @property {AvatarPosePoint|null} direction - Unit vector
 * @property {boolean} visible
 */

/**
 * All positions are in WebXR local-floor reference space (meters, Y-up).
 * RemoteAvatarController converts to VTK scene space before rendering.
 *
 * @typedef {Object} AvatarPose
 * @property {AvatarLimbPose} head
 * @property {AvatarLimbPose} leftHand
 * @property {AvatarLimbPose} rightHand
 * @property {AvatarPointer} pointer
 * @property {number} timestamp - Date.now()
 */

/**
 * @typedef {Object} AvatarPresenceState
 * @property {AvatarUserInfo} userInfo
 * @property {AvatarPose|null} pose
 * @property {boolean} speaking
 * @property {string|null} [selectedObjectId]
 * @property {string|null} [currentTool]
 */

/**
 * Adapter interface implemented by AvatarNetworkSync.
 * Decouples AvatarManager from specific transport (Y.js, WebRTC, etc.)
 *
 * @typedef {Object} AvatarNetworkAdapter
 * @property {function(AvatarPresenceState): void} sendLocalPresence
 * @property {function(function(string, AvatarPose): void): void} onRemotePose
 * @property {function(function(string, AvatarPresenceState): void): void} onRemotePresence
 * @property {function(function(string): void): void} onRemoteLeave
 * @property {function(): void} dispose
 */
