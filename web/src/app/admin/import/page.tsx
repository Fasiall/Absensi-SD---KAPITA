import Link from "next/link";

import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/guards";
import { takeFlash } from "@/lib/flash";
import { FlashMessages } from "@/components/FlashMessages";
import { Icon } from "@/components/Icon";
import { importAction } from "./actions";

export const metadata = { title: "Impor siswa" };

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
        <h1 className="font-display text-2xl text-ink">Impor Siswa</h1>
        <p className="mt-1 text-sm text-muted">
          Unggah file Excel atau CSV berisi daftar siswa untuk ditambahkan sekaligus.
        </p>
      </header>

      <FlashMessages messages={flashes} />

      <div className="grid gap-5 lg:grid-cols-[1fr_320px]">
        <section className="rounded-card border border-line bg-surface p-5 shadow-sm">
          <form action={importAction} className="grid gap-4">
            <label className="grid gap-1.5 text-sm">
              <span className="font-medium text-ink">File Excel / CSV</span>
              <input
                type="file"
                name="file"
                accept=".xlsx,.csv"
                required
                className="rounded-soft border border-line bg-canvas px-3 py-2 text-sm text-ink file:mr-3 file:rounded-md file:border-0 file:bg-accent file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-white hover:file:bg-accent-strong"
              />
              <span className="text-xs text-muted">Format yang didukung: .xlsx dan .csv</span>
            </label>

            <div className="flex flex-wrap items-center gap-3">
              <button
                type="submit"
                className="inline-flex items-center gap-2 rounded-soft bg-accent px-4 py-2 text-sm font-medium text-white transition hover:bg-accent-strong"
              >
                <Icon name="import" className="h-4 w-4" />
                Unggah &amp; impor
              </button>
              <Link
                href="/admin/siswa/template"
                className="inline-flex items-center gap-2 rounded-soft border border-line px-4 py-2 text-sm font-medium text-ink transition hover:bg-canvas"
              >
                <Icon name="download" className="h-4 w-4" />
                Unduh template
              </Link>
              <Link
                href="/admin/siswa"
                className="text-sm font-medium text-muted transition hover:text-ink"
              >
                Kembali ke daftar siswa
              </Link>
            </div>
          </form>
        </section>

        <aside className="rounded-card border border-line bg-surface p-5 shadow-sm">
          <h2 className="font-display text-base text-ink">Panduan singkat</h2>
          <ol className="mt-3 grid list-decimal gap-2 pl-4 text-sm text-muted">
            <li>Unduh template agar susunan kolom sesuai.</li>
            <li>Isi kolom NIS, Nama, dan Kelas mulai baris kedua.</li>
            <li>NIS harus unik dan belum pernah terdaftar.</li>
            <li>Nama kelas harus sama persis dengan daftar di samping.</li>
            <li>Simpan lalu unggah kembali di form ini.</li>
          </ol>

          <h3 className="mt-5 text-sm font-medium text-ink">Kelas tersedia</h3>
          {classes.length === 0 ? (
            <p className="mt-2 text-sm text-muted">
              Belum ada kelas. Tambahkan kelas terlebih dahulu.
            </p>
          ) : (
            <div className="mt-2 flex flex-wrap gap-1.5">
              {classes.map((item) => (
                <span
                  key={item.namaKelas}
                  className="rounded-md border border-line bg-canvas px-2 py-1 text-xs font-medium text-ink"
                >
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
