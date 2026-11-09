import base64
import io
import secrets
import string
from functools import wraps
from urllib.parse import urlparse

import qrcode
from flask import abort, redirect, request, url_for
from flask_login import current_user
from qrcode.constants import ERROR_CORRECT_M

from .models import Attendance, SchoolClass, Student, STATUS_LIST


def role_required(*roles):
    """Batasi akses route berdasarkan peran pengguna."""

    def decorator(view):
        @wraps(view)
        def wrapped(*args, **kwargs):
            if not current_user.is_authenticated:
                return redirect(url_for("auth.login", next=request.full_path))
            if current_user.role not in roles:
                abort(403)
            return view(*args, **kwargs)

        return wrapped

    return decorator


def is_safe_url(target):
    if not target:
        return False
    parsed = urlparse(target)
    return (
        not parsed.netloc
        and target.startswith("/")
        and not target.startswith("//")
        and "\\" not in target
    )


def get_accessible_classes(user):
    query = SchoolClass.query
    if user.role != "admin":
        query = query.filter(SchoolClass.guru_id == user.id)
    return query.order_by(SchoolClass.nama_kelas.asc()).all()


def can_access_class(user, school_class):
    if user.role == "admin":
        return True
    return bool(school_class and school_class.guru_id == user.id)


def generate_qr_code():
    alphabet = string.ascii_uppercase + string.digits
    for _ in range(30):
        code = "SD-" + "".join(secrets.choice(alphabet) for _ in range(12))
        if not Student.query.filter_by(qr_code=code).first():
            return code
    raise RuntimeError("Gagal membuat kode QR unik. Silakan coba lagi.")


def qr_png_data_uri(text):
    qr = qrcode.QRCode(
        version=None,
        error_correction=ERROR_CORRECT_M,
        box_size=8,
        border=2,
    )
    qr.add_data(text)
    qr.make(fit=True)
    image = qr.make_image(fill_color="#111827", back_color="white")
    buffer = io.BytesIO()
    image.save(buffer, format="PNG")
    encoded = base64.b64encode(buffer.getvalue()).decode("ascii")
    return f"data:image/png;base64,{encoded}"


def attendance_map(class_id, tanggal):
    rows = (
        Attendance.query.join(Student)
        .filter(Student.class_id == class_id, Attendance.tanggal == tanggal)
        .all()
    )
    return {row.student_id: row for row in rows}


def attendance_counts(class_id, tanggal):
    total = Student.query.filter_by(class_id=class_id, aktif=True).count()
    rows = (
        Attendance.query.join(Student)
        .filter(Student.class_id == class_id, Attendance.tanggal == tanggal)
        .all()
    )
    counts = {status: 0 for status in STATUS_LIST}
    seen = set()
    for row in rows:
        if row.student_id in seen:
            continue
        seen.add(row.student_id)
        if row.status in counts:
            counts[row.status] += 1
    counts["Belum"] = max(0, total - len(seen))
    counts["total"] = total
    return counts


def serialize_attendance(student, attendance=None, status=None):
    data = {
        "id": student.id,
        "nis": student.nis,
        "nama": student.nama,
        "kelas": student.school_class.nama_kelas if student.school_class else "-",
        "status": status or (attendance.status if attendance else "Belum"),
        "jam_masuk": attendance.jam_masuk.strftime("%H:%M") if attendance and attendance.jam_masuk else None,
        "catatan": attendance.catatan if attendance else None,
    }
    return data


def chunked(items, size):
    return [items[index : index + size] for index in range(0, len(items), size)]
