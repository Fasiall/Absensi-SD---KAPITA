import os
from datetime import timedelta
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent


class Config:
    SECRET_KEY = os.environ.get("SECRET_KEY", "dev-secret-key-ganti-saat-produksi")

    _default_sqlite = (
        "sqlite:////tmp/absensi.db"
        if os.environ.get("VERCEL")
        else f"sqlite:///{(BASE_DIR / 'instance' / 'absensi.db').as_posix()}"
    )
    _database_url = os.environ.get("DATABASE_URL", _default_sqlite).strip()

    if _database_url.startswith("postgres://"):
        _database_url = _database_url.replace("postgres://", "postgresql://", 1)

    # Sesuaikan driver PostgreSQL jika belum ditentukan
    if _database_url.startswith("postgresql://") and not (
        "+psycopg" in _database_url or "+psycopg2" in _database_url
    ):
        try:
            import psycopg  # noqa: F401
            _database_url = _database_url.replace("postgresql://", "postgresql+psycopg://", 1)
        except ImportError:
            _database_url = _database_url.replace("postgresql://", "postgresql+psycopg2://", 1)

    SQLALCHEMY_DATABASE_URI = _database_url
    SQLALCHEMY_TRACK_MODIFICATIONS = False

    MAX_CONTENT_LENGTH = 5 * 1024 * 1024
    SESSION_COOKIE_HTTPONLY = True
    SESSION_COOKIE_SAMESITE = "Lax"
    SESSION_COOKIE_SECURE = os.environ.get("SESSION_COOKIE_SECURE", "0") == "1"
    REMEMBER_COOKIE_HTTPONLY = True
    REMEMBER_COOKIE_SAMESITE = "Lax"
    PERMANENT_SESSION_LIFETIME = timedelta(hours=12)
    WTF_CSRF_TIME_LIMIT = None

    SCHOOL_NAME = os.environ.get("SCHOOL_NAME", "SD Negeri Purwodadi Simpang")
    APP_TIMEZONE = os.environ.get("APP_TIMEZONE", "Asia/Jakarta")
