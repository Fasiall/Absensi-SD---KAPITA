import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { AppShell } from "@/components/AppShell";
import { FlashMessages } from "@/components/FlashMessages";
import { requireAdmin } from "@/lib/guards";
import { navFor } from "@/lib/nav";
import { prisma } from "@/lib/db";
import { takeFlash } from "@/lib/flash";
import { TeacherForm } from "../../TeacherForm";
import { saveTeacherAction } from "../../actions";

export const metadata: Metadata = { title: "Ubah Guru" };

/** Membaca cookie sesi — navigasi boleh memblokir. */
export const instant = false;

export default async function EditTeacherPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await requireAdmin("/admin/guru");
  const { id } = await params;
  const teacherId = Number.parseInt(id, 10);
  if (!Number.isFinite(teacherId)) notFound();

  const [teacher, flashes] = await Promise.all([
    prisma.user.findUnique({ where: { id: teacherId } }),
    takeFlash(),
  ]);
  if (!teacher || teacher.role !== "guru") notFound();

  return (
    <AppShell
      user={user}
      nav={navFor(user)}
      current="/admin/guru"
      title="Ubah Guru"
      subtitle={teacher.nama}
    >
      <FlashMessages messages={flashes} />
      <TeacherForm
        action={saveTeacherAction}
        mode="edit"
        values={{
          id: teacher.id,
          nama: teacher.nama,
          username: teacher.username,
          aktif: teacher.aktif,
        }}
      />
    </AppShell>
  );
}
