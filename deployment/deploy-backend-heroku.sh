#!/bin/bash

# Backend Deployment Script for Heroku
# This script deploys the Node.js/Express backend to Heroku

set -e  # Exit on any error

echo "🚀 Starting backend deployment to Heroku..."

# Configuration
BACKEND_DIR="$(dirname "$0")/../backend"
APP_NAME="${HEROKU_APP_NAME:-secure-chat-backend}"
HEROKU_REMOTE="heroku"

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

# Check if Heroku CLI is installed
if ! command -v heroku &> /dev/null; then
    log_error "Heroku CLI not found. Please install it first:"
    log_info "  https://devcenter.heroku.com/articles/heroku-cli"
    exit 1
fi

# Check if logged in to Heroku
if ! heroku auth:whoami &> /dev/null; then
    log_error "Not logged in to Heroku. Please login first:"
    log_info "  heroku login"
    exit 1
fi

# Navigate to backend directory
cd "$BACKEND_DIR"
log_info "Working in directory: $(pwd)"

# Check if we're in a git repository
if ! git rev-parse --git-dir > /dev/null 2>&1; then
    log_error "Not in a git repository"
    exit 1
fi

# Install dependencies and run tests
log_info "Installing dependencies..."
npm ci

log_info "Running linter..."
npm run lint || {
    log_error "Linting failed"
    exit 1
}

log_info "Running tests..."
npm test || {
    log_error "Tests failed"
    exit 1
}

# Check if Heroku app exists
if heroku apps:info "$APP_NAME" &> /dev/null; then
    log_info "Using existing Heroku app: $APP_NAME"
else
    log_info "Creating new Heroku app: $APP_NAME"
    heroku create "$APP_NAME" --region us || {
        log_error "Failed to create Heroku app"
        exit 1
    }
fi

# Set up Heroku remote if it doesn't exist
if ! git remote get-url "$HEROKU_REMOTE" &> /dev/null; then
    log_info "Adding Heroku remote..."
    heroku git:remote -a "$APP_NAME" || {
        log_error "Failed to add Heroku remote"
        exit 1
    }
fi

# Set environment variables
log_info "Setting environment variables..."
heroku config:set NODE_ENV=production -a "$APP_NAME"
heroku config:set PORT=\$PORT -a "$APP_NAME"

# Set up MongoDB (either MongoDB Atlas or Heroku addon)
if [ -n "$MONGODB_URI" ]; then
    log_info "Setting custom MongoDB URI..."
    heroku config:set MONGODB_URI="$MONGODB_URI" -a "$APP_NAME"
else
    log_info "Setting up MongoDB Atlas addon..."
    # heroku addons:create mongolab:sandbox -a "$APP_NAME" || log_warning "MongoDB addon setup failed - please configure manually"
    log_warning "Please set up MongoDB Atlas and configure MONGODB_URI manually:"
    log_info "  heroku config:set MONGODB_URI=your-mongodb-connection-string -a $APP_NAME"
fi

# Set JWT secret (generate random one if not provided)
if [ -n "$JWT_SECRET" ]; then
    heroku config:set JWT_SECRET="$JWT_SECRET" -a "$APP_NAME"
else
    JWT_SECRET=$(openssl rand -base64 32)
    heroku config:set JWT_SECRET="$JWT_SECRET" -a "$APP_NAME"
    log_info "Generated JWT secret"
fi

# Set CORS origin (use provided or default)
FRONTEND_URL="${FRONTEND_URL:-https://$(git config --get remote.origin.url | sed 's/.*github\.com[:/]\([^/]*\)\/\([^/]*\)\.git/\1.github.io\/\2/')}"
heroku config:set FRONTEND_URL="$FRONTEND_URL" -a "$APP_NAME"
log_info "Set FRONTEND_URL to: $FRONTEND_URL"

# Create Procfile if it doesn't exist
if [ ! -f "Procfile" ]; then
    log_info "Creating Procfile..."
    echo "web: node src/server.js" > Procfile
    git add Procfile
    git commit -m "Add Procfile for Heroku deployment" || true
fi

# Create .slugignore for Heroku
log_info "Creating .slugignore..."
cat > .slugignore << EOF
*.md
*.txt
.github/
tests/
.env.example
coverage/
.nyc_output/
node_modules/.cache/
EOF

# Commit any changes
git add . || true
git commit -m "Prepare for Heroku deployment" || log_info "No changes to commit"

# Deploy to Heroku
log_info "Deploying to Heroku..."
git push "$HEROKU_REMOTE" HEAD:main --force || {
    log_error "Deployment failed"
    exit 1
}

# Open app logs
log_info "Checking deployment status..."
heroku logs --tail --num 50 -a "$APP_NAME" &
LOGS_PID=$!

# Wait a moment then check if app is running
sleep 10
if heroku ps -a "$APP_NAME" | grep -q "web.*up"; then
    kill $LOGS_PID 2>/dev/null || true
    log_success "Deployment completed successfully!"
    
    APP_URL=$(heroku apps:info -a "$APP_NAME" | grep "Web URL" | awk '{print $3}')
    log_info "App URL: $APP_URL"
    log_info "Health check: ${APP_URL}health"
    
    # Test the deployment
    if curl -f "${APP_URL}health" > /dev/null 2>&1; then
        log_success "Health check passed!"
    else
        log_warning "Health check failed - app may still be starting"
    fi
    
    # Display useful commands
    echo
    log_info "Useful Heroku commands:"
    log_info "  heroku logs --tail -a $APP_NAME"
    log_info "  heroku ps -a $APP_NAME"
    log_info "  heroku config -a $APP_NAME"
    log_info "  heroku open -a $APP_NAME"
    
else
    kill $LOGS_PID 2>/dev/null || true
    log_error "Deployment may have failed. Check logs:"
    log_info "  heroku logs -a $APP_NAME"
    exit 1
fi

echo
log_success "Backend deployment script completed!"