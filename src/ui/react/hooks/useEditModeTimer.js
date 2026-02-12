/**
 * @file useEditModeTimer.js
 * @description Hook that manages the countdown interval while in transactional edit mode.
 * Decrements `timeRemaining` in the store every second, refreshes lock status from
 * the server periodically, and fires an `onExpired` callback when the timer reaches 0.
 */

import { useEffect, useRef } from 'react';
import { useCanvasHistory } from '@UI/react/store/canvasTransactionStore';

const REFRESH_INTERVAL_S = 30; // Refresh lock from server every 30s
const WARNING_THRESHOLD_S = 60; // Show warning state when <=60s remain

export function useEditModeTimer({ onExpired } = {}) {
  const mode = useCanvasHistory((s) => s.mode);
  const timeRemaining = useCanvasHistory((s) => s.timeRemaining);
  const lock = useCanvasHistory((s) => s.lock);
  const onExpiredRef = useRef(onExpired);
  onExpiredRef.current = onExpired;
  const hasFiredExpiry = useRef(false);

  const isEditMode = mode === 'transactional';
  const isWarning = timeRemaining != null && timeRemaining <= WARNING_THRESHOLD_S;
  const isExpired = timeRemaining != null && timeRemaining <= 0;

  useEffect(() => {
    if (!isEditMode || !lock) {
      hasFiredExpiry.current = false;
      return;
    }

    let tickCount = 0;

    const interval = setInterval(() => {
      tickCount++;

      // Decrement locally
      const state = useCanvasHistory.getState();
      const current = state.timeRemaining;
      if (current == null) return;

      const next = Math.max(0, current - 1);
      useCanvasHistory.setState({ timeRemaining: next });

      // Refresh from server periodically
      if (tickCount % REFRESH_INTERVAL_S === 0) {
        state.refreshLockStatus();
      }

      // Fire expiry callback once
      if (next <= 0 && !hasFiredExpiry.current) {
        hasFiredExpiry.current = true;
        onExpiredRef.current?.();
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [isEditMode, lock]);

  return { timeRemaining, isWarning, isExpired };
}
