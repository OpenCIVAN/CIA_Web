# CIA Web: Backend Setup Guide for Beginners

A complete guide to setting up the backend infrastructure, written for developers who are new to backend development.

---

## Table of Contents
1. [Backend Basics](#backend-basics)
2. [What You're Building](#what-youre-building)
3. [Step-by-Step Setup](#step-by-step-setup)
4. [Database Design](#database-design)
5. [API Endpoints](#api-endpoints)
6. [File Storage](#file-storage)
7. [Testing Your Backend](#testing-your-backend)
8. [Common Issues](#common-issues)
9. [Production Deployment](#production-deployment)

---

## Backend Basics

### What is a Backend?

Think of a web application like a restaurant:
- **Frontend** = The dining room (what customers see and interact with)
- **Backend** = The kitchen (where the actual work happens)
- **Database** = The pantry and fridge (where ingredients are stored)
- **API** = The waiters (carry orders between dining room and kitchen)

### Why Do You Need a Backend?

Currently, CIA Web runs entirely in the browser. This works for demos, but has problems:

**Problem 1: Data disappears**
- When you close the browser, all datasets are gone
- Other users can't see your datasets unless you're both online

**Problem 2: No authentication**
- Anyone can see and modify anyone else's data
- No way to have private projects

**Problem 3: Large files are slow**
- Datasets are stored in browser's IndexedDB
- Syncing large files through Y.js is inefficient

**The Solution: Backend + Database**
- Store datasets on a server (they persist forever)
- Add user accounts and permissions
- Efficiently upload/download files
- Track history and enable undo/redo

---

## What You're Building

### The Complete System

```
┌──────────────────────────────────────────────────────┐
│                    Your Computer                     │
│  ┌────────────────────────────────────────────────┐  │
│  │  Browser (React App)                           │  │
│  │    - Shows UI                                  │  │
│  │    - Calls API                                 │  │
│  └────────────┬───────────────────────────────────┘  │
│               │ HTTP requests                         │
│               ↓                                       │
│  ┌────────────────────────────────────────────────┐  │
│  │  API Server (Node.js + Express)                │  │
│  │    - Handles requests                          │  │
│  │    - Manages file uploads                      │  │
│  │    - Talks to database                         │  │
│  └────────────┬───────────────────────────────────┘  │
│               │ SQL queries                           │
│               ↓                                       │
│  ┌────────────────────────────────────────────────┐  │
│  │  PostgreSQL Database                           │  │
│  │    - Stores metadata (filenames, dates, etc.)  │  │
│  │    - Manages users and permissions             │  │
│  └────────────────────────────────────────────────┘  │
│                                                       │
│  ┌────────────────────────────────────────────────┐  │
│  │  File Storage (local or S3)                    │  │
│  │    - Stores actual .vtp files                  │  │
│  │    - Binary data                               │  │
│  └────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────┘
```

### Services Explained

#### 1. PostgreSQL Database
**What it is:** A powerful, reliable database that stores structured data in tables.

**What it stores:**
- User accounts (username, email, password hash)
- Project metadata (name, created date, owner)
- Dataset metadata (filename, size, upload date)
- Annotations (position, text, tags)
- View configurations (camera, filters, widgets)

**What it DOESN'T store:**
- Actual .vtp files (too large for database)
- Binary data
- Images

#### 2. Node.js API Server
**What it is:** A JavaScript program that listens for HTTP requests and responds to them.

**What it does:**
- Receives requests from your React app
- Validates data (is this user allowed to do this?)
- Reads/writes to database
- Uploads/downloads files
- Sends responses back to React app

**Example request flow:**
```
Browser: "Hey API, upload this dataset"
   ↓
API: "OK, let me check your permission"
   ↓
API: "Save metadata to database"
   ↓
API: "Save file to storage"
   ↓
API: "Done! Here's the dataset ID"
   ↓
Browser: "Thanks! Show it to the user"
```

#### 3. File Storage
**What it is:** Where actual dataset files live.

**Two options:**
- **Local storage** (easy for development): Files stored on your server's hard drive
- **S3/MinIO** (better for production): Cloud storage service (like Dropbox for servers)

---

## Step-by-Step Setup

### Prerequisites

Install these first:
```bash
# Node.js (if you don't have it)
# macOS:
brew install node

# Windows:
# Download from https://nodejs.org/

# Docker (for running PostgreSQL)
# macOS:
brew install --cask docker

# Windows:
# Download from https://www.docker.com/products/docker-desktop/
```

### Step 1: Set Up Environment Variables

**What are environment variables?**
They're secret values (like passwords) that you don't put in your code. They're stored in a `.env` file.

**Create `.env` file in your project root:**

```bash
# .env
# IMPORTANT: Never commit this file to Git!

# Database credentials
POSTGRES_USER=cia_admin
POSTGRES_PASSWORD=super_secret_password_change_me
POSTGRES_DB=cia_analytics

# API Server
NODE_ENV=development
PORT=3001
ALLOWED_ORIGINS=http://localhost:8081,https://localhost:8081

# Database connection string
DATABASE_URL=postgresql://cia_admin:super_secret_password_change_me@localhost:5432/cia_analytics

# File storage (for now, use local storage)
STORAGE_TYPE=local
UPLOAD_DIR=./server/uploads

# Later: For production with S3/MinIO
# STORAGE_TYPE=s3
# S3_ENDPOINT=https://your-s3-endpoint.com
# S3_BUCKET=cia-web-datasets
# S3_ACCESS_KEY=your-access-key
# S3_SECRET_KEY=your-secret-key
```

**⚠️ CRITICAL:** Add `.env` to `.gitignore`:

```bash
# Add this line to .gitignore
.env
```

### Step 2: Set Up Docker Compose

**What is Docker?**
Docker lets you run services in "containers" - isolated environments that work the same on every computer.

**Why use it?**
- Don't need to install PostgreSQL directly
- Easy to start/stop database
- Works identically on Mac, Windows, Linux

**Create `docker-compose.yml`:** (You already have this!)

```yaml
version: '3.8'

services:
  postgres:
    image: postgres:15-alpine
    container_name: cia-postgres
    env_file:
      - .env
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./server/database/init.sql:/docker-entrypoint-initdb.d/init.sql
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U ${POSTGRES_USER} -d ${POSTGRES_DB}"]
      interval: 5s
      timeout: 5s
      retries: 5

  api:
    build:
      context: ./server
      dockerfile: Dockerfile
    container_name: cia-api
    env_file:
      - .env
    ports:
      - "3001:3001"
    volumes:
      - ./server/src:/app/src
      - ./server/uploads:/app/uploads
      - /app/node_modules
    depends_on:
      postgres:
        condition: service_healthy
    command: npm run dev

volumes:
  postgres_data:
```

**What this does:**
1. Creates a PostgreSQL database on port 5432
2. Automatically runs `init.sql` to create tables
3. Creates an API server on port 3001
4. Makes sure database is ready before starting API

### Step 3: Create Database Schema

**What is a schema?**
A blueprint for your database tables - what columns they have, what types of data, etc.

**Create `server/database/init.sql`:** (You already have this!)

This file runs automatically when PostgreSQL first starts. It creates all your tables.

**Understanding the tables:**

```sql
-- Sessions table
-- Stores collaborative sessions (like "Projects")
CREATE TABLE sessions (
    id UUID PRIMARY KEY,              -- Unique ID
    name VARCHAR(255) NOT NULL,       -- "My Brain Study"
    created_at TIMESTAMP,             -- When created
    settings JSONB                    -- Extra config (JSON format)
);

-- Datasets table
-- Stores metadata about uploaded files
CREATE TABLE datasets (
    id UUID PRIMARY KEY,
    session_id UUID REFERENCES sessions(id),  -- Which session owns this
    filename VARCHAR(255) NOT NULL,           -- "brain-scan.vtp"
    file_size BIGINT NOT NULL,               -- Size in bytes
    storage_key VARCHAR(500) NOT NULL,       -- Where file is stored
    metadata JSONB,                          -- Points, bounds, etc.
    uploaded_by VARCHAR(255),                -- User who uploaded
    created_at TIMESTAMP
);

-- Annotations table
-- 3D markers with notes
CREATE TABLE annotations (
    id UUID PRIMARY KEY,
    dataset_id UUID REFERENCES datasets(id),  -- Which dataset
    user_id VARCHAR(255) NOT NULL,            -- Who created it
    type VARCHAR(50) NOT NULL,                -- 'point', 'area', etc.
    position JSONB NOT NULL,                  -- [x, y, z]
    content JSONB,                            -- { text: "...", tags: [...] }
    created_at TIMESTAMP
);

-- View Configurations table
-- Saved camera/filter states
CREATE TABLE view_configurations (
    id UUID PRIMARY KEY,
    session_id UUID REFERENCES sessions(id),
    dataset_ids UUID[] NOT NULL,          -- Array of dataset IDs
    name VARCHAR(255),                    -- "Frontal view with filters"
    camera JSONB NOT NULL,                -- Camera position/rotation
    widgets JSONB,                        -- Active widgets
    annotation_filters JSONB,             -- Which annotations to show
    created_by VARCHAR(255),
    created_at TIMESTAMP
);
```

**What is JSONB?**
A special column type that stores JSON data efficiently. Perfect for flexible data like:
```json
{
  "position": [10, 20, 30],
  "bounds": [-100, 100, -100, 100, -100, 100],
  "customField": "anything you want"
}
```

### Step 4: Create API Server Structure

**File structure:**
```
server/
├── Dockerfile                 # How to build API container
├── package.json              # Dependencies
├── src/
│   ├── index.js              # Main server file
│   ├── routes/
│   │   ├── datasets.js       # Dataset endpoints
│   │   ├── sessions.js       # Session endpoints
│   │   ├── annotations.js    # Annotation endpoints
│   │   └── views.js          # View configuration endpoints
│   ├── middleware/
│   │   ├── auth.js           # Check if user is logged in
│   │   └── upload.js         # Handle file uploads
│   └── utils/
│       ├── db.js             # Database helper functions
│       └── storage.js        # File storage helper
├── database/
│   └── init.sql              # Database schema
└── uploads/                  # Where uploaded files go (local storage)
```

### Step 5: Create the Main API Server

**Create `server/src/index.js`:**

```javascript
// server/src/index.js
const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3001;

// ============================================================
// DATABASE CONNECTION
// ============================================================

// Create a connection pool to PostgreSQL
// A "pool" manages multiple connections efficiently
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 20,                    // Maximum 20 connections
  idleTimeoutMillis: 30000,   // Close idle connections after 30s
  connectionTimeoutMillis: 2000, // Timeout if can't connect in 2s
});

// Test the connection
pool.query('SELECT NOW()', (err, res) => {
  if (err) {
    console.error('❌ Database connection failed:', err);
    process.exit(1); // Exit if database is unreachable
  }
  console.log('✅ Database connected at:', res.rows[0].now);
});

// Export pool so routes can use it
module.exports = { pool };

// ============================================================
// MIDDLEWARE
// ============================================================

// CORS: Allow requests from your React app
app.use(cors({
  origin: process.env.ALLOWED_ORIGINS?.split(',') || '*',
  credentials: true
}));

// Parse JSON request bodies
app.use(express.json());

// Log all requests (helpful for debugging)
app.use((req, res, next) => {
  console.log(`${req.method} ${req.path}`);
  next();
});

// ============================================================
// ROUTES
// ============================================================

// Health check - test if server is running
app.get('/health', (req, res) => {
  res.json({ 
    status: 'healthy', 
    timestamp: new Date().toISOString(),
    database: 'connected'
  });
});

// Mount route modules
const datasetRoutes = require('./routes/datasets');
const sessionRoutes = require('./routes/sessions');
const annotationRoutes = require('./routes/annotations');

app.use('/api/datasets', datasetRoutes);
app.use('/api/sessions', sessionRoutes);
app.use('/api/annotations', annotationRoutes);

// ============================================================
// ERROR HANDLING
// ============================================================

// 404 - Route not found
app.use((req, res) => {
  res.status(404).json({
    error: 'Route not found',
    path: req.path
  });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(err.status || 500).json({
    error: {
      message: err.message || 'Internal server error',
      ...(process.env.NODE_ENV === 'development' && { 
        stack: err.stack 
      })
    }
  });
});

// ============================================================
// START SERVER
// ============================================================

app.listen(PORT, () => {
  console.log(`🚀 CIA Web API server running on port ${PORT}`);
  console.log(`📊 Environment: ${process.env.NODE_ENV}`);
  console.log(`🌐 CORS enabled for: ${process.env.ALLOWED_ORIGINS}`);
  console.log(`📁 Storage type: ${process.env.STORAGE_TYPE || 'local'}`);
});
```

### Step 6: Create Your First Route (Datasets)

**Create `server/src/routes/datasets.js`:**

```javascript
// server/src/routes/datasets.js
const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs').promises;
const { pool } = require('../index');

// ============================================================
// FILE UPLOAD CONFIGURATION
// ============================================================

// Create uploads directory if it doesn't exist
const uploadDir = process.env.UPLOAD_DIR || './uploads';
fs.mkdir(uploadDir, { recursive: true }).catch(console.error);

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    // Generate unique filename
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 500 * 1024 * 1024 // 500 MB max
  },
  fileFilter: (req, file, cb) => {
    // Only accept .vtp files
    if (path.extname(file.originalname).toLowerCase() === '.vtp') {
      cb(null, true);
    } else {
      cb(new Error('Only .vtp files are allowed'));
    }
  }
});

// ============================================================
// ROUTES
// ============================================================

/**
 * GET /api/datasets
 * List all datasets (optionally filtered by session)
 */
router.get('/', async (req, res, next) => {
  try {
    const { session_id } = req.query;
    
    let query = 'SELECT * FROM datasets';
    const params = [];
    
    if (session_id) {
      query += ' WHERE session_id = $1';
      params.push(session_id);
    }
    
    query += ' ORDER BY created_at DESC';
    
    const result = await pool.query(query, params);
    
    res.json({
      datasets: result.rows,
      count: result.rows.length
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/datasets/:id
 * Get a specific dataset by ID
 */
router.get('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    
    const result = await pool.query(
      'SELECT * FROM datasets WHERE id = $1',
      [id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Dataset not found' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/datasets
 * Upload a new dataset
 */
router.post('/', upload.single('file'), async (req, res, next) => {
  try {
    // File info from multer
    const { file } = req;
    if (!file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }
    
    // Metadata from request body
    const {
      session_id,
      uploaded_by,
      metadata
    } = req.body;
    
    // Parse metadata if it's a string
    const parsedMetadata = typeof metadata === 'string' 
      ? JSON.parse(metadata) 
      : metadata;
    
    // Insert into database
    const result = await pool.query(
      `INSERT INTO datasets (
        session_id, 
        filename, 
        file_size, 
        storage_key, 
        metadata, 
        uploaded_by
      ) VALUES ($1, $2, $3, $4, $5, $6) 
      RETURNING *`,
      [
        session_id || null,
        file.originalname,
        file.size,
        file.filename, // Storage key (where it's saved)
        JSON.stringify(parsedMetadata || {}),
        uploaded_by || 'anonymous'
      ]
    );
    
    console.log('✅ Dataset uploaded:', result.rows[0].id);
    
    res.status(201).json({
      message: 'Dataset uploaded successfully',
      dataset: result.rows[0]
    });
    
  } catch (error) {
    // Clean up file if database insert failed
    if (req.file) {
      fs.unlink(req.file.path).catch(console.error);
    }
    next(error);
  }
});

/**
 * GET /api/datasets/:id/download
 * Download dataset file
 */
router.get('/:id/download', async (req, res, next) => {
  try {
    const { id } = req.params;
    
    // Get dataset from database
    const result = await pool.query(
      'SELECT * FROM datasets WHERE id = $1',
      [id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Dataset not found' });
    }
    
    const dataset = result.rows[0];
    const filePath = path.join(uploadDir, dataset.storage_key);
    
    // Check if file exists
    try {
      await fs.access(filePath);
    } catch {
      return res.status(404).json({ error: 'File not found on server' });
    }
    
    // Send file
    res.download(filePath, dataset.filename);
    
  } catch (error) {
    next(error);
  }
});

/**
 * DELETE /api/datasets/:id
 * Delete a dataset
 */
router.delete('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    
    // Get dataset to find file
    const result = await pool.query(
      'SELECT * FROM datasets WHERE id = $1',
      [id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Dataset not found' });
    }
    
    const dataset = result.rows[0];
    
    // Delete from database first
    await pool.query('DELETE FROM datasets WHERE id = $1', [id]);
    
    // Then delete file
    const filePath = path.join(uploadDir, dataset.storage_key);
    await fs.unlink(filePath).catch(console.error);
    
    console.log('✅ Dataset deleted:', id);
    
    res.json({ message: 'Dataset deleted successfully' });
    
  } catch (error) {
    next(error);
  }
});

module.exports = router;
```

### Step 7: Create Package.json

**Create `server/package.json`:**

```json
{
  "name": "cia-web-server",
  "version": "1.0.0",
  "description": "Backend API for CIA Web collaborative analytics platform",
  "main": "src/index.js",
  "scripts": {
    "dev": "nodemon src/index.js",
    "start": "node src/index.js"
  },
  "dependencies": {
    "express": "^4.18.2",
    "pg": "^8.11.0",
    "cors": "^2.8.5",
    "multer": "^1.4.5-lts.1",
    "dotenv": "^16.3.1",
    "uuid": "^9.0.0"
  },
  "devDependencies": {
    "nodemon": "^3.0.1"
  }
}
```

### Step 8: Create Dockerfile

**Create `server/Dockerfile`:**

```dockerfile
FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy source code
COPY . .

# Expose port
EXPOSE 3001

# Start server
CMD ["npm", "run", "dev"]
```

### Step 9: Install Dependencies

```bash
cd server
npm install
cd ..
```

### Step 10: Start Everything!

**Option A: Use the tmux script** (starts everything at once)

```bash
chmod +x start-all-servers.sh
./start-all-servers.sh
```

**Option B: Start manually** (4 terminals)

```bash
# Terminal 1: Docker (Database + API)
docker-compose up

# Terminal 2: Y.js Server
node server.js

# Terminal 3: LiveKit Token Server
node token-server.js

# Terminal 4: LiveKit Server
livekit-server --dev

# Terminal 5: React App
npm start
```

---

## Database Design

### Understanding Relationships

**One-to-Many:**
```
One Session → Many Datasets
One Dataset → Many Annotations
```

**Many-to-Many:**
```
One View Configuration → Many Datasets (array of IDs)
One User → Many Sessions (through permissions table)
```

### Why Use UUIDs?

**UUID** = Universally Unique Identifier

```
Example: 550e8400-e29b-41d4-a716-446655440000
```

**Advantages:**
- Globally unique (no collisions)
- Can generate on client or server
- No sequential pattern (security)
- Merge databases without conflicts

**How to generate:**
```sql
-- PostgreSQL generates automatically
id UUID PRIMARY KEY DEFAULT uuid_generate_v4()
```

```javascript
// Node.js
const { v4: uuidv4 } = require('uuid');
const id = uuidv4();
```

### Indexes for Performance

Indexes make queries fast:

```sql
-- Find datasets by session (fast!)
CREATE INDEX idx_datasets_session ON datasets(session_id);

-- Find annotations by dataset (fast!)
CREATE INDEX idx_annotations_dataset ON annotations(dataset_id);
```

**Without index:** Database scans every row (slow)
**With index:** Database jumps directly to matching rows (fast)

---

## API Endpoints

### Complete API Reference

#### Sessions

```
GET    /api/sessions           - List all sessions
GET    /api/sessions/:id       - Get session details
POST   /api/sessions           - Create new session
PUT    /api/sessions/:id       - Update session
DELETE /api/sessions/:id       - Delete session
```

#### Datasets

```
GET    /api/datasets                  - List all datasets
GET    /api/datasets?session_id=...   - List datasets in session
GET    /api/datasets/:id              - Get dataset metadata
POST   /api/datasets                  - Upload new dataset
GET    /api/datasets/:id/download     - Download dataset file
DELETE /api/datasets/:id              - Delete dataset
```

#### Annotations

```
GET    /api/annotations?dataset_id=...  - List annotations for dataset
GET    /api/annotations/:id             - Get annotation
POST   /api/annotations                 - Create annotation
PUT    /api/annotations/:id             - Update annotation
DELETE /api/annotations/:id             - Delete annotation
```

#### View Configurations

```
GET    /api/views                   - List all views
GET    /api/views/:id               - Get view
POST   /api/views                   - Create view
PUT    /api/views/:id               - Update view
DELETE /api/views/:id               - Delete view
POST   /api/views/:id/duplicate     - Duplicate view
```

### Example API Calls from React

**Upload a dataset:**

```javascript
// In your React app
async function uploadDataset(file, sessionId, userId) {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('session_id', sessionId);
  formData.append('uploaded_by', userId);
  
  // Add metadata
  formData.append('metadata', JSON.stringify({
    pointCount: 50000,
    bounds: [-100, 100, -100, 100, -100, 100]
  }));
  
  const response = await fetch('http://localhost:3001/api/datasets', {
    method: 'POST',
    body: formData
  });
  
  const data = await response.json();
  console.log('Dataset uploaded:', data.dataset);
  return data.dataset;
}
```

**Download a dataset:**

```javascript
async function downloadDataset(datasetId) {
  const response = await fetch(
    `http://localhost:3001/api/datasets/${datasetId}/download`
  );
  
  const blob = await response.blob();
  const url = URL.createObjectURL(blob);
  
  // Can now load into VTK
  const reader = vtkXMLPolyDataReader.newInstance();
  reader.parseAsArrayBuffer(await blob.arrayBuffer());
  return reader.getOutputData();
}
```

---

## Testing Your Backend

### Using cURL

**Test health check:**
```bash
curl http://localhost:3001/health
```

**List datasets:**
```bash
curl http://localhost:3001/api/datasets
```

**Upload dataset:**
```bash
curl -X POST http://localhost:3001/api/datasets \
  -F "file=@path/to/your/file.vtp" \
  -F "session_id=your-session-id" \
  -F "uploaded_by=test-user"
```

### Using Postman

1. Download [Postman](https://www.postman.com/downloads/)
2. Create new request
3. Set method (GET, POST, etc.)
4. Enter URL: `http://localhost:3001/api/datasets`
5. For POST with files:
   - Go to "Body" tab
   - Select "form-data"
   - Add key "file" with type "File"
   - Choose your .vtp file
6. Click "Send"

### Using Browser Console

```javascript
// Test from browser console
fetch('http://localhost:3001/health')
  .then(r => r.json())
  .then(console.log);
```

---

## Common Issues

### Issue: "ECONNREFUSED" when connecting to database

**Problem:** API can't connect to PostgreSQL

**Solutions:**
1. Make sure Docker is running: `docker ps`
2. Check if postgres container is up: `docker-compose ps`
3. Verify DATABASE_URL in .env matches docker-compose settings
4. Try restarting: `docker-compose restart postgres`

### Issue: "port 5432 already in use"

**Problem:** Another PostgreSQL is running

**Solutions:**
```bash
# Find what's using port 5432
lsof -i :5432

# Kill it or change port in docker-compose.yml
ports:
  - "5433:5432"  # Use 5433 externally
```

### Issue: "relation does not exist"

**Problem:** Tables weren't created

**Solutions:**
1. Check if init.sql ran: `docker logs cia-postgres`
2. Connect to database and check:
```bash
docker exec -it cia-postgres psql -U cia_admin -d cia_analytics
\dt  # List tables
```
3. If tables missing, recreate database:
```bash
docker-compose down -v  # Delete volumes
docker-compose up       # Recreate everything
```

### Issue: "File upload fails"

**Problem:** Missing uploads directory or permission issues

**Solutions:**
```bash
# Create directory
mkdir -p server/uploads

# Check permissions
ls -la server/uploads

# Fix permissions if needed
chmod 755 server/uploads
```

---

## Production Deployment

### Checklist Before Going Live

- [ ] Change all default passwords in .env
- [ ] Use real PostgreSQL (not Docker) or managed database (AWS RDS, etc.)
- [ ] Set up S3 for file storage (not local files)
- [ ] Add authentication (JWT tokens)
- [ ] Add rate limiting (prevent abuse)
- [ ] Add input validation (prevent SQL injection)
- [ ] Set up HTTPS (Let's Encrypt)
- [ ] Configure CORS properly (specific origins, not *)
- [ ] Add logging (Winston, Morgan)
- [ ] Set up monitoring (Sentry for errors)
- [ ] Create database backups
- [ ] Add health checks
- [ ] Test disaster recovery

### AWS Deployment Example

**Services needed:**
1. **EC2** or **ECS** - Run your API server
2. **RDS PostgreSQL** - Managed database
3. **S3** - File storage
4. **CloudFront** - CDN for fast file downloads
5. **Route 53** - DNS
6. **Certificate Manager** - SSL certificates

**Rough costs** (as of 2024):
- Small setup: ~$50/month
- Medium setup: ~$200/month
- Large setup: ~$1000+/month

---

## Next Steps

### Phase 1: Basic CRUD (You are here)
- ✅ Database setup
- ✅ Upload/download datasets
- ✅ List/get datasets

### Phase 2: Additional Endpoints
- [ ] Sessions CRUD
- [ ] Annotations CRUD
- [ ] View configurations CRUD
- [ ] User management

### Phase 3: Authentication
- [ ] User registration
- [ ] Login/logout
- [ ] JWT tokens
- [ ] Password hashing (bcrypt)
- [ ] Protected routes

### Phase 4: Advanced Features
- [ ] File deduplication (same file uploaded once)
- [ ] Compression (gzip datasets)
- [ ] Pagination (don't load 1000 datasets at once)
- [ ] Search and filtering
- [ ] Sharing/permissions
- [ ] Activity logs

### Phase 5: Production Ready
- [ ] S3 integration
- [ ] Database migrations (handle schema changes)
- [ ] Error monitoring
- [ ] Performance optimization
- [ ] Automated tests
- [ ] CI/CD pipeline

---

## Resources

### Learning SQL
- [PostgreSQL Tutorial](https://www.postgresqltutorial.com/) - Excellent tutorials
- [SQLBolt](https://sqlbolt.com/) - Interactive SQL lessons

### Learning Node.js
- [Express.js Guide](https://expressjs.com/en/guide/routing.html) - Official docs
- [Node.js Best Practices](https://github.com/goldbergyoni/nodebestpractices) - Production tips

### Database Design
- [Database Design for Mere Mortals](https://www.amazon.com/Database-Design-Mere-Mortals-Hands/dp/0321884493) - Book
- [DB Diagram Tool](https://dbdiagram.io/) - Visualize your schema

### API Design
- [REST API Tutorial](https://restfulapi.net/) - Best practices
- [HTTP Status Codes](https://httpstatuses.com/) - What each code means

Good luck with your backend! Start simple, test everything, and gradually add features. You've got this! 🚀