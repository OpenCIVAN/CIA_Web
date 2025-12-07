// components/ScopedSection.jsx
// Collapsible section grouped by scope

import React from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { SCOPE_CONFIG } from './ScopeChips';

export function ScopedSection({ scope, items, isExpanded, onToggle, renderItem }) {
    const config = SCOPE_CONFIG[scope] || SCOPE_CONFIG.personal;
    const Icon = config.icon;

    if (items.length === 0) return null;

    return (
        <div className={`scoped-section ${isExpanded ? 'scoped-section--expanded' : ''}`}>
            <button
                className="scoped-section__header"
                onClick={onToggle}
            >
                <span className="scoped-section__chevron">
                    {isExpanded ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
                </span>
                <Icon size={12} className={`icon-${config.color}`} />
                <span className="scoped-section__label">{config.label}</span>
                <span className="scoped-section__count">{items.length}</span>
            </button>
            {isExpanded && (
                <div className="scoped-section__content">
                    {items.map(item => renderItem(item))}
                </div>
            )}
        </div>
    );
}

export default ScopedSection;