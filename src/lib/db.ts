import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

/**
 * Pesan error yang jelas saat DATABASE_URL kosong.
 *
 * Sengaja menyebut nama env var dan menyebut Vercel, karena pesan lama yang
 * berbunyi ".env.local" menyesatkan: di production variabel ini diisi lewat
 * dashboard Vercel, bukan file lokal.
 */
function connectionString(): string {
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error(
      "DATABASE_URL belum diset. Di lokal tambahkan ke .env.local; " +
        "di production set lewat Environment Variables Vercel.",
    );
  }
  return url;
}

/**
 * Opsi pool untuk Supavisor (pooler Supabase, port 6543).
 *
 * Kenapa perlu diatur:
 * - Supavisor menutup koneksi yang menganggur cukup agresif. Kalau `pg` pool
 *   memegang soket yang sudah mati, query pertama setelah sepi bisa gagal
 *   dengan "Connection terminated unexpectedly". `idleTimeoutMillis` yang
 *   lebih pendek dari batas Supavisor membuat kita menutup duluan.
 * - `connectionTimeoutMillis` mencegah request menggantung selamanya ketika
 *   project Supabase sedang pause atau pooler menolak koneksi (509/kuota).
 *
 * Catatan: `connection_limit` di URL hanya dibaca Prisma, bukan oleh `pg`,
 * jadi batas nyata di sini adalah `max` pada pool.
 */
const POOL_OPTIONS = {
  idleTimeoutMillis: 10_000,
  connectionTimeoutMillis: 15_000,
  max: 1,
} as const;

function createClient() {
  return new PrismaClient({
    adapter: new PrismaPg({ connectionString: connectionString(), ...POOL_OPTIONS }),
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });
}

export const prisma = globalForPrisma.prisma ?? createClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}

