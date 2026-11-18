import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/guards";
import { RekapView, type RekapSearchParams } from "@/components/RekapView";

export const metadata = { title: "Rekap absensi" };

export default async function RekapPage({
  searchParams,
}: {
  searchParams: Promise<RekapSearchParams>;
}) {
  await requireAdmin("/admin/rekap");
  const params = await searchParams;

  const classes = await prisma.schoolClass.findMany({
    orderBy: { namaKelas: "asc" },
    select: { id: true, namaKelas: true },
  });

  return (
    <RekapView
      classes={classes}
      params={params}
      basePath="/admin/rekap"
      allLabel="Semua kelas"
      emptyHint="Coba pilih tanggal atau bulan lain, atau mulai scan absensi terlebih dahulu."
    />
  );
}
