#!/bin/bash
# start-frontend.sh - Start WebSocket server and frontend dev server

set -e

echo "🚀 Starting CIA Web Frontend..."
echo ""

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

print_status() {
    echo -e "${GREEN}✓${NC} $1"
}

# Check if backend services are running
if ! curl -s http://localhost:3001/api/health > /dev/null 2>&1; then
    echo -e "${YELLOW}⚠${NC} Backend services not detected. Run ./start.sh first!"
    echo ""
    read -p "Start backend services now? (y/n) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        ./start.sh
    else
        exit 1
    fi
fi

# Function to cleanup on exit
cleanup() {
    echo ""
    echo "🛑 Shutting down frontend services..."
    kill $WEBSOCKET_PID 2>/dev/null || true
    kill $WEBPACK_PID 2>/dev/null || true
    exit 0
}

trap cleanup SIGINT SIGTERM

echo "Starting WebSocket server (Y.js collaboration)..."
npm run websocket &
WEBSOCKET_PID=$!
sleep 2

if kill -0 $WEBSOCKET_PID 2>/dev/null; then
    print_status "WebSocket server running on ws://localhost:9001 (PID: $WEBSOCKET_PID)"
else
    echo "Failed to start WebSocket server"
    exit 1
fi

echo ""
echo "Starting Webpack dev server..."
npm start &
WEBPACK_PID=$!

echo ""
print_status "Frontend services started!"
echo ""
echo "  • WebSocket (Y.js): ws://localhost:9001"
echo "  • Frontend:         http://localhost:8080"
echo ""
echo "Press Ctrl+C to stop both services"
echo ""

# Wait for both processes
wait
