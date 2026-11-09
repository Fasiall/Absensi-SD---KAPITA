"""Isi database dengan data contoh untuk demo dan pengujian.

Pemakaian:
    python seed.py            # isi jika database masih kosong
    python seed.py --force    # hapus semua data lalu isi ulang
"""

import argparse
import random
import sys
from datetime import timedelta

from dotenv import load_dotenv

load_dotenv()

from app import create_app, db  # noqa: E402
from app.models import (
    Attendance,
    SchoolClass,
    Student,
    User,
    STATUS_ALPA,
    STATUS_HADIR,
    STATUS_IZIN,
    STATUS_SAKIT,
)
from app.timeutil import today_local
from app.utils import generate_qr_code

RANDOM_SEED = 2024
HISTORY_DAYS = 30
TODAY_SCANNED_PER_CLASS = 8
STUDENTS_PER_CLASS = 20

CLASS_TEACHERS = [
    ("1A", "guru1"),
    ("2A", "guru2"),
    ("3A", "guru3"),
    ("4A", "guru1"),
    ("5A", "guru2"),
    ("6A", "guru3"),
]

TEACHERS = [
    ("guru1", "Ibu Sari Wulandari"),
    ("guru2", "Bapak Budi Santoso"),
    ("guru3", "Ibu Dewi Lestari"),
]

STATUS_POOL = (
    [STATUS_HADIR] * 85
    + [STATUS_SAKIT] * 5
    + [STATUS_IZIN] * 5
    + [STATUS_ALPA] * 5
)


def previous_weekdays(today, count):
    dates = []
    cursor = today - timedelta(days=1)
    while len(dates) < count:
        if cursor.weekday() < 5:
            dates.append(cursor)
        cursor -= timedelta(days=1)
    return list(reversed(dates))


def build_attendance(student, tanggal, status, rng, pencatat_id):
    jam_masuk = None
    catatan = None

    if status == STATUS_HADIR:
        jam_masuk = _random_time(rng, 6, 45, 7, 20)
    elif status == STATUS_SAKIT:
        catatan = rng.choice(["Surat dokter", "Demam", "Batuk dan pilek"])
    elif status == STATUS_IZIN:
        catatan = rng.choice(["Izin keluarga", "Acara keluarga", "Keperluan pribadi"])
    elif status == STATUS_ALPA:
        catatan = rng.choice([None, None, "Tanpa keterangan"])

    return Attendance(
        student_id=student.id,
        tanggal=tanggal,
        status=status,
        jam_masuk=jam_masuk,
        dicatat_oleh=pencatat_id,
        catatan=catatan,
    )


def _random_time(rng, start_hour, start_minute, end_hour, end_minute):
    from datetime import time

    start = start_hour * 60 + start_minute
    end = end_hour * 60 + end_minute
    total = rng.randint(start, end)
    return time(total // 60, total % 60)


def seed(force=False):
    app = create_app()

    with app.app_context():
        if not force and User.query.first():
            print("Database sudah berisi data.")
            print("Gunakan 'python seed.py --force' untuk menghapus dan mengisi ulang.")
            return 1

        if force:
            print("Menghapus seluruh data lama...")
            db.drop_all()
            db.session.remove()
        db.create_all()

        rng = random.Random(RANDOM_SEED)
        today = today_local()

        admin = User(nama="Admin Sekolah", username="admin", role="admin", aktif=True)
        admin.set_password("admin123")
        db.session.add(admin)

        teachers = {}
        for username, nama in TEACHERS:
            teacher = User(nama=nama, username=username, role="guru", aktif=True)
            teacher.set_password("guru123")
            db.session.add(teacher)
            teachers[username] = teacher

        db.session.flush()

        classes = []
        for nama_kelas, username in CLASS_TEACHERS:
            school_class = SchoolClass(
                nama_kelas=nama_kelas, guru_id=teachers[username].id
            )
            db.session.add(school_class)
            classes.append(school_class)

        db.session.flush()

        students_by_class = {}
        nis_counter = 2024001
        for school_class in classes:
            students = []
            for index in range(1, STUDENTS_PER_CLASS + 1):
                student = Student(
                    nis=str(nis_counter),
                    nama=f"Siswa {school_class.nama_kelas}-{index:02d}",
                    class_id=school_class.id,
                    qr_code=generate_qr_code(),
                    aktif=True,
                )
                db.session.add(student)
                students.append(student)
                nis_counter += 1
            students_by_class[school_class.id] = students

        db.session.flush()

        history_dates = previous_weekdays(today, HISTORY_DAYS)
        total_records = 0

        for school_class in classes:
            pencatat_id = school_class.guru_id
            for student in students_by_class[school_class.id]:
                for tanggal in history_dates:
                    status = rng.choice(STATUS_POOL)
                    db.session.add(
                        build_attendance(
                            student, tanggal, status, rng, pencatat_id
                        )
                    )
                    total_records += 1

        for school_class in classes:
            pencatat_id = school_class.guru_id
            for student in students_by_class[school_class.id][:TODAY_SCANNED_PER_CLASS]:
                db.session.add(
                    build_attendance(
                        student, today, STATUS_HADIR, rng, pencatat_id
                    )
                )
                total_records += 1

        db.session.commit()

        print("Seed selesai.")
        print(f"  Admin   : admin / admin123")
        for username, _nama in TEACHERS:
            print(f"  Guru    : {username} / guru123")
        print(f"  Kelas   : {len(classes)}")
        print(f"  Siswa   : {nis_counter - 2024001}")
        print(f"  Absensi : {total_records} catatan ({HISTORY_DAYS} hari kerja + hari ini)")
        print("")
        print("Hari ini hanya 8 siswa pertama per kelas yang sudah tercatat,")
        print("sehingga sisa siswa bisa dipakai untuk mencoba fitur scan QR.")
        return 0


def main():
    parser = argparse.ArgumentParser(description="Seed data contoh Absensi QR Siswa SD.")
    parser.add_argument(
        "--force",
        action="store_true",
        help="Hapus semua data yang ada lalu isi ulang dari awal.",
    )
    args = parser.parse_args()
    return seed(force=args.force)


if __name__ == "__main__":
    sys.exit(main())
