/**
 * @file canvasHistoryStore.js
 * @description Re-export shim — all functionality has moved to canvasTransactionStore.js
 *
 * Existing consumers can continue importing from this file unchanged.
 */

export { useCanvasHistory, canvasHistory, OPERATION_TYPES } from './canvasTransactionStore';
