import Link from "next/link";
import { redirect } from "next/navigation";

import { Icon } from "@/components/Icon";
import { getAccessibleClasses } from "@/lib/access";
import { requireLogin } from "@/lib/guards";

export const instant = false;

export default async function CetakIndexPage({
  searchParams,
}: {
  searchParams: Promise<{ class_id?: string; student_id?: string }>;
}) {
  const user = await requireLogin("/cetak");

  // Link dari daftar kelas / data siswa langsung ke lembar kartu.
  const params = await searchParams;
  const classId = Number.parseInt(params.class_id ?? "", 10);
  const studentId = Number.parseInt(params.student_id ?? "", 10);
  const query = new URLSearchParams();
  if (Number.isInteger(studentId)) query.set("student_id", String(studentId));
  else if (Number.isInteger(classId)) query.set("class_id", String(classId));
  if (query.toString()) redirect(`/cetak/kartu?${query.toString()}`);

  const classes = await getAccessibleClasses(user);
  const backHref = user.role === "admin" ? "/admin" : "/guru/kelas";

  return (
    <>
      <header className="mb-5 flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-muted">Kartu Siswa</p>
          <h1 className="font-display text-2xl text-ink">Cetak Kartu QR</h1>
          <p className="mt-1 text-sm text-muted">
            Cetak kartu siap potong untuk satu kelas atau satu siswa.
          </p>
        </div>
        <Link
          href={backHref}
          className="inline-flex items-center gap-1.5 rounded-soft border border-line bg-surface px-3 py-2 text-sm font-medium text-ink shadow-sm transition hover:bg-canvas"
        >
          <Icon name="chevron-left" className="h-4 w-4" />
          Kembali
        </Link>
      </header>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_320px]">
        <section className="rounded-card border border-line bg-surface p-5 shadow-sm">
          <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
            <div>
              <h2 className="font-display text-base text-ink">Pilih Kelas</h2>
              <p className="mt-0.5 text-sm text-muted">
                Semua siswa aktif pada kelas akan dicetak.
              </p>
            </div>
            <span className="rounded-full bg-accent-soft px-2.5 py-1 text-xs font-semibold text-accent">
              A4 · 10 kartu/lembar
            </span>
          </div>

          {classes.length === 0 ? (
            <div className="rounded-card border border-line bg-canvas p-10 text-center">
              <Icon name="cards" className="mx-auto h-8 w-8 text-muted" />
              <h3 className="mt-3 font-display text-base text-ink">Belum ada kelas</h3>
              <p className="mt-1 text-sm text-muted">
                Tambahkan kelas dan siswa terlebih dahulu untuk mencetak kartu QR.
              </p>
            </div>
          ) : (
            <>
              <form method="get" action="/cetak/kartu" className="space-y-4">
                <div>
                  <label
                    htmlFor="class_id"
                    className="mb-1.5 block text-sm font-medium text-ink"
                  >
                    Kelas
                  </label>
                  <select
                    id="class_id"
                    name="class_id"
                    required
                    defaultValue=""
                    className="w-full rounded-soft border border-line bg-surface px-3 py-2 text-sm text-ink shadow-sm"
                  >
                    <option value="" disabled>
                      Pilih kelas
                    </option>
                    {classes.map((c) => (
                      <option key={c.id} value={c.id}>
                        Kelas {c.namaKelas}
                      </option>
                    ))}
                  </select>
                </div>
                <button
                  type="submit"
                  className="inline-flex items-center gap-2 rounded-soft bg-accent px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-accent-strong"
                >
                  <Icon name="cards" className="h-4 w-4" />
                  Buka Halaman Cetak
                </button>
              </form>

              <div className="my-5 border-t border-line" />

              <div className="flex items-start gap-3 rounded-soft bg-accent-soft p-3">
                <Icon name="info" className="mt-0.5 h-4 w-4 shrink-0 text-accent" />
                <p className="text-sm text-ink">
                  Untuk mencetak ulang satu kartu, buka halaman Data Siswa lalu tekan tombol{" "}
                  <strong>Kartu</strong> pada siswa tersebut. Di halaman cetak, gunakan tombol
                  Cetak lalu pilih ukuran kertas A4.
                </p>
              </div>
            </>
          )}
        </section>

        <aside className="rounded-card border border-line bg-surface p-5 shadow-sm">
          <div className="flex items-center gap-2.5">
            <span className="inline-flex h-9 w-9 items-center justify-center rounded-soft bg-accent-soft text-accent">
              <Icon name="cards" className="h-4 w-4" />
            </span>
            <h2 className="font-display text-base text-ink">Tips mencetak</h2>
          </div>
          <ul className="mt-4 space-y-2 text-sm text-muted">
            {[
              "Gunakan kertas A4, orientasi potret.",
              "Atur skala cetak 100% (jangan Fit to page).",
              "Matikan header/footer browser saat mencetak.",
              "Gunakan kertas tebal lalu potong mengikuti garis.",
              "Simpan cadangan file PDF kartu untuk cetak ulang.",
            ].map((tip) => (
              <li key={tip} className="flex gap-2">
                <Icon name="check" className="mt-0.5 h-4 w-4 shrink-0 text-ok" />
                {tip}
              </li>
            ))}
          </ul>
        </aside>
      </div>
    </>
  );
}
