import type { Metadata } from "next";

import { AppShell } from "@/components/AppShell";
import { Icon, type IconName } from "@/components/Icon";
import { requireAdmin, guardWith } from "@/lib/guards";
import { navFor } from "@/lib/nav";
import { getDashboardCounts, getTodayClock } from "@/lib/cache";
import { tanggalId } from "@/lib/formatting";

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

type Shortcut = {
  href: string;
  label: string;
  desc: string;
  icon: IconName;
};

const SHORTCUTS: Shortcut[] = [
  {
    href: "/admin/siswa",
    label: "Data siswa",
    desc: "Tambah, ubah, dan hapus siswa.",
    icon: "students",
  },
  {
    href: "/admin/kelas",
    label: "Data kelas",
    desc: "Atur kelas dan wali kelas.",
    icon: "classes",
  },
  {
    href: "/admin/guru",
    label: "Data guru",
    desc: "Kelola akun guru pengguna.",
    icon: "teachers",
  },
  {
    href: "/admin/rekap",
    label: "Rekap kehadiran",
    desc: "Lihat dan unduh rekap absensi.",
    icon: "reports",
  },
  {
    href: "/admin/import",
    label: "Impor data",
    desc: "Unggah siswa dari Excel.",
    icon: "import",
  },
  {
    href: "/cetak",
    label: "Cetak kartu QR",
    desc: "10 kartu per lembar A4.",
    icon: "cards",
  },
];

export default async function AdminDashboard() {
  const [user, counts] = await guardWith(requireAdmin("/admin"), () =>
    getDashboardCounts(),
  );
  const { students, classes, teachers, todayAttendance } = counts;
  // `todayLocal()` dan `timeLocal()` memakai `new Date()`. Panggil keduanya di
  // dalam scope cache supaya tidak terbaca sebagai sync IO saat prerender.
  const { now, jam } = await getTodayClock();

  const percent = students ? Math.round((todayAttendance / students) * 1000) / 10 : 0;
  const belumTercatat = Math.max(0, students - todayAttendance);

  const stats = [
    { label: "Siswa", value: students, icon: "students" as const },
    { label: "Kelas", value: classes, icon: "classes" as const },
    { label: "Guru", value: teachers, icon: "teachers" as const },
    { label: "Hadir", value: todayAttendance, icon: "check" as const },
  ];

  return (
    <AppShell user={user} nav={navFor(user)} current="/admin" title="Dashboard" hideTitle>
      {/* --- Sapaan ------------------------------------------------------ */}
      <header className="mb-5">
        <p className="eyebrow mb-2">Absensi {SCHOOL}</p>
        <h1 className="page-title">
          {sapaan(jam)}, {user.nama.split(" ")[0]}!
        </h1>
        <p className="page-subtitle">{tanggalId(now)} · Pantau kehadiran sekolah hari ini.</p>
      </header>

      {/* --- Aksi utama -------------------------------------------------- */}
      <a href="/guru/scan" className="btn btn-primary btn-lg btn-block mb-5">
        <Icon name="camera" className="h-5 w-5" />
        Buka Kamera Scan QR
      </a>

      {/* --- Ringkasan --------------------------------------------------- */}
      <section className="card card-pad-lg">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0 flex-1">
            <h2 className="section-title">Kehadiran hari ini</h2>
            <p className="section-subtitle">Siswa yang sudah tercatat masuk.</p>

            <div className="mt-4 flex items-baseline gap-1.5">
              <span className="stat-value text-[2rem]">{todayAttendance}</span>
              <span className="text-sm text-subtle">/ {students} siswa</span>
            </div>
            <p className="mt-1.5 text-xs text-muted">
              {belumTercatat === 0
                ? "Semua siswa sudah tercatat."
                : `${belumTercatat} siswa belum tercatat.`}
            </p>
          </div>

          <div
            className="relative grid size-[84px] shrink-0 place-items-center rounded-full"
            style={{
              background: `conic-gradient(var(--color-ok) ${percent * 3.6}deg, var(--color-canvas) 0deg)`,
            }}
            aria-label={`${percent}% siswa hadir`}
          >
            <div className="grid size-[66px] place-items-center rounded-full bg-surface">
              <div className="text-center leading-none">
                <div className="text-base font-bold tabular-nums text-ink">{percent}%</div>
                <div className="mt-1 text-[10px] font-medium text-subtle">hadir</div>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-5 grid grid-cols-2 gap-2 border-t border-line pt-4 sm:grid-cols-4">
          {stats.map((stat) => (
            <div key={stat.label} className="rounded-soft bg-canvas px-3 py-2.5">
              <div className="stat-label flex items-center gap-1.5">
                <Icon name={stat.icon} className="h-3.5 w-3.5" />
                {stat.label}
              </div>
              <div className="mt-1.5 text-lg font-bold tabular-nums text-ink">{stat.value}</div>
            </div>
          ))}
        </div>
      </section>

      {/* --- Menu -------------------------------------------------------- */}
      <section className="mt-6">
        <h2 className="section-title mb-3">Menu</h2>
        <div className="grid gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
          {SHORTCUTS.map((item) => (
            <a key={item.href} href={item.href} className="card-link flex items-start gap-3">
              <span className="grid size-9 shrink-0 place-items-center rounded-soft bg-accent-soft text-accent">
                <Icon name={item.icon} size={18} />
              </span>
              <span className="min-w-0">
                <span className="block text-sm font-semibold text-ink">{item.label}</span>
                <span className="mt-0.5 block text-xs leading-relaxed text-muted">
                  {item.desc}
                </span>
              </span>
            </a>
          ))}
        </div>
      </section>
    </AppShell>
  );
}
