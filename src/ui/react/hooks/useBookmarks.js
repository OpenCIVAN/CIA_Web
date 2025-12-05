// src/ui/react/hooks/useBookmarks.js
// Hook for managing bookmarks (saved view states)
//
// Provides:
// - CRUD operations for bookmarks
// - Thumbnail upload
// - Camera state capture helper
// - WebSocket event listeners for real-time updates

import { useState, useEffect, useCallback, useRef } from "react";
import { sessionManager } from "@Core/session/sessionManager.js";
import { config } from "@Core/config/clientConfig.js";
import { api as log } from "@Utils/logger.js";

/**
 * Hook for managing bookmarks
 *
 * @param {Object} options
 * @param {string} options.projectId - Override project ID (defaults to current session)
 * @param {string} options.scope - Bookmark scope: 'personal' | 'workspace' | 'project' | 'all'
 * @param {string} options.workspaceId - Workspace ID (required if scope='workspace')
 * @param {string} options.datasetId - Filter by dataset (optional)
 * @returns {Object} Bookmarks data and actions
 */
export function useBookmarks(options = {}) {
  const {
    projectId: overrideProjectId,
    scope = "all",
    workspaceId = null,
    datasetId = null,
  } = options;

  // ---------------------------------------------------------------------------
  // STATE
  // ---------------------------------------------------------------------------

  const [bookmarks, setBookmarks] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const abortControllerRef = useRef(null);

  // Get project ID from session or override
  const projectId = overrideProjectId || sessionManager.getRoomId?.();
  const apiBase = config.apiBaseUrl || "http://localhost:3001/api";

  // ---------------------------------------------------------------------------
  // API HELPERS
  // ---------------------------------------------------------------------------

  const getHeaders = useCallback(() => {
    return {
      "Content-Type": "application/json",
      "x-user-id":
        sessionManager.getUserId?.() || "00000000-0000-0000-0000-000000000001",
      "x-user-email": sessionManager.getUserEmail?.() || "demo@cia-web.local",
      "x-user-name": sessionManager.getUserName?.() || "Demo User",
    };
  }, []);

  // ---------------------------------------------------------------------------
  // FETCH BOOKMARKS
  // ---------------------------------------------------------------------------

  const fetchBookmarks = useCallback(async () => {
    if (!projectId) {
      setBookmarks([]);
      setIsLoading(false);
      return;
    }

    // Cancel previous request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    abortControllerRef.current = new AbortController();

    setIsLoading(true);
    setError(null);

    try {
      let url = `${apiBase}/projects/${projectId}/bookmarks?scope=${scope}`;
      if (workspaceId) {
        url += `&workspaceId=${workspaceId}`;
      }
      if (datasetId) {
        url += `&datasetId=${datasetId}`;
      }

      const response = await fetch(url, {
        signal: abortControllerRef.current.signal,
        headers: getHeaders(),
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch bookmarks: ${response.status}`);
      }

      const data = await response.json();
      setBookmarks(data.bookmarks || []);
    } catch (err) {
      if (err.name === "AbortError") return;
      log.error("Failed to fetch bookmarks:", err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, [projectId, scope, workspaceId, datasetId, apiBase, getHeaders]);

  // ---------------------------------------------------------------------------
  // CREATE BOOKMARK
  // ---------------------------------------------------------------------------

  const createBookmark = useCallback(
    async (name, bookmarkOptions = {}) => {
      if (!projectId) throw new Error("No project selected");

      const {
        description,
        scope: bookmarkScope = "personal",
        workspace_id,
        dataset_id,
        view_config_id,
        camera_state,
        filter_ids = [],
        tags = [],
        is_pinned = false,
      } = bookmarkOptions;

      const response = await fetch(
        `${apiBase}/projects/${projectId}/bookmarks`,
        {
          method: "POST",
          headers: getHeaders(),
          body: JSON.stringify({
            name,
            description,
            scope: bookmarkScope,
            workspace_id,
            dataset_id,
            view_config_id,
            camera_state,
            filter_ids,
            tags,
            is_pinned,
          }),
        }
      );

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(
          data.error || `Failed to create bookmark: ${response.status}`
        );
      }

      const data = await response.json();

      // Optimistically add to local state
      setBookmarks((prev) => [data.bookmark, ...prev]);

      log.info(`Bookmark created: ${data.bookmark.id}`);
      return data.bookmark;
    },
    [projectId, apiBase, getHeaders]
  );

  // ---------------------------------------------------------------------------
  // UPDATE BOOKMARK
  // ---------------------------------------------------------------------------

  const updateBookmark = useCallback(
    async (id, updates) => {
      if (!projectId) throw new Error("No project selected");

      const response = await fetch(
        `${apiBase}/projects/${projectId}/bookmarks/${id}`,
        {
          method: "PATCH",
          headers: getHeaders(),
          body: JSON.stringify(updates),
        }
      );

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(
          data.error || `Failed to update bookmark: ${response.status}`
        );
      }

      const data = await response.json();

      // Update local state
      setBookmarks((prev) =>
        prev.map((b) => (b.id === id ? { ...b, ...data.bookmark } : b))
      );

      log.info(`Bookmark updated: ${id}`);
      return data.bookmark;
    },
    [projectId, apiBase, getHeaders]
  );

  // ---------------------------------------------------------------------------
  // DELETE BOOKMARK
  // ---------------------------------------------------------------------------

  const deleteBookmark = useCallback(
    async (id) => {
      if (!projectId) throw new Error("No project selected");

      const response = await fetch(
        `${apiBase}/projects/${projectId}/bookmarks/${id}`,
        {
          method: "DELETE",
          headers: getHeaders(),
        }
      );

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(
          data.error || `Failed to delete bookmark: ${response.status}`
        );
      }

      // Remove from local state
      setBookmarks((prev) => prev.filter((b) => b.id !== id));

      log.info(`Bookmark deleted: ${id}`);
    },
    [projectId, apiBase, getHeaders]
  );

  // ---------------------------------------------------------------------------
  // TOGGLE PIN
  // ---------------------------------------------------------------------------

  const togglePin = useCallback(
    async (id) => {
      const bookmark = bookmarks.find((b) => b.id === id);
      if (!bookmark) throw new Error("Bookmark not found");

      return updateBookmark(id, { is_pinned: !bookmark.isPinned });
    },
    [bookmarks, updateBookmark]
  );

  // ---------------------------------------------------------------------------
  // UPLOAD THUMBNAIL
  // ---------------------------------------------------------------------------

  const uploadThumbnail = useCallback(
    async (id, imageBlob) => {
      if (!projectId) throw new Error("No project selected");

      const formData = new FormData();
      formData.append("thumbnail", imageBlob, "thumbnail.jpg");

      const response = await fetch(
        `${apiBase}/projects/${projectId}/bookmarks/${id}/thumbnail`,
        {
          method: "POST",
          headers: {
            "x-user-id":
              sessionManager.getUserId?.() ||
              "00000000-0000-0000-0000-000000000001",
            "x-user-email":
              sessionManager.getUserEmail?.() || "demo@cia-web.local",
            "x-user-name": sessionManager.getUserName?.() || "Demo User",
          },
          body: formData,
        }
      );

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(
          data.error || `Failed to upload thumbnail: ${response.status}`
        );
      }

      const data = await response.json();

      // Update local state
      setBookmarks((prev) =>
        prev.map((b) =>
          b.id === id ? { ...b, thumbnailKey: data.thumbnailKey } : b
        )
      );

      log.info(`Thumbnail uploaded for bookmark: ${id}`);
      return data;
    },
    [projectId, apiBase]
  );

  // ---------------------------------------------------------------------------
  // NAVIGATE TO BOOKMARK
  // ---------------------------------------------------------------------------

  /**
   * Get the bookmark data for navigation/restoration
   * @param {string} id - Bookmark ID
   * @returns {Object} The bookmark with camera_state, filter_ids, etc.
   */
  const navigateToBookmark = useCallback(
    (id) => {
      const bookmark = bookmarks.find((b) => b.id === id);
      if (!bookmark) {
        log.warn(`Bookmark not found: ${id}`);
        return null;
      }

      // Dispatch event for other components to handle navigation
      window.dispatchEvent(
        new CustomEvent("cia:bookmark-navigate", {
          detail: {
            bookmarkId: id,
            cameraState: bookmark.cameraState,
            filterIds: bookmark.filterIds,
            datasetId: bookmark.datasetId,
            viewConfigId: bookmark.viewConfigId,
          },
        })
      );

      return bookmark;
    },
    [bookmarks]
  );

  // ---------------------------------------------------------------------------
  // GET THUMBNAIL URL
  // ---------------------------------------------------------------------------

  const getThumbnailUrl = useCallback(
    (id) => {
      if (!projectId) return null;
      return `${apiBase}/projects/${projectId}/bookmarks/${id}/thumbnail`;
    },
    [projectId, apiBase]
  );

  // ---------------------------------------------------------------------------
  // EFFECTS
  // ---------------------------------------------------------------------------

  // Initial fetch
  useEffect(() => {
    fetchBookmarks();
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [fetchBookmarks]);

  // Listen for WebSocket events
  useEffect(() => {
    const handleBookmarkCreated = (event) => {
      log.debug("Bookmark created event received", event.detail);
      fetchBookmarks(); // Refetch to get full data
    };

    const handleBookmarkUpdated = (event) => {
      log.debug("Bookmark updated event received", event.detail);
      fetchBookmarks();
    };

    const handleBookmarkDeleted = (event) => {
      const { bookmarkId } = event.detail || {};
      if (bookmarkId) {
        setBookmarks((prev) => prev.filter((b) => b.id !== bookmarkId));
      }
    };

    window.addEventListener("ws:bookmark:created", handleBookmarkCreated);
    window.addEventListener("ws:bookmark:updated", handleBookmarkUpdated);
    window.addEventListener("ws:bookmark:deleted", handleBookmarkDeleted);

    return () => {
      window.removeEventListener("ws:bookmark:created", handleBookmarkCreated);
      window.removeEventListener("ws:bookmark:updated", handleBookmarkUpdated);
      window.removeEventListener("ws:bookmark:deleted", handleBookmarkDeleted);
    };
  }, [fetchBookmarks]);

  // ---------------------------------------------------------------------------
  // COMPUTED
  // ---------------------------------------------------------------------------

  // Group bookmarks by scope
  const groupedBookmarks = {
    personal: bookmarks.filter((b) => b.scope === "personal"),
    workspace: bookmarks.filter((b) => b.scope === "workspace"),
    project: bookmarks.filter((b) => b.scope === "project"),
  };

  // ---------------------------------------------------------------------------
  // RETURN
  // ---------------------------------------------------------------------------

  return {
    // Data
    bookmarks,
    groupedBookmarks,
    isLoading,
    error,
    projectId,

    // Actions
    createBookmark,
    updateBookmark,
    deleteBookmark,
    togglePin,
    uploadThumbnail,
    navigateToBookmark,
    getThumbnailUrl,
    refetch: fetchBookmarks,
  };
}

/**
 * Helper to capture current camera state from VTK
 * Call this when creating a bookmark to capture the current view
 *
 * @param {Object} renderer - VTK renderer instance
 * @returns {Object} Camera state { position, target, up, viewAngle }
 */
export function captureCameraState(renderer) {
  if (!renderer) {
    log.warn("No renderer provided to captureCameraState");
    return null;
  }

  try {
    const camera = renderer.getActiveCamera?.();
    if (!camera) {
      log.warn("No active camera found");
      return null;
    }

    return {
      position: camera.getPosition?.() || [0, 0, 1],
      target: camera.getFocalPoint?.() || [0, 0, 0],
      up: camera.getViewUp?.() || [0, 1, 0],
      viewAngle: camera.getViewAngle?.() || 30,
      parallelScale: camera.getParallelScale?.(),
      parallelProjection: camera.getParallelProjection?.(),
    };
  } catch (err) {
    log.error("Failed to capture camera state:", err);
    return null;
  }
}

export default useBookmarks;
