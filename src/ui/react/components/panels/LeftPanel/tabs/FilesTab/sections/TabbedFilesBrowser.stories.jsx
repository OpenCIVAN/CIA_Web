/**
 * @file TabbedFilesBrowser.stories.jsx
 * @description Storybook stories for the TabbedFilesBrowser component
 */

import React, { useState } from 'react';
import { TabbedFilesBrowser } from './TabbedFilesBrowser';

export default {
    title: 'FilesTab/TabbedFilesBrowser',
    component: TabbedFilesBrowser,
    decorators: [
        (Story) => (
            <div style={{ maxWidth: '360px', height: '500px', background: 'var(--color-bg-secondary, #12121a)', borderRadius: '8px', display: 'flex', flexDirection: 'column' }}>
                <Story />
            </div>
        ),
    ],
};

const mockLoadedDatasets = [
    {
        id: 'ds1',
        name: 'brain_scan.nii.gz',
        type: 'nifti',
        size: '256 MB',
        views: [
            { id: 'v1', name: 'Main View', color: '#3b82f6', active: true, scope: 'personal' },
            { id: 'v2', name: 'Sagittal', color: '#10b981', active: false, scope: 'shared' },
        ],
    },
    {
        id: 'ds2',
        name: 'ct_chest.dcm',
        type: 'dicom',
        size: '512 MB',
        views: [
            { id: 'v3', name: 'Lung View', color: '#f59e0b', active: false, scope: 'workspace' },
        ],
    },
];

const mockAllFiles = [
    { id: 'f1', name: 'brain_scan.nii.gz', fileType: 'nifti', size: '256 MB', folderId: null, modifiedAt: '2024-01-15' },
    { id: 'f2', name: 'ct_chest.dcm', fileType: 'dicom', size: '512 MB', folderId: null, modifiedAt: '2024-01-14' },
    { id: 'f3', name: 'analysis_data.csv', fileType: 'csv', size: '1.2 MB', folderId: null, modifiedAt: '2024-01-13' },
    { id: 'f4', name: 'report.pdf', fileType: 'pdf', size: '2.4 MB', folderId: 'folder1', modifiedAt: '2024-01-12' },
    { id: 'f5', name: 'screenshot.png', fileType: 'png', size: '340 KB', folderId: 'folder1', modifiedAt: '2024-01-11' },
    { id: 'f6', name: 'spine_model.vtp', fileType: 'vtp', size: '64 MB', folderId: 'folder2', modifiedAt: '2024-01-10' },
];

const mockFolders = [
    { id: 'folder1', name: 'Raw Scans', parentId: null },
    { id: 'folder2', name: 'Processed', parentId: null },
    { id: 'folder3', name: 'Session 1', parentId: 'folder1' },
];

const Template = (args) => {
    const [activeTab, setActiveTab] = useState(args.activeTab || 'all');

    return (
        <TabbedFilesBrowser
            {...args}
            activeTab={activeTab}
            onTabChange={setActiveTab}
            onFileClick={(file) => console.log('File clicked:', file.name)}
            onFileDoubleClick={(file) => console.log('File double-clicked:', file.name)}
            onToggleStar={(fileId) => console.log('Toggle star:', fileId)}
            onViewClick={(viewId) => console.log('View clicked:', viewId)}
        />
    );
};

export const AllFilesTab = Template.bind({});
AllFilesTab.args = {
    loadedDatasets: mockLoadedDatasets,
    allFiles: mockAllFiles,
    folders: mockFolders,
    activeTab: 'all',
};

export const LoadedTab = Template.bind({});
LoadedTab.args = {
    loadedDatasets: mockLoadedDatasets,
    allFiles: mockAllFiles,
    folders: mockFolders,
    activeTab: 'loaded',
};

export const EmptyLoadedTab = Template.bind({});
EmptyLoadedTab.args = {
    loadedDatasets: [],
    allFiles: mockAllFiles,
    folders: mockFolders,
    activeTab: 'loaded',
};

export const EmptyAllFiles = Template.bind({});
EmptyAllFiles.args = {
    loadedDatasets: mockLoadedDatasets,
    allFiles: [],
    folders: [],
    activeTab: 'all',
};

export const WithFolders = Template.bind({});
WithFolders.args = {
    loadedDatasets: mockLoadedDatasets,
    allFiles: mockAllFiles,
    folders: mockFolders,
    activeTab: 'all',
};

export const ManyLoadedDatasets = Template.bind({});
ManyLoadedDatasets.args = {
    loadedDatasets: [
        ...mockLoadedDatasets,
        {
            id: 'ds3',
            name: 'spine_model.vtp',
            type: 'vtp',
            size: '64 MB',
            views: [
                { id: 'v4', name: '3D Render', color: '#ef4444', active: false, scope: 'project' },
            ],
        },
        {
            id: 'ds4',
            name: 'heart_scan.nii.gz',
            type: 'nifti',
            size: '384 MB',
            views: [
                { id: 'v5', name: 'Cardiac View', color: '#8b5cf6', active: true, scope: 'personal' },
                { id: 'v6', name: 'Flow Analysis', color: '#ec4899', active: false, scope: 'shared' },
            ],
        },
    ],
    allFiles: mockAllFiles,
    folders: mockFolders,
    activeTab: 'loaded',
};

export const ManyFiles = Template.bind({});
ManyFiles.args = {
    loadedDatasets: mockLoadedDatasets,
    allFiles: [
        ...mockAllFiles,
        { id: 'f7', name: 'patient_notes.md', fileType: 'md', size: '12 KB', folderId: null, modifiedAt: '2024-01-09' },
        { id: 'f8', name: 'scan_2023.nii.gz', fileType: 'nifti', size: '384 MB', folderId: null, modifiedAt: '2024-01-08' },
        { id: 'f9', name: 'results.csv', fileType: 'csv', size: '856 KB', folderId: null, modifiedAt: '2024-01-07' },
        { id: 'f10', name: 'volume_data.vti', fileType: 'vti', size: '128 MB', folderId: null, modifiedAt: '2024-01-06' },
        { id: 'f11', name: 'documentation.pdf', fileType: 'pdf', size: '4.2 MB', folderId: null, modifiedAt: '2024-01-05' },
    ],
    folders: mockFolders,
    activeTab: 'all',
};

export const Interactive = () => {
    const [activeTab, setActiveTab] = useState('all');
    const [starredIds, setStarredIds] = useState(new Set(['f1', 'f3']));

    const handleToggleStar = (fileId) => {
        setStarredIds(prev => {
            const next = new Set(prev);
            next.has(fileId) ? next.delete(fileId) : next.add(fileId);
            return next;
        });
    };

    const filesWithStarred = mockAllFiles.map(f => ({
        ...f,
        starred: starredIds.has(f.id),
    }));

    return (
        <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
            <p style={{ fontSize: '11px', color: '#888', padding: '8px', flexShrink: 0 }}>
                Switch tabs, search, filter, and sort. Click star icons to toggle.
            </p>
            <div style={{ flex: 1, minHeight: 0 }}>
                <TabbedFilesBrowser
                    loadedDatasets={mockLoadedDatasets}
                    allFiles={filesWithStarred}
                    folders={mockFolders}
                    activeTab={activeTab}
                    onTabChange={setActiveTab}
                    onToggleStar={handleToggleStar}
                    onFileClick={(file) => console.log('Selected:', file.name)}
                    onViewClick={(viewId) => console.log('View:', viewId)}
                />
            </div>
        </div>
    );
};
