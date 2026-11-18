"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

import { prisma } from "@/lib/db";
import { revalidateReferenceData } from "@/lib/cache";
import { requireAdmin } from "@/lib/guards";
import { fileExtension, importStudents } from "@/lib/import";
import { setFlash, type Flash } from "@/lib/flash";

export async function importAction(formData: FormData) {
  await requireAdmin("/admin/import");

  const upload = formData.get("file");
  const messages: Flash[] = [];

  if (!(upload instanceof File) || upload.size === 0 || !upload.name) {
    await setFlash([
      { tone: "danger", message: "Pilih file Excel (.xlsx) atau CSV terlebih dahulu." },
    ]);
    redirect("/admin/import");
  }

  const extension = fileExtension(upload.name);
  if (extension !== "xlsx" && extension !== "csv") {
    await setFlash([{ tone: "danger", message: "Format file harus .xlsx atau .csv." }]);
    redirect("/admin/import");
  }

  const classes = await prisma.schoolClass.findMany({
    orderBy: { namaKelas: "asc" },
    select: { id: true, namaKelas: true },
  });

  let result;
  try {
    const buffer = Buffer.from(await upload.arrayBuffer());
    result = await importStudents(buffer, extension, classes);
  } catch (error) {
    const message =
      error instanceof Error && error.message
        ? error.message
        : "File tidak dapat dibaca. Pastikan formatnya sesuai template.";
    await setFlash([{ tone: "danger", message }]);
    redirect("/admin/import");
  }

  if (result.created > 0) {
    messages.push({
      tone: "success",
      message: `Impor selesai: ${result.created} siswa berhasil ditambahkan.`,
    });
  }
  if (result.skipped > 0) {
    messages.push({
      tone: "warning",
      message: `${result.skipped} baris dilewati. Periksa daftar kesalahan di bawah.`,
    });
  }
  if (result.created === 0 && result.skipped === 0) {
    messages.push({
      tone: "info",
      message: "Tidak ada data yang bisa diimpor dari file tersebut.",
    });
  }

  await setFlash([
    ...messages,
    ...result.errors.map((message): Flash => ({ tone: "danger", message })),
  ]);
  revalidatePath("/admin/siswa");
  revalidateReferenceData();
  redirect("/admin/import");
}
