// server/src/routes/canvases.js
// Canvas and placement management endpoints

const express = require("express");
const router = express.Router();

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

function getUserId(req) {
  return (
    req.user?.id ||
    req.get("x-user-id") ||
    "00000000-0000-0000-0000-000000000001"
  );
}

// ============================================================================
// CANVAS ENDPOINTS
// ============================================================================

/**
 * GET /api/canvases
 * List canvases for a workspace
 */
router.get("/", async (req, res, next) => {
  try {
    const { workspace_id, project_id } = req.query;
    const userId = getUserId(req);
    const { pool } = req.app.locals;

    let query = `
      SELECT c.*, w.name as workspace_name
      FROM canvases c
      JOIN workspaces w ON c.workspace_id = w.id
      LEFT JOIN workspace_members wm ON w.id = wm.workspace_id
      WHERE c.is_active = true
    `;
    const params = [];
    let paramIndex = 1;

    if (workspace_id) {
      query += ` AND c.workspace_id = $${paramIndex++}`;
      params.push(workspace_id);
    }

    if (project_id) {
      query += ` AND c.project_id = $${paramIndex++}`;
      params.push(project_id);
    }

    // Check user has access
    query += ` AND (w.owner_id = $${paramIndex} OR wm.user_id = $${paramIndex})`;
    params.push(userId);

    query += " ORDER BY c.updated_at DESC";

    const result = await pool.query(query, params);

    res.json({
      canvases: result.rows,
      count: result.rows.length,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/canvases/:id
 * Get canvas with placements
 */
router.get("/:id", async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = getUserId(req);
    const { pool } = req.app.locals;

    // Get canvas
    const canvasResult = await pool.query(
      `SELECT c.*, w.name as workspace_name
       FROM canvases c
       JOIN workspaces w ON c.workspace_id = w.id
       LEFT JOIN workspace_members wm ON w.id = wm.workspace_id
       WHERE c.id = $1 AND (w.owner_id = $2 OR wm.user_id = $2)`,
      [id, userId]
    );

    if (canvasResult.rows.length === 0) {
      return res.status(404).json({ error: "Canvas not found" });
    }

    // Get placements
    const placementsResult = await pool.query(
      `SELECT * FROM placements WHERE canvas_id = $1 ORDER BY row_index, col_index`,
      [id]
    );

    res.json({
      ...canvasResult.rows[0],
      placements: placementsResult.rows,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/canvases
 * Create a new canvas
 */
router.post("/", async (req, res, next) => {
  try {
    const userId = getUserId(req);
    const { pool } = req.app.locals;
    const { workspace_id, project_id, name, dimensions, ownership } = req.body;

    if (!workspace_id) {
      return res.status(400).json({ error: "workspace_id is required" });
    }

    const result = await pool.query(
      `INSERT INTO canvases (workspace_id, project_id, name, dimensions, ownership, created_by)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [
        workspace_id,
        project_id || null,
        name || "Untitled Canvas",
        JSON.stringify(dimensions || { rows: 3, cols: 3 }),
        JSON.stringify(ownership || { type: "personal", ownerId: userId }),
        userId,
      ]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    next(error);
  }
});

/**
 * PUT /api/canvases/:id
 * Update canvas
 */
router.put("/:id", async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = getUserId(req);
    const { pool } = req.app.locals;
    const { name, dimensions, viewport } = req.body;

    const result = await pool.query(
      `UPDATE canvases
       SET name = COALESCE($1, name),
           dimensions = COALESCE($2, dimensions),
           viewport = COALESCE($3, viewport),
           updated_at = NOW()
       WHERE id = $4
       RETURNING *`,
      [
        name,
        dimensions ? JSON.stringify(dimensions) : null,
        viewport ? JSON.stringify(viewport) : null,
        id,
      ]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Canvas not found" });
    }

    res.json(result.rows[0]);
  } catch (error) {
    next(error);
  }
});

/**
 * DELETE /api/canvases/:id
 * Delete canvas (soft delete)
 */
router.delete("/:id", async (req, res, next) => {
  try {
    const { id } = req.params;
    const { pool } = req.app.locals;

    const result = await pool.query(
      `UPDATE canvases SET is_active = false, updated_at = NOW() WHERE id = $1 RETURNING id`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Canvas not found" });
    }

    res.json({ success: true, id });
  } catch (error) {
    next(error);
  }
});

// ============================================================================
// PLACEMENT ENDPOINTS
// ============================================================================

/**
 * GET /api/canvases/:id/placements
 * Get placements for a canvas
 */
router.get("/:id/placements", async (req, res, next) => {
  try {
    const { id } = req.params;
    const { pool } = req.app.locals;

    const result = await pool.query(
      `SELECT * FROM placements WHERE canvas_id = $1 ORDER BY row_index, col_index`,
      [id]
    );

    res.json({
      placements: result.rows,
      count: result.rows.length,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/canvases/:id/placements
 * Add a placement to canvas
 */
router.post("/:id/placements", async (req, res, next) => {
  try {
    const { id: canvas_id } = req.params;
    const userId = getUserId(req);
    const { pool } = req.app.locals;
    const {
      row_index,
      col_index,
      row_span,
      col_span,
      content_type,
      content_id,
    } = req.body;

    const result = await pool.query(
      `INSERT INTO placements (canvas_id, row_index, col_index, row_span, col_span, content_type, content_id, created_by)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING *`,
      [
        canvas_id,
        row_index || 0,
        col_index || 0,
        row_span || 1,
        col_span || 1,
        content_type || "empty",
        content_id || null,
        userId,
      ]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    next(error);
  }
});

/**
 * PUT /api/placements/:id
 * Update a placement (move, resize)
 */
router.put("/placements/:id", async (req, res, next) => {
  try {
    const { id } = req.params;
    const { pool } = req.app.locals;
    const {
      row_index,
      col_index,
      row_span,
      col_span,
      content_type,
      content_id,
    } = req.body;

    const result = await pool.query(
      `UPDATE placements
       SET row_index = COALESCE($1, row_index),
           col_index = COALESCE($2, col_index),
           row_span = COALESCE($3, row_span),
           col_span = COALESCE($4, col_span),
           content_type = COALESCE($5, content_type),
           content_id = COALESCE($6, content_id),
           updated_at = NOW()
       WHERE id = $7
       RETURNING *`,
      [row_index, col_index, row_span, col_span, content_type, content_id, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Placement not found" });
    }

    res.json(result.rows[0]);
  } catch (error) {
    next(error);
  }
});

/**
 * DELETE /api/placements/:id
 * Delete a placement
 */
router.delete("/placements/:id", async (req, res, next) => {
  try {
    const { id } = req.params;
    const { pool } = req.app.locals;

    const result = await pool.query(
      `DELETE FROM placements WHERE id = $1 RETURNING id`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Placement not found" });
    }

    res.json({ success: true, id });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
