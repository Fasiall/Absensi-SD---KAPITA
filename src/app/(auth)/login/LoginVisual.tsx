export default function LoginVisual() {
  return (
    <section className="relative hidden overflow-hidden bg-[#16B0F6] lg:block">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/login.jpg"
        alt=""
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 h-full w-full object-cover"
      />

      {/* Gradient fade: menyatukan tepi kanan gambar ke panel login */}
      <div
        className="pointer-events-none absolute inset-y-0 right-0 w-[42%] bg-gradient-to-r from-transparent via-[#F6F3F3]/55 to-[#F6F3F3]"
        aria-hidden="true"
      />

      {/* Gradient fade: tepi atas dan bawah */}
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-black/25 to-transparent"
        aria-hidden="true"
      />
      <div
        className="pointer-events-none absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-black/30 to-transparent"
        aria-hidden="true"
      />
    </section>
  );
}
