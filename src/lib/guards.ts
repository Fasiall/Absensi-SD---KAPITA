import "server-only";

import { redirect } from "next/navigation";

import { getCurrentUser, type SessionUser } from "@/lib/auth";

/** Setara @login_required — redirect ke /login bila belum masuk. */
export async function requireLogin(nextPath?: string): Promise<SessionUser> {
  const user = await getCurrentUser();
  if (!user) {
    const target = nextPath
      ? `/login?next=${encodeURIComponent(nextPath)}`
      : "/login";
    redirect(target);
  }
  return user;
}

/** Setara require_admin — hanya role admin, selain itu 403. */
export async function requireAdmin(nextPath?: string): Promise<SessionUser> {
  const user = await requireLogin(nextPath);
  if (user.role !== "admin") {
    throw new ForbiddenError();
  }
  return user;
}

/** Setara require_staff — guru atau admin. */
export async function requireStaff(nextPath?: string): Promise<SessionUser> {
  const user = await requireLogin(nextPath);
  if (user.role !== "admin" && user.role !== "guru") {
    throw new ForbiddenError();
  }
  return user;
}

export class ForbiddenError extends Error {
  constructor() {
    super("Anda tidak punya akses ke fitur ini.");
    this.name = "ForbiddenError";
  }
}

/**
 * Jalankan guard DAN query halaman secara paralel.
 *
 * Pola lama (dua roundtrip DB berurutan):
 *   const user = await requireAdmin("/admin/kelas");  // roundtrip #1
 *   const data = await prisma...                       // roundtrip #2
 *
 * Pola baru (dua roundtrip berjalan bersamaan):
 *   const [user, data] = await guardWith(requireAdmin("/admin/kelas"), () => prisma...)
 *
 * PENTING: `redirect()` dan `notFound()` bekerja dengan melempar error khusus
 * (digest NEXT_REDIRECT / NEXT_NOT_FOUND). Kalau error itu ikut ter-await oleh
 * `Promise.all`, Next tidak mengenalinya sebagai sinyal kontrol dan halaman
 * berakhir sebagai error 500 alih-alih redirect ke /login. Karena itu guard
 * ditangani terpisah: kegagalan guard selalu menang, dan hanya bila guard sukses
 * hasil `load()` yang dipakai.
 */
export async function guardWith<T>(
  guard: Promise<SessionUser>,
  load: () => Promise<T>,
): Promise<[SessionUser, T]> {
  // `load()` sengaja dimulai lebih dulu agar berjalan bersamaan dengan guard.
  const loaded = load();

  let user: SessionUser;
  try {
    user = await guard;
  } catch (error) {
    // Guard gagal (redirect / 403). Batalkan hasil load agar tidak ada
    // promise rejection yang lolos tanpa penanganan.
    loaded.catch(() => {});
    throw error;
  }

  // Guard sukses: teruskan hasil query. Error non-kontrol di sini adalah bug
  // query yang sesungguhnya, jadi dibiarkan naik apa adanya.
  return [user, await loaded];
}

export class UnauthorizedError extends Error {
  constructor(message = "Sesi berakhir. Muat ulang halaman lalu masuk kembali.") {
    super(message);
    this.name = "UnauthorizedError";
  }
}
