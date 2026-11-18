export default function LoginVisual() {
  return (
    <section className="relative hidden overflow-hidden bg-[#16B0F6] lg:flex lg:flex-col">
      <div
        className="pointer-events-none absolute -left-24 -top-24 size-[420px] rounded-full bg-[#3FC0FA] opacity-70 blur-[2px]"
        aria-hidden="true"
      />
      <div
        className="pointer-events-none absolute -bottom-32 -right-24 size-[460px] rounded-full bg-[#0E9BDD] opacity-80"
        aria-hidden="true"
      />

      <div className="relative z-10 flex flex-1 flex-col justify-center px-14 py-12">
        <div className="relative mx-auto w-full max-w-[380px]">
          <div
            className="absolute -left-6 top-10 h-28 w-28 rotate-[-12deg] rounded-[26px] bg-white/90 shadow-[0_18px_40px_rgba(8,60,90,0.18)]"
            aria-hidden="true"
          />
          <div
            className="absolute -right-2 bottom-6 h-24 w-24 rotate-[14deg] rounded-[22px] bg-[#E099B7] shadow-[0_18px_40px_rgba(8,60,90,0.18)]"
            aria-hidden="true"
          />

          <div className="relative mx-auto grid size-[248px] place-items-center rounded-[44px] border-[10px] border-white/25">
            <div className="grid size-[196px] place-items-center rounded-[34px] bg-white text-[#16B0F6] shadow-[0_24px_60px_rgba(8,60,90,0.22)]">
              <svg width="118" height="118" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                <path d="M3 3h7v7H3V3Zm11 0h7v7h-7V3ZM3 14h7v7H3v-7Zm11 3h3v3h-3v-3Zm4-3h3v3h-3v-3Zm0-3h3v1h-3v-1Zm-4 3h1v3h-1v-3Z" />
              </svg>
            </div>
          </div>
        </div>

        <div className="mt-12 text-white">
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
