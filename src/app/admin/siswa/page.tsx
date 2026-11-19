import type { Metadata } from "next";

import { AppShell } from "@/components/AppShell";
import { FlashMessages } from "@/components/FlashMessages";
import { Icon } from "@/components/Icon";
import { requireAdmin, guardWith } from "@/lib/guards";
import { navFor } from "@/lib/nav";
import { prisma } from "@/lib/db";
import { getCachedClasses } from "@/lib/cache";
import { takeFlash } from "@/lib/flash";

export const metadata: Metadata = { title: "Data Siswa" };

/** Membaca cookie sesi — navigasi boleh memblokir. */
export const instant = false;

const PER_PAGE = 20;

export default async function StudentsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; kelas?: string; page?: string }>;
}) {
  const [user, params] = await guardWith(requireAdmin("/admin/siswa"), () =>
    searchParams,
  );
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
    getCachedClasses(),
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
          <a href="/admin/siswa/impor" className="btn btn-secondary">
            <Icon name="import" size={18} /> Impor
          </a>
          <a href="/admin/siswa/tambah" className="btn btn-primary">
            <Icon name="plus" size={18} /> Tambah
          </a>
        </>
      }
    >
      <FlashMessages messages={flashes} />

      <form className="card card-pad mb-3.5 flex flex-wrap items-end gap-2" action="/admin/siswa">
        <label className="field min-w-52 flex-1">
          <span className="field-label">Carian</span>
          <span className="relative block">
            <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-subtle">
              <Icon name="search" size={16} />
            </span>
            <input
              name="q"
              defaultValue={q}
              placeholder="Cari nama atau NIS..."
              className="input pl-9"
            />
          </span>
        </label>
        <label className="field">
          <span className="field-label">Kelas</span>
          <select
            name="kelas"
            defaultValue={Number.isFinite(selectedClassId) ? String(selectedClassId) : ""}
            className="select"
          >
            <option value="">Semua kelas</option>
            {classes.map((item) => (
              <option key={item.id} value={item.id}>
                {item.namaKelas}
              </option>
            ))}
          </select>
        </label>
        <button type="submit" className="btn btn-secondary btn-md">
          Terapkan
        </button>
      </form>

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="table-head border-b border-line bg-canvas text-left">
              <tr>
                <th className="px-4 py-2.5">NIS</th>
                <th className="px-4 py-2.5">Nama</th>
                <th className="px-4 py-2.5">Kelas</th>
                <th className="px-4 py-2.5">Status</th>
                <th className="px-4 py-2.5 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {students.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-10 text-center text-sm text-muted">
                    Belum ada siswa yang cocok dengan pencarian.
                  </td>
                </tr>
              )}
              {students.map((student) => (
                <tr key={student.id} className="transition-colors hover:bg-canvas/60">
                  <td className="px-4 py-2.5 font-mono text-xs text-muted">{student.nis}</td>
                  <td className="px-4 py-2.5 font-medium text-ink">{student.nama}</td>
                  <td className="px-4 py-2.5">
                    <span className="badge badge-neutral">{student.schoolClass.namaKelas}</span>
                  </td>
                  <td className="px-4 py-2.5">
                    <span className={`badge ${student.aktif ? "badge-ok" : "badge-neutral"}`}>
                      {student.aktif ? "Aktif" : "Nonaktif"}
                    </span>
                  </td>
                  <td className="px-4 py-2.5">
                    <div className="flex items-center justify-end gap-1">
                      <a
                        href={`/admin/siswa/${student.id}/edit`}
                        className="btn-icon"
                        title="Ubah"
                        aria-label={`Ubah ${student.nama}`}
                      >
                        <Icon name="edit" size={16} />
                      </a>
                      <form action={`/admin/siswa/${student.id}/hapus`} method="post">
                        <button
                          type="submit"
                          className="btn-icon hover:bg-bad-soft hover:text-bad"
                          title="Hapus"
                          aria-label={`Hapus ${student.nama}`}
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
        <div className="mt-4 flex flex-wrap items-center justify-between gap-2 text-xs text-muted">
          <span>
            Halaman {page} dari {totalPages}
          </span>
          <div className="flex gap-2">
            {page > 1 && (
              <a href={queryFor(page - 1)} className="btn btn-secondary btn-sm">
                <Icon name="chevron-left" size={16} /> Sebelumnya
              </a>
            )}
            {page < totalPages && (
              <a href={queryFor(page + 1)} className="btn btn-secondary btn-sm">
                Berikutnya <Icon name="chevron-right" size={16} />
              </a>
            )}
          </div>
        </div>
      )}
    </AppShell>
  );
}
