#!/bin/bash
# reset-database.sh
# Wipes the database and restarts with fresh migrations and seed data

set -e  # Exit on error

echo "============================================"
echo "  Database Reset Script"
echo "============================================"
echo ""
echo "⚠️  WARNING: This will DELETE ALL DATA in the database!"
echo ""
read -p "Are you sure you want to continue? (yes/no): " confirm

if [ "$confirm" != "yes" ]; then
    echo "Cancelled."
    exit 0
fi

echo ""
echo "🛑 Stopping Docker containers..."
docker compose down

echo ""
echo "🗑️  Removing database volumes (this deletes all data)..."
docker volume rm cia_web_postgres_data 2>/dev/null || echo "   Volume already removed or doesn't exist"
docker volume rm cia_web_minio_data 2>/dev/null || echo "   Volume already removed or doesn't exist"

echo ""
echo "🚀 Starting containers with fresh database..."
docker compose up -d

echo ""
echo "⏳ Waiting for PostgreSQL to be ready..."
sleep 5

# Wait for postgres to be healthy
max_attempts=30
attempt=0
while [ $attempt -lt $max_attempts ]; do
    if docker compose exec -T postgres pg_isready -U cia_admin -d cia_analytics > /dev/null 2>&1; then
        echo "✅ PostgreSQL is ready!"
        break
    fi
    attempt=$((attempt + 1))
    echo "   Waiting... ($attempt/$max_attempts)"
    sleep 2
done

if [ $attempt -eq $max_attempts ]; then
    echo "❌ PostgreSQL failed to start after $max_attempts attempts"
    exit 1
fi

echo ""
echo "📊 Checking database tables..."
docker compose exec -T postgres psql -U cia_admin -d cia_analytics -c "\dt" 2>/dev/null || echo "   Migrations will run on first API startup"

echo ""
echo "🔍 Checking for sample files..."
sample_count=$(docker compose exec -T postgres psql -U cia_admin -d cia_analytics -t -c "SELECT COUNT(*) FROM datasets WHERE uploaded_by = 'system';" 2>/dev/null | xargs || echo "0")
echo "   Found $sample_count sample file(s)"

echo ""
echo "============================================"
echo "✅ Database reset complete!"
echo "============================================"
echo ""
echo "Next steps:"
echo "1. Make sure API container is running:"
echo "   docker compose ps"
echo ""
echo "2. Check API logs to verify migrations ran:"
echo "   docker compose logs api"
echo ""
echo "3. Restart frontend if needed:"
echo "   ./start-frontend.sh"
echo ""