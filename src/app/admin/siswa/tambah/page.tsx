import type { Metadata } from "next";

import { AppShell } from "@/components/AppShell";
import { requireAdmin } from "@/lib/guards";
import { navFor } from "@/lib/nav";
import { prisma } from "@/lib/db";
import { takeFlash } from "@/lib/flash";
import { StudentForm } from "../StudentForm";
import { saveStudentAction } from "../actions";

export const metadata: Metadata = { title: "Tambah Siswa" };

/** Membaca cookie sesi — navigasi boleh memblokir. */
export const instant = false;

export default async function StudentAddPage() {
  const user = await requireAdmin("/admin/siswa/tambah");
  const [classes, flashes] = await Promise.all([
    prisma.schoolClass.findMany({ orderBy: { namaKelas: "asc" } }),
    takeFlash(),
  ]);

  return (
    <AppShell
      user={user}
      nav={navFor(user)}
      current="/admin/siswa"
      title="Tambah Siswa"
      subtitle="Isi data siswa, QR Code akan dibuat otomatis."
    >
      <StudentForm
        action={saveStudentAction}
        classes={classes}
        values={{ nis: "", nama: "", class_id: "", aktif: true }}
        flashes={flashes}
      />
    </AppShell>
  );
}
