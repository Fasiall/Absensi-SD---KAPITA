import type { Metadata } from "next";

/**
 * Lembar kartu QR dirender sebagai dokumen cetak mandiri: tanpa navigasi
 * aplikasi, memakai `public/css/print.css` dan ukuran kertas A4.
 */
export const metadata: Metadata = {
  title: "Kartu QR",
  robots: { index: false, follow: false },
};

export default function KartuLayout({ children }: { children: React.ReactNode }) {
  return children;
}
