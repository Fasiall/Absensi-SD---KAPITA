/**
 * Seed daftar kelas SD Negeri Purwodadi Simpang.
 *
 * Total 20 kelas, format "1 A" (angka, spasi, huruf):
 *   Kelas 1 -> A, B, C
 *   Kelas 2 -> A, B, C
 *   Kelas 3 -> A, B, C
 *   Kelas 4 -> A, B, C, D
 *   Kelas 5 -> A, B, C, D
 *   Kelas 6 -> A, B, C
 *
 * Skrip ini idempoten:
 * - Kelas lama tanpa spasi (mis. "1A") di-rename menjadi "1 A". Siswa tidak
 *   terpengaruh karena relasinya lewat kolom class_id, bukan nama kelas.
 * - Kelas yang sudah sesuai format dilewati.
 * - Kelas yang belum ada dibuat baru, tanpa siswa dan tanpa wali kelas.
 *
 * Jalankan dengan: node prisma/seed-classes.mjs
 */

import { readFileSync } from "node:fs";

import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

/** Ambil DATABASE_URL dari environment, fallback ke .env.local. */
function ambilUrl() {
  if (process.env.DATABASE_URL) return process.env.DATABASE_URL;

  try {
    const isi = readFileSync(".env.local", "utf8");
    for (const baris of isi.split("\n")) {
      const cocok = baris.match(/^\s*DATABASE_URL\s*=\s*(.+)\s*$/);
      if (cocok) return cocok[1].trim().replace(/^["']|["']$/g, "");
    }
  } catch {
    // diabaikan — pesan jelas diberikan di bawah.
  }

  throw new Error("DATABASE_URL tidak ditemukan di environment maupun .env.local");
}

const prisma = new PrismaClient({
  adapter: new PrismaPg({
    connectionString: ambilUrl(),
    idleTimeoutMillis: 10_000,
    connectionTimeoutMillis: 15_000,
    max: 1,
  }),
});

/** Susunan rombongan belajar per tingkat. */
const TINGKAT = [
  [1, ["A", "B", "C"]],
  [2, ["A", "B", "C"]],
  [3, ["A", "B", "C"]],
  [4, ["A", "B", "C", "D"]],
  [5, ["A", "B", "C", "D"]],
  [6, ["A", "B", "C"]],
];

/** Nama kelas target, format "1 A". */
const TARGET = TINGKAT.flatMap(([tingkat, rombel]) =>
  rombel.map((huruf) => `${tingkat} ${huruf}`),
);

/** Nama kelas tanpa spasi (format lama) -> format baru. */
const RENAME = new Map(
  TINGKAT.flatMap(([tingkat, rombel]) =>
    rombel.map((huruf) => [`${tingkat}${huruf}`, `${tingkat} ${huruf}`]),
  ),
);

async function main() {
  console.log(`Target: ${TARGET.length} kelas\n`);

  // 1. Rename kelas lama tanpa spasi (mis. "1A" -> "1 A").
  let diRename = 0;
  for (const [lama, baru] of RENAME) {
    const ada = await prisma.schoolClass.findFirst({
      where: { namaKelas: lama },
      select: { id: true },
    });
    if (!ada) continue;

    // Jangan menimpa bila kelas dengan nama baru sudah ada.
    const bentrok = await prisma.schoolClass.findFirst({
      where: { namaKelas: baru },
      select: { id: true },
    });
    if (bentrok) {
      console.log(`  ! ${lama} dilewati: "${baru}" sudah ada (id=${bentrok.id})`);
      continue;
    }

    await prisma.schoolClass.update({
      where: { id: ada.id },
      data: { namaKelas: baru },
    });
    diRename += 1;
    console.log(`  ~ ${lama} -> ${baru}`);
  }

  // 2. Buat kelas yang belum ada.
  let dibuat = 0;
  for (const namaKelas of TARGET) {
    const ada = await prisma.schoolClass.findFirst({
      where: { namaKelas },
      select: { id: true },
    });
    if (ada) continue;

    await prisma.schoolClass.create({ data: { namaKelas } });
    dibuat += 1;
    console.log(`  + ${namaKelas} dibuat`);
  }

  const total = await prisma.schoolClass.count();
  console.log(`\nSelesai. ${diRename} di-rename, ${dibuat} dibuat baru.`);
  console.log(`Total kelas di database: ${total}`);
}

main()
  .catch((error) => {
    console.error("Gagal:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
