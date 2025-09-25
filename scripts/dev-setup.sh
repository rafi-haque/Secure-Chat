#!/bin/bash

# Secure Chat Development Setup Script
# Sets up both frontend and backend dependencies

set -e

echo "🔐 Secure Chat - Development Setup"
echo "=================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}✓${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}⚠${NC} $1"
}

print_error() {
    echo -e "${RED}✗${NC} $1"
}

# Check if we're in the right directory
if [[ ! -f "package.json" ]] && [[ ! -d "backend" ]] && [[ ! -d "frontend" ]]; then
    print_error "Please run this script from the secure-chat root directory"
    exit 1
fi

# Check Node.js version
NODE_VERSION=$(node --version 2>/dev/null | cut -d'v' -f2 | cut -d'.' -f1 || echo "0")
if [[ $NODE_VERSION -lt 16 ]]; then
    print_error "Node.js v16+ is required. Current version: $(node --version 2>/dev/null || echo 'not installed')"
    exit 1
fi

print_status "Node.js version: $(node --version)"

# Check if MongoDB is available
if command -v mongod &> /dev/null; then
    print_status "MongoDB found: $(mongod --version | head -1)"
else
    print_warning "MongoDB not found locally. You'll need to configure a remote MongoDB connection."
fi

echo ""
echo "📦 Installing Dependencies..."
echo ""

# Install backend dependencies
echo "Backend dependencies..."
cd backend
if [[ ! -f "package.json" ]]; then
    print_error "Backend package.json not found!"
    exit 1
fi

npm install
if [[ $? -eq 0 ]]; then
    print_status "Backend dependencies installed"
else
    print_error "Failed to install backend dependencies"
    exit 1
fi

# Create .env file if it doesn't exist
if [[ ! -f ".env" ]]; then
    if [[ -f ".env.example" ]]; then
        cp .env.example .env
        print_status "Created .env file from .env.example"
        print_warning "Please edit backend/.env with your MongoDB connection string"
    else
        print_warning "No .env.example found. You'll need to create backend/.env manually"
    fi
else
    print_status "Backend .env file already exists"
fi

cd ..

# Install frontend dependencies
echo "Frontend dependencies..."
cd frontend
if [[ ! -f "package.json" ]]; then
    print_error "Frontend package.json not found!"
    exit 1
fi

npm install
if [[ $? -eq 0 ]]; then
    print_status "Frontend dependencies installed"
else
    print_error "Failed to install frontend dependencies"
    exit 1
fi

cd ..

echo ""
echo "🎉 Setup Complete!"
echo ""
echo "Next steps:"
echo "1. Configure backend/.env with your MongoDB connection"
echo "2. Start development servers: ./scripts/dev-start.sh"
echo "3. Open http://localhost:3000 in your browser"
echo ""
echo "For more information, see README.md"