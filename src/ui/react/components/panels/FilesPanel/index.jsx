// src/ui/react/components/panels/FilesPanel/index.jsx
// Production-ready tree with collapse and instance grouping
import React, { useState } from 'react';
import {
    FolderOpen,
    Loader,
    ChevronDown,
    ChevronRight,
    ChevronUp,
    ChevronLeft,
    Search,
    Filter as FilterIcon,
    BookmarkCheck,
    User,
    Users,
    Archive,
    File,
    Eye,
    Plus,
    X
} from 'lucide-react';

import { useDatasets } from '@UI/react/hooks/useDatasets.js';
import { useFileOperations } from './useFileOperations.js';
import { SampleFileList } from './SampleFileList.jsx';
import { FileUploadButton } from './FileUploadButton.jsx';

import '@UI/react/components/panels/FilesPanel/FilesPanel.scss';

const SAMPLE_FILES = [
    { name: 'Skull.vtp', path: '/vtp_files/Skull.vtp', size: '19.5 MB' },
    { name: 'Bones.vtp', path: '/vtp_files/Bones.vtp', size: '26 MB' },
    { name: 'Diskout.vtp', path: '/vtp_files/Diskout.vtp', size: '472 KB' },
    { name: 'Lungs.vtp', path: '/vtp_files/Lungs.vtp', size: '10 MB' },
    { name: 'LungVessels.vtp', path: '/vtp_files/LungVessels.vtp', size: '27 MB' },
    { name: 'Earth.vtp', path: '/vtp_files/Earth.vtp', size: '1.2 MB' }
];

export function FilesPanel({ isCollapsed = false, onToggle }) {
    const datasets = useDatasets();
    const { loadSample, uploadFile } = useFileOperations();

    // Main panel state
    const [activeTab, setActiveTab] = useState('datasets');
    const [uploadType, setUploadType] = useState('samples');
    const [error, setError] = useState(null);

    // Tree folder expansion state
    const [expandedFolders, setExpandedFolders] = useState({
        'my': true,
        'shared': false,
        'inactive': false
    });

    // Dataset expansion state (for showing instances under dataset)
    const [expandedDatasets, setExpandedDatasets] = useState(new Set());

    // Quick Access state
    const [quickAccessOpen, setQuickAccessOpen] = useState(false);
    const [quickAccessTab, setQuickAccessTab] = useState('annotations');

    const isAnyLoading = datasets.some(d => d.isLoading);

    // Remove duplicates and categorize
    const uniqueDatasets = Array.from(
        new Map(datasets.map(ds => [ds.id, ds])).values()
    );

    const myDatasets = uniqueDatasets.filter(ds => !ds.sharedWith && ds.status !== 'inactive');
    const sharedDatasets = uniqueDatasets.filter(ds => ds.sharedWith);
    const inactiveDatasets = uniqueDatasets.filter(ds => ds.status === 'inactive');

    // Handle dataset click with Shift support
    const requestVisualization = (datasetId, shiftKey = false) => {
        window.dispatchEvent(new CustomEvent('cia:request-instance', {
            detail: {
                datasetId,
                spawnNew: shiftKey
            }
        }));
    };

    const handleSampleSelect = async (sample) => {
        setError(null);
        try {
            const datasetId = await loadSample(sample);
            if (datasetId) {
                requestVisualization(datasetId, true);
            }
        } catch (err) {
            setError(err.message);
        }
    };

    const handleFileUpload = async (file) => {
        setError(null);
        try {
            const datasetId = await uploadFile(file);
            if (datasetId) {
                requestVisualization(datasetId, true);
            }
        } catch (err) {
            setError(err.message);
        }
    };

    const handleDatasetClick = (dataset, event) => {
        if (dataset.isLoading) return;
        requestVisualization(dataset.id, event.shiftKey);
    };

    const toggleFolder = (folderId) => {
        setExpandedFolders(prev => ({
            ...prev,
            [folderId]: !prev[folderId]
        }));
    };

    const toggleDataset = (datasetId) => {
        setExpandedDatasets(prev => {
            const next = new Set(prev);
            if (next.has(datasetId)) {
                next.delete(datasetId);
            } else {
                next.add(datasetId);
            }
            return next;
        });
    };

    // If collapsed, show activity bar
    if (isCollapsed) {
        return (
            <div className="files-panel files-panel--collapsed">
                <FilesActivityBar
                    myCount={myDatasets.length}
                    sharedCount={sharedDatasets.length}
                    inactiveCount={inactiveDatasets.length}
                    onExpand={onToggle}
                />
            </div>
        );
    }

    return (
        <div className="files-panel">
            {/* Panel Header */}
            <div className="files-panel__header">
                <div className="files-panel__title">
                    <FolderOpen size={16} className="files-panel__title-icon" />
                    <span>Data</span>
                </div>
                {onToggle && (
                    <button
                        className="files-panel__collapse-btn"
                        onClick={onToggle}
                        title="Collapse panel"
                    >
                        <ChevronLeft size={16} />
                    </button>
                )}
            </div>

            {/* Tabs for Datasets/Files */}
            <div className="files-panel__tabs">
                <button
                    className={`files-panel__tab ${activeTab === 'datasets' ? 'active' : ''}`}
                    onClick={() => setActiveTab('datasets')}
                >
                    Datasets
                </button>
                <button
                    className={`files-panel__tab ${activeTab === 'files' ? 'active' : ''}`}
                    onClick={() => setActiveTab('files')}
                >
                    Files
                </button>
            </div>

            {/* Main Content Area */}
            <div className={`files-panel__content ${quickAccessOpen ? 'split' : 'full'}`}>
                {error && (
                    <div className="files-panel__error">
                        {error}
                    </div>
                )}

                {activeTab === 'datasets' ? (
                    /* ========================================
                       DATASETS TAB - TREE STRUCTURE
                       ======================================== */
                    <div className="files-panel__datasets-view">
                        {/* Tree Structure */}
                        <div className="files-panel__tree">
                            {/* My Instances Folder */}
                            <div className="tree-folder" data-folder="my">
                                <button
                                    className="tree-folder__header"
                                    onClick={() => toggleFolder('my')}
                                >
                                    <span className="tree-folder__chevron">
                                        {expandedFolders.my ? (
                                            <ChevronDown size={16} />
                                        ) : (
                                            <ChevronRight size={16} />
                                        )}
                                    </span>
                                    <span className="tree-folder__icon">
                                        <User size={18} />
                                    </span>
                                    <span className="tree-folder__label">My Instances</span>
                                    <span className="tree-folder__count">({myDatasets.length})</span>
                                </button>

                                {expandedFolders.my && (
                                    <div className="tree-folder__children">
                                        {isAnyLoading && (
                                            <div className="tree-item tree-item--loading">
                                                <Loader size={14} className="spinner" />
                                                <span>Loading datasets...</span>
                                            </div>
                                        )}
                                        {myDatasets.map(dataset => (
                                            <DatasetTreeItem
                                                key={dataset.id}
                                                dataset={dataset}
                                                expanded={expandedDatasets.has(dataset.id)}
                                                onToggle={() => toggleDataset(dataset.id)}
                                                onClick={(e) => handleDatasetClick(dataset, e)}
                                            />
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* Shared with Me Folder */}
                            <div className="tree-folder tree-folder--highlighted" data-folder="shared">
                                <button
                                    className="tree-folder__header"
                                    onClick={() => toggleFolder('shared')}
                                >
                                    <span className="tree-folder__chevron">
                                        {expandedFolders.shared ? (
                                            <ChevronDown size={16} />
                                        ) : (
                                            <ChevronRight size={16} />
                                        )}
                                    </span>
                                    <span className="tree-folder__icon">
                                        <Users size={18} />
                                    </span>
                                    <span className="tree-folder__label">Shared with Me</span>
                                    {sharedDatasets.length > 0 && (
                                        <span className="tree-folder__badge">{sharedDatasets.length}</span>
                                    )}
                                </button>

                                {expandedFolders.shared && (
                                    <div className="tree-folder__children">
                                        {sharedDatasets.length === 0 ? (
                                            <div className="tree-item tree-item--empty">
                                                <span>No shared datasets yet</span>
                                            </div>
                                        ) : (
                                            sharedDatasets.map(dataset => (
                                                <DatasetTreeItem
                                                    key={dataset.id}
                                                    dataset={dataset}
                                                    expanded={expandedDatasets.has(dataset.id)}
                                                    onToggle={() => toggleDataset(dataset.id)}
                                                    onClick={(e) => handleDatasetClick(dataset, e)}
                                                />
                                            ))
                                        )}
                                    </div>
                                )}
                            </div>

                            {/* Inactive Folder */}
                            <div className="tree-folder" data-folder="inactive">
                                <button
                                    className="tree-folder__header"
                                    onClick={() => toggleFolder('inactive')}
                                >
                                    <span className="tree-folder__chevron">
                                        {expandedFolders.inactive ? (
                                            <ChevronDown size={16} />
                                        ) : (
                                            <ChevronRight size={16} />
                                        )}
                                    </span>
                                    <span className="tree-folder__icon">
                                        <Archive size={18} />
                                    </span>
                                    <span className="tree-folder__label">Inactive</span>
                                    <span className="tree-folder__count">({inactiveDatasets.length})</span>
                                </button>

                                {expandedFolders.inactive && (
                                    <div className="tree-folder__children">
                                        {inactiveDatasets.length === 0 ? (
                                            <div className="tree-item tree-item--empty">
                                                <span>No inactive datasets</span>
                                            </div>
                                        ) : (
                                            inactiveDatasets.map(dataset => (
                                                <DatasetTreeItem
                                                    key={dataset.id}
                                                    dataset={dataset}
                                                    expanded={expandedDatasets.has(dataset.id)}
                                                    onToggle={() => toggleDataset(dataset.id)}
                                                    onClick={(e) => handleDatasetClick(dataset, e)}
                                                />
                                            ))
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Interaction hint at bottom */}
                        <div className="files-panel__hint">
                            <span className="files-panel__hint-text">
                                💡 Tip: <strong>Shift+Click</strong> to open in new window
                            </span>
                        </div>
                    </div>
                ) : (
                    /* ========================================
                       FILES TAB
                       ======================================== */
                    <div className="files-panel__files-view">
                        <div className="files-panel__upload-section">
                            <div className="files-panel__tabs">
                                <button
                                    className={`files-panel__tab ${uploadType === 'samples' ? 'active' : ''}`}
                                    onClick={() => setUploadType('samples')}
                                    disabled={isAnyLoading}
                                >
                                    Sample Files
                                </button>
                                <button
                                    className={`files-panel__tab ${uploadType === 'upload' ? 'active' : ''}`}
                                    onClick={() => setUploadType('upload')}
                                    disabled={isAnyLoading}
                                >
                                    Upload VTP
                                </button>
                            </div>

                            {uploadType === 'samples' ? (
                                <SampleFileList
                                    samples={SAMPLE_FILES}
                                    onSelectSample={handleSampleSelect}
                                    disabled={isAnyLoading}
                                />
                            ) : (
                                <FileUploadButton
                                    onFileSelect={handleFileUpload}
                                    disabled={isAnyLoading}
                                />
                            )}
                        </div>
                    </div>
                )}
            </div>

            {/* Quick Access Section */}
            {quickAccessOpen && (
                <div className="files-panel__quick-access">
                    <div className="quick-access__header">
                        <span className="quick-access__title">Quick Access</span>
                        <button
                            className="quick-access__close-btn"
                            onClick={() => setQuickAccessOpen(false)}
                        >
                            <ChevronDown size={14} />
                        </button>
                    </div>

                    <div className="quick-access__tabs">
                        <button
                            className={`quick-access__tab ${quickAccessTab === 'annotations' ? 'active' : ''}`}
                            onClick={() => setQuickAccessTab('annotations')}
                        >
                            <Search size={16} />
                            <span>Annotations</span>
                        </button>
                        <button
                            className={`quick-access__tab ${quickAccessTab === 'filters' ? 'active' : ''}`}
                            onClick={() => setQuickAccessTab('filters')}
                        >
                            <FilterIcon size={16} />
                            <span>Filters</span>
                        </button>
                        <button
                            className={`quick-access__tab ${quickAccessTab === 'views' ? 'active' : ''}`}
                            onClick={() => setQuickAccessTab('views')}
                        >
                            <BookmarkCheck size={16} />
                            <span>Views</span>
                        </button>
                    </div>

                    <div className="quick-access__content">
                        <div className="quick-access__placeholder">
                            {quickAccessTab === 'annotations' && (
                                <>
                                    <Search size={32} />
                                    <div>Global annotation search</div>
                                    <span>Search annotations across all datasets</span>
                                </>
                            )}
                            {quickAccessTab === 'filters' && (
                                <>
                                    <FilterIcon size={32} />
                                    <div>Saved filters</div>
                                    <span>Quick access to your saved filter configurations</span>
                                </>
                            )}
                            {quickAccessTab === 'views' && (
                                <>
                                    <BookmarkCheck size={32} />
                                    <div>Saved views</div>
                                    <span>Restore camera positions and visualization settings</span>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Quick Access Toggle */}
            {!quickAccessOpen && (
                <button
                    className="files-panel__quick-toggle"
                    onClick={() => setQuickAccessOpen(true)}
                >
                    <ChevronUp size={14} />
                    <span>Quick Access</span>
                </button>
            )}
        </div>
    );
}

/**
 * FilesActivityBar - Collapsed state with icons
 */
function FilesActivityBar({ myCount, sharedCount, inactiveCount, onExpand }) {
    return (
        <div className="activity-bar">
            <div className="activity-bar__content">
                <button className="activity-bar-icon" title={`My Instances (${myCount})`}>
                    <User size={20} />
                    {myCount > 0 && (
                        <span className="activity-bar-icon__badge">{myCount}</span>
                    )}
                </button>

                <button className="activity-bar-icon" title={`Shared with Me (${sharedCount})`}>
                    <Users size={20} />
                    {sharedCount > 0 && (
                        <span className="activity-bar-icon__badge">{sharedCount}</span>
                    )}
                </button>

                <button className="activity-bar-icon" title={`Inactive (${inactiveCount})`}>
                    <Archive size={20} />
                </button>
            </div>

            <button
                className="activity-bar__expand"
                onClick={onExpand}
                title="Expand data panel"
            >
                <ChevronRight size={20} />
            </button>
        </div>
    );
}

/**
 * DatasetTreeItem - Expandable dataset with instances
 */
function DatasetTreeItem({ dataset, expanded, onToggle, onClick }) {
    // TODO: Get actual instances for this dataset from InstanceManager
    const instances = []; // Will be populated when InstanceManager tracks by dataset
    const hasInstances = instances.length > 0;

    const pointCount = dataset.pointCount || 0;
    const dataType = dataset.dataType || 'Unknown';

    return (
        <div className="tree-dataset">
            <div className="tree-dataset__row">
                {/* Expand chevron (only if has instances) */}
                {hasInstances && (
                    <button
                        className="tree-dataset__chevron"
                        onClick={(e) => {
                            e.stopPropagation();
                            onToggle();
                        }}
                    >
                        {expanded ? (
                            <ChevronDown size={14} />
                        ) : (
                            <ChevronRight size={14} />
                        )}
                    </button>
                )}

                {/* Dataset button */}
                <button
                    className={`tree-item tree-item--dataset ${dataset.isLoading ? 'loading' : ''} ${!hasInstances ? 'tree-item--no-chevron' : ''}`}
                    onClick={onClick}
                    disabled={dataset.isLoading}
                    title={`${dataset.name}\nClick to replace • Shift+Click for new window`}
                >
                    <span className="tree-item__icon">
                        <File size={14} />
                    </span>
                    <div className="tree-item__content">
                        <span className="tree-item__name">{dataset.name}</span>
                        <span className="tree-item__meta">
                            {pointCount.toLocaleString()} points • {dataType}
                        </span>
                    </div>
                    {dataset.isLoading && (
                        <Loader size={12} className="spinner tree-item__spinner" />
                    )}
                </button>
            </div>

            {/* Instances (nested under dataset) */}
            {expanded && hasInstances && (
                <div className="tree-dataset__instances">
                    {instances.map(instance => (
                        <div key={instance.id} className="tree-item tree-item--instance">
                            <span className="tree-item__icon">
                                <Eye size={12} />
                            </span>
                            <div className="tree-item__content">
                                <span className="tree-item__name">Window {instance.windowId}</span>
                                <span className="tree-item__meta">{instance.viewType || 'Default view'}</span>
                            </div>
                            <button
                                className="tree-item__action"
                                onClick={() => {/* Focus instance */ }}
                                title="Focus this window"
                            >
                                <Eye size={12} />
                            </button>
                            <button
                                className="tree-item__action"
                                onClick={() => {/* Close instance */ }}
                                title="Close window"
                            >
                                <X size={12} />
                            </button>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}