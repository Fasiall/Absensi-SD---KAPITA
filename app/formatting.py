from datetime import date

HARI = (
    "Senin",
    "Selasa",
    "Rabu",
    "Kamis",
    "Jumat",
    "Sabtu",
    "Minggu",
)
BULAN = (
    "Januari",
    "Februari",
    "Maret",
    "April",
    "Mei",
    "Juni",
    "Juli",
    "Agustus",
    "September",
    "Oktober",
    "November",
    "Desember",
)


def _as_date(value):
    if isinstance(value, date):
        return value
    if not value:
        return None
    try:
        return date.fromisoformat(str(value)[:10])
    except (ValueError, TypeError):
        return None


def tanggal_id(value, with_day=True):
    d = _as_date(value)
    if not d:
        return "-"
    text = f"{d.day} {BULAN[d.month - 1]} {d.year}"
    if with_day:
        return f"{HARI[d.weekday()]}, {text}"
    return text


def tanggal_singkat(value):
    d = _as_date(value)
    if not d:
        return "-"
    return f"{d.day} {BULAN[d.month - 1]} {d.year}"


def periode_id(start, end):
    if not start or not end:
        return "-"
    if start == end:
        return tanggal_singkat(start)
    if start.year == end.year and start.month == end.month:
        return f"{start.day} - {end.day} {BULAN[end.month - 1]} {end.year}"
    if start.year == end.year:
        return (
            f"{start.day} {BULAN[start.month - 1]} - "
            f"{end.day} {BULAN[end.month - 1]} {end.year}"
        )
    return f"{tanggal_singkat(start)} - {tanggal_singkat(end)}"


def jam_id(value):
    if not value:
        return "-"
    return value.strftime("%H:%M")


def tanggal_input(value):
    d = _as_date(value)
    return d.isoformat() if d else ""
