import "server-only";

import { randomInt } from "node:crypto";

import { prisma } from "@/lib/db";
import { timeLocal, toHm } from "@/lib/time";

export const STATUS_HADIR = "Hadir";
export const STATUS_SAKIT = "Sakit";
export const STATUS_IZIN = "Izin";
export const STATUS_ALPA = "Alpa";
export const STATUS_LIST = [STATUS_HADIR, STATUS_SAKIT, STATUS_IZIN, STATUS_ALPA] as const;

export type Status = (typeof STATUS_LIST)[number];

export type AttendanceCounts = Record<string, number> & { total: number };

const QR_ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";

/** Setara generate_qr_code(): "SD-" + 12 karakter acak, dijamin unik. */
export async function generateQrCode(): Promise<string> {
  for (let attempt = 0; attempt < 30; attempt++) {
    let code = "SD-";
    for (let i = 0; i < 12; i++) {
      code += QR_ALPHABET[randomInt(QR_ALPHABET.length)];
    }
    const existing = await prisma.student.findUnique({ where: { qrCode: code } });
    if (!existing) return code;
  }
  throw new Error("Gagal membuat kode QR unik. Silakan coba lagi.");
}

export type SerializedStudent = {
  id: number;
  nis: string;
  nama: string;
  kelas: string;
  status: string;
  jam_masuk: string | null;
  catatan: string | null;
};

type StudentWithClass = {
  id: number;
  nis: string;
  nama: string;
  schoolClass: { namaKelas: string } | null;
};

type AttendanceLike = {
  status: string;
  jamMasuk: Date | null;
  catatan: string | null;
} | null;

/** Setara serialize_attendance(). */
export function serializeAttendance(
  student: StudentWithClass,
  attendance: AttendanceLike = null,
  statusOverride?: string,
): SerializedStudent {
  return {
    id: student.id,
    nis: student.nis,
    nama: student.nama,
    kelas: student.schoolClass?.namaKelas ?? "-",
    status: statusOverride ?? attendance?.status ?? "Belum",
    jam_masuk: attendance ? toHm(attendance.jamMasuk) : null,
    catatan: attendance?.catatan ?? null,
  };
}

/** Setara attendance_counts(): menghitung status unik per siswa + sisa "Belum". */
export async function attendanceCounts(
  classId: number,
  tanggalIso: string,
): Promise<AttendanceCounts> {
  const total = await prisma.student.count({ where: { classId, aktif: true } });
  const rows = await prisma.attendance.findMany({
    where: { student: { classId }, tanggal: new Date(`${tanggalIso}T00:00:00Z`) },
    select: { studentId: true, status: true },
  });

  const counts: AttendanceCounts = {
    Hadir: 0,
    Sakit: 0,
    Izin: 0,
    Alpa: 0,
    total,
  } as AttendanceCounts;

  const seen = new Set<number>();
  for (const row of rows) {
    if (seen.has(row.studentId)) continue;
    seen.add(row.studentId);
    if (row.status in counts) counts[row.status] += 1;
  }
  counts.Belum = Math.max(0, total - seen.size);
  return counts;
}

/** Setara attendance_map(): studentId -> attendance untuk satu kelas & tanggal. */
export async function attendanceMap(classId: number, tanggalIso: string) {
  const rows = await prisma.attendance.findMany({
    where: { student: { classId }, tanggal: new Date(`${tanggalIso}T00:00:00Z`) },
  });
  const map = new Map<number, (typeof rows)[number]>();
  for (const row of rows) map.set(row.studentId, row);
  return map;
}

export function statusHmNow(): Date {
  return new Date(`1970-01-01T${timeLocal()}:00Z`);
}

export function chunked<T>(items: T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < items.length; i += size) out.push(items.slice(i, i + size));
  return out;
}
