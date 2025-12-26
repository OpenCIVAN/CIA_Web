/**
 * AdaptiveResizableSections Component
 *
 * VR-first adaptive resizable sections with color variants.
 * Sections can expand/collapse and resize when multiple are open.
 * Automatically scales for VR with larger touch targets.
 */
import React, { useState, useCallback, useRef, useEffect } from 'react';
import { useMode } from '../ModeContext';
import Icon from '../Icon/Icon';
import './AdaptiveResizableSections.scss';

// =============================================================================
// SECTION HEADER
// =============================================================================

function SectionHeader({
    icon,
    label,
    count,
    badge,
    color,
    isExpanded,
    onToggle,
    headerActions,
    isVR,
}) {
    const iconWeight = isVR ? 'light' : 'regular';

    return (
        <div
            className="adaptive-section__header"
            data-color={color}
            data-expanded={isExpanded}
            onClick={onToggle}
        >
            <span className="adaptive-section__chevron">
                <Icon
                    name={isExpanded ? "chevronDown" : "chevronRight"}
                    size={isVR ? 14 : 10}
                    weight={iconWeight}
                />
            </span>
            {icon && (
                <Icon
                    name={icon}
                    size={isVR ? 16 : 12}
                    weight={iconWeight}
                    className="adaptive-section__icon"
                />
            )}
            <span className="adaptive-section__label">{label}</span>
            {badge > 0 && (
                <span className="adaptive-section__badge">{badge}</span>
            )}
            {count !== undefined && (
                <span className="adaptive-section__count">{count}</span>
            )}
            {headerActions && (
                <div
                    className="adaptive-section__header-actions"
                    onClick={e => e.stopPropagation()}
                >
                    {headerActions}
                </div>
            )}
        </div>
    );
}

// =============================================================================
// RESIZE DIVIDER
// =============================================================================

function ResizeDivider({ onDragStart, isActive, isVR }) {
    return (
        <div
            className={`adaptive-section__divider ${isActive ? 'adaptive-section__divider--active' : ''}`}
            onMouseDown={onDragStart}
            onTouchStart={onDragStart}
            style={{ height: isVR ? '12px' : '6px' }}
        >
            <div className="adaptive-section__divider-handle" />
        </div>
    );
}

// =============================================================================
// SINGLE SECTION
// =============================================================================

export function ResizableSection({
    id,
    icon,
    label,
    count,
    badge = 0,
    color = 'default',
    isExpanded,
    onToggle,
    flexGrow = 1,
    minHeight = 32,
    children,
    showDivider = false,
    onDividerDrag,
    isDividerActive = false,
    headerActions,
}) {
    const { mode, isVR } = useMode();
    const effectiveMinHeight = isVR ? Math.max(minHeight, 80) : minHeight;

    return (
        <div
            className={`adaptive-section adaptive-section--${mode} ${isExpanded ? 'adaptive-section--expanded' : 'adaptive-section--collapsed'}`}
            style={{
                flexGrow: isExpanded ? flexGrow : 0,
                flexShrink: isExpanded ? 1 : 0,
                flexBasis: isExpanded ? 0 : 'auto',
                minHeight: isExpanded ? effectiveMinHeight : 'auto',
            }}
            data-section-id={id}
            data-color={color}
        >
            <SectionHeader
                icon={icon}
                label={label}
                count={count}
                badge={badge}
                color={color}
                isExpanded={isExpanded}
                onToggle={onToggle}
                headerActions={headerActions}
                isVR={isVR}
            />

            {isExpanded && (
                <div className="adaptive-section__content">
                    {children}
                </div>
            )}

            {showDivider && isExpanded && (
                <ResizeDivider
                    onDragStart={onDividerDrag}
                    isActive={isDividerActive}
                    isVR={isVR}
                />
            )}
        </div>
    );
}

// =============================================================================
// SECTIONS CONTAINER - Manages resize logic
// =============================================================================

export function AdaptiveSectionsContainer({
    children,
    className,
    sectionStates,
    onSectionToggle,
    onSectionResize,
}) {
    const { mode } = useMode();
    const containerRef = useRef(null);
    const [resizing, setResizing] = useState(null);

    const expandedSections = Object.entries(sectionStates)
        .filter(([_, state]) => state.expanded)
        .map(([id]) => id);

    const handleDragStart = useCallback((e, sectionIndex) => {
        e.preventDefault();
        if (!containerRef.current) return;

        const clientY = e.touches ? e.touches[0].clientY : e.clientY;
        const sectionElements = containerRef.current.querySelectorAll('.adaptive-section--expanded');
        const startHeights = Array.from(sectionElements).map(el => el.getBoundingClientRect().height);

        setResizing({
            index: sectionIndex,
            startY: clientY,
            startHeights,
        });
    }, []);

    useEffect(() => {
        if (!resizing) return;

        const handleMove = (e) => {
            const clientY = e.touches ? e.touches[0].clientY : e.clientY;
            const deltaY = clientY - resizing.startY;
            const { index, startHeights } = resizing;

            const newHeights = [...startHeights];
            const minHeight = 60;

            newHeights[index] = Math.max(minHeight, startHeights[index] + deltaY);
            if (index + 1 < newHeights.length) {
                newHeights[index + 1] = Math.max(minHeight, startHeights[index + 1] - deltaY);
            }

            const totalHeight = newHeights.reduce((a, b) => a + b, 0);
            const flexGrows = newHeights.map(h => h / totalHeight * expandedSections.length);

            expandedSections.forEach((id, i) => {
                if (flexGrows[i] !== undefined) {
                    onSectionResize?.(id, flexGrows[i]);
                }
            });
        };

        const handleEnd = () => {
            setResizing(null);
        };

        document.addEventListener('mousemove', handleMove);
        document.addEventListener('mouseup', handleEnd);
        document.addEventListener('touchmove', handleMove);
        document.addEventListener('touchend', handleEnd);

        return () => {
            document.removeEventListener('mousemove', handleMove);
            document.removeEventListener('mouseup', handleEnd);
            document.removeEventListener('touchmove', handleMove);
            document.removeEventListener('touchend', handleEnd);
        };
    }, [resizing, expandedSections, onSectionResize]);

    const enhancedChildren = React.Children.map(children, (child, index) => {
        if (!React.isValidElement(child)) return child;

        const sectionId = child.props.id;
        const state = sectionStates[sectionId] || { expanded: false, flexGrow: 1 };
        const isLastExpanded = expandedSections.indexOf(sectionId) === expandedSections.length - 1;
        const sectionIndex = expandedSections.indexOf(sectionId);
        const effectiveFlexGrow = expandedSections.length === 1 ? 1 : state.flexGrow;

        return React.cloneElement(child, {
            isExpanded: state.expanded,
            flexGrow: effectiveFlexGrow,
            onToggle: () => onSectionToggle?.(sectionId),
            showDivider: state.expanded && !isLastExpanded && expandedSections.length > 1,
            onDividerDrag: (e) => handleDragStart(e, sectionIndex),
            isDividerActive: resizing?.index === sectionIndex,
        });
    });

    const containerClasses = [
        'adaptive-sections-container',
        `adaptive-sections-container--${mode}`,
        resizing && 'adaptive-sections-container--resizing',
        className,
    ].filter(Boolean).join(' ');

    return (
        <div ref={containerRef} className={containerClasses}>
            {enhancedChildren}
        </div>
    );
}

// =============================================================================
// HOOK FOR MANAGING SECTION STATE
// =============================================================================

export function useAdaptiveSectionStates(initialStates) {
    const [states, setStates] = useState(initialStates);

    const toggleSection = useCallback((id) => {
        setStates(prev => ({
            ...prev,
            [id]: {
                ...prev[id],
                expanded: !prev[id]?.expanded,
            }
        }));
    }, []);

    const resizeSection = useCallback((id, flexGrow) => {
        setStates(prev => ({
            ...prev,
            [id]: {
                ...prev[id],
                flexGrow,
            }
        }));
    }, []);

    const setExpanded = useCallback((id, expanded) => {
        setStates(prev => ({
            ...prev,
            [id]: {
                ...prev[id],
                expanded,
            }
        }));
    }, []);

    return {
        states,
        toggleSection,
        resizeSection,
        setExpanded,
        setStates,
    };
}

export default ResizableSection;