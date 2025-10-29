// ----------------------------------------------------------------------------
// Cursor Controls - Collaborative cursor visibility
// ----------------------------------------------------------------------------

import { addButtonRow, createSectionHeader, addCustomRow } from './componentFactory.js';
import { hideMyCursor } from '../collaboration/cursors.js';

let cursorButton = null;
let cursorVisible = true; // Track state locally

export function addCursorControls() {
  const rightPanel = document.querySelector("#rightPanelTable tbody");
  
  if (!rightPanel) {
    console.warn("Right panel not found for cursor controls");
    return;
  }

  // Section header
  addCustomRow(rightPanel, createSectionHeader("🖱️ Cursors", { color: "#9C27B0" }));

  // Toggle cursor visibility button
  const { button } = addButtonRow(
    rightPanel,
    "Hide My Cursor",
    () => {
      cursorVisible = !cursorVisible;
      hideMyCursor(!cursorVisible);
      updateCursorButton();
      console.log(`🖱️ Cursor ${cursorVisible ? 'visible' : 'hidden'}`);
    },
    { variant: "secondary", id: "toggleCursorButton" }
  );
  
  cursorButton = button;
  updateCursorButton();

  console.log("🖱️ Cursor controls initialized");
}

function updateCursorButton() {
  if (!cursorButton) return;
  
  if (cursorVisible) {
    cursorButton.textContent = "Hide My Cursor";
    cursorButton.style.background = "#2196F3";
  } else {
    cursorButton.textContent = "Show My Cursor";
    cursorButton.style.background = "#9E9E9E";
  }
}