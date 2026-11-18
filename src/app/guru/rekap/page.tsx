import { notFound } from "next/navigation";

import { getAccessibleClasses } from "@/lib/access";
import { requireStaff } from "@/lib/guards";
import { RekapView, type RekapSearchParams } from "@/components/RekapView";

export const metadata = { title: "Rekap absensi" };

export default async function GuruRekapPage({
  searchParams,
}: {
  searchParams: Promise<RekapSearchParams>;
}) {
  const user = await requireStaff("/guru/rekap");
  const params = await searchParams;

  const classes = await getAccessibleClasses(user);
  const selectedId = Number(params.kelas);
  if (selectedId && !classes.some((item) => item.id === selectedId)) {
    notFound();
  }

  if (classes.length === 0) {
    return (
      <div className="rounded-card border border-line bg-surface p-10 text-center shadow-sm">
        <h1 className="font-display text-lg text-ink">Belum ada kelas</h1>
        <p className="mt-1 text-sm text-muted">
          Admin belum menugaskan kelas untuk Anda. Hubungi admin terlebih dahulu.
        </p>
      </div>
    );
  }

  return (
    <RekapView
      classIds={classes.map((item) => item.id)}
      params={params}
      basePath="/guru/rekap"
      allLabel="Semua kelas saya"
      emptyHint="Coba pilih tanggal atau bulan lain, atau mulai scan absensi terlebih dahulu."
    />
  );
}
