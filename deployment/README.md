# 🚢 Deployment Guide

This directory contains deployment scripts and configurations for the Secure Chat application.

## 📋 Prerequisites

Before deploying, ensure you have:
- Built the application: `./scripts/build.sh`
- All tests passing: `./scripts/test-all.sh`
- Required CLI tools installed (see specific deployment options below)

## 🌐 Frontend Deployment Options

### Option 1: GitHub Pages (Recommended)

**Automatic via GitHub Actions:**
- Configured in `.github/workflows/ci-cd.yml`
- Automatically deploys on push to main branch
- No manual intervention required

**Manual Deployment:**
```bash
./deploy-frontend.sh
```

**Requirements:**
- GitHub repository with Pages enabled
- `gh` CLI tool installed and authenticated

### Option 2: Netlify/Vercel
- Upload the `frontend/build/` directory to your chosen platform
- Configure build command: `npm run build`
- Configure publish directory: `build`

## 🖥️ Backend Deployment Options

### Option 1: Heroku (Recommended for beginners)

```bash
./deploy-backend-heroku.sh
```

**Requirements:**
- Heroku CLI installed and logged in: `heroku login`
- Heroku account with available dyno hours

**Features:**
- Automatic MongoDB Atlas addon setup
- Environment variable configuration
- Health checks and logging
- SSL/TLS termination
- Auto-scaling capabilities

**Manual Heroku Setup:**
```bash
# Create Heroku app
heroku create your-app-name

# Add MongoDB addon
heroku addons:create mongolab:sandbox -a your-app-name

# Set environment variables
heroku config:set NODE_ENV=production -a your-app-name
heroku config:set JWT_SECRET=your-super-secret-key -a your-app-name

# Deploy
git subtree push --prefix backend heroku main
```

### Option 2: Azure App Service

```bash
./deploy-backend-azure.sh
```

**Requirements:**
- Azure CLI installed and logged in: `az login`
- Azure subscription

**Features:**
- Resource group management
- App Service plan creation
- Application settings configuration
- Integration with Azure Cosmos DB
- Built-in monitoring and scaling

**Manual Azure Setup:**
```bash
# Create resource group
az group create --name secure-chat-rg --location eastus

# Create App Service plan
az appservice plan create --name secure-chat-plan --resource-group secure-chat-rg --sku B1 --is-linux

# Create web app
az webapp create --resource-group secure-chat-rg --plan secure-chat-plan --name your-app-name --runtime "NODE|18-lts"

# Configure app settings
az webapp config appsettings set --resource-group secure-chat-rg --name your-app-name --settings NODE_ENV=production

# Deploy code
az webapp deployment source config-zip --resource-group secure-chat-rg --name your-app-name --src backend.zip
```
  - Deployment packaging

## Prerequisites

### For Heroku Deployment
```bash
# Install Heroku CLI
curl https://cli-assets.heroku.com/install.sh | sh

# Login to Heroku
heroku login
```

### For Azure Deployment
```bash
# Install Azure CLI
curl -sL https://aka.ms/InstallAzureCLIDeb | sudo bash

# Login to Azure
az login
```

### For GitHub Pages (Frontend)
```bash
# Install gh-pages (optional, for manual deployment)
npm install -g gh-pages
```

## Environment Variables

### Backend Environment Variables

| Variable | Description | Required | Default |
|----------|-------------|----------|---------|
| `NODE_ENV` | Environment (development/production) | Yes | development |
| `PORT` | Server port | No | 5000 |
| `MONGODB_URI` | MongoDB connection string | Yes | mongodb://localhost:27017/secure-chat-dev |
| `JWT_SECRET` | JWT signing secret | Yes | (auto-generated) |
| `FRONTEND_URL` | Frontend URL for CORS | Yes | http://localhost:3000 |
| `WEBSOCKET_PORT` | WebSocket server port | No | 3001 |

### Production Environment Setup

#### Heroku
```bash
# Set custom MongoDB (if not using addon)
heroku config:set MONGODB_URI="mongodb+srv://user:pass@cluster.mongodb.net/secure-chat" -a your-app-name

# Set custom domain
heroku config:set FRONTEND_URL="https://your-domain.com" -a your-app-name
```

#### Azure
```bash
# Set MongoDB connection
az webapp config appsettings set --resource-group your-rg --name your-app --settings MONGODB_URI="your-connection-string"

# Set custom domain
az webapp config appsettings set --resource-group your-rg --name your-app --settings FRONTEND_URL="https://your-domain.com"
```

## Quick Start

### 1. Deploy Backend to Heroku
```bash
cd deployment
export HEROKU_APP_NAME="your-app-name"
export MONGODB_URI="your-mongodb-connection-string"
./deploy-backend-heroku.sh
```

### 2. Deploy Backend to Azure
```bash
cd deployment
export AZURE_APP_NAME="your-app-name"
export AZURE_RESOURCE_GROUP="your-resource-group"
export MONGODB_URI="your-mongodb-connection-string"
./deploy-backend-azure.sh
```

### 3. Deploy Frontend to GitHub Pages
```bash
cd deployment
./deploy-frontend.sh
```

## CI/CD Pipeline

The application includes a comprehensive CI/CD pipeline configured in `.github/workflows/ci-cd.yml` that:

1. **Security Scanning**: Uses Snyk to scan for vulnerabilities
2. **Testing**: Runs unit tests and integration tests
3. **Building**: Creates production builds
4. **Deployment**: Automatically deploys on successful builds
   - `develop` branch → Staging environment
   - `main` branch → Production environment

### Required GitHub Secrets

Add these secrets to your GitHub repository settings:

| Secret | Description |
|--------|-------------|
| `SNYK_TOKEN` | Snyk authentication token for security scanning |
| `HEROKU_API_KEY` | Heroku API key (if using Heroku deployment) |
| `AZURE_CREDENTIALS` | Azure service principal credentials (if using Azure) |

## MongoDB Setup

### Option 1: MongoDB Atlas (Recommended)
1. Create a MongoDB Atlas account
2. Create a new cluster
3. Get the connection string
4. Set the `MONGODB_URI` environment variable

### Option 2: Heroku MongoDB Addon
```bash
heroku addons:create mongolab:sandbox -a your-app-name
```

### Option 3: Azure Cosmos DB
```bash
az cosmosdb create --resource-group your-rg --name your-cosmos-db --kind MongoDB
```

## Domain Configuration

### Custom Domain for Frontend (GitHub Pages)
1. Add a `CNAME` file to the frontend build
2. Configure DNS settings
3. Enable HTTPS in GitHub Pages settings

### Custom Domain for Backend
- **Heroku**: Use Heroku's domain management
- **Azure**: Configure custom domains in App Service

## Monitoring and Logging

### Heroku
```bash
# View logs
heroku logs --tail -a your-app-name

# Monitor performance
heroku addons:create newrelic:wayne -a your-app-name
```

### Azure
```bash
# View logs
az webapp log tail --resource-group your-rg --name your-app

# Enable Application Insights
az monitor app-insights component create --app your-app --location your-location --resource-group your-rg
```

## Troubleshooting

### Common Issues

1. **MongoDB Connection Errors**
   - Verify connection string
   - Check IP whitelist settings
   - Ensure network connectivity

2. **CORS Issues**
   - Verify `FRONTEND_URL` environment variable
   - Check allowed origins in server configuration

3. **WebSocket Connection Issues**
   - Ensure WebSocket support is enabled
   - Check proxy configurations
   - Verify port settings

### Debug Commands

```bash
# Check app status (Heroku)
heroku ps -a your-app-name

# Check app status (Azure)
az webapp show --resource-group your-rg --name your-app --query state

# Test API endpoints
curl https://your-backend-url/health
curl https://your-backend-url/api/users/stats
```

## Security Considerations

1. **Environment Variables**: Never commit secrets to version control
2. **HTTPS**: Always use HTTPS in production
3. **Database**: Use connection string with authentication
4. **CORS**: Configure allowed origins properly
5. **Rate Limiting**: Monitor and adjust rate limits as needed

## Performance Optimization

1. **Frontend**: Enable gzip compression and caching
2. **Backend**: Use connection pooling for database
3. **CDN**: Consider using a CDN for static assets
4. **Monitoring**: Set up performance monitoring and alerts