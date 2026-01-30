/**
 * @file CanvasMapContent.jsx
 * @description Canvas Map Panel V2 content component
 *
 * Primary Functions:
 * - Navigate the infinite canvas
 * - Manage ViewGroups (create, edit, merge, split, link)
 * - Visualize and follow collaborators with cursor tracking
 * - Understand linking relationships between VGs and Views
 *
 * V2 Features:
 * - Side QuickNavToolbar for quick actions
 * - Companion panel for Views & Datasets
 * - Pannable minimap for large canvases
 * - Real-time cursor tracking for collaborators
 */

import React, { memo, useMemo, useRef, useCallback } from 'react';
import { Icon } from '@UI/react/components/atoms/Icon';
import { useAdaptive } from '@UI/react/context/AdaptiveContext';
import { useViewGroups } from '@UI/react/hooks/useViewGroups';
import { useWorkspacePresence } from '@UI/react/hooks/useRoomPresence';
import { useBookmarks } from '@UI/react/hooks/useBookmarks';
import { useCanvas } from '@UI/react/hooks/useCanvas';
import { useDatasets } from '@UI/react/hooks/useDatasets';
import { useListFilter } from '@UI/react/hooks/useListFilter';

// V2 Components
import { ModeTabs } from './components/ModeTabs';
import { MapToolbar } from './components/MapToolbar';
import { Minimap } from './components/Minimap';
import { QuickNavToolbar } from './components/QuickNavToolbar';
import { CompanionPanel } from './components/CompanionPanel';
import { NavigatePanel, LayoutPanel, LinksPanel, TeamPanel } from './components/ContextualPanels';

// Hooks and Utils
import { useCanvasMapState } from './hooks/useCanvasMapState';
import { MAP_MODES, SIZE_MODE_BREAKPOINTS } from './utils/constants';
import { getVGDisplayName } from './utils/gridUtils';

// Styles - Component styles are imported by each component
import './CanvasMapPanel.scss';

/**
 * CanvasMapContent - V2 Content for the Canvas Map panel
 *
 * @param {Object} props
 * @param {string} props.workspaceId - Workspace ID for loading data
 * @param {number} props.width - Current panel width
 * @param {number} props.height - Current panel height
 * @param {string} props.sizeMode - 'compact' | 'standard' | 'expanded'
 */
export const CanvasMapContent = memo(function CanvasMapContent({
  workspaceId,
  width,
  height,
  sizeMode: panelSizeMode,
}) {
  const { isVR } = useAdaptive();
  const minimapContainerRef = useRef(null);

  // ---------------------------------------------------------------------------
  // Load real data from hooks
  // ---------------------------------------------------------------------------

  // Canvas data
  const { canvas, viewport } = useCanvas();

  // Loaded datasets
  const loadedDatasets = useDatasets();

  // ViewGroups
  const {
    viewGroups: rawViewGroups,
    visibleViewGroups,
    isLoading: vgLoading,
  } = useViewGroups(workspaceId);

  // Collaborators
  const { users: rawCollaborators } = useWorkspacePresence(workspaceId);

  // Bookmarks
  const {
    bookmarks: rawBookmarks,
    isLoading: bookmarksLoading,
  } = useBookmarks({ workspaceId, scope: 'all' });

  // ---------------------------------------------------------------------------
  // Transform data to match expected structure
  // ---------------------------------------------------------------------------

  // Transform canvas data
  const canvasData = useMemo(() => ({
    rows: canvas?.dimensions?.rows || 4,
    cols: canvas?.dimensions?.cols || 4,
    homePosition: { row: 0, col: 0 }, // TODO: Get from user preferences
  }), [canvas]);

  // Transform ViewGroups to expected structure
  const viewGroups = useMemo(() => {
    return (visibleViewGroups || []).map(vg => ({
      id: vg.id,
      name: vg.name,
      color: vg.color || '#a855f7',
      isExplicit: !!vg.name,
      isActive: vg.row !== undefined && vg.col !== undefined,
      isLinked: !!vg.link,
      isShared: vg.isShared ?? (vg.sharedWith?.length > 0),
      isStarred: vg.isStarred ?? vg.starred ?? false,
      layoutId: vg.layout?.type || 'single',
      position: vg.row !== undefined ? {
        row: vg.row,
        col: vg.col,
        rowSpan: vg.rowSpan || 1,
        colSpan: vg.colSpan || 1,
      } : null,
      views: vg.views || [],
      link: vg.link,
    }));
  }, [visibleViewGroups]);

  const vgQuickFilters = useMemo(() => ([
    { id: 'active', label: 'Active', icon: 'checkCircle', predicate: (vg) => vg.isActive },
    { id: 'linked', label: 'Linked', icon: 'link2', predicate: (vg) => vg.isLinked },
    { id: 'shared', label: 'Shared', icon: 'share2', predicate: (vg) => vg.isShared },
    { id: 'starred', label: 'Starred', icon: 'star', predicate: (vg) => vg.isStarred },
  ]), []);

  const vgFilter = useListFilter({
    searchFields: (vg) => [
      getVGDisplayName(vg),
      ...(vg.views || []).map((v) => v.name || ''),
    ],
    quickFilterDefs: vgQuickFilters,
    persistKey: workspaceId ? `canvasmap-vg-filters:${workspaceId}` : null,
  });

  const filteredViewGroups = useMemo(
    () => vgFilter.applyFilters(viewGroups),
    [viewGroups, vgFilter.applyFilters]
  );

  const quickFilterCounts = useMemo(() => {
    return vgQuickFilters.reduce((acc, def) => {
      acc[def.id] = viewGroups.filter(def.predicate).length;
      return acc;
    }, {});
  }, [viewGroups, vgQuickFilters]);

  // Get inactive VGs (no position)
  const inactiveVGs = useMemo(() => {
    return viewGroups.filter(vg => !vg.position);
  }, [viewGroups]);

  // Get active VGs (have position)
  const activeViewGroups = useMemo(() => {
    return viewGroups.filter(vg => vg.position);
  }, [viewGroups]);

  const filteredActiveViewGroups = useMemo(() => {
    return filteredViewGroups.filter(vg => vg.position);
  }, [filteredViewGroups]);

  const filteredInactiveVGs = useMemo(() => {
    return filteredViewGroups.filter(vg => !vg.position);
  }, [filteredViewGroups]);

  // Transform viewports from canvas viewport
  const viewports = useMemo(() => {
    if (!viewport) return [];
    return [{
      id: 'primary',
      name: 'Main',
      position: { row: viewport.row || 0, col: viewport.col || 0 },
      size: { rows: viewport.rows || 3, cols: viewport.cols || 3 },
      mode: 'snap',
      isPrimary: true,
    }];
  }, [viewport]);

  // Transform collaborators to expected structure
  const baseCollaborators = useMemo(() => {
    return (rawCollaborators || []).map(user => ({
      id: user.id,
      name: user.name || user.email || 'Unknown',
      avatar: user.name ? user.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) : 'U',
      color: user.color || '#22c55e',
      viewport: user.position ? {
        row: user.position.row || 0,
        col: user.position.col || 0,
        rows: 2,
        cols: 2,
      } : null,
      cursor: user.cursor ? {
        row: user.cursor.row || 0,
        col: user.cursor.col || 0,
        rowOffset: user.cursor.rowOffset || 0.5,
        colOffset: user.cursor.colOffset || 0.5,
      } : null,
      isBroadcasting: user.isBroadcasting || false,
      isOnline: true,
    }));
  }, [rawCollaborators]);

  // Extract VG links from ViewGroups
  const vgLinks = useMemo(() => {
    const links = [];
    activeViewGroups.forEach(vg => {
      if (vg.link) {
        links.push({
          id: `vgl-${vg.id}`,
          from: vg.link.originatorGroupId,
          to: vg.link.targetGroupId,
          type: vg.link.properties?.includes('camera') ? 'camera' : 'data',
          mode: vg.link.linkMode || 'bidirectional',
        });
      }
    });
    return links;
  }, [activeViewGroups]);

  const minimapVgLinks = useMemo(() => {
    const visibleIds = new Set(filteredActiveViewGroups.map(vg => vg.id));
    return vgLinks.filter(link => visibleIds.has(link.from) && visibleIds.has(link.to));
  }, [vgLinks, filteredActiveViewGroups]);

  // View links (placeholder)
  const viewLinks = useMemo(() => [], []);

  // Transform bookmarks
  const bookmarks = useMemo(() => {
    return (rawBookmarks || []).map(bm => ({
      id: bm.id,
      name: bm.name,
      position: bm.cameraState?.position || { row: 0, col: 0 },
      isStarred: bm.isStarred,
      isPinned: bm.isPinned,
    }));
  }, [rawBookmarks]);

  // All views flattened (for companion panel)
  const allViews = useMemo(() => {
    return activeViewGroups.flatMap(vg =>
      (vg.views || []).map(v => ({
        ...v,
        vgId: vg.id,
        vgName: vg.name || getVGDisplayName(vg),
        vgColor: vg.color,
      }))
    );
  }, [activeViewGroups]);

  const datasets = useMemo(() => {
    return (loadedDatasets || []).map((dataset) => ({
      id: dataset.id,
      name: dataset.name,
      type: (dataset.fileType || 'default').toLowerCase(),
      size: dataset.size,
    }));
  }, [loadedDatasets]);

  // ---------------------------------------------------------------------------
  // Initialize state from hook
  // ---------------------------------------------------------------------------

  const state = useCanvasMapState({
    canvas: canvasData,
    viewGroups: activeViewGroups,
    inactiveVGs,
    viewports,
    collaborators: baseCollaborators,
    vgLinks,
    viewLinks,
    bookmarks,
    callbacks: {},
  });

  const filteredActiveIds = useMemo(() => {
    return new Set(filteredActiveViewGroups.map(vg => vg.id));
  }, [filteredActiveViewGroups]);

  const filteredFlattenedViews = useMemo(() => {
    return (state.flattenedViews || []).filter(view => filteredActiveIds.has(view.vgId));
  }, [state.flattenedViews, filteredActiveIds]);

  const collaborators = useMemo(() => {
    return baseCollaborators.map((collab) => ({
      ...collab,
      showCursor: state.collaboratorCursorVisibility?.[collab.id] ?? true,
    }));
  }, [baseCollaborators, state.collaboratorCursorVisibility]);

  // ---------------------------------------------------------------------------
  // Action Handlers (placeholder implementations)
  // ---------------------------------------------------------------------------

  const handleGoHome = useCallback(() => {
    console.log('Go to home position');
    // TODO: Implement navigation to home position
  }, []);

  const handleSetHome = useCallback(() => {
    console.log('Set home position');
    // TODO: Implement setting home position
  }, []);

  const handleFitAll = useCallback(() => {
    console.log('Fit all content');
    // TODO: Implement fit all
  }, []);

  const handleAddBookmark = useCallback(() => {
    console.log('Add bookmark');
    // TODO: Implement add bookmark
  }, []);

  const handleBookmarkClick = useCallback((bookmark) => {
    console.log('Navigate to bookmark:', bookmark);
    // TODO: Implement bookmark navigation
  }, []);

  const handleBookmarkDelete = useCallback((bookmarkId) => {
    console.log('Delete bookmark:', bookmarkId);
    // TODO: Implement bookmark deletion
  }, []);

  const handleAddVG = useCallback(() => {
    console.log('Add ViewGroup');
    // TODO: Implement VG creation
  }, []);

  const handleVGRestore = useCallback((vgId) => {
    console.log('Restore ViewGroup:', vgId);
    // TODO: Implement VG restoration
  }, []);

  const handleFollow = useCallback((userId) => {
    console.log('Follow user:', userId);
    // TODO: Implement following
  }, []);

  const handleLocate = useCallback((userId) => {
    console.log('Locate user:', userId);
    // TODO: Implement user location
  }, []);

  const handleStartBroadcast = useCallback(() => {
    console.log('Start broadcasting');
    // TODO: Implement broadcast start
  }, []);

  const handleStopBroadcast = useCallback(() => {
    console.log('Stop broadcasting');
    // TODO: Implement broadcast stop
  }, []);

  const COMPANION_WIDTHS = { compact: 140, standard: 160 };
  const QUICK_NAV_WIDTH = 40;
  const MINIMAP_PADDING = 8;

  const effectiveWidth = width - (state.companionOpen ? COMPANION_WIDTHS.standard : 0);
  const effectiveSizeMode = (() => {
    if (!Number.isFinite(effectiveWidth)) return panelSizeMode || 'standard';
    if (effectiveWidth < SIZE_MODE_BREAKPOINTS.compact) return 'compact';
    if (effectiveWidth >= SIZE_MODE_BREAKPOINTS.expanded) return 'expanded';
    return 'standard';
  })();

  const isCompact = effectiveSizeMode === 'compact';
  const companionWidth = state.companionOpen
    ? (isCompact ? COMPANION_WIDTHS.compact : COMPANION_WIDTHS.standard)
    : 0;

  // Calculate minimap container dimensions
  const quickNavWidth = state.toolbarPosition ? QUICK_NAV_WIDTH : 0;
  const minimapWidth = Math.max(0, width - quickNavWidth - companionWidth - MINIMAP_PADDING * 2);
  const minimapInnerHeight = Math.max(0, minimapHeight - MINIMAP_PADDING * 2);

  // Calculate available heights
  const headerHeight = state.focusedVGId ? 40 : 0;
  const tabsHeight = 40;
  const toolbarHeight = 40;
  const chromeHeight = headerHeight + tabsHeight + toolbarHeight;
  const contentHeight = Math.max(0, height - chromeHeight);

  const isShort = height < 520;
  const minContextualHeight = isCompact ? 130 : (isShort ? 150 : 180);
  const minMinimapHeight = isShort ? 120 : 150;

  let minimapHeight = Math.max(minMinimapHeight, Math.floor(contentHeight * 0.55));
  if (contentHeight - minimapHeight < minContextualHeight) {
    minimapHeight = Math.max(minMinimapHeight, contentHeight - minContextualHeight);
  }

  const contextualHeight = Math.max(minContextualHeight, contentHeight - minimapHeight);
  const densityMode = isShort || isCompact ? 'dense' : 'standard';

  // ---------------------------------------------------------------------------
  // Loading state
  // ---------------------------------------------------------------------------

  if (vgLoading) {
    return (
      <div className="canvas-map-v2" data-vr={isVR} data-size-mode={effectiveSizeMode}>
        <div className="canvas-map-v2__loading">
          Loading canvas data...
        </div>
      </div>
    );
  }

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  return (
    <div
      className={`canvas-map-v2 canvas-map-v2--${state.mapMode}`}
      data-vr={isVR}
      data-size-mode={effectiveSizeMode}
      data-density={densityMode}
    >
      {/* Breadcrumb / Back navigation (when focused) */}
      {state.focusedVGId && state.focusedVG && (
        <div
          className="canvas-map-v2__breadcrumb"
          style={{ '--vg-color': state.focusedVG.color }}
        >
          <button
            className="canvas-map-v2__breadcrumb-back"
            onClick={state.handleBackFromFocus}
          >
            <Icon name="chevronLeft" size={14} />
            {!isCompact && 'Canvas'}
          </button>
          <Icon name="chevronRight" size={14} className="canvas-map-v2__breadcrumb-sep" />
          <div className="canvas-map-v2__breadcrumb-current">
            <div
              className="canvas-map-v2__breadcrumb-dot"
              style={{ background: state.focusedVG.color }}
            />
            <span style={{ color: state.focusedVG.color }}>
              {getVGDisplayName(state.focusedVG)}
            </span>
          </div>
        </div>
      )}

      {/* Mode Tabs */}
      <ModeTabs
        activeMode={state.mapMode}
        onModeChange={state.handleModeChange}
        sizeMode={effectiveSizeMode}
      />

      {/* Toolbar */}
      <MapToolbar
        mapMode={state.mapMode}
        displayMode={state.displayMode}
        setDisplayMode={state.setDisplayMode}
        minimapZoom={state.minimapZoom}
        showGridLabels={state.showGridLabels}
        showViewports={state.showViewports}
        showCollaborators={state.showCollaborators}
        showBookmarks={state.showBookmarks}
        showInternals={state.showInternals}
        linksSubTab={state.linksSubTab}
        setLinksSubTab={state.setLinksSubTab}
        collaborateSubTab={state.collaborateSubTab}
        setCollaborateSubTab={state.setCollaborateSubTab}
        onlineCollaboratorsCount={state.onlineCollaboratorsCount}
        onZoomIn={state.handleZoomIn}
        onZoomOut={state.handleZoomOut}
        toggleShowGridLabels={state.toggleShowGridLabels}
        toggleShowViewports={state.toggleShowViewports}
        toggleShowCollaborators={state.toggleShowCollaborators}
        toggleShowBookmarks={state.toggleShowBookmarks}
        toggleShowInternals={state.toggleShowInternals}
        onAddVG={handleAddVG}
        sizeMode={effectiveSizeMode}
        companionOpen={state.companionOpen}
        onToggleCompanion={state.toggleCompanion}
      />

      {/* Main Body with Minimap Row + Contextual Panel */}
      <div className="canvas-map-v2__body">
        <div
          className="canvas-map-v2__minimap-row"
          style={{ height: minimapHeight }}
        >
          {state.toolbarPosition === 'left' && (
            <div className="canvas-map-v2__quicknav">
              <QuickNavToolbar
                position="left"
                onGoHome={handleGoHome}
                onSetHome={handleSetHome}
                onFitAll={handleFitAll}
                onAddBookmark={handleAddBookmark}
              />
            </div>
          )}

          <div className="canvas-map-v2__minimap-shell" ref={minimapContainerRef}>
            <div className="canvas-map-v2__minimap-container">
              <Minimap
                canvas={canvasData}
                viewGroups={filteredActiveViewGroups}
                viewports={viewports}
                collaborators={collaborators}
                vgLinks={minimapVgLinks}
                bookmarks={bookmarks}
                flattenedViews={filteredFlattenedViews}
                displayMode={state.displayMode}
                mapMode={state.mapMode}
                focusedVG={state.focusedVG}
                minimapZoom={state.minimapZoom}
                showGridLabels={state.showGridLabels}
                showInternals={state.showInternals}
                showViewports={state.showViewports}
                showCollaborators={state.showCollaborators}
                showBookmarks={state.showBookmarks}
                showCursors={state.showCursors}
                selectedVGId={state.selectedVGId}
                selectedViewportId={state.selectedViewportId}
                highlightedLinkId={state.highlightedLinkId}
                onVGClick={state.handleVGClick}
                onVGDoubleClick={state.handleVGDoubleClick}
                onLinkClick={state.handleLinkClick}
                containerWidth={minimapWidth}
                containerHeight={minimapInnerHeight}
              />
            </div>
          </div>

          {state.toolbarPosition === 'right' && (
            <div className="canvas-map-v2__quicknav canvas-map-v2__quicknav--right">
              <QuickNavToolbar
                position="right"
                onGoHome={handleGoHome}
                onSetHome={handleSetHome}
                onFitAll={handleFitAll}
                onAddBookmark={handleAddBookmark}
              />
            </div>
          )}

          <CompanionPanel
            isOpen={state.companionOpen}
            activeTab={state.companionTab}
            onTabChange={state.setCompanionTab}
            views={allViews}
            datasets={datasets}
            onViewClick={(view) => {
              state.handleVGClick(view.vgId);
            }}
            onDatasetClick={(dataset) => {
              console.log('Dataset clicked:', dataset);
            }}
            sizeMode={effectiveSizeMode}
          />
        </div>

        {/* Contextual Panel */}
        <div className="canvas-map-v2__panel" style={{ minHeight: contextualHeight }}>
          {state.mapMode === MAP_MODES.NAVIGATE && !state.focusedVGId && (
            <NavigatePanel
              bookmarks={bookmarks}
              filteredBookmarks={state.filteredBookmarks}
              searchQuery={state.searchQuery}
              setSearchQuery={state.setSearchQuery}
              onGoHome={handleGoHome}
              onSetHome={handleSetHome}
              onFitAll={handleFitAll}
              onAddBookmark={handleAddBookmark}
              onBookmarkClick={handleBookmarkClick}
              onBookmarkDelete={handleBookmarkDelete}
              sizeMode={effectiveSizeMode}
            />
          )}

          {state.mapMode === MAP_MODES.LAYOUT && (
            <LayoutPanel
                viewGroups={filteredActiveViewGroups}
                filteredVGs={filteredActiveViewGroups}
                inactiveVGs={filteredInactiveVGs}
                selectedVGId={state.selectedVGId}
                focusedVG={state.focusedVG}
                searchQuery={state.searchQuery}
                setSearchQuery={state.setSearchQuery}
                filter={vgFilter}
                quickFilterDefs={vgQuickFilters}
                quickFilterCounts={quickFilterCounts}
                onVGClick={state.handleVGClick}
                onVGDoubleClick={state.handleVGDoubleClick}
                onVGRestore={handleVGRestore}
                onAddVG={handleAddVG}
                sizeMode={effectiveSizeMode}
              />
          )}

          {state.mapMode === MAP_MODES.LINKS && (
            <LinksPanel
              linksSubTab={state.linksSubTab}
              vgLinks={vgLinks}
              viewLinks={viewLinks}
              viewGroups={activeViewGroups}
              allViews={allViews}
              highlightedLinkId={state.highlightedLinkId}
              onLinkClick={state.handleLinkClick}
              sizeMode={effectiveSizeMode}
            />
          )}

          {state.mapMode === MAP_MODES.TEAM && (
            <TeamPanel
              collaborateSubTab={state.collaborateSubTab}
              viewports={viewports}
              selectedViewportId={state.selectedViewportId}
              collaborators={collaborators}
              searchQuery={state.searchQuery}
              setSearchQuery={state.setSearchQuery}
              showCursors={state.showCursors}
              myCursorVisible={state.myCursorVisible}
              myCursorColor={state.myCursorColor}
              onViewportClick={state.handleViewportClick}
              onFollow={handleFollow}
              onLocate={handleLocate}
              onStartBroadcast={handleStartBroadcast}
              onStopBroadcast={handleStopBroadcast}
              onToggleShowCursors={state.toggleShowCursors}
              onToggleMyCursorVisible={state.toggleMyCursorVisible}
              onChangeMyCursorColor={state.setMyCursorColor}
              onToggleCollaboratorCursor={state.toggleCollaboratorCursor}
              sizeMode={effectiveSizeMode}
            />
          )}
        </div>
      </div>
    </div>
  );
});

export default CanvasMapContent;
