import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { canAccessClass } from "@/lib/access";
import { requireLogin } from "@/lib/guards";
import { prisma } from "@/lib/db";
import { qrPngDataUri } from "@/lib/qr";
import { PrintButton } from "./PrintButton";

export const instant = false;

const CARDS_PER_SHEET = 10;

function chunked<T>(items: T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < items.length; i += size) out.push(items.slice(i, i + size));
  return out;
}

export async function generateMetadata({
  searchParams,
}: {
  searchParams: Promise<{ student_id?: string; class_id?: string }>;
}): Promise<Metadata> {
  const params = await searchParams;
  const studentId = Number.parseInt(params.student_id ?? "", 10);
  const classId = Number.parseInt(params.class_id ?? "", 10);

  if (Number.isInteger(studentId)) {
    const student = await prisma.student.findUnique({ where: { id: studentId } });
    if (student) return { title: `Kartu QR - ${student.nama}` };
  }
  if (Number.isInteger(classId)) {
    const schoolClass = await prisma.schoolClass.findUnique({ where: { id: classId } });
    if (schoolClass) return { title: `Kartu QR Kelas ${schoolClass.namaKelas}` };
  }
  return { title: "Kartu QR" };
}

export default async function KartuPage({
  searchParams,
}: {
  searchParams: Promise<{ student_id?: string; class_id?: string }>;
}) {
  const user = await requireLogin("/cetak");
  const params = await searchParams;

  const studentId = Number.parseInt(params.student_id ?? "", 10);
  const classId = Number.parseInt(params.class_id ?? "", 10);
  const schoolName = process.env.SCHOOL_NAME ?? "SD Negeri Purwodadi Simpang";

  let students: Awaited<ReturnType<typeof prisma.student.findMany<{ include: { schoolClass: true } }>>>;
  let title: string;

  if (Number.isInteger(studentId)) {
    const student = await prisma.student.findUnique({
      where: { id: studentId },
      include: { schoolClass: true },
    });
    if (!student) notFound();
    if (!canAccessClass(user, student.schoolClass)) notFound();
    students = [student];
    title = `Kartu QR - ${student.nama}`;
  } else if (Number.isInteger(classId)) {
    const schoolClass = await prisma.schoolClass.findUnique({ where: { id: classId } });
    if (!schoolClass) notFound();
    if (!canAccessClass(user, schoolClass)) notFound();
    students = await prisma.student.findMany({
      where: { classId, aktif: true },
      include: { schoolClass: true },
      orderBy: { nama: "asc" },
    });
    title = `Kartu QR Kelas ${schoolClass.namaKelas}`;
  } else {
    notFound();
  }

  if (students.length === 0) notFound();

  const qrImages = new Map<number, string>();
  for (const student of students) {
    qrImages.set(student.id, await qrPngDataUri(student.qrCode));
  }

  const sheets = chunked(students, CARDS_PER_SHEET);
  const backHref = user.role === "admin" ? "/admin/siswa" : "/guru/kelas";

  return (
    <>
      <link rel="stylesheet" href="/css/print.css" />

      <div className="print-toolbar no-print">
        <div className="toolbar-info">
          <strong>{title}</strong>
          <span>
            {students.length} kartu &middot; {sheets.length} lembar A4
          </span>
        </div>
        <div className="toolbar-actions">
          <Link className="toolbar-btn toolbar-btn-light" href={backHref}>
            Kembali
          </Link>
          <PrintButton />
        </div>
      </div>

      <p className="print-note no-print">
        Tips: pilih kertas A4, skala 100%, dan matikan header/footer browser.
      </p>

      {sheets.map((sheet, sheetIndex) => (
        <section className="sheet" key={sheetIndex}>
          {sheet.map((student) => (
            <article className="qr-card" key={student.id}>
              <div className="qr-card-accent" />
              <div className="qr-card-head">
                <span className="school-name">{schoolName}</span>
                <span className="card-label">Kartu Absensi</span>
              </div>
              <div className="qr-card-body">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  className="qr-image"
                  src={qrImages.get(student.id)}
                  alt={`Kode QR ${student.nama}`}
                />
                <div className="qr-card-text">
                  <h2>{student.nama}</h2>
                  <p className="student-class">Kelas {student.schoolClass?.namaKelas ?? "-"}</p>
                  <p className="student-nis">NIS {student.nis}</p>
                  <p className="student-code">{student.qrCode}</p>
                </div>
              </div>
              <div className="qr-card-foot">Simpan kartu ini untuk absensi harian</div>
            </article>
          ))}
        </section>
      ))}
    </>
  );
}
