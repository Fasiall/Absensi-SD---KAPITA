import csv
import io

from flask import (
    Blueprint,
    abort,
    current_app,
    flash,
    redirect,
    render_template,
    request,
    send_file,
    url_for,
)
from flask_login import current_user
from openpyxl import load_workbook
from sqlalchemy import or_
from sqlalchemy.exc import IntegrityError

from . import db
from .excel import build_import_template, build_report_workbook
from .models import Attendance, SchoolClass, Student, User
from .reports import build_reports, detail_rows_for_export, resolve_period
from .timeutil import today_local
from .utils import generate_qr_code, qr_png_data_uri

bp = Blueprint("admin", __name__)

XLSX_MIMETYPE = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"


@bp.before_request
def require_admin():
    if not current_user.is_authenticated:
        return redirect(url_for("auth.login", next=request.full_path))
    if current_user.role != "admin":
        abort(403)
    return None


@bp.get("/")
def dashboard():
    today = today_local()
    classes = SchoolClass.query.order_by(SchoolClass.nama_kelas.asc()).all()

    cards = []
    total_students = 0
    total_hadir = 0
    total_belum = 0
    for school_class in classes:
        total = Student.query.filter_by(class_id=school_class.id, aktif=True).count()
        rows = (
            Attendance.query.join(Student)
            .filter(Student.class_id == school_class.id, Attendance.tanggal == today)
            .all()
        )
        counts = {"Hadir": 0, "Sakit": 0, "Izin": 0, "Alpa": 0}
        seen = set()
        for row in rows:
            if row.student_id in seen:
                continue
            seen.add(row.student_id)
            if row.status in counts:
                counts[row.status] += 1
        belum = max(0, total - len(seen))
        percent = round(counts["Hadir"] / total * 100, 1) if total else 0.0
        cards.append(
            {
                "class": school_class,
                "total": total,
                "counts": counts,
                "belum": belum,
                "percent": percent,
            }
        )
        total_students += total
        total_hadir += counts["Hadir"]
        total_belum += belum

    recent = (
        Attendance.query.join(Student)
        .filter(Attendance.tanggal == today)
        .order_by(Attendance.id.desc())
        .limit(8)
        .all()
    )
    overall_percent = round(total_hadir / total_students * 100, 1) if total_students else 0.0

    return render_template(
        "admin/dashboard.html",
        cards=cards,
        recent=recent,
        total_students=total_students,
        total_hadir=total_hadir,
        total_belum=total_belum,
        overall_percent=overall_percent,
        classes_count=len(classes),
        today=today,
    )


@bp.get("/siswa")
def students():
    q = request.args.get("q", "").strip()
    class_id = request.args.get("kelas", type=int)
    page = request.args.get("page", 1, type=int)
    if page < 1:
        page = 1

    query = Student.query.join(SchoolClass)
    if q:
        like = f"%{q}%"
        query = query.filter(or_(Student.nama.ilike(like), Student.nis.ilike(like)))
    if class_id:
        query = query.filter(Student.class_id == class_id)
    query = query.order_by(SchoolClass.nama_kelas.asc(), Student.nama.asc())
    pagination = query.paginate(page=page, per_page=20, error_out=False)

    classes = SchoolClass.query.order_by(SchoolClass.nama_kelas.asc()).all()
    return render_template(
        "admin/students.html",
        pagination=pagination,
        classes=classes,
        q=q,
        selected_class_id=class_id,
        total=pagination.total,
    )


@bp.route("/siswa/tambah", methods=["GET", "POST"])
def student_add():
    classes = SchoolClass.query.order_by(SchoolClass.nama_kelas.asc()).all()
    values = {"nis": "", "nama": "", "class_id": "", "aktif": True}

    if request.method == "POST":
        values = {
            "nis": request.form.get("nis", "").strip(),
            "nama": request.form.get("nama", "").strip(),
            "class_id": request.form.get("class_id", "").strip(),
            "aktif": bool(request.form.get("aktif")),
        }
        errors, school_class = _validate_student(values)
        if not errors:
            student = Student(
                nis=values["nis"],
                nama=values["nama"],
                class_id=school_class.id,
                qr_code=generate_qr_code(),
                aktif=values["aktif"],
            )
            db.session.add(student)
            try:
                db.session.commit()
                flash(f"Siswa {student.nama} berhasil ditambahkan.", "success")
                return redirect(url_for("admin.students"))
            except IntegrityError:
                db.session.rollback()
                errors.append("NIS sudah dipakai siswa lain. Gunakan NIS yang berbeda.")
        for error in errors:
            flash(error, "danger")

    return render_template(
        "admin/student_form.html",
        classes=classes,
        values=values,
        student=None,
        qr_image=None,
    )


@bp.route("/siswa/<int:student_id>/edit", methods=["GET", "POST"])
def student_edit(student_id):
    student = db.session.get(Student, student_id) or abort(404)
    classes = SchoolClass.query.order_by(SchoolClass.nama_kelas.asc()).all()
    values = {
        "nis": student.nis,
        "nama": student.nama,
        "class_id": str(student.class_id),
        "aktif": student.aktif,
    }

    if request.method == "POST":
        values = {
            "nis": request.form.get("nis", "").strip(),
            "nama": request.form.get("nama", "").strip(),
            "class_id": request.form.get("class_id", "").strip(),
            "aktif": bool(request.form.get("aktif")),
        }
        regenerate = bool(request.form.get("regenerate_qr"))
        errors, school_class = _validate_student(values, exclude_id=student.id)
        if not errors:
            student.nis = values["nis"]
            student.nama = values["nama"]
            student.class_id = school_class.id
            student.aktif = values["aktif"]
            if regenerate:
                student.qr_code = generate_qr_code()
            try:
                db.session.commit()
                extra = " Kode QR baru sudah dibuat." if regenerate else ""
                flash(f"Data {student.nama} berhasil diperbarui.{extra}", "success")
                return redirect(url_for("admin.students"))
            except IntegrityError:
                db.session.rollback()
                errors.append("NIS sudah dipakai siswa lain. Gunakan NIS yang berbeda.")
        for error in errors:
            flash(error, "danger")

    return render_template(
        "admin/student_form.html",
        classes=classes,
        values=values,
        student=student,
        qr_image=qr_png_data_uri(student.qr_code),
    )


@bp.post("/siswa/<int:student_id>/hapus")
def student_delete(student_id):
    student = db.session.get(Student, student_id) or abort(404)
    nama = student.nama
    db.session.delete(student)
    db.session.commit()
    flash(f"Data siswa {nama} beserta riwayat absensinya telah dihapus.", "success")
    return redirect(url_for("admin.students"))


@bp.route("/siswa/impor", methods=["GET", "POST"])
def students_import():
    classes = SchoolClass.query.order_by(SchoolClass.nama_kelas.asc()).all()
    errors = []
    result = None

    if request.method == "POST":
        upload = request.files.get("file")
        if not upload or not upload.filename:
            flash("Pilih file Excel (.xlsx) atau CSV terlebih dahulu.", "danger")
        else:
            extension = upload.filename.rsplit(".", 1)[-1].lower() if "." in upload.filename else ""
            if extension not in ("xlsx", "csv"):
                flash("Format file harus .xlsx atau .csv.", "danger")
            else:
                try:
                    result = _import_students(upload, extension, classes)
                except ValueError as exc:
                    flash(str(exc), "danger")
                except Exception:
                    db.session.rollback()
                    flash(
                        "File tidak dapat dibaca. Pastikan formatnya sesuai template.",
                        "danger",
                    )
                else:
                    errors = result["errors"]
                    if result["created"]:
                        flash(
                            f"Impor selesai: {result['created']} siswa berhasil ditambahkan.",
                            "success",
                        )
                    if result["skipped"]:
                        flash(
                            f"{result['skipped']} baris dilewati. Periksa daftar kesalahan di bawah.",
                            "warning",
                        )
                    if not result["created"] and not result["skipped"]:
                        flash("Tidak ada data yang bisa diimpor dari file tersebut.", "info")

    return render_template(
        "admin/import.html",
        classes=classes,
        errors=errors,
        result=result,
    )


@bp.get("/siswa/template")
def students_template():
    classes = SchoolClass.query.order_by(SchoolClass.nama_kelas.asc()).all()
    buffer = build_import_template(classes)
    return send_file(
        buffer,
        as_attachment=True,
        download_name="template_impor_siswa.xlsx",
        mimetype=XLSX_MIMETYPE,
    )


@bp.route("/kelas", methods=["GET", "POST"])
def classes():
    teachers = (
        User.query.filter_by(role="guru", aktif=True).order_by(User.nama.asc()).all()
    )

    if request.method == "POST":
        nama_kelas = request.form.get("nama_kelas", "").strip().upper()
        guru_id = request.form.get("guru_id", "").strip()
        errors = _validate_class(nama_kelas)
        teacher, teacher_error = _resolve_teacher(guru_id)
        if teacher_error:
            errors.append(teacher_error)
        if not errors:
            school_class = SchoolClass(nama_kelas=nama_kelas, guru_id=teacher.id if teacher else None)
            db.session.add(school_class)
            try:
                db.session.commit()
                flash(f"Kelas {nama_kelas} berhasil ditambahkan.", "success")
                return redirect(url_for("admin.classes"))
            except IntegrityError:
                db.session.rollback()
                errors.append("Nama kelas sudah digunakan.")
        for error in errors:
            flash(error, "danger")

    class_rows = []
    for school_class in SchoolClass.query.order_by(SchoolClass.nama_kelas.asc()).all():
        class_rows.append(
            {
                "class": school_class,
                "student_count": Student.query.filter_by(class_id=school_class.id).count(),
                "active_count": Student.query.filter_by(
                    class_id=school_class.id, aktif=True
                ).count(),
            }
        )

    return render_template(
        "admin/classes.html",
        class_rows=class_rows,
        teachers=teachers,
    )


@bp.route("/kelas/<int:class_id>/edit", methods=["GET", "POST"])
def class_edit(class_id):
    school_class = db.session.get(SchoolClass, class_id) or abort(404)
    teachers = (
        User.query.filter_by(role="guru", aktif=True).order_by(User.nama.asc()).all()
    )
    values = {
        "nama_kelas": school_class.nama_kelas,
        "guru_id": str(school_class.guru_id or ""),
    }

    if request.method == "POST":
        values = {
            "nama_kelas": request.form.get("nama_kelas", "").strip().upper(),
            "guru_id": request.form.get("guru_id", "").strip(),
        }
        errors = _validate_class(values["nama_kelas"], exclude_id=school_class.id)
        teacher, teacher_error = _resolve_teacher(values["guru_id"])
        if teacher_error:
            errors.append(teacher_error)
        if not errors:
            school_class.nama_kelas = values["nama_kelas"]
            school_class.guru_id = teacher.id if teacher else None
            try:
                db.session.commit()
                flash(f"Kelas {school_class.nama_kelas} berhasil diperbarui.", "success")
                return redirect(url_for("admin.classes"))
            except IntegrityError:
                db.session.rollback()
                errors.append("Nama kelas sudah digunakan.")
        for error in errors:
            flash(error, "danger")

    return render_template(
        "admin/class_form.html",
        school_class=school_class,
        teachers=teachers,
        values=values,
    )


@bp.post("/kelas/<int:class_id>/hapus")
def class_delete(class_id):
    school_class = db.session.get(SchoolClass, class_id) or abort(404)
    student_count = Student.query.filter_by(class_id=school_class.id).count()
    if student_count:
        flash(
            f"Kelas {school_class.nama_kelas} masih memiliki {student_count} siswa. "
            "Pindahkan atau hapus siswanya terlebih dahulu.",
            "warning",
        )
        return redirect(url_for("admin.classes"))
    nama = school_class.nama_kelas
    db.session.delete(school_class)
    db.session.commit()
    flash(f"Kelas {nama} berhasil dihapus.", "success")
    return redirect(url_for("admin.classes"))


@bp.route("/guru", methods=["GET", "POST"])
def teachers():
    if request.method == "POST":
        nama = request.form.get("nama", "").strip()
        username = request.form.get("username", "").strip().lower()
        password = request.form.get("password", "")
        errors = _validate_teacher(nama, username, password, require_password=True)
        if not errors:
            teacher = User(nama=nama, username=username, role="guru", aktif=True)
            teacher.set_password(password)
            db.session.add(teacher)
            try:
                db.session.commit()
                flash(f"Akun guru {nama} berhasil dibuat.", "success")
                return redirect(url_for("admin.teachers"))
            except IntegrityError:
                db.session.rollback()
                errors.append("Username sudah digunakan. Pilih username lain.")
        for error in errors:
            flash(error, "danger")

    teacher_rows = []
    for teacher in User.query.filter_by(role="guru").order_by(User.nama.asc()).all():
        teacher_rows.append(
            {
                "teacher": teacher,
                "classes": SchoolClass.query.filter_by(guru_id=teacher.id)
                .order_by(SchoolClass.nama_kelas.asc())
                .all(),
            }
        )
    return render_template("admin/teachers.html", teacher_rows=teacher_rows)


@bp.route("/guru/<int:user_id>/edit", methods=["GET", "POST"])
def teacher_edit(user_id):
    teacher = db.session.get(User, user_id) or abort(404)
    if teacher.role != "guru":
        abort(404)

    values = {
        "nama": teacher.nama,
        "username": teacher.username,
        "aktif": teacher.aktif,
    }
    if request.method == "POST":
        values = {
            "nama": request.form.get("nama", "").strip(),
            "username": request.form.get("username", "").strip().lower(),
            "aktif": bool(request.form.get("aktif")),
        }
        password = request.form.get("password", "")
        errors = _validate_teacher(
            values["nama"],
            values["username"],
            password,
            require_password=False,
            exclude_id=teacher.id,
        )
        if not errors:
            teacher.nama = values["nama"]
            teacher.username = values["username"]
            teacher.aktif = values["aktif"]
            if password:
                teacher.set_password(password)
            try:
                db.session.commit()
                flash(f"Akun guru {teacher.nama} berhasil diperbarui.", "success")
                return redirect(url_for("admin.teachers"))
            except IntegrityError:
                db.session.rollback()
                errors.append("Username sudah digunakan. Pilih username lain.")
        for error in errors:
            flash(error, "danger")

    return render_template(
        "admin/teacher_form.html",
        teacher=teacher,
        values=values,
    )


@bp.post("/guru/<int:user_id>/hapus")
def teacher_delete(user_id):
    teacher = db.session.get(User, user_id) or abort(404)
    if teacher.role != "guru":
        abort(404)
    class_count = SchoolClass.query.filter_by(guru_id=teacher.id).count()
    attendance_count = Attendance.query.filter_by(dicatat_oleh=teacher.id).count()
    if class_count or attendance_count:
        flash(
            f"Akun {teacher.nama} tidak bisa dihapus karena masih terhubung dengan "
            f"{class_count} kelas dan {attendance_count} catatan absensi. "
            "Nonaktifkan akun ini saja.",
            "warning",
        )
        return redirect(url_for("admin.teachers"))
    nama = teacher.nama
    db.session.delete(teacher)
    db.session.commit()
    flash(f"Akun guru {nama} berhasil dihapus.", "success")
    return redirect(url_for("admin.teachers"))


@bp.get("/rekap")
def reports():
    classes = SchoolClass.query.order_by(SchoolClass.nama_kelas.asc()).all()
    selected_class = _selected_class_from_request(classes)
    selected_classes = [selected_class] if selected_class else classes
    start, end = resolve_period(request.args)
    data = build_reports(selected_classes, start, end)
    export_url = url_for(
        "admin.reports_export",
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
        all_label="Semua kelas",
    )


@bp.get("/rekap/export")
def reports_export():
    classes = SchoolClass.query.order_by(SchoolClass.nama_kelas.asc()).all()
    selected_class = _selected_class_from_request(classes)
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


def _selected_class_from_request(classes):
    class_id = request.args.get("kelas", type=int)
    if not class_id:
        return None
    for school_class in classes:
        if school_class.id == class_id:
            return school_class
    abort(404)


def _validate_student(values, exclude_id=None):
    errors = []
    nis = values["nis"]
    nama = values["nama"]
    class_id = values["class_id"]
    school_class = None

    if not nis:
        errors.append("NIS wajib diisi.")
    elif len(nis) > 30:
        errors.append("NIS maksimal 30 karakter.")
    if not nama:
        errors.append("Nama siswa wajib diisi.")
    elif len(nama) > 100:
        errors.append("Nama siswa maksimal 100 karakter.")

    try:
        school_class = db.session.get(SchoolClass, int(class_id))
    except (TypeError, ValueError):
        school_class = None
    if not school_class:
        errors.append("Pilih kelas yang valid.")

    if nis:
        duplicate = Student.query.filter(Student.nis == nis)
        if exclude_id:
            duplicate = duplicate.filter(Student.id != exclude_id)
        if duplicate.first():
            errors.append("NIS sudah dipakai siswa lain.")

    return errors, school_class


def _validate_class(nama_kelas, exclude_id=None):
    errors = []
    if not nama_kelas:
        errors.append("Nama kelas wajib diisi.")
    elif len(nama_kelas) > 20:
        errors.append("Nama kelas maksimal 20 karakter.")
    if nama_kelas:
        duplicate = SchoolClass.query.filter(
            db.func.upper(SchoolClass.nama_kelas) == nama_kelas.upper()
        )
        if exclude_id:
            duplicate = duplicate.filter(SchoolClass.id != exclude_id)
        if duplicate.first():
            errors.append("Nama kelas sudah digunakan.")
    return errors


def _resolve_teacher(guru_id):
    if not guru_id:
        return None, None
    try:
        teacher = db.session.get(User, int(guru_id))
    except (TypeError, ValueError):
        return None, "Guru yang dipilih tidak valid."
    if not teacher or teacher.role != "guru":
        return None, "Guru yang dipilih tidak ditemukan."
    return teacher, None


def _validate_teacher(nama, username, password, require_password, exclude_id=None):
    errors = []
    if not nama:
        errors.append("Nama guru wajib diisi.")
    elif len(nama) > 100:
        errors.append("Nama guru maksimal 100 karakter.")
    if not username:
        errors.append("Username wajib diisi.")
    elif len(username) > 50:
        errors.append("Username maksimal 50 karakter.")
    elif " " in username:
        errors.append("Username tidak boleh mengandung spasi.")
    if require_password or password:
        if len(password) < 6:
            errors.append("Password minimal 6 karakter.")
    if username:
        duplicate = User.query.filter(db.func.lower(User.username) == username.lower())
        if exclude_id:
            duplicate = duplicate.filter(User.id != exclude_id)
        if duplicate.first():
            errors.append("Username sudah digunakan.")
    return errors


def _cell_text(value):
    if value is None:
        return ""
    if isinstance(value, float) and value.is_integer():
        return str(int(value))
    return str(value).strip()


def _normalize_header(value):
    return " ".join(str(value or "").strip().lower().replace("_", " ").split())


def _import_students(upload, extension, classes):
    if extension == "csv":
        raw = upload.read()
        try:
            text = raw.decode("utf-8-sig")
        except UnicodeDecodeError:
            text = raw.decode("latin-1")
        sample = text[:2048]
        try:
            dialect = csv.Sniffer().sniff(sample, delimiters=",;")
        except csv.Error:
            dialect = csv.excel
        rows = [list(row) for row in csv.reader(io.StringIO(text), dialect)]
    else:
        workbook = load_workbook(upload, read_only=True, data_only=True)
        sheet = workbook.active
        rows = [list(row) for row in sheet.iter_rows(values_only=True)]
        workbook.close()

    if not rows:
        raise ValueError("File kosong. Gunakan template impor yang disediakan.")

    header_map = {}
    for index, raw_header in enumerate(rows[0]):
        header = _normalize_header(raw_header)
        if header in ("nis", "nomor induk", "nomor induk siswa"):
            header_map["nis"] = index
        elif header in ("nama", "nama siswa"):
            header_map["nama"] = index
        elif header in ("kelas", "nama kelas"):
            header_map["kelas"] = index

    missing = [label for label in ("nis", "nama", "kelas") if label not in header_map]
    if missing:
        raise ValueError(
            "Kolom wajib tidak ditemukan: "
            + ", ".join(label.upper() for label in missing)
            + ". Gunakan template impor yang disediakan."
        )

    class_map = {school_class.nama_kelas.upper(): school_class for school_class in classes}
    existing_nis = {student.nis for student in Student.query.all()}
    seen_nis = set()
    errors = []
    skipped = 0
    created = 0

    for row_number, row in enumerate(rows[1:], start=2):
        values = {
            key: _cell_text(row[index]) if index < len(row) else ""
            for key, index in header_map.items()
        }
        if not values["nis"] and not values["nama"] and not values["kelas"]:
            continue

        row_errors = []
        if not values["nis"]:
            row_errors.append("NIS kosong")
        elif len(values["nis"]) > 30:
            row_errors.append("NIS lebih dari 30 karakter")
        elif values["nis"] in existing_nis or values["nis"] in seen_nis:
            row_errors.append("NIS sudah terdaftar")
        if not values["nama"]:
            row_errors.append("nama kosong")
        elif len(values["nama"]) > 100:
            row_errors.append("nama lebih dari 100 karakter")
        school_class = class_map.get(values["kelas"].upper())
        if not values["kelas"]:
            row_errors.append("kelas kosong")
        elif not school_class:
            row_errors.append(f"kelas '{values['kelas']}' tidak ditemukan")

        if row_errors:
            skipped += 1
            if len(errors) < 60:
                errors.append(f"Baris {row_number}: " + ", ".join(row_errors) + ".")
            continue

        seen_nis.add(values["nis"])
        student = Student(
            nis=values["nis"],
            nama=values["nama"],
            class_id=school_class.id,
            qr_code=generate_qr_code(),
            aktif=True,
        )
        db.session.add(student)
        created += 1

    if created:
        try:
            db.session.commit()
        except IntegrityError:
            db.session.rollback()
            raise ValueError("Terjadi duplikasi data. Tidak ada siswa yang diimpor.")
    else:
        db.session.rollback()

    if skipped > len(errors):
        errors.append(f"...dan {skipped - len(errors)} baris bermasalah lainnya.")

    return {"created": created, "skipped": skipped, "errors": errors}
