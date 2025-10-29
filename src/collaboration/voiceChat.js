import { Room, RoomEvent } from "livekit-client";

class VoiceChat {
  constructor() {
    this.room = null;
    this.isConnected = false;
    this.isMuted = true;
  }

  async connect(roomName, userName) {
    try {
      console.log("🔌 Connecting to LiveKit server...");
      console.log("   Room:", roomName);
      console.log("   User:", userName);

      const token = await this.getDevToken(roomName, userName);

      this.room = new Room();
      this.setupEventListeners();

      await this.room.connect("ws://localhost:7880", token);

      // Enable microphone
      await this.room.localParticipant.setMicrophoneEnabled(true);
      this.isMuted = false;

      this.isConnected = true; // IMPORTANT: Set this after successful connection
      console.log("✅ Voice chat connected successfully!");
    } catch (error) {
      console.error("❌ Failed to connect to voice chat:", error);
      this.isConnected = false; // Make sure it's false on error
      throw error;
    }
  }

  async getDevToken(roomName, userName) {
    // For dev mode, fetch token from a simple endpoint
    // OR use CLI-generated tokens

    // Option 1: Fetch from a local token server (recommended)
    try {
      const response = await fetch("http://localhost:3001/token", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ roomName, userName }),
      });

      if (response.ok) {
        const data = await response.json();
        return data.token;
      }
    } catch (error) {
      console.log("Token server not running, using fallback...");
    }

    // Option 2: Fallback - paste a CLI-generated token here for testing
    // Generate one with: lk token create --api-key devkey --api-secret secret --join --room test-room --identity user1
    const FALLBACK_TOKEN = "PASTE_YOUR_CLI_TOKEN_HERE";

    if (FALLBACK_TOKEN !== "PASTE_YOUR_CLI_TOKEN_HERE") {
      return FALLBACK_TOKEN;
    }

    throw new Error(
      "No token available. Either start token server or paste a CLI token."
    );
  }

  setupEventListeners() {
    this.room.on(RoomEvent.Connected, () => {
      console.log("✅ Room connected");
      this.isConnected = true; // Make sure this is set
    });

    this.room.on(RoomEvent.Disconnected, (reason) => {
      console.log("🔌 Room disconnected:", reason);
      this.isConnected = false; // Make sure this is set
    });

    this.room.on(RoomEvent.Reconnecting, () => {
      console.log("🔄 Reconnecting...");
    });

    this.room.on(RoomEvent.Reconnected, () => {
      console.log("✅ Reconnected!");
      this.isConnected = true;
    });

    this.room.on(RoomEvent.ConnectionStateChanged, (state) => {
      console.log("Connection state:", state);
    });

    this.room.on(RoomEvent.ParticipantConnected, (participant) => {
      console.log(`👤 ${participant.identity} joined voice chat`);
    });

    this.room.on(RoomEvent.ParticipantDisconnected, (participant) => {
      console.log(`👋 ${participant.identity} left voice chat`);
    });

    this.room.on(
      RoomEvent.TrackSubscribed,
      (track, publication, participant) => {
        if (track.kind === "audio") {
          console.log(`🔊 Receiving audio from ${participant.identity}`);
        }
      }
    );
  }

  async toggleMute() {
    if (!this.room) return;

    this.isMuted = !this.isMuted;
    await this.room.localParticipant.setMicrophoneEnabled(!this.isMuted);
    console.log(this.isMuted ? "🔇 Muted" : "🎤 Unmuted");
    return this.isMuted;
  }

  disconnect() {
    if (this.room) {
      this.room.disconnect();
      this.isConnected = false;
      console.log("Disconnected from voice chat");
    }
  }

  getParticipants() {
    if (!this.room) return [];
    return Array.from(this.room.remoteParticipants.values());
  }
}

export const voiceChat = new VoiceChat();
