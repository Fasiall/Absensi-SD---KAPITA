import os
import sys
from pathlib import Path

# Pastikan root direktori proyek masuk ke sys.path
BASE_DIR = Path(__file__).resolve().parent.parent
if str(BASE_DIR) not in sys.path:
    sys.path.insert(0, str(BASE_DIR))

from app import create_app

app = create_app()
handler = app

if __name__ == "__main__":
    app.run()
