// src/ui/react/hooks/useDatasets.js
// ULTRA SIMPLE: Don't use Zustand at all, subscribe directly to datasetManager

import { useState, useEffect } from "react";
import { datasetManager } from "@Core/datasets/datasetManager.js";

export function useDatasets() {
  const [datasets, setDatasets] = useState([]);

  useEffect(() => {
    console.log("🔗 useDatasets: Setting up subscription");

    const updateDatasets = () => {
      console.log("📊 useDatasets: Updating datasets");

      // Get all datasets from datasetManager
      const allDatasets = datasetManager.getAllDatasets();

      // Transform to include loading state
      const transformed = allDatasets.map((metadata) => {
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

      setDatasets(transformed);
    };

    // Initial update
    updateDatasets();

    // Subscribe to changes
    const unsubscribe = datasetManager.onChange(updateDatasets);

    return () => {
      console.log("🔗 useDatasets: Cleaning up subscription");
      unsubscribe();
    };
  }, []); // Empty deps - only subscribe once

  return datasets;
}
