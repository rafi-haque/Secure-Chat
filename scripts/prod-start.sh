#!/bin/bash

# Secure Chat Production Start Script
# Starts production builds locally for testing

set -e

echo "🚀 Secure Chat - Production Start (Local Testing)"
echo "================================================"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

print_status() {
    echo -e "${GREEN}✓${NC} $1"
}

print_error() {
    echo -e "${RED}✗${NC} $1"
}

print_info() {
    echo -e "${BLUE}ℹ${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}⚠${NC} $1"
}

# Check if we're in the right directory
if [[ ! -d "backend" ]] || [[ ! -d "frontend" ]]; then
    print_error "Please run this script from the secure-chat root directory"
    exit 1
fi

# Check if build exists
if [[ ! -d "frontend/build" ]]; then
    print_error "Frontend build not found. Run ./scripts/build.sh first"
    exit 1
fi

# Install serve if not available
if ! command -v serve &> /dev/null; then
    print_info "Installing serve globally..."
    npm install -g serve
fi

# Function to cleanup background processes
cleanup() {
    print_info "Shutting down servers..."
    if [[ ! -z $BACKEND_PID ]]; then
        kill $BACKEND_PID 2>/dev/null || true
    fi
    if [[ ! -z $FRONTEND_PID ]]; then
        kill $FRONTEND_PID 2>/dev/null || true
    fi
    exit 0
}

trap cleanup SIGINT SIGTERM

echo ""
print_info "Starting production servers..."
echo ""

# Start backend in production mode
print_info "Starting backend (production mode)..."
cd backend
NODE_ENV=production npm start &
BACKEND_PID=$!
cd ..

# Wait for backend to start
sleep 3

# Start frontend (serve static build)
print_info "Starting frontend (static files)..."
cd frontend
serve -s build -l 3000 &
FRONTEND_PID=$!
cd ..

# Wait for servers to be ready
sleep 5

echo ""
print_status "Production servers started!"
echo ""
echo "Services:"
echo "  Frontend:        http://localhost:3000 (static build)"
echo "  Backend API:     http://localhost:5000 (production mode)"
echo "  Backend Health:  http://localhost:5000/health"
echo "  WebSocket:       ws://localhost:3001"
echo ""
print_warning "This is for local testing only. Not suitable for actual production deployment."
echo ""
echo "Press Ctrl+C to stop all servers"
echo ""

# Keep script running
wait