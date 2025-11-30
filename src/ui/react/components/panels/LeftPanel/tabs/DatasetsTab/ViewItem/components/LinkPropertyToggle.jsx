/**
 * LinkPropertyToggle Component
 *
 * Toggle button for link properties (Camera, Filters, Widgets, etc.)
 */

import { memo } from 'react';
import {
    Camera,
    Filter,
    Layers,
    MousePointer,
    Palette,
    MessageSquare,
} from 'lucide-react';
import './LinkPropertyToggle.scss';

// Icon mapping
const ICONS = {
    Camera,
    Filter,
    Layers,
    MousePointer,
    Palette,
    MessageSquare,
};

export const LinkPropertyToggle = memo(function LinkPropertyToggle({
    property,
    isActive = true,
    onChange,
    onHover,
}) {
    const Icon = ICONS[property.icon] || Layers;

    return (
        <button
            className={`link-property-toggle ${isActive ? 'link-property-toggle--active' : ''}`}
            onClick={() => onChange?.(!isActive)}
            onMouseEnter={() => onHover?.(`${property.label}: ${isActive ? 'Linked' : 'Unlinked'}`)}
            onMouseLeave={() => onHover?.(null)}
            title={`${property.label}: ${isActive ? 'Linked' : 'Unlinked'}`}
        >
            <Icon size={12} />
        </button>
    );
});

export default LinkPropertyToggle;