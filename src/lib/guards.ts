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
 * Latensi total menjadi yang paling lambat, bukan jumlah keduanya — memangkas
 * satu roundtrip penuh per navigasi halaman.
 */
export async function guardWith<T>(
  guard: Promise<SessionUser>,
  load: () => Promise<T>,
): Promise<[SessionUser, T]> {
  return await Promise.all([guard, load()]);
}

export class UnauthorizedError extends Error {
  constructor(message = "Sesi berakhir. Muat ulang halaman lalu masuk kembali.") {
    super(message);
    this.name = "UnauthorizedError";
  }
}
