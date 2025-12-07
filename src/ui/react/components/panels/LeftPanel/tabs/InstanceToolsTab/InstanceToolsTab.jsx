// tabs/InstanceToolsTab/InstanceToolsTab.jsx
// Instance tools tab content for the unified left panel
//
// Features:
// - Shows tools for the currently focused instance
// - Dynamically updates when active instance changes
// - Renders tools provided by the instance handler
// - Tools/Layers/Annotations sub-tabs for organization

import React, { useState, useCallback, useEffect } from 'react';
import {
    Zap,
    Layers,
    MapPin,
    Monitor,
    RotateCcw,
    Save,
} from 'lucide-react';

import { workspaceManager } from '@Core/instances/workspaceManager.js';
import { workspace as log } from '@Utils/logger.js';
import { ToolsList } from './ToolsSubtab';
import { LayersSubtab } from './LayersSubtab';
import { AnnotationsSubtab } from './AnnotationsSubtab';
import './InstanceToolsTab.scss';

// =============================================================================
// NO INSTANCE PLACEHOLDER
// =============================================================================

function NoInstancePlaceholder() {
    return (
        <div className="instance-tools-tab__no-instance">
            <Monitor size={32} />
            <h3>No Instance Selected</h3>
            <p>Click on an instance viewport to select it and see its tools here.</p>
            <span className="instance-tools-tab__no-instance-hint">
                You can also create a new instance by clicking a dataset in the Files panel.
            </span>
        </div>
    );
}

// =============================================================================
// MAIN COMPONENT
// =============================================================================

export function InstanceToolsPanelContent({ workspaceId }) {
    // State
    const [activeTab, setActiveTab] = useState('tools');
    const [activeInstance, setActiveInstance] = useState(null);
    const [tools, setTools] = useState([]);
    const [expandedMenus, setExpandedMenus] = useState({});
    const [layers, setLayers] = useState({
        cursors: { enabled: true, opacity: 1.0, count: 0, total: 0 },
        annotations: { enabled: true, opacity: 1.0, count: 0, total: 0 },
        widgets: { enabled: true, opacity: 1.0, count: 0, total: 0 },
    });

    // Handler to open full annotations panel
    const handleOpenFullAnnotations = useCallback(() => {
        window.dispatchEvent(new CustomEvent('cia:navigate-to-panel', {
            detail: { panelId: 'annotations' }
        }));
    }, []);

    // Subscribe to workspace changes
    useEffect(() => {
        const updateFromWorkspace = () => {
            const instance = workspaceManager.getActiveInstance();
            setActiveInstance(instance);

            if (instance?.handler && instance?.instanceData) {
                const instanceTools = instance.handler.getTools(instance.instanceData);
                setTools(instanceTools || []);
                log.debug(`Updated tools for instance ${instance.instanceId}:`, instanceTools?.length || 0);
            } else {
                setTools([]);
            }
        };

        updateFromWorkspace();
        workspaceManager.addListener(updateFromWorkspace);

        const handleToolsUpdated = (event) => {
            const { instanceId } = event.detail || {};
            const currentInstance = workspaceManager.getActiveInstance();
            if (currentInstance?.instanceId === instanceId) {
                updateFromWorkspace();
            }
        };
        window.addEventListener('cia:tools-updated', handleToolsUpdated);

        return () => {
            workspaceManager.removeListener(updateFromWorkspace);
            window.removeEventListener('cia:tools-updated', handleToolsUpdated);
        };
    }, []);

    // Toggle menu expansion
    const toggleMenu = useCallback((menuId) => {
        setExpandedMenus(prev => ({
            ...prev,
            [menuId]: !prev[menuId]
        }));
    }, []);

    // Toggle layer
    const toggleLayer = useCallback((layerKey) => {
        setLayers(prev => ({
            ...prev,
            [layerKey]: { ...prev[layerKey], enabled: !prev[layerKey].enabled }
        }));
    }, []);

    // Get instance display info
    const instanceInfo = activeInstance ? {
        name: activeInstance.instanceData?.dataset?.filename ||
            activeInstance.instanceData?.dataset?.fileName ||
            `Instance ${activeInstance.instanceId?.slice(0, 8)}`,
        type: activeInstance.type || 'unknown',
        color: activeInstance.color?.name || 'blue',
        dataset: activeInstance.instanceData?.dataset?.filename ||
            activeInstance.instanceData?.dataset?.fileName ||
            'No data loaded',
    } : null;

    // If no active instance, show placeholder
    if (!activeInstance) {
        return (
            <div className="instance-tools-tab">
                <NoInstancePlaceholder />
            </div>
        );
    }

    return (
        <div className="instance-tools-tab">
            {/* Focused Instance Header */}
            <div
                className="instance-tools-tab__instance-header"
                style={{ '--instance-color': activeInstance.color?.hex || 'var(--color-accent-blue)' }}
            >
                <Monitor size={14} />
                <div className="instance-tools-tab__instance-info">
                    <span className="instance-tools-tab__instance-name">{instanceInfo.name}</span>
                    <span className="instance-tools-tab__instance-dataset">{instanceInfo.dataset}</span>
                </div>
                <span className="instance-tools-tab__instance-type">{instanceInfo.type.toUpperCase()}</span>
            </div>

            {/* Tab Bar - 3 subtabs */}
            <div className="instance-tools-tab__tabs">
                <button
                    className={`instance-tools-tab__tab ${activeTab === 'tools' ? 'instance-tools-tab__tab--active' : ''}`}
                    onClick={() => setActiveTab('tools')}
                    data-color="amber"
                >
                    <Zap size={14} /> Tools
                </button>
                <button
                    className={`instance-tools-tab__tab ${activeTab === 'layers' ? 'instance-tools-tab__tab--active' : ''}`}
                    onClick={() => setActiveTab('layers')}
                    data-color="purple"
                >
                    <Layers size={14} /> Layers
                </button>
                <button
                    className={`instance-tools-tab__tab ${activeTab === 'annotations' ? 'instance-tools-tab__tab--active' : ''}`}
                    onClick={() => setActiveTab('annotations')}
                    data-color="pink"
                >
                    <MapPin size={14} /> Annotations
                </button>
            </div>

            {/* Content */}
            <div className="instance-tools-tab__content">
                {activeTab === 'tools' && (
                    <ToolsList
                        tools={tools}
                        expandedMenus={expandedMenus}
                        onToggleMenu={toggleMenu}
                    />
                )}

                {activeTab === 'layers' && (
                    <LayersSubtab
                        layers={layers}
                        onToggleLayer={toggleLayer}
                    />
                )}

                {activeTab === 'annotations' && (
                    <AnnotationsSubtab
                        instanceId={activeInstance?.instanceId}
                        onOpenFullPanel={handleOpenFullAnnotations}
                    />
                )}
            </div>

            {/* Footer */}
            <div className="instance-tools-tab__footer">
                <button className="instance-tools-tab__footer-btn">
                    <RotateCcw size={11} />
                    <span>Reset View</span>
                </button>
                <button className="instance-tools-tab__footer-btn">
                    <Save size={11} />
                    <span>Save State</span>
                </button>
            </div>
        </div>
    );
}

export default InstanceToolsPanelContent;