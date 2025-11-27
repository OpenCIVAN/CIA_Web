// server/src/index.js
// Main API server for CIA Web v2.0
// Server-authoritative architecture with WebSocket broadcast

const express = require("express");
const http = require("http");
const cors = require("cors");
const { Pool } = require("pg");
const Minio = require("minio");
const { authenticate, optionalAuth } = require("./middleware/auth");
const authRouter = require("./routes/auth");
const wsManager = require("./services/websocket");
const { auditLogger, auditMiddleware } = require("./services/audit");

const app = express();
const server = http.createServer(app);
const PORT = process.env.PORT || 3001;

// ============================================================================
// DATABASE CONNECTION
// ============================================================================

const pool = new Pool({
  host: process.env.DB_HOST || "localhost",
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || "cia_analytics",
  user: process.env.DB_USER || "cia_admin",
  password: process.env.DB_PASSWORD || "cia_password",
});

pool.on("connect", () => {
  console.log("✅ Connected to PostgreSQL database");
});

pool.on("error", (err) => {
  console.error("❌ Unexpected error on PostgreSQL client", err);
  process.exit(-1);
});

// ============================================================================
// MINIO CONNECTION
// ============================================================================

const minioClient = new Minio.Client({
  endPoint: process.env.MINIO_ENDPOINT || "localhost",
  port: parseInt(process.env.MINIO_PORT || "9000"),
  useSSL: process.env.MINIO_USE_SSL === "true",
  accessKey: process.env.MINIO_ACCESS_KEY || "minioadmin",
  secretKey: process.env.MINIO_SECRET_KEY || "minioadmin",
});

const BUCKET_NAME = process.env.MINIO_BUCKET || "cia-files";

// Ensure bucket exists
(async () => {
  try {
    const exists = await minioClient.bucketExists(BUCKET_NAME);
    if (!exists) {
      await minioClient.makeBucket(BUCKET_NAME, "us-east-1");
      console.log(`✅ Created MinIO bucket: ${BUCKET_NAME}`);
    } else {
      console.log(`✅ Connected to MinIO bucket: ${BUCKET_NAME}`);
    }
  } catch (error) {
    console.error("❌ MinIO initialization error:", error);
  }
})();

// ============================================================================
// INITIALIZE SERVICES
// ============================================================================

// Initialize WebSocket manager
wsManager.initialize(server);

// Initialize audit logger
auditLogger.initialize(pool);

// ============================================================================
// MIDDLEWARE
// ============================================================================

app.use(cors());
app.use(express.json({ limit: "100mb" }));
app.use(express.urlencoded({ extended: true, limit: "100mb" }));

// Request logging
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} ${req.method} ${req.path}`);
  next();
});

// Audit middleware - adds req.audit() helper
app.use(auditMiddleware);

// Make pool, minio, and services available to routes
app.locals.pool = pool;
app.locals.minioClient = minioClient;
app.locals.bucketName = BUCKET_NAME;
app.locals.wsManager = wsManager;
app.locals.auditLogger = auditLogger;

// Auth routes (no auth required for these)
app.use("/api/auth", authRouter);

// ============================================================================
// ROUTES
// ============================================================================

// Legacy routes (keeping for backward compatibility during migration)
const projectsRouter = require("./routes/projects");
app.use("/api/projects", optionalAuth, projectsRouter);

// v2.0 Routes - Server-authority architecture
const filesRouter = require("./routes/files");
const annotationsRouter = require("./routes/annotations");
const viewsRouter = require("./routes/views");
const computeRouter = require("./routes/compute");

app.use("/api/files", optionalAuth, filesRouter);
app.use("/api/annotations", optionalAuth, annotationsRouter);
app.use("/api/views", optionalAuth, viewsRouter);
app.use("/api/compute", optionalAuth, computeRouter);

// Note: /api/files/:id/download is now handled by filesRouter

// ============================================================================
// HEALTH & STATUS ENDPOINTS
// ============================================================================

// Health check
app.get("/api/health", async (req, res) => {
  try {
    await pool.query("SELECT 1");
    res.json({
      status: "healthy",
      version: "2.0.0",
      architecture: "server-authority",
      services: {
        database: "connected",
        minio: "connected",
        websocket: {
          connected: true,
          clients: wsManager.getClientCount(),
        },
        audit: "active",
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    res.status(500).json({
      status: "unhealthy",
      error: error.message,
    });
  }
});

// Server status (more detailed)
app.get("/api/status", optionalAuth, async (req, res) => {
  try {
    const dbStatus = await pool.query(
      "SELECT NOW() as time, current_database() as db"
    );

    res.json({
      server: {
        version: "2.0.0",
        uptime: process.uptime(),
        memory: process.memoryUsage(),
        nodeVersion: process.version,
      },
      database: {
        connected: true,
        time: dbStatus.rows[0].time,
        name: dbStatus.rows[0].db,
      },
      websocket: {
        totalClients: wsManager.getClientCount(),
        rooms: wsManager.rooms.size,
      },
      audit: {
        bufferSize: auditLogger.buffer.length,
        orgConfigsCached: auditLogger.orgConfigs.size,
      },
    });
  } catch (error) {
    res.status(500).json({
      error: "Failed to get status",
      details: error.message,
    });
  }
});

// ============================================================================
// ERROR HANDLING
// ============================================================================

app.use((err, req, res, next) => {
  console.error("Error:", err);

  // Log errors to audit (for forensic level)
  if (req.audit && err.status !== 404) {
    req
      .audit({
        action: "error:unhandled",
        entityType: "request",
        entityId: null,
        details: {
          path: req.path,
          method: req.method,
          error: err.message,
        },
      })
      .catch(() => {}); // Don't let audit errors break error handling
  }

  res.status(err.status || 500).json({
    error: err.message || "Internal server error",
    ...(process.env.NODE_ENV === "development" && { stack: err.stack }),
  });
});

// ============================================================================
// GRACEFUL SHUTDOWN
// ============================================================================

async function shutdown(signal) {
  console.log(`\n${signal} received. Starting graceful shutdown...`);

  // Stop accepting new connections
  server.close(() => {
    console.log("HTTP server closed");
  });

  // Shutdown WebSocket
  wsManager.shutdown();
  console.log("WebSocket server closed");

  // Flush and shutdown audit logger
  await auditLogger.shutdown();

  // Close database pool
  await pool.end();
  console.log("Database pool closed");

  console.log("Graceful shutdown complete");
  process.exit(0);
}

process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT", () => shutdown("SIGINT"));

// ============================================================================
// START SERVER
// ============================================================================

server.listen(PORT, () => {
  console.log(`🚀 CIA Web API server v2.0 running on port ${PORT}`);
  console.log(`   Architecture: Server-Authority`);
  console.log(`   Environment: ${process.env.NODE_ENV || "development"}`);
  console.log(
    `   Database: ${process.env.DB_HOST || "localhost"}:${
      process.env.DB_PORT || 5432
    }`
  );
  console.log(
    `   MinIO: ${process.env.MINIO_ENDPOINT || "localhost"}:${
      process.env.MINIO_PORT || 9000
    }`
  );
  console.log(`   WebSocket: ws://localhost:${PORT}/ws`);
});

module.exports = { app, server, pool };
