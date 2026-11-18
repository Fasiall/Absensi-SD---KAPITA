import type { CSSProperties } from "react";

/**
 * Mask tiga sisi untuk ilustrasi login.
 *
 * Tiap gradient hanya boleh memudar di SATU sisi (top / right / bottom) dan
 * wajib bernilai #000 penuh di dua sisi lainnya. Kalau satu gradient ikut
 * transparan di sisi lain, area yang seharusnya terlihat akan ikut terpotong
 * dan muncul garis batas yang kasar di tepi atas/bawah.
 *
 * Multi-stop dipakai agar kurvanya landai (bukan linear kaku), sehingga
 * peralihannya terasa seperti fade, bukan garis.
 */
const SOLID = "#000";

const MASK_IMAGE = [
  // tepi atas: transparan -> penuh
  `linear-gradient(to bottom,
    transparent 0%,
    rgba(0,0,0,0.08) 6%,
    rgba(0,0,0,0.28) 13%,
    rgba(0,0,0,0.62) 22%,
    ${SOLID} 34%)`,

  // tepi kanan: penuh -> transparan
  `linear-gradient(to left,
    transparent 0%,
    rgba(0,0,0,0.08) 8%,
    rgba(0,0,0,0.3) 18%,
    rgba(0,0,0,0.65) 30%,
    ${SOLID} 46%)`,

  // tepi bawah: transparan -> penuh
  `linear-gradient(to top,
    transparent 0%,
    rgba(0,0,0,0.08) 7%,
    rgba(0,0,0,0.28) 15%,
    rgba(0,0,0,0.62) 25%,
    ${SOLID} 38%)`,
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
