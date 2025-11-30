/**
 * SlidingPanel Component
 *
 * Glassmorphism frosted glass panel that slides out on hover.
 * Contains action buttons and link property toggles.
 */

import { memo, useState } from 'react';
import { Save, Share2, Copy, Maximize2, Grid3x3 } from 'lucide-react';
import { ButtonGroup } from './ButtonGroup';
import { SizePicker } from './SizePicker';
import { LinkPropertyToggle } from './LinkPropertyToggle';
import './SlidingPanel.scss';

// Link property configuration
const LINK_PROPERTIES = [
    { id: 'camera', label: 'Camera', icon: 'Camera' },
    { id: 'filters', label: 'Filters', icon: 'Filter' },
    { id: 'widgets', label: 'Widgets', icon: 'Layers' },
    { id: 'cursors', label: 'Cursors', icon: 'MousePointer' },
    { id: 'colors', label: 'Colors', icon: 'Palette' },
    { id: 'annotations', label: 'Annotations', icon: 'MessageSquare' },
];

export const SlidingPanel = memo(function SlidingPanel({
    isVisible = false,
    view,
    linkProperties = {},
    linkedParent = null,
    onSaveView,
    onShareView,
    onSpawnLink,
    onSizeChange,
    onLinkPropertyChange,
}) {
    const [tooltipText, setTooltipText] = useState(null);
    const [showSizePicker, setShowSizePicker] = useState(false);

    if (!isVisible) return null;

    // Action button groups
    const actionGroups = [
        {
            id: 'save',
            buttons: [
                {
                    id: 'save-view',
                    icon: Save,
                    label: 'Save View',
                    onClick: onSaveView,
                },
            ],
        },
        {
            id: 'share',
            buttons: [
                {
                    id: 'share',
                    icon: Share2,
                    label: 'Share',
                    onClick: onShareView,
                },
            ],
        },
        {
            id: 'spawn',
            buttons: [
                {
                    id: 'spawn-link',
                    icon: Copy,
                    label: 'Spawn Linked Copy',
                    onClick: onSpawnLink,
                },
            ],
        },
        {
            id: 'size',
            buttons: [
                {
                    id: 'size-picker',
                    icon: Grid3x3,
                    label: 'Change Size',
                    onClick: () => setShowSizePicker(!showSizePicker),
                    isActive: showSizePicker,
                },
            ],
        },
    ];

    return (
        <div
            className="sliding-panel"
            style={{ '--view-color': view?.color || '#60a5fa' }}
        >
            {/* Tooltip row */}
            <div className="sliding-panel__tooltip">
                {tooltipText || 'Hover over buttons for info'}
            </div>

            {/* Action buttons row */}
            <div className="sliding-panel__actions">
                {actionGroups.map((group, index) => (
                    <ButtonGroup
                        key={group.id}
                        buttons={group.buttons}
                        onHover={setTooltipText}
                        showDivider={index < actionGroups.length - 1}
                    />
                ))}
            </div>

            {/* Size picker dropdown */}
            {showSizePicker && (
                <SizePicker
                    currentSize={view?.size || { rows: 1, cols: 1 }}
                    onChange={(size) => {
                        onSizeChange?.(size);
                        setShowSizePicker(false);
                    }}
                    onClose={() => setShowSizePicker(false)}
                />
            )}

            {/* Linked parent info (if any) */}
            {linkedParent && (
                <div className="sliding-panel__linked-parent">
                    <span className="sliding-panel__linked-label">Linked to:</span>
                    <span className="sliding-panel__linked-name">{linkedParent.name}</span>
                </div>
            )}

            {/* Link property toggles */}
            <div className="sliding-panel__link-properties">
                <span className="sliding-panel__link-label">Link Properties</span>
                <div className="sliding-panel__toggles">
                    {LINK_PROPERTIES.map((prop) => (
                        <LinkPropertyToggle
                            key={prop.id}
                            property={prop}
                            isActive={linkProperties[prop.id] ?? true}
                            onChange={(value) => onLinkPropertyChange?.(prop.id, value)}
                            onHover={setTooltipText}
                        />
                    ))}
                </div>
            </div>
        </div>
    );
});

export default SlidingPanel;