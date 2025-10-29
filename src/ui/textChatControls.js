// ----------------------------------------------------------------------------
// Text Chat Controls UI
// ----------------------------------------------------------------------------

import { textChat } from "../collaboration/textChat.js";
import { getUserId } from "../collaboration/userManagement.js";
import { logSuccess, logInfo } from "./logging.js";

export function addTextChatControls() {
  const controlTable = document.querySelector("table");

  if (!controlTable) {
    console.error("Control table not found");
    return;
  }

  // Chat Header Row
  const headerRow = document.createElement("tr");
  const headerCell = document.createElement("td");
  const headerContainer = document.createElement("div");
  headerContainer.style.cssText = `
    background: #FF9800; 
    color: white; 
    padding: 8px; 
    border-radius: 4px; 
    font-weight: bold; 
    text-align: center;
    margin-top: 10px;
  `;
  headerContainer.textContent = "💬 Text Chat";
  headerCell.appendChild(headerContainer);
  headerRow.appendChild(headerCell);
  controlTable.appendChild(headerRow);

  // Chat Messages Display Row
  const messagesRow = document.createElement("tr");
  const messagesCell = document.createElement("td");
  const messagesContainer = document.createElement("div");
  messagesContainer.id = "chat-messages-container";
  messagesContainer.style.cssText = `
    background: #f5f5f5;
    border: 1px solid #ddd;
    border-radius: 4px;
    padding: 8px;
    height: 200px;
    overflow-y: auto;
    font-size: 12px;
    scroll-behavior: smooth;
  `;

  const messagesList = document.createElement("div");
  messagesList.id = "chat-messages-list";

  messagesContainer.appendChild(messagesList);
  messagesCell.appendChild(messagesContainer);
  messagesRow.appendChild(messagesCell);
  controlTable.appendChild(messagesRow);

  // Chat Input Row
  const inputRow = document.createElement("tr");
  const inputCell = document.createElement("td");
  const inputContainer = document.createElement("div");
  inputContainer.style.cssText =
    "display: flex; gap: 5px; align-items: center;";

  const chatInput = document.createElement("input");
  chatInput.type = "text";
  chatInput.id = "chat-input";
  chatInput.placeholder = "Type a message...";
  chatInput.maxLength = 500;
  chatInput.style.cssText = `
    flex: 1;
    padding: 8px;
    border: 1px solid #ddd;
    border-radius: 4px;
    font-size: 12px;
  `;

  const sendButton = document.createElement("button");
  sendButton.textContent = "Send";
  sendButton.style.cssText = `
    background: #FF9800;
    color: white;
    border: none;
    padding: 8px 16px;
    border-radius: 4px;
    cursor: pointer;
    font-size: 12px;
    font-weight: 500;
  `;

  const sendMessage = () => {
    const text = chatInput.value.trim();
    if (text) {
      textChat.sendMessage(text);
      chatInput.value = "";
      chatInput.focus();
    }
  };

  sendButton.addEventListener("click", sendMessage);

  chatInput.addEventListener("keypress", (e) => {
    if (e.key === "Enter") {
      sendMessage();
    }
  });

  inputContainer.appendChild(chatInput);
  inputContainer.appendChild(sendButton);
  inputCell.appendChild(inputContainer);
  inputRow.appendChild(inputCell);
  controlTable.appendChild(inputRow);

  // Chat Controls Row (clear button)
  const controlsRow = document.createElement("tr");
  const controlsCell = document.createElement("td");
  const controlsContainer = document.createElement("div");
  controlsContainer.style.cssText =
    "display: flex; gap: 5px; justify-content: flex-end;";

  const clearButton = document.createElement("button");
  clearButton.textContent = "Clear Chat";
  clearButton.style.cssText = `
    background: #999;
    color: white;
    border: none;
    padding: 6px 12px;
    border-radius: 4px;
    cursor: pointer;
    font-size: 11px;
  `;

  clearButton.addEventListener("click", () => {
    if (confirm("Clear all chat messages for everyone?")) {
      textChat.clearMessages();
      // Also clear the UI immediately
      const messagesList = document.getElementById("chat-messages-list");
      if (messagesList) {
        messagesList.innerHTML = "";
      }
      logInfo("Chat cleared");
    }
  });

  controlsContainer.appendChild(clearButton);
  controlsCell.appendChild(controlsContainer);
  controlsRow.appendChild(controlsCell);
  controlTable.appendChild(controlsRow);

  // Initialize chat and load existing messages
  textChat.initialize();
  loadExistingMessages();

  // Listen for new messages
  textChat.onMessage((message) => {
    addMessageToUI(message);
  });

  // Listen for chat clears
  textChat.onClear(() => {
    const messagesList = document.getElementById("chat-messages-list");
    if (messagesList) {
      messagesList.innerHTML = "";
    }
    logInfo("Chat cleared by another user");
  });

  logSuccess("Text chat controls added");
}

function loadExistingMessages() {
  const messages = textChat.getRecentMessages(50);
  messages.forEach((message) => {
    addMessageToUI(message, false); // Don't scroll for existing messages
  });

  // Scroll to bottom after loading
  const container = document.getElementById("chat-messages-container");
  if (container) {
    container.scrollTop = container.scrollHeight;
  }
}

function addMessageToUI(message, autoScroll = true) {
  const messagesList = document.getElementById("chat-messages-list");
  if (!messagesList) return;

  const messageDiv = document.createElement("div");
  messageDiv.style.cssText = `
    margin-bottom: 8px;
    padding: 6px;
    border-radius: 4px;
    background: ${
      message.userId === getUserId() ? "rgba(33, 150, 243, 0.1)" : "white"
    };
    border-left: 3px solid ${message.userColor || "#999"};
  `;

  const headerDiv = document.createElement("div");
  headerDiv.style.cssText =
    "display: flex; justify-content: space-between; margin-bottom: 2px;";

  const nameSpan = document.createElement("span");
  nameSpan.textContent = message.userName || "Unknown";
  nameSpan.style.cssText = `
    font-weight: bold;
    color: ${message.userColor || "#333"};
    font-size: 11px;
  `;

  const timeSpan = document.createElement("span");
  timeSpan.textContent = formatTime(message.timestamp);
  timeSpan.style.cssText = "font-size: 10px; color: #999;";

  headerDiv.appendChild(nameSpan);
  headerDiv.appendChild(timeSpan);

  const textDiv = document.createElement("div");
  textDiv.textContent = message.text;
  textDiv.style.cssText =
    "color: #333; font-size: 12px; word-wrap: break-word;";

  messageDiv.appendChild(headerDiv);
  messageDiv.appendChild(textDiv);
  messagesList.appendChild(messageDiv);

  // Auto-scroll to bottom for new messages
  if (autoScroll) {
    const container = document.getElementById("chat-messages-container");
    if (container) {
      container.scrollTop = container.scrollHeight;
    }
  }

  // Limit displayed messages
  while (messagesList.children.length > 50) {
    messagesList.removeChild(messagesList.firstChild);
  }
}

function formatTime(timestamp) {
  const date = new Date(timestamp);
  const now = new Date();
  const isToday = date.toDateString() === now.toDateString();

  if (isToday) {
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  } else {
    return (
      date.toLocaleDateString([], { month: "short", day: "numeric" }) +
      " " +
      date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    );
  }
}
