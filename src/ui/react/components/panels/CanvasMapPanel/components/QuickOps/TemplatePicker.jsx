/**
 * @file TemplatePicker.jsx
 * @description Popover with layout templates split into "Fits Current Size" and "Requires Resize".
 */

import React, { memo, useMemo } from 'react';
import { LayoutThumbnail } from '@UI/react/components/atoms/LayoutThumbnail';
import { Tooltip } from '@UI/react/components/atoms/Tooltip';
import { LAYOUTS } from '../../utils/constants';

/**
 * TemplatePicker - layout template popover content
 *
 * Rendered inside a DropdownPortal which handles visibility,
 * positioning, and click-outside dismissal.
 *
 * @param {Object} props
 * @param {string} props.currentLayout - Current layout ID
 * @param {number} props.currentRows - Current VG row count
 * @param {number} props.currentCols - Current VG col count
 * @param {Function} props.onApply - Callback with layoutId
 * @param {Function} props.onClose - Close popover
 */
export const TemplatePicker = memo(function TemplatePicker({
  currentLayout,
  currentRows,
  currentCols,
  onApply,
  onClose,
}) {
  // Split layouts into two groups
  const { fits, requiresResize } = useMemo(() => {
    const fitsArr = [];
    const resizeArr = [];

    Object.entries(LAYOUTS).forEach(([id, layout]) => {
      const entry = { id, ...layout };
      if (layout.rows <= currentRows && layout.cols <= currentCols) {
        fitsArr.push(entry);
      } else {
        resizeArr.push(entry);
      }
    });

    return { fits: fitsArr, requiresResize: resizeArr };
  }, [currentRows, currentCols]);

  const renderEntry = (entry) => {
    const isCurrent = entry.id === currentLayout;
    const needsResize = entry.rows > currentRows || entry.cols > currentCols;
    const displayName = entry.id.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
    const tooltip = `${displayName} — ${entry.rows}×${entry.cols} grid (${entry.rows * entry.cols} cells)${
      isCurrent ? ' (current)' : ''
    }${needsResize ? ' ⚠ Requires resize' : ''}`;

    return (
      <Tooltip key={entry.id} content={tooltip} placement="top" delay={400}>
        <button
          type="button"
          className={`template-picker__item ${isCurrent ? 'template-picker__item--current' : ''}`}
          onClick={() => onApply(entry.id)}
          aria-label={tooltip}
        >
          <LayoutThumbnail
            layout={entry}
            size="md"
            highlighted={isCurrent}
          />
          <div className="template-picker__item-info">
            <span className="template-picker__item-label">
              {displayName}
            </span>
            <span className="template-picker__item-dims">
              {entry.rows}×{entry.cols}
            </span>
            {needsResize && (
              <span className="template-picker__item-badge">
                Resize
              </span>
            )}
          </div>
        </button>
      </Tooltip>
    );
  };

  return (
    <div className="template-picker">
      {fits.length > 0 && (
        <div className="template-picker__section">
          <div className="template-picker__section-title">Fits Current Size</div>
          <div className="template-picker__grid">
            {fits.map(renderEntry)}
          </div>
        </div>
      )}
      {requiresResize.length > 0 && (
        <div className="template-picker__section">
          <div className="template-picker__section-title">Requires Resize</div>
          <div className="template-picker__grid">
            {requiresResize.map(renderEntry)}
          </div>
        </div>
      )}
    </div>
  );
});

export default TemplatePicker;
