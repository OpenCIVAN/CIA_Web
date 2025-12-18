// FloatingAnnotationCreator.jsx
// A floating menu for creating annotations with coordinate display and editing
//
// Features:
// - Shows current coordinates from raycasting
// - Allows editing position manually
// - Matches modern dark UI aesthetic
// - Can be positioned near the click location

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { MapPin, X, Target, Edit3, Check } from 'lucide-react';
import { createPortal } from 'react-dom';
import './FloatingAnnotationCreator.scss';

// Annotation type options
const ANNOTATION_TYPES = [
    { value: 'note', label: 'Note', color: '#4CAF50', icon: '📝' },
    { value: 'warning', label: 'Warning', color: '#FFA726', icon: '⚠️' },
    { value: 'info', label: 'Info', color: '#2196F3', icon: 'ℹ️' },
    { value: 'measurement', label: 'Measure', color: '#9C27B0', icon: '📏' },
];

export function FloatingAnnotationCreator({
    isOpen,
    onClose,
    onSubmit,
    position = { x: 0, y: 0, z: 0 },
    screenPosition = { x: 200, y: 200 },
    onPositionChange,
}) {
    const [text, setText] = useState('');
    const [type, setType] = useState('note');
    const [editingPosition, setEditingPosition] = useState(false);
    const [localPosition, setLocalPosition] = useState(position);
    const inputRef = useRef(null);
    const containerRef = useRef(null);

    // Update local position when prop changes
    useEffect(() => {
        setLocalPosition(position);
    }, [position]);

    // Focus input when opened
    useEffect(() => {
        if (isOpen && inputRef.current) {
            setTimeout(() => inputRef.current?.focus(), 100);
        }
    }, [isOpen]);

    // Handle submit
    const handleSubmit = useCallback(() => {
        if (!text.trim()) return;
        onSubmit(text, type, localPosition);
        setText('');
        setType('note');
        setEditingPosition(false);
    }, [text, type, localPosition, onSubmit]);

    // Handle position edit
    const handlePositionChange = useCallback((axis, value) => {
        const numValue = parseFloat(value) || 0;
        const newPosition = { ...localPosition, [axis]: numValue };
        setLocalPosition(newPosition);
        onPositionChange?.(newPosition);
    }, [localPosition, onPositionChange]);

    // Handle key events
    const handleKeyDown = useCallback((e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSubmit();
        } else if (e.key === 'Escape') {
            onClose();
        }
    }, [handleSubmit, onClose]);

    if (!isOpen) return null;

    // Calculate position to stay within viewport
    const left = Math.min(screenPosition.x, window.innerWidth - 320);
    const top = Math.min(screenPosition.y, window.innerHeight - 350);

    const content = (
        <div
            ref={containerRef}
            className="floating-annotation-creator"
            style={{
                left: `${Math.max(10, left)}px`,
                top: `${Math.max(10, top)}px`,
            }}
            onKeyDown={handleKeyDown}
        >
            {/* Header */}
            <div className="floating-annotation-creator__header">
                <MapPin size={14} className="floating-annotation-creator__icon" />
                <span>Add Annotation</span>
                <button
                    className="floating-annotation-creator__close"
                    onClick={onClose}
                    title="Cancel (Esc)"
                >
                    <X size={14} />
                </button>
            </div>

            {/* Position Display/Edit */}
            <div className="floating-annotation-creator__position">
                <div className="floating-annotation-creator__position-header">
                    <Target size={12} />
                    <span>Position</span>
                    <button
                        className="floating-annotation-creator__edit-btn"
                        onClick={() => setEditingPosition(!editingPosition)}
                        title={editingPosition ? 'Done editing' : 'Edit position'}
                    >
                        {editingPosition ? <Check size={12} /> : <Edit3 size={12} />}
                    </button>
                </div>

                {editingPosition ? (
                    <div className="floating-annotation-creator__position-edit">
                        <div className="floating-annotation-creator__coord-input">
                            <label>X</label>
                            <input
                                type="number"
                                value={localPosition.x?.toFixed(3) || '0'}
                                onChange={(e) => handlePositionChange('x', e.target.value)}
                                step="0.001"
                            />
                        </div>
                        <div className="floating-annotation-creator__coord-input">
                            <label>Y</label>
                            <input
                                type="number"
                                value={localPosition.y?.toFixed(3) || '0'}
                                onChange={(e) => handlePositionChange('y', e.target.value)}
                                step="0.001"
                            />
                        </div>
                        <div className="floating-annotation-creator__coord-input">
                            <label>Z</label>
                            <input
                                type="number"
                                value={localPosition.z?.toFixed(3) || '0'}
                                onChange={(e) => handlePositionChange('z', e.target.value)}
                                step="0.001"
                            />
                        </div>
                    </div>
                ) : (
                    <div className="floating-annotation-creator__position-display">
                        <span className="coord">X: {localPosition.x?.toFixed(3) || '0.000'}</span>
                        <span className="coord">Y: {localPosition.y?.toFixed(3) || '0.000'}</span>
                        <span className="coord">Z: {localPosition.z?.toFixed(3) || '0.000'}</span>
                    </div>
                )}
            </div>

            {/* Type Selection */}
            <div className="floating-annotation-creator__types">
                {ANNOTATION_TYPES.map((t) => (
                    <button
                        key={t.value}
                        className={`floating-annotation-creator__type ${type === t.value ? 'active' : ''}`}
                        style={{ '--type-color': t.color }}
                        onClick={() => setType(t.value)}
                        title={t.label}
                    >
                        <span className="floating-annotation-creator__type-icon">{t.icon}</span>
                        <span className="floating-annotation-creator__type-label">{t.label}</span>
                    </button>
                ))}
            </div>

            {/* Text Input */}
            <div className="floating-annotation-creator__input-wrapper">
                <textarea
                    ref={inputRef}
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    placeholder="Enter annotation text..."
                    className="floating-annotation-creator__input"
                    rows={2}
                />
            </div>

            {/* Actions */}
            <div className="floating-annotation-creator__actions">
                <button
                    className="floating-annotation-creator__btn floating-annotation-creator__btn--cancel"
                    onClick={onClose}
                >
                    Cancel
                </button>
                <button
                    className="floating-annotation-creator__btn floating-annotation-creator__btn--submit"
                    onClick={handleSubmit}
                    disabled={!text.trim()}
                >
                    <MapPin size={12} />
                    Create
                </button>
            </div>

            {/* Hint */}
            <div className="floating-annotation-creator__hint">
                Press <kbd>Enter</kbd> to create or <kbd>Esc</kbd> to cancel
            </div>
        </div>
    );

    return createPortal(content, document.body);
}

export default FloatingAnnotationCreator;