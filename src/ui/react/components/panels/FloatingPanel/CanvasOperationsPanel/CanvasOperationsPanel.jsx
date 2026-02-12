/**
 * @file CanvasOperationsPanel.jsx
 * @description Canvas Operations Panel - Manages canvas layout transactions, audit logs,
 * user awareness, and save points. Draggable and resizable floating panel.
 * Wired to canvasTransactionStore for live data.
 */

import React, { useState, useCallback, useEffect, useRef, useMemo } from 'react';
import { Icon, IconButton } from '@UI/react/components/atoms';
import { TabButton } from '@UI/react/components/molecules';
import { useCanvasHistory } from '@UI/react/store/canvasTransactionStore';
import { TransactionTab } from './tabs/TransactionTab';
import { AuditLogTab } from './tabs/AuditLogTab';
import { UsersTab } from './tabs/UsersTab';
import { SavePointsTab } from './tabs/SavePointsTab';
import { useRemoteDraft } from '@UI/react/hooks/useRemoteDraft';
import { TABS, TAB_CONFIG, DEFAULT_AUDIT_STATE, getTimeSegment } from './CanvasOperationsPanel.logic';
import './CanvasOperationsPanel.scss';

// =============================================================================
// CONSTANTS
// =============================================================================

const STORAGE_KEYS = {
  POSITION: 'cia-canvas-ops-position',
  SIZE: 'cia-canvas-ops-size',
};

const DEFAULT_SIZE = { width: 380, height: 480 };
const MIN_SIZE = { width: 320, height: 300 };
const MAX_SIZE = { width: 600, height: 800 };

// =============================================================================
// HELPERS
// =============================================================================

function loadPosition() {
  try {
    const stored = localStorage.getItem(STORAGE_KEYS.POSITION);
    if (stored) {
      const parsed = JSON.parse(stored);
      if (typeof parsed.x === 'number' && typeof parsed.y === 'number') {
        return {
          x: Math.max(0, Math.min(window.innerWidth - MIN_SIZE.width, parsed.x)),
          y: Math.max(60, Math.min(window.innerHeight - MIN_SIZE.height, parsed.y)),
        };
      }
    }
  } catch (e) { /* ignore */ }
  // Default: bottom-left above footer
  return { x: 300, y: window.innerHeight - DEFAULT_SIZE.height - 80 };
}

function loadSize() {
  try {
    const stored = localStorage.getItem(STORAGE_KEYS.SIZE);
    if (stored) {
      const parsed = JSON.parse(stored);
      if (typeof parsed.width === 'number' && typeof parsed.height === 'number') {
        return {
          width: Math.max(MIN_SIZE.width, Math.min(MAX_SIZE.width, parsed.width)),
          height: Math.max(MIN_SIZE.height, Math.min(MAX_SIZE.height, parsed.height)),
        };
      }
    }
  } catch (e) { /* ignore */ }
  return { ...DEFAULT_SIZE };
}

// =============================================================================
// MAIN COMPONENT
// =============================================================================

export function CanvasOperationsPanel({
  isOpen = true,
  onClose,
  onMinimize,
  collaborators = [],
  currentUserId,
  onFollowUser,
  onGoToViewport,
  onGoToCursor,
}) {
  const containerRef = useRef(null);

  // ── Store subscriptions ─────────────────────────────────────────────────
  const txMode = useCanvasHistory((s) => s.mode);
  const txDraft = useCanvasHistory((s) => s.draft);
  const txLock = useCanvasHistory((s) => s.lock);
  const txTimeRemaining = useCanvasHistory((s) => s.timeRemaining);
  const txAuditLog = useCanvasHistory((s) => s.auditLog);
  const txSavePoints = useCanvasHistory((s) => s.savePoints);
  const txPast = useCanvasHistory((s) => s.past);
  const txReactions = useCanvasHistory((s) => s.reactions);

  // Store actions
  const txRevertDraftOperation = useCanvasHistory((s) => s.revertDraftOperation);
  const txCommitTransaction = useCanvasHistory((s) => s.commitTransaction);
  const txDiscardTransaction = useCanvasHistory((s) => s.discardTransaction);
  const txCreateSavePoint = useCanvasHistory((s) => s.createSavePoint);
  const txRevertToSavePoint = useCanvasHistory((s) => s.revertToSavePoint);
  const txUndo = useCanvasHistory((s) => s.undo);
  const txExtendLock = useCanvasHistory((s) => s.extendLock);
  const txAddReaction = useCanvasHistory((s) => s.addReaction);
  const txRemoveReaction = useCanvasHistory((s) => s.removeReaction);

  // ── Remote draft (collaboration) ────────────────────────────────────────
  const { remoteReactions } = useRemoteDraft();
  const txRemoteLock = useCanvasHistory((s) => s.remoteLock);

  // Merge local + remote reactions
  const mergedReactions = useMemo(() => {
    const merged = { ...txReactions };
    Object.entries(remoteReactions).forEach(([changeId, reactions]) => {
      merged[changeId] = [...(merged[changeId] || []), ...reactions];
    });
    return merged;
  }, [txReactions, remoteReactions]);

  // ── Derived data ────────────────────────────────────────────────────────
  const isEditMode = txMode === 'transactional';

  const pendingOperations = useMemo(() => {
    return txDraft.operations.map((op) => ({
      id: op.id,
      type: op.type,
      detail: op.description,
      description: op.description,
      timestamp: op.timestamp,
    }));
  }, [txDraft.operations]);

  const transactions = useMemo(() => {
    return txPast.map((entry, index) => {
      const isBatch = entry.type === 'BATCH';
      return {
        id: entry.id || `tx-${index}`,
        user: 'You',
        timestamp: entry.timestamp,
        segment: getTimeSegment(new Date(entry.timestamp)),
        operations: isBatch
          ? (entry.subOperations || [{ type: entry.type, label: entry.description, detail: entry.description, timestamp: entry.timestamp }])
          : [{ type: entry.type, label: entry.description, detail: entry.description, timestamp: entry.timestamp }],
      };
    }).reverse();
  }, [txPast]);

  const displaySavePoints = useMemo(() => {
    return txSavePoints.map((sp) => ({
      id: sp.id,
      name: sp.name,
      label: sp.name,
      timestamp: new Date(sp.timestamp).toLocaleTimeString(),
      createdAt: new Date(sp.timestamp),
      operationIndex: sp.operationIndex,
      user: 'You',
      viewCount: sp.operationIndex,
    }));
  }, [txSavePoints]);

  const collaboratorsWithLock = useMemo(() => {
    return collaborators.map((c) => ({
      ...c,
      editing: txLock?.lockedBy === c.id,
    }));
  }, [collaborators, txLock]);

  // Position & size state
  const [position, setPosition] = useState(loadPosition);
  const [size, setSize] = useState(loadSize);

  // Drag state
  const [isDragging, setIsDragging] = useState(false);
  const dragStartRef = useRef(null);

  // Resize state
  const [isResizing, setIsResizing] = useState(false);
  const [resizeDirection, setResizeDirection] = useState(null);
  const resizeStartRef = useRef(null);

  // Tab state
  const [activeTab, setActiveTab] = useState(TABS.AUDIT);

  // Transaction tab state
  const [selectedOps, setSelectedOps] = useState(() =>
    new Array(pendingOperations.length).fill(true)
  );

  // Sync selectedOps when pendingOperations length changes
  useEffect(() => {
    setSelectedOps((prev) => {
      if (prev.length === pendingOperations.length) return prev;
      return new Array(pendingOperations.length).fill(true);
    });
  }, [pendingOperations.length]);

  // Audit log state
  const [auditState, setAuditState] = useState(DEFAULT_AUDIT_STATE);

  // Users tab state
  const [followingUser, setFollowingUser] = useState(null);

  // Save points state
  const [currentSavePoint, setCurrentSavePoint] = useState(null);

  // ===========================================================================
  // PERSISTENCE
  // ===========================================================================

  useEffect(() => {
    if (!isDragging) {
      try {
        localStorage.setItem(STORAGE_KEYS.POSITION, JSON.stringify(position));
      } catch (e) { /* ignore */ }
    }
  }, [position, isDragging]);

  useEffect(() => {
    if (!isResizing) {
      try {
        localStorage.setItem(STORAGE_KEYS.SIZE, JSON.stringify(size));
      } catch (e) { /* ignore */ }
    }
  }, [size, isResizing]);

  // ===========================================================================
  // DRAG HANDLERS
  // ===========================================================================

  const handleMouseDown = useCallback((e) => {
    // Don't drag if clicking on interactive elements
    if (e.target.closest('button, input, select, [role="button"]')) {
      return;
    }

    // Only drag from header area
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;

    const clickY = e.clientY - rect.top;
    if (clickY > 40) return; // Header is ~40px

    e.preventDefault();
    setIsDragging(true);
    dragStartRef.current = {
      mouseX: e.clientX,
      mouseY: e.clientY,
      posX: position.x,
      posY: position.y,
    };

    document.body.style.cursor = 'grabbing';
    document.body.style.userSelect = 'none';
  }, [position]);

  const handleDragMove = useCallback((e) => {
    if (!isDragging || !dragStartRef.current) return;

    const dx = e.clientX - dragStartRef.current.mouseX;
    const dy = e.clientY - dragStartRef.current.mouseY;

    setPosition({
      x: Math.max(0, Math.min(window.innerWidth - size.width, dragStartRef.current.posX + dx)),
      y: Math.max(0, Math.min(window.innerHeight - size.height, dragStartRef.current.posY + dy)),
    });
  }, [isDragging, size]);

  const handleDragEnd = useCallback(() => {
    setIsDragging(false);
    dragStartRef.current = null;
    document.body.style.cursor = '';
    document.body.style.userSelect = '';
  }, []);

  // ===========================================================================
  // RESIZE HANDLERS
  // ===========================================================================

  const handleResizeStart = useCallback((direction, e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsResizing(true);
    setResizeDirection(direction);
    resizeStartRef.current = {
      mouseX: e.clientX,
      mouseY: e.clientY,
      width: size.width,
      height: size.height,
      posX: position.x,
      posY: position.y,
    };

    document.body.style.userSelect = 'none';
  }, [size, position]);

  const handleResizeMove = useCallback((e) => {
    if (!isResizing || !resizeStartRef.current) return;

    const dx = e.clientX - resizeStartRef.current.mouseX;
    const dy = e.clientY - resizeStartRef.current.mouseY;
    const dir = resizeDirection;

    let newWidth = resizeStartRef.current.width;
    let newHeight = resizeStartRef.current.height;
    let newX = resizeStartRef.current.posX;
    let newY = resizeStartRef.current.posY;

    // Horizontal
    if (dir.includes('e')) {
      newWidth = Math.min(MAX_SIZE.width, Math.max(MIN_SIZE.width, resizeStartRef.current.width + dx));
    }
    if (dir.includes('w')) {
      const maxDelta = resizeStartRef.current.width - MIN_SIZE.width;
      const actualDx = Math.max(-maxDelta, Math.min(resizeStartRef.current.posX, dx));
      newWidth = Math.max(MIN_SIZE.width, resizeStartRef.current.width - actualDx);
      newX = resizeStartRef.current.posX + (resizeStartRef.current.width - newWidth);
    }

    // Vertical
    if (dir.includes('s')) {
      newHeight = Math.min(MAX_SIZE.height, Math.max(MIN_SIZE.height, resizeStartRef.current.height + dy));
    }
    if (dir.includes('n')) {
      const maxDelta = resizeStartRef.current.height - MIN_SIZE.height;
      const actualDy = Math.max(-maxDelta, Math.min(resizeStartRef.current.posY, dy));
      newHeight = Math.max(MIN_SIZE.height, resizeStartRef.current.height - actualDy);
      newY = resizeStartRef.current.posY + (resizeStartRef.current.height - newHeight);
    }

    setSize({ width: newWidth, height: newHeight });
    setPosition({ x: newX, y: newY });
  }, [isResizing, resizeDirection]);

  const handleResizeEnd = useCallback(() => {
    setIsResizing(false);
    setResizeDirection(null);
    resizeStartRef.current = null;
    document.body.style.cursor = '';
    document.body.style.userSelect = '';
  }, []);

  // ===========================================================================
  // GLOBAL EVENT LISTENERS
  // ===========================================================================

  useEffect(() => {
    if (isDragging) {
      window.addEventListener('mousemove', handleDragMove);
      window.addEventListener('mouseup', handleDragEnd);
      return () => {
        window.removeEventListener('mousemove', handleDragMove);
        window.removeEventListener('mouseup', handleDragEnd);
      };
    }
  }, [isDragging, handleDragMove, handleDragEnd]);

  useEffect(() => {
    if (isResizing) {
      window.addEventListener('mousemove', handleResizeMove);
      window.addEventListener('mouseup', handleResizeEnd);
      return () => {
        window.removeEventListener('mousemove', handleResizeMove);
        window.removeEventListener('mouseup', handleResizeEnd);
      };
    }
  }, [isResizing, handleResizeMove, handleResizeEnd]);

  // ===========================================================================
  // BUSINESS LOGIC
  // ===========================================================================

  // Compute badge counts
  const pendingCount = pendingOperations.length;
  const onlineCount = collaboratorsWithLock.filter(c => c.online && c.id !== currentUserId).length;

  const getBadgeCount = useCallback((badgeKey) => {
    if (badgeKey === 'pendingCount') return pendingCount;
    if (badgeKey === 'onlineCount') return onlineCount;
    return 0;
  }, [pendingCount, onlineCount]);

  // Transaction tab handlers
  const handleToggleOp = useCallback((index) => {
    setSelectedOps(prev => {
      const next = [...prev];
      next[index] = !next[index];
      return next;
    });
  }, []);

  const handleSelectAll = useCallback(() => {
    setSelectedOps(new Array(pendingOperations.length).fill(true));
  }, [pendingOperations.length]);

  const handleClearSelection = useCallback(() => {
    setSelectedOps(new Array(pendingOperations.length).fill(false));
  }, [pendingOperations.length]);

  const handleApply = useCallback(() => {
    txCommitTransaction();
  }, [txCommitTransaction]);

  const handleCancel = useCallback(() => {
    txDiscardTransaction();
  }, [txDiscardTransaction]);

  // Audit log handlers
  const handleRevertOperation = useCallback((opId, txId) => {
    setAuditState(prev => ({
      ...prev,
      revertedOperations: new Set([...prev.revertedOperations, opId]),
    }));
    // For draft operations, revert via store
    txRevertDraftOperation(opId);
  }, [txRevertDraftOperation]);

  const handleUndoTransaction = useCallback((txId) => {
    const tx = transactions.find(t => t.id === txId);
    if (tx) {
      const newReverted = new Set(auditState.revertedOperations);
      tx.operations.forEach((_, i) => newReverted.add(`${txId}-${i}`));
      setAuditState(prev => ({
        ...prev,
        revertedOperations: newReverted,
      }));
    }
    txUndo();
  }, [transactions, auditState.revertedOperations, txUndo]);

  // Users tab handlers
  const handleFollow = useCallback((userId) => {
    const newFollowing = followingUser === userId ? null : userId;
    setFollowingUser(newFollowing);
    onFollowUser?.(newFollowing);
  }, [followingUser, onFollowUser]);

  // Save points handlers
  const handleCreateSavePoint = useCallback(() => {
    txCreateSavePoint();
    setCurrentSavePoint(displaySavePoints.length);
  }, [txCreateSavePoint, displaySavePoints.length]);

  const handleRevertToSavePoint = useCallback((spId) => {
    const idx = displaySavePoints.findIndex((sp) => sp.id === spId);
    setCurrentSavePoint(idx >= 0 ? idx : null);
    txRevertToSavePoint(spId);
  }, [txRevertToSavePoint, displaySavePoints]);

  const handleDeleteSavePoint = useCallback((spId) => {
    // Delete not yet in store — filter locally via no-op
    const idx = displaySavePoints.findIndex((sp) => sp.id === spId);
    if (currentSavePoint === idx) {
      setCurrentSavePoint(null);
    }
  }, [currentSavePoint, displaySavePoints]);

  // ===========================================================================
  // RENDER
  // ===========================================================================

  if (!isOpen) return null;

  const selectedCount = selectedOps.filter(Boolean).length;
  const hasChanges = pendingOperations.length > 0;

  return (
    <div
      ref={containerRef}
      className={`canvas-operations-panel ${isDragging ? 'canvas-operations-panel--dragging' : ''} ${isResizing ? 'canvas-operations-panel--resizing' : ''}`}
      onMouseDown={handleMouseDown}
      style={{
        left: position.x,
        top: position.y,
        width: size.width,
        height: size.height,
      }}
    >
      {/* Header */}
      <div className="canvas-operations-panel__header">
        <Icon name="layers" size={16} className="canvas-operations-panel__header-icon" />
        <span className="canvas-operations-panel__title">Canvas Operations</span>

        {hasChanges && (
          <div className="canvas-operations-panel__pending-badge">
            {pendingCount} pending
          </div>
        )}

        <IconButton
          icon="remove"
          onClick={onMinimize}
          tooltip="Minimize"
          size="sm"
          variant="ghost"
          className="canvas-operations-panel__control-btn"
        />
        <IconButton
          icon="close"
          onClick={onClose}
          tooltip="Close"
          size="sm"
          variant="ghost"
          className="canvas-operations-panel__control-btn canvas-operations-panel__control-btn--close"
        />
      </div>

      {/* Tab bar */}
      <div className="canvas-operations-panel__tabs">
        {TAB_CONFIG.map(tab => (
          <TabButton
            key={tab.id}
            icon={tab.icon}
            label={tab.label}
            active={activeTab === tab.id}
            onClick={() => setActiveTab(tab.id)}
            badge={tab.badgeKey ? getBadgeCount(tab.badgeKey) : 0}
          />
        ))}
      </div>

      {/* Tab content */}
      <div className="canvas-operations-panel__content">
        {activeTab === TABS.TRANSACTION && (
          <TransactionTab
            operations={pendingOperations}
            selectedOps={selectedOps}
            onToggleOp={handleToggleOp}
            onSelectAll={handleSelectAll}
            onClearSelection={handleClearSelection}
            onApply={handleApply}
            onCancel={handleCancel}
            hasChanges={hasChanges}
            selectedCount={selectedCount}
            reactions={mergedReactions}
            onAddReaction={txAddReaction}
            onRemoveReaction={txRemoveReaction}
            currentUserId={currentUserId}
          />
        )}

        {activeTab === TABS.AUDIT && (
          <AuditLogTab
            transactions={transactions}
            collaborators={collaboratorsWithLock}
            auditState={auditState}
            setAuditState={setAuditState}
            onRevertOperation={handleRevertOperation}
            onUndoTransaction={handleUndoTransaction}
            currentUserId={currentUserId}
          />
        )}

        {activeTab === TABS.USERS && (
          <UsersTab
            collaborators={collaboratorsWithLock}
            lock={txLock}
            remoteLock={txRemoteLock}
            timeRemaining={txTimeRemaining}
            isEditMode={isEditMode}
            onExtendLock={txExtendLock}
            followingUser={followingUser}
            onFollow={handleFollow}
            onGoToViewport={onGoToViewport}
            onGoToCursor={onGoToCursor}
            currentUserId={currentUserId}
          />
        )}

        {activeTab === TABS.SAVEPOINTS && (
          <SavePointsTab
            savePoints={displaySavePoints}
            currentSavePoint={currentSavePoint}
            onCreateSavePoint={handleCreateSavePoint}
            onRevert={handleRevertToSavePoint}
            onDelete={handleDeleteSavePoint}
            isEditMode={isEditMode}
          />
        )}
      </div>

      {/* Resize Handles */}
      {/* Edges */}
      <div
        className="canvas-operations-panel__resize-handle canvas-operations-panel__resize-handle--n"
        onMouseDown={(e) => handleResizeStart('n', e)}
      />
      <div
        className="canvas-operations-panel__resize-handle canvas-operations-panel__resize-handle--s"
        onMouseDown={(e) => handleResizeStart('s', e)}
      />
      <div
        className="canvas-operations-panel__resize-handle canvas-operations-panel__resize-handle--w"
        onMouseDown={(e) => handleResizeStart('w', e)}
      />
      <div
        className="canvas-operations-panel__resize-handle canvas-operations-panel__resize-handle--e"
        onMouseDown={(e) => handleResizeStart('e', e)}
      />

      {/* Corners */}
      <div
        className="canvas-operations-panel__resize-handle canvas-operations-panel__resize-handle--nw"
        onMouseDown={(e) => handleResizeStart('nw', e)}
      />
      <div
        className="canvas-operations-panel__resize-handle canvas-operations-panel__resize-handle--ne"
        onMouseDown={(e) => handleResizeStart('ne', e)}
      />
      <div
        className="canvas-operations-panel__resize-handle canvas-operations-panel__resize-handle--sw"
        onMouseDown={(e) => handleResizeStart('sw', e)}
      />
      <div
        className="canvas-operations-panel__resize-handle canvas-operations-panel__resize-handle--se"
        onMouseDown={(e) => handleResizeStart('se', e)}
      />
    </div>
  );
}

export default CanvasOperationsPanel;
