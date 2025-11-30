import { useState } from 'react';
import { GridLayoutPreview } from './index';

export default {
    title: 'Workspace/GridLayoutPreview',
    component: GridLayoutPreview,
    parameters: {
        layout: 'padded',
        backgrounds: { default: 'dark' },
    },
    decorators: [
        (Story) => (
            <div style={{
                width: '320px',
                height: '300px',
                background: '#0f0f0f',
                borderRadius: '8px',
                overflow: 'hidden'
            }}>
                <Story />
            </div>
        ),
    ],
};

// Sample placements data
const samplePlacements = [
    { id: '1', name: 'Sales 2024', row: 0, col: 0, rowSpan: 1, colSpan: 1, color: 'blue' },
    { id: '2', name: 'Revenue', row: 0, col: 1, rowSpan: 1, colSpan: 2, color: 'green' },
    { id: '3', name: 'Customers', row: 1, col: 0, rowSpan: 2, colSpan: 1, color: 'pink' },
    { id: '4', name: 'Products', row: 1, col: 2, rowSpan: 1, colSpan: 1, color: 'amber' },
    { id: '5', name: 'Analytics', row: 2, col: 1, rowSpan: 1, colSpan: 2, color: 'teal' },
    { id: '6', name: 'Reports', row: 3, col: 0, rowSpan: 1, colSpan: 1, color: 'purple' },
];

// Sample collaborators
const sampleCollaborators = [
    { id: 'u1', name: 'Alice Smith', color: '#60a5fa', position: { row: 0, col: 1 }, isActive: true },
    { id: 'u2', name: 'Bob Johnson', color: '#34d399', position: { row: 1, col: 2 }, isActive: false },
    { id: 'u3', name: 'Carol Williams', color: '#fb7185', position: { row: 2, col: 1 }, isActive: true },
];

// Layout Context
export const LayoutContext = {
    args: {
        context: 'layout',
        placements: samplePlacements,
        gridSize: { rows: 4, cols: 4 },
    },
};

// Presence Context
export const PresenceContext = {
    args: {
        context: 'presence',
        placements: samplePlacements,
        gridSize: { rows: 4, cols: 4 },
        collaborators: sampleCollaborators,
    },
};

// Homepoints Context
export const HomepointsContext = {
    args: {
        context: 'homepoints',
        placements: samplePlacements,
        gridSize: { rows: 4, cols: 4 },
    },
};

// Views Context (drop zone)
export const ViewsContext = {
    args: {
        context: 'views',
        placements: samplePlacements,
        gridSize: { rows: 4, cols: 4 },
    },
};

// Edit Mode
export const EditMode = () => {
    const [placements, setPlacements] = useState(samplePlacements);

    return (
        <GridLayoutPreview
            context="layout"
            placements={placements}
            gridSize={{ rows: 4, cols: 4 }}
            onApply={(newPlacements) => {
                console.log('Applied:', newPlacements);
                setPlacements(newPlacements);
            }}
        />
    );
};

// With Large Grid
export const LargeGrid = {
    args: {
        context: 'layout',
        placements: [
            ...samplePlacements,
            { id: '7', name: 'View 7', row: 3, col: 1, rowSpan: 1, colSpan: 1, color: 'indigo' },
            { id: '8', name: 'View 8', row: 3, col: 2, rowSpan: 1, colSpan: 1, color: 'teal' },
            { id: '9', name: 'View 9', row: 3, col: 3, rowSpan: 1, colSpan: 1, color: 'blue' },
            { id: '10', name: 'View 10', row: 4, col: 0, rowSpan: 1, colSpan: 2, color: 'green' },
            { id: '11', name: 'View 11', row: 4, col: 2, rowSpan: 1, colSpan: 2, color: 'pink' },
        ],
        gridSize: { rows: 6, cols: 4 },
    },
};

// Empty Grid
export const EmptyGrid = {
    args: {
        context: 'layout',
        placements: [],
        gridSize: { rows: 3, cols: 3 },
    },
};

// With Overlapping Placements (conflict state)
export const WithOverlaps = {
    args: {
        context: 'layout',
        placements: [
            { id: '1', name: 'View A', row: 0, col: 0, rowSpan: 2, colSpan: 2, color: 'blue' },
            { id: '2', name: 'View B', row: 1, col: 1, rowSpan: 1, colSpan: 1, color: 'red' }, // Overlaps!
            { id: '3', name: 'View C', row: 2, col: 0, rowSpan: 1, colSpan: 1, color: 'green' },
        ],
        gridSize: { rows: 4, cols: 4 },
    },
};

// Interactive Example
export const Interactive = () => {
    const [placements, setPlacements] = useState(samplePlacements);
    const [gridSize, setGridSize] = useState({ rows: 4, cols: 4 });

    const handleApply = (newPlacements, newGridSize) => {
        console.log('Changes applied:', { placements: newPlacements, gridSize: newGridSize });
        setPlacements(newPlacements);
        if (newGridSize) setGridSize(newGridSize);
    };

    const handleNavigate = (viewport) => {
        console.log('Navigated to:', viewport);
    };

    const handleCellClick = (cell) => {
        console.log('Cell clicked:', cell);
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <GridLayoutPreview
                context="layout"
                placements={placements}
                gridSize={gridSize}
                onApply={handleApply}
                onNavigate={handleNavigate}
                onCellClick={handleCellClick}
            />
            <div style={{
                padding: '12px',
                background: '#1a1a1a',
                borderRadius: '6px',
                fontSize: '12px',
                color: 'rgba(255,255,255,0.5)'
            }}>
                <p>• Click Edit button to enter edit mode</p>
                <p>• Drag cells to reorder</p>
                <p>• Use D-Pad or click cells to navigate</p>
                <p>• Use zoom controls to adjust view</p>
            </div>
        </div>
    );
};

Interactive.decorators = [
    (Story) => (
        <div style={{
            width: '340px',
            background: '#0f0f0f',
            borderRadius: '8px',
            padding: '12px'
        }}>
            <Story />
        </div>
    ),
];