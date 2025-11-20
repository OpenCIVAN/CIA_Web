// server/src/routes/datasets.js
const express = require("express");
const router = express.Router();
const multer = require("multer");
const { pool } = require("../index");
const { v4: uuidv4 } = require("uuid");
const AWS = require("aws-sdk");
const crypto = require("crypto");

// Configure AWS S3
const s3 = new AWS.S3({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_REGION,
});

const BUCKET_NAME = process.env.AWS_S3_BUCKET_NAME;

// Configure multer for file uploads (keep in memory, not disk)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 500 * 1024 * 1024, // 500MB limit
  },
});

/**
 * POST /api/datasets/upload
 * Upload a new dataset file to S3
 */
router.post("/upload", upload.single("file"), async (req, res, next) => {
  try {
    const { originalname, buffer, mimetype, size } = req.file;
    const { uploadedBy } = req.body;

    // Calculate hash for deduplication
    const hash = crypto.createHash("sha256").update(buffer).digest("hex");

    console.log(
      `📦 Received upload: ${originalname} (${(size / 1024 / 1024).toFixed(2)}MB, hash: ${hash.substring(0, 16)}...)`
    );

    // Use the fixed session ID for development
    const defaultSessionId = "00000000-0000-0000-0000-000000000001";

    // Check if this file already exists in this session
    const existingDataset = await pool.query(
      `SELECT * FROM datasets 
       WHERE session_id = $1 AND metadata->>'hash' = $2`,
      [defaultSessionId, hash]
    );

    if (existingDataset.rows.length > 0) {
      const existing = existingDataset.rows[0];
      console.log(`✓ File already exists: ${existing.id} (deduplicated)`);

      return res.status(200).json({
        dataset: existing,
        deduplicated: true,
      });
    }

    // File doesn't exist yet - upload to S3
    const datasetId = uuidv4();
    const s3Key = `datasets/${datasetId}/${originalname}`;

    console.log(`☁️  Uploading to S3: ${s3Key}`);

    // Upload to S3
    const s3Params = {
      Bucket: BUCKET_NAME,
      Key: s3Key,
      Body: buffer,
      ContentType: mimetype,
      Metadata: {
        originalname: originalname,
        uploadedby: uploadedBy || "anonymous",
        hash: hash,
      },
    };

    await s3.upload(s3Params).promise();

    console.log(`✅ S3 upload successful: ${s3Key}`);

    // Create session if it doesn't exist
    await pool.query(
      `INSERT INTO sessions (id, name) VALUES ($1, $2) ON CONFLICT (id) DO NOTHING`,
      [defaultSessionId, "Default Development Session"]
    );

    // Insert database record with S3 key
    const result = await pool.query(
      `INSERT INTO datasets 
       (id, session_id, filename, file_size, mime_type, storage_key, uploaded_by, metadata)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING *`,
      [
        datasetId,
        defaultSessionId,
        originalname,
        size,
        mimetype,
        s3Key, // Now storing S3 key instead of local path
        uploadedBy || "anonymous",
        JSON.stringify({ hash, s3Bucket: BUCKET_NAME }),
      ]
    );

    console.log(`✅ Database record created: ${datasetId}`);

    res.status(201).json({ dataset: result.rows[0] });
  } catch (error) {
    console.error("❌ Upload error:", error);
    next(error);
  }
});

/**
 * GET /api/test-s3
 * Test S3 connection (for debugging)
 * IMPORTANT: This must come BEFORE /:datasetId route
 */
router.get("/test-s3", async (req, res, next) => {
  try {
    const params = {
      Bucket: BUCKET_NAME,
    };

    const data = await s3.listObjectsV2(params).promise();

    res.json({
      success: true,
      message: "✅ S3 connection successful!",
      bucketName: BUCKET_NAME,
      region: process.env.AWS_REGION,
      fileCount: data.Contents.length,
      files: data.Contents.map((file) => ({
        key: file.Key,
        size: file.Size,
        lastModified: file.LastModified,
      })),
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "❌ S3 connection failed",
      error: error.message,
      bucketName: BUCKET_NAME,
      region: process.env.AWS_REGION,
    });
  }
});

/**
 * GET /api/datasets/:datasetId
 * Get dataset metadata
 */
router.get("/:datasetId", async (req, res, next) => {
  try {
    const { datasetId } = req.params;

    const result = await pool.query("SELECT * FROM datasets WHERE id = $1", [
      datasetId,
    ]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Dataset not found" });
    }

    res.json({ dataset: result.rows[0] });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/datasets/:datasetId/download
 * Generate a presigned URL for downloading from S3
 */
router.get("/:datasetId/download", async (req, res, next) => {
  try {
    const { datasetId } = req.params;

    // Get file information from database
    const result = await pool.query(
      "SELECT filename, storage_key, mime_type FROM datasets WHERE id = $1",
      [datasetId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Dataset not found" });
    }

    const { filename, storage_key, mime_type } = result.rows[0];

    // Generate presigned URL (valid for 1 hour)
    const presignedUrl = s3.getSignedUrl("getObject", {
      Bucket: BUCKET_NAME,
      Key: storage_key,
      Expires: 3600, // 1 hour
      ResponseContentDisposition: `attachment; filename="${filename}"`,
      ResponseContentType: mime_type || "application/octet-stream",
    });

    console.log(`🔗 Generated presigned URL for: ${filename}`);

    res.json({
      downloadUrl: presignedUrl,
      filename: filename,
      expiresIn: 3600,
    });
  } catch (error) {
    console.error("❌ Download error:", error);
    next(error);
  }
});

/**
 * GET /api/datasets/session/:sessionId
 * List all datasets for a session
 */
router.get("/session/:sessionId", async (req, res, next) => {
  try {
    const { sessionId } = req.params;

    const result = await pool.query(
      `SELECT id, filename, file_size, mime_type, metadata, uploaded_at, uploaded_by
       FROM datasets 
       WHERE session_id = $1 
       ORDER BY uploaded_at DESC`,
      [sessionId]
    );

    res.json({ datasets: result.rows });
  } catch (error) {
    next(error);
  }
});

/**
 * DELETE /api/datasets/:datasetId
 * Delete a dataset (removes from both S3 and database)
 */
router.delete("/:datasetId", async (req, res, next) => {
  try {
    const { datasetId } = req.params;

    // Get storage key before deleting
    const result = await pool.query(
      "SELECT storage_key FROM datasets WHERE id = $1",
      [datasetId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Dataset not found" });
    }

    const { storage_key } = result.rows[0];

    // Delete from S3
    await s3
      .deleteObject({
        Bucket: BUCKET_NAME,
        Key: storage_key,
      })
      .promise();

    // Delete from database (cascade will handle related records)
    await pool.query("DELETE FROM datasets WHERE id = $1", [datasetId]);

    console.log(`✅ Deleted dataset: ${datasetId}`);

    res.json({ success: true, message: "Dataset deleted" });
  } catch (error) {
    console.error("❌ Delete error:", error);
    next(error);
  }
});

/**
 * GET /api/test-s3
 * Test S3 connection (for debugging)
 */
router.get("/test-s3", async (req, res, next) => {
  try {
    const params = {
      Bucket: BUCKET_NAME,
    };

    const data = await s3.listObjectsV2(params).promise();

    res.json({
      success: true,
      message: "✅ S3 connection successful!",
      bucketName: BUCKET_NAME,
      region: process.env.AWS_REGION,
      fileCount: data.Contents.length,
      files: data.Contents.map((file) => ({
        key: file.Key,
        size: file.Size,
        lastModified: file.LastModified,
      })),
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "❌ S3 connection failed",
      error: error.message,
      bucketName: BUCKET_NAME,
      region: process.env.AWS_REGION,
    });
  }
});

module.exports = router;