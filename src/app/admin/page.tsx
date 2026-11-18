import type { Metadata } from "next";

import { AppShell } from "@/components/AppShell";
import { requireAdmin } from "@/lib/guards";
import { navFor } from "@/lib/nav";
import { prisma } from "@/lib/db";
import { todayLocal } from "@/lib/time";

export const metadata: Metadata = { title: "Dashboard" };

export default async function AdminDashboard() {
  const user = await requireAdmin("/admin");
  const today = todayLocal();

  const [students, classes, teachers, todayAttendance] = await Promise.all([
    prisma.student.count({ where: { aktif: true } }),
    prisma.schoolClass.count(),
    prisma.user.count({ where: { role: "guru" } }),
    prisma.attendance.count({ where: { tanggal: new Date(`${today}T00:00:00Z`) } }),
  ]);

  const stats = [
    { label: "Siswa aktif", value: students, tone: "text-accent" },
    { label: "Kelas", value: classes, tone: "text-ink" },
    { label: "Guru", value: teachers, tone: "text-ink" },
    { label: "Absensi hari ini", value: todayAttendance, tone: "text-ok" },
  ];

  return (
    <AppShell
      user={user}
      nav={navFor(user)}
      current="/admin"
      title="Dashboard"
      subtitle={`Ringkasan absensi ${process.env.SCHOOL_NAME || "SD Negeri Purwodadi Simpang"}`}
    >
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className="rounded-2xl border border-line bg-surface p-5 shadow-sm"
          >
            <div className="text-xs font-medium uppercase tracking-wide text-muted">
              {stat.label}
            </div>
            <div className={`mt-2 text-3xl font-bold ${stat.tone}`}>{stat.value}</div>
          </div>
        ))}
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        <a
          href="/admin/siswa"
          className="rounded-2xl border border-line bg-surface p-5 shadow-sm transition hover:border-accent"
        >
          <div className="font-semibold">Kelola siswa</div>
          <p className="mt-1 text-sm text-muted">
            Tambah, ubah, dan hapus data siswa beserta QR Code-nya.
          </p>
        </a>
        <a
          href="/cetak"
          className="rounded-2xl border border-line bg-surface p-5 shadow-sm transition hover:border-accent"
        >
          <div className="font-semibold">Cetak kartu QR</div>
          <p className="mt-1 text-sm text-muted">
            Cetak kartu absensi, 10 kartu per lembar A4.
          </p>
        </a>
      </div>
    </AppShell>
  );
}
