import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/guards";
import { buildImportTemplate, XLSX_MIMETYPE } from "@/lib/excel";

export async function GET() {
  await requireAdmin("/admin/siswa");

  const classes = await prisma.schoolClass.findMany({
    orderBy: { namaKelas: "asc" },
    select: { namaKelas: true },
  });

  const buffer = await buildImportTemplate(classes);

  return new Response(new Uint8Array(buffer), {
    headers: {
      "Content-Type": XLSX_MIMETYPE,
      "Content-Disposition": 'attachment; filename="template_impor_siswa.xlsx"',
      "Cache-Control": "no-store",
    },
  });
}
