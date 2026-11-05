import os
import sys

# Compute project root and backend directories
CURRENT_DIR = os.path.dirname(os.path.abspath(__file__))
ROOT_DIR = os.path.abspath(os.path.join(CURRENT_DIR, ".."))
BACKEND_DIR = os.path.join(ROOT_DIR, "backend")

# Ensure Python can find app and backend modules
for p in [ROOT_DIR, BACKEND_DIR]:
    if p not in sys.path:
        sys.path.insert(0, p)

# Import the FastAPI application
from app.main import app

