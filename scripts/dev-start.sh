#!/bin/bash

# Secure Chat Development Start Script
# Starts both frontend and backend in development mode

set -e

echo "🔐 Secure Chat - Development Start"
echo "================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

print_status() {
    echo -e "${GREEN}✓${NC} $1"
}

print_info() {
    echo -e "${BLUE}ℹ${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}⚠${NC} $1"
}

print_error() {
    echo -e "${RED}✗${NC} $1"
}

# Check if we're in the right directory
if [[ ! -d "backend" ]] || [[ ! -d "frontend" ]]; then
    print_error "Please run this script from the secure-chat root directory"
    exit 1
fi

# Check if dependencies are installed
if [[ ! -d "backend/node_modules" ]]; then
    print_error "Backend dependencies not installed. Run ./scripts/dev-setup.sh first"
    exit 1
fi

if [[ ! -d "frontend/node_modules" ]]; then
    print_error "Frontend dependencies not installed. Run ./scripts/dev-setup.sh first"
    exit 1
fi

# Check if .env file exists
if [[ ! -f "backend/.env" ]]; then
    print_warning "Backend .env file not found. Creating from .env.example..."
    if [[ -f "backend/.env.example" ]]; then
        cp backend/.env.example backend/.env
        print_status "Created backend/.env - please configure MongoDB connection"
    else
        print_error "No .env.example found. Please create backend/.env manually"
        exit 1
    fi
fi

# Function to cleanup background processes gently
cleanup() {
    print_info "Shutting down servers gracefully..."
    if [[ ! -z $BACKEND_PID ]] && kill -0 $BACKEND_PID 2>/dev/null; then
        print_info "Stopping backend server (PID: $BACKEND_PID)..."
        kill -TERM $BACKEND_PID 2>/dev/null || true
        sleep 2
        # If still running, force kill
        if kill -0 $BACKEND_PID 2>/dev/null; then
            kill -KILL $BACKEND_PID 2>/dev/null || true
        fi
    fi
    if [[ ! -z $FRONTEND_PID ]] && kill -0 $FRONTEND_PID 2>/dev/null; then
        print_info "Stopping frontend server (PID: $FRONTEND_PID)..."
        kill -TERM $FRONTEND_PID 2>/dev/null || true
        sleep 2
        # If still running, force kill
        if kill -0 $FRONTEND_PID 2>/dev/null; then
            kill -KILL $FRONTEND_PID 2>/dev/null || true
        fi
    fi
    print_status "Servers stopped"
    exit 0
}

# Set up signal handlers
trap cleanup SIGINT SIGTERM

# Check if ports are available (gentle check)
check_port() {
    local port=$1
    local service=$2
    if nc -z localhost $port 2>/dev/null; then
        print_warning "$service port $port is already in use"
        print_info "You may need to stop the existing process manually"
        print_info "To find the process: lsof -i :$port"
        return 1
    fi
    return 0
}

print_info "Checking ports..."
check_port 3000 "Frontend" || exit 1
check_port 5000 "Backend API" || exit 1
# WebSocket runs on the same port as HTTP server (5000), no separate port check needed

print_status "All ports available"

echo ""
print_info "Starting development servers..."
echo ""

# Start backend
print_info "Starting backend server..."
cd backend
npm run dev &
BACKEND_PID=$!
cd ..

# Wait a moment for backend to start
sleep 3

# Start frontend
print_info "Starting frontend server..."
cd frontend
npm start &
FRONTEND_PID=$!
cd ..

# Wait for both servers to be ready
print_info "Waiting for servers to start..."
sleep 5

# Check if servers are running
BACKEND_RUNNING=false
FRONTEND_RUNNING=false

# Check backend
if curl -s http://localhost:5000/health >/dev/null 2>&1; then
    BACKEND_RUNNING=true
    print_status "Backend server running on http://localhost:5000"
else
    print_warning "Backend server may still be starting..."
fi

# Check frontend (will redirect but that's OK)
if curl -s http://localhost:3000 >/dev/null 2>&1; then
    FRONTEND_RUNNING=true
    print_status "Frontend server running on http://localhost:3000"
else
    print_warning "Frontend server may still be starting..."
fi

echo ""
echo "🚀 Development servers started!"
echo ""
echo "Services:"
echo "  Frontend:        http://localhost:3000"
echo "  Backend API:     http://localhost:5000"
echo "  Backend Health:  http://localhost:5000/health"
echo "  WebSocket:       http://localhost:5000 (Socket.io)"
echo ""
echo "Press Ctrl+C to stop all servers"
echo ""

# Keep script running and wait for user to stop
wait