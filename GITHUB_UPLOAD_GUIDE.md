# 🚀 GitHub Upload Commands

## ✅ What's Protected
- `.specify/` folder (AI assistance files) - kept local only
- `.github/` folder (workflow prompts) - kept local only  
- `.env` files (sensitive configuration) - excluded from Git
- Personal information sanitized and replaced with environment variables

## 📋 Commands to Upload to GitHub

### Step 1: Reset Git staging area (clean slate)
```bash
cd /home/rafi/projects/secure-chat
git reset
```

### Step 2: Add only the files we want to publish
```bash
# Add main application files
git add README.md
git add SECURITY.md
git add .gitignore

# Add backend files
git add backend/
git add --force backend/.env.example

# Add frontend files
git add frontend/
git add --force frontend/.env.example

# Add scripts and documentation
git add scripts/
git add docs/
git add deployment/
```

### Step 3: Check what will be committed (review before pushing)
```bash
git status
```

### Step 4: Commit the clean codebase
```bash
git commit -m "feat: Complete secure chat application

✅ End-to-end encrypted messaging (RSA+AES hybrid)
✅ Real-time WebSocket communication via Socket.io  
✅ React TypeScript frontend + Node.js backend
✅ Comprehensive test suites (96/100 tests passing)
✅ Development automation scripts
✅ Production deployment guides
✅ Security hardening & environment variables
✅ Complete documentation

Ready for collaboration!"
```

### Step 5: Create GitHub repository
Go to GitHub.com and create a new repository named `secure-chat`

### Step 6: Add GitHub remote and push
```bash
# Replace 'your-username' with your actual GitHub username
git remote add origin https://github.com/your-username/secure-chat.git

# Push to GitHub
git branch -M main
git push -u origin main
```

## 🔍 Verification Commands

### Check what's excluded (should show .specify and .github):
```bash
git status --ignored
```

### Verify .env files are not tracked:
```bash
git ls-files | grep -E "\.env$"
# Should return nothing
```

### Check files that will be in the repository:
```bash
git ls-files
```

## 🛡️ Security Verification

Before pushing, make sure:
- [ ] No `.env` files are included
- [ ] No personal information (names, IPs) in the code
- [ ] All sensitive config uses environment variables
- [ ] `.specify/` and `.github/` folders are excluded

## 📚 After Upload

1. **Add repository description** on GitHub
2. **Add topics/tags**: `secure-chat`, `encryption`, `websocket`, `react`, `nodejs`
3. **Create issues** for future enhancements
4. **Set up branch protection** rules if needed
5. **Review the repository** to ensure no sensitive data leaked

## 🆘 If Something Goes Wrong

### **Push Rejected Error** (remote has content you don't have locally):
```bash
# Pull the remote changes and merge
git pull origin main --allow-unrelated-histories

# If there are conflicts, resolve them, then:
git add .
git commit -m "merge: Resolve conflicts with remote repository"

# Now push
git push -u origin main
```

### **If you get merge conflicts:**
```bash
# Check which files have conflicts
git status

# Edit the conflicted files manually (remove conflict markers)
# Then add and commit
git add .
git commit -m "resolve: Fix merge conflicts"
git push -u origin main
```

### Remove sensitive file from Git history:
```bash
git filter-branch --force --index-filter \
'git rm --cached --ignore-unmatch path/to/sensitive/file' \
--prune-empty --tag-name-filter cat -- --all

git push --force-with-lease origin main
```

### Start over if needed:
```bash
# Delete .git folder and start fresh
rm -rf .git
git init
# Then follow steps above
```