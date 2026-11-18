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

export class UnauthorizedError extends Error {
  constructor(message = "Sesi berakhir. Muat ulang halaman lalu masuk kembali.") {
    super(message);
    this.name = "UnauthorizedError";
  }
}
