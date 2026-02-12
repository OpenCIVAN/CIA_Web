/**
 * @file canvasLockService.js
 * @description Client-side service for managing canvas edit locks.
 *
 * Communicates with the server lock endpoints (POST/GET/PUT/DELETE /api/canvases/:id/lock)
 * to acquire, extend, release, and query canvas locks for transactional editing.
 *
 * @example
 * import { canvasLockService } from '@Services/canvasLockService';
 *
 * const lock = await canvasLockService.acquire(canvasId, { userName: 'Alice' });
 * // ... editing ...
 * await canvasLockService.release(canvasId);
 */

import { apiClient, ApiError } from "@Services/apiClient.js";

/**
 * @typedef {Object} LockInfo
 * @property {string} id - Lock UUID
 * @property {string} canvasId - Canvas UUID
 * @property {string} lockedBy - User UUID who holds the lock
 * @property {string} lockedByName - Display name of lock holder
 * @property {string} expiresAt - ISO timestamp when lock expires
 * @property {number} timeRemaining - Seconds remaining
 * @property {number} extendCount - How many times the lock has been extended
 * @property {boolean} [reused] - True if the server returned an existing lock for this user
 */

/**
 * Canvas lock service — communicates with server lock endpoints.
 */
export const canvasLockService = {
  /**
   * Get the current lock status for a canvas.
   * @param {string} canvasId
   * @returns {Promise<{ locked: boolean, lock: LockInfo|null }>}
   */
  async getStatus(canvasId) {
    return apiClient.get(`/canvases/${canvasId}/lock`);
  },

  /**
   * Acquire a lock on a canvas.
   * Returns the lock info on success, or throws with code CANVAS_LOCKED (409) if locked by another user.
   * If the current user already holds the lock, the server returns the existing lock (reused: true).
   *
   * @param {string} canvasId
   * @param {Object} [options]
   * @param {string} [options.userName] - Display name for lock holder
   * @param {number} [options.timeoutSeconds] - Custom timeout (default 300s)
   * @returns {Promise<LockInfo>}
   * @throws {ApiError} 409 if locked by another user
   */
  async acquire(canvasId, options = {}) {
    return apiClient.post(`/canvases/${canvasId}/lock`, {
      userName: options.userName || null,
      timeoutSeconds: options.timeoutSeconds || undefined,
    });
  },

  /**
   * Extend an existing lock.
   * @param {string} canvasId
   * @param {Object} [options]
   * @param {number} [options.additionalSeconds] - Seconds to add (default 300)
   * @returns {Promise<LockInfo>}
   * @throws {ApiError} 404 if no active lock, 400 if max extensions reached
   */
  async extend(canvasId, options = {}) {
    return apiClient.put(`/canvases/${canvasId}/lock`, {
      additionalSeconds: options.additionalSeconds || undefined,
    });
  },

  /**
   * Release a lock. Idempotent — succeeds even if no lock is active.
   * @param {string} canvasId
   * @returns {Promise<{ success: boolean, released: boolean }>}
   */
  async release(canvasId) {
    return apiClient.delete(`/canvases/${canvasId}/lock`);
  },

  /**
   * Check if a canvas is currently locked by a *different* user.
   * @param {string} canvasId
   * @param {string} currentUserId
   * @returns {Promise<{ lockedByOther: boolean, lock: LockInfo|null }>}
   */
  async isLockedByOther(canvasId, currentUserId) {
    const status = await this.getStatus(canvasId);
    if (!status.locked) return { lockedByOther: false, lock: null };
    return {
      lockedByOther: status.lock.lockedBy !== currentUserId,
      lock: status.lock,
    };
  },

  /**
   * Acquire a lock, handling the conflict case gracefully.
   * Returns { success, lock, conflict } — never throws for 409.
   *
   * @param {string} canvasId
   * @param {Object} [options]
   * @param {string} [options.userName]
   * @param {number} [options.timeoutSeconds]
   * @returns {Promise<{ success: boolean, lock: LockInfo|null, conflict: Object|null }>}
   */
  async tryAcquire(canvasId, options = {}) {
    try {
      const lock = await this.acquire(canvasId, options);
      return { success: true, lock, conflict: null };
    } catch (err) {
      if (err instanceof ApiError && err.status === 409) {
        return {
          success: false,
          lock: null,
          conflict: err.details?.lock || { error: err.message },
        };
      }
      throw err; // Re-throw unexpected errors
    }
  },
};

export default canvasLockService;
