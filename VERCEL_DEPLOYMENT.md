# Vercel Deployment Guide

## Prerequisites
- GitHub account with your repository
- Vercel account (sign up at https://vercel.com)

## Deployment Steps

### 1. Connect Repository to Vercel
1. Go to https://vercel.com/dashboard
2. Click "Add New..." → "Project"
3. Import your GitHub repository `smart-energy-monitor`
4. Select the repository and click "Import"

### 2. Configure Environment Variables
In Vercel project settings, add the following environment variables:

```
DEBUG=False
SECRET_KEY=your-very-secure-secret-key-here
ALLOWED_HOSTS=localhost,127.0.0.1,.vercel.app,yourdomain.com
API_KEY=fifLzEGJKga63vOLcuBkTMGtIDBQzFJ5FQLiU59zRTI
```

**Important Security Notes:**
- Generate a new SECRET_KEY using Django: `python manage.py shell` → `from django.core.management.utils import get_random_secret_key; print(get_random_secret_key())`
- Never commit sensitive data to Git
- Always use strong, unique SECRET_KEY values

### 3. Deploy
1. Vercel will automatically detect the Python project
2. Click "Deploy"
3. Wait for deployment to complete (usually 2-3 minutes)

### 4. Verify Deployment
- Your app will be available at `https://your-project-name.vercel.app`
- Check the "Function" logs if there are any issues
- Test your API endpoints and dashboard

## Important Notes

### Serverless Limitations
- **Database**: SQLite is not persistent on Vercel. For production, configure a PostgreSQL or MongoDB database
  - Add `DATABASE_URL` environment variable pointing to your database
  - Update `settings.py` to use `DATABASE_URL` for production

### Static Files
- Static files are automatically collected during build
- WhiteNoise middleware handles serving static files
- CSS and JavaScript should load correctly

### CORS Configuration
- Update `CORS_ALLOWED_ORIGINS` in environment variables if needed
- The current configuration allows requests from the app URL

### Local Development (No Changes Needed)
- Your existing local development setup continues to work as before
- Run `python manage.py runserver` normally for development
- All changes are backward compatible

## Troubleshooting

### Deployment Fails
- Check Vercel logs in the dashboard
- Ensure all environment variables are set correctly
- Verify `requirements.txt` has all dependencies

### 404 Errors
- Make sure `ALLOWED_HOSTS` includes your Vercel domain
- Check that static files are being served correctly

### Database Issues
- For production, you must set up an external database
- SQLite is only for local development

## Rolling Back
If needed, deploy previous versions:
1. Go to Vercel Dashboard
2. Select your project
3. Go to "Deployments"
4. Redeploy any previous commit

---
**Next Steps:**
1. Update SECRET_KEY with a secure value
2. Set up a production database if needed
3. Configure ALLOWED_HOSTS for your custom domain
4. Test your deployment thoroughly before going live
