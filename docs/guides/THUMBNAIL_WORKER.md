# Thumbnail Worker

The thumbnail worker generates server-side thumbnails for file visualizations using a headless browser. This ensures thumbnails accurately represent the actual visualization content and cannot be spoofed by clients.

## Overview

When a file is uploaded or a new version is created, a thumbnail generation job is queued. The thumbnail worker:

1. Picks up jobs from the Redis `thumbnail` queue
2. Launches a headless Chromium browser via Playwright
3. Navigates to the embed page (`/embed.html`) with the file/view ID
4. Waits for the visualization to render
5. Captures a screenshot and optimizes it with Sharp
6. Uploads the thumbnail to MinIO storage
7. Reports completion back to the API

## Architecture

```
┌─────────────┐     ┌─────────┐     ┌──────────────────┐
│ File Upload │────▶│  Redis  │────▶│ Thumbnail Worker │
└─────────────┘     │  Queue  │     │   (Playwright)   │
                    └─────────┘     └────────┬─────────┘
                                             │
                    ┌─────────┐              │
                    │  MinIO  │◀─────────────┤
                    │ Storage │              │
                    └─────────┘              │
                                             ▼
                    ┌─────────┐     ┌─────────────────┐
                    │   API   │◀────│ Callback Result │
                    └─────────┘     └─────────────────┘
```

## Running with Docker (Recommended)

The thumbnail worker is included in the standard Docker Compose setup:

```bash
# Start all services including thumbnail worker
./scripts/start.sh

# Or manually
docker-compose up -d thumbnail-worker
```

The worker is configured via environment variables in `docker-compose.yml`:

```yaml
thumbnail-worker:
  environment:
    REDIS_HOST: redis
    REDIS_PORT: 6379
    MINIO_ENDPOINT: minio
    MINIO_PORT: 9000
    MINIO_ACCESS_KEY: minioadmin
    MINIO_SECRET_KEY: minioadmin
    MINIO_BUCKET: cia-files
    APP_BASE_URL: http://host.docker.internal:8081
    API_URL: http://api:3001
```

## Running Locally (Development)

For local development without Docker:

```bash
cd workers/thumbnail-node

# Install dependencies
npm install

# Install Playwright browsers (Chromium only)
npx playwright install chromium

# Set environment variables
export REDIS_HOST=localhost
export REDIS_PORT=6379
export MINIO_ENDPOINT=localhost
export MINIO_PORT=9000
export MINIO_ACCESS_KEY=minioadmin
export MINIO_SECRET_KEY=minioadmin
export MINIO_BUCKET=cia-files
export APP_BASE_URL=http://localhost:8081
export API_URL=http://localhost:3001

# Start the worker
npm start
```

## Configuration

| Environment Variable | Description                  | Default                 |
| -------------------- | ---------------------------- | ----------------------- |
| `REDIS_HOST`         | Redis server hostname        | `localhost`             |
| `REDIS_PORT`         | Redis server port            | `6379`                  |
| `MINIO_ENDPOINT`     | MinIO server hostname        | `localhost`             |
| `MINIO_PORT`         | MinIO server port            | `9000`                  |
| `MINIO_ACCESS_KEY`   | MinIO access key             | `minioadmin`            |
| `MINIO_SECRET_KEY`   | MinIO secret key             | `minioadmin`            |
| `MINIO_BUCKET`       | MinIO bucket for thumbnails  | `cia-files`             |
| `MINIO_SECURE`       | Use SSL for MinIO            | `false`                 |
| `APP_BASE_URL`       | Frontend URL for rendering   | `http://localhost:8081` |
| `API_URL`            | API server URL for callbacks | `http://localhost:3001` |

## Thumbnail Settings

The worker captures thumbnails with these default settings:

- **Dimensions**: 400x300 pixels (rendered at 2x for retina)
- **Format**: WebP
- **Quality**: 80%
- **Timeout**: 30 seconds per capture
- **Concurrency**: 2 simultaneous captures

These can be adjusted in `worker.js`:

```javascript
const config = {
  thumbnail: {
    width: 400,
    height: 300,
    quality: 80,
    timeout: 30000,
  },
  queue: {
    concurrency: 2,
  },
};
```

## API Endpoints

### Queue a Thumbnail Job

```http
POST /api/views/:viewId/thumbnail/queue
Content-Type: application/json

{
  "priority": 5  // 1-10, higher = more urgent
}
```

### Worker Callback (Internal)

```http
POST /api/thumbnails/callback
Content-Type: application/json

{
  "jobId": "...",
  "success": true,
  "storageKey": "thumbnails/view-id/thumbnail.webp",
  "format": "webp",
  "width": 400,
  "height": 300
}
```

## Troubleshooting

### Thumbnails Not Generating

1. Check if Redis is running: `docker exec cia-redis redis-cli ping`
2. Check worker logs: `docker logs cia-thumbnail-worker`
3. Verify the frontend is accessible from the worker's `APP_BASE_URL`

### Chromium Crashes

The worker needs adequate shared memory. In Docker, this is handled by `shm_size: '2gb'`. For local runs, ensure your system has sufficient resources.

### CORS Issues

The embed page (`/embed.html`) is a separate entry point that doesn't require authentication. Ensure it's being built and served correctly:

```bash
# Check webpack build includes embed
ls dist/*.bundle.js
# Should show: main.bundle.js, embed.bundle.js
```

### Missing Playwright Browsers

If you see browser launch errors:

```bash
cd workers/thumbnail-node
npx playwright install chromium
```

## Security Considerations

- Thumbnails are generated server-side to prevent clients from uploading fake/misleading thumbnails
- The embed page renders without authentication for the worker
- The callback endpoint should be protected with a shared secret in production
- The worker runs as a non-root user in Docker for security

## Related Files

- `workers/thumbnail-node/worker.js` - Main worker code
- `workers/thumbnail-node/Dockerfile` - Docker build configuration
- `server/src/services/thumbnailService.js` - Job queue service
- `server/src/routes/thumbnails.js` - API endpoints
- `src/embed.js` - Embed entry point for rendering
- `src/embed.html` - Embed HTML template
