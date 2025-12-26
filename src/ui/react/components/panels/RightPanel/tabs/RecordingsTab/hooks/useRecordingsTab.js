/**
 * @file useRecordingsTab.js
 * @description Logic hook for RecordingsTab component.
 * Handles recording state, filtering, and recording operations.
 *
 * @example
 * const {
 *   recordings,
 *   isRecording,
 *   handleStartRecording,
 *   handleStopRecording,
 * } = useRecordingsTab();
 */

import { useState, useCallback, useMemo, useEffect } from "react";
import { useSectionStates } from "@UI/react/components/common/ResizableSections";
import { useRecordings } from "@UI/react/hooks/useRecordings.js";

/**
 * Recording modes
 */
export const RECORDING_MODES = [
  {
    id: "full",
    label: "Full Session",
    description: "Record entire workspace grid",
  },
  {
    id: "isolation",
    label: "Isolation",
    description: "Record single focused instance",
  },
  {
    id: "subset",
    label: "Subset",
    description: "Record selected instances only",
  },
];

/**
 * Hook for RecordingsTab logic and state management.
 *
 * @param {Object} options - Hook options
 * @param {string} [options.workspaceId] - Current workspace ID
 * @returns {Object} Recordings state and handlers
 */
export function useRecordingsTab(options = {}) {
  // Use the recordings hook for data
  const {
    recordings,
    isRecording,
    isPaused,
    recordingDuration,
    recordingName,
    setRecordingName,
    recordingOptions,
    setRecordingOptions,
    loading,
    error,
    startRecording,
    stopRecording,
    pauseRecording,
    resumeRecording,
    deleteRecording,
    exportRecording,
    downloadRecording,
    refresh,
  } = useRecordings();

  // Local state
  const [recordingMode, setRecordingMode] = useState("full");
  const [includeAudio, setIncludeAudio] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedRecording, setSelectedRecording] = useState(null);
  const [exportingId, setExportingId] = useState(null);

  // Sort and filter state
  const [sortBy, setSortBy] = useState("date"); // "date", "name", "duration"
  const [sortOrder, setSortOrder] = useState("desc"); // "asc", "desc"
  const [filterBy, setFilterBy] = useState("all"); // "all", "today", "week", "month"

  // Section states
  const { states: sectionStates, toggleSection } = useSectionStates({
    controls: { expanded: true, flexGrow: 0 },
    recordings: { expanded: true, flexGrow: 2 },
  });

  // Update options when includeAudio changes
  useEffect(() => {
    setRecordingOptions((prev) => ({ ...prev, includeAudio }));
  }, [includeAudio, setRecordingOptions]);

  // Filter and sort recordings
  const filteredRecordings = useMemo(() => {
    let result = [...recordings];

    // Filter by date range
    if (filterBy !== "all") {
      const now = new Date();
      const startOfDay = new Date(
        now.getFullYear(),
        now.getMonth(),
        now.getDate()
      );
      let filterDate;

      switch (filterBy) {
        case "today":
          filterDate = startOfDay;
          break;
        case "week":
          filterDate = new Date(startOfDay.getTime() - 7 * 24 * 60 * 60 * 1000);
          break;
        case "month":
          filterDate = new Date(
            startOfDay.getTime() - 30 * 24 * 60 * 60 * 1000
          );
          break;
        default:
          filterDate = null;
      }

      if (filterDate) {
        result = result.filter((r) => {
          const recordedAt = r.recorded_at ? new Date(r.recorded_at) : null;
          return recordedAt && recordedAt >= filterDate;
        });
      }
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter((r) => {
        const name = r.metadata?.name || "";
        const recordedBy = r.recorded_by_name || "";
        const roomName = r.room_name || "";
        return (
          name.toLowerCase().includes(query) ||
          recordedBy.toLowerCase().includes(query) ||
          roomName.toLowerCase().includes(query)
        );
      });
    }

    // Sort
    result.sort((a, b) => {
      let comparison = 0;
      switch (sortBy) {
        case "name":
          comparison = (a.metadata?.name || "").localeCompare(
            b.metadata?.name || ""
          );
          break;
        case "duration":
          comparison = (a.duration || 0) - (b.duration || 0);
          break;
        case "date":
        default:
          comparison =
            new Date(a.recorded_at || 0) - new Date(b.recorded_at || 0);
          break;
      }
      return sortOrder === "asc" ? comparison : -comparison;
    });

    return result;
  }, [searchQuery, recordings, sortBy, sortOrder, filterBy]);

  // Calculate storage
  const totalSize = useMemo(() => {
    const bytes = recordings.reduce((sum, r) => sum + (r.file_size || 0), 0);
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }, [recordings]);

  // Handlers
  const handleStartRecording = useCallback(() => {
    startRecording();
  }, [startRecording]);

  const handleStopRecording = useCallback(() => {
    stopRecording();
  }, [stopRecording]);

  const handlePauseRecording = useCallback(() => {
    pauseRecording();
  }, [pauseRecording]);

  const handleResumeRecording = useCallback(() => {
    resumeRecording();
  }, [resumeRecording]);

  const handleExport = useCallback(
    async (id) => {
      setExportingId(id);
      try {
        await exportRecording(id);
      } finally {
        setExportingId(null);
      }
    },
    [exportRecording]
  );

  const handleDownload = useCallback(
    (id) => {
      downloadRecording(id);
    },
    [downloadRecording]
  );

  const handleDelete = useCallback(
    (id) => {
      deleteRecording(id);
      if (selectedRecording === id) {
        setSelectedRecording(null);
      }
    },
    [deleteRecording, selectedRecording]
  );

  // Toggle sort order helper
  const toggleSortOrder = useCallback(() => {
    setSortOrder((prev) => (prev === "asc" ? "desc" : "asc"));
  }, []);

  return {
    // Data
    recordings,
    filteredRecordings,

    // Recording state
    isRecording,
    isPaused,
    recordingDuration,
    recordingName,
    setRecordingName,

    // Options
    recordingMode,
    setRecordingMode,
    includeAudio,
    setIncludeAudio,

    // Search state
    searchQuery,
    setSearchQuery,

    // Sort and filter state
    sortBy,
    setSortBy,
    sortOrder,
    setSortOrder,
    toggleSortOrder,
    filterBy,
    setFilterBy,

    // Selection state
    selectedRecording,
    setSelectedRecording,
    exportingId,

    // Loading state
    loading,
    error,

    // Section state
    sectionStates,
    toggleSection,

    // Computed
    totalSize,

    // Handlers
    handleStartRecording,
    handleStopRecording,
    handlePauseRecording,
    handleResumeRecording,
    handleExport,
    handleDownload,
    handleDelete,
    refresh,
  };
}

export default useRecordingsTab;
