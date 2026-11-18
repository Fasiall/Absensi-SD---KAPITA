import { requireAdmin, guardWith } from "@/lib/guards";
import { RekapView, type RekapSearchParams } from "@/components/RekapView";

export const metadata = { title: "Rekap absensi" };

export default async function RekapPage({
  searchParams,
}: {
  searchParams: Promise<RekapSearchParams>;
}) {
  const [, params] = await guardWith(requireAdmin("/admin/rekap"), () =>
    searchParams,
  );

  return (
    <RekapView
      params={params}
      basePath="/admin/rekap"
      allLabel="Semua kelas"
      emptyHint="Coba pilih tanggal atau bulan lain, atau mulai scan absensi terlebih dahulu."
    />
  );
}
