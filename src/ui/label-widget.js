// Label Widget System for 3D Scene Annotations
import vtkWidgetManager from '@kitware/vtk.js/Widgets/Core/WidgetManager';
import vtkLabelWidget from '@kitware/vtk.js/Widgets/Widgets3D/LabelWidget';
import vtkInteractorObserver from '@kitware/vtk.js/Rendering/Core/InteractorObserver';
import {
  bindSVGRepresentation,
  multiLineTextCalculator,
  VerticalTextAlignment,
  makeListenableSVGNode,
} from 'vtk.js/Examples/Widgets/Utilities/SVGHelpers';
import { renderer, renderWindow } from '../scene/scene-setup.js';
import { logInfo, logSuccess } from '../utils/logging.js';

const { computeWorldToDisplay } = vtkInteractorObserver;

// Widget manager and state
let widgetManager = null;
let currentHandle = null;
const handleTextProps = new Map();
const svgCleanupCallbacks = new Map();

// Create the label control panel programmatically
export function createLabelControlPanel() {
  logInfo('Creating label control panel...');
  
  // Check if panel already exists
  if (document.querySelector('.label-controls')) {
    logInfo('Label control panel already exists');
    return;
  }
  
  if (!document.body) {
    logWarning('Document body not ready for label panel');
    return;
  }
  
  const panel = document.createElement('div');
  panel.className = 'label-controls';
  panel.innerHTML = `
    <style>
      .label-controls {
        position: absolute;
        top: 25px;
        left: 25px;
        background: rgba(255, 255, 255, 0.95);
        border-radius: 8px;
        padding: 15px;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
        font-family: Arial, sans-serif;
        z-index: 1000;
        min-width: 250px;
      }

      .label-controls h3 {
        margin: 0 0 10px 0;
        font-size: 16px;
        color: #333;
        border-bottom: 2px solid #2196F3;
        padding-bottom: 5px;
      }

      .label-controls button {
        width: 100%;
        padding: 8px;
        margin: 5px 0;
        border: none;
        border-radius: 4px;
        font-size: 14px;
        cursor: pointer;
        transition: background 0.2s;
        font-weight: 500;
      }

      .label-controls button:hover {
        opacity: 0.85;
        transform: translateY(-1px);
      }

      .label-controls button:active {
        transform: translateY(0);
      }

      #addLabel {
        background: #4CAF50;
        color: white;
      }

      #deleteLabel {
        background: #f44336;
        color: white;
      }

      .label-controls .input-group {
        margin: 10px 0;
      }

      .label-controls label {
        display: block;
        font-size: 12px;
        color: #666;
        margin-bottom: 3px;
        font-weight: bold;
      }

      .label-controls input[type="text"],
      .label-controls input[type="number"] {
        width: 100%;
        padding: 6px;
        border: 1px solid #ddd;
        border-radius: 4px;
        font-size: 13px;
        box-sizing: border-box;
      }

      .label-controls input[type="color"] {
        width: 100%;
        height: 35px;
        border: 1px solid #ddd;
        border-radius: 4px;
        cursor: pointer;
      }

      .label-controls .button-group {
        display: flex;
        gap: 5px;
        margin-top: 10px;
      }

      .label-controls .button-group button {
        flex: 1;
      }
    </style>
    
    <h3>📝 Label Controls</h3>
    
    <div class="button-group">
      <button id="addLabel" type="button">+ Add Label</button>
      <button id="deleteLabel" type="button">🗑 Delete</button>
    </div>

    <div class="input-group">
      <label for="txtIpt">Label Text</label>
      <input 
        type="text" 
        id="txtIpt" 
        placeholder="Enter label text..."
        autocomplete="off"
      />
    </div>

    <div class="input-group">
      <label for="fontSize">Font Size</label>
      <input 
        type="number" 
        id="fontSize" 
        value="32" 
        min="10" 
        max="100"
        step="1"
      />
    </div>

    <div class="input-group">
      <label for="color">Text Color</label>
      <input 
        type="color" 
        id="color" 
        value="#ffffff"
      />
    </div>
  `;
  
  try {
    document.body.appendChild(panel);
    logSuccess('Label control panel created and added to page');
    
    // Verify it's visible
    const addedPanel = document.querySelector('.label-controls');
    if (addedPanel) {
      logSuccess(`Panel confirmed in DOM with z-index: ${addedPanel.style.zIndex || 'from CSS'}`);
    }
  } catch (error) {
    logWarning(`Failed to add panel to page: ${error.message}`);
    console.error('Panel creation error:', error);
  }
}

// Initialize the widget manager
export function initializeLabelWidget() {
  widgetManager = vtkWidgetManager.newInstance();
  widgetManager.setRenderer(renderer);
  widgetManager.enablePicking();
  
  logSuccess('Label widget system initialized');
}

// Setup SVG representation for a label widget
function setupSVG(viewWidget) {
  return bindSVGRepresentation(renderer, viewWidget.getWidgetState(), {
    mapState(widgetState, { size }) {
      const textState = widgetState.getText();
      const text = textState.getText();
      const origin = textState.getOrigin();
      if (origin && textState.getVisible()) {
        const coords = computeWorldToDisplay(renderer, ...origin);
        const position = [coords[0], size[1] - coords[1]];
        return {
          text,
          position,
          active: textState.getActive(),
        };
      }
      return null;
    },
    render(data, h) {
      if (data) {
        const nodes = [];
        const { text, position, active } = data;
        const { fontColor, fontSize } = handleTextProps.get(viewWidget);

        if (text.trim().length === 0) {
          nodes.push(
            h('circle', {
              key: 'circle',
              attrs: {
                r: 5,
                stroke: 'red',
                fill: 'red',
                cx: position[0],
                cy: position[1],
              },
            })
          );
        }

        const lines = text.split('\n');
        const dys = multiLineTextCalculator(
          lines.length,
          fontSize,
          VerticalTextAlignment.MIDDLE
        );
        nodes.push(
          ...lines.map((line, index) =>
            makeListenableSVGNode(
              h(
                'text',
                {
                  key: index,
                  attrs: {
                    x: position[0],
                    y: position[1],
                    dx: 12,
                    dy: dys[index],
                    fill: fontColor,
                    'font-size': fontSize,
                    'text-anchor': 'middle',
                    'font-weight': active ? 'bold' : 'normal',
                  },
                  style: {
                    cursor: 'pointer',
                  },
                  on: {
                    pointerenter() {
                      widgetManager.disablePicking();
                      viewWidget.activateHandle({
                        selectedState: viewWidget.getWidgetState().getText(),
                      });
                    },
                    pointerleave: () => {
                      viewWidget.deactivateAllHandles();
                      widgetManager.enablePicking();
                    },
                  },
                },
                line
              )
            )
          )
        );

        return nodes;
      }
      return [];
    },
  });
}

// Add a new label to the scene
export function addLabel() {
  if (!widgetManager) {
    logInfo('Widget manager not initialized');
    return null;
  }

  const widget = vtkLabelWidget.newInstance();
  const handle = widgetManager.addWidget(widget);
  widgetManager.grabFocus(widget);

  const textProps = {
    fontSize: 32,
    fontColor: 'white',
  };
  handleTextProps.set(handle, textProps);
  svgCleanupCallbacks.set(handle, setupSVG(handle));

  // Update control panel when a label is selected
  handle.onStartInteractionEvent(() => {
    currentHandle = handle;
    const txtInput = document.getElementById('txtIpt');
    const fontSizeInput = document.getElementById('fontSize');
    const colorInput = document.getElementById('color');
    
    if (txtInput) txtInput.value = currentHandle.getText() || '';
    if (fontSizeInput) fontSizeInput.value = textProps.fontSize;
    if (colorInput) colorInput.value = textProps.fontColor;
  });

  logInfo('New label added to scene');
  return handle;
}

// Delete the currently selected label
export function deleteLabel() {
  if (currentHandle) {
    currentHandle.reset();
    widgetManager.removeWidget(currentHandle);
    svgCleanupCallbacks.get(currentHandle)();
    svgCleanupCallbacks.delete(currentHandle);
    handleTextProps.delete(currentHandle);
    currentHandle = null;
    logInfo('Label deleted');
  }
}

// Update the text of the current label
export function updateText(text) {
  if (currentHandle) {
    currentHandle.setText(text);
    renderWindow.render();
  }
}

// Update the font size of the current label
export function updateFontSize(size) {
  if (currentHandle) {
    handleTextProps.set(currentHandle, {
      ...handleTextProps.get(currentHandle),
      fontSize: size,
    });
    currentHandle.getWidgetState().modified();
  }
}

// Update the color of the current label
export function updateColor(color) {
  if (currentHandle) {
    handleTextProps.set(currentHandle, {
      ...handleTextProps.get(currentHandle),
      fontColor: color,
    });
    currentHandle.getWidgetState().modified();
  }
}

// Get the current handle (for debugging or advanced usage)
export function getCurrentHandle() {
  return currentHandle;
}

// Get the widget manager (for advanced usage)
export function getWidgetManager() {
  return widgetManager;
}

// Setup SVG representation for a label widget
function setupSVG(viewWidget) {
  return bindSVGRepresentation(renderer, viewWidget.getWidgetState(), {
    mapState(widgetState, { size }) {
      const textState = widgetState.getText();
      const text = textState.getText();
      const origin = textState.getOrigin();
      if (origin && textState.getVisible()) {
        const coords = computeWorldToDisplay(renderer, ...origin);
        const position = [coords[0], size[1] - coords[1]];
        return {
          text,
          position,
          active: textState.getActive(),
        };
      }
      return null;
    },
    render(data, h) {
      if (data) {
        const nodes = [];
        const { text, position, active } = data;
        const { fontColor, fontSize } = handleTextProps.get(viewWidget);

        if (text.trim().length === 0) {
          nodes.push(
            h('circle', {
              key: 'circle',
              attrs: {
                r: 5,
                stroke: 'red',
                fill: 'red',
                cx: position[0],
                cy: position[1],
              },
            })
          );
        }

        const lines = text.split('\n');
        const dys = multiLineTextCalculator(
          lines.length,
          fontSize,
          VerticalTextAlignment.MIDDLE
        );
        nodes.push(
          ...lines.map((line, index) =>
            makeListenableSVGNode(
              h(
                'text',
                {
                  key: index,
                  attrs: {
                    x: position[0],
                    y: position[1],
                    dx: 12,
                    dy: dys[index],
                    fill: fontColor,
                    'font-size': fontSize,
                    'text-anchor': 'middle',
                    'font-weight': active ? 'bold' : 'normal',
                  },
                  style: {
                    cursor: 'pointer',
                  },
                  on: {
                    pointerenter() {
                      widgetManager.disablePicking();
                      viewWidget.activateHandle({
                        selectedState: viewWidget.getWidgetState().getText(),
                      });
                    },
                    pointerleave: () => {
                      viewWidget.deactivateAllHandles();
                      widgetManager.enablePicking();
                    },
                  },
                },
                line
              )
            )
          )
        );

        return nodes;
      }
      return [];
    },
  });
}

// Add a new label to the scene
export function addLabel() {
  if (!widgetManager) {
    logInfo('Widget manager not initialized');
    return null;
  }

  const widget = vtkLabelWidget.newInstance();
  const handle = widgetManager.addWidget(widget);
  widgetManager.grabFocus(widget);

  const textProps = {
    fontSize: 32,
    fontColor: 'white',
  };
  handleTextProps.set(handle, textProps);
  svgCleanupCallbacks.set(handle, setupSVG(handle));

  // Update control panel when a label is selected
  handle.onStartInteractionEvent(() => {
    currentHandle = handle;
    const txtInput = document.getElementById('txtIpt');
    const fontSizeInput = document.getElementById('fontSize');
    const colorInput = document.getElementById('color');
    
    if (txtInput) txtInput.value = currentHandle.getText() || '';
    if (fontSizeInput) fontSizeInput.value = textProps.fontSize;
    if (colorInput) colorInput.value = textProps.fontColor;
  });

  logInfo('New label added to scene');
  return handle;
}

// Delete the currently selected label
export function deleteLabel() {
  if (currentHandle) {
    currentHandle.reset();
    widgetManager.removeWidget(currentHandle);
    svgCleanupCallbacks.get(currentHandle)();
    svgCleanupCallbacks.delete(currentHandle);
    handleTextProps.delete(currentHandle);
    currentHandle = null;
    logInfo('Label deleted');
  }
}

// Update the text of the current label
export function updateText(text) {
  if (currentHandle) {
    currentHandle.setText(text);
    renderWindow.render();
  }
}

// Update the font size of the current label
export function updateFontSize(size) {
  if (currentHandle) {
    handleTextProps.set(currentHandle, {
      ...handleTextProps.get(currentHandle),
      fontSize: size,
    });
    currentHandle.getWidgetState().modified();
  }
}

// Update the color of the current label
export function updateColor(color) {
  if (currentHandle) {
    handleTextProps.set(currentHandle, {
      ...handleTextProps.get(currentHandle),
      fontColor: color,
    });
    currentHandle.getWidgetState().modified();
  }
}

// Get the current handle (for debugging or advanced usage)
export function getCurrentHandle() {
  return currentHandle;
}

// Get the widget manager (for advanced usage)
export function getWidgetManager() {
  return widgetManager;
}