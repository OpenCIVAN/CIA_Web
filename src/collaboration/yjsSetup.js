// ----------------------------------------------------------------------------
// Yjs Setup - Collaborative data structures
// ----------------------------------------------------------------------------

import * as Y from "yjs";
import { WebsocketProvider } from "y-websocket";
import { NETWORK_CONFIG } from "../config/constants.js";

// ----------------------------------------------------------------------------
// Yjs Document and Provider
// ----------------------------------------------------------------------------

export const ydoc = new Y.Doc();

// WebSocket provider for real-time collaboration
export const provider = new WebsocketProvider(
  NETWORK_CONFIG.WEBSOCKET_URL,
  NETWORK_CONFIG.ROOM_NAME,
  ydoc
);

// ----------------------------------------------------------------------------
// Shared State Maps
// ----------------------------------------------------------------------------

// 3D visualization state
export const yActor = ydoc.getMap("actor");
export const yFile = ydoc.getMap("fileData");
export const yReduction = ydoc.getMap("reduction");

// Collaboration features
export const yCursors = ydoc.getMap("cursors"); // Tracks online users + cursor positions
export const yText = ydoc.getArray("chatMessages"); // Text chat messages
export const yAnnotations = ydoc.getMap("annotations"); // Shared annotations

// VR collaboration (future)
export const yAvatars = ydoc.getMap("avatars");
export const yVRControllers = ydoc.getMap("vrControllers");

// Connection status logging
provider.on('status', event => {
  console.log(`📡 Yjs connection status: ${event.status}`);
});

provider.on('sync', synced => {
  if (synced) {
    console.log('✅ Yjs synchronized with server');
  }
});

console.log("✅ Yjs document initialized");
console.log(`📡 Connecting to: ${NETWORK_CONFIG.WEBSOCKET_URL}/${NETWORK_CONFIG.ROOM_NAME}`);