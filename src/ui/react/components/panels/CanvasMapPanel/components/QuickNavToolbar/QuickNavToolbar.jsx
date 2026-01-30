/**
 * @file QuickNavToolbar.jsx
 * @description Side quick navigation toolbar for Canvas Map Panel
 *
 * Vertical toolbar with quick actions:
 * - Home (go to home position)
 * - Set Home (set current position as home)
 * - Fit All (zoom to fit all content)
 * - Bookmark (add current position as bookmark)
 */

import React, { memo } from 'react';
import { Icon } from '@UI/react/components/atoms/Icon';
import { useAdaptive } from '@UI/react/context/AdaptiveContext';
import './QuickNavToolbar.scss';

/**
 * QuickNav button component
 */
const QuickNavBtn = memo(function QuickNavBtn({
  icon,
  label,
  onClick,
  active,
  disabled,
}) {
  const { isVR } = useAdaptive();

  return (
    <button
      className={`quick-nav-toolbar__btn ${active ? 'quick-nav-toolbar__btn--active' : ''}`}
      onClick={onClick}
      disabled={disabled}
      title={label}
      type="button"
      data-vr={isVR}
    >
      <Icon name={icon} size={isVR ? 20 : 16} />
    </button>
  );
});

/**
 * QuickNavToolbar - Side quick navigation toolbar
 *
 * @param {Object} props
 * @param {Function} props.onGoHome - Navigate to home position
 * @param {Function} props.onSetHome - Set current position as home
 * @param {Function} props.onFitAll - Fit all content in view
 * @param {Function} props.onAddBookmark - Add bookmark at current position
 * @param {string} [props.position='left'] - Toolbar position ('left' or 'right')
 */
export const QuickNavToolbar = memo(function QuickNavToolbar({
  onGoHome,
  onSetHome,
  onFitAll,
  onAddBookmark,
  position = 'left',
}) {
  return (
    <div className={`quick-nav-toolbar quick-nav-toolbar--${position}`}>
      {/* Navigation group */}
      <div className="quick-nav-toolbar__group">
        <QuickNavBtn
          icon="home"
          label="Go to Home"
          onClick={onGoHome}
        />
        <QuickNavBtn
          icon="crosshair"
          label="Set Home Here"
          onClick={onSetHome}
        />
        <QuickNavBtn
          icon="scan"
          label="Fit All"
          onClick={onFitAll}
        />
      </div>

      {/* Bookmark */}
      <div className="quick-nav-toolbar__group">
        <QuickNavBtn
          icon="bookmarkPlus"
          label="Add Bookmark"
          onClick={onAddBookmark}
        />
      </div>

    </div>
  );
});

export default QuickNavToolbar;
