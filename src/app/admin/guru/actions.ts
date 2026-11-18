"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

import { prisma } from "@/lib/db";
import { revalidateReferenceData } from "@/lib/cache";
import { requireAdmin } from "@/lib/guards";
import { isUniqueViolation, validateTeacher } from "@/lib/admin-forms";
import { hashPassword } from "@/lib/password";
import { setFlash, type Flash } from "@/lib/flash";

export async function saveTeacherAction(formData: FormData) {
  await requireAdmin("/admin/guru");

  const teacherId = Number.parseInt(String(formData.get("id") ?? ""), 10);
  const isEdit = Number.isFinite(teacherId) && teacherId > 0;
  const nama = String(formData.get("nama") ?? "").trim();
  const username = String(formData.get("username") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const aktif = formData.get("aktif") !== null;

  const backTo = isEdit ? `/admin/guru/${teacherId}/edit` : "/admin/guru/tambah";

  const errors: Flash[] = (
    await validateTeacher(
      { nama, username, aktif },
      password,
      !isEdit,
      isEdit ? teacherId : undefined,
    )
  ).map((message) => ({ tone: "danger", message }));

  if (errors.length) {
    await setFlash(errors);
    redirect(backTo);
  }

  try {
    if (isEdit) {
      await prisma.user.update({
        where: { id: teacherId },
        data: {
          nama,
          username,
          aktif,
          ...(password ? { passwordHash: await hashPassword(password) } : {}),
        },
      });
      await setFlash([
        { tone: "success", message: `Akun guru ${nama} berhasil diperbarui.` },
      ]);
    } else {
      await prisma.user.create({
        data: {
          nama,
          username,
          role: "guru",
          aktif,
          passwordHash: await hashPassword(password),
        },
      });
      await setFlash([
        { tone: "success", message: `Akun guru ${nama} berhasil dibuat.` },
      ]);
    }
  } catch (error) {
    if (isUniqueViolation(error)) {
      await setFlash([
        { tone: "danger", message: "Username sudah digunakan. Pilih username lain." },
      ]);
      redirect(backTo);
    }
    throw error;
  }

  revalidatePath("/admin/guru");
  revalidateReferenceData();
  redirect("/admin/guru");
}

export async function deleteTeacherAction(formData: FormData) {
  await requireAdmin("/admin/guru");
  const teacherId = Number.parseInt(String(formData.get("id") ?? ""), 10);
  if (!Number.isFinite(teacherId)) redirect("/admin/guru");

  const teacher = await prisma.user.findUnique({
    where: { id: teacherId },
    select: {
      nama: true,
      role: true,
      _count: { select: { classes: true, attendances: true } },
    },
  });
  if (!teacher || teacher.role !== "guru") redirect("/admin/guru");

  const attendanceCount = teacher._count.attendances;

  if (teacher._count.classes > 0 || attendanceCount > 0) {
    await setFlash([
      {
        tone: "warning",
        message: `Akun ${teacher.nama} tidak bisa dihapus karena masih terhubung dengan ${teacher._count.classes} kelas dan ${attendanceCount} catatan absensi. Nonaktifkan akun ini saja.`,
      },
    ]);
    redirect("/admin/guru");
  }

  await prisma.user.delete({ where: { id: teacherId } });
  await setFlash([
    { tone: "success", message: `Akun guru ${teacher.nama} berhasil dihapus.` },
  ]);
  revalidatePath("/admin/guru");
  revalidateReferenceData();
  redirect("/admin/guru");
}
