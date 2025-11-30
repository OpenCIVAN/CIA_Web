import { useState } from 'react';
import { ViewItem } from './index';

export default {
    title: 'Panels/LeftPanel/ViewItem',
    component: ViewItem,
    parameters: {
        layout: 'padded',
        backgrounds: { default: 'dark' },
    },
    decorators: [
        (Story) => (
            <div style={{
                width: '280px',
                background: '#1a1a1a',
                borderRadius: '8px',
                padding: '8px'
            }}>
                <Story />
            </div>
        ),
    ],
};

// Sample view data
const sampleView = {
    id: '1',
    name: 'Sales Data 2024',
    color: '#60a5fa',
    isWorkspace: true,
    isPreset: false,
    isShared: false,
    isPersonal: false,
    isLocked: false,
    position: { row: 0, col: 1 },
    size: { rows: 1, cols: 1 },
};

// Basic view
export const Default = {
    args: {
        view: sampleView,
        isActive: false,
    },
};

// Active view
export const Active = {
    args: {
        view: {
            ...sampleView,
            color: '#34d399',
        },
        isActive: true,
    },
};

// With linked views
export const WithLinkedViews = {
    args: {
        view: {
            ...sampleView,
            name: 'Revenue Analysis',
        },
        linkedCount: 3,
        isActive: true,
    },
};

// With filters
export const WithFilters = {
    args: {
        view: {
            ...sampleView,
            name: 'Filtered View',
            color: '#a78bfa',
        },
        filterCount: 5,
    },
};

// Multiple status badges
export const WithAllBadges = {
    args: {
        view: {
            ...sampleView,
            name: 'Complex View',
            isWorkspace: true,
            isPreset: true,
            isShared: true,
            isLocked: true,
            color: '#fb7185',
        },
        linkedCount: 2,
        filterCount: 3,
        isActive: true,
    },
};

// Shared view
export const SharedView = {
    args: {
        view: {
            ...sampleView,
            name: 'Team Dashboard',
            isShared: true,
            color: '#fb7185',
        },
    },
};

// Personal view
export const PersonalView = {
    args: {
        view: {
            ...sampleView,
            name: 'My Analysis',
            isPersonal: true,
            isWorkspace: false,
            color: '#7dd3fc',
        },
    },
};

// Locked view
export const LockedView = {
    args: {
        view: {
            ...sampleView,
            name: 'Protected Data',
            isLocked: true,
            color: '#fbbf24',
        },
    },
};

// Large spanning view
export const LargeView = {
    args: {
        view: {
            ...sampleView,
            name: 'Overview Dashboard',
            size: { rows: 2, cols: 2 },
        },
        isActive: true,
    },
};

// Interactive with hover
export const Interactive = () => {
    const [views, setViews] = useState([
        { ...sampleView, id: '1', name: 'Sales 2024', color: '#60a5fa' },
        { ...sampleView, id: '2', name: 'Revenue', color: '#34d399', position: { row: 0, col: 2 } },
        { ...sampleView, id: '3', name: 'Customers', color: '#fb7185', isShared: true, position: { row: 1, col: 0 } },
    ]);
    const [activeId, setActiveId] = useState('1');

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            {views.map((view) => (
                <ViewItem
                    key={view.id}
                    view={view}
                    isActive={view.id === activeId}
                    onSelect={setActiveId}
                    onClose={(id) => setViews(views.filter(v => v.id !== id))}
                    onRename={(id, name) => {
                        setViews(views.map(v => v.id === id ? { ...v, name } : v));
                    }}
                    onNavigate={(pos) => console.log('Navigate to:', pos)}
                    onSaveView={(id) => console.log('Save view:', id)}
                    onShareView={(id) => console.log('Share view:', id)}
                    onSpawnLink={(id) => console.log('Spawn link:', id)}
                    onSizeChange={(id, size) => console.log('Size change:', id, size)}
                    onLinkPropertyChange={(id, prop, value) => console.log('Link property:', id, prop, value)}
                    linkProperties={{
                        camera: true,
                        filters: true,
                        widgets: false,
                        cursors: true,
                        colors: true,
                        annotations: false,
                    }}
                />
            ))}
            <div style={{
                marginTop: '16px',
                padding: '12px',
                background: '#0f0f0f',
                borderRadius: '6px',
                fontSize: '12px',
                color: 'rgba(255,255,255,0.5)'
            }}>
                <p>• Hover to see sliding panel</p>
                <p>• Double-click name to edit</p>
                <p>• Click position badge to navigate</p>
                <p>• Drag handle to reorder</p>
            </div>
        </div>
    );
};

Interactive.decorators = [
    (Story) => (
        <div style={{
            width: '300px',
            background: '#1a1a1a',
            borderRadius: '8px',
            padding: '12px'
        }}>
            <Story />
        </div>
    ),
];

// Hovering state demo
export const HoverStateDemo = () => {
    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '40px' }}>
            <div>
                <p style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)', marginBottom: '8px' }}>
                    Normal state
                </p>
                <ViewItem
                    view={sampleView}
                    isActive={false}
                />
            </div>
            <div>
                <p style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)', marginBottom: '8px' }}>
                    Hover over the item below to see the sliding panel
                </p>
                <ViewItem
                    view={{
                        ...sampleView,
                        name: 'Hoverable View',
                        color: '#34d399',
                    }}
                    isActive={true}
                    linkProperties={{
                        camera: true,
                        filters: true,
                        widgets: false,
                        cursors: true,
                        colors: true,
                        annotations: false,
                    }}
                />
            </div>
        </div>
    );
};

HoverStateDemo.decorators = [
    (Story) => (
        <div style={{
            width: '300px',
            background: '#1a1a1a',
            borderRadius: '8px',
            padding: '16px'
        }}>
            <Story />
        </div>
    ),
];