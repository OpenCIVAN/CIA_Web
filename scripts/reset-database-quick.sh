#!/bin/bash
# reset-database-quick.sh
# Quick database reset for rapid development (no confirmation prompt)

set -e

echo "🔄 Quick database reset..."

# Stop containers
docker compose down -v > /dev/null 2>&1

# Start with fresh database
docker compose up -d > /dev/null 2>&1

# Wait for postgres
echo "⏳ Waiting for PostgreSQL..."
sleep 5

max_attempts=30
attempt=0
while [ $attempt -lt $max_attempts ]; do
    if docker compose exec -T postgres pg_isready -U cia_admin -d cia_analytics > /dev/null 2>&1; then
        break
    fi
    attempt=$((attempt + 1))
    sleep 2
done

if [ $attempt -eq $max_attempts ]; then
    echo "❌ PostgreSQL timeout"
    exit 1
fi

# Check results
sample_count=$(docker compose exec -T postgres psql -U cia_admin -d cia_analytics -t -c "SELECT COUNT(*) FROM datasets WHERE uploaded_by = 'system';" 2>/dev/null | xargs || echo "0")

echo "✅ Database reset complete!"
echo "📊 $sample_count sample files loaded"