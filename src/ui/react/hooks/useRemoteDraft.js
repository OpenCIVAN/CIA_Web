/**
 * @file useRemoteDraft.js
 * @description Hook that subscribes to the Y.js canvas editing observer
 * and provides remote draft data (operations, reactions, snapshots) to the UI.
 *
 * Used by non-editing collaborators to preview pending changes from the active editor.
 */

import { useState, useEffect, useMemo } from 'react';
import { onCanvasEditingChange } from '@Collaboration/yjs/yjsObservers';
import { yCanvasEditing } from '@Collaboration/yjs/yjsSetup';

export function useRemoteDraft() {
  const [remoteDrafts, setRemoteDrafts] = useState({});

  useEffect(() => {
    // Get initial state
    const initial = {};
    yCanvasEditing.forEach((value, key) => {
      initial[key] = value;
    });
    if (Object.keys(initial).length > 0) setRemoteDrafts(initial);

    // Subscribe to changes
    const unsubscribe = onCanvasEditingChange(({ action, userId, data }) => {
      setRemoteDrafts((prev) => {
        if (action === 'delete' || !data) {
          const { [userId]: _, ...rest } = prev;
          return rest;
        }
        return { ...prev, [userId]: data };
      });
    });

    return unsubscribe;
  }, []);

  // Flatten all remote drafts into a single operations list + reactions
  const remoteOperations = useMemo(() => {
    return Object.values(remoteDrafts).flatMap((d) => d.operations || []);
  }, [remoteDrafts]);

  const remoteReactions = useMemo(() => {
    const merged = {};
    Object.values(remoteDrafts).forEach((d) => {
      if (d.reactions) Object.assign(merged, d.reactions);
    });
    return merged;
  }, [remoteDrafts]);

  const remoteSnapshots = useMemo(() => {
    return Object.values(remoteDrafts)
      .filter((d) => d.snapshot)
      .map((d) => d.snapshot);
  }, [remoteDrafts]);

  const hasRemoteDraft = Object.keys(remoteDrafts).length > 0;

  return { remoteDrafts, remoteOperations, remoteReactions, remoteSnapshots, hasRemoteDraft };
}
