// Main entry point for VTK.js collaborative application
import '@kitware/vtk.js/favicon';
import '@kitware/vtk.js/Rendering/Profiles/Geometry';
import '@kitware/vtk.js/IO/Core/DataAccessHelper/HtmlDataAccessHelper';
import '@kitware/vtk.js/IO/Core/DataAccessHelper/HttpDataAccessHelper';
import '@kitware/vtk.js/IO/Core/DataAccessHelper/JSZipDataAccessHelper';

import vtkResourceLoader from '@kitware/vtk.js/IO/Core/ResourceLoader';
import { initializeLogging, logInfo, logSuccess, logProgress, logMemoryUsage, cleanupTensors } from './utils/logging.js';
import { initializeTensorFlow } from './utils/tensorflow-setup.js';
import { setupScene } from './scene/scene-setup.js';
import { setupCollaboration } from './collaboration/yjs-setup.js';
import { setupUI } from './ui/ui-controls.js';
import { initializeCursorSystem } from './collaboration/cursor-system.js';

// Load WebXR polyfill if needed
if (navigator.xr === undefined) {
  vtkResourceLoader
    .loadScript('https://cdn.jsdelivr.net/npm/webxr-polyfill@latest/build/webxr-polyfill.js')
    .then(() => {
      new WebXRPolyfill();
    });
}

// Main application initialization
async function initializeApplication() {
  logInfo('Starting VTK.js with TensorFlow.js PCA Application...');
  
  // Initialize logging system
  initializeLogging();
  
  // Initialize TensorFlow.js
  const tfReady = await initializeTensorFlow();
  if (!tfReady) {
    logError('TensorFlow.js failed to initialize, PCA will not work');
  }
  
  // Setup 3D scene
  setupScene();
  
  // Setup collaboration (Yjs)
  setupCollaboration();
  
  // Setup UI controls
  setupUI();
  
  // Initialize collaborative cursor system
  initializeCursorSystem();
  
  logSuccess('Application initialized successfully');
  logInfo('Features available:');
  logProgress('  - VTP file loading and visualization');
  logProgress('  - WebXR/VR support');
  logProgress('  - PCA with TensorFlow.js (optimized memory management)');
  logProgress('  - t-SNE and UMAP (pure JavaScript implementations)');
  logProgress('  - Advanced logging and performance monitoring');
  logProgress('  - Automatic optimization for datasets from 100 to 1,000,000+ points');
  logInfo('Load a VTP file to get started!');
  logMemoryUsage('on startup');
}

// Set up cleanup on page unload
window.addEventListener('beforeunload', () => {
  cleanupTensors();
});

// Start the application
initializeApplication();