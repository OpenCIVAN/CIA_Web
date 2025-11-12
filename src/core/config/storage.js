// src/core/config/storage.js

/**
 * Storage configuration for the application
 *
 * This file determines which storage provider to use and how to configure it.
 * During development, you can easily switch between local and server storage
 * by changing the USE_SERVER_STORAGE flag.
 *
 * IMPORTANT: These are hardcoded values for development. When you deploy to
 * production, you'll need to either:
 * 1. Build different versions of the app for different environments, OR
 * 2. Configure webpack's DefinePlugin to inject environment variables, OR
 * 3. Load configuration from a runtime config file
 *
 * For now, we're keeping it simple with hardcoded dev values.
 */

// Flag to control which storage provider to use
// Set this to false if you want to work offline or test local-only features
export const USE_SERVER_STORAGE = true;

// API server configuration
// For local development with Docker
export const API_BASE_URL = "http://localhost:3001";

// Session configuration
// Fixed UUID for local development - all local users share this session
// In production, this would be generated per collaborative workspace
export const DEFAULT_SESSION_ID = '00000000-0000-0000-0000-000000000001';

/**
 * Helper to log the current storage configuration
 * Useful for debugging which storage mode is active
 */
export function logStorageConfig() {
  console.log("📡 Storage Configuration:");
  console.log(`   Mode: ${USE_SERVER_STORAGE ? "Server" : "Local"}`);
  console.log(`   API Base URL: ${API_BASE_URL}`);
  console.log(`   Session ID: ${DEFAULT_SESSION_ID}`);
}

/**
 * Get the configured storage provider instance
 *
 * This function is called once during app initialization to create
 * the appropriate storage provider based on configuration.
 */
export function createStorageProvider() {
  if (USE_SERVER_STORAGE) {
    // Dynamic import to avoid loading LocalStorageProvider when not needed
    const {
      ServerStorageProvider,
    } = require("@Core/data/providers/ServerStorageProvider");
    console.log("📡 Using ServerStorageProvider with API:", API_BASE_URL);
    return new ServerStorageProvider(API_BASE_URL);
  } else {
    // Fallback to local storage (you'd implement this if you want offline support)
    const {
      LocalStorageProvider,
    } = require("@Core/data/providers/LocalStorageProvider");
    console.log("💾 Using LocalStorageProvider (offline mode)");
    return new LocalStorageProvider();
  }
}
