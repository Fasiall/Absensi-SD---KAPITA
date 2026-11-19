import Link from "next/link";

import { getAccessibleClasses } from "@/lib/access";
import { attendanceCounts } from "@/lib/attendance";
import { prisma } from "@/lib/db";
import { requireStaff } from "@/lib/guards";
import { readClock } from "@/lib/time";
import { tanggalId } from "@/lib/formatting";
import { Icon } from "@/components/Icon";

export const metadata = { title: "Daftar kelas" };

/**
 * Halaman ini membaca cookie sesi (`requireStaff`) dan menghitung absensi
 * hari ini, sehingga tidak bisa dirender instan saat navigasi.
 */
export const instant = false;

export default async function GuruClassesPage() {
  const user = await requireStaff("/guru/kelas");
  const { today } = await readClock();
  const classes = await getAccessibleClasses(user);

  const totals = await prisma.student.groupBy({
    by: ["classId"],
    where: { classId: { in: classes.map((item) => item.id) }, aktif: true },
    _count: { _all: true },
  });
  const totalByClass = new Map(totals.map((row) => [row.classId, row._count._all]));

  const rows = await Promise.all(
    classes.map(async (schoolClass) => {
      const total = totalByClass.get(schoolClass.id) ?? 0;
      const counts = await attendanceCounts(schoolClass.id, today);
      const percent = total ? Math.round((counts.Hadir / total) * 1000) / 10 : 0;
      return { schoolClass, total, counts, percent };
    }),
  );

  return (
    <>
      <header className="mb-5 flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="eyebrow mb-2">Kelas saya</p>
          <h1 className="page-title">Daftar Kelas</h1>
          <p className="page-subtitle">Pilih kelas untuk scan absensi atau melihat rekap.</p>
        </div>
        <span className="badge badge-neutral shrink-0 gap-1.5 py-1.5">
          <Icon name="clock" className="h-3.5 w-3.5" />
          {tanggalId(today)}
        </span>
      </header>

      <section className="mb-6" aria-label="Menu cepat">
        <div className="grid grid-cols-2 gap-2.5">
          <Link href="/guru/rekap" className="card-link flex items-center gap-3">
            <span className="grid size-9 shrink-0 place-items-center rounded-soft bg-accent-soft text-accent">
              <Icon name="reports" size={18} />
            </span>
            <span className="min-w-0">
              <span className="block text-sm font-semibold text-ink">Rekap</span>
              <span className="mt-0.5 block text-xs leading-relaxed text-muted">
                Kehadiran kelas Anda.
              </span>
            </span>
          </Link>
          <Link href="/cetak" className="card-link flex items-center gap-3">
            <span className="grid size-9 shrink-0 place-items-center rounded-soft bg-canvas text-muted">
              <Icon name="cards" size={18} />
            </span>
            <span className="min-w-0">
              <span className="block text-sm font-semibold text-ink">Kartu QR</span>
              <span className="mt-0.5 block text-xs leading-relaxed text-muted">
                Cetak kartu siswa.
              </span>
            </span>
          </Link>
        </div>
      </section>

      {rows.length === 0 ? (
        <div className="empty-state">
          <h2 className="section-title">Belum ada kelas</h2>
          <p className="mx-auto mt-1.5 max-w-sm text-sm leading-relaxed text-muted">
            Akun Anda belum ditugaskan ke kelas mana pun. Hubungi admin sekolah untuk penugasan
            kelas.
          </p>
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {rows.map(({ schoolClass, total, counts, percent }) => (
            <article key={schoolClass.id} className="card card-pad">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <h2 className="section-title truncate">Kelas {schoolClass.namaKelas}</h2>
                  <p className="mt-0.5 text-xs text-muted">{total} siswa aktif</p>
                </div>
                <span className="badge badge-accent shrink-0">{percent}%</span>
              </div>

              <div
                className="mt-3 h-1.5 overflow-hidden rounded-full bg-canvas"
                role="img"
                aria-label={`${percent} persen hadir hari ini`}
              >
                <span
                  className="block h-full rounded-full bg-ok"
                  style={{ width: `${percent}%` }}
                />
              </div>

              <div className="mt-2 flex items-center justify-between text-xs text-muted">
                <span>
                  <strong className="font-semibold text-ink">{counts.Hadir}</strong>/{total} hadir
                </span>
                <span>{counts.Belum} belum</span>
              </div>

              <div className="mt-3 flex flex-wrap gap-1.5">
                <span className="badge badge-warn">Sakit {counts.Sakit}</span>
                <span className="badge badge-accent">Izin {counts.Izin}</span>
                <span className="badge badge-bad">Alpa {counts.Alpa}</span>
              </div>

              <div className="mt-4 flex flex-wrap gap-2 border-t border-line pt-3">
                <Link
                  href={`/guru/scan?kelas=${schoolClass.id}`}
                  className="btn btn-primary btn-sm"
                >
                  <Icon name="scan" className="h-4 w-4" />
                  Scan
                </Link>
                <Link
                  href={`/guru/rekap?kelas=${schoolClass.id}`}
                  className="btn btn-secondary btn-sm"
                >
                  <Icon name="reports" className="h-4 w-4" />
                  Rekap
                </Link>
                <Link
                  href={`/cetak?class_id=${schoolClass.id}`}
                  title={`Cetak kartu kelas ${schoolClass.namaKelas}`}
                  aria-label={`Cetak kartu kelas ${schoolClass.namaKelas}`}
                  className="btn-icon"
                >
                  <Icon name="cards" className="h-4 w-4" />
                </Link>
              </div>
            </article>
          ))}
        </div>
      )}
    </>
  );
}
