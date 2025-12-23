// src/ui/react/components/workspace/ScratchPad/ScratchPad.jsx
// ScratchPad component for clipboard and quick tools
// TODO: Style this component properly later

import React, { memo } from 'react';
import {
    IconChevronUp,
    IconChevronDown,
    IconPin,
    IconExternalLink,
    IconClose,
    IconAdd,
    IconDelete,
    IconRuler,
    IconLink,
    IconEye,
    IconFile,
    IconFilter,
    IconBookmark,
    IconSettings,
    IconStickyNote,
    IconMacro,
    IconGitCompare
} from '@UI/react/components/common/Icon';
import {
    DescriptionOutlined as Clipboard,
    PushPinOutlined as PinOff,
    ChangeHistoryOutlined as Triangle,
    StickyNote2Outlined as StickyNote,
    CompareArrowsOutlined as GitCompare,
    BoltOutlined as Zap,
    StorageOutlined as Database,
} from '@mui/icons-material';
import { useScratchPad, useScratchPadListener } from './ScratchPad.logic.js';
import './ScratchPad.scss';

// Icon mapping for clipboard item types
const ITEM_TYPE_ICONS = {
    dataset: Database,
    view: IconEye,
    note: IconStickyNote,
    filter: IconFilter,
    bookmark: IconBookmark,
};

// Icon mapping for quick tools
const TOOL_ICONS = {
    measure: IconRuler,
    angle: Triangle,
    note: IconStickyNote,
    link: IconLink,
    compare: IconGitCompare,
    macro: IconMacro,
};

/**
 * ClipboardItem - Single item in the clipboard
 */
const ClipboardItem = memo(function ClipboardItem({
    item,
    onRemove,
    onDragStart,
    onDragEnd,
}) {
    const Icon = ITEM_TYPE_ICONS[item.type] || IconFile;

    return (
        <div
            className="scratchpad-clipboard__item"
            draggable
            onDragStart={(e) => onDragStart(e, item)}
            onDragEnd={onDragEnd}
            title={`Drag to canvas: ${item.label}`}
        >
            <Icon size={14} className="scratchpad-clipboard__item-icon" />
            <span className="scratchpad-clipboard__item-label">{item.label}</span>
            <button
                className="scratchpad-clipboard__item-remove"
                onClick={(e) => {
                    e.stopPropagation();
                    onRemove(item.id);
                }}
                title="Remove"
            >
                <IconClose size={10} />
            </button>
        </div>
    );
});

/**
 * QuickToolButton - Button for quick tool
 */
const QuickToolButton = memo(function QuickToolButton({
    tool,
    isActive,
    onClick,
}) {
    const Icon = TOOL_ICONS[tool.id] || Zap;

    return (
        <button
            className={`scratchpad-tools__btn ${isActive ? 'scratchpad-tools__btn--active' : ''}`}
            onClick={() => onClick(tool.id)}
            title={tool.label}
        >
            <Icon size={14} />
            <span>{tool.label.split(' ')[0]}</span>
        </button>
    );
});

/**
 * ScratchPadCollapsed - Collapsed state in bottom bar
 */
export function ScratchPadCollapsed({ onClick, itemCount = 0 }) {
    return (
        <button
            className="scratchpad-trigger"
            onClick={onClick}
            title="Open Scratch Pad"
        >
            <Clipboard size={14} />
            <span>Scratch</span>
            {itemCount > 0 && (
                <span className="scratchpad-trigger__count">{itemCount}</span>
            )}
            <IconChevronUp size={12} />
        </button>
    );
}

/**
 * ScratchPadExpanded - Expanded pop-out panel
 */
export function ScratchPadExpanded({
    scope,
    onScopeChange,
    isPinned,
    onTogglePin,
    isDetached,
    onToggleDetach,
    onClose,
    clipboardItems,
    onRemoveItem,
    onClearClipboard,
    onDragStart,
    onDragEnd,
    quickTools,
    activeTool,
    onActivateTool,
}) {
    return (
        <div className={`scratchpad-panel ${isDetached ? 'scratchpad-panel--detached' : ''}`}>
            {/* Header */}
            <div className="scratchpad-panel__header">
                <div className="scratchpad-panel__title">
                    <Clipboard size={14} />
                    <span>Scratch Pad</span>
                </div>

                {/* Scope Toggle */}
                <select
                    className="scratchpad-panel__scope"
                    value={scope}
                    onChange={(e) => onScopeChange(e.target.value)}
                >
                    <option value="personal">Personal</option>
                    <option value="room">Room Shared</option>
                </select>

                <div className="scratchpad-panel__actions">
                    <button
                        className={`scratchpad-panel__action ${isPinned ? 'scratchpad-panel__action--active' : ''}`}
                        onClick={onTogglePin}
                        title={isPinned ? 'Unpin' : 'Pin'}
                    >
                        {isPinned ? <PinOff size={12} /> : <IconPin size={12} />}
                    </button>
                    <button
                        className="scratchpad-panel__action"
                        onClick={onToggleDetach}
                        title={isDetached ? 'Dock' : 'Detach'}
                    >
                        <IconExternalLink size={12} />
                    </button>
                    <button
                        className="scratchpad-panel__action"
                        onClick={onClose}
                        title="Close"
                    >
                        <IconClose size={12} />
                    </button>
                </div>
            </div>

            {/* Clipboard Section */}
            <div className="scratchpad-clipboard">
                <div className="scratchpad-clipboard__header">
                    <span>Clipboard</span>
                    {clipboardItems.length > 0 && (
                        <button
                            className="scratchpad-clipboard__clear"
                            onClick={onClearClipboard}
                            title="Clear all"
                        >
                            <IconDelete size={10} />
                        </button>
                    )}
                </div>

                <div className="scratchpad-clipboard__items">
                    {clipboardItems.length === 0 ? (
                        <div className="scratchpad-clipboard__empty">
                            Drag items here or use context menu
                        </div>
                    ) : (
                        clipboardItems.map((item) => (
                            <ClipboardItem
                                key={item.id}
                                item={item}
                                onRemove={onRemoveItem}
                                onDragStart={onDragStart}
                                onDragEnd={onDragEnd}
                            />
                        ))
                    )}
                </div>

                <div className="scratchpad-clipboard__hint">
                    Drag to canvas to spawn
                </div>
            </div>

            {/* Quick Tools Section */}
            <div className="scratchpad-tools">
                <div className="scratchpad-tools__header">
                    <span>Quick Tools</span>
                    <button className="scratchpad-tools__customize" title="Customize">
                        <IconSettings size={10} />
                    </button>
                </div>

                <div className="scratchpad-tools__grid">
                    {quickTools.map((tool) => (
                        <QuickToolButton
                            key={tool.id}
                            tool={tool}
                            isActive={activeTool === tool.id}
                            onClick={onActivateTool}
                        />
                    ))}
                </div>
            </div>
        </div>
    );
}

/**
 * ScratchPad - Main component wrapper
 */
export function ScratchPad({ initialExpanded = false }) {
    const {
        isExpanded,
        isDetached,
        isPinned,
        scope,
        clipboardItems,
        quickTools,
        activeTool,
        toggleExpanded,
        toggleDetached,
        togglePinned,
        setScope,
        addToClipboard,
        removeFromClipboard,
        clearClipboard,
        activateTool,
        handleClipboardDragStart,
        handleClipboardDragEnd,
    } = useScratchPad({ initialExpanded });

    // Listen for "add to scratchpad" events
    useScratchPadListener(addToClipboard);

    if (!isExpanded) {
        return (
            <ScratchPadCollapsed
                onClick={toggleExpanded}
                itemCount={clipboardItems.length}
            />
        );
    }

    return (
        <ScratchPadExpanded
            scope={scope}
            onScopeChange={setScope}
            isPinned={isPinned}
            onTogglePin={togglePinned}
            isDetached={isDetached}
            onToggleDetach={toggleDetached}
            onClose={toggleExpanded}
            clipboardItems={clipboardItems}
            onRemoveItem={removeFromClipboard}
            onClearClipboard={clearClipboard}
            onDragStart={handleClipboardDragStart}
            onDragEnd={handleClipboardDragEnd}
            quickTools={quickTools}
            activeTool={activeTool}
            onActivateTool={activateTool}
        />
    );
}

export default ScratchPad;