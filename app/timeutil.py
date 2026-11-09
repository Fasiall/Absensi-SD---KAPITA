import os
from datetime import date, datetime, timedelta, timezone
from zoneinfo import ZoneInfo

_TIMEZONE_NAME = os.environ.get("APP_TIMEZONE", "Asia/Jakarta")
try:
    TIMEZONE = ZoneInfo(_TIMEZONE_NAME)
except Exception:  # pragma: no cover - fallback bila zona waktu tidak tersedia
    try:
        TIMEZONE = ZoneInfo("Asia/Jakarta")
    except Exception:
        TIMEZONE = timezone(timedelta(hours=7))


def now_local() -> datetime:
    return datetime.now(TIMEZONE)


def today_local() -> date:
    return now_local().date()


def time_local():
    return now_local().time().replace(tzinfo=None)


def parse_date(value, default=None):
    if value is None or str(value).strip() == "":
        return default
    try:
        return date.fromisoformat(str(value).strip()[:10])
    except (ValueError, TypeError):
        return default
