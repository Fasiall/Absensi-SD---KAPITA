import "server-only";

import { prisma } from "@/lib/db";
import { generateQrCode } from "@/lib/attendance";
import {
  cellText,
  detectDelimiter,
  normalizeHeader,
  parseCsv,
  readXlsxRows,
  type ImportRow,
} from "@/lib/excel";

export type ImportResult = {
  created: number;
  skipped: number;
  errors: string[];
};

const HEADER_ALIASES: Record<"nis" | "nama" | "kelas", string[]> = {
  nis: ["nis", "nomor induk", "nomor induk siswa"],
  nama: ["nama", "nama siswa"],
  kelas: ["kelas", "nama kelas"],
};

const MAX_ERRORS = 60;

/** Setara _import_students() di app/admin.py. */
export async function importStudents(
  buffer: Buffer,
  extension: "xlsx" | "csv",
  classes: { id: number; namaKelas: string }[],
): Promise<ImportResult> {
  const rows = await readRows(buffer, extension);

  if (rows.length === 0) {
    throw new Error("File kosong. Gunakan template impor yang disediakan.");
  }

  const headerMap: Partial<Record<"nis" | "nama" | "kelas", number>> = {};
  (rows[0] ?? []).forEach((rawHeader, index) => {
    const header = normalizeHeader(rawHeader);
    for (const key of ["nis", "nama", "kelas"] as const) {
      if (HEADER_ALIASES[key].includes(header)) headerMap[key] = index;
    }
  });

  const missing = (["nis", "nama", "kelas"] as const).filter(
    (label) => headerMap[label] === undefined,
  );
  if (missing.length > 0) {
    throw new Error(
      `Kolom wajib tidak ditemukan: ${missing.map((label) => label.toUpperCase()).join(", ")}. Gunakan template impor yang disediakan.`,
    );
  }

  const classMap = new Map(classes.map((item) => [item.namaKelas.toUpperCase(), item]));
  const existing = await prisma.student.findMany({ select: { nis: true } });
  const existingNis = new Set(existing.map((item) => item.nis));
  const seenNis = new Set<string>();

  const errors: string[] = [];
  let skipped = 0;
  const toCreate: { nis: string; nama: string; classId: number }[] = [];

  for (let index = 1; index < rows.length; index += 1) {
    const row = rows[index] ?? [];
    const rowNumber = index + 1;
    const values = {
      nis: cellText(row[headerMap.nis!]),
      nama: cellText(row[headerMap.nama!]),
      kelas: cellText(row[headerMap.kelas!]),
    };

    if (!values.nis && !values.nama && !values.kelas) continue;

    const rowErrors: string[] = [];
    if (!values.nis) rowErrors.push("NIS kosong");
    else if (values.nis.length > 30) rowErrors.push("NIS lebih dari 30 karakter");
    else if (existingNis.has(values.nis) || seenNis.has(values.nis))
      rowErrors.push("NIS sudah terdaftar");

    if (!values.nama) rowErrors.push("nama kosong");
    else if (values.nama.length > 100) rowErrors.push("nama lebih dari 100 karakter");

    const schoolClass = classMap.get(values.kelas.toUpperCase());
    if (!values.kelas) rowErrors.push("kelas kosong");
    else if (!schoolClass) rowErrors.push(`kelas '${values.kelas}' tidak ditemukan`);

    if (rowErrors.length > 0) {
      skipped += 1;
      if (errors.length < MAX_ERRORS) {
        errors.push(`Baris ${rowNumber}: ${rowErrors.join(", ")}.`);
      }
      continue;
    }

    seenNis.add(values.nis);
    toCreate.push({ nis: values.nis, nama: values.nama, classId: schoolClass!.id });
  }

  let created = 0;
  if (toCreate.length > 0) {
    const data = await Promise.all(
      toCreate.map(async (item) => ({
        ...item,
        qrCode: await generateQrCode(),
        aktif: true,
      })),
    );
    try {
      const result = await prisma.student.createMany({ data });
      created = result.count;
    } catch {
      throw new Error("Terjadi duplikasi data. Tidak ada siswa yang diimpor.");
    }
  }

  if (skipped > errors.length) {
    errors.push(`...dan ${skipped - errors.length} baris bermasalah lainnya.`);
  }

  return { created, skipped, errors };
}

async function readRows(buffer: Buffer, extension: "xlsx" | "csv"): Promise<ImportRow[]> {
  if (extension === "csv") {
    let text: string;
    try {
      text = new TextDecoder("utf-8", { fatal: true }).decode(buffer);
    } catch {
      text = new TextDecoder("latin1").decode(buffer);
    }
    // buang BOM bila ada
    if (text.charCodeAt(0) === 0xfeff) text = text.slice(1);

    const delimiter = detectDelimiter(text.slice(0, 2048));
    return parseCsv(text, delimiter);
  }

  return readXlsxRows(buffer);
}

/** Setara ekstensi file: "siswa.XLSX" -> "xlsx" atau "" bila tanpa titik. */
export function fileExtension(filename: string): string {
  const dot = filename.lastIndexOf(".");
  return dot === -1 ? "" : filename.slice(dot + 1).toLowerCase();
}
