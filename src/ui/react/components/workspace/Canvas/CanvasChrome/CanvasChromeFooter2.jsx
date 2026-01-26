// src/ui/react/components/workspace/Canvas/CanvasChrome/CanvasChromeFooter2.jsx
// Footer 2 - Canvas controls bar per Canvas Chrome spec.

import React, { memo, useMemo, useRef, useState, useEffect } from 'react';
import { Icon } from '@UI/react/components/atoms';
import { DropdownPortal } from '@UI/react/components/atoms/DropdownPortal';
import { formatGridPosition } from '@UI/react/utils/gridPosition';
import './CanvasChromeFooter2.scss';

const BREAKPOINTS = {
    LINKS_COMPACT: 855,
    FOOTER_WRAP: 650,
};

const LINK_TYPES = [
    { id: 'camera', label: 'Camera', icon: 'eye', color: 'teal', linkKey: 'camera' },
    { id: 'filters', label: 'Filters', icon: 'filter', color: 'purple', linkKey: 'filters' },
    { id: 'widgets', label: 'Widgets', icon: 'layout', color: 'amber', linkKey: 'widgets' },
    { id: 'cursors', label: 'Cursors', icon: 'crosshair', color: 'cyan', linkKey: 'cursors' },
    { id: 'annotations', label: 'Annotations', icon: 'edit', color: 'pink', linkKey: 'annotationDisplay' },
];

const isLinkActive = (link) => {
    if (!link) return false;
    if (Array.isArray(link.targets)) return link.targets.length > 0;
    if (Array.isArray(link.targetIds)) return link.targetIds.length > 0;
    if (link.targetId) return true;
    if (link.target) return true;
    if (typeof link === 'boolean') return link;
    return true;
};

const FooterSection = memo(function FooterSection({ label, color, children }) {
    const colorClass = color ? `canvas-footer2__label--${color}` : '';
    return (
        <div className="canvas-footer2__section">
            <div className={`canvas-footer2__label ${colorClass}`}>{label}</div>
            <div className="canvas-footer2__content">
                {children}
            </div>
        </div>
    );
});

const IconButton = memo(function IconButton({ icon, title, active, color, onClick, disabled }) {
    const colorClass = color ? `canvas-footer2__icon-btn--${color}` : '';
    return (
        <button
            type="button"
            className={`canvas-footer2__icon-btn ${colorClass} ${active ? 'is-active' : ''}`}
            title={title}
            aria-label={title}
            onClick={onClick}
            disabled={disabled}
        >
            <Icon name={icon} size={14} />
        </button>
    );
});

export const CanvasChromeFooter2 = memo(function CanvasChromeFooter2({
    canvasSize = { cols: 1, rows: 1 },
    viewportSize = { cols: 1, rows: 1 },
    viewportPosition = { col: 0, row: 0 },
    containerWidth,
    links,
    onUpdateLink,
    onOpenLinkManager,
    onMoveViewport,
    onHome,
    onOpenNavigator,
    onToggleFocus,
    onOpenViewList,
    onSnapshot,
    onResetView,
    onCopyView,
    onOpenSettings,
    visibility = true,
    onToggleVisibility,
    orientation = true,
    onToggleOrientation,
    overlays = false,
    onToggleOverlays,
    isVRAvailable = false,
    isInVR = false,
    onToggleVR,
    className = '',
}) {
    const [linksOpen, setLinksOpen] = useState(false);
    const linksTriggerRef = useRef(null);

    const [localVisibility, setLocalVisibility] = useState(visibility);
    const [localOrientation, setLocalOrientation] = useState(orientation);
    const [localOverlays, setLocalOverlays] = useState(overlays);

    useEffect(() => setLocalVisibility(visibility), [visibility]);
    useEffect(() => setLocalOrientation(orientation), [orientation]);
    useEffect(() => setLocalOverlays(overlays), [overlays]);

    const effectiveVisibility = onToggleVisibility ? visibility : localVisibility;
    const effectiveOrientation = onToggleOrientation ? orientation : localOrientation;
    const effectiveOverlays = onToggleOverlays ? overlays : localOverlays;

    const handleToggle = (current, externalSetter, localSetter) => {
        const next = !current;
        if (externalSetter) {
            externalSetter(next);
        } else {
            localSetter(next);
        }
    };

    const handleToggleLink = (linkType) => {
        const linkValue = links?.[linkType.linkKey];
        const active = isLinkActive(linkValue);

        if (active) {
            onUpdateLink?.(linkType.linkKey, null);
            return;
        }

        if (onOpenLinkManager) {
            onOpenLinkManager(linkType);
            return;
        }

        window.dispatchEvent(new CustomEvent('cia:open-view-link-manager'));
    };

    const computedWidth = Number.isFinite(containerWidth) ? containerWidth : 0;
    const linksCompact = computedWidth > 0 && computedWidth < BREAKPOINTS.LINKS_COMPACT;

    const linkStates = useMemo(() => {
        return LINK_TYPES.map((type) => ({
            ...type,
            active: isLinkActive(links?.[type.linkKey]),
        }));
    }, [links]);

    const activeLinkCount = useMemo(() => (
        linkStates.filter((type) => type.active).length
    ), [linkStates]);

    const viewportLabel = useMemo(() => {
        return formatGridPosition(viewportPosition?.col || 0, viewportPosition?.row || 0);
    }, [viewportPosition?.col, viewportPosition?.row]);

    const rows = Math.max(canvasSize?.rows || 1, 1);
    const cols = Math.max(canvasSize?.cols || 1, 1);
    const viewportRows = Math.max(viewportSize?.rows || 1, 1);
    const viewportCols = Math.max(viewportSize?.cols || 1, 1);
    const viewportRow = Math.max(viewportPosition?.row || 0, 0);
    const viewportCol = Math.max(viewportPosition?.col || 0, 0);

    const canMoveUp = viewportRow > 0;
    const canMoveDown = viewportRow + viewportRows < rows;
    const canMoveLeft = viewportCol > 0;
    const canMoveRight = viewportCol + viewportCols < cols;

    const renderMiniGrid = () => {
        const previewRows = Math.min(rows, 4);
        const previewCols = Math.min(cols, 6);
        const rowScale = previewRows / rows;
        const colScale = previewCols / cols;
        const viewRowStart = Math.floor(viewportRow * rowScale);
        const viewColStart = Math.floor(viewportCol * colScale);
        const viewRowSpan = Math.max(1, Math.round(viewportRows * rowScale));
        const viewColSpan = Math.max(1, Math.round(viewportCols * colScale));
        const viewRowEnd = Math.min(previewRows, viewRowStart + viewRowSpan);
        const viewColEnd = Math.min(previewCols, viewColStart + viewColSpan);

        const cells = [];
        for (let r = 0; r < previewRows; r += 1) {
            for (let c = 0; c < previewCols; c += 1) {
                const isInViewport =
                    r >= viewRowStart &&
                    r < viewRowEnd &&
                    c >= viewColStart &&
                    c < viewColEnd;
                cells.push(
                    <span
                        key={`${r}-${c}`}
                        className={`canvas-footer2__mini-cell ${isInViewport ? 'is-viewport' : ''}`}
                    />
                );
            }
        }

        return (
            <button
                type="button"
                className="canvas-footer2__mini-grid"
                style={{ '--grid-cols': previewCols }}
                onClick={onOpenNavigator}
                title="Open Navigator"
            >
                {cells}
            </button>
        );
    };

    return (
        <div className={`canvas-footer2 ${className}`}>
            <FooterSection label="Focus" color="cyan">
                <div className="canvas-footer2__group">
                    <IconButton icon="maximize" title="Focus View" onClick={onToggleFocus} />
                    <IconButton icon="list" title="View List" onClick={onOpenViewList} />
                </div>
            </FooterSection>

            <FooterSection label="Actions" color="amber">
                <div className="canvas-footer2__group">
                    <IconButton icon="camera" title="Snapshot" onClick={onSnapshot} />
                    <IconButton icon="rotateCcw" title="Reset View" onClick={onResetView} />
                    <IconButton icon="copy" title="Copy" onClick={onCopyView} />
                    <IconButton icon="settings" title="Settings" onClick={onOpenSettings} />
                </div>
            </FooterSection>

            <FooterSection label="Display" color="blue">
                <div className="canvas-footer2__group">
                    <IconButton
                        icon="eye"
                        title="Visibility"
                        active={effectiveVisibility}
                        onClick={() => handleToggle(effectiveVisibility, onToggleVisibility, setLocalVisibility)}
                    />
                    <IconButton
                        icon="cube"
                        title="Orientation"
                        active={effectiveOrientation}
                        onClick={() => handleToggle(effectiveOrientation, onToggleOrientation, setLocalOrientation)}
                    />
                    <IconButton
                        icon="layers"
                        title="Overlays"
                        active={effectiveOverlays}
                        onClick={() => handleToggle(effectiveOverlays, onToggleOverlays, setLocalOverlays)}
                    />
                </div>
            </FooterSection>

            <div className="canvas-footer2__break" />

            <FooterSection label="Navigator" color="teal">
                <div className="canvas-footer2__group canvas-footer2__group--navigator">
                    {renderMiniGrid()}
                    <IconButton
                        icon="home"
                        title="Home (A1)"
                        active={!canMoveUp && !canMoveLeft}
                        onClick={onHome}
                    />
                    <div className="canvas-footer2__nav-buttons">
                        <IconButton
                            icon="arrowLeft"
                            title="Move Left"
                            disabled={!canMoveLeft}
                            onClick={() => onMoveViewport?.(0, -1)}
                        />
                        <IconButton
                            icon="arrowUp"
                            title="Move Up"
                            disabled={!canMoveUp}
                            onClick={() => onMoveViewport?.(-1, 0)}
                        />
                        <IconButton
                            icon="arrowDown"
                            title="Move Down"
                            disabled={!canMoveDown}
                            onClick={() => onMoveViewport?.(1, 0)}
                        />
                        <IconButton
                            icon="arrowRight"
                            title="Move Right"
                            disabled={!canMoveRight}
                            onClick={() => onMoveViewport?.(0, 1)}
                        />
                    </div>
                    <span className="canvas-footer2__position">{viewportLabel}</span>
                </div>
            </FooterSection>

            <FooterSection label="Links" color="purple">
                <div className="canvas-footer2__group">
                    {linksCompact ? (
                        <button
                            type="button"
                            ref={linksTriggerRef}
                            className="canvas-footer2__links-compact"
                            onClick={() => setLinksOpen((prev) => !prev)}
                            aria-expanded={linksOpen}
                        >
                            <Icon name="link" size={14} />
                            <span className="canvas-footer2__links-count">{activeLinkCount}</span>
                        </button>
                    ) : (
                        <div className="canvas-footer2__links">
                            {linkStates.map((link) => (
                                <button
                                    key={link.id}
                                    type="button"
                                    className={`canvas-footer2__link-btn ${link.active ? 'is-active' : ''}`}
                                    style={{ '--link-color': `var(--color-accent-${link.color})` }}
                                    onClick={() => handleToggleLink(link)}
                                    title={link.label}
                                >
                                    <Icon name={link.icon} size={14} />
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            </FooterSection>

            {isVRAvailable && (
                <FooterSection label="VR" color="purple">
                    <div className="canvas-footer2__group">
                        <IconButton
                            icon="vrHeadset"
                            title={isInVR ? 'Exit VR' : 'Send to VR'}
                            active={isInVR}
                            color="purple"
                            onClick={onToggleVR}
                        />
                    </div>
                </FooterSection>
            )}

            <DropdownPortal
                open={linksCompact && linksOpen}
                onClose={() => setLinksOpen(false)}
                triggerRef={linksTriggerRef}
                align="center"
                position="top"
                offset={8}
                className="canvas-footer2__links-popover"
            >
                <div className="canvas-footer2__links-panel">
                    <div className="canvas-footer2__links-panel-header">
                        <Icon name="link" size={14} />
                        <span>Links</span>
                        <span className="canvas-footer2__links-panel-count">[{activeLinkCount}]</span>
                    </div>
                    <div className="canvas-footer2__links-panel-list">
                        {linkStates.map((link) => (
                            <button
                                key={link.id}
                                type="button"
                                className={`canvas-footer2__links-panel-item ${link.active ? 'is-active' : ''}`}
                                style={{ '--link-color': `var(--color-accent-${link.color})` }}
                                onClick={() => handleToggleLink(link)}
                            >
                                <span className="canvas-footer2__links-panel-icon">
                                    <Icon name={link.icon} size={14} />
                                </span>
                                <span className="canvas-footer2__links-panel-label">{link.label}</span>
                                <span className="canvas-footer2__links-panel-state">
                                    {link.active ? 'Linked' : 'Not linked'}
                                </span>
                            </button>
                        ))}
                    </div>
                </div>
            </DropdownPortal>
        </div>
    );
});

export default CanvasChromeFooter2;
