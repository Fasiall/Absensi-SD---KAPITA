import type { CSSProperties } from "react";

/**
 * Panel ilustrasi halaman login.
 *
 * Latar panel memakai krem (#F6F3F3), sama dengan panel form, sehingga tidak
 * ada batas warna di tengah layar. Satu-satunya fade ada di tepi KANAN saja:
 * gambar memudar ke krem agar peralihan ke area form terasa halus. Tepi atas
 * dan bawah dibiarkan utuh (tidak diberi mask) sesuai permintaan.
 */
const maskStyle: CSSProperties = {
  maskImage:
    "linear-gradient(to left, transparent 0%, rgba(0,0,0,0.08) 7%, rgba(0,0,0,0.28) 16%, rgba(0,0,0,0.62) 26%, #000 40%)",
  WebkitMaskImage:
    "linear-gradient(to left, transparent 0%, rgba(0,0,0,0.08) 7%, rgba(0,0,0,0.28) 16%, rgba(0,0,0,0.62) 26%, #000 40%)",
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
