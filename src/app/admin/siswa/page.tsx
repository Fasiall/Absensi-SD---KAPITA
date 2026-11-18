import type { Metadata } from "next";

import { AppShell } from "@/components/AppShell";
import { FlashMessages } from "@/components/FlashMessages";
import { Icon } from "@/components/Icon";
import { requireAdmin } from "@/lib/guards";
import { navFor } from "@/lib/nav";
import { prisma } from "@/lib/db";
import { takeFlash } from "@/lib/flash";

export const metadata: Metadata = { title: "Data Siswa" };

const PER_PAGE = 20;

export default async function StudentsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; kelas?: string; page?: string }>;
}) {
  const user = await requireAdmin("/admin/siswa");
  const params = await searchParams;
  const flashes = await takeFlash();

  const q = (params.q ?? "").trim();
  const selectedClassId = Number.parseInt(params.kelas ?? "", 10);
  const page = Math.max(1, Number.parseInt(params.page ?? "1", 10) || 1);

  const where = {
    ...(q
      ? {
          OR: [
            { nama: { contains: q, mode: "insensitive" as const } },
            { nis: { contains: q, mode: "insensitive" as const } },
          ],
        }
      : {}),
    ...(Number.isFinite(selectedClassId) ? { classId: selectedClassId } : {}),
  };

  const [classes, total, students] = await Promise.all([
    prisma.schoolClass.findMany({ orderBy: { namaKelas: "asc" } }),
    prisma.student.count({ where }),
    prisma.student.findMany({
      where,
      orderBy: [{ schoolClass: { namaKelas: "asc" } }, { nama: "asc" }],
      skip: (page - 1) * PER_PAGE,
      take: PER_PAGE,
      include: { schoolClass: true },
    }),
  ]);

  const totalPages = Math.max(1, Math.ceil(total / PER_PAGE));
  const queryFor = (nextPage: number) => {
    const search = new URLSearchParams();
    if (q) search.set("q", q);
    if (Number.isFinite(selectedClassId)) search.set("kelas", String(selectedClassId));
    search.set("page", String(nextPage));
    return `/admin/siswa?${search.toString()}`;
  };

  return (
    <AppShell
      user={user}
      nav={navFor(user)}
      current="/admin/siswa"
      title="Data Siswa"
      subtitle={`${total} siswa terdaftar`}
      actions={
        <>
          <a
            href="/admin/siswa/impor"
            className="inline-flex h-10 items-center gap-2 rounded-xl border border-line bg-surface px-4 text-sm font-medium transition hover:border-accent hover:text-accent"
          >
            <Icon name="import" size={18} /> Impor
          </a>
          <a
            href="/admin/siswa/tambah"
            className="inline-flex h-10 items-center gap-2 rounded-xl bg-accent px-4 text-sm font-semibold text-white transition hover:bg-accent-strong"
          >
            <Icon name="plus" size={18} /> Tambah
          </a>
        </>
      }
    >
      <FlashMessages messages={flashes} />

      <form className="mb-4 flex flex-wrap items-center gap-2" action="/admin/siswa">
        <div className="relative flex-1 min-w-56">
          <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted">
            <Icon name="search" size={18} />
          </span>
          <input
            name="q"
            defaultValue={q}
            placeholder="Cari nama atau NIS..."
            className="h-10 w-full rounded-xl border border-line bg-surface pl-10 pr-3 text-sm outline-none focus:border-accent"
          />
        </div>
        <select
          name="kelas"
          defaultValue={Number.isFinite(selectedClassId) ? String(selectedClassId) : ""}
          className="h-10 rounded-xl border border-line bg-surface px-3 text-sm outline-none focus:border-accent"
        >
          <option value="">Semua kelas</option>
          {classes.map((item) => (
            <option key={item.id} value={item.id}>
              {item.namaKelas}
            </option>
          ))}
        </select>
        <button
          type="submit"
          className="h-10 rounded-xl border border-line bg-surface px-4 text-sm font-medium transition hover:border-accent hover:text-accent"
        >
          Terapkan
        </button>
      </form>

      <div className="overflow-hidden rounded-2xl border border-line bg-surface shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-canvas text-left text-xs uppercase tracking-wide text-muted">
              <tr>
                <th className="px-4 py-3 font-medium">NIS</th>
                <th className="px-4 py-3 font-medium">Nama</th>
                <th className="px-4 py-3 font-medium">Kelas</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 text-right font-medium">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {students.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-10 text-center text-muted">
                    Belum ada siswa yang cocok dengan pencarian.
                  </td>
                </tr>
              )}
              {students.map((student) => (
                <tr key={student.id} className="hover:bg-canvas/60">
                  <td className="px-4 py-3 font-mono text-xs">{student.nis}</td>
                  <td className="px-4 py-3 font-medium">{student.nama}</td>
                  <td className="px-4 py-3 text-muted">{student.schoolClass.namaKelas}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                        student.aktif ? "bg-green-50 text-ok" : "bg-canvas text-muted"
                      }`}
                    >
                      {student.aktif ? "Aktif" : "Nonaktif"}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1">
                      <a
                        href={`/admin/siswa/${student.id}/edit`}
                        className="grid size-8 place-items-center rounded-lg text-muted transition hover:bg-accent-soft hover:text-accent"
                        title="Ubah"
                      >
                        <Icon name="edit" size={16} />
                      </a>
                      <form action={`/admin/siswa/${student.id}/hapus`} method="post">
                        <button
                          type="submit"
                          className="grid size-8 place-items-center rounded-lg text-muted transition hover:bg-red-50 hover:text-bad"
                          title="Hapus"
                        >
                          <Icon name="trash" size={16} />
                        </button>
                      </form>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {totalPages > 1 && (
        <div className="mt-4 flex items-center justify-between text-sm text-muted">
          <span>
            Halaman {page} dari {totalPages}
          </span>
          <div className="flex gap-2">
            {page > 1 && (
              <a
                href={queryFor(page - 1)}
                className="inline-flex h-9 items-center gap-1 rounded-lg border border-line bg-surface px-3 transition hover:border-accent hover:text-accent"
              >
                <Icon name="chevron-left" size={16} /> Sebelumnya
              </a>
            )}
            {page < totalPages && (
              <a
                href={queryFor(page + 1)}
                className="inline-flex h-9 items-center gap-1 rounded-lg border border-line bg-surface px-3 transition hover:border-accent hover:text-accent"
              >
                Berikutnya <Icon name="chevron-right" size={16} />
              </a>
            )}
          </div>
        </div>
      )}
    </AppShell>
  );
}
