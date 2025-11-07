// Line Widget System for 3D Measurements
import vtkWidgetManager from '@kitware/vtk.js/Widgets/Core/WidgetManager';
import vtkLineWidget from '@kitware/vtk.js/Widgets/Widgets3D/LineWidget';
import vtkSphereHandleRepresentation from '@kitware/vtk.js/Widgets/Representations/SphereHandleRepresentation';
import { renderer, renderWindow } from '../scene/scene-setup.js';
import { logInfo, logSuccess, logWarning, logError } from '../utils/logging.js';

// Widget manager and state
let widgetManager = null;
const lineWidgets = new Map();
let widgetCount = 0;

// Initialize the widget manager
export function initializeLineWidget() {
  logInfo('Initializing line widget...');
  
  try {
    widgetManager = vtkWidgetManager.newInstance();
    widgetManager.setRenderer(renderer);
    widgetManager.enablePicking();
    
    logSuccess('Line widget system initialized successfully');
    return true;
  } catch (error) {
    logError(`Failed to initialize line widget: ${error.message}`);
    console.error('Line widget initialization error:', error);
    return false;
  }
}

// Add a new line widget
export function addLineWidget() {
  if (!widgetManager) {
    logWarning('Widget manager not initialized');
    return null;
  }

  try {
    const widget = vtkLineWidget.newInstance();
    
    // Customize handle representation
    widget.getWidgetState().getHandle1().setScale1(10);
    widget.getWidgetState().getHandle2().setScale1(10);
    
    // Set handle colors
    widget.getWidgetState().getHandle1().setColor(1, 0, 0); // Red
    widget.getWidgetState().getHandle2().setColor(0, 1, 0); // Green
    
    const viewWidget = widgetManager.addWidget(widget);
    
    // Place initial points at center of scene
    const bounds = renderer.computeVisiblePropBounds();
    const centerX = (bounds[0] + bounds[1]) / 2;
    const centerY = (bounds[2] + bounds[3]) / 2;
    const centerZ = (bounds[4] + bounds[5]) / 2;
    
    // Set initial line positions
    widget.getWidgetState().getHandle1().setOrigin(centerX - 10, centerY, centerZ);
    widget.getWidgetState().getHandle2().setOrigin(centerX + 10, centerY, centerZ);
    
    widgetCount++;
    const widgetId = `line_${widgetCount}`;
    
    lineWidgets.set(widgetId, {
      widget,
      viewWidget,
      visible: true
    });
    
    // Subscribe to interaction events
    viewWidget.onInteractionEvent(() => {
      const distance = getLineDistance(widget);
      logInfo(`Line ${widgetId} length: ${distance.toFixed(2)} units`);
      updateLineInfo();
    });
    
    logSuccess(`Line widget ${widgetId} added to scene`);
    updateLineInfo();
    renderWindow.render();
    
    return widgetId;
  } catch (error) {
    logError(`Failed to add line widget: ${error.message}`);
    console.error('Add line widget error:', error);
    return null;
  }
}

// Delete a specific line widget
export function deleteLineWidget(widgetId) {
  const widgetData = lineWidgets.get(widgetId);
  
  if (!widgetData) {
    logWarning(`Line widget ${widgetId} not found`);
    return false;
  }
  
  try {
    widgetManager.removeWidget(widgetData.viewWidget);
    lineWidgets.delete(widgetId);
    
    logInfo(`Line widget ${widgetId} deleted`);
    updateLineInfo();
    renderWindow.render();
    return true;
  } catch (error) {
    logError(`Failed to delete line widget: ${error.message}`);
    return false;
  }
}

// Delete all line widgets
export function deleteAllLineWidgets() {
  try {
    lineWidgets.forEach((widgetData, widgetId) => {
      widgetManager.removeWidget(widgetData.viewWidget);
    });
    
    lineWidgets.clear();
    widgetCount = 0;
    
    logSuccess('All line widgets deleted');
    updateLineInfo();
    renderWindow.render();
    return true;
  } catch (error) {
    logError(`Failed to delete all widgets: ${error.message}`);
    return false;
  }
}

// Toggle visibility of a line widget
export function toggleLineVisibility(widgetId) {
  const widgetData = lineWidgets.get(widgetId);
  
  if (!widgetData) {
    logWarning(`Line widget ${widgetId} not found`);
    return false;
  }
  
  try {
    widgetData.visible = !widgetData.visible;
    widgetData.viewWidget.setVisibility(widgetData.visible);
    
    logInfo(`Line widget ${widgetId} visibility: ${widgetData.visible}`);
    renderWindow.render();
    return widgetData.visible;
  } catch (error) {
    logError(`Failed to toggle visibility: ${error.message}`);
    return false;
  }
}

// Get the distance of a line
export function getLineDistance(widget) {
  const handle1 = widget.getWidgetState().getHandle1();
  const handle2 = widget.getWidgetState().getHandle2();
  
  const pos1 = handle1.getOrigin();
  const pos2 = handle2.getOrigin();
  
  const dx = pos2[0] - pos1[0];
  const dy = pos2[1] - pos1[1];
  const dz = pos2[2] - pos1[2];
  
  return Math.sqrt(dx * dx + dy * dy + dz * dz);
}

// Get all line measurements
export function getAllLineMeasurements() {
  const measurements = [];
  
  lineWidgets.forEach((widgetData, widgetId) => {
    const distance = getLineDistance(widgetData.widget);
    const handle1 = widgetData.widget.getWidgetState().getHandle1();
    const handle2 = widgetData.widget.getWidgetState().getHandle2();
    
    measurements.push({
      id: widgetId,
      distance: distance,
      point1: handle1.getOrigin(),
      point2: handle2.getOrigin(),
      visible: widgetData.visible
    });
  });
  
  return measurements;
}

// Update the line info display
function updateLineInfo() {
  const infoDiv = document.getElementById('lineInfo');
  if (!infoDiv) return;
  
  const measurements = getAllLineMeasurements();
  
  if (measurements.length === 0) {
    infoDiv.innerHTML = '<div style="color: #999; font-style: italic;">No lines yet</div>';
    return;
  }
  
  let html = '';
  measurements.forEach((m, index) => {
    const visIcon = m.visible ? '👁️' : '🚫';
    html += `
      <div style="
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 5px;
        background: ${index % 2 === 0 ? 'rgba(0,0,0,0.05)' : 'transparent'};
        border-radius: 3px;
        margin-bottom: 3px;
      ">
        <span style="font-weight: bold; color: #333;">${m.id}:</span>
        <span style="color: #2196F3; font-weight: 500;">${m.distance.toFixed(2)} units</span>
        <button 
          onclick="window.toggleLineVisibility('${m.id}')"
          style="
            background: none;
            border: none;
            cursor: pointer;
            font-size: 16px;
            padding: 2px 5px;
          "
          title="Toggle visibility"
        >${visIcon}</button>
        <button 
          onclick="window.deleteLineWidget('${m.id}')"
          style="
            background: #f44336;
            color: white;
            border: none;
            cursor: pointer;
            font-size: 11px;
            padding: 3px 6px;
            border-radius: 3px;
          "
          title="Delete line"
        >×</button>
      </div>
    `;
  });
  
  infoDiv.innerHTML = html;
}

// Create the line widget control panel
export function createLineControlPanel() {
  logInfo('Creating line widget control panel...');
  
  if (document.querySelector('.line-controls')) {
    logInfo('Line control panel already exists');
    return;
  }
  
  if (!document.body) {
    logWarning('Document body not ready for line panel');
    return;
  }
  
  const panel = document.createElement('div');
  panel.className = 'line-controls';
  panel.innerHTML = `
    <style>
      .line-controls {
        position: absolute;
        top: 25px;
        right: 25px;
        background: rgba(255, 255, 255, 0.95);
        border-radius: 8px;
        padding: 15px;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
        font-family: Arial, sans-serif;
        z-index: 1000;
        min-width: 280px;
        max-width: 350px;
      }

      .line-controls h3 {
        margin: 0 0 10px 0;
        font-size: 16px;
        color: #333;
        border-bottom: 2px solid #2196F3;
        padding-bottom: 5px;
      }

      .line-controls button {
        width: 100%;
        padding: 8px;
        margin: 5px 0;
        border: none;
        border-radius: 4px;
        font-size: 14px;
        cursor: pointer;
        transition: all 0.2s;
        font-weight: 500;
      }

      .line-controls button:hover {
        opacity: 0.85;
        transform: translateY(-1px);
      }

      .line-controls button:active {
        transform: translateY(0);
      }

      #addLine {
        background: #2196F3;
        color: white;
      }

      #deleteAllLines {
        background: #f44336;
        color: white;
      }

      .line-controls .button-group {
        display: flex;
        gap: 5px;
        margin-bottom: 10px;
      }

      .line-controls .button-group button {
        flex: 1;
      }

      #lineInfo {
        margin-top: 10px;
        padding: 10px;
        background: #f5f5f5;
        border-radius: 4px;
        max-height: 300px;
        overflow-y: auto;
        font-size: 12px;
      }

      .line-controls .info-label {
        font-size: 11px;
        color: #666;
        margin-bottom: 5px;
        font-weight: bold;
      }
    </style>
    
    <h3>📏 Line Measurements</h3>
    
    <div class="button-group">
      <button id="addLine" type="button">+ Add Line</button>
      <button id="deleteAllLines" type="button">🗑 Clear All</button>
    </div>

    <div class="info-label">Active Lines:</div>
    <div id="lineInfo">
      <div style="color: #999; font-style: italic;">No lines yet</div>
    </div>
  `;
  
  try {
    document.body.appendChild(panel);
    logSuccess('Line control panel created and added to page');
    
    const addedPanel = document.querySelector('.line-controls');
    if (addedPanel) {
      logSuccess('Panel confirmed in DOM');
    }
  } catch (error) {
    logWarning(`Failed to add panel to page: ${error.message}`);
    console.error('Panel creation error:', error);
  }
}

// Get widget manager
export function getWidgetManager() {
  return widgetManager;
}

// Get all line widgets
export function getLineWidgets() {
  return lineWidgets;
}

// Expose functions to window for button clicks
if (typeof window !== 'undefined') {
  window.deleteLineWidget = deleteLineWidget;
  window.toggleLineVisibility = toggleLineVisibility;
}