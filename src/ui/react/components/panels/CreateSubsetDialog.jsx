// src/ui/react/components/panels/CreateSubsetDialog.jsx
// Dialog for creating a new subset from selection

import React, { useState, useCallback } from 'react';
import './CreateSubsetDialog.scss';

/**
 * CreateSubsetDialog - Modal for creating a new focus group
 */
export function CreateSubsetDialog({ selectedCount, onConfirm, onCancel }) {
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');

    const handleSubmit = useCallback(
        (e) => {
            e.preventDefault();
            const finalName = name.trim() || `Focus Group (${selectedCount} views)`;
            onConfirm(finalName, description.trim());
        },
        [name, description, selectedCount, onConfirm]
    );

    return (
        <div className="create-subset-dialog__overlay" onClick={onCancel}>
            <div
                className="create-subset-dialog"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="create-subset-dialog__header">
                    <h3>Create Focus Group</h3>
                    <button
                        className="create-subset-dialog__close"
                        onClick={onCancel}
                        aria-label="Close"
                    >
                        ×
                    </button>
                </div>

                <form onSubmit={handleSubmit}>
                    <div className="create-subset-dialog__body">
                        <div className="create-subset-dialog__selection-info">
                            <span className="create-subset-dialog__count">{selectedCount}</span>
                            <span className="create-subset-dialog__label">
                                view{selectedCount !== 1 ? 's' : ''} selected
                            </span>
                        </div>

                        <div className="create-subset-dialog__field">
                            <label htmlFor="subset-name">Name</label>
                            <input
                                id="subset-name"
                                type="text"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                placeholder={`Focus Group (${selectedCount} views)`}
                                autoFocus
                            />
                        </div>

                        <div className="create-subset-dialog__field">
                            <label htmlFor="subset-description">
                                Description <span className="optional">(optional)</span>
                            </label>
                            <textarea
                                id="subset-description"
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                placeholder="Research context, observations, or notes about this group..."
                                rows={3}
                            />
                        </div>

                        <div className="create-subset-dialog__hint">
                            <p>
                                Focus groups let you save a selection of views for deep analysis.
                                You can enter "focus mode" to view only these items.
                            </p>
                        </div>
                    </div>

                    <div className="create-subset-dialog__footer">
                        <button
                            type="button"
                            className="create-subset-dialog__btn create-subset-dialog__btn--secondary"
                            onClick={onCancel}
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="create-subset-dialog__btn create-subset-dialog__btn--primary"
                        >
                            Create Group
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

export default CreateSubsetDialog;