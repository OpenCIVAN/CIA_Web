// src/ui/react/hooks/useDatasets.js
import { useSyncExternalStore } from "react";
import { useDatasetStore } from "@UI/react/store/datasetStore.js";
import { datasetManager } from "@Core/datasets/datasetManager.js";

export function useDatasets() {
  // Subscribe to Zustand for metadata changes
  const datasetsMetadata = useDatasetStore((state) => state.getAllDatasets());

  // Subscribe to datasetManager for loading state using React 18's useSyncExternalStore
  // This hook is specifically designed for subscribing to external stores
  const managerVersion = useSyncExternalStore(
    // subscribe function
    (callback) => {
      return datasetManager.onChange(callback);
    },
    // getSnapshot function - returns a value that changes when manager state changes
    () => {
      // Return a simple number that increments when datasets change
      // This forces a re-render without creating new object references
      return datasetManager.datasets.size + datasetManager.loadingDatasets.size;
    }
  );

  // Transform the data - runs on every render but that's fine, it's fast
  return datasetsMetadata.map((metadata) => {
    const localDataset = datasetManager.datasets.get(metadata.id);
    const loadingInfo = datasetManager.loadingDatasets.get(metadata.id);

    return {
      id: metadata.id,
      name: metadata.name,
      hash: metadata.hash,
      pointCount: metadata.pointCount || 0,
      cellCount: metadata.cellCount || 0,
      uploadedBy: metadata.uploadedBy,
      uploadedByName: metadata.uploadedByName || "Unknown",
      uploadedAt: metadata.uploadedAt,
      publicPath: metadata.publicPath,
      bounds: metadata.bounds,
      annotations: metadata.annotations || [],
      hasPolydata: !!localDataset?.polydata,
      isLoading: !!loadingInfo,
      loadingStage: loadingInfo?.stage || null,
    };
  });
}
