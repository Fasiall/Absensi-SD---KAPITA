import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { AppShell } from "@/components/AppShell";
import { FlashMessages } from "@/components/FlashMessages";
import { requireAdmin } from "@/lib/guards";
import { navFor } from "@/lib/nav";
import { prisma } from "@/lib/db";
import { takeFlash } from "@/lib/flash";
import { ClassForm } from "../../ClassForm";
import { saveClassAction } from "../../actions";

export const metadata: Metadata = { title: "Ubah Kelas" };

export default async function ClassEditPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await requireAdmin("/admin/kelas");
  const { id } = await params;
  const classId = Number.parseInt(id, 10);
  if (!Number.isFinite(classId)) notFound();

  const [schoolClass, teachers, flashes] = await Promise.all([
    prisma.schoolClass.findUnique({ where: { id: classId } }),
    prisma.user.findMany({
      where: { role: "guru", aktif: true },
      orderBy: { nama: "asc" },
      select: { id: true, nama: true },
    }),
    takeFlash(),
  ]);
  if (!schoolClass) notFound();

  return (
    <AppShell
      user={user}
      nav={navFor(user)}
      current="/admin/kelas"
      title="Ubah Kelas"
      subtitle={schoolClass.namaKelas}
    >
      <FlashMessages messages={flashes} />
      <div className="max-w-md">
        <ClassForm
          action={saveClassAction}
          teachers={teachers}
          mode="edit"
          values={{
            nama_kelas: schoolClass.namaKelas,
            guru_id: schoolClass.guruId ? String(schoolClass.guruId) : "",
          }}
        />
      </div>
    </AppShell>
  );
}
