/**
 * @file LeftPanelTabRegistry.js
 * @description Registers all left panel tab content components.
 *
 * This file MUST be imported early in the app initialization to ensure
 * all tab components are registered before they're needed.
 *
 * Import this file in your app entry point or in LeftPanelProvider:
 * @example
 * // In App.jsx or CIAWebApp.jsx:
 * import '@UI/react/components/panels/LeftPanel/LeftPanelTabRegistry';
 *
 * @see LeftPanelContext.jsx for the registration API
 */

import { registerLeftPanelTab } from "./LeftPanelContext";

// Import all tab content components
import { FilesTabV2 } from "./tabs/FilesTab";
import { DatasetsTabV2 } from "./tabs/DatasetsTab";
import { InstanceToolsPanel } from "@UI/react/components/panels/InstanceToolsPanel";
import { AnnotationsPanelContent } from "./tabs/AnnotationsTab";
import { BookmarksFiltersPanelContent } from "./tabs/BookmarksFiltersTab";
import { CursorsPanelContent } from "./tabs/CursorsTab";
// NOTE: layout, navigator, views, and CanvasMap tabs superseded by CanvasMapPanel (PanelShell)

// =============================================================================
// REGISTER ALL TAB COMPONENTS
// =============================================================================

// DATA SOURCES
registerLeftPanelTab("files", FilesTabV2);
registerLeftPanelTab("datasets", DatasetsTabV2);

// VISUALIZATION
registerLeftPanelTab("tools", InstanceToolsPanel);

// SPATIAL & STATE
registerLeftPanelTab("annotations", AnnotationsPanelContent);
registerLeftPanelTab("bookmarks", BookmarksFiltersPanelContent);

// PRESENCE
registerLeftPanelTab("cursors", CursorsPanelContent);

// Log registration status in development
if (process.env.NODE_ENV === "development") {
  console.log("[LeftPanel] 6 tab components registered (layout/navigator/views migrated to CanvasMapPanel)");
}
