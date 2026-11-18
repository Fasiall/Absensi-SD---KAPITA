import type { CSSProperties } from "react";

/**
 * Mask tiga sisi: gambar memudar di tepi atas, kanan, dan bawah.
 * Setiap gradient menyisakan area transparan di satu sisi; mask-composite
 * "intersect" meng-AND-kan ketiganya sehingga seluruh batas gambar larut
 * ke latar tanpa garis tepi yang kaku.
 */
const MASK_IMAGE = [
  "linear-gradient(to bottom, transparent 0%, #000 16%)",
  "linear-gradient(to left, transparent 0%, #000 42%)",
  "linear-gradient(to top, transparent 0%, #000 14%)",
].join(", ");

const maskStyle = {
  maskImage: MASK_IMAGE,
  WebkitMaskImage: MASK_IMAGE,
  maskComposite: "intersect",
  WebkitMaskComposite: "source-in",
} as CSSProperties;

export default function LoginVisual() {
  return (
    <section className="relative hidden overflow-hidden bg-[#16B0F6] lg:block">
      <div className="pointer-events-none absolute inset-0" style={maskStyle} aria-hidden="true">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/login.jpg" alt="" className="h-full w-full object-cover" />
      </div>

      {/* Penguat fade tepi kanan agar menyatu dengan panel login (#F6F3F3) */}
      <div
        className="pointer-events-none absolute inset-y-0 right-0 w-[40%] bg-gradient-to-r from-transparent via-[#F6F3F3]/55 to-[#F6F3F3]"
        aria-hidden="true"
      />

      {/* Penguat fade tepi atas dan bawah */}
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-[#16B0F6]/90 via-[#16B0F6]/35 to-transparent"
        aria-hidden="true"
      />
      <div
        className="pointer-events-none absolute inset-x-0 bottom-0 h-28 bg-gradient-to-t from-[#16B0F6]/90 via-[#16B0F6]/35 to-transparent"
        aria-hidden="true"
      />
    </section>
  );
}
