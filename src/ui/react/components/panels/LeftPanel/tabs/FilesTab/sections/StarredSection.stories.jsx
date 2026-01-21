/**
 * @file StarredSection.stories.jsx
 * @description Storybook stories for the StarredSection component
 */

import React, { useState } from 'react';
import { StarredSection } from './StarredSection';

export default {
    title: 'FilesTab/StarredSection',
    component: StarredSection,
    decorators: [
        (Story) => (
            <div style={{ maxWidth: '320px', background: 'var(--color-bg-secondary, #12121a)', borderRadius: '8px' }}>
                <Story />
            </div>
        ),
    ],
};

const mockStarredFiles = [
    { id: 'f1', name: 'brain_scan.nii.gz', fileType: 'nifti', size: '256 MB', starred: true },
    { id: 'f2', name: 'ct_chest.dcm', fileType: 'dicom', size: '512 MB', starred: true },
    { id: 'f3', name: 'report.pdf', fileType: 'pdf', type: 'document', size: '2.4 MB', starred: true },
    { id: 'f4', name: 'analysis_data.csv', fileType: 'csv', size: '1.2 MB', starred: true },
    { id: 'f5', name: 'screenshot.png', fileType: 'png', type: 'image', size: '340 KB', starred: true },
];

const Template = (args) => {
    const [expanded, setExpanded] = useState(args.expanded ?? true);
    const [height, setHeight] = useState(args.height ?? 140);

    return (
        <StarredSection
            {...args}
            expanded={expanded}
            onToggle={() => setExpanded(!expanded)}
            height={height}
            onFileClick={(file) => console.log('File clicked:', file.name)}
            onFileDoubleClick={(file) => console.log('File double-clicked:', file.name)}
            onToggleStar={(fileId) => console.log('Toggle star:', fileId)}
        />
    );
};

export const Default = Template.bind({});
Default.args = {
    items: mockStarredFiles,
    expanded: true,
    height: 180,
};

export const Collapsed = Template.bind({});
Collapsed.args = {
    items: mockStarredFiles,
    expanded: false,
};

export const Empty = Template.bind({});
Empty.args = {
    items: [],
    expanded: false,
};

export const SingleItem = Template.bind({});
SingleItem.args = {
    items: [mockStarredFiles[0]],
    expanded: true,
};

export const ManyItems = Template.bind({});
ManyItems.args = {
    items: [
        ...mockStarredFiles,
        { id: 'f6', name: 'spine_model.vtp', fileType: 'vtp', size: '64 MB', starred: true },
        { id: 'f7', name: 'patient_notes.md', fileType: 'md', type: 'document', size: '12 KB', starred: true },
        { id: 'f8', name: 'scan_2023.nii.gz', fileType: 'nifti', size: '384 MB', starred: true },
    ],
    expanded: true,
    height: 220,
};

export const WithActiveFilters = () => {
    const [expanded, setExpanded] = useState(true);

    const filters = {
        searchQuery: 'brain',
        typeFilters: ['nifti'],
    };

    const applyFilters = (items) => {
        return items.filter(item => {
            const matchesSearch = (item.name || '').toLowerCase().includes(filters.searchQuery.toLowerCase());
            const matchesType = filters.typeFilters.length === 0 || filters.typeFilters.includes(item.fileType);
            return matchesSearch && matchesType;
        });
    };

    return (
        <div>
            <p style={{ fontSize: '11px', color: '#888', padding: '8px', marginBottom: '8px' }}>
                Global filter active: searching "brain" in NIfTI files.
                Some starred items may be hidden.
            </p>
            <StarredSection
                items={mockStarredFiles}
                filters={filters}
                applyFilters={applyFilters}
                expanded={expanded}
                onToggle={() => setExpanded(!expanded)}
                height={180}
            />
        </div>
    );
};

export const OnlyDatasets = Template.bind({});
OnlyDatasets.args = {
    items: mockStarredFiles.filter(f => f.fileType === 'nifti' || f.fileType === 'dicom'),
    expanded: true,
};

export const OnlyDocuments = Template.bind({});
OnlyDocuments.args = {
    items: mockStarredFiles.filter(f => f.type === 'document' || f.type === 'image'),
    expanded: true,
};

export const Interactive = () => {
    const [items, setItems] = useState(mockStarredFiles);
    const [expanded, setExpanded] = useState(true);
    const [height, setHeight] = useState(180);
    const [isResizing, setIsResizing] = useState(false);

    const handleResizeStart = (e) => {
        e.preventDefault();
        setIsResizing(true);
        const startY = e.clientY;
        const startHeight = height;

        const handleMouseMove = (moveEvent) => {
            const delta = moveEvent.clientY - startY;
            setHeight(Math.max(80, Math.min(300, startHeight + delta)));
        };

        const handleMouseUp = () => {
            setIsResizing(false);
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);
        };

        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mouseup', handleMouseUp);
    };

    const handleToggleStar = (fileId) => {
        setItems(prev => prev.filter(f => f.id !== fileId));
    };

    return (
        <div>
            <p style={{ fontSize: '11px', color: '#888', padding: '8px', marginBottom: '8px' }}>
                Drag the resize handle to adjust height. Double-click files to unstar.
            </p>
            <StarredSection
                items={items}
                expanded={expanded}
                onToggle={() => setExpanded(!expanded)}
                height={height}
                onResizeStart={handleResizeStart}
                onToggleStar={handleToggleStar}
                onFileDoubleClick={(file) => handleToggleStar(file.id)}
            />
        </div>
    );
};
