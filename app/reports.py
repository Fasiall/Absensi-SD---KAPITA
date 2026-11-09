from collections import defaultdict

from .models import Attendance, Student, STATUS_LIST
from .timeutil import parse_date, today_local


def resolve_period(args):
    today = today_local()
    start = parse_date(args.get("dari"), today.replace(day=1))
    end = parse_date(args.get("sampai"), today)
    if start > end:
        start, end = end, start
    if end > today:
        end = today
    if start > end:
        start = end
    return start, end


def build_reports(classes, start, end):
    """Hitung rekap per kelas. Tanggal tanpa catatan dianggap Alpa.

    Hari efektif = tanggal yang memiliki minimal satu catatan absensi
    untuk kelas tersebut pada rentang tanggal yang dipilih.
    """

    reports = []
    for school_class in classes:
        students = (
            Student.query.filter_by(class_id=school_class.id, aktif=True)
            .order_by(Student.nama.asc())
            .all()
        )
        rows = (
            Attendance.query.join(Student)
            .filter(
                Student.class_id == school_class.id,
                Attendance.tanggal >= start,
                Attendance.tanggal <= end,
            )
            .order_by(Attendance.tanggal.asc())
            .all()
        )
        dates = sorted({row.tanggal for row in rows})
        by_student = defaultdict(dict)
        for row in rows:
            by_student[row.student_id][row.tanggal] = row

        summary = {status: 0 for status in STATUS_LIST}
        student_rows = []
        for student in students:
            records = by_student.get(student.id, {})
            counts = {status: 0 for status in STATUS_LIST}
            for record in records.values():
                if record.status in counts:
                    counts[record.status] += 1
            counts["Alpa"] += max(0, len(dates) - len(records))
            total = len(dates)
            percent = (counts["Hadir"] / total * 100) if total else 0.0
            student_rows.append(
                {
                    "student": student,
                    "counts": counts,
                    "total": total,
                    "percent": round(percent, 1),
                }
            )
            for status in STATUS_LIST:
                summary[status] += counts[status]

        reports.append(
            {
                "class": school_class,
                "students": student_rows,
                "dates": dates,
                "summary": summary,
                "total_days": len(dates),
                "total_students": len(students),
            }
        )

    aggregate = {status: sum(item["summary"][status] for item in reports) for status in STATUS_LIST}
    weighted_days = sum(item["total_days"] * item["total_students"] for item in reports)
    total_hadir = aggregate["Hadir"]
    overall_percent = (total_hadir / weighted_days * 100) if weighted_days else 0.0

    return {
        "reports": reports,
        "aggregate": aggregate,
        "total_students": sum(item["total_students"] for item in reports),
        "total_hadir": total_hadir,
        "overall_percent": round(overall_percent, 1),
        "has_data": any(item["total_days"] for item in reports),
        "has_students": any(item["total_students"] for item in reports),
    }


def detail_rows_for_export(classes, start, end):
    class_ids = [school_class.id for school_class in classes]
    if not class_ids:
        return []
    return (
        Attendance.query.join(Student)
        .filter(
            Student.class_id.in_(class_ids),
            Attendance.tanggal >= start,
            Attendance.tanggal <= end,
        )
        .order_by(Attendance.tanggal.asc(), Student.nama.asc())
        .all()
    )
