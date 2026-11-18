"use client";

import { useEffect } from "react";

import { isDatabaseUnavailable } from "@/lib/db-errors";

/**
 * Error boundary untuk seluruh route di bawah `src/app`.
 *
 * Kenapa ada: pesan error mentah Prisma ("Can't reach database server",
 * "Connection terminated unexpectedly") membingungkan guru dan admin sekolah.
 * Ketika Supabase di-pause atau pooler memutus koneksi, pesan yang tepat adalah
 * "coba lagi sebentar" — bukan stack trace.
 *
 * Catatan: `error.tsx` wajib Client Component, jadi `isDatabaseUnavailable`
 * dipanggil dengan error yang sudah diserialisasi Next (hanya `message` dan
 * `digest` yang bertahan). Karena itu klasifikasinya juga membaca `message`.
 */
export default function AppError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const offline = isDatabaseUnavailable(error);

  useEffect(() => {
    console.error("[app-error]", error);
  }, [error]);

  return (
    <main className="grid min-h-screen place-items-center bg-[#F6F3F3] px-5 py-10">
      <div className="w-full max-w-[440px] rounded-2xl bg-white p-7 text-center shadow-sm">
        <h1 className="font-[family-name:var(--font-display)] text-2xl font-black text-[#1E88C7]">
          {offline ? "Database belum bisa diakses" : "Terjadi kesalahan"}
        </h1>

        <p className="mt-3 text-sm text-[#6B6B6B]">
          {offline
            ? "Server data sedang tidak merespons. Biasanya hanya sebentar — silakan coba lagi beberapa saat lagi."
            : "Halaman ini gagal dimuat. Coba muat ulang; kalau masih gagal, hubungi admin sekolah."}
        </p>

        {error.digest && (
          <p className="mt-4 text-xs text-[#9A9A9A]">Kode kesalahan: {error.digest}</p>
        )}

        <button
          type="button"
          onClick={reset}
          className="mt-6 h-11 w-full rounded-[40px] bg-[#1E88C7] text-sm font-semibold uppercase tracking-[0.14em] text-white transition hover:bg-[#1976AF]"
        >
          Coba lagi
        </button>
      </div>
    </main>
  );
}
