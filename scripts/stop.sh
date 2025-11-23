#!/bin/bash
# stop.sh - Stop all CIA Web services

echo "🛑 Stopping CIA Web services..."
echo ""

# Stop Docker services
echo "Stopping Docker containers..."
docker-compose down

echo ""
echo "✓ All services stopped"
echo ""
echo "To completely remove data volumes (reset database), run:"
echo "  docker-compose down -v"
