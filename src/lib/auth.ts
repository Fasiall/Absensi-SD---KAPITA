import "server-only";

import { cacheLife } from "next/cache";
import { cookies } from "next/headers";
import { SignJWT, jwtVerify } from "jose";

import { prisma } from "@/lib/db";

export const SESSION_COOKIE = "absensi_session";
const SESSION_TTL_SECONDS = 12 * 60 * 60; // PERMANENT_SESSION_LIFETIME = 12 jam
const REMEMBER_TTL_SECONDS = 30 * 24 * 60 * 60;

export type SessionUser = {
  id: number;
  nama: string;
  username: string;
  role: "admin" | "guru";
};

function secretKey(): Uint8Array {
  const secret = process.env.SECRET_KEY;
  if (!secret) {
    throw new Error(
      "SECRET_KEY belum diset. Tambahkan ke .env.local atau environment variables.",
    );
  }
  return new TextEncoder().encode(secret);
}

export async function signSession(userId: number, remember: boolean): Promise<string> {
  const ttl = remember ? REMEMBER_TTL_SECONDS : SESSION_TTL_SECONDS;
  return new SignJWT({ sub: String(userId) })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${ttl}s`)
    .sign(secretKey());
}

export async function readSessionUserId(): Promise<number | null> {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secretKey());
    const id = Number(payload.sub);
    return Number.isFinite(id) ? id : null;
  } catch {
    return null;
  }
}

/**
 * Setara user_loader: hanya mengembalikan user yang masih aktif.
 *
 * `jwtVerify()` memeriksa klaim `exp` dengan `new Date()`. Di Next 16 panggilan
 * itu terbaca sebagai synchronous IO dan menggagalkan prerender. Scope
 * `"use cache: private"` membuat `io()` menjadi no-op sekaligus mengeluarkan
 * pembacaan sesi dari static shell — cache-nya hanya ada di sisi browser,
 * tidak pernah disimpan di cache server.
 */
export async function getCurrentUser(): Promise<SessionUser | null> {
  "use cache: private";
  cacheLife({ stale: Infinity });

  const id = await readSessionUserId();
  if (!id) return null;
  const user = await prisma.user.findUnique({
    where: { id },
    select: { id: true, nama: true, username: true, role: true, aktif: true },
  });
  if (!user || !user.aktif) return null;
  return {
    id: user.id,
    nama: user.nama,
    username: user.username,
    role: user.role === "admin" ? "admin" : "guru",
  };
}

export async function setSessionCookie(token: string, remember: boolean) {
  const store = await cookies();
  store.set({
    name: SESSION_COOKIE,
    value: token,
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.SESSION_COOKIE_SECURE === "1",
    path: "/",
    ...(remember ? { maxAge: REMEMBER_TTL_SECONDS } : {}),
  });
}

export async function clearSessionCookie() {
  const store = await cookies();
  store.delete(SESSION_COOKIE);
}

/** Setara _home_for(): tujuan redirect setelah login. */
export function homeFor(user: SessionUser): string {
  return user.role === "admin" ? "/admin" : "/guru/scan";
}

/** Setara is_safe_url(): cegah open redirect. */
export function isSafeUrl(target: string | null | undefined): boolean {
  if (!target) return false;
  return (
    target.startsWith("/") &&
    !target.startsWith("//") &&
    !target.includes("\\")
  );
}
