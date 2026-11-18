import { getAccessibleClasses } from "@/lib/access";
import { requireStaff } from "@/lib/guards";
import { buildReports, detailRowsForExport, resolvePeriod } from "@/lib/reports";
import { buildReportWorkbook, XLSX_MIMETYPE, type DetailRecord } from "@/lib/excel";

export async function GET(request: Request) {
  const user = await requireStaff("/guru/rekap");
  const url = new URL(request.url);

  const classes = await getAccessibleClasses(user);
  const selectedId = Number(url.searchParams.get("kelas"));
  const selectedClass = selectedId ? classes.find((item) => item.id === selectedId) : null;
  if (selectedId && !selectedClass) {
    return new Response("Anda tidak punya akses ke kelas ini.", { status: 403 });
  }

  const selectedClasses = selectedClass ? [selectedClass] : classes;
  const period = resolvePeriod(url.searchParams);
  const classIds = selectedClasses.map((item) => item.id);
  const data = await buildReports(classIds, period);
  const detail = await detailRowsForExport(classIds, period);

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
    process.env.SCHOOL_NAME ?? "SD KAPITA",
    user.nama,
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
