// UI Controls Setup
import controlPanel from '../controller.html';
import { fullScreenRenderer, renderWindow, actor, XRHelper } from '../scene/scene-setup.js';
import { XrSessionTypes } from '@kitware/vtk.js/Rendering/WebXR/RenderWindowHelper/Constants';
import { yActor, yUIState, setLocalUIChange } from '../collaboration/yjs-setup.js';
import { logInfo, logSuccess, logProgress, logWarning, logMemoryUsage, cleanupTensors } from '../utils/logging.js';
import { handleFileInput } from '../scene/file-handler.js';
import { setupDimensionalityReductionControls } from './reduction-controls.js';
import { initializeLabelWidget, createLabelControlPanel } from './label-widget.js';
import { setupLabelControls } from './label-controls.js';

export function setupUI() {
  fullScreenRenderer.addController(controlPanel);
  
  // Create and add label control panel programmatically
  createLabelControlPanel();
  
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
  
  // Initialize label widget system
  initializeLabelWidget();
  setupLabelControls();
  
  logSuccess('UI controls initialized (including label widgets)');
}