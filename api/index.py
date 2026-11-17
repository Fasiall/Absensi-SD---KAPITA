import sys
from pathlib import Path

# Pastikan root direktori ada di sys.path
BASE_DIR = Path(__file__).resolve().parent.parent
if str(BASE_DIR) not in sys.path:
    sys.path.insert(0, str(BASE_DIR))

from wsgi import app

# Vercel Serverless Function entry point
if __name__ == "__main__":
    app.run()
