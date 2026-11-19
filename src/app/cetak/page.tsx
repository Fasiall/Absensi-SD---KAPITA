import Link from "next/link";
import { redirect } from "next/navigation";

import { Icon } from "@/components/Icon";
import { getAccessibleClasses } from "@/lib/access";
import { requireLogin } from "@/lib/guards";

export const instant = false;

const TIPS = [
  "Gunakan kertas A4, orientasi potret.",
  "Atur skala cetak 100% (jangan Fit to page).",
  "Matikan header/footer browser saat mencetak.",
  "Gunakan kertas tebal lalu potong mengikuti garis.",
  "Simpan cadangan file PDF kartu untuk cetak ulang.",
];

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
        <div className="min-w-0">
          <p className="eyebrow mb-2">Kartu siswa</p>
          <h1 className="page-title">Cetak Kartu QR</h1>
          <p className="page-subtitle">Cetak kartu siap potong untuk satu kelas atau satu siswa.</p>
        </div>
        <Link href={backHref} className="btn btn-secondary shrink-0">
          <Icon name="chevron-left" className="h-4 w-4" />
          Kembali
        </Link>
      </header>

      <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_320px]">
        <section className="card card-pad-lg">
          <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0">
              <h2 className="section-title">Pilih Kelas</h2>
              <p className="section-subtitle">Semua siswa aktif pada kelas akan dicetak.</p>
            </div>
            <span className="badge badge-accent shrink-0">A4 · 10 kartu/lembar</span>
          </div>

          {classes.length === 0 ? (
            <div className="empty-state border-0 bg-canvas">
              <Icon name="cards" className="mx-auto h-7 w-7 text-subtle" />
              <h3 className="section-title mt-3">Belum ada kelas</h3>
              <p className="mx-auto mt-1.5 max-w-sm text-sm leading-relaxed text-muted">
                Tambahkan kelas dan siswa terlebih dahulu untuk mencetak kartu QR.
              </p>
            </div>
          ) : (
            <>
              <form method="get" action="/cetak/kartu" className="grid gap-4">
                <label className="field">
                  <span className="field-label">Kelas</span>
                  <select id="class_id" name="class_id" required defaultValue="" className="select">
                    <option value="" disabled>
                      Pilih kelas
                    </option>
                    {classes.map((item) => (
                      <option key={item.id} value={item.id}>
                        Kelas {item.namaKelas}
                      </option>
                    ))}
                  </select>
                </label>
                <button type="submit" className="btn btn-primary justify-self-start">
                  <Icon name="cards" className="h-4 w-4" />
                  Buka Halaman Cetak
                </button>
              </form>

              <div className="my-5 border-t border-line" />

              <div className="flex items-start gap-2.5 rounded-soft bg-accent-soft p-3 text-xs leading-relaxed text-ink-soft">
                <Icon name="info" className="mt-0.5 h-4 w-4 shrink-0 text-accent" />
                <p>
                  Untuk mencetak ulang satu kartu, buka halaman Data Siswa lalu tekan tombol{" "}
                  <strong className="font-semibold text-ink">Kartu</strong> pada siswa tersebut. Di
                  halaman cetak, gunakan tombol Cetak lalu pilih ukuran kertas A4.
                </p>
              </div>
            </>
          )}
        </section>

        <aside className="card card-pad-lg h-fit">
          <div className="flex items-center gap-2.5">
            <span className="grid size-8 shrink-0 place-items-center rounded-soft bg-accent-soft text-accent">
              <Icon name="cards" className="h-4 w-4" />
            </span>
            <h2 className="section-title">Tips mencetak</h2>
          </div>
          <ul className="mt-4 grid gap-2 text-xs leading-relaxed text-muted">
            {TIPS.map((tip) => (
              <li key={tip} className="flex gap-2">
                <Icon name="check" className="mt-0.5 h-3.5 w-3.5 shrink-0 text-ok" />
                {tip}
              </li>
            ))}
          </ul>
        </aside>
      </div>
    </>
  );
}
