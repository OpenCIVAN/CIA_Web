/**
 * @file Minimap.jsx
 * @description Main minimap component for Canvas Map Panel V2
 *
 * Features:
 * - Grid-based canvas overview
 * - VG blocks or View cells (based on display mode)
 * - Viewport indicators
 * - Collaborator indicators with cursor tracking
 * - Link lines (in Links mode)
 * - Panning support for large canvases
 */

import React, { memo, useMemo, useRef, useCallback, useState, useEffect } from 'react';
import { VGBlock } from './VGBlock';
import { ViewCell } from './ViewCell';
import { ViewportIndicator } from './ViewportIndicator';
import { CollaboratorIndicator } from './CollaboratorIndicator';
import { CursorIndicator } from './CursorIndicator';
import { LinkLines } from './LinkLines';
import { Icon } from '@UI/react/components/atoms/Icon';
import { useMinimapPanning } from '../../hooks/useMinimapPanning';
import { useMinimapCellSize } from '../../hooks/useMinimapCellSize';
import { MAP_MODES, MINIMAP_CONSTANTS, LAYOUTS } from '../../utils/constants';
import { colToLetter, getGridCenter, clamp } from '../../utils/gridUtils';
import { VGFocusedView } from './VGFocusedView';
import { getInternalCells } from '../../hooks/useInternalCellLayout';
import './Minimap.scss';

/**
 * Minimap - Grid-based canvas overview with panning
 */
export const Minimap = memo(function Minimap({
  // Data
  canvas,
  viewGroups,
  viewports,
  collaborators,
  vgLinks,
  bookmarks,
  flattenedViews,

  // Display settings
  showViews = false,
  showVGs = true,
  mapMode,
  minimapZoom,
  showGridLabels,
  showInternals,
  showViewports,
  showCollaborators,
  showBookmarks,
  showCursors,

  // Selection state
  selectedVGId,
  selectedViewportId,
  highlightedLinkId,

  // Handlers
  onVGClick,
  onVGDoubleClick,
  onLinkClick,
  onDropItem,
  onFocusedVGRename,
  onFocusedVGSlotDrop,
  onFocusedVGSlotClear,
  onBackFromFocus,

  // Container dimensions
  containerWidth,
  containerHeight,

  // Focus state
  focusedVG,
  focusedSlots = [],

  // Collision/placement (optional)
  collisionViewGroups,

  // Companion panel (for extended panning)
  companionOpen = false,
  companionWidth = 0,

  // Control signals
  resetPanSignal = 0,

  // Edit mode (transactional editing)
  isEditMode = false,
  onMoveVG,
  onRemoveVG,
  draftSnapshot,
  displayViewGroups: displayViewGroupsProp,

  // Remote draft preview (collaboration)
  remoteDraftSnapshot,
  remoteOperations = [],

  // Quick ops (passed from parent)
  quickOps,

  // Phase 4: cell interaction handlers
  onCellDragComplete,
  onCellAssign,
  onTargetingResolve,
}) {
  const { rows, cols, homePosition } = canvas;
  const containerRef = useRef(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [dropTarget, setDropTarget] = useState(null);

  // Edit mode VG move state
  const [movingVG, setMovingVG] = useState(null); // { vg, startX, startY }
  const [moveGhost, setMoveGhost] = useState(null); // { row, col, rowSpan, colSpan, color }
  const moveGhostRef = useRef(null); // ref to avoid stale closure in pointer up

  // Calculate cell sizing
  const sizing = useMinimapCellSize({
    containerWidth: containerWidth || 300,
    containerHeight: containerHeight || 300,
    rows,
    cols,
    zoom: minimapZoom,
    showLabels: showGridLabels,
    focusedVG,
  });

  const { cellSize, headerSize } = sizing;
  const renderGap = 0;
  const renderPitch = cellSize + renderGap;
  const gridExtra = MINIMAP_CONSTANTS.EXTRA_GRID_CELLS ?? 2;
  const gridCols = Math.max(cols + gridExtra, cols);
  const gridRows = Math.max(rows + gridExtra, rows);
  const gridWidth = gridCols * renderPitch;
  const gridHeight = gridRows * renderPitch;
  const scrollPadding = MINIMAP_CONSTANTS.SCROLL_PADDING * 2;
  const labelOffset = showGridLabels ? headerSize : 0;
  const majorEvery = 5;
  const minorLineColor = 'rgba(96, 165, 250, 0.16)';
  const majorLineColor = 'rgba(96, 165, 250, 0.34)';
  const canvasOutlineColor = 'rgba(148, 163, 184, 0.35)';

  // Panning support with extended bounds (V2Spec: allows panning ~3 cells beyond content)
  const cellPitch = renderPitch;

  const panEnabled = sizing.needsPanning || MINIMAP_CONSTANTS.PAN_PADDING_CELLS > 0;
  const panning = useMinimapPanning({
    contentWidth: gridWidth + labelOffset + scrollPadding,
    contentHeight: gridHeight + labelOffset + scrollPadding,
    viewportWidth: containerWidth || 300,
    viewportHeight: containerHeight || 300,
    enabled: panEnabled,
    cellPitch,
    companionOpen,
    companionOffset: companionWidth,
  });

  React.useEffect(() => {
    if (resetPanSignal === 0) return;
    panning.resetPan();
  }, [resetPanSignal, panning.resetPan]);

  // Calculate which VGs are involved in the highlighted link
  const highlightedLinkVGs = useMemo(() => {
    if (!highlightedLinkId) return new Set();
    const link = vgLinks.find(l => l.id === highlightedLinkId);
    if (!link) return new Set();
    return new Set([link.from, link.to]);
  }, [highlightedLinkId, vgLinks]);

  const getVGCenter = useCallback((vgId) => {
    const vg = viewGroups.find(v => v.id === vgId);
    if (!vg?.position) return null;

    return getGridCenter(
      vg.position.row,
      vg.position.col,
      vg.position.rowSpan,
      vg.position.colSpan,
      cellSize,
      renderGap
    );
  }, [viewGroups, cellSize, renderGap]);

  // Collaborators with cursor data for cursor indicators
  const collaboratorsWithCursors = useMemo(() => {
    return collaborators.filter(c => c.isOnline && c.cursor && (c.showCursor ?? true));
  }, [collaborators]);

  const collisionGroups = useMemo(() => {
    if (collisionViewGroups && collisionViewGroups.length) {
      return collisionViewGroups;
    }
    return viewGroups;
  }, [collisionViewGroups, viewGroups]);

  // Pan to focused VG center when focus changes (not on every panning state update)
  useEffect(() => {
    if (!focusedVG?.position) return;
    const { row, col, rowSpan, colSpan } = focusedVG.position;
    const center = getGridCenter(row, col, rowSpan, colSpan, cellSize, renderGap);
    panning.panToPosition(center.x, center.y);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- only re-center when focus target changes
  }, [focusedVG?.id, cellSize, renderGap]);

  const parseDragPayload = useCallback((event) => {
    const jsonPayload = event.dataTransfer?.getData('application/json');
    const textPayload = event.dataTransfer?.getData('text/plain');
    const raw = jsonPayload || textPayload;
    if (raw) {
      try {
        return JSON.parse(raw);
      } catch (err) {
        // Fall through to global drag payload
      }
    }
    if (typeof window !== 'undefined' && window.__ciaDragPayload) {
      return window.__ciaDragPayload;
    }
    return null;
  }, []);

  const isViewPayload = useCallback((data) => {
    if (!data) return false;
    if (data.type === 'view' || data.type === 'dataset' || data.type === 'vg-import') return true;
    if (data.view || data.viewId) return true;
    if (data.datasetId && !data.vgId) return true;
    return false;
  }, []);

  const handleVGDragStart = useCallback((event, vg) => {
    if (!event?.dataTransfer || !vg) return;
    const payload = {
      type: 'vg-place',
      vgId: vg.id,
      vgName: vg.name,
      vgColor: vg.color,
    };
    event.dataTransfer.effectAllowed = 'move';
    event.dataTransfer.setData('application/json', JSON.stringify(payload));
    event.dataTransfer.setData('text/plain', JSON.stringify(payload));
    if (typeof window !== 'undefined') {
      window.__ciaDragPayload = payload;
    }
    setIsDragOver(true);
  }, []);

  const handleVGDragEnd = useCallback(() => {
    setIsDragOver(false);
    setDropTarget(null);
    if (typeof window !== 'undefined') {
      window.__ciaDragPayload = null;
    }
  }, []);

  // ── Edit mode: pointer-event VG move handler ─────────────────────────
  const handleVGPointerDown = useCallback((event, vg) => {
    if (!isEditMode || !onMoveVG || !containerRef.current) return;

    event.preventDefault();
    const pointerId = event.pointerId;
    containerRef.current.setPointerCapture(pointerId);

    const startX = event.clientX;
    const startY = event.clientY;
    setMovingVG({ vg, startX, startY });

    const handlePointerMove = (e) => {
      if (!containerRef.current) return;
      // Compute target cell from pointer position
      const rect = containerRef.current.getBoundingClientRect();
      const localX = e.clientX - rect.left;
      const localY = e.clientY - rect.top;
      const contentX = localX - MINIMAP_CONSTANTS.SCROLL_PADDING - (showGridLabels ? headerSize : 0) + panning.panOffset.x;
      const contentY = localY - MINIMAP_CONSTANTS.SCROLL_PADDING - (showGridLabels ? headerSize : 0) + panning.panOffset.y;

      const rawCol = Math.floor(contentX / renderPitch);
      const rawRow = Math.floor(contentY / renderPitch);
      const rowSpan = vg.position?.rowSpan || 1;
      const colSpan = vg.position?.colSpan || 1;
      const maxCol = Math.max(0, cols - colSpan);
      const maxRow = Math.max(0, rows - rowSpan);
      const col = clamp(rawCol, 0, maxCol);
      const row = clamp(rawRow, 0, maxRow);

      const ghostVal = { row, col, rowSpan, colSpan, color: vg.color };
      setMoveGhost(ghostVal);
      moveGhostRef.current = ghostVal;
    };

    const handlePointerUp = () => {
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);

      if (containerRef.current) {
        try { containerRef.current.releasePointerCapture(pointerId); } catch {}
      }

      // Finalize move using ref (avoids stale closure)
      const ghost = moveGhostRef.current;
      setMovingVG(null);
      setMoveGhost(null);
      moveGhostRef.current = null;

      if (ghost && onMoveVG) {
        onMoveVG({ vgId: vg.id, toRow: ghost.row, toCol: ghost.col });
      }
    };

    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp);
  }, [isEditMode, onMoveVG, showGridLabels, headerSize, panning.panOffset.x, panning.panOffset.y, renderPitch, cols, rows]);

  // ── Compute change status for each VG (draft indicators) ─────────────
  const getChangeStatus = useCallback((vgId) => {
    if (!isEditMode || !draftSnapshot) return null;
    const snapshotVG = draftSnapshot.find((s) => s.id === vgId);
    const currentVG = viewGroups.find((v) => v.id === vgId);
    if (!snapshotVG && currentVG) return 'added';
    if (snapshotVG && !currentVG) return 'removed';
    if (snapshotVG && currentVG && currentVG.position) {
      const sp = snapshotVG.position;
      const cp = currentVG.position;
      if (sp && cp && (sp.row !== cp.row || sp.col !== cp.col)) return 'moved';
    }
    return null;
  }, [isEditMode, draftSnapshot, viewGroups]);

  // ── Ghost outlines for removed VGs ─────────────────────────────────────
  const removedVGGhosts = useMemo(() => {
    if (!isEditMode || !draftSnapshot) return [];
    const currentIds = new Set(viewGroups.map((v) => v.id));
    return draftSnapshot.filter((s) => !currentIds.has(s.id) && s.position);
  }, [isEditMode, draftSnapshot, viewGroups]);

  // Ghost outlines for MOVED VGs — show original position with dashed outline
  const movedVGGhosts = useMemo(() => {
    if (!isEditMode || !draftSnapshot) return [];
    return draftSnapshot
      .filter((snap) => {
        const current = viewGroups.find((v) => v.id === snap.id);
        if (!current?.position || !snap.position) return false;
        return current.position.row !== snap.position.row || current.position.col !== snap.position.col;
      })
      .map((snap) => ({ ...snap, originalPosition: snap.position }));
  }, [isEditMode, draftSnapshot, viewGroups]);

  const resolveSpanForData = useCallback((data) => {
    if (!data) return { rowSpan: 1, colSpan: 1 };
    if (data.type === 'vg-place') {
      const vg = viewGroups.find((group) => group.id === data.vgId);
      if (!vg) return { rowSpan: 1, colSpan: 1 };
      const layoutId = vg.layoutId || 'single';
      const layout = LAYOUTS[layoutId] || LAYOUTS.single;
      const rowSpan = vg.position?.rowSpan || layout.rows || 1;
      const colSpan = vg.position?.colSpan || layout.cols || 1;
      return { rowSpan, colSpan };
    }
    if (data.type === 'template-create') {
      const layout = LAYOUTS[data.layoutId] || LAYOUTS.single;
      return { rowSpan: layout.rows || 1, colSpan: layout.cols || 1 };
    }
    return { rowSpan: 1, colSpan: 1 };
  }, [viewGroups]);

  const computeDropPosition = useCallback((event, data) => {
    if (!containerRef.current) return null;
    const rect = containerRef.current.getBoundingClientRect();
    const localX = event.clientX - rect.left;
    const localY = event.clientY - rect.top;
    const contentX = localX - MINIMAP_CONSTANTS.SCROLL_PADDING - labelOffset + panning.panOffset.x;
    const contentY = localY - MINIMAP_CONSTANTS.SCROLL_PADDING - labelOffset + panning.panOffset.y;

    if (!Number.isFinite(contentX) || !Number.isFinite(contentY)) return null;

    const rawCol = Math.floor(contentX / renderPitch);
    const rawRow = Math.floor(contentY / renderPitch);
    if (rawCol < 0 || rawRow < 0) return null;

    const { rowSpan, colSpan } = resolveSpanForData(data);
    const maxCol = Math.max(0, cols - colSpan);
    const maxRow = Math.max(0, rows - rowSpan);
    const col = clamp(rawCol, 0, maxCol);
    const row = clamp(rawRow, 0, maxRow);
    return { row, col, rowSpan, colSpan };
  }, [cols, labelOffset, panning.panOffset.x, panning.panOffset.y, renderPitch, resolveSpanForData, rows]);

  const rectsOverlap = useCallback((a, b) => (
    a.row < b.row + b.rowSpan
    && a.row + a.rowSpan > b.row
    && a.col < b.col + b.colSpan
    && a.col + a.colSpan > b.col
  ), []);

  const findFirstFit = useCallback((rowSpan, colSpan, ignoreId, startRow, startCol) => {
    const maxRow = rows - rowSpan;
    const maxCol = cols - colSpan;
    if (maxRow < 0 || maxCol < 0) return null;
    const candidates = [];
    for (let r = 0; r <= maxRow; r += 1) {
      for (let c = 0; c <= maxCol; c += 1) {
        candidates.push({ row: r, col: c });
      }
    }
    const startIndex = candidates.findIndex(
      (pos) => pos.row === startRow && pos.col === startCol
    );
    const ordered = startIndex >= 0
      ? [...candidates.slice(startIndex), ...candidates.slice(0, startIndex)]
      : candidates;
    for (const pos of ordered) {
      const proposed = { row: pos.row, col: pos.col, rowSpan, colSpan };
      const overlaps = collisionGroups.some((vg) => {
        if (vg.id === ignoreId || !vg.position) return false;
        return rectsOverlap(proposed, vg.position);
      });
      if (!overlaps) return pos;
    }
    return null;
  }, [collisionGroups, cols, rectsOverlap, rows]);

  const computeDropTarget = useCallback((event, data) => {
    const base = computeDropPosition(event, data);
    if (!base) return null;
    const { rowSpan, colSpan } = base;
    const ignoreId = data?.type === 'vg-place' ? data.vgId : null;
    const candidate = findFirstFit(rowSpan, colSpan, ignoreId, base.row, base.col);
    if (candidate) {
      return { ...candidate, rowSpan, colSpan };
    }
    return { row: rows, col: 0, rowSpan, colSpan };
  }, [computeDropPosition, findFirstFit, rows]);

  const focusedLayout = useMemo(() => {
    if (!focusedVG) return null;
    return LAYOUTS[focusedVG.layoutId] || LAYOUTS.single;
  }, [focusedVG]);

  const focusedCells = useMemo(() => {
    if (!focusedVG?.position || !focusedLayout) return [];
    const padding = Math.max(4, Math.round(cellSize * 0.08));
    const internalGap = Math.max(2, Math.round(cellSize * 0.06));
    const width = focusedVG.position.colSpan * cellSize + (focusedVG.position.colSpan - 1) * renderGap;
    const height = focusedVG.position.rowSpan * cellSize + (focusedVG.position.rowSpan - 1) * renderGap;
    const innerW = width - padding * 2;
    const innerH = height - padding * 2;
    const filledCount = focusedSlots ? focusedSlots.filter(Boolean).length : 0;
    return getInternalCells(focusedLayout, innerW, innerH, filledCount, { padding, gap: internalGap });
  }, [focusedVG?.position, focusedLayout, cellSize, renderGap, focusedSlots]);

  return (
    <div
      ref={containerRef}
      className={`minimap ${panning.isDragging ? 'minimap--dragging' : ''} ${panning.canPan ? 'minimap--pannable' : ''} ${isDragOver ? 'minimap--drop-target' : ''}`}
      style={{
        '--cell-size': `${cellSize}px`,
        '--grid-gap': `${renderGap}px`,
        '--header-size': `${headerSize}px`,
        '--scroll-padding': `${MINIMAP_CONSTANTS.SCROLL_PADDING}px`,
      }}
      onDragEnter={(e) => {
        if (!onDropItem) return;
        const payload = parseDragPayload(e);
        if (payload && isViewPayload(payload)) return;
        setIsDragOver(true);
      }}
      onDragLeave={(e) => {
        if (!onDropItem) return;
        if (e.currentTarget.contains(e.relatedTarget)) return;
        setIsDragOver(false);
        setDropTarget(null);
      }}
      onDragOver={(e) => {
        if (!onDropItem) return;
        const payload = parseDragPayload(e);
        if (payload && isViewPayload(payload)) return;
        e.preventDefault();
        e.dataTransfer.dropEffect = payload?.type === 'vg-place' ? 'move' : 'copy';
        setIsDragOver(true);
        const data = payload || { type: 'unknown' };
        const target = computeDropTarget(e, data);
        setDropTarget(target);
      }}
      onDrop={(e) => {
        if (!onDropItem || !containerRef.current) return;
        e.preventDefault();
        const data = parseDragPayload(e);
        if (!data) return;
        if (isViewPayload(data)) return;

        const target = computeDropTarget(e, data);
        if (!target) return;

        onDropItem({ row: target.row, col: target.col, data });
        setIsDragOver(false);
        setDropTarget(null);
      }}
      {...panning.panProps}
    >
      {showGridLabels && (
        <div className="minimap__labels">
          <div
            className="minimap__labels-corner"
            style={{
              width: headerSize,
              height: headerSize,
              top: MINIMAP_CONSTANTS.SCROLL_PADDING,
              left: MINIMAP_CONSTANTS.SCROLL_PADDING,
            }}
          />
          <div
            className="minimap__labels-top"
            style={{
              left: MINIMAP_CONSTANTS.SCROLL_PADDING + headerSize,
              top: MINIMAP_CONSTANTS.SCROLL_PADDING,
              width: gridWidth,
            }}
          >
            <div
              className="minimap__labels-top-inner"
              style={{ transform: `translateX(${-panning.panOffset.x}px)` }}
            >
              {Array.from({ length: gridCols }).map((_, col) => {
                const isMajor = (col + 1) % 5 === 0;
                const isActive = col < cols;
  return (
                  <div
                    key={`col-${col}`}
                    className="minimap__col-header"
                    style={{
                      width: cellSize,
                      color: isMajor
                        ? '#f59e0b'
                        : isActive
                          ? 'rgba(148, 163, 184, 0.7)'
                          : 'rgba(71, 85, 105, 0.5)',
                      fontWeight: isMajor ? 600 : 400,
                    }}
                  >
                    {colToLetter(col)}
                  </div>
                );
              })}
            </div>
          </div>
          <div
            className="minimap__labels-left"
            style={{
              left: MINIMAP_CONSTANTS.SCROLL_PADDING,
              top: MINIMAP_CONSTANTS.SCROLL_PADDING + headerSize,
              height: gridHeight,
            }}
          >
            <div
              className="minimap__labels-left-inner"
              style={{ transform: `translateY(${-panning.panOffset.y}px)` }}
            >
              {Array.from({ length: gridRows }).map((_, row) => {
                const isMajor = (row + 1) % 5 === 0;
                const isActive = row < rows;
                return (
                  <div
                    key={`row-${row}`}
                    className="minimap__row-header"
                    style={{
                      height: cellSize,
                      color: isMajor
                        ? '#f59e0b'
                        : isActive
                          ? 'rgba(148, 163, 184, 0.7)'
                          : 'rgba(71, 85, 105, 0.5)',
                      fontWeight: isMajor ? 600 : 400,
                    }}
                  >
                    {row + 1}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Scrollable content wrapper */}
      <div
        className="minimap__scroll"
        style={{
          padding: `${MINIMAP_CONSTANTS.SCROLL_PADDING}px`,
          transform: `translate(${-panning.panOffset.x}px, ${-panning.panOffset.y}px)`,
        }}
      >
        {/* Field grid disabled to match spec (cleaner grid) */}
        {/* Link lines (Links mode, VG sub-tab) */}
        {mapMode === MAP_MODES.LINKS && showVGs && (
          <LinkLines
            links={vgLinks}
            getVGCenter={getVGCenter}
            highlightedLinkId={highlightedLinkId}
            onLinkClick={onLinkClick}
            showLabels={showGridLabels}
            labelOffset={headerSize}
          />
        )}

        {/* Grid with labels */}
        <div
          className="minimap__container"
          style={{
            paddingLeft: labelOffset,
            paddingTop: labelOffset,
          }}
        >
          {/* Main grid area */}
          <div className="minimap__grid-area">
            {/* Grid cells */}
            <div
              className="minimap__grid"
              style={{
                width: gridWidth,
                height: gridHeight,
              }}
            >
              <svg
                className="minimap__grid-lines"
                width={gridWidth}
                height={gridHeight}
                viewBox={`0 0 ${gridWidth} ${gridHeight}`}
                aria-hidden="true"
                shapeRendering="crispEdges"
              >
                {Array.from({ length: gridCols + 1 }).map((_, i) => {
                  const x = i * renderPitch + 0.5;
                  const isMajor = i > 0 && i % majorEvery === 0;
                  return (
                    <line
                      key={`v-${i}`}
                      x1={x}
                      y1={0}
                      x2={x}
                      y2={gridHeight}
                      stroke={isMajor ? majorLineColor : minorLineColor}
                      strokeWidth={isMajor ? 1 : 0.5}
                      strokeOpacity={isMajor ? 0.55 : 0.4}
                    />
                  );
                })}
                {Array.from({ length: gridRows + 1 }).map((_, i) => {
                  const y = i * renderPitch + 0.5;
                  const isMajor = i > 0 && i % majorEvery === 0;
                  return (
                    <line
                      key={`h-${i}`}
                      x1={0}
                      y1={y}
                      x2={gridWidth}
                      y2={y}
                      stroke={isMajor ? majorLineColor : minorLineColor}
                      strokeWidth={isMajor ? 1 : 0.5}
                      strokeOpacity={isMajor ? 0.55 : 0.4}
                    />
                  );
                })}
                <rect
                  x={0.5}
                  y={0.5}
                  width={cols * renderPitch}
                  height={rows * renderPitch}
                  fill="none"
                  stroke={canvasOutlineColor}
                  strokeWidth={1}
                  strokeDasharray="4 2"
                />
              </svg>

              <div className="minimap__grid-content">
                {dropTarget && (
                  <div
                    className="minimap__drop-target"
                    style={{
                      left: dropTarget.col * renderPitch,
                      top: dropTarget.row * renderPitch,
                      width: dropTarget.colSpan * cellSize + (dropTarget.colSpan - 1) * renderGap,
                      height: dropTarget.rowSpan * cellSize + (dropTarget.rowSpan - 1) * renderGap,
                    }}
                  />
                )}
                {/* VG Blocks (VG mode, or subtle outlines in VIEW mode) */}
                {showVGs && viewGroups.map(vg => {
                  if (!vg.position) return null;
                  const isSelected = selectedVGId === vg.id;
                  const isGhosted = mapMode === MAP_MODES.LINKS &&
                    highlightedLinkId &&
                    !highlightedLinkVGs.has(vg.id);
                  const isSubtle = showViews && showVGs;
                  const isFocused = focusedVG?.id === vg.id;
                  const allowInternals = mapMode === MAP_MODES.LAYOUT && showInternals;
                  const isDimmedByFocus = !!focusedVG && focusedVG.id !== vg.id;

                  return (
                    <VGBlock
                      key={vg.id}
                      vg={vg}
                      cellSize={cellSize}
                      gap={renderGap}
                      isSelected={isSelected}
                      isGhosted={isGhosted}
                      showInternals={allowInternals && (!focusedVG || focusedVG?.id === vg.id) && !isFocused}
                      subtle={isSubtle}
                      draggable={!isSubtle}
                      onDragStart={(e) => handleVGDragStart(e, vg)}
                      onDragEnd={handleVGDragEnd}
                      onClick={() => onVGClick(vg.id)}
                      onDoubleClick={() => onVGDoubleClick(vg.id)}
                      isEditMode={isEditMode}
                      onPointerDown={isEditMode ? handleVGPointerDown : undefined}
                      isBeingMoved={movingVG?.vg?.id === vg.id}
                      onRemove={isEditMode ? onRemoveVG : undefined}
                      changeStatus={getChangeStatus(vg.id)}
                      dimmed={isDimmedByFocus}
                    />
                  );
                })}

                {/* Ghost footprint during VG move in edit mode */}
                {moveGhost && (
                  <div
                    className="minimap__move-ghost"
                    style={{
                      left: moveGhost.col * renderPitch,
                      top: moveGhost.row * renderPitch,
                      width: moveGhost.colSpan * cellSize + (moveGhost.colSpan - 1) * renderGap,
                      height: moveGhost.rowSpan * cellSize + (moveGhost.rowSpan - 1) * renderGap,
                      '--ghost-color': moveGhost.color,
                    }}
                  />
                )}

                {/* Ghost outlines for removed VGs in edit mode */}
                {isEditMode && removedVGGhosts.map(ghost => (
                  <div
                    key={`removed-${ghost.id}`}
                    className="minimap__removed-ghost"
                    style={{
                      left: ghost.position.col * renderPitch,
                      top: ghost.position.row * renderPitch,
                      width: (ghost.position.colSpan || 1) * cellSize + ((ghost.position.colSpan || 1) - 1) * renderGap,
                      height: (ghost.position.rowSpan || 1) * cellSize + ((ghost.position.rowSpan || 1) - 1) * renderGap,
                      '--ghost-color': ghost.color || '#94a3b8',
                    }}
                  />
                ))}

                {/* Ghost outlines for moved VGs at original positions */}
                {isEditMode && movedVGGhosts.map((ghost) => (
                  <div
                    key={`moved-ghost-${ghost.id}`}
                    className="minimap__moved-ghost"
                    style={{
                      left: ghost.originalPosition.col * renderPitch,
                      top: ghost.originalPosition.row * renderPitch,
                      width: (ghost.originalPosition.colSpan || 1) * cellSize + ((ghost.originalPosition.colSpan || 1) - 1) * renderGap,
                      height: (ghost.originalPosition.rowSpan || 1) * cellSize + ((ghost.originalPosition.rowSpan || 1) - 1) * renderGap,
                    }}
                    title={`Original position of ${ghost.name || ghost.id}`}
                  />
                ))}

                {focusedVG?.position && focusedCells.length > 0 && (
                  <VGFocusedView
                    focusedVG={focusedVG}
                    focusedSlots={focusedSlots}
                    cells={focusedCells}
                    cellSize={cellSize}
                    renderGap={renderGap}
                    onRename={onFocusedVGRename}
                    onSlotDrop={onFocusedVGSlotDrop}
                    onSlotClear={onFocusedVGSlotClear}
                    onBackToCanvas={onBackFromFocus}
                    parseDragPayload={parseDragPayload}
                    isViewPayload={isViewPayload}
                    quickOps={quickOps}
                    onCellDragComplete={onCellDragComplete}
                    onCellAssign={onCellAssign}
                    onTargetingResolve={onTargetingResolve}
                  />
                )}

                {/* View Cells (View mode) */}
                {showViews && flattenedViews.map(view => (
                  <ViewCell
                    key={view.id}
                    view={view}
                    cellSize={cellSize}
                    gap={renderGap}
                    isSelected={selectedVGId === view.vgId}
                    onClick={() => onVGClick(view.vgId)}
                  />
                ))}

                {/* Viewport indicators */}
                {showViewports && (
                  mapMode === MAP_MODES.NAVIGATE ||
                  mapMode === MAP_MODES.LAYOUT ||
                  mapMode === MAP_MODES.TEAM
                ) && viewports.map(vp => (
                  <ViewportIndicator
                    key={vp.id}
                    viewport={vp}
                    cellSize={cellSize}
                    gap={renderGap}
                    isSelected={selectedViewportId === vp.id}
                  />
                ))}

                {/* Collaborator viewport indicators */}
                {showCollaborators && (
                  mapMode === MAP_MODES.NAVIGATE ||
                  mapMode === MAP_MODES.TEAM
                ) && collaborators.filter(c => c.isOnline && c.viewport).map(collab => (
                  <CollaboratorIndicator
                    key={collab.id}
                    collaborator={collab}
                    cellSize={cellSize}
                    gap={renderGap}
                    showName={mapMode === MAP_MODES.TEAM}
                  />
                ))}
              </div>
            </div>

            {/* Cursor indicators (overlaid on grid) */}
            {showCursors && mapMode === MAP_MODES.TEAM && (
              <div className="minimap__cursors">
                {collaboratorsWithCursors.map(collab => (
                  <CursorIndicator
                    key={`cursor-${collab.id}`}
                    collaborator={collab}
                    cellSize={cellSize}
                    gap={renderGap}
                    showName={false}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Panning indicator */}
      {panning.canPan && (
        <div className="minimap__pan-hint">
          <Icon name="move" size={12} />
          Drag to pan
        </div>
      )}
    </div>
  );
});

export default Minimap;
