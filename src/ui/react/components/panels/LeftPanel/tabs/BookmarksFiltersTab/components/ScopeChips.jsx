// components/ScopeChips.jsx
// Reusable scope filter chips component

import React from 'react';
import { Globe, Users, UserCircle } from 'lucide-react';

// Scope configuration
export const SCOPE_CONFIG = {
    project: { label: 'Project', icon: Globe, color: 'amber' },
    room: { label: 'This Room', icon: Users, color: 'teal' },
    personal: { label: 'Personal', icon: UserCircle, color: 'blue' },
};

export function ScopeChips({ activeScopes, onToggleScope, counts = {} }) {
    return (
        <div className="scope-chips">
            {Object.entries(SCOPE_CONFIG).map(([scope, config]) => {
                const isActive = activeScopes.includes(scope);
                const count = counts[scope] || 0;
                const Icon = config.icon;

                return (
                    <button
                        key={scope}
                        className={`scope-chip ${isActive ? 'scope-chip--active' : ''}`}
                        data-color={config.color}
                        onClick={() => onToggleScope(scope)}
                    >
                        <Icon size={10} />
                        <span>{config.label}</span>
                        {count > 0 && <span className="scope-chip__count">{count}</span>}
                    </button>
                );
            })}
        </div>
    );
}

export default ScopeChips;