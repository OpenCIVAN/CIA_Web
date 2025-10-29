// ----------------------------------------------------------------------------
// Voice Chat Controls - Integrated with people panel
// ----------------------------------------------------------------------------

import { voiceChat } from '../collaboration/voiceChat.js';
import { getUserName } from '../collaboration/userManagement.js';
import { updateVoiceStatus } from './peopleControls.js';

let voiceToggleBtn = null;

export function initializeVoiceChatControls(roomName) {
  voiceToggleBtn = document.getElementById('voiceToggleBtn');
  
  if (!voiceToggleBtn) {
    console.error("Voice toggle button not found");
    return;
  }

  voiceToggleBtn.addEventListener('click', async () => {
    if (!voiceChat.isConnected) {
      try {
        // Disable button while connecting
        voiceToggleBtn.disabled = true;
        voiceToggleBtn.textContent = "Connecting...";
        
        const userName = getUserName();
        await voiceChat.connect(roomName, userName);
        
        updateButtonState(true);
        updateVoiceStatus();
        console.log("✅ Voice chat connected");
      } catch (error) {
        console.error("❌ Failed to join voice chat:", error);
        alert("Failed to connect to voice chat. Make sure LiveKit and token server are running.");
        updateButtonState(false);
      } finally {
        // Re-enable button
        voiceToggleBtn.disabled = false;
      }
    } else {
      voiceChat.disconnect();
      updateButtonState(false);
      updateVoiceStatus();
      console.log("✅ Voice chat disconnected");
    }
  });

  // Update voice status periodically
  setInterval(() => {
    if (voiceChat.isConnected) {
      updateVoiceStatus();
    }
  }, 1000);

  console.log("🎤 Voice chat controls initialized");
}

function updateButtonState(connected) {
  if (!voiceToggleBtn) return;
  
  if (connected) {
    voiceToggleBtn.textContent = "Leave Voice Chat";
    voiceToggleBtn.classList.add('leave');
  } else {
    voiceToggleBtn.textContent = "Join Voice Chat";
    voiceToggleBtn.classList.remove('leave');
  }
}

// Keyboard shortcut for mute (M key)
if (typeof document !== "undefined") {
  document.addEventListener("keydown", (e) => {
    // Only trigger if not typing in an input
    if ((e.key === "m" || e.key === "M") && !e.target.matches('input, textarea')) {
      if (voiceChat.isConnected) {
        e.preventDefault();
        voiceChat.toggleMute();
        updateVoiceStatus();
        console.log("🎤 Mute toggled via keyboard (M)");
      }
    }
  });
}