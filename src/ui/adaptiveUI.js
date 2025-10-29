// ----------------------------------------------------------------------------
// Adaptive UI - Shows/Hides UI Based on Mode
// ----------------------------------------------------------------------------

import { modeManager } from '../core/modeManager.js';
import { logInfo } from './logging.js';

class AdaptiveUI {
  constructor() {
    this.desktopElements = [];
    this.vrElements = [];
  }

  initialize() {
    // Listen for mode changes
    modeManager.onModeChange((newMode) => {
      this.updateUIForMode(newMode);
    });

    // Set initial state
    this.updateUIForMode(modeManager.getCurrentMode());
    
    logInfo('Adaptive UI initialized');
  }

  registerDesktopElement(element) {
    this.desktopElements.push(element);
  }

  registerVRElement(element) {
    this.vrElements.push(element);
  }

  updateUIForMode(mode) {
    if (mode === 'vr') {
      this.showVRUI();
      this.hideDesktopUI();
    } else {
      this.showDesktopUI();
      this.hideVRUI();
    }
  }

  hideDesktopUI() {
    logInfo('Hiding desktop UI');
    
    // Hide control panel
    const controlTable = document.querySelector('table');
    if (controlTable) {
      controlTable.style.display = 'none';
    }

    // Hide file input
    const fileInput = document.getElementById('fileInput');
    if (fileInput) {
      fileInput.style.display = 'none';
    }

    // Hide logging panel
    const logPanel = document.getElementById('logPanel');
    if (logPanel) {
      logPanel.style.display = 'none';
    }

    // Hide all registered desktop elements
    this.desktopElements.forEach(element => {
      if (element) {
        element.style.display = 'none';
      }
    });

    logInfo('Desktop UI hidden');
  }

  showDesktopUI() {
    logInfo('Showing desktop UI');
    
    // Show control panel
    const controlTable = document.querySelector('table');
    if (controlTable) {
      controlTable.style.display = '';
    }

    // Show file input
    const fileInput = document.getElementById('fileInput');
    if (fileInput) {
      fileInput.style.display = '';
    }

    // Show logging panel
    const logPanel = document.getElementById('logPanel');
    if (logPanel) {
      logPanel.style.display = '';
    }

    // Show all registered desktop elements
    this.desktopElements.forEach(element => {
      if (element) {
        element.style.display = '';
      }
    });

    logInfo('Desktop UI shown');
  }

  hideVRUI() {
    // Hide VR-specific UI elements
    this.vrElements.forEach(element => {
      if (element) {
        element.style.display = 'none';
      }
    });
  }

  showVRUI() {
    // Show VR-specific UI elements
    this.vrElements.forEach(element => {
      if (element) {
        element.style.display = '';
      }
    });
  }
}

export const adaptiveUI = new AdaptiveUI();