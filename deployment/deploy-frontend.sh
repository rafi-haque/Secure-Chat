#!/bin/bash

# Frontend Deployment Script for GitHub Pages
# This script builds and deploys the React frontend to GitHub Pages

set -e  # Exit on any error

echo "🚀 Starting frontend deployment to GitHub Pages..."

# Configuration
FRONTEND_DIR="$(dirname "$0")/../frontend"
BUILD_DIR="$FRONTEND_DIR/build"
REPO_URL="https://github.com/$(git config --get remote.origin.url | sed 's/.*github\.com[:/]\([^/]*\/[^/]*\)\.git/\1/')"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if we're in a git repository
if ! git rev-parse --git-dir > /dev/null 2>&1; then
    log_error "Not in a git repository"
    exit 1
fi

# Check if we're on the main branch
CURRENT_BRANCH=$(git branch --show-current)
if [ "$CURRENT_BRANCH" != "main" ]; then
    log_warning "Not on main branch (current: $CURRENT_BRANCH)"
    read -p "Continue deployment? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        log_info "Deployment cancelled"
        exit 0
    fi
fi

# Check if working directory is clean
if ! git diff-index --quiet HEAD --; then
    log_warning "Working directory is not clean"
    read -p "Continue deployment? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        log_info "Deployment cancelled"
        exit 0
    fi
fi

# Navigate to frontend directory
cd "$FRONTEND_DIR"
log_info "Working in directory: $(pwd)"

# Install dependencies
log_info "Installing dependencies..."
npm ci

# Run tests
log_info "Running tests..."
npm test -- --coverage --watchAll=false || {
    log_error "Tests failed"
    exit 1
}

# Build the application
log_info "Building application..."
npm run build || {
    log_error "Build failed"
    exit 1
}

# Check if build directory exists
if [ ! -d "$BUILD_DIR" ]; then
    log_error "Build directory not found: $BUILD_DIR"
    exit 1
fi

log_success "Build completed successfully"

# Deploy using GitHub Pages action (if running in CI)
if [ "$CI" = "true" ]; then
    log_info "Running in CI environment - deployment will be handled by GitHub Actions"
    exit 0
fi

# Local deployment setup (for manual deployment)
log_info "Setting up local deployment..."

# Create .nojekyll file to prevent Jekyll processing
touch "$BUILD_DIR/.nojekyll"

# Create CNAME file if custom domain is configured
if [ -n "$CUSTOM_DOMAIN" ]; then
    echo "$CUSTOM_DOMAIN" > "$BUILD_DIR/CNAME"
    log_info "Added CNAME file for domain: $CUSTOM_DOMAIN"
fi

# Add build timestamp
echo "Built at: $(date)" > "$BUILD_DIR/BUILD_INFO"

log_success "Frontend built and ready for deployment"
log_info "Build artifacts location: $BUILD_DIR"
log_info "To deploy manually, use: gh-pages -d $BUILD_DIR"

# Optional: Auto-deploy if gh-pages CLI is available
if command -v gh-pages &> /dev/null; then
    read -p "Deploy now using gh-pages CLI? (y/N): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        log_info "Deploying to GitHub Pages..."
        npx gh-pages -d "$BUILD_DIR" -m "Deploy frontend $(date)" || {
            log_error "Deployment failed"
            exit 1
        }
        log_success "Deployment completed successfully!"
        log_info "Site should be available at: https://$(git config --get remote.origin.url | sed 's/.*github\.com[:/]\([^/]*\)\/\([^/]*\)\.git/\1.github.io\/\2/')"
    fi
else
    log_info "gh-pages CLI not found. Install with: npm install -g gh-pages"
fi

echo
log_success "Frontend deployment script completed!"