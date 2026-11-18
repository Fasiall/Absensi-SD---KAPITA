// Port 1:1 dari app/timeutil.py
// Semua tanggal/jam disimpan & dibaca dalam zona waktu APP_TIMEZONE (default Asia/Jakarta).

const APP_TZ = process.env.APP_TIMEZONE || "Asia/Jakarta";

/** Bagian-bagian tanggal/jam pada zona waktu aplikasi. */
function partsInTz(date: Date = new Date()) {
  const fmt = new Intl.DateTimeFormat("en-CA", {
    timeZone: APP_TZ,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  });
  const out: Record<string, string> = {};
  for (const p of fmt.formatToParts(date)) {
    if (p.type !== "literal") out[p.type] = p.value;
  }
  return out;
}

/** "YYYY-MM-DD" untuk hari ini (zona aplikasi). */
export function todayLocal(): string {
  const p = partsInTz();
  return `${p.year}-${p.month}-${p.day}`;
}

/** Jam sekarang "HH:MM" (zona aplikasi). */
export function timeLocal(): string {
  const p = partsInTz();
  return `${p.hour}:${p.minute}`;
}

/** Date object untuk 00:00 UTC dari "YYYY-MM-DD" — dipakai kolom @db.Date. */
export function dateOnly(isoDate: string): Date {
  const [y, m, d] = isoDate.split("-").map(Number);
  return new Date(Date.UTC(y, (m || 1) - 1, d || 1));
}

/** Date object untuk TIME — Prisma @db.Time memakai Date dengan bagian tanggal 1970-01-01. */
export function timeOnly(hhmm: string): Date {
  const [h, m] = hhmm.split(":").map(Number);
  return new Date(Date.UTC(1970, 0, 1, h || 0, m || 0, 0));
}

/** Format Date dari kolom @db.Date atau ISO string menjadi "YYYY-MM-DD". */
export function toIsoDate(value: Date | string): string {
  if (typeof value === "string") return value.slice(0, 10);
  return value.toISOString().slice(0, 10);
}

/** Format Date dari kolom @db.Time menjadi "HH:MM". */
export function toHm(value: Date | string | null | undefined): string | null {
  if (!value) return null;
  if (typeof value === "string") return value.slice(0, 5);
  return `${String(value.getUTCHours()).padStart(2, "0")}:${String(
    value.getUTCMinutes(),
  ).padStart(2, "0")}`;
}

/** parse_date() dari Flask: ambil tanggal valid atau default. */
export function parseDate(value: unknown, fallback: string): string {
  const raw = String(value ?? "").trim().slice(0, 10);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(raw)) return fallback;
  const d = new Date(`${raw}T00:00:00Z`);
  if (Number.isNaN(d.getTime())) return fallback;
  return raw;
}

/** Tambah/kurangi hari pada "YYYY-MM-DD". */
export function addDays(isoDate: string, days: number): string {
  const d = dateOnly(isoDate);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

/** Awal bulan "YYYY-MM-01". */
export function startOfMonth(isoDate: string): string {
  return `${isoDate.slice(0, 7)}-01`;
}
