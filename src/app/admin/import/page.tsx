import Link from "next/link";

import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/guards";
import { takeFlash } from "@/lib/flash";
import { FlashMessages } from "@/components/FlashMessages";
import { Icon } from "@/components/Icon";
import { importAction } from "./actions";

export const metadata = { title: "Impor siswa" };

/** Membaca cookie sesi — navigasi boleh memblokir. */
export const instant = false;

export default async function ImportPage() {
  await requireAdmin("/admin/import");
  const [classes, flashes] = await Promise.all([
    prisma.schoolClass.findMany({
      orderBy: { namaKelas: "asc" },
      select: { namaKelas: true },
    }),
    takeFlash(),
  ]);

  return (
    <>
      <header className="mb-5">
        <p className="eyebrow mb-2">Data siswa</p>
        <h1 className="page-title">Impor Siswa</h1>
        <p className="page-subtitle">
          Unggah file Excel atau CSV berisi daftar siswa untuk ditambahkan sekaligus.
        </p>
      </header>

      <FlashMessages messages={flashes} />

      <div className="grid gap-3 lg:grid-cols-[1fr_320px]">
        <section className="card card-pad-lg">
          <form action={importAction} className="grid gap-4">
            <label className="field">
              <span className="field-label">File Excel / CSV</span>
              <input
                type="file"
                name="file"
                accept=".xlsx,.csv"
                required
                className="w-full rounded-soft border border-line bg-canvas px-3 py-2 text-sm text-ink file:mr-3 file:rounded-soft file:border-0 file:bg-accent file:px-3 file:py-1.5 file:text-xs file:font-semibold file:text-white hover:file:bg-accent-strong"
              />
              <span className="field-hint">Format yang didukung: .xlsx dan .csv</span>
            </label>

            <div className="flex flex-wrap items-center gap-2">
              <button type="submit" className="btn btn-primary">
                <Icon name="import" size={16} />
                Unggah &amp; impor
              </button>
              <Link href="/admin/siswa/template" className="btn btn-secondary">
                <Icon name="download" size={16} />
                Unduh template
              </Link>
              <Link
                href="/admin/siswa"
                className="text-xs font-medium text-muted transition-colors hover:text-ink"
              >
                Kembali ke daftar siswa
              </Link>
            </div>
          </form>
        </section>

        <aside className="card card-pad-lg h-fit">
          <h2 className="section-title">Panduan singkat</h2>
          <ol className="mt-3 grid list-decimal gap-1.5 pl-4 text-xs leading-relaxed text-muted">
            <li>Unduh template agar susunan kolom sesuai.</li>
            <li>Isi kolom NIS, Nama, dan Kelas mulai baris kedua.</li>
            <li>NIS harus unik dan belum pernah terdaftar.</li>
            <li>Nama kelas harus sama persis dengan daftar di bawah.</li>
            <li>Simpan lalu unggah kembali di form ini.</li>
          </ol>

          <h3 className="section-title mt-5 text-[0.8125rem]">Kelas tersedia</h3>
          {classes.length === 0 ? (
            <p className="mt-2 text-xs text-muted">
              Belum ada kelas. Tambahkan kelas terlebih dahulu.
            </p>
          ) : (
            <div className="mt-2 flex flex-wrap gap-1.5">
              {classes.map((item) => (
                <span key={item.namaKelas} className="badge badge-neutral">
                  {item.namaKelas}
                </span>
              ))}
            </div>
          )}
        </aside>
      </div>
    </>
  );
}
