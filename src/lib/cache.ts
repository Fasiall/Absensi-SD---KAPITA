import "server-only";

import { cacheLife, cacheTag, revalidateTag } from "next/cache";

import { prisma } from "@/lib/db";
import { readClock, todayLocal } from "@/lib/time";

/**
 * Cache untuk data yang jarang berubah.
 *
 * Kenapa: database Supabase berada di Singapura, jadi setiap query punya biaya
 * latensi nyata. Data referensi seperti daftar kelas dan daftar guru hampir
 * tidak pernah berubah antar-navigasi, sehingga tidak perlu diambil ulang.
 *
 * Memakai direktif `"use cache"` (standar Next 16, menggantikan `unstable_cache`)
 * bersama `cacheTag` agar tiap entri bisa di-invalidate saat ada aksi tulis.
 */

export const CACHE_TAGS = {
  classes: "classes",
  teachers: "teachers",
  dashboard: "dashboard",
} as const;

/** Daftar kelas beserta wali kelas dan jumlah siswa. */
export async function getCachedClasses() {
  "use cache";
  cacheTag(CACHE_TAGS.classes);
  cacheLife({ stale: 60, revalidate: 60, expire: 300 });

  return await prisma.schoolClass.findMany({
    orderBy: { namaKelas: "asc" },
    include: { guru: true, _count: { select: { students: true } } },
  });
}

/** Daftar guru aktif (untuk dropdown wali kelas). */
export async function getCachedTeachers() {
  "use cache";
  cacheTag(CACHE_TAGS.teachers);
  cacheLife({ stale: 60, revalidate: 60, expire: 300 });

  return await prisma.user.findMany({
    where: { role: "guru", aktif: true },
    orderBy: { nama: "asc" },
    select: { id: true, nama: true },
  });
}

/**
 * Ringkasan angka untuk dashboard admin.
 *
 * Tanggal dihitung DI DALAM fungsi supaya `new Date()` tidak terbaca sebagai
 * nilai "unstable" saat tahap prerendering. Hitungan absensi hari ini memang
 * dinamis, jadi masa cache dibuat sangat pendek — cukup menyerap klik beruntun.
 */
export async function getDashboardCounts() {
  "use cache";
  cacheTag(CACHE_TAGS.dashboard);
  cacheLife({ stale: 10, revalidate: 10, expire: 30 });

  const today = todayLocal();
  const [students, classes, teachers, todayAttendance] = await Promise.all([
    prisma.student.count({ where: { aktif: true } }),
    prisma.schoolClass.count(),
    prisma.user.count({ where: { role: "guru" } }),
    prisma.attendance.count({
      where: { tanggal: new Date(`${today}T00:00:00Z`) },
    }),
  ]);
  return { students, classes, teachers, todayAttendance };
}

/**
 * Jam lokal untuk sapaan dan label tanggal di dashboard.
 *
 * `new Date()` di Next 16 terbaca sebagai synchronous IO saat prerender.
 * `readClock()` sudah dibungkus `"use cache"`, jadi cukup diteruskan.
 */
export async function getTodayClock() {
  const { today, time } = await readClock();
  return { now: today, jam: Number(time.slice(0, 2)) };
}

/**
 * Bersihkan cache data referensi setelah aksi tulis.
 *
 * Panggil di setiap Server Action / Route Handler yang mengubah kelas, guru,
 * atau siswa — supaya perubahan langsung terlihat tanpa menunggu TTL habis.
 */
export function revalidateReferenceData() {
  // `{ expire: 0 }` = jangan pernah menyajikan data basi; request berikutnya
  // menunggu revalidasi selesai sehingga admin langsung melihat perubahannya.
  revalidateTag(CACHE_TAGS.classes, { expire: 0 });
  revalidateTag(CACHE_TAGS.teachers, { expire: 0 });
  revalidateTag(CACHE_TAGS.dashboard, { expire: 0 });
}
