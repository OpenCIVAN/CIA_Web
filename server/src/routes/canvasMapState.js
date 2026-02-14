// server/src/routes/canvasMapState.js
// Persist Canvas Map panel layout state for each authenticated user

const express = require("express");
const router = express.Router();
const { getUserId } = require("../middleware/auth");

// Default state fingerprint returned when nothing is stored yet
function emptyCanvasMapState() {
  return { panels: {} };
}

router.get("/state", async (req, res, next) => {
  try {
    const userId = getUserId(req);
    if (!userId) return res.status(401).json({ error: "Authentication required" });
    const { pool } = req.app.locals;
    const result = await pool.query("SELECT preferences FROM users WHERE id = $1", [userId]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: "User not found" });
    }
    const preferences = result.rows[0].preferences || {};
    const state = preferences.canvasMapState || emptyCanvasMapState();
    res.json(state);
  } catch (error) {
    next(error);
  }
});

router.post("/state", async (req, res, next) => {
  try {
    const userId = getUserId(req);
    if (!userId) return res.status(401).json({ error: "Authentication required" });
    const { panels } = req.body;
    if (!panels || typeof panels !== "object") {
      return res.status(400).json({ error: "Invalid panel state" });
    }
    const { pool } = req.app.locals;
    const state = { panels };
    const result = await pool.query(
      `UPDATE users
       SET preferences = jsonb_set(
         COALESCE(preferences, '{}'::jsonb),
         '{canvasMapState}',
         $1::jsonb,
         true
       ),
       updated_at = NOW()
       WHERE id = $2
       RETURNING preferences`,
      [JSON.stringify(state), userId]
    );
    const preferences = result.rows[0].preferences || {};
    const saved = preferences.canvasMapState || state;
    res.json(saved);
  } catch (error) {
    next(error);
  }
});

module.exports = router;
