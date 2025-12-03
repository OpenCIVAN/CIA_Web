// src/ui/react/components/panels/RightPanel/tabs/ChatTab.jsx
// Chat tab for the unified right panel - Connected to Y.js for real-time sync
//
// Features:
// - Room chat synced via Y.js (persisted to PostgreSQL)
// - Message bubbles with avatars
// - System messages for annotations/events
// - Message input with send on Enter

import React, { useState, useCallback, useRef, useEffect } from 'react';
import {
    MessageSquare,
    Send,
    Smile,
    Paperclip,
    AtSign,
    Globe,
    Loader,
    Trash2,
} from 'lucide-react';

import { sync as log } from "@Utils/logger.js";
import { textChat } from "@Collaboration/communication/textChat.js";
import { getUserId, getUserName, getUserColor } from "@Collaboration/presence/userManagement.js";
import { provider } from "@Collaboration/yjs/yjsSetup.js";

import './ChatTab.scss';

// =============================================================================
// MESSAGE BUBBLE
// =============================================================================

function MessageBubble({ message, currentUserId, onDelete }) {
    const isMe = message.userId === currentUserId;
    const isSystem = message.isSystem;

    if (isSystem) {
        return (
            <div className="message message--system">
                {message.text}
            </div>
        );
    }

    const initials = (message.userName || 'U').split(' ').map(n => n[0]).join('').slice(0, 2);
    const time = new Date(message.timestamp).toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit'
    });
    const userColor = message.userColor || '#2196F3';

    return (
        <div className={`message ${isMe ? 'message--me' : ''}`}>
            <div
                className="message__avatar"
                style={{ '--avatar-color': userColor }}
            >
                {initials}
            </div>

            <div className="message__content">
                {!isMe && (
                    <span className="message__user" style={{ color: userColor }}>
                        {message.userName}
                    </span>
                )}
                <div className="message__bubble">
                    {message.text}
                </div>
                <span className="message__time">{time}</span>
            </div>

            {isMe && (
                <button
                    className="message__delete"
                    onClick={() => onDelete(message.id)}
                    title="Delete message"
                >
                    <Trash2 size={12} />
                </button>
            )}
        </div>
    );
}

// =============================================================================
// MESSAGE INPUT
// =============================================================================

function MessageInput({ onSend, disabled }) {
    const [message, setMessage] = useState('');
    const textareaRef = useRef(null);

    const handleSend = () => {
        if (message.trim() && !disabled) {
            onSend(message);
            setMessage('');
        }
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    return (
        <div className="chat-input">
            <div className="chat-input__wrapper">
                <button className="chat-input__btn" disabled={disabled}>
                    <Paperclip size={16} />
                </button>

                <textarea
                    ref={textareaRef}
                    className="chat-input__textarea"
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder={disabled ? "Connecting..." : "Type a message..."}
                    rows={1}
                    disabled={disabled}
                />

                <button className="chat-input__btn" disabled={disabled}>
                    <AtSign size={16} />
                </button>

                <button className="chat-input__btn" disabled={disabled}>
                    <Smile size={16} />
                </button>

                <button
                    className={`chat-input__send ${message.trim() && !disabled ? 'chat-input__send--active' : ''}`}
                    onClick={handleSend}
                    disabled={!message.trim() || disabled}
                >
                    <Send size={14} />
                </button>
            </div>
        </div>
    );
}

// =============================================================================
// MAIN COMPONENT
// =============================================================================

export function ChatPanelContent({ workspaceId }) {
    const [messages, setMessages] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isSynced, setIsSynced] = useState(false);
    const messagesEndRef = useRef(null);
    const currentUserId = getUserId();

    // Scroll to bottom when messages change
    const scrollToBottom = useCallback(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, []);

    // Refresh messages from textChat
    const refreshMessages = useCallback(() => {
        const allMessages = textChat.getMessages();
        log.debug('Chat refreshing messages, count:', allMessages.length);
        setMessages([...allMessages]);
        setTimeout(scrollToBottom, 100);
    }, [scrollToBottom]);

    // Initialize chat and set up listeners
    useEffect(() => {
        // Initialize the textChat system
        textChat.initialize();

        // Handle new messages
        const handleNewMessage = (message) => {
            log.debug('Chat: New message received:', message.userName);
            setMessages([...textChat.getMessages()]);
            setTimeout(scrollToBottom, 50);
        };

        // Handle message deletion
        const handleDelete = () => {
            log.debug('Chat: Message deleted');
            setMessages([...textChat.getMessages()]);
        };

        // Subscribe to textChat events
        textChat.onMessage(handleNewMessage);
        textChat.onDelete(handleDelete);

        // Wait for Y.js to sync
        let syncTimeout;

        const handleSync = (synced) => {
            if (synced) {
                log.info('Chat: Y.js synced, loading messages...');
                clearTimeout(syncTimeout);
                setIsSynced(true);
                setTimeout(() => {
                    refreshMessages();
                    setIsLoading(false);
                }, 500);
            }
        };

        // Check if already synced
        try {
            provider.on('sync', handleSync);

            // If provider is already synced, trigger immediately
            if (provider.synced) {
                handleSync(true);
            }
        } catch (e) {
            log.warn('Chat: Provider not ready yet, will wait for sync');
        }

        // Fallback timeout
        syncTimeout = setTimeout(() => {
            log.debug('Chat: Sync timeout, loading messages anyway');
            refreshMessages();
            setIsLoading(false);
        }, 3000);

        // Cleanup
        return () => {
            try {
                provider.off('sync', handleSync);
            } catch (e) {
                // Provider may not be available
            }
            clearTimeout(syncTimeout);
            textChat.offMessage(handleNewMessage);
            textChat.offDelete(handleDelete);
        };
    }, [refreshMessages, scrollToBottom]);

    // Handle sending a message
    const handleSend = useCallback((text) => {
        try {
            textChat.sendMessage(text);
            log.debug('Chat: Message sent:', text.substring(0, 50));
            // Messages will update via the onMessage callback
        } catch (error) {
            log.error('Chat: Error sending message:', error);
        }
    }, []);

    // Handle deleting a message
    const handleDelete = useCallback((messageId) => {
        if (confirm('Delete this message for everyone?')) {
            textChat.deleteMessage(messageId);
        }
    }, []);

    return (
        <div className="chat-tab">
            {/* Header */}
            <div className="panel-header">
                <MessageSquare size={14} className="panel-header__icon file-icon--blue" />
                <span className="panel-header__title">Chat</span>
                <div className="panel-header__status">
                    {isLoading ? (
                        <span className="chat-status chat-status--loading">
                            <Loader size={12} className="spin" />
                            Syncing...
                        </span>
                    ) : isSynced ? (
                        <span className="chat-status chat-status--connected">
                            <Globe size={12} />
                            Connected
                        </span>
                    ) : (
                        <span className="chat-status chat-status--offline">
                            Offline
                        </span>
                    )}
                </div>
            </div>

            {/* Room indicator */}
            <div className="chat-tab__room-indicator">
                <Globe size={12} />
                <span>Room Chat</span>
                <span className="chat-tab__message-count">{messages.length} messages</span>
            </div>

            {/* Messages */}
            <div className="chat-tab__messages">
                {isLoading ? (
                    <div className="chat-tab__loading">
                        <Loader size={24} className="spin" />
                        <span>Loading messages...</span>
                    </div>
                ) : messages.length === 0 ? (
                    <div className="chat-tab__empty">
                        <MessageSquare size={32} strokeWidth={1} />
                        <span>No messages yet</span>
                        <span className="chat-tab__empty-hint">Start the conversation!</span>
                    </div>
                ) : (
                    messages.map(msg => (
                        <MessageBubble
                            key={msg.id}
                            message={msg}
                            currentUserId={currentUserId}
                            onDelete={handleDelete}
                        />
                    ))
                )}
                <div ref={messagesEndRef} />
            </div>

            {/* Message Input */}
            <MessageInput onSend={handleSend} disabled={isLoading} />
        </div>
    );
}

export default ChatPanelContent;