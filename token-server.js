const express = require("express");
const { AccessToken } = require("livekit-server-sdk");
const cors = require("cors");

const app = express();

app.use(
  cors({
    origin: "*",
    credentials: true,
  })
);

app.use(express.json());

// ⚠️ WARNING: These are development-only credentials!
// "devkey" and "secret" are LiveKit's default dev mode keys.
// For production, use environment variables with real credentials:
//   export LIVEKIT_API_KEY="your-real-key"
//   export LIVEKIT_API_SECRET="your-real-secret"
const LIVEKIT_API_KEY = process.env.LIVEKIT_API_KEY || "devkey";
const LIVEKIT_API_SECRET = process.env.LIVEKIT_API_SECRET || "secret";

app.post("/token", async (req, res) => {
  try {
    const { roomName, userName } = req.body;

    console.log(`🎫 Generating token for ${userName} in room ${roomName}`);
    console.log(`   Using API Key: ${LIVEKIT_API_KEY}`);

    const at = new AccessToken(LIVEKIT_API_KEY, LIVEKIT_API_SECRET, {
      identity: userName,
    });

    at.addGrant({
      roomJoin: true,
      room: roomName,
      canPublish: true,
      canSubscribe: true,
    });

    const token = await at.toJwt();
    console.log("🐛 DEBUG: typeof token =", typeof token);
    console.log("🐛 DEBUG: token value =", token);
    console.log("🐛 DEBUG: token is string?", typeof token === "string");

    if (typeof token === "string") {
      console.log("✅ Token generated successfully");
      res.json({ token });
    } else {
      console.error("❌ Token is not a string! Type:", typeof token);
      res.status(500).json({ error: "Token generation failed" });
    }
  } catch (error) {
    console.error("❌ Error generating token:", error);
    res.status(500).json({ error: error.message });
  }
});

app.get("/health", (req, res) => {
  res.json({ status: "ok", apiKey: LIVEKIT_API_KEY });
});

const PORT = 3002;
app.listen(PORT, "0.0.0.0", () => {
  console.log(`✅ Token server running on http://localhost:${PORT}`);
  console.log(`   API Key: ${LIVEKIT_API_KEY}`);
  console.log(`   API Secret: ${LIVEKIT_API_SECRET ? "[SET]" : "[NOT SET]"}`);
});
