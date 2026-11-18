"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

import { prisma } from "@/lib/db";
import { revalidateReferenceData } from "@/lib/cache";
import { requireAdmin } from "@/lib/guards";
import { generateQrCode } from "@/lib/attendance";
import { isUniqueViolation, validateStudent } from "@/lib/admin-forms";
import { setFlash, type Flash } from "@/lib/flash";

export async function saveStudentAction(formData: FormData) {
  await requireAdmin("/admin/siswa");

  const studentId = Number.parseInt(String(formData.get("id") ?? ""), 10);
  const isEdit = Number.isFinite(studentId) && studentId > 0;
  const regenerate = Boolean(formData.get("regenerate_qr"));

  const values = {
    nis: String(formData.get("nis") ?? "").trim(),
    nama: String(formData.get("nama") ?? "").trim(),
    class_id: String(formData.get("class_id") ?? "").trim(),
    aktif: Boolean(formData.get("aktif")),
  };

  const backTo = isEdit ? `/admin/siswa/${studentId}/edit` : "/admin/siswa/tambah";
  const { errors, classId } = await validateStudent(values, isEdit ? studentId : undefined);

  if (errors.length) {
    await setFlash(errors.map((message): Flash => ({ tone: "danger", message })));
    redirect(backTo);
  }

  try {
    if (isEdit) {
      await prisma.student.update({
        where: { id: studentId },
        data: {
          nis: values.nis,
          nama: values.nama,
          classId: classId!,
          aktif: values.aktif,
          ...(regenerate ? { qrCode: await generateQrCode() } : {}),
        },
      });
      const extra = regenerate ? " Kode QR baru sudah dibuat." : "";
      await setFlash([
        { tone: "success", message: `Data ${values.nama} berhasil diperbarui.${extra}` },
      ]);
    } else {
      await prisma.student.create({
        data: {
          nis: values.nis,
          nama: values.nama,
          classId: classId!,
          qrCode: await generateQrCode(),
          aktif: values.aktif,
        },
      });
      await setFlash([
        { tone: "success", message: `Siswa ${values.nama} berhasil ditambahkan.` },
      ]);
    }
  } catch (error) {
    if (isUniqueViolation(error)) {
      await setFlash([
        { tone: "danger", message: "NIS sudah dipakai siswa lain. Gunakan NIS yang berbeda." },
      ]);
      redirect(backTo);
    }
    throw error;
  }

  revalidatePath("/admin/siswa");
  revalidateReferenceData();
  redirect("/admin/siswa");
}

export async function deleteStudentAction(formData: FormData) {
  await requireAdmin("/admin/siswa");
  const studentId = Number.parseInt(String(formData.get("id") ?? ""), 10);
  if (!Number.isFinite(studentId)) redirect("/admin/siswa");

  const student = await prisma.student.findUnique({
    where: { id: studentId },
    select: { nama: true },
  });
  if (!student) redirect("/admin/siswa");

  await prisma.student.delete({ where: { id: studentId } });
  await setFlash([
    {
      tone: "success",
      message: `Data siswa ${student.nama} beserta riwayat absensinya telah dihapus.`,
    },
  ]);
  revalidatePath("/admin/siswa");
  revalidateReferenceData();
  redirect("/admin/siswa");
}
