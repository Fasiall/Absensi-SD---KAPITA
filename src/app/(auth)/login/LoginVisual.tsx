export default function LoginVisual() {
  return (
    <section className="relative hidden overflow-hidden bg-[#16B0F6] lg:flex lg:flex-col">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/login.jpg"
        alt=""
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 h-full w-full object-cover"
      />
      <div
        className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#0B6E9B]/85 via-[#16B0F6]/35 to-[#16B0F6]/10"
        aria-hidden="true"
      />

      <div className="relative z-10 flex flex-1 flex-col justify-end px-14 py-12">
        <div className="text-white">
          <p className="font-[family-name:var(--font-tagline)] text-xs uppercase tracking-[0.42em] text-white/85">
            your character, your hero!!
          </p>
          <h1 className="mt-4 font-[family-name:var(--font-display)] text-[68px] leading-[0.92] text-[#E099B7] drop-shadow-[0_6px_18px_rgba(9,63,92,0.25)]">
            Art Design
          </h1>
          <p className="mt-5 max-w-[340px] text-[15px] leading-relaxed text-white/90">
            Sistem absensi QR Code untuk sekolah dasar. Cepat, rapi, dan bisa dipakai
            langsung dari kamera ponsel.
          </p>
        </div>
      </div>
    </section>
  );
}
