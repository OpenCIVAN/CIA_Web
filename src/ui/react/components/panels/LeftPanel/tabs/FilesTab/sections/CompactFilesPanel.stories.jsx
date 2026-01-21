/**
 * @file CompactFilesPanel.stories.jsx
 * @description Storybook stories for the CompactFilesPanel component
 */

import React, { useState } from 'react';
import { CompactFilesPanel } from './CompactFilesPanel';

export default {
    title: 'FilesTab/CompactFilesPanel',
    component: CompactFilesPanel,
    decorators: [
        (Story) => (
            <div style={{ maxWidth: '320px', height: '280px', background: 'var(--color-bg-secondary, #12121a)', borderRadius: '8px', display: 'flex', flexDirection: 'column' }}>
                <Story />
            </div>
        ),
    ],
};

const mockStarredFiles = [
    { id: 'f1', name: 'brain_scan.nii.gz', fileType: 'nifti', size: '256 MB', starred: true },
    { id: 'f2', name: 'ct_chest.dcm', fileType: 'dicom', size: '512 MB', starred: true },
];

const mockLoadedDatasets = [
    {
        id: 'ds1',
        name: 'brain_scan.nii.gz',
        type: 'nifti',
        size: '256 MB',
        views: [
            { id: 'v1', name: 'Main View', color: '#3b82f6', active: true, scope: 'personal' },
        ],
    },
    {
        id: 'ds2',
        name: 'ct_chest.dcm',
        type: 'dicom',
        size: '512 MB',
        views: [
            { id: 'v2', name: 'Lung View', color: '#10b981', active: false, scope: 'shared' },
        ],
    },
];

const mockAllFiles = [
    { id: 'f1', name: 'brain_scan.nii.gz', fileType: 'nifti', size: '256 MB' },
    { id: 'f2', name: 'ct_chest.dcm', fileType: 'dicom', size: '512 MB' },
    { id: 'f3', name: 'analysis_data.csv', fileType: 'csv', size: '1.2 MB' },
    { id: 'f4', name: 'report.pdf', fileType: 'pdf', size: '2.4 MB' },
    { id: 'f5', name: 'screenshot.png', fileType: 'png', size: '340 KB' },
];

const Template = (args) => (
    <CompactFilesPanel
        {...args}
        onFileClick={(file) => console.log('File clicked:', file.name)}
        onFileDoubleClick={(file) => console.log('File double-clicked:', file.name)}
        onToggleStar={(fileId) => console.log('Toggle star:', fileId)}
        onViewClick={(viewId) => console.log('View clicked:', viewId)}
    />
);

export const Default = Template.bind({});
Default.args = {
    starredFiles: mockStarredFiles,
    loadedDatasets: mockLoadedDatasets,
    allFiles: mockAllFiles,
    containerWidth: 320,
};

export const NarrowWidth = Template.bind({});
NarrowWidth.args = {
    starredFiles: mockStarredFiles,
    loadedDatasets: mockLoadedDatasets,
    allFiles: mockAllFiles,
    containerWidth: 200,
};
NarrowWidth.decorators = [
    (Story) => (
        <div style={{ maxWidth: '200px', height: '280px', background: 'var(--color-bg-secondary, #12121a)', borderRadius: '8px', display: 'flex', flexDirection: 'column' }}>
            <Story />
        </div>
    ),
];

export const NoStarredFiles = Template.bind({});
NoStarredFiles.args = {
    starredFiles: [],
    loadedDatasets: mockLoadedDatasets,
    allFiles: mockAllFiles,
    containerWidth: 320,
};

export const NoLoadedDatasets = Template.bind({});
NoLoadedDatasets.args = {
    starredFiles: mockStarredFiles,
    loadedDatasets: [],
    allFiles: mockAllFiles,
    containerWidth: 320,
};

export const NoFiles = Template.bind({});
NoFiles.args = {
    starredFiles: [],
    loadedDatasets: [],
    allFiles: [],
    containerWidth: 320,
};

export const ManyFiles = Template.bind({});
ManyFiles.args = {
    starredFiles: [
        ...mockStarredFiles,
        { id: 'f6', name: 'spine_model.vtp', fileType: 'vtp', size: '64 MB', starred: true },
        { id: 'f7', name: 'heart_scan.nii.gz', fileType: 'nifti', size: '384 MB', starred: true },
    ],
    loadedDatasets: [
        ...mockLoadedDatasets,
        {
            id: 'ds3',
            name: 'spine_model.vtp',
            type: 'vtp',
            size: '64 MB',
            views: [
                { id: 'v3', name: '3D Render', color: '#ef4444', active: false, scope: 'project' },
            ],
        },
    ],
    allFiles: [
        ...mockAllFiles,
        { id: 'f6', name: 'spine_model.vtp', fileType: 'vtp', size: '64 MB' },
        { id: 'f7', name: 'heart_scan.nii.gz', fileType: 'nifti', size: '384 MB' },
        { id: 'f8', name: 'results.csv', fileType: 'csv', size: '856 KB' },
    ],
    containerWidth: 320,
};

export const Interactive = () => {
    const [starredIds, setStarredIds] = useState(new Set(['f1', 'f2']));

    const handleToggleStar = (fileId) => {
        setStarredIds(prev => {
            const next = new Set(prev);
            next.has(fileId) ? next.delete(fileId) : next.add(fileId);
            return next;
        });
    };

    const starredFiles = mockAllFiles.filter(f => starredIds.has(f.id)).map(f => ({ ...f, starred: true }));
    const allFilesWithStarred = mockAllFiles.map(f => ({ ...f, starred: starredIds.has(f.id) }));

    return (
        <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
            <p style={{ fontSize: '11px', color: '#888', padding: '8px', flexShrink: 0 }}>
                Switch tabs and interact with files. Click star icons to toggle.
            </p>
            <div style={{ flex: 1, minHeight: 0 }}>
                <CompactFilesPanel
                    starredFiles={starredFiles}
                    loadedDatasets={mockLoadedDatasets}
                    allFiles={allFilesWithStarred}
                    containerWidth={320}
                    onToggleStar={handleToggleStar}
                    onFileClick={(file) => console.log('Selected:', file.name)}
                    onViewClick={(viewId) => console.log('View:', viewId)}
                />
            </div>
        </div>
    );
};

export const WideLayout = Template.bind({});
WideLayout.args = {
    starredFiles: mockStarredFiles,
    loadedDatasets: mockLoadedDatasets,
    allFiles: mockAllFiles,
    containerWidth: 400,
};
WideLayout.decorators = [
    (Story) => (
        <div style={{ maxWidth: '400px', height: '280px', background: 'var(--color-bg-secondary, #12121a)', borderRadius: '8px', display: 'flex', flexDirection: 'column' }}>
            <Story />
        </div>
    ),
];
