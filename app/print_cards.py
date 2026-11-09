from flask import Blueprint, abort, flash, redirect, render_template, request, url_for
from flask_login import current_user, login_required

from . import db
from .models import SchoolClass, Student
from .utils import can_access_class, chunked, get_accessible_classes, qr_png_data_uri

bp = Blueprint("print_cards", __name__)


@bp.get("/")
@login_required
def index():
    classes = get_accessible_classes(current_user)
    back_url = (
        url_for("admin.dashboard")
        if current_user.role == "admin"
        else url_for("guru.classes")
    )
    return render_template("print/index.html", classes=classes, back_url=back_url)


@bp.get("/kartu")
@login_required
def cards():
    student_id = request.args.get("student_id", type=int)
    class_id = request.args.get("class_id", type=int)

    if student_id:
        student = db.session.get(Student, student_id) or abort(404)
        if not can_access_class(current_user, student.school_class):
            abort(403)
        students = [student]
        school_class = student.school_class
        title = f"Kartu QR - {student.nama}"
    elif class_id:
        school_class = db.session.get(SchoolClass, class_id) or abort(404)
        if not can_access_class(current_user, school_class):
            abort(403)
        students = (
            Student.query.filter_by(class_id=school_class.id, aktif=True)
            .order_by(Student.nama.asc())
            .all()
        )
        title = f"Kartu QR Kelas {school_class.nama_kelas}"
    else:
        flash("Pilih kelas atau siswa yang ingin dicetak kartunya.", "warning")
        return redirect(url_for("print_cards.index"))

    if not students:
        flash("Belum ada siswa aktif pada kelas ini.", "warning")
        return redirect(url_for("print_cards.index"))

    qr_images = {student.id: qr_png_data_uri(student.qr_code) for student in students}
    sheets = chunked(students, 10)
    back_url = (
        url_for("admin.students")
        if current_user.role == "admin"
        else url_for("guru.classes")
    )
    return render_template(
        "print/cards.html",
        students=students,
        sheets=sheets,
        qr_images=qr_images,
        school_class=school_class,
        title=title,
        back_url=back_url,
    )
