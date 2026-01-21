/**
 * @file SortDropdown.stories.jsx
 * @description Storybook stories for the SortDropdown molecule
 */

import React, { useState } from 'react';
import { SortDropdown } from './SortDropdown';

const SORT_OPTIONS = [
    { id: 'name', label: 'Name', icon: 'arrowDown' },
    { id: 'date', label: 'Date Modified', icon: 'calendar' },
    { id: 'size', label: 'Size', icon: 'arrowUp' },
    { id: 'type', label: 'Type', icon: 'fileText' },
];

export default {
    title: 'Molecules/SortDropdown',
    component: SortDropdown,
    argTypes: {
        showLabel: {
            control: 'boolean',
        },
        showOrder: {
            control: 'boolean',
        },
    },
    decorators: [
        (Story) => (
            <div style={{ padding: '20px', minHeight: '200px' }}>
                <Story />
            </div>
        ),
    ],
};

const Template = (args) => {
    const [value, setValue] = useState(args.value || 'name');
    const [order, setOrder] = useState(args.order || 'asc');

    return (
        <SortDropdown
            {...args}
            value={value}
            onChange={setValue}
            order={order}
            onOrderChange={setOrder}
            options={SORT_OPTIONS}
        />
    );
};

export const Default = Template.bind({});
Default.args = {
    value: 'name',
    showLabel: true,
    showOrder: false,
};

export const WithOrderToggle = Template.bind({});
WithOrderToggle.args = {
    value: 'date',
    showLabel: true,
    showOrder: true,
};

export const IconOnly = Template.bind({});
IconOnly.args = {
    value: 'name',
    showLabel: false,
    showOrder: false,
};

export const InToolbar = () => {
    const [sortBy, setSortBy] = useState('name');
    const [order, setOrder] = useState('asc');

    return (
        <div
            style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '8px 12px',
                background: 'var(--color-bg-secondary, #12121a)',
                borderRadius: '6px',
            }}
        >
            <span style={{ flex: 1, fontSize: '11px', color: 'var(--color-text-secondary)' }}>
                8 files
            </span>
            <SortDropdown
                value={sortBy}
                onChange={setSortBy}
                options={SORT_OPTIONS}
                showLabel
                showOrder
                order={order}
                onOrderChange={setOrder}
            />
        </div>
    );
};
