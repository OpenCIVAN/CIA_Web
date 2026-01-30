/**
 * @file GridPaperBackground.jsx
 * @description SVG grid-paper background with minor/major lines
 */

import React, { memo, useId } from 'react';

/**
 * GridPaperBackground - SVG pattern grid
 *
 * @param {Object} props
 * @param {number} props.width - Grid width in pixels
 * @param {number} props.height - Grid height in pixels
 * @param {number} props.cellSize - Cell size in pixels
 * @param {number} props.gap - Gap size in pixels
 * @param {number} [props.majorEvery=5] - Major grid interval (in cells)
 * @param {boolean} [props.show=true] - Whether to render
 */
export const GridPaperBackground = memo(function GridPaperBackground({
  width,
  height,
  cellSize,
  gap,
  majorEvery = 5,
  show = true,
}) {
  const uid = useId();
  if (!show || width <= 0 || height <= 0) return null;

  const pitch = cellSize + gap;
  const majorPitch = pitch * majorEvery;
  const minorId = `minimap-minor-${uid}`;
  const majorId = `minimap-major-${uid}`;

  return (
    <svg
      className="minimap__grid-paper"
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      aria-hidden="true"
    >
      <defs>
        <pattern
          id={minorId}
          width={pitch}
          height={pitch}
          patternUnits="userSpaceOnUse"
        >
          <path
            d={`M ${pitch} 0 L 0 0 0 ${pitch}`}
            stroke="rgba(96, 165, 250, 0.06)"
            strokeWidth="0.5"
          />
        </pattern>
        <pattern
          id={majorId}
          width={majorPitch}
          height={majorPitch}
          patternUnits="userSpaceOnUse"
        >
          <rect width={majorPitch} height={majorPitch} fill={`url(#${minorId})`} />
          <path
            d={`M ${majorPitch} 0 L 0 0 0 ${majorPitch}`}
            stroke="rgba(96, 165, 250, 0.12)"
            strokeWidth="1"
          />
        </pattern>
      </defs>
      <rect width={width} height={height} fill={`url(#${majorId})`} />
    </svg>
  );
});

export default GridPaperBackground;
