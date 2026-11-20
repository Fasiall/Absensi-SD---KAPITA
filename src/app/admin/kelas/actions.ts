"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

import { prisma } from "@/lib/db";
import { revalidateReferenceData } from "@/lib/cache";
import { requireAdmin } from "@/lib/guards";
import { isUniqueViolation, resolveTeacher, validateClass } from "@/lib/admin-forms";
import { setFlash, type Flash } from "@/lib/flash";

export async function saveClassAction(formData: FormData) {
  await requireAdmin("/admin/kelas");

  const classId = Number.parseInt(String(formData.get("id") ?? ""), 10);
  const isEdit = Number.isFinite(classId) && classId > 0;
  const namaKelas = String(formData.get("nama_kelas") ?? "").trim().toUpperCase();
  const guruId = String(formData.get("guru_id") ?? "").trim();

  const errors: Flash[] = (await validateClass(namaKelas, isEdit ? classId : undefined)).map(
    (message) => ({ tone: "danger", message }),
  );
  const { teacherId, error } = await resolveTeacher(guruId);
  if (error) errors.push({ tone: "danger", message: error });

  if (errors.length) {
    await setFlash(errors);
    redirect("/admin/kelas");
  }

  try {
    if (isEdit) {
      await prisma.schoolClass.update({
        where: { id: classId },
        data: { namaKelas, guruId: teacherId },
      });
      await setFlash([
        { tone: "success", message: `Kelas ${namaKelas} berhasil diperbarui.` },
      ]);
    } else {
      await prisma.schoolClass.create({ data: { namaKelas, guruId: teacherId } });
      await setFlash([
        { tone: "success", message: `Kelas ${namaKelas} berhasil ditambahkan.` },
      ]);
    }
  } catch (error) {
    if (isUniqueViolation(error)) {
      await setFlash([{ tone: "danger", message: "Nama kelas sudah digunakan." }]);
      redirect("/admin/kelas");
    }
    throw error;
  }

  revalidatePath("/admin/kelas");
  revalidateReferenceData();
  redirect("/admin/kelas");
}

export async function deleteClassAction(formData: FormData) {
  await requireAdmin("/admin/kelas");
  const classId = Number.parseInt(String(formData.get("id") ?? ""), 10);
  if (!Number.isFinite(classId)) redirect("/admin/kelas");

  const schoolClass = await prisma.schoolClass.findUnique({
    where: { id: classId },
    select: { namaKelas: true, _count: { select: { students: true } } },
  });
  if (!schoolClass) redirect("/admin/kelas");

  if (schoolClass._count.students > 0) {
    await setFlash([
      {
        tone: "warning",
        message: `Kelas ${schoolClass.namaKelas} masih memiliki ${schoolClass._count.students} siswa. Pindahkan atau hapus siswanya terlebih dahulu.`,
      },
    ]);
    redirect("/admin/kelas");
  }

  await prisma.schoolClass.delete({ where: { id: classId } });
  await setFlash([
    { tone: "success", message: `Kelas ${schoolClass.namaKelas} berhasil dihapus.` },
  ]);
  revalidatePath("/admin/kelas");
  revalidateReferenceData();
  redirect("/admin/kelas");
}
