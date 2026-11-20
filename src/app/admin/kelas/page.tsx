import type { Metadata } from "next";

import { AppShell } from "@/components/AppShell";
import { FlashMessages } from "@/components/FlashMessages";
import { Icon } from "@/components/Icon";
import { requireAdmin, guardWith } from "@/lib/guards";
import { navFor } from "@/lib/nav";
import { takeFlash } from "@/lib/flash";
import { getCachedClasses, getCachedTeachers } from "@/lib/cache";
import { ClassForm } from "./ClassForm";
import { saveClassAction } from "./actions";

export const metadata: Metadata = { title: "Data Kelas" };

/** Membaca cookie sesi — navigasi boleh memblokir. */
export const instant = false;

export default async function ClassesPage() {
  const [user, [classes, teachers, flashes]] = await guardWith(
    requireAdmin("/admin/kelas"),
    () => Promise.all([getCachedClasses(), getCachedTeachers(), takeFlash()]),
  );

  return (
    <AppShell
      user={user}
      nav={navFor(user)}
      current="/admin/kelas"
      title="Data Kelas"
      subtitle={`${classes.length} kelas terdaftar`}
    >
      <FlashMessages messages={flashes} />

      <div className="grid gap-4 lg:grid-cols-[1fr_320px]">
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="table-head border-b border-line bg-canvas text-left">
                <tr>
                  <th className="px-4 py-2.5">Kelas</th>
                  <th className="px-4 py-2.5">Wali Kelas</th>
                  <th className="px-4 py-2.5">Siswa</th>
                  <th className="px-4 py-2.5 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {classes.length === 0 && (
                  <tr>
                    <td colSpan={4} className="px-4 py-10 text-center text-sm text-muted">
                      Belum ada kelas. Tambahkan kelas pertama di samping.
                    </td>
                  </tr>
                )}
                {classes.map((item) => (
                  <tr key={item.id} className="transition-colors hover:bg-canvas/60">
                    <td className="px-4 py-2.5 font-semibold text-ink">{item.namaKelas}</td>
                    <td className="px-4 py-2.5 text-muted">{item.guru?.nama ?? "—"}</td>
                    <td className="px-4 py-2.5 tabular-nums text-ink">{item._count.students}</td>
                    <td className="px-4 py-2.5">
                      <div className="flex items-center justify-end gap-1">
                        <a
                          href={`/admin/kelas/${item.id}/edit`}
                          className="btn-icon"
                          title="Ubah"
                          aria-label={`Ubah kelas ${item.namaKelas}`}
                        >
                          <Icon name="edit" size={16} />
                        </a>
                        <form action={`/admin/kelas/${item.id}/hapus`} method="post">
                          <button
                            type="submit"
                            className="btn-icon hover:bg-bad-soft hover:text-bad"
                            title="Hapus"
                            aria-label={`Hapus kelas ${item.namaKelas}`}
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

        <ClassForm action={saveClassAction} teachers={teachers} />
      </div>
    </AppShell>
  );
}
