// ----------------------------------------------------------------------------
// Text Chat System (Yjs-based)
// ----------------------------------------------------------------------------

import { ydoc } from "./yjsSetup.js";
import { getUserId, getUserName, getUserColor } from "./userManagement.js";

class TextChat {
  constructor() {
    this.messages = null;
    this.messageListeners = [];
    this.clearListeners = [];
    this.maxMessages = 100;
  }

  initialize() {
    this.messages = ydoc.getArray("chatMessages");

    // Listen for new messages AND deletions
    this.messages.observe((event) => {
      // New messages added
      event.changes.added.forEach((item) => {
        const message = item.content.getContent()[0];
        this.notifyListeners(message);
      });

      // Messages deleted (for clear)
      if (event.changes.delta.length > 0) {
        const hasDelete = event.changes.delta.some((change) => change.delete);
        if (hasDelete && this.messages.length === 0) {
          // Chat was cleared
          this.notifyClearListeners();
        }
      }
    });

    console.log("💬 Text chat initialized");
  }

  sendMessage(text) {
    if (!text || !text.trim()) {
      return;
    }

    const message = {
      id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      userId: getUserId(),
      userName: getUserName(),
      userColor: getUserColor(getUserId()),
      text: text.trim(),
      timestamp: Date.now(),
    };

    this.messages.push([message]);

    if (this.messages.length > this.maxMessages) {
      this.messages.delete(0, this.messages.length - this.maxMessages);
    }

    return message;
  }

  getMessages() {
    if (!this.messages) return [];
    return this.messages.toArray();
  }

  getRecentMessages(count = 50) {
    const allMessages = this.getMessages();
    return allMessages.slice(-count);
  }

  clearMessages() {
    if (this.messages) {
      this.messages.delete(0, this.messages.length);
    }
  }

  onMessage(callback) {
    this.messageListeners.push(callback);
  }

  onClear(callback) {
    this.clearListeners.push(callback);
  }

  notifyListeners(message) {
    this.messageListeners.forEach((callback) => {
      try {
        callback(message);
      } catch (error) {
        console.error("Error in message listener:", error);
      }
    });
  }

  notifyClearListeners() {
    this.clearListeners.forEach((callback) => {
      try {
        callback();
      } catch (error) {
        console.error("Error in clear listener:", error);
      }
    });
  }
}

export const textChat = new TextChat();
