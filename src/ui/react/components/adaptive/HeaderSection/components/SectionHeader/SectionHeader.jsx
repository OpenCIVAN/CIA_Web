/**
 * SectionHeader Component
 *
 * Simple collapsible list header for sections below the main header cards.
 * VR-first, desktop-friendly - automatically scales for VR with larger
 * touch targets and refined icon weights.
 */
import React, { useState } from 'react';
import { useMode } from '../../../ModeContext';
import Icon from '../../../Icon/Icon';
import './SectionHeader.scss';

export const SectionHeader = ({
    icon,
    children,
    count,
    color,
    actions,
    defaultExpanded = true,
    onToggle,
}) => {
    const [isExpanded, setIsExpanded] = useState(defaultExpanded);
    const { mode, isVR } = useMode();
    const iconWeight = isVR ? 'light' : 'regular';

    const handleToggle = () => {
        const newExpanded = !isExpanded;
        setIsExpanded(newExpanded);
        onToggle?.(newExpanded);
    };

    return (
        <button
            type="button"
            className={`section-header section-header--${mode}`}
            onClick={handleToggle}
            aria-expanded={isExpanded}
        >
            <span
                className="section-header__chevron"
                data-expanded={isExpanded}
            >
                <Icon name="chevronDown" size={isVR ? 14 : 10} weight={iconWeight} />
            </span>
            {icon && (
                <Icon
                    name={icon}
                    size={isVR ? 16 : 11}
                    weight={iconWeight}
                    className="section-header__icon"
                    style={{ color }}
                />
            )}
            <span className="section-header__label">{children}</span>
            {count !== undefined && (
                <span className="section-header__count">{count}</span>
            )}
            {actions && (
                <div
                    className="section-header__actions"
                    onClick={e => e.stopPropagation()}
                >
                    {actions}
                </div>
            )}
        </button>
    );
};

export default SectionHeader;