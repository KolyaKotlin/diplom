# WSGI entry point for PythonAnywhere and other WSGI servers
import sys
import os

# Add project directory to path (for PythonAnywhere)
project_dir = os.path.dirname(os.path.abspath(__file__))
if project_dir not in sys.path:
    sys.path.insert(0, project_dir)

os.chdir(project_dir)

from app import app as application
