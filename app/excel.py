import io

from openpyxl import Workbook
from openpyxl.styles import Alignment, Border, Font, PatternFill, Side
from openpyxl.utils import get_column_letter

from .formatting import periode_id
from .timeutil import now_local

ACCENT = "2563EB"
ACCENT_SOFT = "DBEAFE"
DARK = "1E293B"
MUTED = "64748B"
BORDER_COLOR = "CBD5E1"
ZEBRA = "F8FAFC"

THIN = Side(style="thin", color=BORDER_COLOR)
BORDER = Border(left=THIN, right=THIN, top=THIN, bottom=THIN)


def _safe_text(value):
    """Cegah teks dari pengguna dibaca sebagai formula oleh Excel."""

    if isinstance(value, str):
        stripped = value.lstrip()
        if stripped.startswith(("=", "+", "-", "@")):
            return "'" + value
    return value


def _style_header_row(ws, row_number, columns):
    for column in range(1, columns + 1):
        cell = ws.cell(row=row_number, column=column)
        cell.font = Font(bold=True, color="FFFFFF", size=11)
        cell.fill = PatternFill("solid", fgColor=ACCENT)
        cell.alignment = Alignment(horizontal="center", vertical="center", wrap_text=True)
        cell.border = BORDER
    ws.row_dimensions[row_number].height = 28


def _title_block(ws, last_column, school_name, subtitle, class_label, period_label, printed_by):
    ws.merge_cells(start_row=1, start_column=1, end_row=1, end_column=last_column)
    cell = ws.cell(row=1, column=1, value=_safe_text(school_name.upper()))
    cell.font = Font(bold=True, size=14, color=ACCENT)
    cell.alignment = Alignment(horizontal="center")

    ws.merge_cells(start_row=2, start_column=1, end_row=2, end_column=last_column)
    cell = ws.cell(row=2, column=1, value=_safe_text(subtitle))
    cell.font = Font(bold=True, size=18, color=DARK)
    cell.alignment = Alignment(horizontal="center")

    ws.merge_cells(start_row=3, start_column=1, end_row=3, end_column=last_column)
    cell = ws.cell(row=3, column=1, value=_safe_text(class_label))
    cell.font = Font(size=11, color=DARK)
    cell.alignment = Alignment(horizontal="center")

    ws.merge_cells(start_row=4, start_column=1, end_row=4, end_column=last_column)
    cell = ws.cell(row=4, column=1, value=_safe_text(f"Periode: {period_label}"))
    cell.font = Font(size=11, color=DARK)
    cell.alignment = Alignment(horizontal="center")

    ws.merge_cells(start_row=5, start_column=1, end_row=5, end_column=last_column)
    cell = ws.cell(
        row=5,
        column=1,
        value=_safe_text(
            f"Dicetak: {now_local().strftime('%d-%m-%Y %H:%M')} oleh {printed_by}"
        ),
    )
    cell.font = Font(size=9, italic=True, color=MUTED)
    cell.alignment = Alignment(horizontal="center")


def _auto_width(ws, min_width=10, max_width=42):
    widths = {}
    for row in ws.iter_rows():
        for cell in row:
            if cell.value is None:
                continue
            letter = get_column_letter(cell.column)
            lines = str(cell.value).splitlines() or [""]
            longest = max(len(line) for line in lines)
            widths[letter] = max(widths.get(letter, 0), longest)
    for letter, width in widths.items():
        ws.column_dimensions[letter].width = min(max(width + 3, min_width), max_width)


def build_report_workbook(report_data, classes, start, end, school_name, printed_by, detail_rows):
    workbook = Workbook()
    ws = workbook.active
    ws.title = "Rekap"

    class_label = "Kelas: " + (", ".join(item.nama_kelas for item in classes) if classes else "Semua kelas")
    period_label = periode_id(start, end)
    _title_block(
        ws,
        10,
        school_name,
        "LAPORAN ABSENSI SISWA",
        class_label,
        period_label,
        printed_by,
    )

    aggregate = report_data["aggregate"]
    summary_items = [
        ("Total Siswa", report_data["total_students"]),
        ("Hadir", aggregate["Hadir"]),
        ("Sakit", aggregate["Sakit"]),
        ("Izin", aggregate["Izin"]),
        ("Alpa", aggregate["Alpa"]),
    ]
    for index, (label, value) in enumerate(summary_items):
        label_col = index * 2 + 1
        value_col = label_col + 1
        label_cell = ws.cell(row=7, column=label_col, value=label)
        label_cell.font = Font(bold=True, color=DARK)
        label_cell.fill = PatternFill("solid", fgColor=ACCENT_SOFT)
        label_cell.alignment = Alignment(horizontal="center")
        label_cell.border = BORDER
        value_cell = ws.cell(row=7, column=value_col, value=value)
        value_cell.font = Font(bold=True, color=ACCENT)
        value_cell.alignment = Alignment(horizontal="center")
        value_cell.border = BORDER

    headers = [
        "No",
        "NIS",
        "Nama",
        "Kelas",
        "Hadir",
        "Sakit",
        "Izin",
        "Alpa",
        "Hari Efektif",
        "Kehadiran",
    ]
    header_row = 9
    for column, header in enumerate(headers, start=1):
        ws.cell(row=header_row, column=column, value=header)
    _style_header_row(ws, header_row, len(headers))

    row_number = header_row + 1
    number = 1
    for report in report_data["reports"]:
        for student_row in report["students"]:
            student = student_row["student"]
            counts = student_row["counts"]
            values = [
                number,
                _safe_text(student.nis),
                _safe_text(student.nama),
                _safe_text(report["class"].nama_kelas),
                counts["Hadir"],
                counts["Sakit"],
                counts["Izin"],
                counts["Alpa"],
                student_row["total"],
                (student_row["percent"] / 100) if student_row["total"] else 0,
            ]
            for column, value in enumerate(values, start=1):
                cell = ws.cell(row=row_number, column=column, value=value)
                cell.border = BORDER
                cell.alignment = Alignment(
                    horizontal="left" if column == 3 else "center", vertical="center"
                )
                if row_number % 2 == 0:
                    cell.fill = PatternFill("solid", fgColor=ZEBRA)
            ws.cell(row=row_number, column=10).number_format = "0.0%"
            row_number += 1
            number += 1

    if row_number > header_row + 1:
        total_row = row_number
        ws.cell(row=total_row, column=1, value="")
        ws.cell(row=total_row, column=2, value="TOTAL")
        ws.cell(row=total_row, column=3, value="")
        ws.cell(row=total_row, column=4, value="")
        ws.cell(row=total_row, column=5, value=aggregate["Hadir"])
        ws.cell(row=total_row, column=6, value=aggregate["Sakit"])
        ws.cell(row=total_row, column=7, value=aggregate["Izin"])
        ws.cell(row=total_row, column=8, value=aggregate["Alpa"])
        ws.cell(row=total_row, column=9, value="")
        ws.cell(
            row=total_row,
            column=10,
            value=(report_data["overall_percent"] / 100),
        )
        for column in range(1, 11):
            cell = ws.cell(row=total_row, column=column)
            cell.font = Font(bold=True, color=DARK)
            cell.fill = PatternFill("solid", fgColor=ACCENT_SOFT)
            cell.border = BORDER
            cell.alignment = Alignment(horizontal="center")
        ws.cell(row=total_row, column=10).number_format = "0.0%"
        ws.auto_filter.ref = f"A{header_row}:J{total_row - 1}"

    ws.freeze_panes = f"A{header_row + 1}"
    _auto_width(ws)
    ws.column_dimensions["C"].width = 32
    ws.sheet_view.showGridLines = False
    ws.page_setup.orientation = "landscape"
    ws.page_setup.fitToWidth = 1
    ws.sheet_properties.pageSetUpPr.fitToPage = True

    detail = workbook.create_sheet("Detail")
    _title_block(
        detail,
        8,
        school_name,
        "DETAIL ABSENSI SISWA",
        class_label,
        period_label,
        printed_by,
    )
    detail_headers = [
        "Tanggal",
        "Kelas",
        "NIS",
        "Nama",
        "Status",
        "Jam Masuk",
        "Dicatat Oleh",
        "Catatan",
    ]
    detail_header_row = 7
    for column, header in enumerate(detail_headers, start=1):
        detail.cell(row=detail_header_row, column=column, value=header)
    _style_header_row(detail, detail_header_row, len(detail_headers))

    detail_row = detail_header_row + 1
    for record in detail_rows:
        student = record.student
        values = [
            record.tanggal,
            _safe_text(student.school_class.nama_kelas if student.school_class else "-"),
            _safe_text(student.nis),
            _safe_text(student.nama),
            _safe_text(record.status),
            record.jam_masuk,
            _safe_text(record.pencatat.nama if record.pencatat else "-"),
            _safe_text(record.catatan or ""),
        ]
        for column, value in enumerate(values, start=1):
            cell = detail.cell(row=detail_row, column=column, value=value)
            cell.border = BORDER
            cell.alignment = Alignment(
                horizontal="left" if column in (4, 8) else "center", vertical="center"
            )
            if detail_row % 2 == 0:
                cell.fill = PatternFill("solid", fgColor=ZEBRA)
        detail.cell(row=detail_row, column=1).number_format = "DD-MM-YYYY"
        detail.cell(row=detail_row, column=6).number_format = "HH:MM"
        detail_row += 1

    if not detail_rows:
        detail.merge_cells(
            start_row=detail_row, start_column=1, end_row=detail_row, end_column=8
        )
        cell = detail.cell(
            row=detail_row,
            column=1,
            value="Tidak ada catatan absensi pada periode ini.",
        )
        cell.alignment = Alignment(horizontal="center")
        cell.font = Font(italic=True, color=MUTED)
        detail_row += 1

    note_row = detail_row + 1
    detail.merge_cells(start_row=note_row, start_column=1, end_row=note_row, end_column=8)
    note = detail.cell(
        row=note_row,
        column=1,
        value=(
            "Catatan: siswa yang tidak memiliki catatan pada hari efektif "
            "dihitung Alpa di sheet Rekap."
        ),
    )
    note.font = Font(italic=True, size=9, color=MUTED)
    note.alignment = Alignment(horizontal="left")
    detail.freeze_panes = f"A{detail_header_row + 1}"
    _auto_width(detail)
    detail.column_dimensions["D"].width = 30
    detail.column_dimensions["H"].width = 30
    detail.sheet_view.showGridLines = False
    detail.page_setup.orientation = "landscape"
    detail.page_setup.fitToWidth = 1
    detail.sheet_properties.pageSetUpPr.fitToPage = True

    buffer = io.BytesIO()
    workbook.save(buffer)
    buffer.seek(0)
    return buffer


def build_import_template(classes):
    workbook = Workbook()
    ws = workbook.active
    ws.title = "Data Siswa"
    headers = ["NIS", "Nama", "Kelas"]
    for column, header in enumerate(headers, start=1):
        ws.cell(row=1, column=column, value=header)
    _style_header_row(ws, 1, 3)
    ws.cell(row=2, column=1, value="")
    ws.cell(row=2, column=2, value="")
    ws.cell(row=2, column=3, value="")
    ws.column_dimensions["A"].width = 18
    ws.column_dimensions["B"].width = 32
    ws.column_dimensions["C"].width = 14
    ws.freeze_panes = "A2"

    guide = workbook.create_sheet("Petunjuk")
    guide.column_dimensions["A"].width = 18
    guide.column_dimensions["B"].width = 95
    guide.column_dimensions["C"].width = 14
    title = guide.cell(row=1, column=1, value="PETUNJUK IMPOR DATA SISWA")
    title.font = Font(bold=True, size=16, color=ACCENT)
    guide.merge_cells("A1:B1")

    steps = [
        "1. Buka sheet 'Data Siswa'.",
        "2. Isi data mulai baris ke-2. Jangan mengubah nama kolom.",
        "3. Kolom wajib: NIS, Nama, Kelas. NIS harus unik (tidak boleh sama).",
        "4. Nama kelas harus sama persis dengan daftar di bawah (contoh: 1A).",
        "5. Simpan file sebagai .xlsx atau .csv, lalu unggah di halaman Impor Siswa.",
        "",
        "Contoh isi:",
    ]
    row = 3
    for text in steps:
        cell = guide.cell(row=row, column=2, value=text)
        cell.alignment = Alignment(wrap_text=True, vertical="top")
        row += 1

    example_headers = ["NIS", "Nama", "Kelas"]
    for offset, header in enumerate(example_headers):
        cell = guide.cell(row=row, column=offset + 1, value=header)
        cell.font = Font(bold=True, color="FFFFFF")
        cell.fill = PatternFill("solid", fgColor=ACCENT)
        cell.border = BORDER
        cell.alignment = Alignment(horizontal="center")
    row += 1
    example = ["2024991", "Siswa Contoh Satu", "1A"]
    for offset, value in enumerate(example):
        cell = guide.cell(row=row, column=offset + 1, value=value)
        cell.border = BORDER
    row += 2

    guide.cell(row=row, column=2, value="Kelas yang tersedia:").font = Font(bold=True)
    row += 1
    for school_class in classes:
        guide.cell(row=row, column=2, value=_safe_text(f"- {school_class.nama_kelas}"))
        row += 1

    row += 1
    guide.cell(
        row=row,
        column=2,
        value="Baris contoh di atas hanya untuk panduan. Jangan menyalinnya ke sheet Data Siswa.",
    ).font = Font(italic=True, color=MUTED)
    guide.sheet_view.showGridLines = False

    buffer = io.BytesIO()
    workbook.save(buffer)
    buffer.seek(0)
    return buffer
