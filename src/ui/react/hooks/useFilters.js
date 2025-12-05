// src/ui/react/hooks/useFilters.js
// Hook for managing saved filters
//
// Provides:
// - CRUD operations for saved filters
// - Scope filtering (personal/workspace/project)
// - WebSocket event listeners for real-time updates

import { useState, useEffect, useCallback, useRef } from "react";
import { sessionManager } from "@Core/session/sessionManager.js";
import { config } from "@Core/config/clientConfig.js";
import { api as log } from "@Utils/logger.js";

/**
 * Hook for managing saved filters
 *
 * @param {Object} options
 * @param {string} options.projectId - Override project ID (defaults to current session)
 * @param {string} options.scope - Filter scope: 'personal' | 'workspace' | 'project' | 'all'
 * @param {string} options.workspaceId - Workspace ID (required if scope='workspace')
 * @returns {Object} Filters data and actions
 */
export function useFilters(options = {}) {
  const {
    projectId: overrideProjectId,
    scope = "all",
    workspaceId = null,
  } = options;

  // ---------------------------------------------------------------------------
  // STATE
  // ---------------------------------------------------------------------------

  const [filters, setFilters] = useState([]);
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
  // FETCH FILTERS
  // ---------------------------------------------------------------------------

  const fetchFilters = useCallback(async () => {
    if (!projectId) {
      setFilters([]);
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
      let url = `${apiBase}/projects/${projectId}/filters?scope=${scope}`;
      if (workspaceId) {
        url += `&workspaceId=${workspaceId}`;
      }

      const response = await fetch(url, {
        signal: abortControllerRef.current.signal,
        headers: getHeaders(),
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch filters: ${response.status}`);
      }

      const data = await response.json();
      setFilters(data.filters || []);
    } catch (err) {
      if (err.name === "AbortError") return;
      log.error("Failed to fetch filters:", err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, [projectId, scope, workspaceId, apiBase, getHeaders]);

  // ---------------------------------------------------------------------------
  // CREATE FILTER
  // ---------------------------------------------------------------------------

  const createFilter = useCallback(
    async (name, filterConfig, filterOptions = {}) => {
      if (!projectId) throw new Error("No project selected");

      const {
        description,
        scope: filterScope = "personal",
        workspace_id,
        is_pinned = false,
      } = filterOptions;

      const response = await fetch(`${apiBase}/projects/${projectId}/filters`, {
        method: "POST",
        headers: getHeaders(),
        body: JSON.stringify({
          name,
          filter_config: filterConfig,
          description,
          scope: filterScope,
          workspace_id,
          is_pinned,
        }),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(
          data.error || `Failed to create filter: ${response.status}`
        );
      }

      const data = await response.json();

      // Optimistically add to local state
      setFilters((prev) => [data.filter, ...prev]);

      log.info(`Filter created: ${data.filter.id}`);
      return data.filter;
    },
    [projectId, apiBase, getHeaders]
  );

  // ---------------------------------------------------------------------------
  // UPDATE FILTER
  // ---------------------------------------------------------------------------

  const updateFilter = useCallback(
    async (id, updates) => {
      if (!projectId) throw new Error("No project selected");

      const response = await fetch(
        `${apiBase}/projects/${projectId}/filters/${id}`,
        {
          method: "PATCH",
          headers: getHeaders(),
          body: JSON.stringify(updates),
        }
      );

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(
          data.error || `Failed to update filter: ${response.status}`
        );
      }

      const data = await response.json();

      // Update local state
      setFilters((prev) =>
        prev.map((f) => (f.id === id ? { ...f, ...data.filter } : f))
      );

      log.info(`Filter updated: ${id}`);
      return data.filter;
    },
    [projectId, apiBase, getHeaders]
  );

  // ---------------------------------------------------------------------------
  // DELETE FILTER
  // ---------------------------------------------------------------------------

  const deleteFilter = useCallback(
    async (id) => {
      if (!projectId) throw new Error("No project selected");

      const response = await fetch(
        `${apiBase}/projects/${projectId}/filters/${id}`,
        {
          method: "DELETE",
          headers: getHeaders(),
        }
      );

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(
          data.error || `Failed to delete filter: ${response.status}`
        );
      }

      // Remove from local state
      setFilters((prev) => prev.filter((f) => f.id !== id));

      log.info(`Filter deleted: ${id}`);
    },
    [projectId, apiBase, getHeaders]
  );

  // ---------------------------------------------------------------------------
  // TOGGLE PIN
  // ---------------------------------------------------------------------------

  const togglePin = useCallback(
    async (id) => {
      const filter = filters.find((f) => f.id === id);
      if (!filter) throw new Error("Filter not found");

      return updateFilter(id, { is_pinned: !filter.isPinned });
    },
    [filters, updateFilter]
  );

  // ---------------------------------------------------------------------------
  // APPLY FILTER
  // ---------------------------------------------------------------------------

  /**
   * Get the filter configuration for applying
   * @param {string} id - Filter ID
   * @returns {Object} The filter_config object
   */
  const applyFilter = useCallback(
    (id) => {
      const filter = filters.find((f) => f.id === id);
      if (!filter) {
        log.warn(`Filter not found: ${id}`);
        return null;
      }
      return filter.filterConfig;
    },
    [filters]
  );

  // ---------------------------------------------------------------------------
  // EFFECTS
  // ---------------------------------------------------------------------------

  // Initial fetch
  useEffect(() => {
    fetchFilters();
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [fetchFilters]);

  // Listen for WebSocket events
  useEffect(() => {
    const handleFilterCreated = (event) => {
      log.debug("Filter created event received", event.detail);
      fetchFilters(); // Refetch to get full data
    };

    const handleFilterUpdated = (event) => {
      log.debug("Filter updated event received", event.detail);
      fetchFilters();
    };

    const handleFilterDeleted = (event) => {
      const { filterId } = event.detail || {};
      if (filterId) {
        setFilters((prev) => prev.filter((f) => f.id !== filterId));
      }
    };

    window.addEventListener("ws:filter:created", handleFilterCreated);
    window.addEventListener("ws:filter:updated", handleFilterUpdated);
    window.addEventListener("ws:filter:deleted", handleFilterDeleted);

    return () => {
      window.removeEventListener("ws:filter:created", handleFilterCreated);
      window.removeEventListener("ws:filter:updated", handleFilterUpdated);
      window.removeEventListener("ws:filter:deleted", handleFilterDeleted);
    };
  }, [fetchFilters]);

  // ---------------------------------------------------------------------------
  // COMPUTED
  // ---------------------------------------------------------------------------

  // Group filters by scope
  const groupedFilters = {
    personal: filters.filter((f) => f.scope === "personal"),
    workspace: filters.filter((f) => f.scope === "workspace"),
    project: filters.filter((f) => f.scope === "project"),
  };

  // ---------------------------------------------------------------------------
  // RETURN
  // ---------------------------------------------------------------------------

  return {
    // Data
    filters,
    groupedFilters,
    isLoading,
    error,
    projectId,

    // Actions
    createFilter,
    updateFilter,
    deleteFilter,
    togglePin,
    applyFilter,
    refetch: fetchFilters,
  };
}

export default useFilters;
