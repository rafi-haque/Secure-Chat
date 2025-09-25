#!/bin/bash

# Backend Deployment Script for Azure App Service
# This script deploys the Node.js/Express backend to Azure App Service

set -e  # Exit on any error

echo "🚀 Starting backend deployment to Azure App Service..."

# Configuration
BACKEND_DIR="$(dirname "$0")/../backend"
RESOURCE_GROUP="${AZURE_RESOURCE_GROUP:-secure-chat-rg}"
APP_NAME="${AZURE_APP_NAME:-secure-chat-backend}"
LOCATION="${AZURE_LOCATION:-eastus}"
SKU="${AZURE_SKU:-B1}"

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

# Check if Azure CLI is installed
if ! command -v az &> /dev/null; then
    log_error "Azure CLI not found. Please install it first:"
    log_info "  https://docs.microsoft.com/en-us/cli/azure/install-azure-cli"
    exit 1
fi

# Check if logged in to Azure
if ! az account show &> /dev/null; then
    log_error "Not logged in to Azure. Please login first:"
    log_info "  az login"
    exit 1
fi

# Navigate to backend directory
cd "$BACKEND_DIR"
log_info "Working in directory: $(pwd)"

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

# Create resource group if it doesn't exist
log_info "Creating resource group if needed..."
az group create --name "$RESOURCE_GROUP" --location "$LOCATION" --output none || {
    log_warning "Resource group creation failed or already exists"
}

# Create App Service plan if it doesn't exist
log_info "Creating App Service plan if needed..."
az appservice plan create \
    --name "${APP_NAME}-plan" \
    --resource-group "$RESOURCE_GROUP" \
    --sku "$SKU" \
    --is-linux \
    --output none || {
    log_warning "App Service plan creation failed or already exists"
}

# Create web app if it doesn't exist
log_info "Creating web app if needed..."
az webapp create \
    --resource-group "$RESOURCE_GROUP" \
    --plan "${APP_NAME}-plan" \
    --name "$APP_NAME" \
    --runtime "NODE|20-lts" \
    --output none || {
    log_warning "Web app creation failed or already exists"
}

# Configure web app settings
log_info "Configuring web app settings..."

# Set Node.js version and startup command
az webapp config set \
    --resource-group "$RESOURCE_GROUP" \
    --name "$APP_NAME" \
    --startup-file "src/server.js" \
    --output none

# Set environment variables
log_info "Setting environment variables..."
az webapp config appsettings set \
    --resource-group "$RESOURCE_GROUP" \
    --name "$APP_NAME" \
    --settings \
        NODE_ENV=production \
        WEBSITE_NODE_DEFAULT_VERSION="~20" \
        SCM_DO_BUILD_DURING_DEPLOYMENT=true \
    --output none

# Set MongoDB URI (if provided)
if [ -n "$MONGODB_URI" ]; then
    log_info "Setting MongoDB URI..."
    az webapp config appsettings set \
        --resource-group "$RESOURCE_GROUP" \
        --name "$APP_NAME" \
        --settings MONGODB_URI="$MONGODB_URI" \
        --output none
else
    log_warning "MONGODB_URI not set. Please configure it manually:"
    log_info "  az webapp config appsettings set --resource-group $RESOURCE_GROUP --name $APP_NAME --settings MONGODB_URI=your-connection-string"
fi

# Set JWT secret
if [ -n "$JWT_SECRET" ]; then
    JWT_SECRET_TO_USE="$JWT_SECRET"
else
    JWT_SECRET_TO_USE=$(openssl rand -base64 32)
    log_info "Generated JWT secret"
fi

az webapp config appsettings set \
    --resource-group "$RESOURCE_GROUP" \
    --name "$APP_NAME" \
    --settings JWT_SECRET="$JWT_SECRET_TO_USE" \
    --output none

# Set CORS origin
FRONTEND_URL="${FRONTEND_URL:-https://$(git config --get remote.origin.url | sed 's/.*github\.com[:/]\([^/]*\)\/\([^/]*\)\.git/\1.github.io\/\2/')}"
az webapp config appsettings set \
    --resource-group "$RESOURCE_GROUP" \
    --name "$APP_NAME" \
    --settings FRONTEND_URL="$FRONTEND_URL" \
    --output none

log_info "Set FRONTEND_URL to: $FRONTEND_URL"

# Enable logging
log_info "Enabling application logging..."
az webapp log config \
    --resource-group "$RESOURCE_GROUP" \
    --name "$APP_NAME" \
    --application-logging filesystem \
    --level information \
    --output none

# Create deployment package
log_info "Creating deployment package..."
TEMP_DIR=$(mktemp -d)
cp -r . "$TEMP_DIR/"
cd "$TEMP_DIR"

# Remove development files
rm -rf node_modules tests coverage .nyc_output .env .env.example *.md

# Create package.json for production
cat > package.json << EOF
{
  "name": "secure-chat-backend",
  "version": "1.0.0",
  "description": "Secure Chat Backend API",
  "main": "src/server.js",
  "scripts": {
    "start": "node src/server.js"
  },
  "dependencies": $(node -p "JSON.stringify(require('$BACKEND_DIR/package.json').dependencies, null, 2)")
}
EOF

# Create web.config for Azure
cat > web.config << EOF
<?xml version="1.0" encoding="utf-8"?>
<configuration>
  <system.webServer>
    <handlers>
      <add name="iisnode" path="src/server.js" verb="*" modules="iisnode"/>
    </handlers>
    <rewrite>
      <rules>
        <rule name="DynamicContent">
          <match url="/*" />
          <action type="Rewrite" url="src/server.js"/>
        </rule>
      </rules>
    </rewrite>
    <security>
      <requestFiltering>
        <hiddenSegments>
          <remove segment="bin"/>
        </hiddenSegments>
      </requestFiltering>
    </security>
    <httpErrors existingResponse="PassThrough" />
    <iisnode watchedFiles="web.config;*.js"/>
  </system.webServer>
</configuration>
EOF

# Create zip package
log_info "Creating deployment package..."
zip -r ../deployment.zip . > /dev/null

cd "$BACKEND_DIR"
rm -rf "$TEMP_DIR"

# Deploy to Azure
log_info "Deploying to Azure App Service..."
az webapp deployment source config-zip \
    --resource-group "$RESOURCE_GROUP" \
    --name "$APP_NAME" \
    --src ../deployment.zip \
    --output none || {
    log_error "Deployment failed"
    rm -f ../deployment.zip
    exit 1
}

rm -f ../deployment.zip

# Wait for deployment to complete
log_info "Waiting for deployment to complete..."
sleep 30

# Get app URL
APP_URL="https://${APP_NAME}.azurewebsites.net"
log_info "App URL: $APP_URL"

# Test the deployment
log_info "Testing deployment..."
if curl -f "${APP_URL}/health" > /dev/null 2>&1; then
    log_success "Health check passed!"
    log_success "Deployment completed successfully!"
else
    log_warning "Health check failed - app may still be starting"
    log_info "Check logs with: az webapp log tail --resource-group $RESOURCE_GROUP --name $APP_NAME"
fi

# Display useful commands
echo
log_info "Useful Azure CLI commands:"
log_info "  az webapp log tail --resource-group $RESOURCE_GROUP --name $APP_NAME"
log_info "  az webapp show --resource-group $RESOURCE_GROUP --name $APP_NAME"
log_info "  az webapp config appsettings list --resource-group $RESOURCE_GROUP --name $APP_NAME"
log_info "  az webapp browse --resource-group $RESOURCE_GROUP --name $APP_NAME"

echo
log_success "Backend deployment to Azure completed!"