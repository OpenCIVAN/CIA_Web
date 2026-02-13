/**
 * @file ModeTabs.jsx
 * @description Mode tabs for Canvas Map Panel
 *
 * Horizontal tab bar for switching between Viewports, Layout, and Team modes.
 */

import React, { memo } from 'react';
import { Icon } from '@UI/react/components/atoms/Icon';
import { Tooltip } from '@UI/react/components/atoms/Tooltip';
import { useAdaptive } from '@UI/react/context/AdaptiveContext';
import { MODE_CONFIG } from '../../utils/constants';
import './ModeTabs.scss';

/**
 * ModeTabs - Mode switching tabs
 *
 * @param {Object} props
 * @param {string} props.activeMode - Current active mode
 * @param {Function} props.onModeChange - Mode change handler
 * @param {string} [props.sizeMode='standard'] - Size mode for responsiveness
 */
export const ModeTabs = memo(function ModeTabs({
  activeMode,
  onModeChange,
  sizeMode = 'standard',
}) {
  const { isVR } = useAdaptive();
  const isCompact = sizeMode === 'compact';

  return (
    <div className="mode-tabs" data-vr={isVR} data-size-mode={sizeMode}>
      {Object.values(MODE_CONFIG).map(mode => (
        <Tooltip key={mode.id} content={mode.description} placement="bottom" delay={400}>
          <button
            className={`mode-tabs__tab ${activeMode === mode.id ? 'mode-tabs__tab--active' : ''}`}
            style={{ '--mode-color': `var(--accent-${mode.color})` }}
            onClick={() => onModeChange(mode.id)}
            type="button"
            aria-label={mode.name}
          >
            <Icon name={mode.icon} size={isCompact ? 14 : 15} />
            {!isCompact && <span className="mode-tabs__label">{mode.name}</span>}
          </button>
        </Tooltip>
      ))}
    </div>
  );
});

export default ModeTabs;
