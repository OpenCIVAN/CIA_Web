// ----------------------------------------------------------------------------
// User Management - Handles user identity and names
// ----------------------------------------------------------------------------

import { yCursors } from "./yjsSetup.js";
import { USER_COLORS } from "../config/constants.js";

let userId = null;
let userName = "Guest";
let userColor = null;

export function getUserId() {
  if (!userId) {
    userId = `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
  return userId;
}

export function getUserName() {
  return userName;
}

export function setUserName(name) {
  userName = name;
  
  // Update in Yjs cursor data (which tracks online users)
  const currentCursor = yCursors.get(getUserId()) || {};
  yCursors.set(getUserId(), {
    ...currentCursor,
    name: name,
    color: getUserColor(getUserId()),
    x: currentCursor.x || 0,
    y: currentCursor.y || 0,
    timestamp: Date.now()
  });
  
  console.log("✅ Username updated:", name);
}

export function getUserColor(id) {
  if (!userColor) {
    const hash = id.split("").reduce((acc, char) => {
      return char.charCodeAt(0) + ((acc << 5) - acc);
    }, 0);
    userColor = USER_COLORS[Math.abs(hash) % USER_COLORS.length];
  }
  return userColor;
}

export async function setupUserName() {
  // Check if name is stored in localStorage
  const storedName = localStorage.getItem("vtk-username");
  
  // Always prompt, but prefill with stored name if it exists
  const defaultName = storedName || "Guest";
  const enteredName = prompt("Enter your display name:", defaultName);
  
  if (enteredName && enteredName.trim()) {
    // User entered a name
    userName = enteredName.trim();
    localStorage.setItem("vtk-username", userName);
    console.log("👤 Username set:", userName);
  } else if (storedName) {
    // User cancelled but we have a stored name - use it
    userName = storedName;
    console.log("👤 Using stored username:", userName);
  } else {
    // User cancelled and no stored name - generate random
    const randomId = Math.random().toString(36).substr(2, 6).toUpperCase();
    userName = `User_${randomId}`;
    localStorage.setItem("vtk-username", userName);
    console.log("👤 Generated random username:", userName);
  }

  // Initialize cursor with name (this tracks online users)
  yCursors.set(getUserId(), {
    name: userName,
    color: getUserColor(getUserId()),
    x: 0,
    y: 0,
    timestamp: Date.now()
  });

  console.log("👤 User initialized:", userName, "ID:", getUserId());
}

export function initializeNameEditor() {
  const editNameBtn = document.getElementById('editNameBtn');
  const displayNameEl = document.getElementById('displayName');
  
  if (!editNameBtn || !displayNameEl) {
    console.warn("Name editor elements not found");
    return;
  }

  // Set initial display from current userName
  displayNameEl.textContent = getUserName();

  editNameBtn.addEventListener('click', () => {
    const currentName = getUserName();
    const newName = prompt("Enter your display name:", currentName);
    
    if (newName && newName.trim() && newName.trim() !== currentName) {
      setUserName(newName.trim());
      displayNameEl.textContent = newName.trim();
      
      // Store in localStorage (persists forever)
      localStorage.setItem("vtk-username", newName.trim());
      
      console.log("✅ Display name updated:", newName.trim());
    }
  });

  console.log("✏️ Name editor initialized with name:", getUserName());
}

// Cleanup on page unload - remove user from online list
if (typeof window !== "undefined") {
  window.addEventListener("beforeunload", () => {
    if (yCursors && userId) {
      yCursors.delete(userId);
      console.log("👋 User removed from online list");
    }
  });
}