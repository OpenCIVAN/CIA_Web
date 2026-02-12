/**
 * @file CellContextMenu.jsx
 * @description Right-click context menu for focused VG cells.
 *
 * Portaled to document.body with fixed positioning.
 * Follows ViewItemContextMenu pattern.
 */

import React, { useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { Icon } from '@UI/react/components/atoms/Icon';
import './CellContextMenu.scss';

// =============================================================================
// MENU ITEM
// =============================================================================

function MenuItem({ icon, label, primary, danger, disabled, onClick }) {
  return (
    <button
      className={[
        'cell-context-menu__item',
        primary && 'cell-context-menu__item--primary',
        danger && 'cell-context-menu__item--danger',
        disabled && 'cell-context-menu__item--disabled',
      ].filter(Boolean).join(' ')}
      onClick={disabled ? undefined : onClick}
      disabled={disabled}
    >
      <Icon name={icon} size={14} />
      <span>{label}</span>
    </button>
  );
}

function Divider() {
  return <div className="cell-context-menu__divider" />;
}

// =============================================================================
// MAIN COMPONENT
// =============================================================================

/**
 * @param {Object} props
 * @param {Object|null} props.view - View in this cell (null if empty)
 * @param {Object} props.cell - Cell geometry data
 * @param {{x:number,y:number}} props.position - Menu position (client coords)
 * @param {string} props.vgColor - VG color for header dot
 * @param {string} props.vgName - VG name for header
 * @param {boolean} props.isMerged - Whether cell is merged
 * @param {Function} props.onClose - Close handler
 * @param {Function} props.onSwapWith - Enter swap targeting
 * @param {Function} props.onMoveTo - Enter move targeting
 * @param {Function} props.onDuplicateTo - Enter clone targeting
 * @param {Function} props.onRemove - Remove view from cell
 * @param {Function} props.onAssignView - Open CompanionPanel assignment
 * @param {Function} props.onSplitCell - Split merged cell
 */
export function CellContextMenu({
  view,
  cell,
  position,
  vgColor,
  vgName,
  isMerged,
  onClose,
  onSwapWith,
  onMoveTo,
  onDuplicateTo,
  onRemove,
  onAssignView,
  onSplitCell,
}) {
  const menuRef = useRef(null);

  const getMenuPosition = useCallback(() => {
    if (!position) return { left: 0, top: 0 };

    const menuWidth = 200;
    const menuHeight = view ? 220 : 100;

    let left = position.x;
    let top = position.y;

    if (left + menuWidth > window.innerWidth - 8) {
      left = window.innerWidth - menuWidth - 8;
    }
    if (top + menuHeight > window.innerHeight - 8) {
      top = window.innerHeight - menuHeight - 8;
    }

    return { left: Math.max(8, left), top: Math.max(8, top) };
  }, [position, view]);

  // Close on mousedown outside + Escape
  useEffect(() => {
    const handleMouseDown = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        onClose?.();
      }
    };
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        onClose?.();
      }
    };

    document.addEventListener('mousedown', handleMouseDown);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleMouseDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [onClose]);

  const menuStyle = getMenuPosition();

  const menuContent = (
    <div
      ref={menuRef}
      className="cell-context-menu"
      style={{
        position: 'fixed',
        left: menuStyle.left,
        top: menuStyle.top,
      }}
    >
      {/* Header */}
      <div className="cell-context-menu__header">
        <div
          className="cell-context-menu__color-dot"
          style={{ background: vgColor || 'var(--color-accent-primary)' }}
        />
        <span className="cell-context-menu__title">
          {view ? (view.name || 'Unnamed View') : 'Empty Cell'}
        </span>
      </div>

      <Divider />

      {view ? (
        <>
          {/* Occupied cell menu */}
          <MenuItem icon="swapHoriz" label="Swap with..." onClick={() => { onSwapWith?.(); onClose?.(); }} />
          <MenuItem icon="move" label="Move to empty..." onClick={() => { onMoveTo?.(); onClose?.(); }} />
          <MenuItem icon="copy" label="Duplicate to cell..." onClick={() => { onDuplicateTo?.(); onClose?.(); }} />
          <Divider />
          <MenuItem icon="link2" label="Quick Link" disabled />
          <Divider />
          <MenuItem icon="close" label="Remove from cell" danger onClick={() => { onRemove?.(); onClose?.(); }} />
        </>
      ) : (
        <>
          {/* Empty cell menu */}
          <MenuItem icon="plus" label="Assign View..." primary onClick={() => { onAssignView?.(); onClose?.(); }} />
          <MenuItem icon="clipboard" label="Paste view" disabled />
        </>
      )}

      {/* Merged cell append */}
      {isMerged && (
        <>
          <Divider />
          <MenuItem icon="layers" label="Split cell" onClick={() => { onSplitCell?.(); onClose?.(); }} />
        </>
      )}
    </div>
  );

  return createPortal(menuContent, document.body);
}

export default CellContextMenu;
