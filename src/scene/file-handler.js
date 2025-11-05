// File Handling
import { vtpReader, mapper, actor, renderer, renderWindow, setCurrentActor } from './scene-setup.js';
import { yFile, setLocalFileLoad } from '../collaboration/yjs-setup.js';
import { logInfo, logProgress, logSuccess, logWarning, logError, logMemoryUsage } from '../utils/logging.js';

export let originalPointsData = null;

function preventDefaults(e) {
  e.preventDefault();
  e.stopPropagation();
}

export function handleFileInput(e) {
  preventDefaults(e);
  const dataTransfer = e.dataTransfer;
  const files = e.target.files || dataTransfer.files;
  
  if (files.length > 0) {
    const file = files[0];
    logInfo(`Loading file: ${file.name} (${(file.size / 1024).toFixed(1)} KB)`);
    logMemoryUsage('before file loading');
    
    const fileReader = new FileReader();
    fileReader.onload = function onLoad(e) {
      const fileData = fileReader.result;
      const b64 = arrayBufferToBase64(fileData);

      setLocalFileLoad(true);
      yFile.set('polydata', b64);

      updateScene(fileData);
    };
    
    fileReader.onerror = function(error) {
      logError(`File reading failed: ${error.message}`);
    };
    
    fileReader.readAsArrayBuffer(files[0]);
  }
}

export function handleRemoteFileData(b64) {
  const binary = Uint8Array.from(atob(b64), c => c.charCodeAt(0)).buffer;
  updateScene(binary);
}

function arrayBufferToBase64(buffer) {
  let binary = '';
  const bytes = new Uint8Array(buffer);
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

export function updateScene(fileData) {
  try {
    logProgress('Parsing VTP file...');
    vtpReader.parseAsArrayBuffer(fileData);

    const polyData = vtpReader.getOutputData(0);
    
    const points = polyData.getPoints();
    if (points) {
      originalPointsData = new Float32Array(points.getData());
      const numPoints = points.getNumberOfPoints();
      const bounds = polyData.getBounds();
      
      logSuccess('File loaded successfully!');
      logInfo('Dataset information:');
      logProgress(`  Points: ${numPoints.toLocaleString()}`);
      logProgress(`  Bounds: X[${bounds[0].toFixed(2)}, ${bounds[1].toFixed(2)}] Y[${bounds[2].toFixed(2)}, ${bounds[3].toFixed(2)}] Z[${bounds[4].toFixed(2)}, ${bounds[5].toFixed(2)}]`);
      
      const center = [
        (bounds[0] + bounds[1]) / 2,
        (bounds[2] + bounds[3]) / 2,
        (bounds[4] + bounds[5]) / 2,
      ];

      actor.setOrigin(center);
      actor.setPosition(0, 0, 0);

      const cells = polyData.getPolys();
      if (cells) {
        const numCells = cells.getNumberOfCells();
        logProgress(`  Polygons: ${numCells.toLocaleString()}`);
      }
      
      const pointDataSizeMB = (originalPointsData.length * 4) / (1024 * 1024);
      logProgress(`Memory usage: ~${pointDataSizeMB.toFixed(1)} MB`);
      
      if (numPoints > 10000) {
        logWarning('Large dataset: Memory-optimized algorithms will be used automatically');
      }
      if (numPoints > 50000) {
        logWarning('Very large dataset: Consider using smaller files for better performance');
      }
    } else {
      logWarning('No point data found in VTP file');
    }

    setCurrentActor(actor);
    
    mapper.setInputData(polyData);
    renderer.addActor(actor);
    renderer.resetCamera();
    renderWindow.render();
    
    logSuccess('Visualization rendered successfully');
    logInfo('Use "Toggle Reduction" to apply PCA, t-SNE, or UMAP');
    logMemoryUsage('after file loading complete');
    
  } catch (error) {
    logError(`Failed to load VTP file: ${error.message}`);
    logWarning('Make sure the file is a valid VTP (VTK XML PolyData) format');
    logMemoryUsage('after file loading error');
  }
}