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
    <main className="grid min-h-screen place-items-center bg-canvas px-4 py-10">
      <div className="card card-pad-lg w-full max-w-[420px] text-center">
        <h1 className="page-title text-[1.375rem]">
          {offline ? "Database belum bisa diakses" : "Terjadi kesalahan"}
        </h1>

        <p className="mt-2 text-sm leading-relaxed text-muted">
          {offline
            ? "Server data sedang tidak merespons. Biasanya hanya sebentar — silakan coba lagi beberapa saat lagi."
            : "Halaman ini gagal dimuat. Coba muat ulang; kalau masih gagal, hubungi admin sekolah."}
        </p>

        {error.digest && (
          <p className="mt-4 font-mono text-xs text-subtle">Kode kesalahan: {error.digest}</p>
        )}

        <button type="button" onClick={reset} className="btn btn-primary btn-lg btn-block mt-6">
          Coba lagi
        </button>
      </div>
    </main>
  );
}
