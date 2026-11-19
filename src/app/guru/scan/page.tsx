import { getAccessibleClasses } from "@/lib/access";
import { attendanceCounts, attendanceMap, serializeAttendance } from "@/lib/attendance";
import { prisma } from "@/lib/db";
import { requireStaff } from "@/lib/guards";
import { parseDate, todayLocal, timeLocal } from "@/lib/time";
import { tanggalId } from "@/lib/formatting";
import { Icon } from "@/components/Icon";
import { ScanClient } from "@/components/ScanClient";

export const metadata = { title: "Scan absensi" };

/** Membaca cookie sesi dan data absensi real-time — navigasi boleh memblokir. */
export const instant = false;

type SearchParams = Promise<{ kelas?: string; tanggal?: string }>;

const SCHOOL = process.env.SCHOOL_NAME || "SD Negeri Purwodadi Simpang";

function sapaan() {
  const jam = Number(timeLocal().slice(0, 2));
  if (jam < 11) return "Selamat pagi";
  if (jam < 15) return "Selamat siang";
  if (jam < 18) return "Selamat sore";
  return "Selamat malam";
}

export default async function ScanPage({ searchParams }: { searchParams: SearchParams }) {
  const user = await requireStaff("/guru/scan");
  const params = await searchParams;

  const classes = await getAccessibleClasses(user);
  if (classes.length === 0) {
    return (
      <>
        <header className="mb-5">
          <p className="mb-2 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-accent">
            <span className="h-px w-5 bg-accent" aria-hidden="true" />
            Absensi {SCHOOL}
          </p>
          <h1 className="text-[26px] font-bold leading-tight tracking-tight text-ink">
            Halo, {user.nama.split(" ")[0]}!
          </h1>
          <p className="mt-1 text-sm text-slate-500">Belum ada kelas yang bisa Anda akses.</p>
        </header>
        <div className="rounded-2xl border border-slate-100 bg-white p-10 text-center shadow-sm">
          <h2 className="text-base font-semibold text-ink">Akun belum ditugaskan ke kelas</h2>
          <p className="mt-1 text-sm text-slate-500">
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
      <header className="mb-5">
        <p className="mb-2 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-accent">
          <span className="h-px w-5 bg-accent" aria-hidden="true" />
          Absensi {SCHOOL}
        </p>
        <h1 className="text-[26px] font-bold leading-tight tracking-tight text-ink">
          Halo, {user.nama.split(" ")[0]}!
        </h1>
        <p className="mt-1.5 text-sm text-slate-500">
          {tanggalId(clamped)} · Pantau kehadiran kelas {schoolClass.namaKelas} hari ini.
        </p>
      </header>

      <form
        className="mb-4 grid grid-cols-2 gap-3 rounded-2xl border border-slate-100 bg-white p-3 shadow-sm"
        method="get"
        action="/guru/scan"
      >
        <label className="grid min-w-0 gap-1.5 text-sm">
          <span className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
            Kelas
          </span>
          <select
            name="kelas"
            defaultValue={String(schoolClass.id)}
            className="h-11 w-full min-w-0 truncate rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm font-medium text-ink outline-none focus:border-accent"
          >
            {classes.map((item) => (
              <option key={item.id} value={item.id}>
                Kelas {item.namaKelas}
              </option>
            ))}
          </select>
        </label>
        <label className="grid min-w-0 gap-1.5 text-sm">
          <span className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
            Tanggal
          </span>
          <input
            type="date"
            name="tanggal"
            defaultValue={clamped}
            max={today}
            className="h-11 w-full min-w-0 rounded-xl border border-slate-200 bg-slate-50 px-2.5 text-[13px] font-medium text-ink outline-none focus:border-accent"
          />
        </label>
        <button
          type="submit"
          className="col-span-2 inline-flex h-10 items-center justify-center gap-2 rounded-xl text-xs font-semibold text-slate-500 transition hover:bg-slate-50"
        >
          <Icon name="sync" className="h-4 w-4" />
          Terapkan pilihan
        </button>
      </form>

      <a
        href="#scan"
        className="mb-5 flex h-[52px] w-full items-center justify-center gap-2 rounded-xl bg-accent text-sm font-semibold text-white shadow-sm shadow-accent/25 transition hover:bg-accent-strong"
      >
        <Icon name="camera" className="h-5 w-5" />
        Scan Kartu QR Siswa
      </a>

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
