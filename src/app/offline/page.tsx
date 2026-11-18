export const metadata = { title: "Offline" };

export default function OfflinePage() {
  return (
    <div className="mx-auto flex min-h-[70vh] max-w-md flex-col items-center justify-center px-4 text-center">
      <h1 className="font-display text-2xl text-ink">Anda sedang offline</h1>
      <p className="mt-2 text-sm text-muted">
        Sambungkan perangkat ke internet lalu muat ulang halaman. Absensi yang belum terkirim
        tersimpan di perangkat dan akan disinkronkan otomatis.
      </p>
      <a
        href="/"
        className="mt-6 inline-flex items-center gap-2 rounded-soft bg-accent px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-accent-strong"
      >
        Coba lagi
      </a>
    </div>
  );
}
