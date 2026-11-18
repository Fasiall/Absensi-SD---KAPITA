import "server-only";

import { prisma } from "@/lib/db";
import {
  STATUS_HADIR,
  STATUS_LIST,
  attendanceCounts,
  serializeAttendance,
  type AttendanceCounts,
  type SerializedStudent,
} from "@/lib/attendance";
import { canAccessClass } from "@/lib/access";
import type { SessionUser } from "@/lib/auth";
import { timeLocal, timeOnly, todayLocal, parseDate } from "@/lib/time";

export type ScanOutcome = {
  ok: boolean;
  code?: string;
  message: string;
  student?: SerializedStudent;
  counts?: AttendanceCounts;
};

function hhmm(value: Date | null): string | null {
  if (!value) return null;
  return `${String(value.getUTCHours()).padStart(2, "0")}:${String(value.getUTCMinutes()).padStart(2, "0")}`;
}

/**
 * Setara _process_scan() di app/guru.py.
 * Kode hasil: invalid, forbidden, not_found, inactive, wrong_class, duplicate, success.
 */
export async function processScan(
  user: SessionUser,
  input: { qr?: unknown; class_id?: unknown; tanggal?: unknown },
): Promise<{ status: number; body: ScanOutcome }> {
  const qr = String(input.qr ?? "").trim();
  if (!qr) {
    return { status: 400, body: { ok: false, code: "invalid", message: "Kode QR kosong." } };
  }

  const classId = Number(input.class_id);
  if (!Number.isInteger(classId)) {
    return { status: 400, body: { ok: false, code: "invalid", message: "Kelas tidak valid." } };
  }

  const schoolClass = await prisma.schoolClass.findUnique({ where: { id: classId } });
  if (!schoolClass || !canAccessClass(user, schoolClass)) {
    return {
      status: 403,
      body: { ok: false, code: "forbidden", message: "Anda tidak punya akses ke kelas ini." },
    };
  }

  const today = todayLocal();
  const tanggal = parseDate(input.tanggal, today);
  if (tanggal > today) {
    return {
      status: 400,
      body: {
        ok: false,
        code: "invalid",
        message: "Tanggal tidak boleh melebihi hari ini.",
      },
    };
  }

  const student = await prisma.student.findUnique({
    where: { qrCode: qr },
    include: { schoolClass: { select: { namaKelas: true } } },
  });
  if (!student) {
    return {
      status: 404,
      body: {
        ok: false,
        code: "not_found",
        message: "QR tidak dikenali. Pastikan kartu yang dipindai benar.",
      },
    };
  }
  if (!student.aktif) {
    return {
      status: 409,
      body: {
        ok: false,
        code: "inactive",
        message: "Kartu siswa ini sudah dinonaktifkan. Hubungi admin.",
        student: serializeAttendance(student),
      },
    };
  }
  if (student.classId !== schoolClass.id) {
    return {
      status: 409,
      body: {
        ok: false,
        code: "wrong_class",
        message: `QR ini milik siswa kelas ${student.schoolClass?.namaKelas ?? "-"}, bukan kelas ${schoolClass.namaKelas} yang dipilih.`,
        student: serializeAttendance(student),
      },
    };
  }

  const date = new Date(`${tanggal}T00:00:00Z`);
  const existing = await prisma.attendance.findUnique({
    where: { uq_attendance_student_date: { studentId: student.id, tanggal: date } },
  });

  if (existing) {
    let message = `${student.nama} sudah tercatat ${existing.status} hari ini`;
    const jam = hhmm(existing.jamMasuk);
    if (jam) message += ` pukul ${jam}`;
    message += ".";
    return {
      status: 200,
      body: {
        ok: false,
        code: "duplicate",
        message,
        student: serializeAttendance(student, existing),
        counts: await attendanceCounts(student.classId, tanggal),
      },
    };
  }

  try {
    const created = await prisma.attendance.create({
      data: {
        studentId: student.id,
        tanggal: date,
        status: STATUS_HADIR,
        jamMasuk: timeOnly(timeLocal()),
        dicatatOleh: user.id,
      },
    });

    return {
      status: 200,
      body: {
        ok: true,
        code: "success",
        message: `${student.nama} tercatat Hadir pukul ${hhmm(created.jamMasuk) ?? ""}.`,
        student: serializeAttendance(student, created),
        counts: await attendanceCounts(student.classId, tanggal),
      },
    };
  } catch {
    const again = await prisma.attendance.findUnique({
      where: { uq_attendance_student_date: { studentId: student.id, tanggal: date } },
    });
    return {
      status: 200,
      body: {
        ok: false,
        code: "duplicate",
        message: `${student.nama} sudah tercatat hari ini.`,
        student: serializeAttendance(student, again),
        counts: await attendanceCounts(student.classId, tanggal),
      },
    };
  }
}

/** Setara api_status() di app/guru.py. */
export async function updateStatus(
  user: SessionUser,
  input: { student_id?: unknown; tanggal?: unknown; status?: unknown; catatan?: unknown },
): Promise<{ status: number; body: ScanOutcome }> {
  const studentId = Number(input.student_id);
  if (!Number.isInteger(studentId)) {
    return { status: 400, body: { ok: false, code: "invalid", message: "Siswa tidak valid." } };
  }

  const student = await prisma.student.findUnique({
    where: { id: studentId },
    include: { schoolClass: true },
  });
  if (!student) {
    return {
      status: 404,
      body: { ok: false, code: "not_found", message: "Siswa tidak ditemukan." },
    };
  }
  if (!canAccessClass(user, student.schoolClass)) {
    return {
      status: 403,
      body: { ok: false, code: "forbidden", message: "Anda tidak punya akses ke kelas ini." },
    };
  }

  const today = todayLocal();
  const tanggal = parseDate(input.tanggal, today);
  if (tanggal > today) {
    return {
      status: 400,
      body: {
        ok: false,
        code: "invalid",
        message: "Tanggal tidak boleh melebihi hari ini.",
      },
    };
  }

  const statusValue = String(input.status ?? "").trim();
  if (!(STATUS_LIST as readonly string[]).includes(statusValue)) {
    return {
      status: 400,
      body: { ok: false, code: "invalid", message: "Status absensi tidak valid." },
    };
  }

  const catatan = String(input.catatan ?? "").trim().slice(0, 255) || null;
  const date = new Date(`${tanggal}T00:00:00Z`);

  const existing = await prisma.attendance.findUnique({
    where: { uq_attendance_student_date: { studentId: student.id, tanggal: date } },
  });

  const record = existing
    ? await prisma.attendance.update({
        where: { id: existing.id },
        data: {
          status: statusValue,
          catatan,
          dicatatOleh: user.id,
          jamMasuk: statusValue === STATUS_HADIR ? (existing.jamMasuk ?? timeOnly(timeLocal())) : null,
        },
      })
    : await prisma.attendance.create({
        data: {
          studentId: student.id,
          tanggal: date,
          status: statusValue,
          jamMasuk: statusValue === STATUS_HADIR ? timeOnly(timeLocal()) : null,
          dicatatOleh: user.id,
          catatan,
        },
      });

  return {
    status: 200,
    body: {
      ok: true,
      code: "success",
      message: `Status ${student.nama} diubah menjadi ${statusValue}.`,
      student: serializeAttendance(student, record),
      counts: await attendanceCounts(student.classId, tanggal),
    },
  };
}
