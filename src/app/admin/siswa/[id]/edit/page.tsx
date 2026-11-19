import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { AppShell } from "@/components/AppShell";
import { requireAdmin } from "@/lib/guards";
import { navFor } from "@/lib/nav";
import { prisma } from "@/lib/db";
import { takeFlash } from "@/lib/flash";
import { qrPngDataUri } from "@/lib/qr";
import { StudentForm } from "../../StudentForm";
import { saveStudentAction } from "../../actions";

export const metadata: Metadata = { title: "Ubah Siswa" };

/** Membaca cookie sesi — navigasi boleh memblokir. */
export const instant = false;

export default async function StudentEditPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await requireAdmin("/admin/siswa");
  const { id } = await params;
  const studentId = Number.parseInt(id, 10);
  if (!Number.isFinite(studentId)) notFound();

  const [student, classes, flashes] = await Promise.all([
    prisma.student.findUnique({ where: { id: studentId } }),
    prisma.schoolClass.findMany({ orderBy: { namaKelas: "asc" } }),
    takeFlash(),
  ]);
  if (!student) notFound();

  const qrPreview = await qrPngDataUri(student.qrCode);

  return (
    <AppShell
      user={user}
      nav={navFor(user)}
      current="/admin/siswa"
      title="Ubah Siswa"
      subtitle={student.nama}
    >
      <StudentForm
        action={saveStudentAction}
        classes={classes}
        values={{
          nis: student.nis,
          nama: student.nama,
          class_id: String(student.classId),
          aktif: student.aktif,
        }}
        student={{ id: student.id, qrCode: student.qrCode }}
        qrPreview={qrPreview}
        flashes={flashes}
      />
    </AppShell>
  );
}
