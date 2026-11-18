/**
 * Klasifikasi error koneksi database.
 *
 * Dipisah dari `db.ts` supaya tidak menyeret inisialisasi PrismaClient saat
 * diimpor (mis. oleh `error.tsx` yang berjalan di browser). Fungsi di sini
 * murni: tidak menyentuh `process.env` maupun Prisma.
 */

/**
 * Kode error Prisma yang menandakan database tidak dapat dijangkau:
 * - `P1001` host tidak terjangkau (Supabase pause / project dihapus)
 * - `P1002` koneksi timeout
 * - `P1008` operasi timeout
 * - `P1017` server menutup koneksi (pooler memutus soket idle)
 * - `P2024` pool kehabisan koneksi
 */
const CONNECTION_ERROR_CODES = new Set(["P1001", "P1002", "P1008", "P1017", "P2024"]);

export function isDatabaseUnavailable(error: unknown): boolean {
  if (!error || typeof error !== "object") return false;

  const code = (error as { code?: unknown }).code;
  if (typeof code === "string" && CONNECTION_ERROR_CODES.has(code)) return true;

  const name = (error as { name?: unknown }).name;
  if (name === "PrismaClientInitializationError") return true;

  // Di halaman error Next hanya meneruskan `message` dan `digest`, jadi pesan
  // teks tetap perlu diperiksa.
  const message = (error as { message?: unknown }).message;
  return (
    typeof message === "string" &&
    /ECONNREFUSED|ENOTFOUND|ETIMEDOUT|Connection terminated|Connection closed/i.test(message)
  );
}
