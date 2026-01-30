/**
 * @file LayoutPanel.jsx
 * @description Layout mode panel content for Canvas Map V2
 *
 * Shows:
 * - On Canvas: Active VG list with layout previews
 * - Inactive: Closed VGs that can be restored
 * - Focused VG edit controls (when drilling into a VG)
 */

import React, { memo, useState, useCallback } from 'react';
import { Icon } from '@UI/react/components/atoms/Icon';
import { Button } from '@UI/react/components/atoms/Button';
import { Badge } from '@UI/react/components/atoms/Badge';
import { ChipGroup } from '@UI/react/components/molecules/ChipGroup';
import { VGListItem, PanelSection, FilterToolbarCompact, QuickFiltersRow } from '../shared';
import { getVGDisplayName } from '../../utils/gridUtils';

/**
 * LayoutPanel - Layout mode content
 */
export const LayoutPanel = memo(function LayoutPanel({
  viewGroups = [],
  filteredVGs = [],
  inactiveVGs = [],
  selectedVGId,
  focusedVG,
  searchQuery,
  setSearchQuery,
  filter,
  quickFilterDefs = [],
  quickFilterCounts = {},
  onVGClick,
  onVGDoubleClick,
  onVGRestore,
  onAddVG,
  onChangeLayout,
  onAddView,
  onDuplicate,
  onLink,
  onSaveTemplate,
  onNameGroup,
  sizeMode = 'standard',
}) {
  const isCompact = sizeMode === 'compact';
  const [showQuickFilters, setShowQuickFilters] = useState(!isCompact);

  // Filter state for ChipGroup
  const [activeFilter, setActiveFilter] = useState('all');

  const handleFilterToggle = useCallback((filterId) => {
    setActiveFilter(filterId);
  }, []);

  const explicitCount = viewGroups.filter(v => v.isExplicit).length;
  const implicitCount = viewGroups.filter(v => !v.isExplicit).length;

  const effectiveSearchQuery = filter?.searchQuery ?? searchQuery ?? '';
  const handleSearchChange = filter?.setSearchQuery ?? setSearchQuery;
  const activeQuickFilters = filter?.quickFilters ?? [];
  const handleToggleQuickFilter = filter?.toggleQuickFilter ?? (() => {});
  const activeFilterCount = filter?.activeFilterCount ?? 0;

  // Apply filter
  const displayVGs = activeFilter === 'all'
    ? filteredVGs
    : activeFilter === 'explicit'
      ? filteredVGs.filter(v => v.isExplicit)
      : filteredVGs.filter(v => !v.isExplicit);

  // If focused on a VG, show edit controls
  if (focusedVG) {
    return (
      <div className="contextual-panel">
        <PanelSection title="Edit ViewGroup" icon="pencil" sizeMode={sizeMode}>
          <div className="contextual-panel__actions">
            <Button variant="ghost" size="sm" icon="grid3x3" onClick={onChangeLayout}>
              {!isCompact && 'Change Layout'}
            </Button>
            <Button variant="ghost" size="sm" icon="plus" onClick={onAddView}>
              {!isCompact && 'Add View'}
            </Button>
            <Button variant="ghost" size="sm" icon="copy" onClick={onDuplicate}>
              {!isCompact && 'Duplicate'}
            </Button>
            <Button variant="ghost" size="sm" icon="link2" onClick={onLink}>
              {!isCompact && 'Link'}
            </Button>
            <Button variant="ghost" size="sm" icon="save" onClick={onSaveTemplate}>
              {!isCompact && 'Save Template'}
            </Button>
          </div>

          {/* Implicit group warning */}
          {!focusedVG.isExplicit && (
            <div className="contextual-panel__warning">
              <div className="contextual-panel__warning-header">
                <Icon name="alertCircle" size={12} />
                <span>Implicit Group</span>
              </div>
              <p>Give this group a name to save or share it.</p>
              <Button
                variant="primary"
                size="sm"
                onClick={() => onNameGroup?.(focusedVG.id)}
              >
                Name this group
              </Button>
            </div>
          )}
        </PanelSection>
      </div>
    );
  }

  return (
    <div className="contextual-panel">
      {/* On Canvas */}
      <PanelSection
        title="On Canvas"
        icon="package"
        actions={
          <>
            <Badge count={viewGroups.length} size="sm" />
            <button className="contextual-panel__icon-btn" onClick={onAddVG} title="Add VG">
              <Icon name="plus" size={14} />
            </button>
          </>
        }
        sizeMode={sizeMode}
      >
        <FilterToolbarCompact
          searchQuery={effectiveSearchQuery}
          onSearchChange={handleSearchChange}
          onToggleFilters={() => setShowQuickFilters(prev => !prev)}
          filtersOpen={showQuickFilters}
          activeFilterCount={activeFilterCount}
          placeholder="Search groups..."
        />
        {showQuickFilters && (
          <QuickFiltersRow
            quickFilterDefs={quickFilterDefs}
            activeFilters={activeQuickFilters}
            counts={quickFilterCounts}
            onToggle={handleToggleQuickFilter}
            compact={isCompact}
          />
        )}
        <ChipGroup
          chips={[
            { id: 'all', label: 'All' },
            { id: 'explicit', label: 'Explicit', count: explicitCount },
            { id: 'implicit', label: 'Implicit', count: implicitCount },
          ]}
          activeChips={[activeFilter]}
          onToggle={handleFilterToggle}
          size="sm"
          allowEmpty={false}
        />
        <p className="contextual-panel__hint">Drag VGs to reposition on canvas</p>
        <div className="contextual-panel__list">
          {displayVGs.map(vg => (
            <VGListItem
              key={vg.id}
              vg={vg}
              displayName={getVGDisplayName(vg)}
              isSelected={selectedVGId === vg.id}
              onClick={() => onVGClick(vg.id)}
              onDoubleClick={() => onVGDoubleClick(vg.id)}
            />
          ))}
        </div>
      </PanelSection>

      {/* Inactive VGs */}
      {inactiveVGs.length > 0 && (
        <PanelSection
          title="Inactive"
          icon="eyeOff"
          actions={<Badge count={inactiveVGs.length} size="sm" />}
          sizeMode={sizeMode}
        >
          <p className="contextual-panel__hint">Drag to canvas to restore, or click Restore</p>
          <div className="contextual-panel__list">
            {inactiveVGs.map(vg => (
              <VGListItem
                key={vg.id}
                vg={vg}
                displayName={getVGDisplayName(vg)}
                isSelected={false}
                isInactive
                onClick={() => {}}
                onDoubleClick={() => {}}
                onRestore={onVGRestore}
              />
            ))}
          </div>
        </PanelSection>
      )}
    </div>
  );
});

export default LayoutPanel;
