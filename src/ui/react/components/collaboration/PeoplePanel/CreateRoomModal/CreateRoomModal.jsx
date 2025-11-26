// src/ui/react/components/collaboration/PeoplePanel/CreateRoomModal.jsx
// Modal for creating breakout rooms with full configuration options

import React, { useState } from "react";
import {
    X,
    MessageSquare,
    Mic,
    Layout,
    Lock,
    Unlock,
    EyeOff,
    Clock,
    Save,
    Users,
    Check,
    AlertCircle
} from "lucide-react";

import { UserAvatar } from "@UI/react/components/collaboration/PeoplePanel";

import "./CreateRoomModal.scss";

// =============================================================================
// CONFIGURATION OPTIONS
// =============================================================================

const ACCESS_OPTIONS = [
    {
        id: "open",
        icon: Unlock,
        label: "Open",
        description: "Anyone can join"
    },
    {
        id: "invite",
        icon: Lock,
        label: "Invite Only",
        description: "Only invited users can join"
    },
    {
        id: "invisible",
        icon: EyeOff,
        label: "Invisible",
        description: "Hidden from non-members"
    },
];

const PERSISTENCE_OPTIONS = [
    {
        id: "session",
        icon: Clock,
        label: "Session",
        description: "Temporary - closes when empty"
    },
    {
        id: "persistent",
        icon: Save,
        label: "Persistent",
        description: "Stays open for future use"
    },
];

// =============================================================================
// MAIN COMPONENT
// =============================================================================

export function CreateRoomModal({ onClose, onCreate, availableUsers = [] }) {
    // ---------------------------------------------------------------------------
    // STATE
    // ---------------------------------------------------------------------------

    const [name, setName] = useState("");
    const [description, setDescription] = useState("");

    // Features
    const [hasText, setHasText] = useState(true);
    const [hasVoice, setHasVoice] = useState(false);
    const [hasWorkspace, setHasWorkspace] = useState(false);

    // Access & persistence
    const [access, setAccess] = useState("open");
    const [persistence, setPersistence] = useState("session");

    // Initial invites
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedUsers, setSelectedUsers] = useState([]);

    // Validation
    const [errors, setErrors] = useState({});

    // ---------------------------------------------------------------------------
    // VALIDATION
    // ---------------------------------------------------------------------------

    const validate = () => {
        const newErrors = {};

        if (!name.trim()) {
            newErrors.name = "Room name is required";
        } else if (name.length > 50) {
            newErrors.name = "Room name must be under 50 characters";
        }

        if (description.length > 200) {
            newErrors.description = "Description must be under 200 characters";
        }

        if (!hasText && !hasVoice && !hasWorkspace) {
            newErrors.features = "Select at least one feature";
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    // ---------------------------------------------------------------------------
    // HANDLERS
    // ---------------------------------------------------------------------------

    const handleSubmit = (e) => {
        e.preventDefault();

        if (!validate()) return;

        onCreate({
            name: name.trim(),
            description: description.trim(),
            hasText,
            hasVoice,
            hasWorkspace,
            access,
            isPersistent: persistence === "persistent",
            initialMembers: selectedUsers,
            autoJoin: true,
        });
    };

    const toggleUserSelection = (user) => {
        setSelectedUsers(prev => {
            const exists = prev.find(u => u.odbc === user.odbc || u.clientId === user.clientId);
            if (exists) {
                return prev.filter(u => u.odbc !== user.odbc && u.clientId !== user.clientId);
            }
            return [...prev, user];
        });
    };

    const isUserSelected = (user) => {
        return selectedUsers.some(u => u.odbc === user.odbc || u.clientId === user.clientId);
    };

    // Filter users for invite list
    const filteredUsers = availableUsers.filter(user => {
        if (user.isYou) return false; // Can't invite yourself
        if (!searchQuery) return true;
        return user.userName?.toLowerCase().includes(searchQuery.toLowerCase());
    });

    // ---------------------------------------------------------------------------
    // RENDER
    // ---------------------------------------------------------------------------

    return (
        <div className="create-room-modal__overlay" onClick={onClose}>
            <div className="create-room-modal" onClick={e => e.stopPropagation()}>
                {/* Header */}
                <div className="create-room-modal__header">
                    <h3>Create Breakout Room</h3>
                    <button className="create-room-modal__close" onClick={onClose}>
                        <X size={18} />
                    </button>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="create-room-modal__form">
                    {/* Name */}
                    <div className="create-room-modal__field">
                        <label htmlFor="room-name">Room Name *</label>
                        <input
                            id="room-name"
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="e.g., Data Analysis Team"
                            className={errors.name ? "error" : ""}
                            autoFocus
                        />
                        {errors.name && (
                            <span className="create-room-modal__error">
                                <AlertCircle size={12} /> {errors.name}
                            </span>
                        )}
                    </div>

                    {/* Description */}
                    <div className="create-room-modal__field">
                        <label htmlFor="room-desc">Description (optional)</label>
                        <input
                            id="room-desc"
                            type="text"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder="What's this room for?"
                            className={errors.description ? "error" : ""}
                        />
                        {errors.description && (
                            <span className="create-room-modal__error">
                                <AlertCircle size={12} /> {errors.description}
                            </span>
                        )}
                    </div>

                    {/* Features */}
                    <div className="create-room-modal__field">
                        <label>Features</label>
                        <div className="create-room-modal__toggles">
                            <button
                                type="button"
                                className={`create-room-modal__toggle ${hasText ? "active" : ""}`}
                                onClick={() => setHasText(!hasText)}
                            >
                                <MessageSquare size={16} />
                                <span>Text Chat</span>
                            </button>
                            <button
                                type="button"
                                className={`create-room-modal__toggle ${hasVoice ? "active" : ""}`}
                                onClick={() => setHasVoice(!hasVoice)}
                            >
                                <Mic size={16} />
                                <span>Voice</span>
                            </button>
                            <button
                                type="button"
                                className={`create-room-modal__toggle ${hasWorkspace ? "active" : ""}`}
                                onClick={() => setHasWorkspace(!hasWorkspace)}
                            >
                                <Layout size={16} />
                                <span>Workspace</span>
                            </button>
                        </div>
                        {errors.features && (
                            <span className="create-room-modal__error">
                                <AlertCircle size={12} /> {errors.features}
                            </span>
                        )}
                    </div>

                    {/* Access Level */}
                    <div className="create-room-modal__field">
                        <label>Access</label>
                        <div className="create-room-modal__options">
                            {ACCESS_OPTIONS.map(option => {
                                const IconComponent = option.icon;
                                return (
                                    <button
                                        key={option.id}
                                        type="button"
                                        className={`create-room-modal__option ${access === option.id ? "active" : ""}`}
                                        onClick={() => setAccess(option.id)}
                                    >
                                        <IconComponent size={16} />
                                        <div className="create-room-modal__option-text">
                                            <span className="create-room-modal__option-label">{option.label}</span>
                                            <span className="create-room-modal__option-desc">{option.description}</span>
                                        </div>
                                        {access === option.id && <Check size={16} className="create-room-modal__check" />}
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* Persistence */}
                    <div className="create-room-modal__field">
                        <label>Duration</label>
                        <div className="create-room-modal__options">
                            {PERSISTENCE_OPTIONS.map(option => {
                                const IconComponent = option.icon;
                                return (
                                    <button
                                        key={option.id}
                                        type="button"
                                        className={`create-room-modal__option ${persistence === option.id ? "active" : ""}`}
                                        onClick={() => setPersistence(option.id)}
                                    >
                                        <IconComponent size={16} />
                                        <div className="create-room-modal__option-text">
                                            <span className="create-room-modal__option-label">{option.label}</span>
                                            <span className="create-room-modal__option-desc">{option.description}</span>
                                        </div>
                                        {persistence === option.id && <Check size={16} className="create-room-modal__check" />}
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* Initial Invites (only show for non-open rooms) */}
                    {access !== "open" && (
                        <div className="create-room-modal__field">
                            <label>
                                <Users size={14} />
                                Invite Users
                            </label>
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="Search users to invite..."
                                className="create-room-modal__user-search"
                            />

                            {/* Selected users */}
                            {selectedUsers.length > 0 && (
                                <div className="create-room-modal__selected-users">
                                    {selectedUsers.map(user => (
                                        <div
                                            key={user.clientId || user.odbc}
                                            className="create-room-modal__selected-chip"
                                            onClick={() => toggleUserSelection(user)}
                                        >
                                            <UserAvatar userName={user.userName} color={user.userColor} size="xs" />
                                            <span>{user.userName}</span>
                                            <X size={12} />
                                        </div>
                                    ))}
                                </div>
                            )}

                            {/* User list */}
                            <div className="create-room-modal__user-list">
                                {filteredUsers.length === 0 ? (
                                    <div className="create-room-modal__no-users">
                                        {searchQuery ? "No users match your search" : "No users available to invite"}
                                    </div>
                                ) : (
                                    filteredUsers.map(user => (
                                        <button
                                            key={user.clientId || user.odbc}
                                            type="button"
                                            className={`create-room-modal__user-item ${isUserSelected(user) ? "selected" : ""}`}
                                            onClick={() => toggleUserSelection(user)}
                                        >
                                            <UserAvatar userName={user.userName} color={user.userColor} size="sm" />
                                            <span>{user.userName}</span>
                                            {isUserSelected(user) && <Check size={14} className="create-room-modal__user-check" />}
                                        </button>
                                    ))
                                )}
                            </div>
                        </div>
                    )}

                    {/* Actions */}
                    <div className="create-room-modal__actions">
                        <button
                            type="button"
                            className="create-room-modal__btn create-room-modal__btn--cancel"
                            onClick={onClose}
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="create-room-modal__btn create-room-modal__btn--create"
                        >
                            Create Room
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

export default CreateRoomModal;