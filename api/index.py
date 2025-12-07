import sys
from pathlib import Path

# Add the project directory to the Python path
PROJECT_DIR = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(PROJECT_DIR))

# Set Django settings module
import os
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'energy_monitor.settings')

# Configure Django
import django
django.setup()

# Import the WSGI application
from energy_monitor.wsgi import application

# Export the application as the handler for Vercel
app = application
