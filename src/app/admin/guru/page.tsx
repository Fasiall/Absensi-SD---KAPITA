import type { Metadata } from "next";

import { AppShell } from "@/components/AppShell";
import { FlashMessages } from "@/components/FlashMessages";
import { Icon } from "@/components/Icon";
import { requireAdmin, guardWith } from "@/lib/guards";
import { navFor } from "@/lib/nav";
import { prisma } from "@/lib/db";
import { takeFlash } from "@/lib/flash";

export const metadata: Metadata = { title: "Data Guru" };

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
        <a
          href="/admin/guru/tambah"
          className="inline-flex h-10 items-center gap-2 rounded-xl bg-accent px-4 text-sm font-semibold text-white transition hover:bg-accent-strong"
        >
          <Icon name="plus" size={16} />
          Tambah guru
        </a>
      }
    >
      <FlashMessages messages={flashes} />

      <div className="overflow-hidden rounded-2xl border border-line bg-surface shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-canvas text-left text-xs uppercase tracking-wide text-muted">
              <tr>
                <th className="px-4 py-3 font-medium">Nama</th>
                <th className="px-4 py-3 font-medium">Username</th>
                <th className="px-4 py-3 font-medium">Kelas diampu</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 text-right font-medium">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {teachers.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-10 text-center text-muted">
                    Belum ada akun guru.
                  </td>
                </tr>
              )}
              {teachers.map((teacher) => (
                <tr key={teacher.id} className="hover:bg-canvas/60">
                  <td className="px-4 py-3 font-semibold">{teacher.nama}</td>
                  <td className="px-4 py-3 text-muted">{teacher.username}</td>
                  <td className="px-4 py-3">{teacher._count.classes}</td>
                  <td className="px-4 py-3">
                    <span
                      className={
                        teacher.aktif
                          ? "rounded-full bg-emerald-50 px-2 py-1 text-xs font-medium text-ok"
                          : "rounded-full bg-slate-100 px-2 py-1 text-xs font-medium text-muted"
                      }
                    >
                      {teacher.aktif ? "Aktif" : "Nonaktif"}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1">
                      <a
                        href={`/admin/guru/${teacher.id}/edit`}
                        className="grid size-8 place-items-center rounded-lg text-muted transition hover:bg-accent-soft hover:text-accent"
                        title="Ubah"
                      >
                        <Icon name="edit" size={16} />
                      </a>
                      <form action={`/admin/guru/${teacher.id}/hapus`} method="post">
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
    </AppShell>
  );
}
