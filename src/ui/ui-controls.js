// UI Controls Setup
import controlPanel from '../controller.html';
import { fullScreenRenderer, renderWindow, actor, XRHelper } from '../scene/scene-setup.js';
import { XrSessionTypes } from '@kitware/vtk.js/Rendering/WebXR/RenderWindowHelper/Constants';
import { yActor, yUIState, setLocalUIChange } from '../collaboration/yjs-setup.js';
import { logInfo, logSuccess, logProgress, logWarning, logMemoryUsage, cleanupTensors } from '../utils/logging.js';
import { handleFileInput } from '../scene/file-handler.js';
import { setupDimensionalityReductionControls } from './reduction-controls.js';
import { initializeLineWidget, createLineControlPanel } from './line-widget.js';
import { setupLineControls } from './line-controls.js';

export function setupUI() {
  fullScreenRenderer.addController(controlPanel);
  
  const representationSelector = document.querySelector('.representations');
  const vrbutton = document.querySelector('.vrbutton');
  const fileInput = document.getElementById('fileInput');
  
  fileInput.addEventListener('change', handleFileInput);
  
  representationSelector.addEventListener('change', (e) => {
    const newRepValue = Number(e.target.value);
    actor.getProperty().setRepresentation(newRepValue);
    yActor.set('representation', newRepValue);
    yUIState.set('representation', newRepValue);
    setLocalUIChange(true);
    renderWindow.render();
  });
  
  vrbutton.addEventListener('click', (e) => {
    if (vrbutton.textContent === 'Send To VR') {
      XRHelper.startXR(XrSessionTypes.InlineVr);
      vrbutton.textContent = 'Return From VR';
    } else {
      XRHelper.stopXR();
      vrbutton.textContent = 'Send To VR';
    }
  });
  
  setupDimensionalityReductionControls();
  
  // Initialize line widget system - add slight delay to ensure DOM is ready
  setTimeout(() => {
    try {
      createLineControlPanel();
      initializeLineWidget();
      setupLineControls();
      logSuccess('Line widget system initialized');
    } catch (error) {
      logWarning(`Line widget initialization failed: ${error.message}`);
      console.error('Line widget error:', error);
    }
  }, 500);
  
  logSuccess('UI controls initialized (including label widgets)');
}