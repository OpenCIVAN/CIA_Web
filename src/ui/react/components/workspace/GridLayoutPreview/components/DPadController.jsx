/**
 * DPadController Component
 *
 * Floating navigation controller for grid preview.
 * Transparent by default, shows outline on hover.
 *
 * @param {function} onNavigate - Callback for direction navigation (up, down, left, right)
 * @param {function} onHome - Callback for home button
 * @param {string} className - Additional CSS class
 */

import { memo, useState, useCallback } from 'react';
import { ChevronUp, ChevronDown, ChevronLeft, ChevronRight, Home } from 'lucide-react';
import './DPadController.scss';

export const DPadController = memo(function DPadController({
    onNavigate,
    onHome,
    className = '',
}) {
    const [isHovered, setIsHovered] = useState(false);

    const handleNavigate = useCallback((direction) => {
        onNavigate?.(direction);
    }, [onNavigate]);

    return (
        <div
            className={`dpad-controller ${isHovered ? 'dpad-controller--hovered' : ''} ${className}`}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
        >
            {/* Up */}
            <button
                className="dpad-controller__btn dpad-controller__btn--up"
                onClick={() => handleNavigate('up')}
                aria-label="Navigate up"
            >
                <ChevronUp size={14} />
            </button>

            {/* Left */}
            <button
                className="dpad-controller__btn dpad-controller__btn--left"
                onClick={() => handleNavigate('left')}
                aria-label="Navigate left"
            >
                <ChevronLeft size={14} />
            </button>

            {/* Center/Home */}
            <button
                className="dpad-controller__btn dpad-controller__btn--center"
                onClick={onHome}
                aria-label="Go to home"
            >
                <Home size={12} />
            </button>

            {/* Right */}
            <button
                className="dpad-controller__btn dpad-controller__btn--right"
                onClick={() => handleNavigate('right')}
                aria-label="Navigate right"
            >
                <ChevronRight size={14} />
            </button>

            {/* Down */}
            <button
                className="dpad-controller__btn dpad-controller__btn--down"
                onClick={() => handleNavigate('down')}
                aria-label="Navigate down"
            >
                <ChevronDown size={14} />
            </button>
        </div>
    );
});

export default DPadController;