import { NextResponse } from "next/server";

/** Manifest PWA versi Next.js (menggantikan /static/manifest.json milik Flask). */
export function GET() {
  const schoolName = process.env.SCHOOL_NAME ?? "SD KAPITA";

  const manifest = {
    name: `Absensi ${schoolName}`,
    short_name: "Absensi QR",
    description: `Absensi siswa ${schoolName} dengan scan kartu QR, rekap otomatis, dan ekspor Excel.`,
    lang: "id",
    dir: "ltr",
    start_url: "/",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#F4F7FB",
    theme_color: "#2563EB",
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any maskable" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any maskable" },
    ],
  };

  return NextResponse.json(manifest, {
    headers: {
      "Content-Type": "application/manifest+json; charset=utf-8",
      "Cache-Control": "public, max-age=3600",
    },
  });
}
