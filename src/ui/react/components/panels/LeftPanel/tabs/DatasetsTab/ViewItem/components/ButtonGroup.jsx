/**
 * ButtonGroup Component
 *
 * Group of icon buttons with optional divider.
 */

import { memo } from 'react';
import './ButtonGroup.scss';

export const ButtonGroup = memo(function ButtonGroup({
    buttons = [],
    onHover,
    showDivider = false,
}) {
    return (
        <>
            <div className="button-group">
                {buttons.map((button) => {
                    const Icon = button.icon;
                    return (
                        <button
                            key={button.id}
                            className={`button-group__btn ${button.isActive ? 'button-group__btn--active' : ''}`}
                            onClick={button.onClick}
                            onMouseEnter={() => onHover?.(button.label)}
                            onMouseLeave={() => onHover?.(null)}
                            title={button.label}
                        >
                            <Icon size={12} />
                        </button>
                    );
                })}
            </div>
            {showDivider && <div className="button-group__divider" />}
        </>
    );
});

export default ButtonGroup;