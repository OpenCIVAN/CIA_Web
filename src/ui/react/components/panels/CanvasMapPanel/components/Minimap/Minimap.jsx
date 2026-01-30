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

import React, { memo, useMemo, useRef, useCallback } from 'react';
import { MinimapGrid } from './MinimapGrid';
import { VGBlock } from './VGBlock';
import { ViewCell } from './ViewCell';
import { ViewportIndicator } from './ViewportIndicator';
import { CollaboratorIndicator } from './CollaboratorIndicator';
import { CursorIndicator } from './CursorIndicator';
import { LinkLines } from './LinkLines';
import { GridPaperBackground } from './GridPaperBackground';
import { useMinimapPanning } from '../../hooks/useMinimapPanning';
import { useMinimapCellSize } from '../../hooks/useMinimapCellSize';
import { DISPLAY_MODES, MAP_MODES } from '../../utils/constants';
import { colToLetter, getGridCenter } from '../../utils/gridUtils';
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
  displayMode,
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

  // Container dimensions
  containerWidth,
  containerHeight,

  // Focus state
  focusedVG,
}) {
  const { rows, cols, homePosition } = canvas;
  const containerRef = useRef(null);

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

  const { cellSize, gap, contentWidth, contentHeight, headerSize } = sizing;
  const gridWidth = cols * cellSize + (cols - 1) * gap;
  const gridHeight = rows * cellSize + (rows - 1) * gap;

  // Panning support
  const panning = useMinimapPanning({
    contentWidth: contentWidth + (showGridLabels ? headerSize : 0) + 32,
    contentHeight: contentHeight + (showGridLabels ? headerSize : 0) + 32,
    viewportWidth: containerWidth || 300,
    viewportHeight: containerHeight || 300,
    enabled: sizing.needsPanning,
  });

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
      gap
    );
  }, [viewGroups, cellSize, gap]);

  // Collaborators with cursor data for cursor indicators
  const collaboratorsWithCursors = useMemo(() => {
    return collaborators.filter(c => c.isOnline && c.cursor && (c.showCursor ?? true));
  }, [collaborators]);

  return (
    <div
      ref={containerRef}
      className={`minimap ${panning.isDragging ? 'minimap--dragging' : ''} ${panning.canPan ? 'minimap--pannable' : ''}`}
      style={{
        '--cell-size': `${cellSize}px`,
        '--grid-gap': `${gap}px`,
      }}
      {...panning.panProps}
    >
      {/* Scrollable content wrapper */}
      <div
        className="minimap__scroll"
        style={{
          transform: `translate(${-panning.panOffset.x}px, ${-panning.panOffset.y}px)`,
        }}
      >
        {/* Link lines (Links mode, VG sub-tab) */}
        {mapMode === MAP_MODES.LINKS && displayMode === DISPLAY_MODES.VG && (
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
        <div className="minimap__container">
          {/* Column headers (A, B, C...) */}
          {showGridLabels && (
            <div className="minimap__col-headers">
              {Array.from({ length: cols }).map((_, col) => (
                <div
                  key={`col-${col}`}
                  className="minimap__col-header"
                  style={{ width: cellSize }}
                >
                  {colToLetter(col)}
                </div>
              ))}
            </div>
          )}

          {/* Main grid area */}
          <div className="minimap__grid-area">
            {/* Row labels (1, 2, 3...) */}
            {showGridLabels && (
              <div className="minimap__row-headers">
                {Array.from({ length: rows }).map((_, row) => (
                  <div
                    key={`row-${row}`}
                    className="minimap__row-header"
                    style={{ height: cellSize }}
                  >
                    {row + 1}
                  </div>
                ))}
              </div>
            )}

            {/* Grid cells */}
            <div
              className="minimap__grid"
              style={{
                gridTemplateColumns: `repeat(${cols}, ${cellSize}px)`,
                gridTemplateRows: `repeat(${rows}, ${cellSize}px)`,
              }}
            >
              <GridPaperBackground
                width={gridWidth}
                height={gridHeight}
                cellSize={cellSize}
                gap={gap}
                show={showGridLabels}
                majorEvery={5}
              />
              {/* Background cells */}
              {Array.from({ length: rows * cols }).map((_, i) => {
                const row = Math.floor(i / cols);
                const col = i % cols;
                const isHome = displayMode === DISPLAY_MODES.VG &&
                  row === homePosition?.row &&
                  col === homePosition?.col;
                const bookmark = displayMode === DISPLAY_MODES.VG
                  ? bookmarks.find(b => b.position.row === row && b.position.col === col)
                  : null;

                return (
                  <div
                    key={`cell-${row}-${col}`}
                    className="minimap__cell"
                  >
                    {isHome && mapMode === MAP_MODES.NAVIGATE && (
                      <span className="minimap__home-icon">⌂</span>
                    )}
                    {bookmark && mapMode === MAP_MODES.NAVIGATE && showBookmarks && (
                      <span className="minimap__bookmark-icon">★</span>
                    )}
                  </div>
                );
              })}

              {/* VG Blocks (VG mode) */}
              {displayMode === DISPLAY_MODES.VG && viewGroups.map(vg => {
                if (!vg.position) return null;
                const isSelected = selectedVGId === vg.id;
                const isGhosted = mapMode === MAP_MODES.LINKS &&
                  highlightedLinkId &&
                  !highlightedLinkVGs.has(vg.id);

                return (
                  <VGBlock
                    key={vg.id}
                    vg={vg}
                    cellSize={cellSize}
                    gap={gap}
                    isSelected={isSelected}
                    isGhosted={isGhosted}
                    showInternals={mapMode === MAP_MODES.LAYOUT && showInternals}
                    onClick={() => onVGClick(vg.id)}
                    onDoubleClick={() => onVGDoubleClick(vg.id)}
                  />
                );
              })}

              {/* View Cells (View mode) */}
              {displayMode === DISPLAY_MODES.VIEW && flattenedViews.map(view => (
                <ViewCell
                  key={view.id}
                  view={view}
                  cellSize={cellSize}
                  gap={gap}
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
                  gap={gap}
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
                  gap={gap}
                  showName={mapMode === MAP_MODES.TEAM}
                />
              ))}
            </div>

            {/* Cursor indicators (overlaid on grid) */}
            {showCursors && mapMode === MAP_MODES.TEAM && (
              <div className="minimap__cursors">
                {collaboratorsWithCursors.map(collab => (
                  <CursorIndicator
                    key={`cursor-${collab.id}`}
                    collaborator={collab}
                    cellSize={cellSize}
                    gap={gap}
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
          Drag to pan
        </div>
      )}
    </div>
  );
});

export default Minimap;
