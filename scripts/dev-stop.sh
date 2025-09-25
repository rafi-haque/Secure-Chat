#!/bin/bash

# Secure Chat Development Stop Script
# Safely stops development servers

echo "🛑 Stopping Secure Chat Development Servers"
echo "==========================================="

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

# Stop processes gently by finding them by port
stop_by_port() {
    local port=$1
    local service=$2
    
    print_info "Looking for $service on port $port..."
    
    # Find process using the port
    local pids=$(lsof -ti :$port 2>/dev/null)
    
    if [[ -z "$pids" ]]; then
        print_info "$service is not running on port $port"
        return 0
    fi
    
    for pid in $pids; do
        if kill -0 $pid 2>/dev/null; then
            print_info "Stopping $service (PID: $pid) gracefully..."
            kill -TERM $pid 2>/dev/null || true
            
            # Wait up to 5 seconds for graceful shutdown
            for i in {1..5}; do
                if ! kill -0 $pid 2>/dev/null; then
                    print_status "$service stopped gracefully"
                    return 0
                fi
                sleep 1
            done
            
            # If still running, force kill
            if kill -0 $pid 2>/dev/null; then
                print_warning "Force stopping $service (PID: $pid)..."
                kill -KILL $pid 2>/dev/null || true
                sleep 1
                if ! kill -0 $pid 2>/dev/null; then
                    print_status "$service force stopped"
                else
                    print_error "Failed to stop $service (PID: $pid)"
                fi
            fi
        fi
    done
}

# Stop each service
stop_by_port 3000 "Frontend React Server"
stop_by_port 5000 "Backend API Server"  
stop_by_port 3001 "Backend WebSocket Server"

echo ""
print_status "All development servers stopped"
echo ""