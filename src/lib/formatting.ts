// Port dari app/formatting.py — format tanggal & jam bahasa Indonesia.

const NAMA_HARI = [
  "Minggu",
  "Senin",
  "Selasa",
  "Rabu",
  "Kamis",
  "Jumat",
  "Sabtu",
];

const NAMA_BULAN = [
  "Januari",
  "Februari",
  "Maret",
  "April",
  "Mei",
  "Juni",
  "Juli",
  "Agustus",
  "September",
  "Oktober",
  "November",
  "Desember",
];

const BULAN_SINGKAT = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "Mei",
  "Jun",
  "Jul",
  "Agu",
  "Sep",
  "Okt",
  "Nov",
  "Des",
];

function toDate(value: Date | string): Date {
  if (value instanceof Date) return value;
  return new Date(`${value.slice(0, 10)}T00:00:00Z`);
}

/** "Senin, 18 November 2026" */
export function tanggalId(value: Date | string): string {
  const d = toDate(value);
  return `${NAMA_HARI[d.getUTCDay()]}, ${d.getUTCDate()} ${
    NAMA_BULAN[d.getUTCMonth()]
  } ${d.getUTCFullYear()}`;
}

/** "18 Nov 2026" */
export function tanggalSingkat(value: Date | string): string {
  const d = toDate(value);
  return `${d.getUTCDate()} ${BULAN_SINGKAT[d.getUTCMonth()]} ${d.getUTCFullYear()}`;
}

/** "18 November" (tanpa tahun) */
export function tanggalTanpaTahun(value: Date | string): string {
  const d = toDate(value);
  return `${d.getUTCDate()} ${NAMA_BULAN[d.getUTCMonth()]}`;
}

/** "18/11/2026" */
export function tanggalAngka(value: Date | string): string {
  const d = toDate(value);
  return `${String(d.getUTCDate()).padStart(2, "0")}/${String(
    d.getUTCMonth() + 1,
  ).padStart(2, "0")}/${d.getUTCFullYear()}`;
}

/** Nilai untuk <input type="date"> — "YYYY-MM-DD" */
export function tanggalInput(value: Date | string): string {
  if (typeof value === "string") return value.slice(0, 10);
  return value.toISOString().slice(0, 10);
}

/** "18 Nov 2026" -> "18 November 2026 – 25 November 2026" bila berbeda tahun/bulan */
export function periodeId(start: Date | string, end: Date | string): string {
  const a = toDate(start);
  const b = toDate(end);
  if (a.getTime() === b.getTime()) return tanggalId(a);
  return `${tanggalSingkat(a)} – ${tanggalSingkat(b)}`;
}

/**
 * Jam gaya Indonesia: "07:15" -> "07:15" (24 jam).
 * Fungsi ini dipertahankan sebagai alias agar pemakaian di komponen konsisten.
 */
export function jamId(hhmm: string | null | undefined): string {
  return hhmm && hhmm.length >= 5 ? hhmm.slice(0, 5) : "-";
}
