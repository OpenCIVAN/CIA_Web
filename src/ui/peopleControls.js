// ----------------------------------------------------------------------------
// People Controls - Shows online users and voice status
// ----------------------------------------------------------------------------

import { getUserId, getUserName, getUserColor } from '../collaboration/userManagement.js';
import { yCursors } from '../collaboration/yjsSetup.js';
import { voiceChat } from '../collaboration/voiceChat.js';

let peopleList = null;
let onlineCountEl = null;
let voiceStatusEl = null;
let voiceStatusTextEl = null;
let quickMuteBtn = null;

const activePeople = new Map();

export function initializePeopleControls() {
  peopleList = document.getElementById('peopleList');
  onlineCountEl = document.getElementById('onlineCount');
  voiceStatusEl = document.getElementById('voiceStatus');
  voiceStatusTextEl = document.getElementById('voiceStatusText');
  quickMuteBtn = document.getElementById('quickMuteBtn');

  if (!peopleList) {
    console.error("People list not found");
    return;
  }

  // Listen for cursor updates (tracks online users)
  yCursors.observe(() => {
    updatePeopleList();
  });

  // Quick mute button
  if (quickMuteBtn) {
    quickMuteBtn.addEventListener('click', () => {
      voiceChat.toggleMute();
      updateVoiceStatus();
    });
  }

  // Initial update
  updatePeopleList();
  updateVoiceStatus();

  console.log("👥 People controls initialized");
}

function updatePeopleList() {
  if (!peopleList) return;

  peopleList.innerHTML = "";

  // Get all users from cursor data
  const users = [];
  yCursors.forEach((cursorData, userId) => {
    users.push({
      userId,
      userName: cursorData.name || 'Unknown',
      userColor: cursorData.color || '#888',
      isYou: userId === getUserId()
    });
  });

  // Sort: You first, then alphabetically
  users.sort((a, b) => {
    if (a.isYou) return -1;
    if (b.isYou) return 1;
    return a.userName.localeCompare(b.userName);
  });

  users.forEach(user => {
    const personDiv = document.createElement('div');
    personDiv.className = `person-item${user.isYou ? ' you' : ''}`;
    personDiv.style.borderLeftColor = user.userColor;
    personDiv.style.borderLeftWidth = '3px';
    personDiv.style.borderLeftStyle = 'solid';

    // Check if user is in voice chat (we'll enhance this later)
    const inVoice = false; // TODO: Track voice participants
    const statusIcon = inVoice ? '🎤' : '👤';

    personDiv.innerHTML = `
      <span class="person-status">${statusIcon}</span>
      <span>${escapeHtml(user.userName)}</span>
      ${user.isYou ? '<span style="color: #4CAF50; font-size: 10px; margin-left: auto;">(You)</span>' : ''}
    `;

    peopleList.appendChild(personDiv);
  });

  // Update count
  if (onlineCountEl) {
    onlineCountEl.textContent = users.length;
  }
}

export function updateVoiceStatus() {
  if (!voiceStatusEl || !voiceStatusTextEl) return;

  if (voiceChat.isConnected) {
    voiceStatusEl.classList.remove('not-connected');
    
    if (voiceChat.isMuted) {
      voiceStatusTextEl.textContent = '🔇 Muted';
      if (quickMuteBtn) {
        quickMuteBtn.textContent = 'U';
        quickMuteBtn.classList.add('muted');
        quickMuteBtn.style.display = 'block';
      }
    } else {
      voiceStatusTextEl.textContent = '🎤 In voice';
      if (quickMuteBtn) {
        quickMuteBtn.textContent = 'M';
        quickMuteBtn.classList.remove('muted');
        quickMuteBtn.style.display = 'block';
      }
    }
  } else {
    voiceStatusEl.classList.add('not-connected');
    voiceStatusTextEl.textContent = 'Not in voice';
    if (quickMuteBtn) {
      quickMuteBtn.style.display = 'none';
    }
  }
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}