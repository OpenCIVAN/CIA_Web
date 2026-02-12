/**
 * @file DirectionPicker.jsx
 * @description Inline picker with two arrow buttons for directional selection.
 * Used by DimensionControls to pick expansion direction when ambiguous.
 */

import React, { memo } from 'react';
import { Icon } from '../Icon';
import './DirectionPicker.scss';

const AXIS_CONFIG = {
  row: {
    directions: ['up', 'down'],
    icons: { up: 'chevronUp', down: 'chevronDown' },
    className: 'direction-picker--vertical',
  },
  col: {
    directions: ['left', 'right'],
    icons: { left: 'chevronLeft', right: 'chevronRight' },
    className: 'direction-picker--horizontal',
  },
};

/**
 * DirectionPicker - two-button directional selector
 *
 * @param {Object} props
 * @param {'row'|'col'} props.axis - 'row' shows up/down, 'col' shows left/right
 * @param {Function} props.onSelect - Callback with 'left'|'right'|'up'|'down'
 * @param {string[]} [props.disabledDirections=[]] - Directions to disable
 * @param {Object} [props.labels] - Optional tooltip text per direction
 * @param {'sm'|'md'} [props.size='sm'] - Button size
 */
export const DirectionPicker = memo(function DirectionPicker({
  axis,
  onSelect,
  disabledDirections = [],
  labels = {},
  size = 'sm',
}) {
  const config = AXIS_CONFIG[axis];
  if (!config) return null;

  const iconSize = size === 'sm' ? 14 : 18;

  return (
    <div className={`direction-picker direction-picker--${size} ${config.className}`}>
      {config.directions.map((dir) => {
        const isDisabled = disabledDirections.includes(dir);
        return (
          <button
            key={dir}
            type="button"
            className={`direction-picker__btn ${isDisabled ? 'direction-picker__btn--disabled' : ''}`}
            disabled={isDisabled}
            title={labels[dir] || dir}
            onClick={() => onSelect(dir)}
          >
            <Icon name={config.icons[dir]} size={iconSize} />
          </button>
        );
      })}
    </div>
  );
});

export default DirectionPicker;
