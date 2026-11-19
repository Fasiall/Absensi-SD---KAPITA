import Link from "next/link";

import { getAccessibleClasses } from "@/lib/access";
import { attendanceCounts } from "@/lib/attendance";
import { prisma } from "@/lib/db";
import { requireStaff } from "@/lib/guards";
import { todayLocal } from "@/lib/time";
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
  const today = todayLocal();
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
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-muted">Kelas Saya</p>
          <h1 className="font-display text-2xl text-ink">Daftar Kelas</h1>
          <p className="mt-1 text-sm text-muted">
            Pilih kelas untuk scan absensi atau melihat rekap.
          </p>
        </div>
        <span className="inline-flex items-center gap-2 rounded-full border border-line bg-surface px-3 py-1.5 text-xs font-medium text-muted shadow-sm">
          <Icon name="clock" className="h-4 w-4" />
          {tanggalId(today)}
        </span>
      </header>

      {/* Menu utama mobile dipindah dari bar bawah ke beranda ini. */}
      <section className="mb-5 grid grid-cols-2 gap-3" aria-label="Menu cepat">
        <Link
          href="/guru/rekap"
          className="flex flex-col gap-2 rounded-2xl border border-slate-100 bg-white p-4 shadow-sm transition hover:border-accent"
        >
          <span className="grid size-9 place-items-center rounded-xl bg-accent-soft text-accent">
            <Icon name="reports" size={18} />
          </span>
          <span className="text-sm font-semibold text-ink">Rekap</span>
          <span className="text-[11px] leading-snug text-slate-500">
            Lihat rekap kehadiran kelas Anda.
          </span>
        </Link>
        <Link
          href="/cetak"
          className="flex flex-col gap-2 rounded-2xl border border-slate-100 bg-white p-4 shadow-sm transition hover:border-accent"
        >
          <span className="grid size-9 place-items-center rounded-xl bg-slate-100 text-slate-600">
            <Icon name="cards" size={18} />
          </span>
          <span className="text-sm font-semibold text-ink">Kartu QR</span>
          <span className="text-[11px] leading-snug text-slate-500">
            Cetak kartu absensi siswa.
          </span>
        </Link>
      </section>

      {rows.length === 0 ? (
        <div className="rounded-card border border-line bg-surface p-10 text-center shadow-sm">
          <h2 className="font-display text-base text-ink">Belum ada kelas</h2>
          <p className="mt-1 text-sm text-muted">
            Akun Anda belum ditugaskan ke kelas mana pun. Hubungi admin sekolah untuk penugasan
            kelas.
          </p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {rows.map(({ schoolClass, total, counts, percent }) => (
            <article
              key={schoolClass.id}
              className="rounded-card border border-line bg-surface p-4 shadow-sm"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h2 className="font-display text-base text-ink">
                    Kelas {schoolClass.namaKelas}
                  </h2>
                  <p className="mt-0.5 text-xs text-muted">{total} siswa aktif</p>
                </div>
                <span className="rounded-full bg-accent-soft px-2.5 py-1 text-xs font-semibold text-accent">
                  {percent}%
                </span>
              </div>

              <div
                className="mt-3 h-2 overflow-hidden rounded-full bg-canvas"
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
                  <strong className="text-ink">{counts.Hadir}</strong>/{total} hadir hari ini
                </span>
                <span>{counts.Belum} belum</span>
              </div>

              <div className="mt-3 flex flex-wrap gap-1.5 text-xs">
                <span className="rounded-md bg-warn-soft px-2 py-1 font-medium text-warn">
                  Sakit {counts.Sakit}
                </span>
                <span className="rounded-md bg-accent-soft px-2 py-1 font-medium text-accent">
                  Izin {counts.Izin}
                </span>
                <span className="rounded-md bg-bad-soft px-2 py-1 font-medium text-bad">
                  Alpa {counts.Alpa}
                </span>
              </div>

              <div className="mt-4 flex flex-wrap gap-2">
                <Link
                  href={`/guru/scan?kelas=${schoolClass.id}`}
                  className="inline-flex items-center gap-2 rounded-soft bg-accent px-3 py-1.5 text-xs font-medium text-white transition hover:bg-accent-strong"
                >
                  <Icon name="scan" className="h-4 w-4" />
                  Scan
                </Link>
                <Link
                  href={`/guru/rekap?kelas=${schoolClass.id}`}
                  className="inline-flex items-center gap-2 rounded-soft border border-line px-3 py-1.5 text-xs font-medium text-ink transition hover:bg-canvas"
                >
                  <Icon name="reports" className="h-4 w-4" />
                  Rekap
                </Link>
                <Link
                  href={`/cetak?class_id=${schoolClass.id}`}
                  title={`Cetak kartu kelas ${schoolClass.namaKelas}`}
                  className="inline-flex items-center gap-2 rounded-soft px-3 py-1.5 text-xs font-medium text-muted transition hover:bg-canvas"
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
