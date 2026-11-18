"use server";

import { redirect } from "next/navigation";

import { prisma } from "@/lib/db";
import { homeFor, isSafeUrl, setSessionCookie, signSession } from "@/lib/auth";
import { verifyPassword } from "@/lib/password";

/**
 * Setara login() di Flask:
 * - username case-insensitive
 * - user nonaktif ditolak dengan pesan yang sama
 * - redirect ke parameter `next` jika aman, selain itu ke home sesuai role
 */
export async function loginAction(formData: FormData) {
  const username = String(formData.get("username") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const remember = Boolean(formData.get("remember"));
  const rawNext = String(formData.get("next") ?? "");
  const next = isSafeUrl(rawNext) ? rawNext : "";

  const fail = (): never => {
    const query = new URLSearchParams({ error: "1" });
    if (next) query.set("next", next);
    redirect(`/login?${query.toString()}`);
  };

  if (!username || !password) fail();

  const found = await prisma.user.findFirst({
    where: { username: { equals: username, mode: "insensitive" } },
    select: { id: true, passwordHash: true, aktif: true, role: true, nama: true, username: true },
  });

  if (!found || !found.aktif) fail();
  const account = found!;

  const valid = await verifyPassword(password, account.passwordHash);
  if (!valid) fail();

  const token = await signSession(account.id, remember);
  await setSessionCookie(token, remember);

  const role = account.role === "admin" ? "admin" : "guru";
  redirect(
    next ||
      homeFor({ id: account.id, nama: account.nama, username: account.username, role }),
  );
}

export async function logoutAction() {
  const { clearSessionCookie } = await import("@/lib/auth");
  await clearSessionCookie();
  redirect("/login");
}
