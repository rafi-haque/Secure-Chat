#!/bin/bash

# Secure Chat Test Script
# Runs all tests for both frontend and backend

set -e

echo "🧪 Secure Chat - Test Suite"
echo "==========================="

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

# Check if we're in the right directory
if [[ ! -d "backend" ]] || [[ ! -d "frontend" ]]; then
    print_error "Please run this script from the secure-chat root directory"
    exit 1
fi

BACKEND_PASSED=false
FRONTEND_PASSED=false

echo ""
print_info "Running Backend Tests..."
echo "------------------------"

cd backend
if npm test; then
    BACKEND_PASSED=true
    print_status "Backend tests passed"
else
    print_error "Backend tests failed"
fi
cd ..

echo ""
print_info "Running Frontend Tests..."
echo "-------------------------"

cd frontend
if CI=true npm test; then
    FRONTEND_PASSED=true
    print_status "Frontend tests passed"
else
    print_error "Frontend tests failed"
fi
cd ..

echo ""
echo "📊 Test Summary"
echo "==============="

if [[ $BACKEND_PASSED == true ]]; then
    print_status "Backend: PASSED"
else
    print_error "Backend: FAILED"
fi

if [[ $FRONTEND_PASSED == true ]]; then
    print_status "Frontend: PASSED"
else
    print_error "Frontend: FAILED"
fi

if [[ $BACKEND_PASSED == true ]] && [[ $FRONTEND_PASSED == true ]]; then
    echo ""
    print_status "All tests passed! 🎉"
    exit 0
else
    echo ""
    print_error "Some tests failed. Please check the output above."
    exit 1
fi