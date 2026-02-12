/**
 * @file useCanvasLockSync.js
 * @description Hook that subscribes to server-broadcasted canvas lock CustomEvents
 * and updates the canvasTransactionStore's remoteLock state.
 *
 * Follows the same pattern as useWebSocketEvents — listens for CustomEvents
 * dispatched by serverSync.js (cia:canvas-locked, cia:canvas-lock-extended,
 * cia:canvas-unlocked) and bridges them into React state via the store.
 */

import { useEffect } from 'react';
import { useCanvasHistory } from '@UI/react/store/canvasTransactionStore';

export function useCanvasLockSync(canvasId) {
  const setRemoteLock = useCanvasHistory((s) => s.setRemoteLock);
  const clearRemoteLock = useCanvasHistory((s) => s.clearRemoteLock);
  const localLock = useCanvasHistory((s) => s.lock);

  useEffect(() => {
    if (!canvasId) return;

    const handleLocked = (e) => {
      const { lock } = e.detail;
      // Skip if this is our own lock
      if (localLock?.id === lock?.id) return;
      if (lock?.canvasId !== canvasId) return;
      setRemoteLock(lock);
    };

    const handleExtended = (e) => {
      const { lock } = e.detail;
      if (lock?.canvasId !== canvasId) return;
      if (localLock?.id === lock?.id) return;
      setRemoteLock(lock);
    };

    const handleUnlocked = (e) => {
      if (e.detail.canvasId !== canvasId) return;
      clearRemoteLock();
    };

    window.addEventListener('cia:canvas-locked', handleLocked);
    window.addEventListener('cia:canvas-lock-extended', handleExtended);
    window.addEventListener('cia:canvas-unlocked', handleUnlocked);

    return () => {
      window.removeEventListener('cia:canvas-locked', handleLocked);
      window.removeEventListener('cia:canvas-lock-extended', handleExtended);
      window.removeEventListener('cia:canvas-unlocked', handleUnlocked);
    };
  }, [canvasId, localLock?.id, setRemoteLock, clearRemoteLock]);
}
