#!/usr/bin/env bash
set -e

# Start the Tracebug development environment
# This script runs both the web (Next.js) and server (Express API) dev servers in parallel

echo "🚀 Starting Tracebug development environment..."
echo ""

# Function to handle cleanup on exit
cleanup() {
    echo ""
    echo "🛑 Shutting down development environment..."
    jobs -p | xargs -r kill 2>/dev/null || true
    wait 2>/dev/null || true
    exit 0
}

# Trap SIGINT and SIGTERM to gracefully shutdown
trap cleanup SIGINT SIGTERM

# Start the web dev server (Next.js)
echo "▶ Starting Next.js web server (http://localhost:3001)..."
pnpm --filter web dev &
WEB_PID=$!

# Start the server dev server (Express API)
echo "▶ Starting Express API server (http://localhost:3000)..."
pnpm --filter @tracebug/server dev &
SERVER_PID=$!

echo ""
echo "✅ Development environment started!"
echo "   - Web:    http://localhost:3001"
echo "   - API:    http://localhost:3000"
echo "   - Press Ctrl+C to stop all servers"
echo ""

# Wait for both processes
wait $WEB_PID $SERVER_PID
