// src/ui/react/hooks/useCurrentDataset.js
import { useEffect, useState } from "react";
import { getDatasetManager } from "./useDatasetManager.js";
import { visualizationManager } from "@Core/visualizationManager.js";

export function useCurrentDataset() {
  const [state, setState] = useState({
    datasetId: null,
    datasetInfo: null,
    datasetDetails: null,
    isLoading: false,
    hasPolydata: false,
  });

  useEffect(() => {
    const datasetManager = getDatasetManager();

    const updateDatasetState = () => {
      const current = visualizationManager.getCurrentDataset();

      if (current && current.datasetId) {
        const dataset = datasetManager.getDataset(current.datasetId);

        if (dataset && dataset.polydata) {
          // Dataset fully loaded
          setState({
            datasetId: current.datasetId,
            datasetInfo: current,
            datasetDetails: dataset,
            isLoading: false,
            hasPolydata: true,
          });
        } else {
          // Dataset exists but polydata not loaded yet
          setState({
            datasetId: current.datasetId,
            datasetInfo: current,
            datasetDetails: dataset,
            isLoading: !dataset,
            hasPolydata: false,
          });
        }
      } else {
        // No dataset selected
        setState({
          datasetId: null,
          datasetInfo: null,
          datasetDetails: null,
          isLoading: false,
          hasPolydata: false,
        });
      }
    };

    // Initial update
    updateDatasetState();

    // Listen for changes
    visualizationManager.yViz.observe(updateDatasetState);
    datasetManager.on("datasetLoaded", updateDatasetState);
    datasetManager.on("datasetUpdated", updateDatasetState);

    return () => {
      visualizationManager.yViz.unobserve(updateDatasetState);
      datasetManager.off("datasetLoaded", updateDatasetState);
      datasetManager.off("datasetUpdated", updateDatasetState);
    };
  }, []);

  return state;
}

export function useCurrentDatasetId() {
  const { datasetId } = useCurrentDataset();
  return datasetId;
}
