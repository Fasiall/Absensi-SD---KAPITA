import { getAccessibleClasses } from "@/lib/access";
import { attendanceCounts, attendanceMap, serializeAttendance } from "@/lib/attendance";
import { prisma } from "@/lib/db";
import { requireStaff } from "@/lib/guards";
import { parseDate, readClock } from "@/lib/time";
import { tanggalId } from "@/lib/formatting";
import { Icon } from "@/components/Icon";
import { ScanClient } from "@/components/ScanClient";

export const metadata = { title: "Scan absensi" };

/** Membaca cookie sesi dan data absensi real-time — navigasi boleh memblokir. */
export const instant = false;

type SearchParams = Promise<{ kelas?: string; tanggal?: string }>;

const SCHOOL = process.env.SCHOOL_NAME || "SD Negeri Purwodadi Simpang";

function sapaan(jam: number) {
  if (jam < 11) return "Selamat pagi";
  if (jam < 15) return "Selamat siang";
  if (jam < 18) return "Selamat sore";
  return "Selamat malam";
}

export default async function ScanPage({ searchParams }: { searchParams: SearchParams }) {
  const user = await requireStaff("/guru/scan");
  const params = await searchParams;
  const namaDepan = user.nama.split(" ")[0];
  const { today, time } = await readClock();
  const jam = Number(time.slice(0, 2));

  const classes = await getAccessibleClasses(user);
  if (classes.length === 0) {
    return (
      <>
        <header className="mb-5">
          <p className="eyebrow mb-2">Absensi {SCHOOL}</p>
          <h1 className="page-title">Halo, {namaDepan}!</h1>
          <p className="page-subtitle">Belum ada kelas yang bisa Anda akses.</p>
        </header>
        <div className="empty-state">
          <h2 className="section-title">Akun belum ditugaskan ke kelas</h2>
          <p className="mx-auto mt-1.5 max-w-sm text-sm leading-relaxed text-muted">
            Hubungi admin sekolah agar akun Anda ditugaskan ke kelas. Setelah itu halaman scan bisa
            digunakan.
          </p>
        </div>
      </>
    );
  }

  const requestedId = Number(params.kelas);
  const schoolClass = classes.find((item) => item.id === requestedId) ?? classes[0];
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
        <p className="eyebrow mb-2">Absensi {SCHOOL}</p>
        <h1 className="page-title">Halo, {namaDepan}!</h1>
        <p className="page-subtitle">
          {tanggalId(clamped)} · Kehadiran kelas {schoolClass.namaKelas} hari ini.
        </p>
      </header>

      <form className="card card-pad mb-4" method="get" action="/guru/scan">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <label className="field">
            <span className="field-label">Kelas</span>
            <select name="kelas" defaultValue={String(schoolClass.id)} className="select">
              {classes.map((item) => (
                <option key={item.id} value={item.id}>
                  Kelas {item.namaKelas}
                </option>
              ))}
            </select>
          </label>
          <label className="field">
            <span className="field-label">Tanggal</span>
            <input
              type="date"
              name="tanggal"
              defaultValue={clamped}
              max={today}
              className="input"
            />
          </label>
        </div>
        <button type="submit" className="btn btn-secondary btn-block mt-3">
          <Icon name="sync" className="h-4 w-4" />
          Terapkan pilihan
        </button>
      </form>

      <a href="#scan" className="btn btn-primary btn-lg btn-block mb-5">
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
        <p className="card card-pad mt-4 text-xs leading-relaxed text-muted">
          Halaman scan membutuhkan JavaScript. Aktifkan JavaScript untuk memakai kamera.
        </p>
      </noscript>
    </>
  );
}
