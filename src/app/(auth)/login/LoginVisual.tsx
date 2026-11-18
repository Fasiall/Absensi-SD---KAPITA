import type { CSSProperties } from "react";

/**
 * Panel ilustrasi halaman login.
 *
 * Tidak ada lagi latar biru di panel ini — latarnya krem (#F6F3F3) sehingga
 * gambar melebur langsung ke panel form di sebelahnya. Mask dipasang di tiga
 * sisi (atas, kanan, bawah) dengan kurva landai supaya seluruh batas gambar
 * larut tanpa garis tepi yang kaku.
 *
 * Catatan: tiap gradient harus #000 penuh di dua sisi lainnya, kalau tidak
 * area yang seharusnya utuh ikut terpotong dan muncul garis batas.
 */
const MASK_IMAGE = [
  // tepi atas: transparan -> penuh
  `linear-gradient(to bottom,
    transparent 0%,
    rgba(0,0,0,0.08) 6%,
    rgba(0,0,0,0.28) 13%,
    rgba(0,0,0,0.62) 22%,
    #000 34%)`,

  // tepi kanan: penuh -> transparan (melebur ke panel form)
  `linear-gradient(to left,
    transparent 0%,
    rgba(0,0,0,0.08) 7%,
    rgba(0,0,0,0.28) 16%,
    rgba(0,0,0,0.62) 26%,
    #000 40%)`,

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
    <section className="relative hidden overflow-hidden bg-[#F6F3F3] lg:block">
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
