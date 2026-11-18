import "server-only";

import { prisma } from "@/lib/db";
import { generateQrCode } from "@/lib/attendance";

export type FormErrors = string[];

export type StudentValues = {
  nis: string;
  nama: string;
  class_id: string;
  aktif: boolean;
};

export type ClassValues = { nama_kelas: string; guru_id: string };

export type TeacherValues = { nama: string; username: string; aktif: boolean };

/** Setara _validate_student() di admin.py. */
export async function validateStudent(
  values: StudentValues,
  excludeId?: number,
): Promise<{ errors: FormErrors; classId: number | null }> {
  const errors: FormErrors = [];

  if (!values.nis) errors.push("NIS wajib diisi.");
  else if (values.nis.length > 30) errors.push("NIS maksimal 30 karakter.");

  if (!values.nama) errors.push("Nama siswa wajib diisi.");
  else if (values.nama.length > 100) errors.push("Nama siswa maksimal 100 karakter.");

  const parsed = Number.parseInt(values.class_id, 10);
  const schoolClass = Number.isFinite(parsed)
    ? await prisma.schoolClass.findUnique({ where: { id: parsed }, select: { id: true } })
    : null;
  if (!schoolClass) errors.push("Pilih kelas yang valid.");

  if (values.nis) {
    const duplicate = await prisma.student.findFirst({
      where: { nis: values.nis, ...(excludeId ? { id: { not: excludeId } } : {}) },
      select: { id: true },
    });
    if (duplicate) errors.push("NIS sudah dipakai siswa lain.");
  }

  return { errors, classId: schoolClass?.id ?? null };
}

/** Setara _validate_class(). */
export async function validateClass(
  namaKelas: string,
  excludeId?: number,
): Promise<FormErrors> {
  const errors: FormErrors = [];
  if (!namaKelas) errors.push("Nama kelas wajib diisi.");
  else if (namaKelas.length > 20) errors.push("Nama kelas maksimal 20 karakter.");

  if (namaKelas) {
    const duplicate = await prisma.schoolClass.findFirst({
      where: {
        namaKelas: { equals: namaKelas, mode: "insensitive" },
        ...(excludeId ? { id: { not: excludeId } } : {}),
      },
      select: { id: true },
    });
    if (duplicate) errors.push("Nama kelas sudah digunakan.");
  }
  return errors;
}

/** Setara _resolve_teacher(). */
export async function resolveTeacher(
  guruId: string,
): Promise<{ teacherId: number | null; error: string | null }> {
  if (!guruId) return { teacherId: null, error: null };

  const parsed = Number.parseInt(guruId, 10);
  if (!Number.isFinite(parsed)) return { teacherId: null, error: "Guru yang dipilih tidak valid." };

  const teacher = await prisma.user.findUnique({
    where: { id: parsed },
    select: { id: true, role: true },
  });
  if (!teacher || teacher.role !== "guru") {
    return { teacherId: null, error: "Guru yang dipilih tidak ditemukan." };
  }
  return { teacherId: teacher.id, error: null };
}

/** Setara _validate_teacher(). */
export async function validateTeacher(
  values: TeacherValues,
  password: string,
  requirePassword: boolean,
  excludeId?: number,
): Promise<FormErrors> {
  const errors: FormErrors = [];

  if (!values.nama) errors.push("Nama guru wajib diisi.");
  else if (values.nama.length > 100) errors.push("Nama guru maksimal 100 karakter.");

  if (!values.username) errors.push("Username wajib diisi.");
  else if (values.username.length > 50) errors.push("Username maksimal 50 karakter.");
  else if (values.username.includes(" ")) errors.push("Username tidak boleh mengandung spasi.");

  if (requirePassword || password) {
    if (password.length < 6) errors.push("Password minimal 6 karakter.");
  }

  if (values.username) {
    const duplicate = await prisma.user.findFirst({
      where: {
        username: { equals: values.username, mode: "insensitive" },
        ...(excludeId ? { id: { not: excludeId } } : {}),
      },
      select: { id: true },
    });
    if (duplicate) errors.push("Username sudah digunakan.");
  }

  return errors;
}

/** Buat siswa baru dengan QR unik, setara generate_qr_code() loop. */
export async function createStudent(nis: string, nama: string, classId: number) {
  return prisma.student.create({
    data: { nis, nama, classId, qrCode: await generateQrCode(), aktif: true },
  });
}

export function isUniqueViolation(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    (error as { code?: string }).code === "P2002"
  );
}
