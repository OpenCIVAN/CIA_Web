// src/core/data/managers/index.js
// Manager exports for CIA Web
//
// Managers handle business logic and server synchronization.
// They maintain local caches but treat server as source of truth.

// Canvas System
export { CanvasManager, canvasManager } from './CanvasManager.js';
export { SubsetManager, subsetManager } from './SubsetManager.js';
