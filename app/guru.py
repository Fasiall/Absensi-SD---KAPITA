from flask import (
    Blueprint,
    abort,
    current_app,
    jsonify,
    redirect,
    render_template,
    request,
    send_file,
    url_for,
)
from flask_login import current_user
from sqlalchemy.exc import IntegrityError

from . import db
from .excel import build_report_workbook
from .models import Attendance, SchoolClass, Student, STATUS_HADIR, STATUS_LIST
from .reports import build_reports, detail_rows_for_export, resolve_period
from .timeutil import parse_date, time_local, today_local
from .utils import (
    attendance_counts,
    attendance_map,
    can_access_class,
    get_accessible_classes,
    serialize_attendance,
)

bp = Blueprint("guru", __name__)

XLSX_MIMETYPE = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"


@bp.before_request
def require_staff():
    is_api = request.path.startswith("/guru/api")
    if not current_user.is_authenticated:
        if is_api:
            return (
                jsonify(
                    ok=False,
                    code="auth",
                    message="Sesi berakhir. Muat ulang halaman lalu masuk kembali.",
                ),
                401,
            )
        return redirect(url_for("auth.login", next=request.full_path))
    if current_user.role not in ("guru", "admin"):
        if is_api:
            return (
                jsonify(
                    ok=False,
                    code="forbidden",
                    message="Anda tidak punya akses ke fitur ini.",
                ),
                403,
            )
        abort(403)
    return None


@bp.get("/scan")
def scan():
    classes = get_accessible_classes(current_user)
    today = today_local()

    if not classes:
        return render_template(
            "guru/scan.html",
            classes=[],
            school_class=None,
            students=[],
            attendance={},
            counts=None,
            tanggal=today,
            no_class=True,
        )

    selected_id = request.args.get("kelas", type=int)
    school_class = next((item for item in classes if item.id == selected_id), classes[0])
    tanggal = parse_date(request.args.get("tanggal"), today)
    if tanggal > today:
        tanggal = today

    students = (
        Student.query.filter_by(class_id=school_class.id, aktif=True)
        .order_by(Student.nama.asc())
        .all()
    )
    attendance = attendance_map(school_class.id, tanggal)
    counts = attendance_counts(school_class.id, tanggal)

    return render_template(
        "guru/scan.html",
        classes=classes,
        school_class=school_class,
        students=students,
        attendance=attendance,
        counts=counts,
        tanggal=tanggal,
        no_class=False,
    )


@bp.post("/api/scan")
def api_scan():
    data = request.get_json(silent=True) or {}
    payload, status = _process_scan(
        qr=data.get("qr"),
        class_id=data.get("class_id"),
        tanggal_value=data.get("tanggal"),
    )
    return jsonify(payload), status


@bp.post("/api/status")
def api_status():
    data = request.get_json(silent=True) or {}
    try:
        student_id = int(data.get("student_id"))
    except (TypeError, ValueError):
        return (
            jsonify(ok=False, code="invalid", message="Siswa tidak valid."),
            400,
        )

    student = db.session.get(Student, student_id)
    if not student:
        return jsonify(ok=False, code="not_found", message="Siswa tidak ditemukan."), 404
    if not can_access_class(current_user, student.school_class):
        return (
            jsonify(ok=False, code="forbidden", message="Anda tidak punya akses ke kelas ini."),
            403,
        )

    tanggal = parse_date(data.get("tanggal"), today_local())
    if tanggal > today_local():
        return (
            jsonify(ok=False, code="invalid", message="Tanggal tidak boleh melebihi hari ini."),
            400,
        )

    status_value = str(data.get("status", "")).strip()
    if status_value not in STATUS_LIST:
        return (
            jsonify(ok=False, code="invalid", message="Status absensi tidak valid."),
            400,
        )

    catatan = str(data.get("catatan", "") or "").strip()[:255] or None
    attendance = Attendance.query.filter_by(
        student_id=student.id, tanggal=tanggal
    ).first()

    if attendance:
        attendance.status = status_value
        attendance.catatan = catatan
        attendance.dicatat_oleh = current_user.id
        if status_value == STATUS_HADIR:
            if not attendance.jam_masuk:
                attendance.jam_masuk = time_local()
        else:
            attendance.jam_masuk = None
    else:
        attendance = Attendance(
            student_id=student.id,
            tanggal=tanggal,
            status=status_value,
            jam_masuk=time_local() if status_value == STATUS_HADIR else None,
            dicatat_oleh=current_user.id,
            catatan=catatan,
        )
        db.session.add(attendance)

    try:
        db.session.commit()
    except IntegrityError:
        db.session.rollback()
        return (
            jsonify(
                ok=False,
                code="duplicate",
                message="Absensi siswa ini sudah tercatat. Muat ulang halaman.",
            ),
            409,
        )

    counts = attendance_counts(student.class_id, tanggal)
    return jsonify(
        ok=True,
        message=f"Status {student.nama} diubah menjadi {status_value}.",
        student=serialize_attendance(student, attendance),
        counts=counts,
    )


@bp.post("/api/sync")
def api_sync():
    data = request.get_json(silent=True) or {}
    items = data.get("items")
    if not isinstance(items, list) or not items:
        return (
            jsonify(ok=False, code="invalid", message="Tidak ada data untuk disinkronkan."),
            400,
        )
    items = items[:100]

    results = []
    for item in items:
        if not isinstance(item, dict):
            results.append(
                {
                    "ok": False,
                    "code": "invalid",
                    "message": "Data tidak valid.",
                    "qr": "",
                }
            )
            continue
        payload, _status = _process_scan(
            qr=item.get("qr"),
            class_id=item.get("class_id"),
            tanggal_value=item.get("tanggal"),
        )
        payload["qr"] = str(item.get("qr", ""))
        results.append(payload)

    return jsonify(ok=True, results=results, synced=len(results))


@bp.get("/kelas")
def classes():
    today = today_local()
    rows = []
    for school_class in get_accessible_classes(current_user):
        total = Student.query.filter_by(class_id=school_class.id, aktif=True).count()
        counts = attendance_counts(school_class.id, today)
        percent = round(counts["Hadir"] / total * 100, 1) if total else 0.0
        rows.append(
            {
                "class": school_class,
                "total": total,
                "counts": counts,
                "percent": percent,
            }
        )
    return render_template("guru/classes.html", rows=rows, today=today)


@bp.get("/rekap")
def reports():
    classes = get_accessible_classes(current_user)
    selected_class = None
    class_id = request.args.get("kelas", type=int)
    if class_id:
        selected_class = next((item for item in classes if item.id == class_id), None)
        if not selected_class:
            abort(403)

    selected_classes = [selected_class] if selected_class else classes
    start, end = resolve_period(request.args)
    data = build_reports(selected_classes, start, end)
    export_url = url_for(
        "guru.reports_export",
        kelas=selected_class.id if selected_class else "",
        dari=start.isoformat(),
        sampai=end.isoformat(),
    )
    return render_template(
        "reports/report.html",
        classes=classes,
        selected_class=selected_class,
        start=start,
        end=end,
        data=data,
        export_url=export_url,
        all_label="Semua kelas saya",
    )


@bp.get("/rekap/export")
def reports_export():
    classes = get_accessible_classes(current_user)
    selected_class = None
    class_id = request.args.get("kelas", type=int)
    if class_id:
        selected_class = next((item for item in classes if item.id == class_id), None)
        if not selected_class:
            abort(403)

    selected_classes = [selected_class] if selected_class else classes
    start, end = resolve_period(request.args)
    data = build_reports(selected_classes, start, end)
    detail_rows = detail_rows_for_export(selected_classes, start, end)
    buffer = build_report_workbook(
        data,
        selected_classes,
        start,
        end,
        current_app.config.get("SCHOOL_NAME", "SD KAPITA"),
        current_user.nama,
        detail_rows,
    )
    filename = f"rekap_absensi_{start.isoformat()}_{end.isoformat()}.xlsx"
    return send_file(
        buffer,
        as_attachment=True,
        download_name=filename,
        mimetype=XLSX_MIMETYPE,
    )


def _process_scan(qr, class_id, tanggal_value):
    qr = str(qr or "").strip()
    if not qr:
        return {"ok": False, "code": "invalid", "message": "Kode QR kosong."}, 400

    try:
        class_id = int(class_id)
    except (TypeError, ValueError):
        return (
            {"ok": False, "code": "invalid", "message": "Kelas tidak valid."},
            400,
        )

    school_class = db.session.get(SchoolClass, class_id)
    if not school_class or not can_access_class(current_user, school_class):
        return (
            {
                "ok": False,
                "code": "forbidden",
                "message": "Anda tidak punya akses ke kelas ini.",
            },
            403,
        )

    tanggal = parse_date(tanggal_value, today_local())
    if tanggal > today_local():
        return (
            {
                "ok": False,
                "code": "invalid",
                "message": "Tanggal tidak boleh melebihi hari ini.",
            },
            400,
        )

    student = Student.query.filter_by(qr_code=qr).first()
    if not student:
        return (
            {
                "ok": False,
                "code": "not_found",
                "message": "QR tidak dikenali. Pastikan kartu yang dipindai benar.",
            },
            404,
        )
    if not student.aktif:
        return (
            {
                "ok": False,
                "code": "inactive",
                "message": "Kartu siswa ini sudah dinonaktifkan. Hubungi admin.",
                "student": serialize_attendance(student),
            },
            409,
        )
    if student.class_id != school_class.id:
        return (
            {
                "ok": False,
                "code": "wrong_class",
                "message": (
                    f"QR ini milik siswa kelas {student.school_class.nama_kelas}, "
                    f"bukan kelas {school_class.nama_kelas} yang dipilih."
                ),
                "student": serialize_attendance(student),
            },
            409,
        )

    existing = Attendance.query.filter_by(
        student_id=student.id, tanggal=tanggal
    ).first()
    if existing:
        jam = existing.jam_masuk.strftime("%H:%M") if existing.jam_masuk else None
        message = f"{student.nama} sudah tercatat {existing.status} hari ini"
        if jam:
            message += f" pukul {jam}"
        message += "."
        return (
            {
                "ok": False,
                "code": "duplicate",
                "message": message,
                "student": serialize_attendance(student, existing),
                "counts": attendance_counts(student.class_id, tanggal),
            },
            200,
        )

    attendance = Attendance(
        student_id=student.id,
        tanggal=tanggal,
        status=STATUS_HADIR,
        jam_masuk=time_local(),
        dicatat_oleh=current_user.id,
    )
    db.session.add(attendance)
    try:
        db.session.commit()
    except IntegrityError:
        db.session.rollback()
        existing = Attendance.query.filter_by(
            student_id=student.id, tanggal=tanggal
        ).first()
        return (
            {
                "ok": False,
                "code": "duplicate",
                "message": f"{student.nama} sudah tercatat hari ini.",
                "student": serialize_attendance(student, existing),
                "counts": attendance_counts(student.class_id, tanggal),
            },
            200,
        )

    jam = attendance.jam_masuk.strftime("%H:%M") if attendance.jam_masuk else ""
    return (
        {
            "ok": True,
            "code": "success",
            "message": f"{student.nama} tercatat Hadir pukul {jam}.",
            "student": serialize_attendance(student, attendance),
            "counts": attendance_counts(student.class_id, tanggal),
        },
        200,
    )
