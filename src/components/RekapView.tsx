import Link from "next/link";

import { buildReports, resolvePeriod } from "@/lib/reports";
import { periodeId, tanggalInput } from "@/lib/formatting";
import { todayLocal, startOfMonth } from "@/lib/time";
import { getCachedClasses } from "@/lib/cache";
import { Icon } from "@/components/Icon";
import { RekapTable } from "@/components/RekapTable";

export type RekapSearchParams = { kelas?: string; dari?: string; sampai?: string };

type ReportData = Awaited<ReturnType<typeof buildReports>>;

export type RekapViewProps = {
  params: RekapSearchParams;
  basePath: string;
  allLabel: string;
  emptyHint: string;
  /**
   * Batasi ke kelas tertentu (dipakai halaman guru). Berisi id saja — array
   * angka kecil sehingga murah untuk diserialisasi ke RSC payload.
   */
  classIds?: number[];
};

export async function RekapView({
  params,
  basePath,
  allLabel,
  emptyHint,
  classIds,
}: RekapViewProps) {
  // Daftar kelas diambil di sini, bukan lewat props. Melewatkan array besar
  // sebagai props Server Component membuatnya diserialisasi ulang ke RSC
  // payload (bisa >200 KB), sehingga HTML dobel dan render jadi lambat.
  const allClasses = await getCachedClasses();
  const classes = classIds
    ? allClasses.filter((item) => classIds.includes(item.id))
    : allClasses;

  const selectedId = Number(params.kelas);
  const selectedClass = classes.find((item) => item.id === selectedId) ?? null;
  const selectedClasses = selectedClass ? [selectedClass] : classes;

  const period = resolvePeriod(
    new URLSearchParams(
      Object.entries({ dari: params.dari, sampai: params.sampai }).filter(
        (entry): entry is [string, string] => typeof entry[1] === "string",
      ),
    ),
  );
  const data: ReportData = await buildReports(
    selectedClasses.map((item) => item.id),
    period,
  );

  const today = todayLocal();
  const exportQuery = new URLSearchParams();
  if (selectedClass) exportQuery.set("kelas", String(selectedClass.id));
  exportQuery.set("dari", period.start);
  exportQuery.set("sampai", period.end);

  const baseQuery = new URLSearchParams();
  if (selectedClass) baseQuery.set("kelas", String(selectedClass.id));
  const todayQuery = new URLSearchParams(baseQuery);
  todayQuery.set("dari", today);
  todayQuery.set("sampai", today);
  const monthQuery = new URLSearchParams(baseQuery);
  monthQuery.set("dari", startOfMonth(today));
  monthQuery.set("sampai", today);

  // Data tabel diratakan di sini agar payload ke Client Component seminimal
  // mungkin — hanya nilai yang ditampilkan, tanpa objek bersarang.
  const rows = data.reports.flatMap((report) =>
    report.students.map((student) => ({
      key: `${report.classId}-${student.studentId}`,
      nis: student.nis,
      nama: student.nama,
      namaKelas: report.namaKelas,
      hadir: student.counts.Hadir,
      sakit: student.counts.Sakit,
      izin: student.counts.Izin,
      alpa: student.counts.Alpa,
      total: student.total,
      percent: student.percent,
    })),
  );

  const exportHref = `${basePath}/export?${exportQuery.toString()}`;

  return (
    <>
      <header className="mb-5 flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-muted">Laporan</p>
          <h1 className="font-display text-2xl text-ink">Rekap Absensi</h1>
          <p className="mt-1 text-sm text-muted">
            Ringkasan kehadiran dan persentase per siswa.
          </p>
        </div>
        <Link
          href={exportHref}
          className="inline-flex items-center gap-2 rounded-soft bg-accent px-4 py-2 text-sm font-medium text-white transition hover:bg-accent-strong"
        >
          <Icon name="download" className="h-4 w-4" />
          Export Excel
        </Link>
      </header>

      <form
        className="mb-5 grid gap-3 rounded-card border border-line bg-surface p-4 shadow-sm md:grid-cols-[1fr_1fr_1fr_auto]"
        method="get"
        action={basePath}
      >
        <label className="grid gap-1.5 text-sm">
          <span className="font-medium text-ink">Kelas</span>
          <select
            name="kelas"
            defaultValue={selectedClass ? String(selectedClass.id) : ""}
            className="rounded-soft border border-line bg-canvas px-3 py-2 text-sm text-ink"
          >
            <option value="">{allLabel}</option>
            {classes.map((item) => (
              <option key={item.id} value={item.id}>
                Kelas {item.namaKelas}
              </option>
            ))}
          </select>
        </label>

        <label className="grid gap-1.5 text-sm">
          <span className="font-medium text-ink">Dari tanggal</span>
          <input
            type="date"
            name="dari"
            defaultValue={tanggalInput(period.start)}
            max={today}
            className="rounded-soft border border-line bg-canvas px-3 py-2 text-sm text-ink"
          />
        </label>

        <label className="grid gap-1.5 text-sm">
          <span className="font-medium text-ink">Sampai tanggal</span>
          <input
            type="date"
            name="sampai"
            defaultValue={tanggalInput(period.end)}
            max={today}
            className="rounded-soft border border-line bg-canvas px-3 py-2 text-sm text-ink"
          />
        </label>

        <div className="flex flex-wrap items-end gap-2">
          <button
            type="submit"
            className="inline-flex items-center gap-2 rounded-soft bg-accent px-4 py-2 text-sm font-medium text-white transition hover:bg-accent-strong"
          >
            <Icon name="search" className="h-4 w-4" />
            Tampilkan
          </button>
          <Link
            href={`${basePath}?${todayQuery.toString()}`}
            className="rounded-soft border border-line px-3 py-2 text-sm font-medium text-ink transition hover:bg-canvas"
          >
            Hari ini
          </Link>
          <Link
            href={`${basePath}?${monthQuery.toString()}`}
            className="rounded-soft border border-line px-3 py-2 text-sm font-medium text-ink transition hover:bg-canvas"
          >
            Bulan ini
          </Link>
        </div>
      </form>

      <div className="mb-4 grid gap-3 rounded-card border border-line bg-surface p-4 shadow-sm sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: "Total siswa", value: String(data.totalStudents) },
          { label: "Periode", value: periodeId(period.start, period.end) },
          { label: "Kehadiran", value: `${data.overallPercent}%`, accent: true },
          { label: "Kelas", value: selectedClass ? selectedClass.namaKelas : allLabel },
        ].map((item) => (
          <div key={item.label}>
            <span className="block text-xs uppercase tracking-wide text-muted">{item.label}</span>
            <strong className={`text-lg ${item.accent ? "text-ok" : "text-ink"}`}>{item.value}</strong>
          </div>
        ))}
      </div>

      <div className="mb-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: "Hadir", value: data.aggregate.Hadir, tone: "text-ok", icon: "check" as const },
          { label: "Sakit", value: data.aggregate.Sakit, tone: "text-warn", icon: "clock" as const },
          { label: "Izin", value: data.aggregate.Izin, tone: "text-accent", icon: "reports" as const },
          { label: "Alpa", value: data.aggregate.Alpa, tone: "text-bad", icon: "x" as const },
        ].map((item) => (
          <div
            key={item.label}
            className="flex items-center gap-3 rounded-card border border-line bg-surface p-4 shadow-sm"
          >
            <span className={`rounded-soft bg-canvas p-2 ${item.tone}`}>
              <Icon name={item.icon} className="h-5 w-5" />
            </span>
            <div>
              <span className="block text-xs text-muted">{item.label}</span>
              <strong className="text-lg text-ink">{item.value}</strong>
            </div>
          </div>
        ))}
      </div>

      <div className="mb-4 flex gap-3 rounded-card border border-blue-200 bg-accent-soft p-4 text-sm text-ink">
        <Icon name="reports" className="mt-0.5 h-4 w-4 shrink-0 text-accent" />
        <p>
          Hari efektif adalah jumlah tanggal yang memiliki catatan absensi pada periode ini. Siswa
          yang tidak memiliki catatan pada hari efektif dihitung <strong>Alpa</strong>. Persentase
          kehadiran dihitung dari jumlah Hadir dibagi hari efektif.
        </p>
      </div>

      {!data.hasStudents ? (
        <div className="rounded-card border border-line bg-surface p-10 text-center shadow-sm">
          <h2 className="font-display text-base text-ink">Belum ada siswa</h2>
          <p className="mt-1 text-sm text-muted">
            Tambahkan siswa dan kelas terlebih dahulu untuk melihat rekap.
          </p>
        </div>
      ) : !data.hasData ? (
        <div className="rounded-card border border-line bg-surface p-10 text-center shadow-sm">
          <h2 className="font-display text-base text-ink">Belum ada absensi pada periode ini</h2>
          <p className="mt-1 text-sm text-muted">{emptyHint}</p>
        </div>
      ) : (
        <RekapTable
          rows={rows}
          totalStudents={data.totalStudents}
          totalClasses={data.reports.length}
          overallPercent={data.overallPercent}
          exportHref={exportHref}
        />
      )}
    </>
  );
}
