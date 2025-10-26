import os
from pathlib import Path

BASE_DIR = Path(__file__).parent.parent
MODELS_DIR = BASE_DIR / "models"
DEBUG = True
PORT = 5000
HOST = '0.0.0.0'