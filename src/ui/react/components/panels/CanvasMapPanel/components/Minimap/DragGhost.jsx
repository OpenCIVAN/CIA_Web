/**
 * @file DragGhost.jsx
 * @description Semi-transparent ghost card that follows cursor during cell drag.
 *
 * Rendered via createPortal to document.body.
 */

import React from 'react';
import { createPortal } from 'react-dom';
import { Icon } from '@UI/react/components/atoms/Icon';
import { VIEW_TYPES } from '../../utils/constants';

/**
 * @param {Object} props
 * @param {Object} props.view - View data (name, type)
 * @param {string} props.vgColor - VG color for border accent
 * @param {number} props.x - Client X position
 * @param {number} props.y - Client Y position
 * @param {number} [props.width=80] - Ghost width
 * @param {number} [props.height=40] - Ghost height
 */
export function DragGhost({ view, vgColor, x, y, width = 80, height = 40 }) {
  if (!view) return null;

  const viewType = VIEW_TYPES[view.type] || null;

  const ghost = (
    <div
      className="minimap__drag-ghost"
      style={{
        position: 'fixed',
        left: x - width / 2,
        top: y - height / 2,
        width,
        height,
        borderColor: vgColor || 'var(--color-accent-cyan)',
        '--ghost-color': vgColor,
        pointerEvents: 'none',
        zIndex: 99999,
        opacity: 0.75,
      }}
    >
      {viewType && <Icon name={viewType.icon} size={12} />}
      <span className="minimap__drag-ghost-name">{view.name || 'View'}</span>
    </div>
  );

  return createPortal(ghost, document.body);
}

export default DragGhost;
