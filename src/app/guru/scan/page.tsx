import { getAccessibleClasses } from "@/lib/access";
import { attendanceCounts, attendanceMap, serializeAttendance } from "@/lib/attendance";
import { prisma } from "@/lib/db";
import { requireStaff } from "@/lib/guards";
import { parseDate, todayLocal } from "@/lib/time";
import { tanggalId } from "@/lib/formatting";
import { Icon } from "@/components/Icon";
import { ScanClient } from "@/components/ScanClient";

export const metadata = { title: "Scan absensi" };

type SearchParams = Promise<{ kelas?: string; tanggal?: string }>;

export default async function ScanPage({ searchParams }: { searchParams: SearchParams }) {
  const user = await requireStaff("/guru/scan");
  const params = await searchParams;

  const classes = await getAccessibleClasses(user);
  if (classes.length === 0) {
    return (
      <>
        <header className="mb-5">
          <p className="text-xs font-medium uppercase tracking-wide text-muted">Absensi</p>
          <h1 className="font-display text-2xl text-ink">Scan Absensi</h1>
          <p className="mt-1 text-sm text-muted">Belum ada kelas yang bisa Anda akses.</p>
        </header>
        <div className="rounded-card border border-line bg-surface p-10 text-center shadow-sm">
          <h2 className="font-display text-base text-ink">Akun belum ditugaskan ke kelas</h2>
          <p className="mt-1 text-sm text-muted">
            Hubungi admin sekolah agar akun Anda ditugaskan ke kelas. Setelah itu halaman scan bisa
            digunakan.
          </p>
        </div>
      </>
    );
  }

  const requestedId = Number(params.kelas);
  const schoolClass = classes.find((item) => item.id === requestedId) ?? classes[0];
  const today = todayLocal();
  const tanggal = parseDate(params.tanggal, today);
  const clamped = tanggal > today ? today : tanggal;

  const students = await prisma.student.findMany({
    where: { classId: schoolClass.id, aktif: true },
    orderBy: { nama: "asc" },
    include: { schoolClass: { select: { namaKelas: true } } },
  });

  const records = await attendanceMap(schoolClass.id, clamped);
  const counts = await attendanceCounts(schoolClass.id, clamped);

  const rows = students.map((student) =>
    serializeAttendance(student, records.get(student.id) ?? null),
  );

  return (
    <>
      <header className="mb-5 flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-muted">Absensi</p>
          <h1 className="font-display text-2xl text-ink">Scan Absensi</h1>
          <p className="mt-1 text-sm text-muted">
            Arahkan kamera ke kartu QR siswa. Kehadiran tercatat otomatis.
          </p>
        </div>
        <span className="inline-flex items-center gap-2 rounded-full border border-line bg-surface px-3 py-1.5 text-xs font-medium text-muted shadow-sm">
          <Icon name="clock" className="h-4 w-4" />
          {tanggalId(clamped)}
        </span>
      </header>

      <form
        className="mb-4 grid gap-3 rounded-card border border-line bg-surface p-4 shadow-sm sm:grid-cols-[1fr_1fr_auto]"
        method="get"
        action="/guru/scan"
      >
        <label className="grid gap-1.5 text-sm">
          <span className="font-medium text-ink">Kelas</span>
          <select
            name="kelas"
            defaultValue={String(schoolClass.id)}
            className="rounded-soft border border-line bg-canvas px-3 py-2 text-sm text-ink"
          >
            {classes.map((item) => (
              <option key={item.id} value={item.id}>
                Kelas {item.namaKelas}
              </option>
            ))}
          </select>
        </label>
        <label className="grid gap-1.5 text-sm">
          <span className="font-medium text-ink">Tanggal absensi</span>
          <input
            type="date"
            name="tanggal"
            defaultValue={clamped}
            max={today}
            className="rounded-soft border border-line bg-canvas px-3 py-2 text-sm text-ink"
          />
        </label>
        <div className="flex items-end">
          <button
            type="submit"
            className="inline-flex items-center gap-2 rounded-soft bg-accent px-4 py-2 text-sm font-medium text-white transition hover:bg-accent-strong"
          >
            <Icon name="search" className="h-4 w-4" />
            Terapkan
          </button>
        </div>
      </form>

      <ScanClient
        key={`${schoolClass.id}-${clamped}`}
        classId={schoolClass.id}
        tanggal={clamped}
        students={rows}
        counts={counts}
      />

      <noscript>
        <p className="mt-4 rounded-soft border border-line bg-surface p-3 text-xs text-muted">
          Halaman scan membutuhkan JavaScript. Aktifkan JavaScript untuk memakai kamera.
        </p>
      </noscript>
    </>
  );
}
