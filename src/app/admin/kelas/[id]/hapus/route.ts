import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/guards";
import { setFlash } from "@/lib/flash";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  await requireAdmin("/admin/kelas");
  const { id } = await params;
  const classId = Number.parseInt(id, 10);
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
  redirect("/admin/kelas");
}
