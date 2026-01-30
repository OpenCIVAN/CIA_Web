/**
 * @file CompanionPanel.jsx
 * @description Companion panel for Canvas Map - shows Views and Datasets tabs
 *
 * Provides:
 * - Views tab: List of all views across VGs
 * - Datasets tab: Loaded datasets for drag-drop
 */

import React, { memo, useState, useMemo } from 'react';
import { Icon } from '@UI/react/components/atoms/Icon';
import { SearchInput } from '@UI/react/components/molecules/SearchInput';
import { EmptyState } from '@UI/react/components/molecules/EmptyState';
import { ViewListItem } from './ViewListItem';
import { DatasetItem } from './DatasetItem';
import './CompanionPanel.scss';

/**
 * CompanionPanel - Views and Datasets side panel
 *
 * @param {Object} props
 * @param {boolean} props.isOpen - Whether panel is open
 * @param {string} props.activeTab - Active tab ('views' or 'datasets')
 * @param {Function} props.onTabChange - Tab change handler
 * @param {Array} props.views - All views data
 * @param {Array} props.datasets - All datasets data
 * @param {Function} props.onViewClick - View click handler
 * @param {Function} props.onDatasetClick - Dataset click handler
 * @param {Function} [props.onViewDragStart] - View drag start handler
 * @param {Function} [props.onDatasetDragStart] - Dataset drag start handler
 * @param {string} [props.sizeMode='standard'] - Size mode for compact rendering
 */
export const CompanionPanel = memo(function CompanionPanel({
  isOpen,
  activeTab,
  onTabChange,
  views = [],
  datasets = [],
  onViewClick,
  onDatasetClick,
  onViewDragStart,
  onDatasetDragStart,
  sizeMode = 'standard',
}) {
  const isCompact = sizeMode === 'compact';
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedDatasets, setExpandedDatasets] = useState(new Set());

  // Filter views by search
  const filteredViews = useMemo(() => {
    if (!searchQuery) return views;
    const query = searchQuery.toLowerCase();
    return views.filter(v =>
      v.name.toLowerCase().includes(query) ||
      v.vgName?.toLowerCase().includes(query)
    );
  }, [views, searchQuery]);

  // Filter datasets by search
  const filteredDatasets = useMemo(() => {
    if (!searchQuery) return datasets;
    const query = searchQuery.toLowerCase();
    return datasets.filter(d => d.name.toLowerCase().includes(query));
  }, [datasets, searchQuery]);

  // Toggle dataset expansion
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

  if (!isOpen) return null;

  return (
    <div className="companion-panel" data-size-mode={sizeMode}>
      {/* Header */}
      <div className="companion-panel__header">
        <div className="companion-panel__tabs">
          <button
            className={`companion-panel__tab companion-panel__tab--views ${activeTab === 'views' ? 'companion-panel__tab--active' : ''}`}
            onClick={() => onTabChange('views')}
            type="button"
          >
            <Icon name="eye" size={14} />
            {!isCompact && 'Views'}
          </button>
          <button
            className={`companion-panel__tab companion-panel__tab--datasets ${activeTab === 'datasets' ? 'companion-panel__tab--active' : ''}`}
            onClick={() => onTabChange('datasets')}
            type="button"
          >
            <Icon name="database" size={14} />
            {!isCompact && 'Data'}
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="companion-panel__content">
        <div className="companion-panel__search">
          <SearchInput
            value={searchQuery}
            onChange={setSearchQuery}
            placeholder={activeTab === 'views' ? 'Search views...' : 'Search datasets...'}
            size="sm"
          />
          <p className="companion-panel__hint">Drag to add to canvas</p>
        </div>
        {activeTab === 'views' && (
          <>
            {filteredViews.length > 0 ? (
              <div className="companion-panel__list">
                {filteredViews.map(view => (
                  <ViewListItem
                    key={view.id}
                    view={view}
                    vgName={view.vgName}
                    vgColor={view.vgColor}
                    onClick={onViewClick}
                    onDragStart={onViewDragStart}
                  />
                ))}
              </div>
            ) : (
              <EmptyState
                icon={searchQuery ? 'search' : 'layers'}
                title={searchQuery ? 'No views match your search' : 'No views yet'}
                size="sm"
              />
            )}
          </>
        )}

        {activeTab === 'datasets' && (
          <>
            {filteredDatasets.length > 0 ? (
              <div className="companion-panel__list">
                {filteredDatasets.map(dataset => (
                  <DatasetItem
                    key={dataset.id}
                    dataset={dataset}
                    isExpanded={expandedDatasets.has(dataset.id)}
                    onToggle={toggleDataset}
                    onClick={onDatasetClick}
                    onDragStart={onDatasetDragStart}
                  />
                ))}
              </div>
            ) : (
              <EmptyState
                icon={searchQuery ? 'search' : 'database'}
                title={searchQuery ? 'No datasets match your search' : 'No datasets loaded'}
                size="sm"
              />
            )}
          </>
        )}
      </div>
    </div>
  );
});

export default CompanionPanel;
