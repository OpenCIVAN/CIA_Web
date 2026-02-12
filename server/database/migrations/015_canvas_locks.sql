-- Migration 015: Canvas Locks for Transactional Editing
-- Adds a canvas_locks table for the Edit Layout mode.
-- Only one active (non-expired) lock per canvas at a time.

CREATE TABLE IF NOT EXISTS canvas_locks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    canvas_id UUID NOT NULL REFERENCES canvases(id) ON DELETE CASCADE,
    locked_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    locked_by_name VARCHAR(255),
    expires_at TIMESTAMPTZ NOT NULL,
    extend_count INT NOT NULL DEFAULT 0,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Note: "one active lock per canvas" is enforced at the application layer
-- (expired locks are deleted before acquiring). A partial unique index on
-- expires_at > NOW() is not possible because NOW() is STABLE, not IMMUTABLE.

CREATE INDEX IF NOT EXISTS idx_canvas_locks_canvas ON canvas_locks(canvas_id);
CREATE INDEX IF NOT EXISTS idx_canvas_locks_user ON canvas_locks(locked_by);
CREATE INDEX IF NOT EXISTS idx_canvas_locks_expires ON canvas_locks(expires_at);
