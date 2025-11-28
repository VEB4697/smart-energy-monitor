# Git Repository Setup Guide

## Step-by-Step Git Instructions

### Step 1: Install Git

**Windows:**
- Download from: https://git-scm.com/download/win
- Run installer with default settings

**Linux:**
```bash
sudo apt-get update
sudo apt-get install git
```

**Mac:**
```bash
brew install git
```

### Step 2: Configure Git
```bash
git config --global user.name "Your Name"
git config --global user.email "your.email@example.com"
```

### Step 3: Create GitHub Account
1. Go to https://github.com
2. Sign up for free account
3. Verify your email

### Step 4: Initialize Local Repository

Navigate to your project directory:
```bash
cd smart-energy-monitor
```

Initialize Git:
```bash
git init
```

### Step 5: Create .gitignore File

The .gitignore file is already created by the setup script with:
```
# Python
*.py[cod]
__pycache__/
*.so
*.egg
*.egg-info/
dist/
build/
venv/
env/

# Django
*.log
db.sqlite3
media/
staticfiles/

# Environment
.env

# IDE
.vscode/
.idea/
*.swp
*.swo

# OS
.DS_Store
Thumbs.db
```

### Step 6: Add Files to Git
```bash
# Add all files
git add .

# Check status
git status
```

### Step 7: Commit Files
```bash
git commit -m "Initial commit: Smart Energy Monitoring System"
```

### Step 8: Create GitHub Repository

1. Go to https://github.com/new
2. Repository name: `smart-energy-monitor`
3. Description: "ESP8266 + PZEM-004T Energy Monitoring with Django Backend"
4. Choose Public or Private
5. DO NOT initialize with README (we already have files)
6. Click "Create repository"

### Step 9: Link Local to GitHub
```bash
# Replace YOUR_USERNAME with your GitHub username
git remote add origin https://github.com/YOUR_USERNAME/smart-energy-monitor.git

# Verify remote
git remote -v
```

### Step 10: Push to GitHub
```bash
# Push to main branch
git branch -M main
git push -u origin main
```

### Step 11: Verify Upload
1. Go to your GitHub repository
2. Refresh page
3. All files should be visible

---

## Common Git Commands

### Check Status
```bash
git status
```

### Add Changes
```bash
# Add specific file
git add filename.py

# Add all changes
git add .
```

### Commit Changes
```bash
git commit -m "Description of changes"
```

### Push Changes
```bash
git push origin main
```

### Pull Latest Changes
```bash
git pull origin main
```

### View Commit History
```bash
git log
```

### Create New Branch
```bash
git checkout -b feature-name
```

### Switch Branch
```bash
git checkout main
```

### Merge Branch
```bash
git checkout main
git merge feature-name
```

---

## Workflow for Updates

### Making Changes:
```bash
# 1. Make your code changes

# 2. Check what changed
git status
git diff

# 3. Add changes
git add .

# 4. Commit with message
git commit -m "Added new feature: XYZ"

# 5. Push to GitHub
git push origin main
```

### Best Practices:
- Commit frequently with clear messages
- Test before committing
- Don't commit sensitive data (.env files)
- Use branches for major features
- Pull before you push

---

## Cloning Repository on Another Computer

```bash
# Clone repository
git clone https://github.com/YOUR_USERNAME/smart-energy-monitor.git

# Navigate to directory
cd smart-energy-monitor

# Create virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Create .env file (not in git)
nano .env  # Add your settings

# Run migrations
python manage.py migrate

# Create superuser
python manage.py createsuperuser

# Run server
python manage.py runserver
```

---

## Project Structure in Git

```
smart-energy-monitor/
├── .git/                      # Git repository data (hidden)
├── .gitignore                 # Files to ignore
├── README.md                  # Project documentation
├── requirements.txt           # Python dependencies
├── manage.py                  # Django management script
├── .env.example              # Example environment file
├── COMPLETE_SETUP_GUIDE.md   # Setup instructions
├── GIT_SETUP.md              # This file
├── energy_monitor/           # Django project directory
│   ├── __init__.py
│   ├── settings.py
│   ├── urls.py
│   ├── wsgi.py
│   └── asgi.py
├── monitoring/               # Django app
│   ├── __init__.py
│   ├── models.py
│   ├── views.py
│   ├── serializers.py
│   ├── urls.py
│   ├── admin.py
│   └── migrations/
├── templates/                # HTML templates
│   ├── base.html
│   ├── login.html
│   ├── register.html
│   └── dashboard.html
├── static/                   # Static files
│   ├── css/
│   └── js/
└── hardware/                 # Hardware code
    └── ESP8266_Energy_Monitor.ino
```

---

## Creating README.md

Create a `README.md` file in your project root:

```markdown
# Smart Energy Monitoring System

Real-time energy monitoring system using ESP8266, PZEM-004T sensor, and Django web framework.

## Features
- Real-time voltage, current, power monitoring
- Daily energy consumption tracking
- Historical data analytics
- Interactive web dashboard
- Alert system for abnormal conditions
- OLED display for local readings
- User authentication and security

## Hardware Requirements
- ESP8266 NodeMCU
- PZEM-004T Energy Sensor
- 0.96" OLED Display (I2C)

## Software Stack
- Backend: Django 4.2
- Frontend: HTML, TailwindCSS, Chart.js
- Database: SQLite
- API: Django REST Framework

## Quick Start
See [COMPLETE_SETUP_GUIDE.md](COMPLETE_SETUP_GUIDE.md) for detailed instructions.

## Screenshots
[Add screenshots of your dashboard here]

## License
MIT License

## Author
[Your Name]
```

Add and commit README:
```bash
git add README.md
git commit -m "Added README documentation"
git push origin main
```

---

## .env.example File

Create `.env.example` (this WILL be committed):
```env
SECRET_KEY=your-secret-key-here
DEBUG=True
ALLOWED_HOSTS=localhost,127.0.0.1
API_KEY=your-api-key-here
```

Users can copy this to `.env` and add their actual values.

```bash
git add .env.example
git commit -m "Added environment example file"
git push origin main
```

---

## Troubleshooting Git Issues

### Problem: Permission Denied (publickey)
**Solution:**
```bash
# Use HTTPS instead of SSH
git remote set-url origin https://github.com/YOUR_USERNAME/smart-energy-monitor.git
```

### Problem: Large Files Error
**Solution:**
```bash
# Ensure .gitignore includes large files
# Remove from git if accidentally added
git rm --cached large-file.db
git commit -m "Removed large file"
```

### Problem: Merge Conflicts
**Solution:**
```bash
# Pull latest changes
git pull origin main

# Fix conflicts in files
# Then commit
git add .
git commit -m "Resolved merge conflicts"
git push origin main
```

### Problem: Wrong Commit Message
**Solution:**
```bash
# Amend last commit (before push)
git commit --amend -m "Correct message"
```

### Problem: Undo Last Commit
**Solution:**
```bash
# Keep changes, undo commit
git reset --soft HEAD~1

# Discard changes, undo commit
git reset --hard HEAD~1
```

---

## GitHub Features to Use

### 1. Issues
Track bugs and feature requests:
- Go to Issues tab
- Click "New Issue"
- Describe problem or feature

### 2. Releases
Create version releases:
- Go to Releases
- Click "Create a new release"
- Tag version (e.g., v1.0.0)
- Add release notes

### 3. GitHub Actions (Optional)
Automate testing and deployment:
- Create `.github/workflows/tests.yml`
- Set up CI/CD pipeline

### 4. Projects
Organize development:
- Create project board
- Track progress with Kanban

---

## Collaboration

### Adding Collaborators:
1. Repository Settings
2. Manage Access
3. Invite collaborators
4. They can clone and contribute

### Pull Requests:
```bash
# Collaborator creates branch
git checkout -b new-feature

# Make changes and push
git push origin new-feature

# Create Pull Request on GitHub
# Owner reviews and merges
```

---

## Backup Strategy

### Local Backup:
```bash
# Clone to external drive
git clone https://github.com/YOUR_USERNAME/smart-energy-monitor.git /path/to/backup
```

### Multiple Remotes:
```bash
# Add backup remote (e.g., GitLab)
git remote add backup https://gitlab.com/YOUR_USERNAME/smart-energy-monitor.git

# Push to both
git push origin main
git push backup main
```

---

## Summary

You now have:
- ✅ Git repository initialized
- ✅ Files committed locally
- ✅ Pushed to GitHub
- ✅ Version control active
- ✅ Ready for collaboration

**Next Steps:**
1. Add screenshots to README
2. Create releases for versions
3. Document API endpoints
4. Add contribution guidelines