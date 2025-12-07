#!/bin/bash

# Install dependencies
pip install -r requirements.txt

# Collect static files
python manage.py collectstatic --noinput

# Run migrations (optional for Vercel - comment out if using external DB)
# python manage.py migrate
