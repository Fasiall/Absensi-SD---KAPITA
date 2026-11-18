import "server-only";

import { cookies } from "next/headers";

export type FlashTone = "success" | "danger" | "warning" | "info";
export type Flash = { tone: FlashTone; message: string };

const COOKIE = "flash";
const MAX_MESSAGES = 10;

/** Setara flash() Flask: pesan disimpan di cookie dan dibaca sekali di render berikutnya. */
export async function setFlash(messages: Flash[]) {
  const jar = await cookies();
  jar.set(COOKIE, JSON.stringify(messages.slice(0, MAX_MESSAGES)), {
    path: "/",
    httpOnly: true,
    sameSite: "lax",
    maxAge: 30,
  });
}

/**
 * Baca pesan flash. Cookie tidak bisa dihapus saat render, jadi pesan akan
 * tampil selama masa hidup cookie (30 detik) dan hilang sendiri setelah itu.
 * Untuk menghapusnya segera, gunakan `consumeFlash()` di Server Action.
 */
export async function takeFlash(): Promise<Flash[]> {
  const jar = await cookies();
  return parseFlash(jar.get(COOKIE)?.value ?? "");
}

/** Dipakai di Server Action / Route Handler: baca sekaligus hapus cookie flash. */
export async function consumeFlash(): Promise<Flash[]> {
  const jar = await cookies();
  const raw = jar.get(COOKIE)?.value;
  if (!raw) return [];
  jar.delete(COOKIE);
  return parseFlash(raw);
}

function parseFlash(raw: string): Flash[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as Flash[]) : [];
  } catch {
    return [];
  }
}
