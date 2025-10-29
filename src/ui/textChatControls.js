// ----------------------------------------------------------------------------
// Text Chat Controls - New compact layout with unread tracking
// ----------------------------------------------------------------------------

import { textChat } from '../collaboration/textChat.js';
import { getUserId } from '../collaboration/userManagement.js';

let messagesContainer = null;
let chatInput = null;
let sendButton = null;
let unreadCount = 0;
let unreadSection = null;
let unreadCountEl = null;
let collabPanel = null;

export function initializeTextChatControls() {
  messagesContainer = document.getElementById('chatMessages');
  chatInput = document.getElementById('chatInput');
  sendButton = document.getElementById('chatSendBtn');
  unreadSection = document.getElementById('unreadSection');
  unreadCountEl = document.getElementById('unreadCount');
  collabPanel = document.getElementById('collaborationPanel');
  
  if (!messagesContainer || !chatInput || !sendButton) {
    console.error("Chat UI elements not found");
    return;
  }

  // Setup send button
  sendButton.addEventListener('click', () => sendMessage());

  // Setup enter key
  chatInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  });

  // Listen for new messages
  textChat.onMessage((message) => {
    updateMessagesDisplay();
    
    // Track unread if panel is minimized and not own message
    if (collabPanel && collabPanel.classList.contains('minimized') && message.userId !== getUserId()) {
      unreadCount++;
      updateUnreadIndicator();
    }
  });

  // Clear unread when panel is opened
  const minimizeBtn = document.getElementById('minimizeCollabBtn');
  if (minimizeBtn) {
    minimizeBtn.addEventListener('click', () => {
      // When transitioning from minimized to open, clear unread
      if (collabPanel && collabPanel.classList.contains('minimized')) {
        setTimeout(() => {
          unreadCount = 0;
          updateUnreadIndicator();
        }, 100);
      }
    });
  }

  // Also clear unread when user starts typing (they've seen the panel)
  chatInput.addEventListener('focus', () => {
    if (!collabPanel || !collabPanel.classList.contains('minimized')) {
      unreadCount = 0;
      updateUnreadIndicator();
    }
  });

  // Listen for clear
  textChat.onClear(() => updateMessagesDisplay());

  // Initial display
  updateMessagesDisplay();

  console.log("💬 Text chat controls initialized");
}

function sendMessage() {
  const value = chatInput.value.trim();
  
  if (value) {
    try {
      textChat.sendMessage(value);
      chatInput.value = "";
      chatInput.focus(); // Keep focus for easy continuous chatting
    } catch (error) {
      console.error("Error sending message:", error);
      alert("Failed to send message. Check console for details.");
    }
  }
}

function updateMessagesDisplay() {
  if (!messagesContainer) return;

  messagesContainer.innerHTML = "";

  const messages = textChat.getMessages();

  if (messages.length === 0) {
    const emptyMsg = document.createElement("div");
    emptyMsg.textContent = "No messages yet. Start chatting!";
    emptyMsg.style.cssText = "color: #999; font-style: italic; padding: 20px; text-align: center;";
    messagesContainer.appendChild(emptyMsg);
    return;
  }

  const currentUserId = getUserId();

  messages.forEach((message) => {
    const messageDiv = document.createElement("div");
    messageDiv.className = "chat-message";
    messageDiv.style.borderLeftColor = message.userColor || '#2196F3';

    const timestamp = new Date(message.timestamp).toLocaleTimeString();
    const isOwnMessage = message.userId === currentUserId;
    
    messageDiv.innerHTML = `
      <div class="chat-message-header">
        ${escapeHtml(message.userName)} - ${timestamp}
        ${isOwnMessage ? '<span style="color: #4CAF50; font-size: 10px;"> (You)</span>' : ''}
      </div>
      <div class="chat-message-text">
        ${escapeHtml(message.text)}
      </div>
    `;

    // Add delete button for own messages
    if (isOwnMessage) {
      const deleteBtn = document.createElement("button");
      deleteBtn.className = "delete-message-btn";
      deleteBtn.textContent = "×";
      deleteBtn.title = "Delete this message";
      deleteBtn.addEventListener('click', () => {
        if (confirm("Delete this message for everyone?")) {
          textChat.deleteMessage(message.id);
        }
      });
      messageDiv.appendChild(deleteBtn);
    }

    messagesContainer.appendChild(messageDiv);
  });

  // Auto-scroll to bottom
  messagesContainer.scrollTop = messagesContainer.scrollHeight;
}

function updateUnreadIndicator() {
  if (!unreadSection || !unreadCountEl) return;

  if (unreadCount > 0 && collabPanel && collabPanel.classList.contains('minimized')) {
    unreadSection.style.display = 'flex';
    unreadCountEl.textContent = unreadCount;
  } else {
    unreadSection.style.display = 'none';
  }
}

function escapeHtml(text) {
  const div = document.createElement("div");
  div.textContent = text;
  return div.innerHTML;
}