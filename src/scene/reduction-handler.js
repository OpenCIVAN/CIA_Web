// Dimensionality Reduction Handler
import { vtpReader, mapper, renderer, renderWindow, camera, currentActor } from './scene-setup.js';
import { yActor, yReduction } from '../collaboration/yjs-setup.js';
import { originalPointsData } from './file-handler.js';
import { performPCA, performTSNE, performUMAP } from '../algorithms/dimensionality-reduction.js';
import { extractPointsFromPolyData, applyReductionToPolyData } from '../utils/data-processing.js';
import { logInfo, logProgress, logSuccess, logWarning, logError, logMemoryUsage, cleanupTensors } from '../utils/logging.js';

export let reductionApplied = false;
export let reductionMethod = 'pca';
export let reductionComponents = 3;

export function setReductionMethod(method) {
  reductionMethod = method;
}

export function setReductionComponents(components) {
  reductionComponents = components;
}

export function setup2DView() {
  const bounds = renderer.computeVisiblePropBounds();
  const centerX = (bounds[0] + bounds[1]) / 2;
  const centerY = (bounds[2] + bounds[3]) / 2;
  const centerZ = 0;
  
  const rangeX = bounds[1] - bounds[0];
  const rangeY = bounds[3] - bounds[2];
  const maxRange = Math.max(rangeX, rangeY);
  
  camera.setPosition(centerX, centerY, maxRange * 2);
  camera.setFocalPoint(centerX, centerY, centerZ);
  camera.setViewUp(0, 1, 0);
  
  camera.setParallelProjection(true);
  camera.setParallelScale(maxRange * 0.55);
  
  renderWindow.render();
  
  logProgress('Locked to 2D viewing mode (no rotation, orthographic projection)');
}

export function restore3DView() {
  camera.setParallelProjection(false);
  logProgress('Restored 3D viewing mode (rotation enabled, perspective projection)');
}

export async function toggleDimensionalityReduction(isRemote = false) {
  if (!originalPointsData) {
    logError('No data loaded for processing');
    alert('Please load a VTP file first!');
    return;
  }
  
  const currentPolyData = vtpReader.getOutputData(0);
  
  if (!isRemote) {
    yActor.set('orientation', currentActor.getOrientation());
    yReduction.set('state', {
      method: reductionMethod,
      components: reductionComponents,
    });
  }
  
  if (!reductionApplied) {
    logInfo(`Starting ${reductionMethod.toUpperCase()} transformation...`);
    logProgress(`Target: ${reductionComponents}D reduction`);
    logMemoryUsage('before reduction');
    
    try {
      const pointsMatrix = await extractPointsFromPolyData(currentPolyData);
      if (!pointsMatrix) {
        logError('Failed to extract points from polydata');
        return;
      }
      
      logProgress(`Processing ${pointsMatrix.length.toLocaleString()} points`);
      
      let reducedPoints;
      const startTime = performance.now();
      
      logProgress(`Executing ${reductionMethod.toUpperCase()} with ${reductionComponents}D target...`);
      
      if (reductionMethod === 'pca') {
        reducedPoints = await performPCA(pointsMatrix, reductionComponents);
        logSuccess(`PCA completed - output has ${reducedPoints[0].length} dimensions`);
      } else if (reductionMethod === 'tsne') {
        const tsneOptions = {
          perplexity: Math.min(10.0, Math.floor(pointsMatrix.length / 6)),
          maxIterations: 300,
          learningRate: 100.0
        };
        logProgress(`t-SNE options: perplexity=${tsneOptions.perplexity}, target=${reductionComponents}D`);
        reducedPoints = await performTSNE(pointsMatrix, reductionComponents, tsneOptions);
        logSuccess(`t-SNE completed - output has ${reducedPoints[0].length} dimensions`);
        
        if (reductionComponents === 2 && reducedPoints[0].length === 3) {
          logProgress('t-SNE 2D result padded to 3D for visualization (Z=0)');
        }
      } else if (reductionMethod === 'umap') {
        const umapNeighborsInput = document.querySelector('.umap-neighbors-input');
        const umapMinDistInput = document.querySelector('.umap-mindist-input');
        
        const nNeighbors = umapNeighborsInput ? parseInt(umapNeighborsInput.value) : 8;
        const minDist = umapMinDistInput ? parseFloat(umapMinDistInput.value) : 0.1;
        
        const umapOptions = {
          nNeighbors: nNeighbors,
          minDist: minDist,
          nEpochs: 200
        };
        
        logProgress(`UMAP options: neighbors=${nNeighbors}, min_dist=${minDist}, target=${reductionComponents}D`);
        reducedPoints = await performUMAP(pointsMatrix, reductionComponents, umapOptions);
        logSuccess(`UMAP completed - output has ${reducedPoints[0].length} dimensions`);
        
        if (reductionComponents === 2 && reducedPoints[0].length === 3) {
          logProgress('UMAP 2D result padded to 3D for visualization (Z=0)');
        }
      }
      
      const endTime = performance.now();
      const processingTime = ((endTime - startTime) / 1000).toFixed(2);
      
      const originalBounds = currentPolyData.getBounds();
      logProgress(`Original bounds: X[${originalBounds[0].toFixed(2)}, ${originalBounds[1].toFixed(2)}] Y[${originalBounds[2].toFixed(2)}, ${originalBounds[3].toFixed(2)}] Z[${originalBounds[4].toFixed(2)}, ${originalBounds[5].toFixed(2)}]`);
      
      const is2D = applyReductionToPolyData(currentPolyData, reducedPoints);
      reductionApplied = true;
      
      const newBounds = currentPolyData.getBounds();
      logProgress(`New bounds: X[${newBounds[0].toFixed(2)}, ${newBounds[1].toFixed(2)}] Y[${newBounds[2].toFixed(2)}, ${newBounds[3].toFixed(2)}] Z[${newBounds[4].toFixed(2)}, ${newBounds[5].toFixed(2)}]`);
      
      logSuccess(`${reductionMethod.toUpperCase()} reduction completed in ${processingTime}s`);
      logInfo(`Visualization updated with ${reductionComponents}D data`);
      logMemoryUsage('after reduction complete');
      
      if (reductionMethod === 'pca') {
        cleanupTensors();
      }
      
      if (is2D) {
        setup2DView();
      }
      
    } catch (error) {
      logError(`${reductionMethod.toUpperCase()} reduction failed: ${error.message}`);
      logWarning('Try reloading the file or using a different method');
      logMemoryUsage('after error');
      
      if (reductionMethod === 'pca') {
        cleanupTensors();
      }
      return;
    }
  } else {
    logInfo('Restoring original data...');
    
    const points = currentPolyData.getPoints();
    points.setData(originalPointsData);
    currentPolyData.modified();
    reductionApplied = false;
    
    restore3DView();
    
    logSuccess('Original data restored successfully');
    cleanupTensors();
  }
  
  mapper.setInputData(currentPolyData);
  renderer.resetCamera();
  renderWindow.render();

  logInfo('Visualization refreshed');
  logProgress(`Current state: ${reductionApplied ? `${reductionMethod.toUpperCase()} ${reductionComponents}D` : 'Original 3D'}`);
}

export function handleRemoteReduction(method, components) {
  reductionMethod = method;
  reductionComponents = components;
  toggleDimensionalityReduction(true);
}

// Expose for debugging
if (typeof window !== 'undefined') {
  window.toggleDimensionalityReduction = toggleDimensionalityReduction;
  window.performPCA = performPCA;
  window.performTSNE = performTSNE;
  window.performUMAP = performUMAP;
  window.extractPointsFromPolyData = extractPointsFromPolyData;
  window.logMemoryUsage = logMemoryUsage;
  window.cleanupTensors = cleanupTensors;
}