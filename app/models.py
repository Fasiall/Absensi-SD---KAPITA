from flask_login import UserMixin
from werkzeug.security import check_password_hash, generate_password_hash

from . import db
from .timeutil import now_local


def naive_now():
    """Waktu lokal tanpa zona waktu agar cocok dengan kolom DateTime SQLite."""

    return now_local().replace(tzinfo=None)

STATUS_HADIR = "Hadir"
STATUS_SAKIT = "Sakit"
STATUS_IZIN = "Izin"
STATUS_ALPA = "Alpa"
STATUS_LIST = (STATUS_HADIR, STATUS_SAKIT, STATUS_IZIN, STATUS_ALPA)


class User(UserMixin, db.Model):
    __tablename__ = "users"

    id = db.Column(db.Integer, primary_key=True)
    nama = db.Column(db.String(100), nullable=False)
    username = db.Column(db.String(50), unique=True, nullable=False, index=True)
    password_hash = db.Column(db.String(255), nullable=False)
    role = db.Column(db.String(10), nullable=False, default="guru")
    aktif = db.Column(db.Boolean, nullable=False, default=True)
    created_at = db.Column(db.DateTime, nullable=False, default=naive_now)

    classes = db.relationship("SchoolClass", back_populates="guru", lazy="select")

    def set_password(self, password):
        self.password_hash = generate_password_hash(password)

    def check_password(self, password):
        return check_password_hash(self.password_hash, password)

    @property
    def is_active(self):
        return bool(self.aktif)

    @property
    def is_admin(self):
        return self.role == "admin"

    def __repr__(self):
        return f"<User {self.username} ({self.role})>"


class SchoolClass(db.Model):
    __tablename__ = "classes"

    id = db.Column(db.Integer, primary_key=True)
    nama_kelas = db.Column(db.String(20), unique=True, nullable=False, index=True)
    guru_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=True)

    guru = db.relationship("User", back_populates="classes")
    students = db.relationship(
        "Student",
        back_populates="school_class",
        cascade="all, delete-orphan",
        lazy="select",
    )

    def __repr__(self):
        return f"<SchoolClass {self.nama_kelas}>"


class Student(db.Model):
    __tablename__ = "students"

    id = db.Column(db.Integer, primary_key=True)
    nis = db.Column(db.String(30), unique=True, nullable=False, index=True)
    nama = db.Column(db.String(100), nullable=False)
    class_id = db.Column(db.Integer, db.ForeignKey("classes.id"), nullable=False, index=True)
    qr_code = db.Column(db.String(40), unique=True, nullable=False, index=True)
    aktif = db.Column(db.Boolean, nullable=False, default=True)
    created_at = db.Column(db.DateTime, nullable=False, default=naive_now)

    school_class = db.relationship("SchoolClass", back_populates="students")
    attendances = db.relationship(
        "Attendance",
        back_populates="student",
        cascade="all, delete-orphan",
        lazy="select",
    )

    def __repr__(self):
        return f"<Student {self.nis} - {self.nama}>"


class Attendance(db.Model):
    __tablename__ = "attendance"
    __table_args__ = (
        db.UniqueConstraint("student_id", "tanggal", name="uq_attendance_student_date"),
    )

    id = db.Column(db.Integer, primary_key=True)
    student_id = db.Column(db.Integer, db.ForeignKey("students.id"), nullable=False, index=True)
    tanggal = db.Column(db.Date, nullable=False, index=True)
    jam_masuk = db.Column(db.Time, nullable=True)
    status = db.Column(db.String(10), nullable=False, default=STATUS_HADIR)
    dicatat_oleh = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=True)
    catatan = db.Column(db.String(255), nullable=True)
    updated_at = db.Column(
        db.DateTime, nullable=False, default=naive_now, onupdate=naive_now
    )

    student = db.relationship("Student", back_populates="attendances")
    pencatat = db.relationship("User", foreign_keys=[dicatat_oleh])

    def __repr__(self):
        return f"<Attendance {self.student_id} {self.tanggal} {self.status}>"
