import "server-only";

import { prisma } from "@/lib/db";
import { STATUS_LIST, type Status } from "@/lib/attendance";
import { parseDate, startOfMonth, todayLocal } from "@/lib/time";

export type Period = { start: string; end: string };

/** Setara resolve_period(): default bulan berjalan s/d hari ini, start<=end, end<=hari ini. */
export function resolvePeriod(params: URLSearchParams): Period {
  const today = todayLocal();
  let start = parseDate(params.get("dari"), startOfMonth(today));
  let end = parseDate(params.get("sampai"), today);
  if (start > end) [start, end] = [end, start];
  if (end > today) end = today;
  if (start > end) start = end;
  return { start, end };
}

export type StudentReportRow = {
  studentId: number;
  nis: string;
  nama: string;
  counts: Record<Status, number>;
  total: number;
  percent: number;
};

export type ClassReport = {
  classId: number;
  namaKelas: string;
  students: StudentReportRow[];
  dates: string[];
  summary: Record<Status, number>;
  totalDays: number;
  totalStudents: number;
};

export type ReportsPayload = {
  reports: ClassReport[];
  aggregate: Record<Status, number>;
  totalStudents: number;
  totalHadir: number;
  overallPercent: number;
  hasData: boolean;
  hasStudents: boolean;
};

function emptyStatusCounts(): Record<Status, number> {
  return { Hadir: 0, Sakit: 0, Izin: 0, Alpa: 0 };
}

/**
 * Setara build_reports(): tanggal tanpa catatan dianggap Alpa.
 * "Hari efektif" = tanggal yang punya minimal satu catatan absensi untuk kelas itu.
 */
export async function buildReports(
  classIds: number[],
  period: Period,
): Promise<ReportsPayload> {
  const startDate = new Date(`${period.start}T00:00:00Z`);
  const endDate = new Date(`${period.end}T00:00:00Z`);

  const classes = await prisma.schoolClass.findMany({
    where: { id: { in: classIds } },
    orderBy: { namaKelas: "asc" },
    select: { id: true, namaKelas: true },
  });

  const reports: ClassReport[] = [];

  for (const schoolClass of classes) {
    const students = await prisma.student.findMany({
      where: { classId: schoolClass.id, aktif: true },
      orderBy: { nama: "asc" },
      select: { id: true, nis: true, nama: true },
    });

    const rows = await prisma.attendance.findMany({
      where: {
        student: { classId: schoolClass.id },
        tanggal: { gte: startDate, lte: endDate },
      },
      orderBy: { tanggal: "asc" },
    });

    const dates = [...new Set(rows.map((r) => r.tanggal.toISOString().slice(0, 10)))].sort();

    const byStudent = new Map<number, Map<string, (typeof rows)[number]>>();
    for (const row of rows) {
      const iso = row.tanggal.toISOString().slice(0, 10);
      if (!byStudent.has(row.studentId)) byStudent.set(row.studentId, new Map());
      byStudent.get(row.studentId)!.set(iso, row);
    }

    const summary = emptyStatusCounts();
    const studentRows: StudentReportRow[] = [];

    for (const student of students) {
      const records = byStudent.get(student.id) ?? new Map();
      const counts = emptyStatusCounts();
      for (const record of records.values()) {
        if (record.status in counts) {
          counts[record.status as Status] += 1;
        }
      }
      counts.Alpa += Math.max(0, dates.length - records.size);
      const total = dates.length;
      const percent = total ? (counts.Hadir / total) * 100 : 0;

      studentRows.push({
        studentId: student.id,
        nis: student.nis,
        nama: student.nama,
        counts,
        total,
        percent: Math.round(percent * 10) / 10,
      });

      for (const status of STATUS_LIST) summary[status] += counts[status];
    }

    reports.push({
      classId: schoolClass.id,
      namaKelas: schoolClass.namaKelas,
      students: studentRows,
      dates,
      summary,
      totalDays: dates.length,
      totalStudents: students.length,
    });
  }

  const aggregate = emptyStatusCounts();
  for (const item of reports) {
    for (const status of STATUS_LIST) aggregate[status] += item.summary[status];
  }

  const weightedDays = reports.reduce(
    (sum, item) => sum + item.totalDays * item.totalStudents,
    0,
  );
  const totalHadir = aggregate.Hadir;
  const overallPercent = weightedDays ? (totalHadir / weightedDays) * 100 : 0;

  return {
    reports,
    aggregate,
    totalStudents: reports.reduce((sum, item) => sum + item.totalStudents, 0),
    totalHadir,
    overallPercent: Math.round(overallPercent * 10) / 10,
    hasData: reports.some((item) => item.totalDays > 0),
    hasStudents: reports.some((item) => item.totalStudents > 0),
  };
}

/** Setara detail_rows_for_export(): baris absensi mentah untuk sheet detail. */
export async function detailRowsForExport(classIds: number[], period: Period) {
  if (!classIds.length) return [];
  return prisma.attendance.findMany({
    where: {
      student: { classId: { in: classIds } },
      tanggal: {
        gte: new Date(`${period.start}T00:00:00Z`),
        lte: new Date(`${period.end}T00:00:00Z`),
      },
    },
    orderBy: [{ tanggal: "asc" }, { student: { nama: "asc" } }],
    include: { student: { include: { schoolClass: true } }, pencatat: true },
  });
}
