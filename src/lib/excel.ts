import "server-only";

import ExcelJS from "exceljs";

import type { SchoolClass } from "@prisma/client";

import { periodeId } from "@/lib/formatting";

export const XLSX_MIMETYPE =
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";

const ACCENT = "FF2563EB";
const ACCENT_SOFT = "FFDBEAFE";
const DARK = "FF1E293B";
const MUTED = "FF64748B";
const BORDER_COLOR = "FFCBD5E1";
const ZEBRA = "FFF8FAFC";

const thinBorder: Partial<ExcelJS.Borders> = {
  top: { style: "thin", color: { argb: BORDER_COLOR } },
  left: { style: "thin", color: { argb: BORDER_COLOR } },
  bottom: { style: "thin", color: { argb: BORDER_COLOR } },
  right: { style: "thin", color: { argb: BORDER_COLOR } },
};

/** Cegah teks pengguna dibaca Excel sebagai formula. */
export function safeText(value: string): string {
  const stripped = value.replace(/^\s+/, "");
  return /^[=+\-@]/.test(stripped) ? `'${value}` : value;
}

function styleHeaderRow(sheet: ExcelJS.Worksheet, rowNumber: number, columns: number) {
  for (let column = 1; column <= columns; column += 1) {
    const cell = sheet.getRow(rowNumber).getCell(column);
    cell.font = { bold: true, color: { argb: "FFFFFFFF" }, size: 11 };
    cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: ACCENT } };
    cell.alignment = { horizontal: "center", vertical: "middle", wrapText: true };
    cell.border = thinBorder;
  }
  sheet.getRow(rowNumber).height = 28;
}

/**
 * Setara build_import_template() di app/excel.py.
 * Sheet "Data Siswa" untuk diisi, sheet "Petunjuk" berisi panduan.
 */
export async function buildImportTemplate(classes: Pick<SchoolClass, "namaKelas">[]) {
  const workbook = new ExcelJS.Workbook();

  const sheet = workbook.addWorksheet("Data Siswa");
  sheet.addRow(["NIS", "Nama", "Kelas"]);
  sheet.addRow(["", "", ""]);
  styleHeaderRow(sheet, 1, 3);
  sheet.getColumn(1).width = 18;
  sheet.getColumn(2).width = 32;
  sheet.getColumn(3).width = 14;
  sheet.views = [{ state: "frozen", ySplit: 1 }];

  const guide = workbook.addWorksheet("Petunjuk");
  guide.getColumn(1).width = 18;
  guide.getColumn(2).width = 95;
  guide.getColumn(3).width = 14;

  const title = guide.getCell("A1");
  title.value = "PETUNJUK IMPOR DATA SISWA";
  title.font = { bold: true, size: 16, color: { argb: ACCENT } };
  guide.mergeCells("A1:B1");

  const steps = [
    "1. Buka sheet 'Data Siswa'.",
    "2. Isi data mulai baris ke-2. Jangan mengubah nama kolom.",
    "3. Kolom wajib: NIS, Nama, Kelas. NIS harus unik (tidak boleh sama).",
    "4. Nama kelas harus sama persis dengan daftar di bawah (contoh: 1A).",
    "5. Simpan file sebagai .xlsx atau .csv, lalu unggah di halaman Impor Siswa.",
    "",
    "Contoh isi:",
  ];

  let row = 3;
  for (const text of steps) {
    const cell = guide.getCell(row, 2);
    cell.value = text;
    cell.alignment = { wrapText: true, vertical: "top" };
    row += 1;
  }

  ["NIS", "Nama", "Kelas"].forEach((header, offset) => {
    const cell = guide.getCell(row, offset + 1);
    cell.value = header;
    cell.font = { bold: true, color: { argb: "FFFFFFFF" } };
    cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: ACCENT } };
    cell.border = thinBorder;
    cell.alignment = { horizontal: "center" };
  });
  row += 1;

  ["2024991", "Siswa Contoh Satu", "1A"].forEach((value, offset) => {
    const cell = guide.getCell(row, offset + 1);
    cell.value = value;
    cell.border = thinBorder;
  });
  row += 2;

  const classHeader = guide.getCell(row, 2);
  classHeader.value = "Kelas yang tersedia:";
  classHeader.font = { bold: true };
  row += 1;

  for (const schoolClass of classes) {
    guide.getCell(row, 2).value = safeText(`- ${schoolClass.namaKelas}`);
    row += 1;
  }

  row += 1;
  const note = guide.getCell(row, 2);
  note.value =
    "Baris contoh di atas hanya untuk panduan. Jangan menyalinnya ke sheet Data Siswa.";
  note.font = { italic: true, color: { argb: MUTED } };

  const buffer = await workbook.xlsx.writeBuffer();
  return Buffer.from(buffer);
}

export type ImportRow = unknown[];

/** Baca isi file xlsx menjadi array baris (nilai mentah). */
export async function readXlsxRows(buffer: Buffer): Promise<ImportRow[]> {
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(buffer as unknown as ExcelJS.Buffer);
  const sheet = workbook.worksheets[0];
  if (!sheet) return [];

  const rows: ImportRow[] = [];
  sheet.eachRow({ includeEmpty: false }, (row) => {
    const values: unknown[] = [];
    row.eachCell({ includeEmpty: true }, (cell, columnNumber) => {
      values[columnNumber - 1] = cellValue(cell);
    });
    rows.push(values);
  });
  return rows;
}

function cellValue(cell: ExcelJS.Cell): unknown {
  const value = cell.value;
  if (value === null || value === undefined) return "";
  if (typeof value === "object") {
    if ("text" in value) return value.text;
    if ("result" in value) return (value as { result?: unknown }).result ?? "";
    if ("richText" in value) {
      return (value as ExcelJS.CellRichTextValue).richText.map((part) => part.text).join("");
    }
    if (value instanceof Date) return value;
  }
  return value;
}

/** Setara _cell_text(): float bulat jadi "2024001", sisanya string terpangkas. */
export function cellText(value: unknown): string {
  if (value === null || value === undefined) return "";
  if (typeof value === "number" && Number.isInteger(value)) return String(value);
  return String(value).trim();
}

/** Setara _normalize_header(). */
export function normalizeHeader(value: unknown): string {
  return String(value ?? "")
    .trim()
    .toLowerCase()
    .replace(/_/g, " ")
    .split(/\s+/)
    .filter(Boolean)
    .join(" ");
}

/** Sniff delimiter `,` atau `;` seperti csv.Sniffer. */
export function detectDelimiter(sample: string): string {
  const firstLine = sample.split(/\r?\n/).find((line) => line.trim().length > 0) ?? "";
  const commas = (firstLine.match(/,/g) ?? []).length;
  const semicolons = (firstLine.match(/;/g) ?? []).length;
  return semicolons > commas ? ";" : ",";
}

/** Parser CSV sederhana yang mendukung tanda kutip ganda. */
export function parseCsv(text: string, delimiter: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let inQuotes = false;

  for (let index = 0; index < text.length; index += 1) {
    const char = text[index];
    if (inQuotes) {
      if (char === '"') {
        if (text[index + 1] === '"') {
          field += '"';
          index += 1;
        } else {
          inQuotes = false;
        }
      } else {
        field += char;
      }
      continue;
    }

    if (char === '"') {
      inQuotes = true;
    } else if (char === delimiter) {
      row.push(field);
      field = "";
    } else if (char === "\n") {
      row.push(field);
      rows.push(row);
      row = [];
      field = "";
    } else if (char === "\r") {
      // abaikan, ditangani oleh \n
    } else {
      field += char;
    }
  }

  if (field.length > 0 || row.length > 0) {
    row.push(field);
    rows.push(row);
  }

  return rows;
}

export { ACCENT, ACCENT_SOFT, DARK, MUTED, ZEBRA, thinBorder, styleHeaderRow };

// ---------------------------------------------------------------------------
// Laporan absensi (setara build_report_workbook di app/excel.py)
// ---------------------------------------------------------------------------

export type ReportStudentRow = {
  studentId: number;
  nis: string;
  nama: string;
  counts: Record<string, number>;
  total: number;
  percent: number;
};

export type ReportClass = {
  classId: number;
  namaKelas: string;
  students: ReportStudentRow[];
};

export type ReportPayload = {
  reports: ReportClass[];
  aggregate: Record<string, number>;
  totalStudents: number;
  overallPercent: number;
};

export type DetailRecord = {
  tanggal: Date;
  status: string;
  jamMasuk: string | null;
  catatan: string | null;
  student: { nis: string; nama: string; schoolClass: { namaKelas: string } | null };
  pencatat: { nama: string } | null;
};

type TitleBlockOptions = {
  lastColumn: number;
  schoolName: string;
  subtitle: string;
  classLabel: string;
  periodLabel: string;
  printedBy: string;
};

function titleBlock(sheet: ExcelJS.Worksheet, options: TitleBlockOptions) {
  const { lastColumn } = options;
  const center = { horizontal: "center" as const };

  const rows: { row: number; value: string; font: Partial<ExcelJS.Font> }[] = [
    { row: 1, value: safeText(options.schoolName.toUpperCase()), font: { bold: true, size: 14, color: { argb: ACCENT } } },
    { row: 2, value: safeText(options.subtitle), font: { bold: true, size: 18, color: { argb: DARK } } },
    { row: 3, value: safeText(options.classLabel), font: { size: 11, color: { argb: DARK } } },
    { row: 4, value: safeText(`Periode: ${options.periodLabel}`), font: { size: 11, color: { argb: DARK } } },
    {
      row: 5,
      value: safeText(`Dicetak: ${options.printedBy}`),
      font: { size: 9, italic: true, color: { argb: MUTED } },
    },
  ];

  for (const item of rows) {
    sheet.mergeCells(item.row, 1, item.row, lastColumn);
    const cell = sheet.getCell(item.row, 1);
    cell.value = item.value;
    cell.font = item.font;
    cell.alignment = center;
  }
}

function autoWidth(sheet: ExcelJS.Worksheet, minWidth = 10, maxWidth = 42) {
  const widths = new Map<number, number>();
  sheet.eachRow({ includeEmpty: false }, (row) => {
    row.eachCell({ includeEmpty: false }, (cell, columnNumber) => {
      if (cell.value === null || cell.value === undefined) return;
      const longest = Math.max(...String(cell.value).split("\n").map((line) => line.length), 0);
      widths.set(columnNumber, Math.max(widths.get(columnNumber) ?? 0, longest));
    });
  });
  for (const [column, width] of widths) {
    sheet.getColumn(column).width = Math.min(Math.max(width + 3, minWidth), maxWidth);
  }
}

/** Setara build_report_workbook(): sheet "Rekap" + sheet "Detail". */
export async function buildReportWorkbook(
  data: ReportPayload,
  classes: { namaKelas: string }[],
  start: string,
  end: string,
  schoolName: string,
  printedBy: string,
  detailRows: DetailRecord[],
): Promise<Buffer> {
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet("Rekap");

  const classLabel = `Kelas: ${classes.length ? classes.map((item) => item.namaKelas).join(", ") : "Semua kelas"}`;
  const periodLabel = periodeId(start, end);

  titleBlock(sheet, {
    lastColumn: 10,
    schoolName,
    subtitle: "LAPORAN ABSENSI SISWA",
    classLabel,
    periodLabel,
    printedBy,
  });

  const summaryItems: [string, number][] = [
    ["Total Siswa", data.totalStudents],
    ["Hadir", data.aggregate.Hadir ?? 0],
    ["Sakit", data.aggregate.Sakit ?? 0],
    ["Izin", data.aggregate.Izin ?? 0],
    ["Alpa", data.aggregate.Alpa ?? 0],
  ];

  summaryItems.forEach(([label, value], index) => {
    const labelColumn = index * 2 + 1;
    const labelCell = sheet.getCell(7, labelColumn);
    labelCell.value = label;
    labelCell.font = { bold: true, color: { argb: DARK } };
    labelCell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: ACCENT_SOFT } };
    labelCell.alignment = { horizontal: "center" };
    labelCell.border = thinBorder;

    const valueCell = sheet.getCell(7, labelColumn + 1);
    valueCell.value = value;
    valueCell.font = { bold: true, color: { argb: ACCENT } };
    valueCell.alignment = { horizontal: "center" };
    valueCell.border = thinBorder;
  });

  const headers = [
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
  ];
  const headerRow = 9;
  headers.forEach((header, index) => {
    sheet.getCell(headerRow, index + 1).value = header;
  });
  styleHeaderRow(sheet, headerRow, headers.length);

  let rowNumber = headerRow + 1;
  let number = 1;

  for (const report of data.reports) {
    for (const studentRow of report.students) {
      const values: (string | number)[] = [
        number,
        safeText(studentRow.nis),
        safeText(studentRow.nama),
        safeText(report.namaKelas),
        studentRow.counts.Hadir ?? 0,
        studentRow.counts.Sakit ?? 0,
        studentRow.counts.Izin ?? 0,
        studentRow.counts.Alpa ?? 0,
        studentRow.total,
        studentRow.total ? studentRow.percent / 100 : 0,
      ];

      values.forEach((value, index) => {
        const cell = sheet.getCell(rowNumber, index + 1);
        cell.value = value;
        cell.border = thinBorder;
        cell.alignment = { horizontal: index === 2 ? "left" : "center", vertical: "middle" };
        if (rowNumber % 2 === 0) {
          cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: ZEBRA } };
        }
      });
      sheet.getCell(rowNumber, 10).numFmt = "0.0%";
      rowNumber += 1;
      number += 1;
    }
  }

  if (rowNumber > headerRow + 1) {
    const totalRow = rowNumber;
    sheet.getCell(totalRow, 2).value = "TOTAL";
    sheet.getCell(totalRow, 5).value = data.aggregate.Hadir ?? 0;
    sheet.getCell(totalRow, 6).value = data.aggregate.Sakit ?? 0;
    sheet.getCell(totalRow, 7).value = data.aggregate.Izin ?? 0;
    sheet.getCell(totalRow, 8).value = data.aggregate.Alpa ?? 0;
    sheet.getCell(totalRow, 10).value = data.overallPercent / 100;

    for (let column = 1; column <= 10; column += 1) {
      const cell = sheet.getCell(totalRow, column);
      cell.font = { bold: true, color: { argb: DARK } };
      cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: ACCENT_SOFT } };
      cell.border = thinBorder;
      cell.alignment = { horizontal: "center" };
    }
    sheet.getCell(totalRow, 10).numFmt = "0.0%";
    sheet.autoFilter = { from: { row: headerRow, column: 1 }, to: { row: totalRow - 1, column: 10 } };
  }

  sheet.views = [{ state: "frozen", ySplit: headerRow }];
  autoWidth(sheet);
  sheet.getColumn(3).width = 32;
  sheet.views = [{ state: "frozen", ySplit: headerRow, showGridLines: false }];
  sheet.pageSetup = {
    orientation: "landscape",
    fitToPage: true,
    fitToWidth: 1,
    fitToHeight: 0,
  };

  // --- Sheet Detail ---
  const detail = workbook.addWorksheet("Detail");
  titleBlock(detail, {
    lastColumn: 8,
    schoolName,
    subtitle: "DETAIL ABSENSI SISWA",
    classLabel,
    periodLabel,
    printedBy,
  });

  const detailHeaders = [
    "Tanggal",
    "Kelas",
    "NIS",
    "Nama",
    "Status",
    "Jam Masuk",
    "Dicatat Oleh",
    "Catatan",
  ];
  const detailHeaderRow = 7;
  detailHeaders.forEach((header, index) => {
    detail.getCell(detailHeaderRow, index + 1).value = header;
  });
  styleHeaderRow(detail, detailHeaderRow, detailHeaders.length);

  let detailRow = detailHeaderRow + 1;
  for (const record of detailRows) {
    const values: (string | Date)[] = [
      record.tanggal,
      safeText(record.student.schoolClass?.namaKelas ?? "-"),
      safeText(record.student.nis),
      safeText(record.student.nama),
      safeText(record.status),
      record.jamMasuk ?? "",
      safeText(record.pencatat?.nama ?? "-"),
      safeText(record.catatan ?? ""),
    ];

    values.forEach((value, index) => {
      const cell = detail.getCell(detailRow, index + 1);
      cell.value = value;
      cell.border = thinBorder;
      cell.alignment = {
        horizontal: index === 3 || index === 7 ? "left" : "center",
        vertical: "middle",
      };
      if (detailRow % 2 === 0) {
        cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: ZEBRA } };
      }
    });
    detail.getCell(detailRow, 1).numFmt = "DD-MM-YYYY";
    detail.getCell(detailRow, 6).numFmt = "HH:MM";
    detailRow += 1;
  }

  if (detailRows.length === 0) {
    detail.mergeCells(detailRow, 1, detailRow, 8);
    const cell = detail.getCell(detailRow, 1);
    cell.value = "Tidak ada catatan absensi pada periode ini.";
    cell.alignment = { horizontal: "center" };
    cell.font = { italic: true, color: { argb: MUTED } };
    detailRow += 1;
  }

  const noteRow = detailRow + 1;
  detail.mergeCells(noteRow, 1, noteRow, 8);
  const note = detail.getCell(noteRow, 1);
  note.value =
    "Catatan: siswa yang tidak memiliki catatan pada hari efektif dihitung Alpa di sheet Rekap.";
  note.font = { italic: true, size: 9, color: { argb: MUTED } };
  note.alignment = { horizontal: "left" };

  autoWidth(detail);
  detail.getColumn(4).width = 30;
  detail.getColumn(8).width = 30;
  detail.views = [{ state: "frozen", ySplit: detailHeaderRow, showGridLines: false }];
  detail.pageSetup = {
    orientation: "landscape",
    fitToPage: true,
    fitToWidth: 1,
    fitToHeight: 0,
  };

  const buffer = await workbook.xlsx.writeBuffer();
  return Buffer.from(buffer);
}

