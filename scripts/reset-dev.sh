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