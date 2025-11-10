// src/ui/react/Bootstrap.jsx
// Minimal component to collect username before full app initialization
// Ensures username is collected before initializing collaboration systems

import React, { useState, useEffect, useRef } from "react";

import { hasUserName, getUserName, setUserName } from "@Collaboration/presence/userManagement.js";
import { initializePhase2 } from "@Init/appInitializer.js";
import { CIAWebApp } from "@UI/react/CIAWebApp.jsx";
import { UsernameModal } from "@UI/react/components/modals/UsernameModal.jsx";

// Track if Phase 2 has run at module level (persists across remounts)
let phase2Complete = false;

export function Bootstrap({ roomName }) {
    const [username, setUsername] = useState(null);
    const [isInitializing, setIsInitializing] = useState(false);
    const [initializationComplete, setInitializationComplete] = useState(phase2Complete);
    const [showModal, setShowModal] = useState(true);
    const initOnce = useRef(false); // Prevent double-initialization in React Strict Mode

    // Check if username already exists (from localStorage)
    useEffect(() => {
        // If Phase 2 already completed from a previous mount, skip to the end
        if (phase2Complete) {
            const existingName = getUserName();
            setUsername(existingName);
            setShowModal(false);
            setInitializationComplete(true);
            return;
        }

        // Check if username already exists (from localStorage)
        if (hasUserName()) {
            const existingName = getUserName();
            console.log("✅ Username already set:", existingName);
            setUsername(existingName);
            setShowModal(false);

            // Only trigger Phase 2 once, even if this effect runs twice
            if (!initOnce.current) {
                initOnce.current = true;
                handleUsernameSet(existingName);
            }
        }
    }, []);

    const handleUsernameSet = async (name) => {
        // CRITICAL: Set the username in userManagement FIRST, SYNCHRONOUSLY
        setUserName(name);
        console.log("👤 Username set:", name);
        setUsername(name); // This username for React state
        setShowModal(false);
        setIsInitializing(true);

        // Small delay to ensure userManagement state is fully updated
        await new Promise(resolve => setTimeout(resolve, 50));

        try {
            // Run Phase 2 initialization with the username
            await initializePhase2(name);

            // Mark as complete at module level so remounts skip initialization
            phase2Complete = true;

            setInitializationComplete(true);
            setIsInitializing(false);

            console.log("✅ Application fully initialized!");

        } catch (error) {
            console.error("❌ Phase 2 initialization failed:", error);
            setIsInitializing(false);
            alert("Failed to initialize application. Please refresh and try again.");
        }
    };

    // Show username modal if needed
    if (showModal) {
        return (
            <UsernameModal onSubmit={handleUsernameSet} />
        );
    }

    // Show loading screen while Phase 2 runs
    if (isInitializing) {
        return (
            <div style={{
                position: "fixed",
                top: 0,
                left: 0,
                width: "100%",
                height: "100%",
                backgroundColor: "#0a0a0a",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                zIndex: 10000
            }}>
                <div style={{
                    textAlign: "center",
                    color: "#e0e0e0"
                }}>
                    <div style={{
                        fontSize: "48px",
                        marginBottom: "20px"
                    }}>
                        🔄
                    </div>
                    <h2 style={{
                        margin: "0 0 10px 0",
                        fontSize: "20px",
                        fontWeight: "600"
                    }}>
                        Initializing Collaboration Systems...
                    </h2>
                    <p style={{
                        margin: 0,
                        fontSize: "14px",
                        color: "#999"
                    }}>
                        Setting up real-time features for {username}
                    </p>
                    <div style={{
                        marginTop: "30px",
                        width: "40px",
                        height: "40px",
                        border: "4px solid #333",
                        borderTop: "4px solid #4CAF50",
                        borderRadius: "50%",
                        animation: "spin 1s linear infinite",
                        margin: "30px auto 0"
                    }} />
                </div>
            </div>
        );
    }


    // Phase 2 complete - render the full application
    if (initializationComplete) {
        return (
            <CIAWebApp
                roomName={roomName}
                userName={username}
            />
        );
    }

    // Fallback (shouldn't reach here)
    return null;
}