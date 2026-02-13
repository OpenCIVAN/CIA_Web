/**
 * @file useMinimapCellSize.js
 * @description Hook for responsive minimap cell size calculation
 *
 * Calculates optimal cell size based on:
 * - Container dimensions
 * - Canvas grid size
 * - Zoom level
 * - Whether showing grid labels
 */

import { useMemo } from 'react';
import { MINIMAP_CONSTANTS } from '../utils/constants';

/**
 * useMinimapCellSize - Calculate responsive cell size
 *
 * @param {Object} options
 * @param {number} options.containerWidth - Available width in pixels
 * @param {number} options.containerHeight - Available height in pixels
 * @param {number} options.rows - Number of grid rows
 * @param {number} options.cols - Number of grid columns
 * @param {number} options.zoom - Zoom percentage (50-200)
 * @param {boolean} options.showLabels - Whether grid labels are shown
 * @param {Object} [options.focusedVG] - Focused VG (for responsive sizing)
 * @returns {Object} Cell sizing information
 */
export function useMinimapCellSize({
  containerWidth = 300,
  containerHeight = 300,
  rows = 4,
  cols = 4,
  zoom = 100,
  showLabels = true,
  focusedVG = null,
} = {}) {
  return useMemo(() => {
    const { GRID_GAP, HEADER_SIZE, SCROLL_PADDING, EXTRA_GRID_CELLS } = MINIMAP_CONSTANTS;
    const zoomScale = zoom / 100;
    const baseHeaderSize = Math.round(Math.max(12, Math.min(26, HEADER_SIZE * zoomScale)));
    const gridRows = (rows || 0) + (EXTRA_GRID_CELLS ?? 0);
    const rowDigits = Math.max(2, String(gridRows || 0).length);

    const computeSizing = (headerWidth, headerHeight) => {
      const labelOffsetX = showLabels ? headerWidth : 0;
      const labelOffsetY = showLabels ? headerHeight : 0;
      const padding = SCROLL_PADDING * 2;
      const availableWidth = Math.max(0, containerWidth - labelOffsetX - padding);
      const availableHeight = Math.max(0, containerHeight - labelOffsetY - padding);

      const effectiveCols = focusedVG?.position?.colSpan || cols || 1;
      const effectiveRows = focusedVG?.position?.rowSpan || rows || 1;

      // Calculate cell size that would fit focused VG or full grid
      const maxCellWidth = (availableWidth - (effectiveCols - 1) * GRID_GAP) / effectiveCols;
      const maxCellHeight = (availableHeight - (effectiveRows - 1) * GRID_GAP) / effectiveRows;
      const fitCellSize = Math.floor(Math.min(maxCellWidth, maxCellHeight));

      // Clamp between min and max sizes
      const baseSize = Math.min(55, Math.max(20, fitCellSize));

      // Apply zoom
      const cellSize = Math.floor(baseSize * zoomScale);

      // Calculate total content dimensions
      const contentWidth = cols * cellSize + (cols - 1) * GRID_GAP;
      const contentHeight = rows * cellSize + (rows - 1) * GRID_GAP;

      // Determine if content overflows (needs panning)
      const overflowsWidth = contentWidth > availableWidth;
      const overflowsHeight = contentHeight > availableHeight;
      const needsPanning = overflowsWidth || overflowsHeight;

      // Calculate how much the content is scaled relative to fitting
      const scaleFactor = fitCellSize > 0 ? cellSize / fitCellSize : 1;

      return {
        cellSize,
        contentWidth,
        contentHeight,
        totalWidth: contentWidth + labelOffsetX,
        totalHeight: contentHeight + labelOffsetY,
        availableWidth,
        availableHeight,
        overflowsWidth,
        overflowsHeight,
        needsPanning,
        fitCellSize,
        scaleFactor,
        labelOffsetX,
        labelOffsetY,
      };
    };

    const deriveHeaders = (cellSize) => {
      const nextLabelFontSize = Math.round(Math.max(7, Math.min(12, cellSize * 0.38)));
      const nextHeaderHeight = Math.round(Math.max(12, Math.min(24, nextLabelFontSize + 6)));
      const digitsWidth = nextLabelFontSize * 0.6 * rowDigits;
      const nextHeaderWidth = Math.round(Math.max(16, Math.min(32, digitsWidth + 10)));
      return { nextLabelFontSize, nextHeaderWidth, nextHeaderHeight };
    };

    let headerWidth = baseHeaderSize;
    let headerHeight = baseHeaderSize;
    let sizing = computeSizing(headerWidth, headerHeight);
    let labelFontSize = Math.round(Math.max(7, Math.min(12, sizing.cellSize * 0.38)));

    for (let i = 0; i < 3; i += 1) {
      const { nextLabelFontSize, nextHeaderWidth, nextHeaderHeight } = deriveHeaders(sizing.cellSize);
      labelFontSize = nextLabelFontSize;
      headerWidth = nextHeaderWidth;
      headerHeight = nextHeaderHeight;
      sizing = computeSizing(headerWidth, headerHeight);
    }

    return {
      // Cell dimensions
      cellSize: sizing.cellSize,
      gap: GRID_GAP,
      headerWidth,
      headerHeight,
      labelFontSize,

      // Content dimensions
      contentWidth: sizing.contentWidth,
      contentHeight: sizing.contentHeight,
      totalWidth: sizing.totalWidth,
      totalHeight: sizing.totalHeight,

      // Available space
      availableWidth: sizing.availableWidth,
      availableHeight: sizing.availableHeight,

      // Overflow state
      overflowsWidth: sizing.overflowsWidth,
      overflowsHeight: sizing.overflowsHeight,
      needsPanning: sizing.needsPanning,

      // Fit calculations
      fitCellSize: sizing.fitCellSize,
      scaleFactor: sizing.scaleFactor,

      // Whether content fits without scrolling
      fitsInView: !sizing.needsPanning,
    };
  }, [containerWidth, containerHeight, rows, cols, zoom, showLabels, focusedVG]);
}

export default useMinimapCellSize;
