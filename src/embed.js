// src/embed.js
// Minimal embed entry point for server-side thumbnail capture
//
// This is loaded by the thumbnail worker in a headless browser.
// It renders only the visualization without the full app chrome.

import React from "react";
import ReactDOM from "react-dom/client";
import { initializePhase0, initializePhase1 } from "@Init/appInitializer.js";
import { embed as log } from "@Utils/logger.js";
import { InstanceViewport } from "@UI/react/components/workspace/InstanceViewport";

// Import minimal styles
import "@UI/react/styles/global.scss";

/**
 * Get parameters from URL
 */
function getParams() {
  const params = new URLSearchParams(window.location.search);
  const pathMatch = window.location.pathname.match(/\/embed\/(file|view)\/([a-f0-9-]+)/);

  return {
    mode: pathMatch?.[1] || params.get("mode") || "view",
    id: pathMatch?.[2] || params.get("id"),
    width: parseInt(params.get("width")) || 800,
    height: parseInt(params.get("height")) || 600,
  };
}

/**
 * Embed visualization component
 */
function EmbedVisualization({ mode, id, width, height }) {
  const [ready, setReady] = React.useState(false);
  const [error, setError] = React.useState(null);

  React.useEffect(() => {
    // When data loads, mark as ready for screenshot
    if (ready) {
      document.body.setAttribute("data-testid", "visualization-ready");
      log.info("Visualization ready for capture");
    }
  }, [ready]);

  if (error) {
    return (
      <div style={{
        width,
        height,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "#1a1a1a",
        color: "#ff4444"
      }}>
        Error: {error}
      </div>
    );
  }

  return (
    <div style={{ width, height, background: "#1a1a1a" }}>
      <InstanceViewport
        viewConfigId={mode === "view" ? id : null}
        onReady={() => {
          log.info("InstanceViewport reported ready");
          setReady(true);
        }}
      />
    </div>
  );
}

/**
 * Initialize embed mode
 */
async function initializeEmbed() {
  const params = getParams();

  log.info("Embed mode initializing...", params);

  if (!params.id) {
    document.body.innerHTML = '<div style="color: #ff4444; padding: 20px;">Missing id parameter</div>';
    return;
  }

  try {
    // Initialize core services (minimal)
    await initializePhase0();
    await initializePhase1();

    log.info("Core services ready");

    // Create root element
    const rootElement = document.createElement("div");
    rootElement.id = "embed-root";
    rootElement.style.cssText = `
      width: ${params.width}px;
      height: ${params.height}px;
      margin: 0;
      padding: 0;
      overflow: hidden;
    `;
    document.body.appendChild(rootElement);
    document.body.style.cssText = "margin: 0; padding: 0; overflow: hidden; background: #1a1a1a;";

    // Render
    const root = ReactDOM.createRoot(rootElement);
    root.render(
      <EmbedVisualization
        mode={params.mode}
        id={params.id}
        width={params.width}
        height={params.height}
      />
    );

    log.info("Embed rendered");
  } catch (error) {
    log.error("Embed initialization failed:", error);
    document.body.innerHTML = `<div style="color: #ff4444; padding: 20px;">Error: ${error.message}</div>`;
    document.body.setAttribute("data-testid", "visualization-error");
  }
}

// Start
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initializeEmbed);
} else {
  initializeEmbed();
}