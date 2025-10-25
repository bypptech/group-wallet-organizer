#!/bin/bash

# Local Development Startup Script
# This script starts both API and Web servers for local development

set -e

echo "=========================================="
echo "🚀 Starting Local Development Environment"
echo "=========================================="

# Check if .env file exists
if [ ! -f .env ]; then
    echo "❌ Error: .env file not found!"
    echo "Please copy .env.example to .env and configure your environment variables"
    exit 1
fi

# Source environment variables
export $(cat .env | grep -v '^#' | xargs)

# Check for required environment variables
echo ""
echo "🔍 Checking environment variables..."
if [ -z "$DATABASE_URL" ] || [ "$DATABASE_URL" = "postgresql://your_username:your_password@your_host.neon.tech/your_database?sslmode=require" ]; then
    echo "⚠️  Warning: DATABASE_URL not configured properly"
    echo "   The API will run in MOCK mode (USE_MOCK_DATA=true)"
    export USE_MOCK_DATA=true
else
    echo "✅ Database URL configured"
fi

if [ -z "$VITE_WALLETCONNECT_PROJECT_ID" ] || [ "$VITE_WALLETCONNECT_PROJECT_ID" = "YOUR_WALLETCONNECT_PROJECT_ID" ]; then
    echo "⚠️  Warning: VITE_WALLETCONNECT_PROJECT_ID not configured"
    echo "   Wallet connections may not work properly"
fi

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    echo ""
    echo "📦 Installing dependencies..."
    pnpm install
fi

echo ""
echo "=========================================="
echo "📊 Environment Configuration:"
echo "=========================================="
echo "API Server:    http://localhost:${PORT:-3001}"
echo "Web Server:    http://localhost:5000"
echo "Database:      ${USE_MOCK_DATA:-false} (MOCK mode: ${USE_MOCK_DATA:-false})"
echo "Chain ID:      ${CHAIN_ID:-84532} (Base Sepolia)"
echo "=========================================="
echo ""

# Function to handle cleanup on exit
cleanup() {
    echo ""
    echo "🛑 Shutting down development servers..."
    kill 0
}

trap cleanup EXIT INT TERM

# Start API server
echo "🔧 Starting API Server on port ${PORT:-3001}..."
cd apps/api
pnpm dev &
API_PID=$!
cd ../..

# Wait a bit for API to start
sleep 3

# Start Web server
echo "🌐 Starting Web Server on port 5000..."
cd apps/web
pnpm dev &
WEB_PID=$!
cd ../..

echo ""
echo "=========================================="
echo "✅ Development servers are running!"
echo "=========================================="
echo "API:  http://localhost:${PORT:-3001}"
echo "Web:  http://localhost:5000"
echo ""
echo "Press Ctrl+C to stop all servers"
echo "=========================================="

# Wait for all background processes
wait
