// Logging System
import * as tf from '@tensorflow/tfjs';

let logContainer = null;
let logMessages = [];
const MAX_LOG_MESSAGES = 100;

export function initializeLogging() {
  // Create log container
  logContainer = document.createElement('div');
  logContainer.id = 'log-container';
  logContainer.style.cssText = `
    position: fixed;
    top: 10px;
    right: 10px;
    width: 400px;
    max-height: 400px;
    background: rgba(0, 0, 0, 0.9);
    color: #ffffff;
    font-family: 'Courier New', monospace;
    font-size: 11px;
    padding: 10px;
    border-radius: 5px;
    border: 1px solid #333;
    overflow-y: auto;
    z-index: 1000;
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.3);
    display: block;
  `;
  
  // Add toggle button
  const toggleButton = document.createElement('button');
  toggleButton.textContent = 'Hide Logs';
  toggleButton.style.cssText = `
    position: fixed;
    top: 10px;
    right: calc(10px + 400px + 10px);
    background: #f44336;
    color: white;
    border: none;
    padding: 8px 12px;
    border-radius: 4px;
    font-size: 12px;
    cursor: pointer;
    z-index: 1001;
    width: 100px;
  `;
  
  toggleButton.addEventListener('click', () => {
    const isVisible = logContainer.style.display !== 'none';
    logContainer.style.display = isVisible ? 'none' : 'block';
    toggleButton.textContent = isVisible ? 'Show Logs' : 'Hide Logs';
    toggleButton.style.background = isVisible ? '#4CAF50' : '#f44336';
  });
  
  // Add clear button
  const clearButton = document.createElement('button');
  clearButton.textContent = 'Clear';
  clearButton.style.cssText = `
    position: fixed;
    top: 50px;
    right: calc(10px + 400px + 10px);
    background: #ff9800;
    color: white;
    border: none;
    padding: 8px 12px;
    border-radius: 4px;
    font-size: 12px;
    cursor: pointer;
    z-index: 1001;
    width:80px;
  `;
  
  clearButton.addEventListener('click', () => {
    if (logContainer) {
      logContainer.innerHTML = '';
      logMessages = [];
      logMessage('Logs cleared', 'info');
    }
  });
  
  document.body.appendChild(logContainer);
  document.body.appendChild(toggleButton);
  document.body.appendChild(clearButton);
}

export function logMessage(message, type = 'info') {
  console.log(message);
  
  if (!logContainer) return;
  
  const timestamp = new Date().toLocaleTimeString();
  const logEntry = `[${timestamp}] ${message}`;
  
  const colors = {
    info: '#ffffff',
    success: '#4CAF50',
    warning: '#ff9800',
    error: '#f44336',
    progress: '#2196F3'
  };
  
  const logElement = document.createElement('div');
  logElement.style.cssText = `
    color: ${colors[type] || colors.info};
    margin-bottom: 3px;
    line-height: 1.3;
    word-wrap: break-word;
  `;
  logElement.textContent = logEntry;
  
  logContainer.appendChild(logElement);
  logMessages.push(logElement);
  
  if (logMessages.length > MAX_LOG_MESSAGES) {
    const oldMessage = logMessages.shift();
    if (oldMessage && oldMessage.parentNode) {
      oldMessage.parentNode.removeChild(oldMessage);
    }
  }
  
  logContainer.scrollTop = logContainer.scrollHeight;
  
  if (type === 'error' || type === 'warning') {
    logContainer.style.display = 'block';
  }
}

export function logInfo(message) {
  logMessage(message, 'info');
}

export function logSuccess(message) {
  logMessage(message, 'success');
}

export function logWarning(message) {
  logMessage(message, 'warning');
}

export function logError(message) {
  logMessage(message, 'error');
}

export function logProgress(message) {
  logMessage(message, 'progress');
}

export function logMemoryUsage(context = '') {
  try {
    const tfMemory = tf.memory();
    const jsMemory = performance.memory;
    
    logProgress(`Memory ${context}:`);
    logProgress(`  TF.js: ${tfMemory.numTensors} tensors, ${(tfMemory.numBytes / 1024 / 1024).toFixed(2)}MB`);
    
    if (jsMemory) {
      const usedMB = Math.round(jsMemory.usedJSHeapSize / 1024 / 1024);
      const totalMB = Math.round(jsMemory.totalJSHeapSize / 1024 / 1024);
      const limitMB = Math.round(jsMemory.jsHeapSizeLimit / 1024 / 1024);
      logProgress(`  JS Heap: ${usedMB}MB used / ${totalMB}MB allocated (limit: ${limitMB}MB)`);
      
      if (usedMB / limitMB > 0.8) {
        logWarning(`High memory usage: ${((usedMB / limitMB) * 100).toFixed(1)}% of limit`);
      }
    }
    
    if (tfMemory.numTensors > 50) {
      logWarning(`High tensor count: ${tfMemory.numTensors} tensors active`);
    }
  } catch (error) {
    logWarning(`Could not get memory info: ${error.message}`);
  }
}

export function cleanupTensors() {
  try {
    const beforeMemory = tf.memory();
    tf.dispose();
    const afterMemory = tf.memory();
    
    const tensorDiff = beforeMemory.numTensors - afterMemory.numTensors;
    const memoryDiff = (beforeMemory.numBytes - afterMemory.numBytes) / 1024 / 1024;
    
    if (tensorDiff > 0) {
      logSuccess(`Cleanup freed ${tensorDiff} tensors and ${memoryDiff.toFixed(2)}MB`);
    }
    
    if (window.gc) {
      window.gc();
      logProgress('JavaScript garbage collection triggered');
    }
  } catch (error) {
    logWarning(`Cleanup error: ${error.message}`);
  }
}