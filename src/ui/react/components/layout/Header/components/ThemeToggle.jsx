/**
 * @file ThemeToggle.jsx
 * @description Toggle button for switching between light and dark themes.
 */

import React, { useState, useEffect } from 'react';
import { IconSun, IconMoon } from '@UI/react/components/common/Icon';

/**
 * Theme toggle button.
 * Uses local state as placeholder until theme hook is wired up.
 */
export function ThemeToggle() {
    // TODO: Replace with actual theme hook when available
    // import { useTheme } from '@UI/react/hooks/useTheme';
    // const { theme, toggleTheme } = useTheme();

    const [isDark, setIsDark] = useState(true);

    // Check for stored preference on mount
    useEffect(() => {
        const stored = localStorage.getItem('cia-theme');
        if (stored) {
            setIsDark(stored === 'dark');
        }
    }, []);

    const toggleTheme = () => {
        const newTheme = !isDark;
        setIsDark(newTheme);
        localStorage.setItem('cia-theme', newTheme ? 'dark' : 'light');
        // Dispatch event for theme change listeners
        window.dispatchEvent(
            new CustomEvent('cia:theme-change', {
                detail: { theme: newTheme ? 'dark' : 'light' },
            })
        );
    };

    return (
        <button
            className="header__icon-btn"
            onClick={toggleTheme}
            title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
            aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
            type="button"
        >
            {isDark ? <IconSun sx={{ fontSize: 18 }} /> : <IconMoon sx={{ fontSize: 18 }} />}
        </button>
    );
}

export default ThemeToggle;