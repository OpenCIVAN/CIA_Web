// Label Widget UI Controls
import { addLabel, deleteLabel, updateText, updateFontSize, updateColor } from './label-widget.js';
import { logSuccess } from '../utils/logging.js';

export function setupLabelControls() {
  // Add label button
  const addLabelBtn = document.querySelector('#addLabel');
  if (addLabelBtn) {
    addLabelBtn.addEventListener('click', () => {
      addLabel();
    });
  }

  // Delete label button
  const deleteLabelBtn = document.querySelector('#deleteLabel');
  if (deleteLabelBtn) {
    deleteLabelBtn.addEventListener('click', () => {
      deleteLabel();
    });
  }

  // Text input
  const txtInput = document.getElementById('txtIpt');
  if (txtInput) {
    txtInput.addEventListener('keyup', () => {
      updateText(txtInput.value);
    });
  }

  // Font size input
  const fontSizeInput = document.getElementById('fontSize');
  if (fontSizeInput) {
    fontSizeInput.addEventListener('input', () => {
      updateFontSize(fontSizeInput.value);
    });
  }

  // Color input
  const colorInput = document.getElementById('color');
  if (colorInput) {
    colorInput.addEventListener('input', () => {
      updateColor(colorInput.value);
    });
  }

  logSuccess('Label controls initialized');
}