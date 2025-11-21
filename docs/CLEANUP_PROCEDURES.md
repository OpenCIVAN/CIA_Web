# Cleanup & Reset Procedures

This document provides step-by-step instructions for cleaning up and resetting the CIA Web application during development. Use these procedures when you need to start fresh or troubleshoot persistent issues.

## Table of Contents

- [When to Use These Procedures](#when-to-use-these-procedures)
- [Quick Reference](#quick-reference)
- [Step 1: Clear Browser Storage](#step-1-clear-browser-storage)
- [Step 2: Reset Docker & Database](#step-2-reset-docker--database)
- [Step 3: Verify Clean State](#step-3-verify-clean-state)
- [Automated Reset Script](#automated-reset-script)
- [Troubleshooting](#troubleshooting)

---

## When to Use These Procedures

You should perform a cleanup when:

- 🔄 Switching between major feature branches
- 🐛 Encountering persistent data corruption issues
- 🧪 Starting a fresh test of the entire system
- 📦 Dataset metadata is out of sync with actual files
- 🗄️ Database schema changes require migration
- 🧹 General "nuclear option" when things are broken

---

## Quick Reference

**TL;DR for experienced users:**

```bash
# Backend
docker-compose down -v && docker-compose up --build -d

# Frontend (in browser console)
localStorage.clear(); sessionStorage.clear();
indexedDB.deleteDatabase('cia-datasets');
location.reload();
```

---

## Step 1: Clear Browser Storage

Browser storage includes localStorage, sessionStorage, and IndexedDB. All three need to be cleared for a complete reset.

### Option A: Browser DevTools (Recommended)

#### Chrome / Edge

1. Open DevTools: `F12` or `Right-click → Inspect`
2. Go to **Application** tab
3. In the left sidebar, expand **Storage**
4. Click **Clear site data** button at the bottom
5. OR manually clear each:
   - **Local Storage** → `https://localhost:8081` → Right-click → Clear
   - **Session Storage** → `https://localhost:8081` → Right-click → Clear
   - **IndexedDB** → Expand → `cia-datasets` → Right-click → Delete database

#### Firefox

1. Open DevTools: `F12` or `Right-click → Inspect`
2. Go to **Storage** tab
3. Clear each item:
   - **Local Storage** → `https://localhost:8081` → Right-click → Delete All
   - **Session Storage** → `https://localhost:8081` → Right-click → Delete All
   - **IndexedDB** → `cia-datasets` → Right-click → Delete database

### Option B: Console Commands (Fast Method)

Open browser console (`F12` → Console tab) and run:

```javascript
// Clear localStorage
localStorage.clear();
console.log("✅ localStorage cleared");

// Clear sessionStorage
sessionStorage.clear();
console.log("✅ sessionStorage cleared");

// Delete IndexedDB
indexedDB.deleteDatabase("cia-datasets").onsuccess = () => {
  console.log("✅ IndexedDB deleted");
};

console.log("🔄 Refresh the page to complete cleanup");

// Optional: Auto-refresh after 1 second
setTimeout(() => location.reload(), 1000);
```

### Option C: Nuclear Option (Complete Browser Cache Clear)

Use this if you want to clear everything, not just this site:

**Chrome:**

1. Press `Ctrl+Shift+Delete` (Windows/Linux) or `Cmd+Shift+Delete` (Mac)
2. Set time range to **Last hour** (or **All time** for complete wipe)
3. Check these items:
   - ✅ Browsing history
   - ✅ Cookies and other site data
   - ✅ Cached images and files
4. Click **Clear data**

**Firefox:**

1. Press `Ctrl+Shift+Delete` (Windows/Linux) or `Cmd+Shift+Delete` (Mac)
2. Set time range to **Everything**
3. Check these items:
   - ✅ Cookies
   - ✅ Cache
   - ✅ Site Preferences
4. Click **Clear Now**

---

## Step 2: Reset Docker & Database

This removes all database data, MinIO storage, and forces a clean rebuild.

### Commands

```bash
# Stop all containers and remove volumes
# WARNING: This deletes ALL data in PostgreSQL and MinIO!
docker-compose down -v

# Optional: Clean up dangling Docker images to free disk space
docker system prune -f

# Rebuild and restart containers
docker-compose up --build

# Or run in detached mode (background):
docker-compose up --build -d
```

### What Each Flag Does

| Flag      | Purpose                                               |
| --------- | ----------------------------------------------------- |
| `-v`      | Remove named volumes declared in `docker-compose.yml` |
| `--build` | Rebuild images before starting containers             |
| `-d`      | Run in detached mode (background)                     |
| `-f`      | Force removal without confirmation                    |

### What Gets Deleted

When you run `docker-compose down -v`:

- ✅ PostgreSQL database (all datasets, projects, sessions)
- ✅ MinIO object storage (all uploaded files)
- ✅ Redis cache (if configured)
- ✅ Container networks
- ❌ Docker images (kept for faster rebuilds)
- ❌ Source code (never touched)

---

## Step 3: Verify Clean State

After completing the reset, verify everything is clean:

### Check Browser Console

You should see fresh initialization logs:

```
✅ Y.js core initialized
📦 DatasetManager: Initialized with 0 datasets  ← Should be 0!
📋 ViewConfigurationManager: Initialized with 0 views  ← Should be 0!
```

### Check Browser Storage

**DevTools → Application (Chrome) / Storage (Firefox):**

- **Local Storage:** Should only have `cia_last_room`
- **Session Storage:** Should be empty or minimal
- **IndexedDB:** Either doesn't exist or shows no datasets

### Check Docker Logs

```bash
# View logs from all containers
docker-compose logs

# Or watch logs in real-time
docker-compose logs -f

# Check specific service
docker-compose logs postgres
docker-compose logs api
```

### Test Fresh Start

1. **Load a sample file:**
   - Click on Files panel
   - Click Skull.vtp (or another sample)
2. **Expected console output:**

   ```
   📂 Loading sample: /vtp_files/Skull.vtp
   📦 DatasetManager: Loading dataset "Skull.vtp"
   ✅ Sample loaded: Skull.vtp
   ```

3. **Click the dataset:**
   - Should create a ViewConfiguration
   - Should create an InstanceWindow
   - Should render the 3D model

---

## Automated Reset Script

Create this file to automate the process: `scripts/reset-dev.sh`

```bash
#!/bin/bash

echo "============================================"
echo "  CIA Web - Development Reset Script"
echo "============================================"
echo ""

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Confirmation prompt
read -p "⚠️  This will DELETE all data. Continue? (y/N): " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "Aborted."
    exit 1
fi

echo ""
echo "${YELLOW}🧹 Starting cleanup...${NC}"
echo ""

# Step 1: Docker cleanup
echo "🐳 Stopping Docker containers..."
docker-compose down -v

if [ $? -eq 0 ]; then
    echo "${GREEN}✅ Containers stopped and volumes removed${NC}"
else
    echo "${RED}❌ Failed to stop containers${NC}"
    exit 1
fi

# Step 2: Clean up Docker system
echo ""
echo "🗑️  Removing dangling Docker images..."
docker system prune -f

# Step 3: Rebuild
echo ""
echo "🔨 Rebuilding containers..."
docker-compose up --build -d

if [ $? -eq 0 ]; then
    echo "${GREEN}✅ Containers rebuilt and started${NC}"
else
    echo "${RED}❌ Failed to rebuild containers${NC}"
    exit 1
fi

echo ""
echo "============================================"
echo "  ${GREEN}✅ Docker reset complete!${NC}"
echo "============================================"
echo ""
echo "📝 ${YELLOW}Next steps (IMPORTANT):${NC}"
echo ""
echo "   1. Open browser DevTools (F12)"
echo "   2. Go to Console tab"
echo "   3. Run these commands:"
echo ""
echo "      localStorage.clear();"
echo "      sessionStorage.clear();"
echo "      indexedDB.deleteDatabase('cia-datasets');"
echo "      location.reload();"
echo ""
echo "   OR"
echo ""
echo "   Go to Application tab → Clear site data"
echo ""
echo "============================================"
echo ""
echo "🔗 Application should be running at:"
echo "   Frontend: https://localhost:8081"
echo "   API:      http://localhost:3001"
echo "   MinIO:    http://localhost:9001"
echo ""
echo "📊 Check logs with: docker-compose logs -f"
echo ""
```

### Make Script Executable

```bash
chmod +x scripts/reset-dev.sh
```

### Run the Script

```bash
./scripts/reset-dev.sh
```

---

## Troubleshooting

### Issue: "Cannot connect to Docker daemon"

**Cause:** Docker Desktop is not running

**Solution:**

```bash
# Start Docker Desktop, then try again
docker info  # Verify Docker is running
```

### Issue: "Port already in use"

**Cause:** Another process is using required ports (8081, 3001, 9000, etc.)

**Solution:**

```bash
# Find process using port 8081
lsof -i :8081  # Mac/Linux
netstat -ano | findstr :8081  # Windows

# Kill the process or change port in docker-compose.yml
```

### Issue: "Volume is in use"

**Cause:** Containers are still running or zombie containers exist

**Solution:**

```bash
# Force stop and remove everything
docker-compose down --remove-orphans -v
docker ps -a  # Should show no containers
docker volume ls  # Check for orphaned volumes
docker volume prune  # Remove orphaned volumes
```

### Issue: Browser storage won't clear

**Cause:** Service workers or extensions interfering

**Solution:**

```bash
# Unregister service workers
DevTools → Application → Service Workers → Unregister

# Or use incognito/private mode for testing
```

### Issue: "Global error: undefined" in console

**Cause:** React error boundary catching an error with missing stack trace

**Solution:**

Add this to browser console to get better error details:

```javascript
// Enhanced error logging
window.addEventListener("error", (event) => {
  console.log("📍 Global error details:", {
    message: event.message,
    error: event.error,
    filename: event.filename,
    lineno: event.lineno,
    colno: event.colno,
    stack: event.error?.stack,
  });
});

// Then reload and reproduce the error
location.reload();
```

### Issue: Changes not appearing after reset

**Cause:** Webpack cache or browser cache

**Solution:**

```bash
# Clear webpack cache
rm -rf node_modules/.cache

# Hard refresh browser
# Chrome: Ctrl+Shift+R
# Firefox: Ctrl+F5
```

---

## Additional Resources

- **Docker Documentation:** https://docs.docker.com/compose/
- **IndexedDB API:** https://developer.mozilla.org/en-US/docs/Web/API/IndexedDB_API
- **Service Workers:** https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API

---

## Notes for Contributors

- Always communicate with team before running these procedures on shared development environments
- These commands will delete ALL data - there is no undo
- Consider backing up important test data before cleanup
- The reset script is safe for local development only - never run on production
- If you add new storage mechanisms (Redis, etc.), update this document

---

**Last Updated:** 2025-11-21  
**Maintained By:** Beth  
**Questions?** Open an issue or ask in team chat