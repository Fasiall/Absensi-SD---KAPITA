import type { Metadata } from "next";

import { AppShell } from "@/components/AppShell";
import { FlashMessages } from "@/components/FlashMessages";
import { Icon } from "@/components/Icon";
import { requireAdmin, guardWith } from "@/lib/guards";
import { navFor } from "@/lib/nav";
import { prisma } from "@/lib/db";
import { takeFlash } from "@/lib/flash";

export const metadata: Metadata = { title: "Data Guru" };

/** Membaca cookie sesi — navigasi boleh memblokir. */
export const instant = false;

export default async function TeachersPage() {
  const [user, [teachers, flashes]] = await guardWith(
    requireAdmin("/admin/guru"),
    () =>
      Promise.all([
        prisma.user.findMany({
          where: { role: "guru" },
          orderBy: { nama: "asc" },
          include: { _count: { select: { classes: true } } },
        }),
        takeFlash(),
      ]),
  );

  return (
    <AppShell
      user={user}
      nav={navFor(user)}
      current="/admin/guru"
      title="Data Guru"
      subtitle={`${teachers.length} akun guru terdaftar`}
      actions={
        <a href="/admin/guru/tambah" className="btn btn-primary">
          <Icon name="plus" size={16} />
          Tambah guru
        </a>
      }
    >
      <FlashMessages messages={flashes} />

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="table-head border-b border-line bg-canvas text-left">
              <tr>
                <th className="px-4 py-2.5">Nama</th>
                <th className="px-4 py-2.5">Username</th>
                <th className="px-4 py-2.5">Kelas diampu</th>
                <th className="px-4 py-2.5">Status</th>
                <th className="px-4 py-2.5 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {teachers.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-10 text-center text-sm text-muted">
                    Belum ada akun guru.
                  </td>
                </tr>
              )}
              {teachers.map((teacher) => (
                <tr key={teacher.id} className="transition-colors hover:bg-canvas/60">
                  <td className="px-4 py-2.5 font-semibold text-ink">{teacher.nama}</td>
                  <td className="px-4 py-2.5 font-mono text-xs text-muted">{teacher.username}</td>
                  <td className="px-4 py-2.5 tabular-nums text-ink">{teacher._count.classes}</td>
                  <td className="px-4 py-2.5">
                    <span className={`badge ${teacher.aktif ? "badge-ok" : "badge-neutral"}`}>
                      {teacher.aktif ? "Aktif" : "Nonaktif"}
                    </span>
                  </td>
                  <td className="px-4 py-2.5">
                    <div className="flex items-center justify-end gap-1">
                      <a
                        href={`/admin/guru/${teacher.id}/edit`}
                        className="btn-icon"
                        title="Ubah"
                        aria-label={`Ubah ${teacher.nama}`}
                      >
                        <Icon name="edit" size={16} />
                      </a>
                      <form action={`/admin/guru/${teacher.id}/hapus`} method="post">
                        <button
                          type="submit"
                          className="btn-icon hover:bg-bad-soft hover:text-bad"
                          title="Hapus"
                          aria-label={`Hapus ${teacher.nama}`}
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
    </AppShell>
  );
}
