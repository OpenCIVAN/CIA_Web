// ----------------------------------------------------------------------------
// Annotation Controls UI
// ----------------------------------------------------------------------------

import { annotationSystem } from "../collaboration/annotations.js";
import { annotationRenderer } from "../core/annotationRenderer.js";
import { getUserId } from "../collaboration/userManagement.js";
import { logSuccess, logInfo, logWarning } from "./logging.js";

let annotationMode = false;

export function addAnnotationControls() {
  const controlTable = document.querySelector("table");

  if (!controlTable) {
    console.error('Control table not found');
    return;
  }

  // Annotations Header Row
  const headerRow = document.createElement("tr");
  const headerCell = document.createElement("td");
  const headerContainer = document.createElement("div");
  headerContainer.style.cssText = `
    background: #9C27B0; 
    color: white; 
    padding: 8px; 
    border-radius: 4px; 
    font-weight: bold; 
    text-align: center;
    margin-top: 10px;
  `;
  headerContainer.textContent = "📍 Annotations";
  headerCell.appendChild(headerContainer);
  headerRow.appendChild(headerCell);
  controlTable.appendChild(headerRow);

  // Toggle Annotation Mode Row
  const modeRow = document.createElement("tr");
  const modeCell = document.createElement("td");
  const modeContainer = document.createElement("div");
  modeContainer.style.cssText = "display: flex; gap: 8px; align-items: center;";

  const modeButton = document.createElement("button");
  modeButton.id = "annotation-mode-button";
  modeButton.textContent = "📍 Start Annotating";
  modeButton.style.cssText = `
    flex: 1;
    background: #9C27B0;
    color: white;
    border: none;
    padding: 8px;
    border-radius: 4px;
    cursor: pointer;
    font-size: 14px;
    font-weight: 500;
  `;

  modeButton.addEventListener("click", () => {
    annotationMode = !annotationMode;
    
    if (annotationMode) {
      modeButton.textContent = "✅ Annotating (Click on viz)";
      modeButton.style.background = "#4CAF50";
      logInfo("Click on the visualization to add annotations");
    } else {
      modeButton.textContent = "📍 Start Annotating";
      modeButton.style.background = "#9C27B0";
    }
  });

  const countSpan = document.createElement("span");
  countSpan.id = "annotation-count";
  countSpan.style.cssText = "font-size: 12px; color: #666; font-weight: bold;";
  countSpan.textContent = "0";

  modeContainer.appendChild(modeButton);
  modeContainer.appendChild(countSpan);
  modeCell.appendChild(modeContainer);
  modeRow.appendChild(modeCell);
  controlTable.appendChild(modeRow);

  // Annotation List Row
  const listRow = document.createElement("tr");
  const listCell = document.createElement("td");
  const listContainer = document.createElement("div");
  listContainer.style.cssText = `
    background: #f5f5f5;
    border: 1px solid #ddd;
    border-radius: 4px;
    padding: 8px;
    max-height: 150px;
    overflow-y: auto;
    font-size: 11px;
  `;

  const listTitle = document.createElement("div");
  listTitle.textContent = "Annotations:";
  listTitle.style.cssText = "font-weight: bold; margin-bottom: 4px;";

  const annotationList = document.createElement("div");
  annotationList.id = "annotation-list";
  annotationList.textContent = "No annotations yet";
  annotationList.style.cssText = "color: #999; font-style: italic;";

  listContainer.appendChild(listTitle);
  listContainer.appendChild(annotationList);
  listCell.appendChild(listContainer);
  listRow.appendChild(listCell);
  controlTable.appendChild(listRow);

  // Control Buttons Row
  const controlsRow = document.createElement("tr");
  const controlsCell = document.createElement("td");
  const controlsContainer = document.createElement("div");
  controlsContainer.style.cssText = "display: flex; gap: 5px;";

  const clearMineButton = document.createElement("button");
  clearMineButton.textContent = "Clear My Annotations";
  clearMineButton.style.cssText = `
    flex: 1;
    background: #FF9800;
    color: white;
    border: none;
    padding: 6px 12px;
    border-radius: 4px;
    cursor: pointer;
    font-size: 11px;
  `;

  clearMineButton.addEventListener("click", () => {
    if (confirm("Clear all your annotations?")) {
      annotationSystem.clearAllAnnotations();
      logInfo("Your annotations cleared");
    }
  });

  const clearAllButton = document.createElement("button");
  clearAllButton.textContent = "Clear All";
  clearAllButton.style.cssText = `
    flex: 1;
    background: #f44336;
    color: white;
    border: none;
    padding: 6px 12px;
    border-radius: 4px;
    cursor: pointer;
    font-size: 11px;
  `;

  clearAllButton.addEventListener("click", () => {
    if (confirm("Clear ALL annotations for everyone?")) {
      annotationSystem.clearAllAnnotationsForEveryone();
      logInfo("All annotations cleared");
    }
  });

  controlsContainer.appendChild(clearMineButton);
  controlsContainer.appendChild(clearAllButton);
  controlsCell.appendChild(controlsContainer);
  controlsRow.appendChild(controlsCell);
  controlTable.appendChild(controlsRow);

  // Initialize annotation system if not already done
  if (!annotationSystem.annotations) {
    annotationSystem.initialize();
  }

  // Listen for annotation changes
  annotationSystem.onAnnotationChange(() => {
    updateAnnotationList();
  });

  // Initial list update
  updateAnnotationList();

  logSuccess("Annotation controls added");
}

function updateAnnotationList() {
  const listDiv = document.getElementById("annotation-list");
  const countSpan = document.getElementById("annotation-count");
  
  if (!listDiv) return;

  const annotations = annotationSystem.getAllAnnotations();
  
  if (countSpan) {
    countSpan.textContent = annotations.length.toString();
  }

  if (annotations.length === 0) {
    listDiv.innerHTML = "";
    listDiv.textContent = "No annotations yet";
    listDiv.style.color = "#999";
    listDiv.style.fontStyle = "italic";
    return;
  }

  listDiv.innerHTML = "";
  listDiv.style.fontStyle = "normal";

  annotations.forEach((annotation) => {
    const annotationDiv = document.createElement("div");
    annotationDiv.style.cssText = `
      margin-bottom: 6px;
      padding: 6px;
      border-radius: 3px;
      background: white;
      border-left: 3px solid ${annotation.userColor};
      cursor: pointer;
    `;

    const headerDiv = document.createElement("div");
    headerDiv.style.cssText = "display: flex; justify-content: space-between; margin-bottom: 2px;";

    const nameSpan = document.createElement("span");
    nameSpan.textContent = annotation.userName;
    nameSpan.style.cssText = `
      font-weight: bold;
      color: ${annotation.userColor};
      font-size: 11px;
    `;

    const typeSpan = document.createElement("span");
    typeSpan.textContent = getAnnotationIcon(annotation.type);
    typeSpan.style.cssText = "font-size: 12px;";

    headerDiv.appendChild(nameSpan);
    headerDiv.appendChild(typeSpan);

    const textDiv = document.createElement("div");
    textDiv.textContent = annotation.text || '(No text)';
    textDiv.style.cssText = "color: #333; font-size: 11px;";

    const positionDiv = document.createElement("div");
    positionDiv.textContent = `(${annotation.position.x.toFixed(2)}, ${annotation.position.y.toFixed(2)}, ${annotation.position.z.toFixed(2)})`;
    positionDiv.style.cssText = "color: #999; font-size: 10px; margin-top: 2px;";

    annotationDiv.appendChild(headerDiv);
    annotationDiv.appendChild(textDiv);
    annotationDiv.appendChild(positionDiv);

    // Click to highlight
    annotationDiv.addEventListener("click", () => {
      annotationRenderer.highlightAnnotation(annotation.id);
      annotationSystem.selectAnnotation(annotation.id);
    });

    // Add delete button if it's the user's own annotation
    if (annotation.userId === getUserId()) {
      const deleteBtn = document.createElement("button");
      deleteBtn.textContent = "×";
      deleteBtn.style.cssText = `
        background: #f44336;
        color: white;
        border: none;
        padding: 2px 6px;
        border-radius: 3px;
        cursor: pointer;
        font-size: 14px;
        margin-top: 4px;
      `;
      deleteBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        annotationSystem.deleteAnnotation(annotation.id);
      });
      annotationDiv.appendChild(deleteBtn);
    }

    listDiv.appendChild(annotationDiv);
  });
}

function getAnnotationIcon(type) {
  const icons = {
    'note': '📝',
    'warning': '⚠️',
    'info': 'ℹ️',
    'measurement': '📐',
    'question': '❓'
  };
  return icons[type] || '📍';
}

export function isAnnotationMode() {
  return annotationMode;
}

export function promptForAnnotationText(position) {
  // Disable annotation mode immediately to prevent multiple clicks
  annotationMode = false;
  const modeButton = document.getElementById("annotation-mode-button");
  if (modeButton) {
    modeButton.textContent = "📍 Start Annotating";
    modeButton.style.background = "#9C27B0";
  }

  // Create modal for annotation input
  const overlay = document.createElement("div");
  overlay.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    width: 100vw;
    height: 100vh;
    background: rgba(0, 0, 0, 0.7);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 10000;
  `;

  const dialog = document.createElement("div");
  dialog.style.cssText = `
    background: white;
    padding: 20px;
    border-radius: 8px;
    min-width: 300px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
  `;

  const title = document.createElement("h3");
  title.textContent = "Add Annotation";
  title.style.cssText = "margin: 0 0 15px 0; color: #333;";

  const positionInfo = document.createElement("p");
  positionInfo.textContent = `Position: (${position.x.toFixed(2)}, ${position.y.toFixed(2)}, ${position.z.toFixed(2)})`;
  positionInfo.style.cssText = "margin: 0 0 10px 0; color: #666; font-size: 12px;";

  const textLabel = document.createElement("label");
  textLabel.textContent = "Text:";
  textLabel.style.cssText = "display: block; margin-bottom: 5px; font-weight: bold;";

  const textInput = document.createElement("textarea");
  textInput.placeholder = "Enter annotation text...";
  textInput.style.cssText = `
    width: 100%;
    padding: 8px;
    border: 1px solid #ddd;
    border-radius: 4px;
    font-size: 14px;
    margin-bottom: 10px;
    box-sizing: border-box;
    min-height: 60px;
  `;

  const typeLabel = document.createElement("label");
  typeLabel.textContent = "Type:";
  typeLabel.style.cssText = "display: block; margin-bottom: 5px; font-weight: bold;";

  const typeSelect = document.createElement("select");
  typeSelect.style.cssText = `
    width: 100%;
    padding: 8px;
    border: 1px solid #ddd;
    border-radius: 4px;
    font-size: 14px;
    margin-bottom: 15px;
  `;

  const types = [
    { value: 'note', label: '📝 Note' },
    { value: 'warning', label: '⚠️ Warning' },
    { value: 'info', label: 'ℹ️ Info' },
    { value: 'measurement', label: '📐 Measurement' },
    { value: 'question', label: '❓ Question' }
  ];

  types.forEach(type => {
    const option = document.createElement("option");
    option.value = type.value;
    option.textContent = type.label;
    typeSelect.appendChild(option);
  });

  const buttonContainer = document.createElement("div");
  buttonContainer.style.cssText = "display: flex; gap: 10px; justify-content: flex-end;";

  const cancelButton = document.createElement("button");
  cancelButton.textContent = "Cancel";
  cancelButton.style.cssText = `
    background: #999;
    color: white;
    border: none;
    padding: 8px 16px;
    border-radius: 4px;
    cursor: pointer;
  `;

  const createButton = document.createElement("button");
  createButton.textContent = "Create";
  createButton.style.cssText = `
    background: #9C27B0;
    color: white;
    border: none;
    padding: 8px 16px;
    border-radius: 4px;
    cursor: pointer;
  `;

  const closeDialog = () => {
    document.body.removeChild(overlay);
  };

  cancelButton.addEventListener("click", closeDialog);

  createButton.addEventListener("click", () => {
    const text = textInput.value.trim();
    if (text) {
      const type = typeSelect.value;
      annotationSystem.createAnnotation(position, text, type);
      logSuccess("Annotation created");
      closeDialog();
    } else {
      textInput.style.borderColor = "#f44336";
      textInput.placeholder = "Please enter some text...";
    }
  });

  textInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter" && e.ctrlKey) {
      createButton.click();
    }
  });

  buttonContainer.appendChild(cancelButton);
  buttonContainer.appendChild(createButton);

  dialog.appendChild(title);
  dialog.appendChild(positionInfo);
  dialog.appendChild(textLabel);
  dialog.appendChild(textInput);
  dialog.appendChild(typeLabel);
  dialog.appendChild(typeSelect);
  dialog.appendChild(buttonContainer);

  overlay.appendChild(dialog);
  document.body.appendChild(overlay);

  // Focus the text input
  setTimeout(() => textInput.focus(), 100);
}