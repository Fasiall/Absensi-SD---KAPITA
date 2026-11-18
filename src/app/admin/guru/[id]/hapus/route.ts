import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/guards";
import { setFlash } from "@/lib/flash";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  await requireAdmin("/admin/guru");
  const { id } = await params;
  const teacherId = Number.parseInt(id, 10);
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

  if (teacher._count.classes > 0 || teacher._count.attendances > 0) {
    await setFlash([
      {
        tone: "warning",
        message: `Akun ${teacher.nama} tidak bisa dihapus karena masih terhubung dengan ${teacher._count.classes} kelas dan ${teacher._count.attendances} catatan absensi. Nonaktifkan akun ini saja.`,
      },
    ]);
    redirect("/admin/guru");
  }

  await prisma.user.delete({ where: { id: teacherId } });
  await setFlash([
    { tone: "success", message: `Akun guru ${teacher.nama} berhasil dihapus.` },
  ]);
  revalidatePath("/admin/guru");
  redirect("/admin/guru");
}
