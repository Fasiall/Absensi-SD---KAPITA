export const metadata = { title: "Offline" };

export default function OfflinePage() {
  return (
    <div className="mx-auto flex min-h-[70vh] max-w-md flex-col items-center justify-center px-4 text-center">
      <h1 className="page-title">Anda sedang offline</h1>
      <p className="mt-2 text-sm leading-relaxed text-muted">
        Sambungkan perangkat ke internet lalu muat ulang halaman. Absensi yang belum terkirim
        tersimpan di perangkat dan akan disinkronkan otomatis.
      </p>
      <a href="/" className="btn btn-primary btn-lg mt-6">
        Coba lagi
      </a>
    </div>
  );
}
