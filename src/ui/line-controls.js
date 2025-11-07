// Line Widget UI Controls
import { addLineWidget, deleteAllLineWidgets } from './line-widget.js';
import { logSuccess, logInfo } from '../utils/logging.js';

export function setupLineControls() {
  logInfo('Setting up line widget controls...');
  
  // Add line button
  const addLineBtn = document.querySelector('#addLine');
  if (addLineBtn) {
    addLineBtn.addEventListener('click', () => {
      addLineWidget();
    });
    logInfo('Add line button connected');
  }

  // Delete all lines button
  const deleteAllBtn = document.querySelector('#deleteAllLines');
  if (deleteAllBtn) {
    deleteAllBtn.addEventListener('click', () => {
      if (confirm('Delete all line measurements?')) {
        deleteAllLineWidgets();
      }
    });
    logInfo('Delete all lines button connected');
  }

  logSuccess('Line widget controls initialized');
}