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

      <div className="grid gap-5 lg:grid-cols-[1fr_320px]">
        <div className="overflow-hidden rounded-2xl border border-line bg-surface shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-canvas text-left text-xs uppercase tracking-wide text-muted">
                <tr>
                  <th className="px-4 py-3 font-medium">Kelas</th>
                  <th className="px-4 py-3 font-medium">Wali Kelas</th>
                  <th className="px-4 py-3 font-medium">Siswa</th>
                  <th className="px-4 py-3 text-right font-medium">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {classes.length === 0 && (
                  <tr>
                    <td colSpan={4} className="px-4 py-10 text-center text-muted">
                      Belum ada kelas. Tambahkan kelas pertama di samping.
                    </td>
                  </tr>
                )}
                {classes.map((item) => (
                  <tr key={item.id} className="hover:bg-canvas/60">
                    <td className="px-4 py-3 font-semibold">{item.namaKelas}</td>
                    <td className="px-4 py-3 text-muted">{item.guru?.nama ?? "—"}</td>
                    <td className="px-4 py-3">{item._count.students}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <a
                          href={`/admin/kelas/${item.id}/edit`}
                          className="grid size-8 place-items-center rounded-lg text-muted transition hover:bg-accent-soft hover:text-accent"
                          title="Ubah"
                        >
                          <Icon name="edit" size={16} />
                        </a>
                        <form action={`/admin/kelas/${item.id}/hapus`} method="post">
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

        <ClassForm action={saveClassAction} teachers={teachers} />
      </div>
    </AppShell>
  );
}
