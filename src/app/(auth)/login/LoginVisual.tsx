import type { CSSProperties } from "react";

/**
 * Panel ilustrasi halaman login.
 *
 * Tepi kanan panel (batas dengan panel form krem) melebur ke #F6F3F3 lewat
 * gradient overlay, sehingga tidak ada lagi garis vertikal keras di tengah
 * layar. Tepi atas/bawah tetap memakai mask agar gambar larut ke biru panel.
 */
const MASK_IMAGE = [
  // tepi atas: transparan -> penuh
  `linear-gradient(to bottom,
    transparent 0%,
    rgba(0,0,0,0.08) 6%,
    rgba(0,0,0,0.28) 13%,
    rgba(0,0,0,0.62) 22%,
    #000 34%)`,

  // tepi bawah: transparan -> penuh
  `linear-gradient(to top,
    transparent 0%,
    rgba(0,0,0,0.08) 7%,
    rgba(0,0,0,0.28) 15%,
    rgba(0,0,0,0.62) 25%,
    #000 38%)`,
]
  .map((value) => value.replace(/\s+/g, " "))
  .join(", ");

const maskStyle: CSSProperties = {
  maskImage: MASK_IMAGE,
  WebkitMaskImage: MASK_IMAGE,
  maskComposite: "intersect",
  WebkitMaskComposite: "source-in",
};

export default function LoginVisual() {
  return (
    <section className="relative hidden overflow-hidden bg-[#16B0F6] lg:block">
      {/* Gambar: memudar di tepi atas & bawah */}
      <div className="absolute inset-0" style={maskStyle} aria-hidden="true">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/login.jpg"
          alt=""
          className="h-full w-full object-cover object-center"
        />
      </div>
    </section>
  );
}
