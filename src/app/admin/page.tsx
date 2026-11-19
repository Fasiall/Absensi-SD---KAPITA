import type { Metadata } from "next";

import { AppShell } from "@/components/AppShell";
import { Icon } from "@/components/Icon";
import { requireAdmin, guardWith } from "@/lib/guards";
import { navFor } from "@/lib/nav";
import { getDashboardCounts } from "@/lib/cache";
import { tanggalId } from "@/lib/formatting";
import { todayLocal, timeLocal } from "@/lib/time";

export const metadata: Metadata = { title: "Dashboard" };

/** Membaca cookie sesi dan angka absensi real-time — navigasi boleh memblokir. */
export const instant = false;

const SCHOOL = process.env.SCHOOL_NAME || "SD Negeri Purwodadi Simpang";

function sapaan(jam: number) {
  if (jam < 11) return "Selamat pagi";
  if (jam < 15) return "Selamat siang";
  if (jam < 18) return "Selamat sore";
  return "Selamat malam";
}

export default async function AdminDashboard() {
  const [user, counts] = await guardWith(requireAdmin("/admin"), () =>
    getDashboardCounts(),
  );
  const { students, classes, teachers, todayAttendance } = counts;
  const now = todayLocal();
  const jam = Number(timeLocal().slice(0, 2));

  const percent = students ? Math.round((todayAttendance / students) * 1000) / 10 : 0;

  const stats = [
    { label: "Siswa aktif", value: students, icon: "students" as const },
    { label: "Kelas", value: classes, icon: "classes" as const },
    { label: "Guru", value: teachers, icon: "teachers" as const },
    { label: "Absensi hari ini", value: todayAttendance, icon: "check" as const },
  ];

  return (
    <AppShell
      user={user}
      nav={navFor(user)}
      current="/admin"
      title="Dashboard"
      hideTitle
    >
      <header className="mb-5">
        <p className="mb-2 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-accent">
          <span className="h-px w-5 bg-accent" aria-hidden="true" />
          Absensi {SCHOOL}
        </p>
        <h1 className="text-[26px] font-bold leading-tight tracking-tight text-ink">
          {sapaan(jam)}, {user.nama.split(" ")[0]}!
        </h1>
        <p className="mt-1.5 text-sm text-slate-500">
          {tanggalId(now)} · Pantau kehadiran sekolah hari ini.
        </p>
      </header>

      <div className="mb-4 flex items-center justify-between gap-3 rounded-2xl border border-slate-100 bg-white px-4 py-3 shadow-sm">
        <div className="flex items-center gap-2 text-sm text-slate-500">
          <Icon name="clock" className="h-4 w-4 text-accent" />
          Absensi hari ini
        </div>
        <div className="text-sm font-semibold text-ink">
          {todayAttendance} <span className="font-normal text-slate-400">/ {students} siswa</span>
        </div>
      </div>

      <a
        href="/guru/scan"
        className="mb-5 flex h-[52px] w-full items-center justify-center gap-2 rounded-xl bg-accent text-sm font-semibold text-white shadow-sm shadow-accent/25 transition hover:bg-accent-strong"
      >
        <Icon name="camera" className="h-5 w-5" />
        Buka Kamera Scan QR
      </a>

      <section className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <h2 className="text-base font-semibold text-ink">Ringkasan Kehadiran</h2>
            <p className="mt-0.5 text-xs text-slate-500">
              Estimasi siswa tercatat hadir hari ini.
            </p>
            <div className="mt-4">
              <span className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                Hadir hari ini
              </span>
              <div className="mt-1 flex items-baseline gap-1.5">
                <strong className="text-3xl font-bold leading-none text-ink">
                  {todayAttendance}
                </strong>
                <span className="text-sm text-slate-400">/ {students} siswa</span>
              </div>
              <p className="mt-1 text-xs text-slate-500">
                {Math.max(0, students - todayAttendance)} siswa belum tercatat kehadirannya.
              </p>
            </div>
          </div>

          <div
            className="relative grid size-[88px] shrink-0 place-items-center rounded-full"
            style={{
              background: `conic-gradient(var(--color-ok) ${percent * 3.6}deg, #f1f5f9 0deg)`,
            }}
            aria-label={`${percent}% siswa hadir`}
          >
            <div className="grid size-[70px] place-items-center rounded-full bg-white">
              <div className="text-center leading-none">
                <div className="text-lg font-bold text-ink">{percent}%</div>
                <div className="mt-1 text-[9px] text-slate-400">dari total</div>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-5 grid grid-cols-2 gap-2.5 border-t border-slate-100 pt-4">
          {stats.map((stat) => (
            <div key={stat.label} className="rounded-xl bg-slate-50 px-3 py-2.5">
              <div className="flex items-center gap-1.5 text-[11px] font-medium text-slate-500">
                <Icon name={stat.icon} className="h-3.5 w-3.5" />
                {stat.label}
              </div>
              <div className="mt-1 text-lg font-bold text-ink">{stat.value}</div>
            </div>
          ))}
        </div>
      </section>

      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        <a
          href="/admin/rekap"
          className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm transition hover:border-accent"
        >
          <div className="font-semibold">Rekap kehadiran</div>
          <p className="mt-1 text-sm text-slate-500">
            Lihat dan unduh rekap absensi seluruh kelas.
          </p>
        </a>
        <a
          href="/admin/siswa"
          className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm transition hover:border-accent"
        >
          <div className="font-semibold">Data siswa</div>
          <p className="mt-1 text-sm text-slate-500">
            Tambah, ubah, dan hapus data siswa beserta QR Code-nya.
          </p>
        </a>
        <a
          href="/admin/kelas"
          className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm transition hover:border-accent"
        >
          <div className="font-semibold">Data kelas</div>
          <p className="mt-1 text-sm text-slate-500">Atur daftar kelas dan wali kelasnya.</p>
        </a>
        <a
          href="/cetak"
          className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm transition hover:border-accent"
        >
          <div className="font-semibold">Cetak kartu QR</div>
          <p className="mt-1 text-sm text-slate-500">
            Cetak kartu absensi, 10 kartu per lembar A4.
          </p>
        </a>
      </div>
    </AppShell>
  );
}
