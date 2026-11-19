import Link from "next/link";

import { buildReports, resolvePeriod } from "@/lib/reports";
import { periodeId, tanggalInput } from "@/lib/formatting";
import { readClock, startOfMonth } from "@/lib/time";
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

  const { today } = await readClock();
  const period = resolvePeriod(
    new URLSearchParams(
      Object.entries({ dari: params.dari, sampai: params.sampai }).filter(
        (entry): entry is [string, string] => typeof entry[1] === "string",
      ),
    ),
    today,
  );
  const data: ReportData = await buildReports(
    selectedClasses.map((item) => item.id),
    period,
  );

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
        <div className="min-w-0">
          <p className="eyebrow mb-2">Laporan</p>
          <h1 className="page-title">Rekap Absensi</h1>
          <p className="page-subtitle">Ringkasan kehadiran dan persentase per siswa.</p>
        </div>
        <Link href={exportHref} className="btn btn-primary shrink-0">
          <Icon name="download" className="h-4 w-4" />
          Export Excel
        </Link>
      </header>

      <form
        className="card card-pad mb-4 grid gap-3 md:grid-cols-[1fr_1fr_1fr_auto]"
        method="get"
        action={basePath}
      >
        <label className="field">
          <span className="field-label">Kelas</span>
          <select
            name="kelas"
            defaultValue={selectedClass ? String(selectedClass.id) : ""}
            className="select"
          >
            <option value="">{allLabel}</option>
            {classes.map((item) => (
              <option key={item.id} value={item.id}>
                Kelas {item.namaKelas}
              </option>
            ))}
          </select>
        </label>

        <label className="field">
          <span className="field-label">Dari tanggal</span>
          <input
            type="date"
            name="dari"
            defaultValue={tanggalInput(period.start)}
            max={today}
            className="input"
          />
        </label>

        <label className="field">
          <span className="field-label">Sampai tanggal</span>
          <input
            type="date"
            name="sampai"
            defaultValue={tanggalInput(period.end)}
            max={today}
            className="input"
          />
        </label>

        <div className="flex flex-wrap items-end gap-2">
          <button type="submit" className="btn btn-primary">
            <Icon name="search" className="h-4 w-4" />
            Tampilkan
          </button>
          <Link href={`${basePath}?${todayQuery.toString()}`} className="btn btn-secondary">
            Hari ini
          </Link>
          <Link href={`${basePath}?${monthQuery.toString()}`} className="btn btn-secondary">
            Bulan ini
          </Link>
        </div>
      </form>

      <div className="card card-pad mb-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: "Total siswa", value: String(data.totalStudents) },
          { label: "Periode", value: periodeId(period.start, period.end) },
          { label: "Kehadiran", value: `${data.overallPercent}%`, accent: true },
          { label: "Kelas", value: selectedClass ? selectedClass.namaKelas : allLabel },
        ].map((item) => (
          <div key={item.label} className="min-w-0">
            <span className="stat-label">{item.label}</span>
            <strong
              className={`mt-1 block truncate text-lg font-bold tracking-tight ${
                item.accent ? "text-ok" : "text-ink"
              }`}
            >
              {item.value}
            </strong>
          </div>
        ))}
      </div>

      <div className="mb-3 grid gap-2.5 sm:grid-cols-2 lg:grid-cols-4">
        {[
          {
            label: "Hadir",
            value: data.aggregate.Hadir,
            tile: "bg-ok-soft text-ok",
            icon: "check" as const,
          },
          {
            label: "Sakit",
            value: data.aggregate.Sakit,
            tile: "bg-warn-soft text-warn",
            icon: "clock" as const,
          },
          {
            label: "Izin",
            value: data.aggregate.Izin,
            tile: "bg-accent-soft text-accent",
            icon: "reports" as const,
          },
          {
            label: "Alpa",
            value: data.aggregate.Alpa,
            tile: "bg-bad-soft text-bad",
            icon: "x" as const,
          },
        ].map((item) => (
          <div key={item.label} className="card flex items-center gap-3 p-3.5">
            <span className={`grid size-9 shrink-0 place-items-center rounded-soft ${item.tile}`}>
              <Icon name={item.icon} size={18} />
            </span>
            <div className="min-w-0">
              <span className="stat-label">{item.label}</span>
              <strong className="mt-1 block text-lg font-bold tabular-nums text-ink">
                {item.value}
              </strong>
            </div>
          </div>
        ))}
      </div>

      <div className="mb-4 flex gap-2.5 rounded-card border border-accent/25 bg-accent-soft p-3.5 text-xs leading-relaxed text-ink-soft">
        <Icon name="reports" className="mt-0.5 h-4 w-4 shrink-0 text-accent" />
        <p>
          Hari efektif adalah jumlah tanggal yang memiliki catatan absensi pada periode ini. Siswa
          yang tidak memiliki catatan pada hari efektif dihitung <strong>Alpa</strong>. Persentase
          kehadiran dihitung dari jumlah Hadir dibagi hari efektif.
        </p>
      </div>

      {!data.hasStudents ? (
        <div className="empty-state">
          <h2 className="section-title">Belum ada siswa</h2>
          <p className="mx-auto mt-1.5 max-w-sm text-sm leading-relaxed text-muted">
            Tambahkan siswa dan kelas terlebih dahulu untuk melihat rekap.
          </p>
        </div>
      ) : !data.hasData ? (
        <div className="empty-state">
          <h2 className="section-title">Belum ada absensi pada periode ini</h2>
          <p className="mx-auto mt-1.5 max-w-sm text-sm leading-relaxed text-muted">{emptyHint}</p>
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
