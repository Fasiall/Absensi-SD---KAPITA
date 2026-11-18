import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

import { prisma } from "@/lib/db";
import { revalidateReferenceData } from "@/lib/cache";
import { requireAdmin } from "@/lib/guards";
import { setFlash } from "@/lib/flash";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  await requireAdmin("/admin/siswa");
  const { id } = await params;
  const studentId = Number.parseInt(id, 10);
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
