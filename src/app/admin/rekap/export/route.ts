import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/guards";
import { buildReports, detailRowsForExport, resolvePeriod } from "@/lib/reports";
import { buildReportWorkbook, XLSX_MIMETYPE, type DetailRecord } from "@/lib/excel";

export async function GET(request: Request) {
  await requireAdmin("/admin/rekap");

  const url = new URL(request.url);
  const classes = await prisma.schoolClass.findMany({
    orderBy: { namaKelas: "asc" },
    select: { id: true, namaKelas: true },
  });

  const selectedId = Number(url.searchParams.get("kelas"));
  const selectedClass = classes.find((item) => item.id === selectedId) ?? null;
  const selectedClasses = selectedClass ? [selectedClass] : classes;

  const period = resolvePeriod(url.searchParams);
  const classIds = selectedClasses.map((item) => item.id);
  const data = await buildReports(classIds, period);
  const detail = await detailRowsForExport(classIds, period);

  const user = await prisma.user.findFirst({
    where: { role: "admin", aktif: true },
    orderBy: { id: "asc" },
    select: { nama: true },
  });

  const buffer = await buildReportWorkbook(
    {
      reports: data.reports.map((report) => ({
        classId: report.classId,
        namaKelas: report.namaKelas,
        students: report.students,
      })),
      aggregate: data.aggregate,
      totalStudents: data.totalStudents,
      overallPercent: data.overallPercent,
    },
    selectedClasses,
    period.start,
    period.end,
    process.env.SCHOOL_NAME ?? "SD Negeri Purwodadi Simpang",
    user?.nama ?? "Administrator",
    detail as unknown as DetailRecord[],
  );

  const filename = `rekap_absensi_${period.start}_${period.end}.xlsx`;

  return new Response(new Uint8Array(buffer), {
    headers: {
      "Content-Type": XLSX_MIMETYPE,
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "no-store",
    },
  });
}
