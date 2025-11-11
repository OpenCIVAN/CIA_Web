// src/ui/react/CIAWebApp.jsx
// Main React application with clean initialization

import React, { useState, useEffect, useRef } from "react";
import { getUserName, setUserName } from "@Collaboration/presence/userManagement.js";
import { initializePhase1, initializePhase2, initializePhase3 } from "@Init/appInitializer.js";

// Import panels and components
import { FilesPanel } from "./components/panels/FilesPanel.jsx";
import { ControlPanel } from "./components/ControlPanel.jsx";
import { WorkspaceGrid } from "./components/workspace/WorkspaceGrid.jsx";
import { TopBar } from "./components/layout/TopBar.jsx";
import { StatusBar } from "./components/layout/StatusBar.jsx";

// Import styles
import "@UI/react/styles/global.css";
// import "./styles/main.css";
// import "./styles/panels.css";

export function CIAWebApp() {
  const [username, setUsernameState] = useState("");
  const [isUsernameSet, setIsUsernameSet] = useState(false);
  const [initPhase, setInitPhase] = useState(0);
  const [initError, setInitError] = useState(null);
  const initStarted = useRef(false);

  // Phase 1: Initialize core services on mount
  useEffect(() => {
    if (initStarted.current) return;
    initStarted.current = true;

    console.log("🎬 Starting CIA Web initialization...");

    initializePhase1()
      .then(() => {
        setInitPhase(1);
        console.log("✅ App: Phase 1 complete");
      })
      .catch(error => {
        console.error("❌ App: Phase 1 failed:", error);
        setInitError("Failed to initialize core services. Please refresh the page.");
      });
  }, []);

  // Phase 2: Initialize user services after username is set
  useEffect(() => {
    if (!isUsernameSet || initPhase < 1) return;

    console.log("🎬 Initializing user services...");

    initializePhase2()
      .then(() => {
        setInitPhase(2);
        console.log("✅ App: Phase 2 complete");
      })
      .catch(error => {
        console.error("❌ App: Phase 2 failed:", error);
        setInitError("Failed to initialize user services. Please refresh the page.");
      });
  }, [isUsernameSet, initPhase]);

  // Phase 3: Initialize enhanced systems after React is ready
  useEffect(() => {
    if (initPhase < 2) return;

    console.log("🎬 Initializing enhanced systems...");

    // Small delay to ensure React components are mounted
    const timer = setTimeout(() => {
      initializePhase3()
        .then(() => {
          setInitPhase(3);
          console.log("✅ App: Phase 3 complete - Application ready!");
        })
        .catch(error => {
          // Phase 3 errors are non-critical
          console.warn("⚠️ App: Phase 3 partial failure:", error);
          console.log("Continuing with basic features...");
          setInitPhase(3); // Still mark as complete
        });
    }, 100);

    return () => clearTimeout(timer);
  }, [initPhase]);

  // Handle username submission
  const handleUsernameSubmit = (e) => {
    e.preventDefault();

    if (!username.trim()) {
      alert("Please enter a username");
      return;
    }

    console.log(`👤 Setting username: ${username}`);
    setUserName(username.trim());
    setIsUsernameSet(true);
  };

  // Show error state
  if (initError) {
    return (
      <div className="error-container">
        <h1>Initialization Error</h1>
        <p>{initError}</p>
        <button onClick={() => window.location.reload()}>
          Reload Page
        </button>
      </div>
    );
  }

  // Show username prompt
  if (!isUsernameSet) {
    return (
      <div className="username-container">
        <div className="username-card">
          <h1>Welcome to CIA Web</h1>
          <p>Collaborative Immersive Analytics Platform</p>

          {initPhase === 0 && (
            <div className="loading-message">
              Initializing core services...
            </div>
          )}

          {initPhase >= 1 && (
            <form onSubmit={handleUsernameSubmit} className="username-form">
              <input
                type="text"
                placeholder="Enter your username"
                value={username}
                onChange={(e) => setUsernameState(e.target.value)}
                autoFocus
                maxLength={20}
                className="username-input"
              />
              <button type="submit" className="username-submit">
                Join Session
              </button>
            </form>
          )}
        </div>
      </div>
    );
  }

  // Show loading state
  if (initPhase < 2) {
    return (
      <div className="loading-container">
        <div className="loading-card">
          <h2>Initializing CIA Web</h2>
          <div className="loading-progress">
            <div className="loading-bar" style={{ width: `${(initPhase / 3) * 100}%` }} />
          </div>
          <p>Setting up collaborative environment...</p>
        </div>
      </div>
    );
  }

  // Main application UI
  return (
    <div className="cia-web-app">
      {/* Top Bar */}
      <TopBar username={getUserName()} />

      {/* Main Content Area */}
      <div className="app-body">
        {/* Left Panel - Files */}
        <div className="left-panel">
          <FilesPanel />
        </div>

        {/* Center - Workspace */}
        <div className="center-panel">
          <WorkspaceGrid />
        </div>

        {/* Right Panel - Controls */}
        <div className="right-panel">
          <ControlPanel />
        </div>
      </div>

      {/* Status Bar */}
      <StatusBar
        phase={initPhase}
        ready={initPhase >= 3}
      />
    </div>
  );
}