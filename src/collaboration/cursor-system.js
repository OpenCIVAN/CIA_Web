// Collaborative Cursor System
import { ydoc, yUserNames } from './yjs-setup.js';
import { logInfo, logSuccess, logProgress, logWarning, logError } from '../utils/logging.js';
import { fullScreenRenderer } from '../scene/scene-setup.js';

// Export yCursors since it's used by yjs-setup.js
export const yCursors = ydoc.getMap('cursors');

// Generate unique user ID
export const userId = 'user_' + Math.random().toString(36).substr(2, 9);
const userColors = [
  '#ff4444', '#44ff44', '#4444ff', '#ffff44', 
  '#ff44ff', '#44ffff', '#ff8800', '#8800ff',
  '#00ff88', '#ff0088', '#0088ff', '#88ff00'
];

// User name management
export let userName = localStorage.getItem('vtk-username') || '';
const activeCursors = new Map();
let isLocalMouseMove = false;
let lastMousePosition = { x: 0, y: 0, timestamp: 0 };
let mouseMoveTimeout = null;
let toggleHideCursor = false;

export function getUserColor(userId) {
  const hash = userId.split('').reduce((a, b) => {
    a = ((a << 5) - a) + b.charCodeAt(0);
    return a & a;
  }, 0);
  return userColors[Math.abs(hash) % userColors.length];
}

function createCursorElement(userId, color, displayName) {
  try {
    const cursor = document.createElement('div');
    cursor.id = `cursor-${userId}`;
    cursor.style.cssText = `
      position: fixed;
      width: 20px;
      height: 20px;
      background: ${color};
      border: 2px solid white;
      border-radius: 50%;
      pointer-events: none;
      z-index: 10000;
      transform: translate(-50%, -50%);
      transition: all 0.1s ease;
      box-shadow: 0 2px 4px rgba(0,0,0,0.3);
    `;
    
    const label = document.createElement('div');
    label.style.cssText = `
      position: absolute;
      top: 25px;
      left: 50%;
      transform: translateX(-50%);
      background: ${color};
      color: white;
      padding: 2px 6px;
      border-radius: 4px;
      font-size: 10px;
      font-family: Arial, sans-serif;
      white-space: nowrap;
      font-weight: bold;
      max-width: 120px;
      text-overflow: ellipsis;
      overflow: hidden;
    `;
    label.textContent = displayName || userId.replace('user_', 'User ');
    
    cursor.appendChild(label);
    
    if (document.body) {
      document.body.appendChild(cursor);
    } else {
      logError('Cannot create cursor: document.body not available');
      return null;
    }
    
    return cursor;
  } catch (error) {
    logError(`Failed to create cursor element for ${userId}: ${error.message}`);
    return null;
  }
}

async function showNameDialog() {
  return new Promise((resolve) => {
    const overlay = document.createElement('div');
    overlay.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100vw;
      height: 100vh;
      background: rgba(0, 0, 0, 0.7);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 10001;
      font-family: Arial, sans-serif;
    `;
    
    const dialog = document.createElement('div');
    dialog.style.cssText = `
      background: white;
      padding: 30px;
      border-radius: 12px;
      box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
      max-width: 400px;
      width: 90%;
      text-align: center;
    `;
    
    const title = document.createElement('h3');
    title.textContent = 'Set Your Display Name';
    title.style.cssText = 'margin: 0 0 15px 0; color: #333; font-size: 20px;';
    
    const subtitle = document.createElement('p');
    subtitle.textContent = 'This name will appear on your cursor for other users to see:';
    subtitle.style.cssText = 'margin: 0 0 20px 0; color: #666; font-size: 14px;';
    
    const input = document.createElement('input');
    input.type = 'text';
    input.placeholder = 'Enter your name...';
    input.value = userName;
    input.style.cssText = `
      width: 100%;
      padding: 12px;
      border: 2px solid #ddd;
      border-radius: 6px;
      font-size: 16px;
      box-sizing: border-box;
      margin-bottom: 20px;
    `;
    input.maxLength = 20;
    
    const buttonContainer = document.createElement('div');
    buttonContainer.style.cssText = 'display: flex; gap: 10px; justify-content: center;';
    
    const confirmButton = document.createElement('button');
    confirmButton.textContent = 'Confirm';
    confirmButton.style.cssText = `
      background: #4CAF50;
      color: white;
      border: none;
      padding: 10px 20px;
      border-radius: 6px;
      font-size: 16px;
      cursor: pointer;
      flex: 1;
    `;
    
    const skipButton = document.createElement('button');
    skipButton.textContent = 'Skip';
    skipButton.style.cssText = `
      background: #f44336;
      color: white;
      border: none;
      padding: 10px 20px;
      border-radius: 6px;
      font-size: 16px;
      cursor: pointer;
      flex: 1;
    `;
    
    function closeDialog(name) {
      document.body.removeChild(overlay);
      resolve(name);
    }
    
    confirmButton.addEventListener('click', () => {
      const name = input.value.trim();
      if (name) {
        closeDialog(name);
      } else {
        input.style.borderColor = '#f44336';
        input.placeholder = 'Please enter a name...';
      }
    });
    
    skipButton.addEventListener('click', () => {
      closeDialog('');
    });
    
    input.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        confirmButton.click();
      }
    });
    
    setTimeout(() => input.focus(), 100);
    
    buttonContainer.appendChild(confirmButton);
    buttonContainer.appendChild(skipButton);
    
    dialog.appendChild(title);
    dialog.appendChild(subtitle);
    dialog.appendChild(input);
    dialog.appendChild(buttonContainer);
    
    overlay.appendChild(dialog);
    document.body.appendChild(overlay);
  });
}

async function setupUserName() {
  if (!userName) {
    userName = await showNameDialog();
  }
  
  if (userName) {
    localStorage.setItem('vtk-username', userName);
    yUserNames.set(userId, userName);
    logInfo(`User name set to: ${userName}`);
  } else {
    userName = `User ${userId.slice(-4)}`;
    logInfo(`Using default name: ${userName}`);
  }
}

export function updateUserName(newName) {
  if (newName && newName.trim()) {
    userName = newName.trim();
    localStorage.setItem('vtk-username', userName);
    yUserNames.set(userId, userName);
    logInfo(`User name updated to: ${userName}`);
    
    const ownCursor = document.getElementById(`cursor-${userId}`);
    if (ownCursor) {
      const label = ownCursor.querySelector('div');
      if (label) {
        label.textContent = userName;
      }
    }
  }
}

function trackMouse() {
  document.addEventListener('mousemove', (event) => {
    if (isLocalMouseMove) return;
    
    const now = Date.now();
    lastMousePosition = {
      x: event.clientX,
      y: event.clientY,
      timestamp: now
    };
    
    if (mouseMoveTimeout) {
      clearTimeout(mouseMoveTimeout);
    }
    
    mouseMoveTimeout = setTimeout(() => {
      updateMyCursor();
    }, 50);
  });
  
  document.addEventListener('mouseleave', () => {
    hideMyCursor();
  });
  
  window.addEventListener('blur', () => {
    hideMyCursor();
  });
  
  window.addEventListener('focus', () => {
    if (lastMousePosition.timestamp > 0) {
      updateMyCursor();
    }
  });
}

export function updateMyCursor() {
  if (!lastMousePosition || lastMousePosition.timestamp === 0 || toggleHideCursor) return;
  
  yCursors.set(userId, {
    x: lastMousePosition.x,
    y: lastMousePosition.y,
    timestamp: lastMousePosition.timestamp,
    color: getUserColor(userId),
    active: true
  });
}

export function hideMyCursor() {
  yCursors.set(userId, {
    x: 0,
    y: 0,
    timestamp: Date.now(),
    color: getUserColor(userId),
    active: false
  });
}

function updateRemoteCursor(userId, data) {
  let cursorData = activeCursors.get(userId);
  let cursorElement = cursorData ? cursorData.element : null;
  
  const displayName = yUserNames.get(userId) || userId.replace('user_', 'User ');
  
  if (!cursorElement || !cursorElement.parentNode) {
    cursorElement = createCursorElement(userId, data.color, displayName);
    if (!cursorElement) {
      logError(`Failed to create cursor element for ${userId}`);
      return;
    }
    
    activeCursors.set(userId, {
      element: cursorElement,
      lastUpdate: data.timestamp,
      displayName: displayName
    });
  }
  
  const currentData = activeCursors.get(userId);
  if (currentData && currentData.displayName !== displayName) {
    const label = cursorElement.querySelector('div');
    if (label) {
      label.textContent = displayName;
    }
    currentData.displayName = displayName;
  }
  
  try {
    if (cursorElement && cursorElement.style) {
      cursorElement.style.left = data.x + 'px';
      cursorElement.style.top = data.y + 'px';
      cursorElement.style.display = 'block';
      
      const cursorInfo = activeCursors.get(userId);
      if (cursorInfo) {
        cursorInfo.lastUpdate = data.timestamp;
      }
      
      cursorElement.style.transform = 'translate(-50%, -50%) scale(1.2)';
      setTimeout(() => {
        if (cursorElement && cursorElement.parentNode && cursorElement.style) {
          cursorElement.style.transform = 'translate(-50%, -50%) scale(1)';
        }
      }, 150);
    }
  } catch (error) {
    logError(`Error updating cursor for ${userId}: ${error.message}`);
    removeCursor(userId);
  }
}

function hideCursor(userId) {
  try {
    const cursor = activeCursors.get(userId);
    if (cursor && cursor.element && cursor.element.style) {
      cursor.element.style.display = 'none';
    }
  } catch (error) {
    logWarning(`Error hiding cursor for ${userId}: ${error.message}`);
  }
}

function removeCursor(userId) {
  try {
    const cursor = activeCursors.get(userId);
    if (cursor && cursor.element) {
      if (cursor.element.parentNode) {
        cursor.element.parentNode.removeChild(cursor.element);
      }
      activeCursors.delete(userId);
    }
  } catch (error) {
    logWarning(`Error removing cursor for ${userId}: ${error.message}`);
  }
}

function setupCursorObserver() {
  yCursors.observe((event) => {
    try {
      event.changes.keys.forEach((change, key) => {
        if (key === userId) return;
        
        try {
          const cursorData = yCursors.get(key);
          if (!cursorData) {
            removeCursor(key);
            return;
          }
          
          if (!cursorData.active) {
            hideCursor(key);
            return;
          }
          
          if (typeof cursorData.x !== 'number' || typeof cursorData.y !== 'number') {
            logWarning(`Invalid cursor data for ${key}:`, cursorData);
            return;
          }
          
          updateRemoteCursor(key, cursorData);
        } catch (innerError) {
          logError(`Error processing cursor update for ${key}: ${innerError.message}`);
        }
      });
    } catch (error) {
      logError(`Error in cursor observer: ${error.message}`);
    }
  });
}

function setupCursorCleanup() {
  setInterval(() => {
    const now = Date.now();
    const STALE_THRESHOLD = 30000;
    
    activeCursors.forEach((cursor, userId) => {
      if (now - cursor.lastUpdate > STALE_THRESHOLD) {
        logProgress(`Removing stale cursor for ${userId}`);
        removeCursor(userId);
      }
    });
    
    const allCursors = yCursors.toJSON();
    Object.keys(allCursors).forEach(userId => {
      const cursorData = allCursors[userId];
      if (now - cursorData.timestamp > STALE_THRESHOLD) {
        yCursors.delete(userId);
        yUserNames.delete(userId);
      }
    });
  }, 30000);
}

export function addCursorControls() {
  const controlTable = document.querySelector('table');
  if (!controlTable) {
    logWarning('Control table not found, cannot add cursor controls');
    return;
  }
  
  // Name input row
  const nameRow = document.createElement('tr');
  const nameCell = document.createElement('td');
  
  const nameContainer = document.createElement('div');
  nameContainer.style.cssText = 'display: flex; gap: 5px; align-items: center;';
  
  const nameInput = document.createElement('input');
  nameInput.type = 'text';
  nameInput.placeholder = 'Your name...';
  nameInput.value = userName;
  nameInput.maxLength = 20;
  nameInput.style.cssText = 'flex: 1; padding: 6px; border: 1px solid #ccc; border-radius: 4px; font-size: 12px;';
  
  const nameButton = document.createElement('button');
  nameButton.textContent = 'Set';
  nameButton.style.cssText = 'background: #2196F3; color: white; border: none; padding: 6px 12px; border-radius: 4px; font-size: 12px; cursor: pointer;';
  
  nameButton.addEventListener('click', () => {
    const newName = nameInput.value.trim();
    if (newName) {
      updateUserName(newName);
      nameButton.textContent = '✓';
      nameButton.style.background = '#4CAF50';
      setTimeout(() => {
        nameButton.textContent = 'Set';
        nameButton.style.background = '#2196F3';
      }, 1000);
    }
  });
  
  nameInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
      nameButton.click();
    }
  });
  
  nameContainer.appendChild(nameInput);
  nameContainer.appendChild(nameButton);
  nameCell.appendChild(nameContainer);
  nameRow.appendChild(nameCell);
  controlTable.appendChild(nameRow);
  
  // Cursor toggle and count row
  const cursorRow = document.createElement('tr');
  const cursorCell = document.createElement('td');
  
  const cursorContainer = document.createElement('div');
  cursorContainer.style.cssText = 'display: flex; gap: 8px; align-items: center;';
  
  const cursorToggle = document.createElement('button');
  cursorToggle.textContent = 'Hide My Cursor';
  cursorToggle.style.cssText = 'flex: 1; background: #4CAF50; color: white; border: none; padding: 8px; border-radius: 4px; cursor: pointer;';
  
  let cursorVisible = true;
  cursorToggle.addEventListener('click', () => {
    cursorVisible = !cursorVisible;
    
    if (cursorVisible) {
      cursorToggle.textContent = 'Hide My Cursor';
      cursorToggle.style.background = '#4CAF50';
      toggleHideCursor = false;
      updateMyCursor();
    } else {
      cursorToggle.textContent = 'Show My Cursor';
      cursorToggle.style.background = '#f44336';
      toggleHideCursor = true;
      hideMyCursor();
    }
    
    logInfo(`Cursor visibility: ${cursorVisible ? 'visible' : 'hidden'}`);
  });
  
  const cursorCount = document.createElement('span');
  cursorCount.style.cssText = 'font-size: 12px; color: #666; font-weight: bold;';
  cursorCount.textContent = '0 users';
  
  cursorContainer.appendChild(cursorToggle);
  cursorContainer.appendChild(cursorCount);
  cursorCell.appendChild(cursorContainer);
  cursorRow.appendChild(cursorCell);
  controlTable.appendChild(cursorRow);
  
  // User list row
  const userListRow = document.createElement('tr');
  const userListCell = document.createElement('td');
  
  const userListContainer = document.createElement('div');
  userListContainer.style.cssText = `
    background: #f5f5f5;
    padding: 8px;
    border-radius: 4px;
    font-size: 11px;
    max-height: 80px;
    overflow-y: auto;
    border: 1px solid #ddd;
  `;
  
  const userListTitle = document.createElement('div');
  userListTitle.textContent = 'Active Users:';
  userListTitle.style.cssText = 'font-weight: bold; margin-bottom: 4px; color: #333;';
  
  const userList = document.createElement('div');
  userList.id = 'active-user-list';
  
  userListContainer.appendChild(userListTitle);
  userListContainer.appendChild(userList);
  userListCell.appendChild(userListContainer);
  userListRow.appendChild(userListCell);
  controlTable.appendChild(userListRow);
  
  // Update user list periodically
  setInterval(() => {
    const count = activeCursors.size;
    cursorCount.textContent = `${count} user${count === 1 ? '' : 's'}`;
    cursorCount.style.color = count > 0 ? '#4CAF50' : '#666';
    
    const userListDiv = document.getElementById('active-user-list');
    if (userListDiv) {
      userListDiv.innerHTML = '';
      
      if (count === 0) {
        userListDiv.textContent = 'No other users online';
        userListDiv.style.color = '#999';
        userListDiv.style.fontStyle = 'italic';
      } else {
        userListDiv.style.fontStyle = 'normal';
        activeCursors.forEach((cursor, userId) => {
          const userItem = document.createElement('div');
          const displayName = yUserNames.get(userId) || userId.replace('user_', 'User ');
          const userColor = getUserColor(userId);
          
          userItem.style.cssText = `
            display: flex;
            align-items: center;
            gap: 6px;
            margin-bottom: 2px;
            padding: 2px 4px;
            border-radius: 3px;
            background: rgba(0,0,0,0.05);
          `;
          
          const colorDot = document.createElement('div');
          colorDot.style.cssText = `
            width: 8px;
            height: 8px;
            border-radius: 50%;
            background: ${userColor};
            border: 1px solid white;
            box-shadow: 0 1px 2px rgba(0,0,0,0.2);
          `;
          
          const nameSpan = document.createElement('span');
          nameSpan.textContent = displayName;
          nameSpan.style.cssText = 'color: #333;';
          
          userItem.appendChild(colorDot);
          userItem.appendChild(nameSpan);
          userListDiv.appendChild(userItem);
        });
      }
    }
  }, 1000);
  
  logSuccess('Collaborative cursor controls added');
}

export function initializeCursorSystem() {
  try {
    logInfo(`Initializing collaborative cursors for user: ${userId}`);
    
    if (!ydoc || !yCursors) {
      logError('Yjs not properly initialized - cursor system cannot start');
      return false;
    }
    
    if (!document.body) {
      logError('Document not ready - deferring cursor system initialization');
      document.addEventListener('DOMContentLoaded', () => {
        initializeCursorSystem();
      });
      return false;
    }
    
    setupUserName();
    trackMouse();
    
    setTimeout(() => {
      try {
        addCursorControls();
      } catch (error) {
        logWarning(`Could not add cursor controls: ${error.message}`);
      }
    }, 1000);
    
    setupCursorObserver();
    setupCursorCleanup();
    
    setTimeout(() => {
      if (lastMousePosition.timestamp > 0) {
        updateMyCursor();
      }
    }, 2000);
    
    logSuccess('Collaborative cursor system initialized');
    logProgress(`Your cursor color: ${getUserColor(userId)}`);
    logProgress(`Your display name: ${userName || 'Default'}`);
    
    return true;
  } catch (error) {
    logError(`Failed to initialize cursor system: ${error.message}`);
    return false;
  }
}

// Cleanup on page unload
window.addEventListener('beforeunload', () => {
  hideMyCursor();
  if (yUserNames) {
    yUserNames.delete(userId);
  }
});