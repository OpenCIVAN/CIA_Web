/**
 * @file Footer2.jsx
 * @description Shared canvas toolbar footer with ViewGroup selector and links.
 *
 * Features:
 * - Section headers (like ToolbarZone) for visual organization
 * - ViewGroup selector with dropdown, search, settings
 * - Responsive links section (expanded/collapsed/minimal)
 * - Focus/Subset controls
 * - Universal actions (snapshot, reset)
 * - VR mode button
 */

import React, { memo, useState, useCallback, useRef, useEffect, useMemo } from 'react';
import PropTypes from 'prop-types';
import { useAdaptive } from '@UI/react/context/AdaptiveContext';
import { Button, Icon, Tooltip } from '@UI/react/components/atoms';
import { DuplicationDialog } from '@UI/react/components/modals/DuplicationDialog';
import { ViewGroupSelector } from './components/ViewGroupSelector/ViewGroupSelector';
import { LinksSection } from './components/LinksSection/LinksSection';
import { hexToRgbString } from '@Utils/colorUtils.js';
import {
    useFooterLayout,
    useLinkStats,
    useLinkReminderToast,
    useDuplicationDialog,
    FOOTER_BREAKPOINTS,
} from './Footer2.logic';
import './Footer2.scss';

/**
 * FooterZone - Section with label header (like ToolbarZone but for footer)
 * Labels always visible - minimum width ensures everything fits
 */
const FooterZone = memo(function FooterZone({ label, labelColor, children, className = '' }) {
    const labelColorClass = labelColor ? `footer2-zone__label--${labelColor}` : '';
    return (
        <div className={`footer2-zone ${className}`}>
            <div className={`footer2-zone__label ${labelColorClass}`}>
                {label}
            </div>
            <div className="footer2-zone__content">
                {children}
            </div>
        </div>
    );
});

FooterZone.propTypes = {
    label: PropTypes.string.isRequired,
    labelColor: PropTypes.string,
    children: PropTypes.node,
    className: PropTypes.string,
};

/**
 * FooterDivider - Vertical divider spanning both rows
 */
const FooterDivider = memo(function FooterDivider() {
    return (
        <div className="footer2-divider">
            <div className="footer2-divider__label" />
            <div className="footer2-divider__content" />
        </div>
    );
});

/**
 * FooterSpacer - Flexible spacer
 */
const FooterSpacer = memo(function FooterSpacer() {
    return (
        <div className="footer2-spacer">
            <div className="footer2-spacer__label" />
            <div className="footer2-spacer__content" />
        </div>
    );
});

/**
 * Focus/Subset Section Content (icons only)
 */
const FocusSubsetContent = memo(function FocusSubsetContent({
    isFocused,
    onToggleFocus,
    activeSubset,
    onOpenSubsetDropdown,
}) {
    return (
        <div className="footer2__button-group">
            <Tooltip content={isFocused ? 'Exit Focus Mode' : 'Focus View'} shortcut="F">
                <Button
                    variant={isFocused ? 'primary' : 'ghost'}
                    size="sm"
                    icon="maximize2"
                    onClick={onToggleFocus}
                    aria-pressed={isFocused}
                />
            </Tooltip>
            <Tooltip content="Data Subset">
                <Button
                    variant="ghost"
                    size="sm"
                    icon="database"
                    onClick={onOpenSubsetDropdown}
                />
            </Tooltip>
        </div>
    );
});

FocusSubsetContent.propTypes = {
    isFocused: PropTypes.bool,
    onToggleFocus: PropTypes.func,
    activeSubset: PropTypes.object,
    onOpenSubsetDropdown: PropTypes.func,
};

/**
 * Universal Actions Content (icons only)
 */
const UniversalActionsContent = memo(function UniversalActionsContent({
    onSnapshot,
    onResetView,
    onDuplicateView,
    onViewSettings,
}) {
    return (
        <div className="footer2__button-group">
            <Tooltip content="Take Snapshot" shortcut="Ctrl+S">
                <Button
                    variant="ghost"
                    size="sm"
                    icon="camera"
                    onClick={onSnapshot}
                />
            </Tooltip>
            <Tooltip content="Reset View" shortcut="Home">
                <Button
                    variant="ghost"
                    size="sm"
                    icon="rotateCcw"
                    onClick={onResetView}
                />
            </Tooltip>
            <Tooltip content="Duplicate View">
                <Button
                    variant="ghost"
                    size="sm"
                    icon="copy"
                    onClick={onDuplicateView}
                />
            </Tooltip>
            <Tooltip content="View Settings">
                <Button
                    variant="ghost"
                    size="sm"
                    icon="settings"
                    onClick={onViewSettings}
                />
            </Tooltip>
        </div>
    );
});

UniversalActionsContent.propTypes = {
    onSnapshot: PropTypes.func,
    onResetView: PropTypes.func,
    onDuplicateView: PropTypes.func,
    onViewSettings: PropTypes.func,
};

/**
 * FooterToolButton - Renders a single handler-provided tool as a footer button
 * Supports 'menu' type (opens dropdown via onClick) and simple action tools
 */
const FooterToolButton = memo(function FooterToolButton({ tool, onSelectTool }) {
    const handleClick = () => {
        if (tool.onClick) {
            tool.onClick();
        }
        onSelectTool?.(tool);
    };

    return (
        <Tooltip content={tool.description || tool.label}>
            <Button
                variant={tool.active ? 'primary' : 'ghost'}
                size="sm"
                icon={tool.icon || 'box'}
                onClick={handleClick}
                disabled={tool.disabled}
                aria-pressed={tool.active || undefined}
            />
        </Tooltip>
    );
});

FooterToolButton.propTypes = {
    tool: PropTypes.object.isRequired,
    onSelectTool: PropTypes.func,
};

/**
 * VR Button Content (icon only)
 */
const VRContent = memo(function VRContent({ isVRAvailable, isInVR, onToggleVR }) {
    if (!isVRAvailable) return null;

    return (
        <Tooltip content={isInVR ? 'Exit VR' : 'Enter VR'}>
            <Button
                variant={isInVR ? 'primary' : 'ghost'}
                size="sm"
                icon="glasses"
                onClick={onToggleVR}
                className="footer2__vr-button"
                aria-label={isInVR ? 'Exit VR' : 'Enter VR'}
            />
        </Tooltip>
    );
});

VRContent.propTypes = {
    isVRAvailable: PropTypes.bool,
    isInVR: PropTypes.bool,
    onToggleVR: PropTypes.func,
};

/**
 * Link Reminder Toast
 */
const LinkReminderToast = memo(function LinkReminderToast({
    isVisible,
    linkCount,
    onDismiss,
    onDisableLinks,
}) {
    if (!isVisible) return null;

    return (
        <div className="footer2__link-reminder">
            <Icon name="link" size={16} />
            <div className="footer2__link-reminder-content">
                <div className="footer2__link-reminder-title">
                    This ViewGroup has active links
                </div>
                <div className="footer2__link-reminder-subtitle">
                    {linkCount} properties syncing with other views
                </div>
            </div>
            <div className="footer2__link-reminder-actions">
                <Button variant="ghost" size="sm" onClick={onDisableLinks}>
                    Disable Links
                </Button>
                <Button variant="primary" size="sm" onClick={onDismiss}>
                    Got it
                </Button>
            </div>
        </div>
    );
});

LinkReminderToast.propTypes = {
    isVisible: PropTypes.bool,
    linkCount: PropTypes.number,
    onDismiss: PropTypes.func,
    onDisableLinks: PropTypes.func,
};

/**
 * Footer2 - Main component with ToolbarZone-style sections
 */
const Footer2 = memo(function Footer2({
    // ViewGroup data
    viewGroups = [],
    activeViewGroupId,
    onSelectViewGroup,
    onCreateViewGroup,
    onUpdateViewGroup,
    onDeleteViewGroup,
    onDuplicateViewGroup,
    onGoToViewGroup,
    // View data
    activeViewType = 'vtk-volume',
    // Focus/Subset
    isFocused = false,
    onToggleFocus,
    activeSubset = null,
    onOpenSubsetDropdown,
    // Actions
    onSnapshot,
    onResetView,
    onDuplicateView,
    onViewSettings,
    onOpenLayoutTab,
    onOpenLinkManager,
    // Instance tools from handler (footer-placed)
    instanceTools = [],
    toolSections = [],
    onSelectTool,
    // VR
    isVRAvailable = false,
    isInVR = false,
    onToggleVR,
    // Linking
    linkingService,
    // Active view accent color (for gradient + accent line)
    activeViewColor = null,
    // Sizing
    containerWidth = 900,
}) {
    const containerRef = useRef(null);
    const [width, setWidth] = useState(containerWidth);

    // Compute CSS custom properties for accent color
    const accentStyle = useMemo(() => {
        if (!activeViewColor) return {};
        return {
            '--footer-color': activeViewColor,
            '--footer-color-rgb': hexToRgbString(activeViewColor),
        };
    }, [activeViewColor]);
    const isActive = !!activeViewColor;

    // Responsive layout
    const {
        mode,
        showLabels,
        showTypeSpecific,
        showUniversal,
        isMinimal,
        isCompact,
        isFull,
    } = useFooterLayout(width);

    // Link stats
    const { linkStats, totalActiveLinks, hasActiveLinks } = useLinkStats(
        activeViewGroupId,
        linkingService
    );

    // Link reminder
    const {
        showReminder,
        checkAndShowReminder,
        dismissReminder,
        disableLinksAndDismiss,
    } = useLinkReminderToast();

    // Duplication dialog
    const {
        isOpen: isDuplicationOpen,
        viewGroupToDuplicate,
        openDialog: openDuplicationDialog,
        closeDialog: closeDuplicationDialog,
        confirmDuplication,
    } = useDuplicationDialog();

    // Handle duplicate action - opens dialog if ViewGroup has links
    const handleDuplicateViewGroup = useCallback((viewGroup) => {
        const viewGroupStats = {};
        // Compute link stats for this specific ViewGroup
        if (linkingService) {
            const props = ['camera', 'filters', 'colorMaps', 'widgets', 'cursors', 'annotations'];
            props.forEach(prop => {
                const links = linkingService?.getLinksForProperty?.(viewGroup.id, prop) || [];
                viewGroupStats[prop] = { count: links.length };
            });
        }

        const hasLinks = Object.values(viewGroupStats).some(s => s?.count > 0);

        if (hasLinks) {
            // Open dialog to choose link handling
            openDuplicationDialog(viewGroup);
        } else {
            // No links, duplicate directly
            onDuplicateViewGroup?.(viewGroup.id, 'noLinks');
        }
    }, [linkingService, openDuplicationDialog, onDuplicateViewGroup]);

    // Handle duplication confirmation from dialog
    const handleDuplicationConfirm = useCallback((linkOption) => {
        if (viewGroupToDuplicate) {
            onDuplicateViewGroup?.(viewGroupToDuplicate.id, linkOption);
        }
    }, [viewGroupToDuplicate, onDuplicateViewGroup]);

    // Track container width
    useEffect(() => {
        if (!containerRef.current) return;

        const observer = new ResizeObserver((entries) => {
            const entry = entries[0];
            if (entry) {
                setWidth(entry.contentRect.width);
            }
        });

        observer.observe(containerRef.current);
        return () => observer.disconnect();
    }, []);

    // Check for link reminder when ViewGroup changes
    useEffect(() => {
        if (activeViewGroupId && hasActiveLinks) {
            checkAndShowReminder(activeViewGroupId, hasActiveLinks);
        }
    }, [activeViewGroupId, hasActiveLinks, checkAndShowReminder]);

    // Get active ViewGroup
    const activeViewGroup = viewGroups.find(vg => vg.id === activeViewGroupId) || null;

    // Group footer tools by section for zone rendering
    const footerToolGroups = useMemo(() => {
        if (!instanceTools.length) return [];
        if (!toolSections.length) {
            return [{ section: { id: 'tools', label: 'Tools', icon: 'box', color: 'green' }, tools: instanceTools }];
        }
        const groups = [];
        for (const section of toolSections) {
            const sectionTools = instanceTools.filter(t => t.section === section.id);
            if (sectionTools.length > 0) {
                groups.push({ section, tools: sectionTools });
            }
        }
        const ungrouped = instanceTools.filter(t => !toolSections.some(s => s.id === t.section));
        if (ungrouped.length > 0) {
            groups.push({ section: { id: 'other', label: 'Other', color: 'gray' }, tools: ungrouped });
        }
        return groups;
    }, [instanceTools, toolSections]);

    return (
        <div
            ref={containerRef}
            className={`footer2 footer2--${mode} ${isActive ? 'footer2--active' : 'footer2--inactive'}`}
            style={{ ...accentStyle, minWidth: FOOTER_BREAKPOINTS.MIN_WIDTH }}
        >
            {/* Focus Zone */}
            <FooterZone label="Focus" labelColor="blue">
                <FocusSubsetContent
                    isFocused={isFocused}
                    onToggleFocus={onToggleFocus}
                    activeSubset={activeSubset}
                    onOpenSubsetDropdown={onOpenSubsetDropdown}
                />
            </FooterZone>
            <FooterDivider />

            {/* Actions Zone */}
            <FooterZone label="Actions" labelColor="amber">
                <UniversalActionsContent
                    onSnapshot={onSnapshot}
                    onResetView={onResetView}
                    onDuplicateView={onDuplicateView}
                    onViewSettings={onViewSettings}
                />
            </FooterZone>
            <FooterDivider />

            {/* Instance Tools - grouped by handler sections */}
            {footerToolGroups.map((group, index) => (
                <React.Fragment key={group.section.id}>
                    <FooterZone label={group.section.label} labelColor={group.section.color || 'green'}>
                        <div className="footer2__button-group">
                            {group.tools.map(tool => (
                                <FooterToolButton
                                    key={tool.id}
                                    tool={tool}
                                    onSelectTool={onSelectTool}
                                />
                            ))}
                        </div>
                    </FooterZone>
                    <FooterDivider />
                </React.Fragment>
            ))}
            {footerToolGroups.length === 0 && <FooterDivider />}

            {/* Spacer */}
            <FooterSpacer />

            {/* ViewGroup Zone (center) */}
            <FooterZone label="ViewGroup" labelColor="purple" className="footer2-zone--center">
                <ViewGroupSelector
                    viewGroups={viewGroups}
                    activeViewGroup={activeViewGroup}
                    mode={mode}
                    onSelectViewGroup={onSelectViewGroup}
                    onCreateViewGroup={onCreateViewGroup}
                    onUpdateViewGroup={onUpdateViewGroup}
                    onDeleteViewGroup={onDeleteViewGroup}
                    onDuplicateViewGroup={handleDuplicateViewGroup}
                    onGoToViewGroup={onGoToViewGroup}
                    onOpenLayoutTab={onOpenLayoutTab}
                />
            </FooterZone>

            {/* Spacer */}
            <FooterSpacer />

            <FooterDivider />

            {/* Links Zone */}
            <FooterZone label="Links" labelColor="teal">
                <LinksSection
                    mode={mode}
                    linkStats={linkStats}
                    totalActiveLinks={totalActiveLinks}
                    activeViewType={activeViewType}
                    onOpenLinkManager={onOpenLinkManager}
                    hideLabel={true}
                />
            </FooterZone>

            {/* VR Zone - only if VR available */}
            {isVRAvailable && (
                <>
                    <FooterDivider />
                    <FooterZone label="VR" labelColor="cyan">
                        <VRContent
                            isVRAvailable={isVRAvailable}
                            isInVR={isInVR}
                            onToggleVR={onToggleVR}
                        />
                    </FooterZone>
                </>
            )}

            {/* Link Reminder Toast */}
            <LinkReminderToast
                isVisible={showReminder}
                linkCount={totalActiveLinks}
                onDismiss={dismissReminder}
                onDisableLinks={disableLinksAndDismiss}
            />

            {/* Duplication Dialog */}
            <DuplicationDialog
                isOpen={isDuplicationOpen}
                onClose={closeDuplicationDialog}
                viewGroup={viewGroupToDuplicate}
                linkStats={linkStats}
                onConfirm={handleDuplicationConfirm}
            />
        </div>
    );
});

Footer2.propTypes = {
    // ViewGroup data
    viewGroups: PropTypes.arrayOf(PropTypes.shape({
        id: PropTypes.string.isRequired,
        name: PropTypes.string.isRequired,
        color: PropTypes.string,
        layoutId: PropTypes.string,
        views: PropTypes.arrayOf(PropTypes.string),
        linkedTo: PropTypes.string,
    })),
    activeViewGroupId: PropTypes.string,
    onSelectViewGroup: PropTypes.func,
    onCreateViewGroup: PropTypes.func,
    onUpdateViewGroup: PropTypes.func,
    onDeleteViewGroup: PropTypes.func,
    onDuplicateViewGroup: PropTypes.func,
    onGoToViewGroup: PropTypes.func,
    // View data
    activeViewType: PropTypes.string,
    // Focus/Subset
    isFocused: PropTypes.bool,
    onToggleFocus: PropTypes.func,
    activeSubset: PropTypes.object,
    onOpenSubsetDropdown: PropTypes.func,
    // Actions
    onSnapshot: PropTypes.func,
    onResetView: PropTypes.func,
    onDuplicateView: PropTypes.func,
    onViewSettings: PropTypes.func,
    onOpenLayoutTab: PropTypes.func,
    onOpenLinkManager: PropTypes.func,
    // Instance tools from handler
    instanceTools: PropTypes.array,
    toolSections: PropTypes.array,
    onSelectTool: PropTypes.func,
    // VR
    isVRAvailable: PropTypes.bool,
    isInVR: PropTypes.bool,
    onToggleVR: PropTypes.func,
    // Linking
    linkingService: PropTypes.object,
    // Active view accent color (hex)
    activeViewColor: PropTypes.string,
    // Sizing
    containerWidth: PropTypes.number,
};

export { Footer2 };
export default Footer2;
