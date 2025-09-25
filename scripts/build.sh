#!/bin/bash

# Secure Chat Build Script
# Builds both frontend and backend for production

set -e

echo "🏗️  Secure Chat - Production Build"
echo "=================================="

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

# Run tests first
print_info "Running tests before build..."
if ! ./scripts/test-all.sh; then
    print_error "Tests failed. Aborting build."
    exit 1
fi

echo ""
print_info "Building Frontend..."
echo "-------------------"

cd frontend
if npm run build; then
    print_status "Frontend build completed"
    if [[ -d "build" ]]; then
        BUILD_SIZE=$(du -sh build | cut -f1)
        print_info "Frontend build size: $BUILD_SIZE"
    fi
else
    print_error "Frontend build failed"
    exit 1
fi
cd ..

echo ""
print_info "Preparing Backend..."
echo "-------------------"

cd backend
# Install production dependencies only
if npm ci --only=production; then
    print_status "Backend production dependencies installed"
else
    print_error "Backend dependency installation failed"
    exit 1
fi
cd ..

echo ""
print_status "Build completed successfully! 🎉"
echo ""
echo "Next steps:"
echo "  - Frontend build available in: frontend/build/"
echo "  - Backend ready for deployment from: backend/"
echo "  - Test production build: ./scripts/prod-start.sh"
echo "  - Deploy: See deployment/README.md"