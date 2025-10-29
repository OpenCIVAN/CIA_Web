import { MAX_LOG_MESSAGES, LOG_COLORS } from "../config/constants.js";

// ----------------------------------------------------------------------------
// Logging System - Uses #logsContent from HTML
// ----------------------------------------------------------------------------

let logContainer = null;
let logMessages = [];

export function initializeLogging() {
  logContainer = document.getElementById("logsContent");
  
  if (!logContainer) {
    console.warn("Logs content not found in HTML");
    return;
  }

  // Listen for clear event
  window.addEventListener('clearLogs', () => {
    if (logContainer) {
      logContainer.innerHTML = "";
      logMessages = [];
      logMessage("Logs cleared", "info");
    }
  });

  console.log("✅ Logging system initialized");
}

export function logMessage(message, type = "info") {
  console.log(message);

  if (!logContainer) return;

  const timestamp = new Date().toLocaleTimeString();
  const logEntry = `[${timestamp}] ${message}`;

  const logElement = document.createElement("div");
  logElement.className = `log-entry log-${type}`;
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

  // Auto-expand logs for important messages
  if (type === "error" || type === "warning") {
    const logsPanel = document.getElementById('logsPanel');
    if (logsPanel && !logsPanel.classList.contains('expanded')) {
      logsPanel.classList.add('expanded');
      document.getElementById('toggleLogsBtn').textContent = 'Collapse';
    }
  }
}

export function logInfo(message) {
  logMessage(message, "info");
}

export function logSuccess(message) {
  logMessage(message, "success");
}

export function logWarning(message) {
  logMessage(message, "warning");
}

export function logError(message) {
  logMessage(message, "error");
}

export function logProgress(message) {
  logMessage(message, "progress");
}