// ----------------------------------------------------------------------------
// Annotation Controls - 3D annotation system
// ----------------------------------------------------------------------------

import {
  addButtonRow,
  addCustomRow,
  createScrollableList,
  createSectionHeader,
} from './componentFactory.js';
import { annotationSystem } from '../collaboration/annotations.js';
import { annotationRenderer } from '../core/annotationRenderer.js';

let annotationModeActive = false;
let annotationModeButton = null;
let annotationsList = null;

/**
 * Check if annotation mode is active
 */
export function isAnnotationMode() {
  return annotationModeActive;
}

/**
 * Toggle annotation mode on/off
 */
export function toggleAnnotationMode() {
  annotationModeActive = !annotationModeActive;
  
  if (annotationModeButton) {
    if (annotationModeActive) {
      annotationModeButton.textContent = "Stop Annotating";
      annotationModeButton.style.background = "#f44336";
      console.log("📍 Annotation mode activated - click on visualization to add annotations");
    } else {
      annotationModeButton.textContent = "Start Annotating";
      annotationModeButton.style.background = "#ff9800";
      console.log("📍 Annotation mode deactivated");
    }
  }
}

/**
 * Prompt user for annotation text and create annotation
 */
export function promptForAnnotationText(position) {
  const text = prompt("Enter annotation text:");
  
  if (text && text.trim()) {
    const type = prompt("Enter annotation type (note/issue/highlight):", "note");
    
    annotationSystem.createAnnotation(
      position,
      text.trim(),
      type || "note"
    );
    
    console.log("📍 Annotation created:", { position, text, type });
  } else {
    console.log("📍 Annotation cancelled");
  }
}

/**
 * Update the annotations list UI
 */
function updateAnnotationsList() {
  if (!annotationsList) return;
  
  const annotations = annotationSystem.getAllAnnotations();
  
  // Clear list
  annotationsList.innerHTML = "";
  
  if (annotations.length === 0) {
    const emptyMsg = document.createElement("div");
    emptyMsg.textContent = "No annotations yet. Click 'Start Annotating' and click on the visualization.";
    emptyMsg.style.cssText = "color: #999; font-style: italic; padding: 8px;";
    annotationsList.appendChild(emptyMsg);
    return;
  }
  
  // Add each annotation
  annotations.forEach(annotation => {
    const item = document.createElement("div");
    item.className = "annotation-item";
    item.style.cssText = `
      margin: 4px 0;
      padding: 6px;
      background: white;
      border-left: 3px solid ${getTypeColor(annotation.type)};
      cursor: pointer;
      border-radius: 2px;
    `;
    
    item.innerHTML = `
      <div style="font-weight: bold; font-size: 11px; color: #666; margin-bottom: 2px;">
        ${annotation.type.toUpperCase()} - ${annotation.userName}
      </div>
      <div style="font-size: 12px; color: #333;">
        ${escapeHtml(annotation.text)}
      </div>
    `;
    
    // Click to highlight
    item.addEventListener("click", () => {
      annotationRenderer.highlightAnnotation(annotation.id);
      console.log("📍 Highlighted annotation:", annotation.id);
    });
    
    annotationsList.appendChild(item);
  });
}

/**
 * Get color for annotation type
 */
function getTypeColor(type) {
  const colors = {
    note: "#2196F3",
    issue: "#f44336",
    highlight: "#ff9800",
  };
  return colors[type] || "#666";
}

/**
 * Escape HTML to prevent XSS
 */
function escapeHtml(text) {
  const div = document.createElement("div");
  div.textContent = text;
  return div.innerHTML;
}

/**
 * Add annotation controls to the UI
 */
export function addAnnotationControls() {
  const rightPanel = document.querySelector("#rightPanelTable tbody");
  
  if (!rightPanel) {
    console.warn("Right panel not found for annotation controls");
    return;
  }

  // Section header
  addCustomRow(rightPanel, createSectionHeader("📍 Annotations", { color: "#ff9800" }));

  // Annotations list
  annotationsList = createScrollableList({
    id: "annotationsList",
    maxHeight: "150px",
  });
  addCustomRow(rightPanel, annotationsList);

  // Start annotating button
  const { button } = addButtonRow(
    rightPanel,
    "Start Annotating",
    () => toggleAnnotationMode(),
    { variant: "warning", id: "annotationModeButton" }
  );
  
  annotationModeButton = button;

  // Listen for annotation changes to update the list
  annotationSystem.onAnnotationChange(() => {
    updateAnnotationsList();
  });

  // Initial update
  updateAnnotationsList();
  
  console.log("📍 Annotation controls initialized");
}