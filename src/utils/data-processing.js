// Data Processing Utilities
import { logProgress, logSuccess, logInfo } from './logging.js';

export async function extractPointsFromPolyData(polyData) {
  const points = polyData.getPoints();
  if (!points) return null;
  
  const pointsArray = points.getData();
  const numPoints = points.getNumberOfPoints();
  
  logProgress(`Extracting ${numPoints.toLocaleString()} points...`);
  
  const pointsMatrix = [];
  for (let i = 0; i < numPoints; i++) {
    const point = [
      pointsArray[i * 3],
      pointsArray[i * 3 + 1],
      pointsArray[i * 3 + 2]
    ];
    pointsMatrix.push(point);
  }
  
  return pointsMatrix;
}

export function applyReductionToPolyData(polyData, reducedPoints) {
  logProgress('Applying transformed points to visualization...');
  
  const points = polyData.getPoints();
  const pointsArray = points.getData();
  const numPoints = points.getNumberOfPoints();
  
  // Check if this is a 2D result (all Z coordinates are 0)
  const is2D = reducedPoints.every(point => point.length >= 3 && point[2] === 0);
  
  for (let i = 0; i < numPoints; i++) {
    pointsArray[i * 3] = reducedPoints[i][0];
    pointsArray[i * 3 + 1] = reducedPoints[i][1];
    pointsArray[i * 3 + 2] = reducedPoints[i].length > 2 ? reducedPoints[i][2] : 0;
  }
  
  points.setData(pointsArray);
  points.modified();
  polyData.modified();
  polyData.getBounds();
  
  if (is2D) {
    logSuccess('Applied 2D visualization - all points in XY plane (Z=0)');
    // Set up 2D viewing - position camera to look down at XY plane
    setup2DView();
  } else {
    logSuccess('Applied 3D visualization with transformed points');
  }
}

export function interpolateResults(allPoints, sampledPoints, sampledResult, numComponents) {
  logProgress(`Interpolating to ${allPoints.length.toLocaleString()} points...`);
  
  const result = [];
  const BATCH_SIZE = 1000;
  
  for (let batchStart = 0; batchStart < allPoints.length; batchStart += BATCH_SIZE) {
    const batchEnd = Math.min(batchStart + BATCH_SIZE, allPoints.length);
    
    for (let i = batchStart; i < batchEnd; i++) {
      const point = allPoints[i];
      
      // Find nearest sample point (simplified search)
      let minDist = Infinity;
      let nearestIdx = 0;
      
      // Check every 10th sample point for efficiency
      const checkStep = Math.max(1, Math.floor(sampledPoints.length / 50));
      
      for (let j = 0; j < sampledPoints.length; j += checkStep) {
        let dist = 0;
        for (let d = 0; d < point.length; d++) {
          const diff = point[d] - sampledPoints[j][d];
          dist += diff * diff;
        }
        
        if (dist < minDist) {
          minDist = dist;
          nearestIdx = j;
        }
      }
      
      // Use nearest sample result with small random offset
      const interpolatedPoint = [...sampledResult[nearestIdx]];
      for (let d = 0; d < interpolatedPoint.length; d++) {
        interpolatedPoint[d] += (Math.random() - 0.5) * 0.02;
      }
      
      // Ensure 3D output
      while (interpolatedPoint.length < 3) {
        interpolatedPoint.push(0);
      }
      
      result.push(interpolatedPoint);
    }
    
    // Progress update
    if (batchStart % (BATCH_SIZE * 5) === 0) {
      const progress = ((batchEnd / allPoints.length) * 100).toFixed(1);
      logProgress(`  Interpolation: ${progress}%`);
    }
  }
  
  return result;
}