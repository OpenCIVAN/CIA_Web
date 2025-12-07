// tabs/LayoutTab/LayoutTab.jsx
// Layout tab content - wrapper for LayoutPanel component
// Uses LayoutPanel internally which manages its own state via useLayoutPanel

import React, { useCallback } from 'react';
import { LayoutPanel } from '@UI/react/components/panels/LayoutPanel';
import './LayoutTab.scss';
// FloatingCanvasNavigator is rendered elsewhere (in the workspace area)

/**
 * LayoutTab - Container for the Layout Panel in the left sidebar
 *
 * This is now a thin wrapper. The LayoutPanel component uses useLayoutPanel
 * internally, which consumes useCanvas() for real server data.
 *
 * Props:
 * - canvasId: Optional - target a specific canvas (uses active canvas by default)
 * - onPopOut: Callback when user clicks pop-out button on navigator
 */
export function LayoutPanelContent({ canvasId, onPopOut }) {
    const handlePopOut = useCallback(() => {
        // TODO: Integrate with FloatingPanelContext or window.open
        console.log('Pop out navigator to floating window');
        onPopOut?.();
    }, [onPopOut]);

    return (
        <LayoutPanel
            canvasId={canvasId}
            onPopOut={handlePopOut}
        />
    );
}

export default LayoutPanelContent;