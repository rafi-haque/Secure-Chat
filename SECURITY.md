# Security and Privacy Setup Guide

This guide explains how to safely deploy and contribute to this secure chat application while protecting sensitive information.

## 🔒 Security Checklist

### ✅ What's Already Protected

- **Environment Variables**: All sensitive configuration is in `.env` files (excluded from Git)
- **API Keys & Secrets**: JWT secrets and database URLs are configurable
- **Personal Information**: No hardcoded personal names, IPs, or credentials
- **Development Data**: Test users and mock data use generic placeholders

### ⚠️ Before Going Public

1. **Never commit `.env` files** - They contain:
   - Database connection strings
   - JWT secrets
   - API keys
   - Personal configuration

2. **Review commit history** for accidentally committed secrets
3. **Generate new secrets** for production deployment
4. **Use environment-specific configurations**

## 🛠 Setup Instructions

### For Contributors

1. **Clone the repository**:
   ```bash
   git clone <your-repo-url>
   cd secure-chat
   ```

2. **Set up environment files**:
   ```bash
   # Backend
   cp backend/.env.example backend/.env
   # Edit backend/.env with your settings
   
   # Frontend (optional)
   cp frontend/.env.example frontend/.env.local
   # Edit frontend/.env.local if needed
   ```

3. **Install dependencies**:
   ```bash
   ./scripts/dev-setup.sh
   ```

4. **Start development servers**:
   ```bash
   ./scripts/dev-start.sh
   ```

### For Production Deployment

1. **Generate secure JWT secret**:
   ```bash
   openssl rand -hex 64
   ```

2. **Set production environment variables**:
   ```bash
   NODE_ENV=production
   JWT_SECRET=<your-generated-secret>
   MONGODB_URI=<your-production-db-url>
   FRONTEND_URL=https://your-domain.com
   ```

3. **Use deployment guides** in `deployment/README.md`

## 🌍 Environment Variables Reference

### Backend (.env)
```bash
# Required
JWT_SECRET=your-super-secret-key-here
MONGODB_URI=mongodb://localhost:27017/secure-chat

# Optional
NODE_ENV=development
PORT=5000
FRONTEND_URL=http://localhost:3000
BCRYPT_ROUNDS=12
LOG_LEVEL=info
```

### Frontend (.env.local)
```bash
# Optional - defaults are usually fine
REACT_APP_WS_URL=http://localhost:5000
REACT_APP_DEBUG=true
```

## 🚫 What NOT to Commit

- `.env` files
- `node_modules/` directories
- `build/` or `dist/` directories
- Personal configuration files
- Database files
- Log files
- SSL certificates/keys

## ✅ Safe to Commit

- `.env.example` files (with placeholder values)
- Source code with environment variable references
- Documentation and README files
- Test files with mock data
- Configuration templates

## 🔐 Best Practices

1. **Use different secrets** for development and production
2. **Rotate secrets** regularly in production
3. **Limit database access** to necessary IPs only
4. **Use HTTPS** in production
5. **Keep dependencies updated**
6. **Review security advisories**

## 🆘 If You Accidentally Commit Secrets

1. **Immediately rotate** the compromised secrets
2. **Remove from Git history**:
   ```bash
   git filter-branch --force --index-filter \
   'git rm --cached --ignore-unmatch path/to/secret/file' \
   --prune-empty --tag-name-filter cat -- --all
   ```
3. **Force push** (if you have permission)
4. **Update production** with new secrets

## 📞 Support

If you find security issues or need help with setup:
- Check the documentation in `/docs/`
- Review deployment guides in `/deployment/`
- Use placeholder values from `.env.example` files