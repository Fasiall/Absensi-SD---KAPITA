import "server-only";

import { randomBytes, scrypt, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";
import bcrypt from "bcryptjs";

const scryptAsync = promisify(scrypt) as (
  password: string | Buffer,
  salt: string | Buffer,
  keylen: number,
  options: { N: number; r: number; p: number; maxmem: number },
) => Promise<Buffer>;

/**
 * Werkzeug (Flask) menyimpan password dengan format:
 *   scrypt:N:r:p$salt$hash            (Werkzeug >= 2.3)
 *   pbkdf2:sha256:iterations$salt$hash (Werkzeug lama)
 * Data dari aplikasi Flask lama harus tetap bisa login, jadi kita dukung keduanya
 * sekaligus bcrypt untuk user yang dibuat dari aplikasi Next.js ini.
 */
export async function verifyPassword(password: string, stored: string): Promise<boolean> {
  if (!stored) return false;

  if (stored.startsWith("scrypt:")) return verifyScrypt(password, stored);
  if (stored.startsWith("pbkdf2:")) return verifyPbkdf2(password, stored);
  if (stored.startsWith("$2a$") || stored.startsWith("$2b$") || stored.startsWith("$2y$")) {
    return bcrypt.compare(password, stored);
  }
  return false;
}

async function verifyScrypt(password: string, stored: string): Promise<boolean> {
  const [method, salt, expected] = stored.split("$");
  if (!method || !salt || !expected) return false;

  const [, nRaw, rRaw, pRaw] = method.split(":");
  const N = Number(nRaw) || 32768;
  const r = Number(rRaw) || 8;
  const p = Number(pRaw) || 1;

  try {
    const derived = await scryptAsync(password.normalize("NFKC"), salt, 64, {
      N,
      r,
      p,
      maxmem: 512 * 1024 * 1024,
    });
    const expectedBuf = Buffer.from(expected, "hex");
    if (expectedBuf.length !== derived.length) return false;
    return timingSafeEqual(derived, expectedBuf);
  } catch {
    return false;
  }
}

async function verifyPbkdf2(password: string, stored: string): Promise<boolean> {
  const [method, salt, expected] = stored.split("$");
  if (!method || !salt || !expected) return false;

  const parts = method.split(":");
  const iterations = Number(parts[2]) || 260000;

  const { pbkdf2 } = await import("node:crypto");
  const derived = await new Promise<Buffer>((resolve, reject) => {
    pbkdf2(password.normalize("NFKC"), salt, iterations, 32, "sha256", (err, key) =>
      err ? reject(err) : resolve(key),
    );
  });

  const expectedBuf = Buffer.from(expected, "hex");
  if (expectedBuf.length !== derived.length) return false;
  return timingSafeEqual(derived, expectedBuf);
}

/** Hash baru memakai scrypt dengan parameter Werkzeug default agar kompatibel dua arah. */
export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16).toString("hex");
  const derived = await scryptAsync(password.normalize("NFKC"), salt, 64, {
    N: 32768,
    r: 8,
    p: 1,
    maxmem: 512 * 1024 * 1024,
  });
  return `scrypt:32768:8:1$${salt}$${derived.toString("hex")}`;
}
