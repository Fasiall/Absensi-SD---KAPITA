import { NextResponse, type NextRequest } from "next/server";

/**
 * Menyediakan pathname aktif ke Server Components (mis. layout guru) lewat
 * header `x-pathname`. Next 16 tidak punya hook pathname di server.
 *
 * Sekaligus memaksa route terproteksi agar TIDAK di-cache oleh CDN Vercel.
 * Tanpa ini, respons redirect ke /login ikut ter-cache sebagai halaman
 * statis (status 200) sehingga pengguna melihat halaman error alih-alih
 * dialihkan ke form masuk.
 */
export function middleware(request: NextRequest) {
  const headers = new Headers(request.headers);
  headers.set("x-pathname", request.nextUrl.pathname);

  const response = NextResponse.next({ request: { headers } });
  response.headers.set("Cache-Control", "private, no-store, max-age=0, must-revalidate");
  return response;
}

export const config = {
  matcher: ["/guru/:path*", "/cetak/:path*", "/admin/:path*", "/akun/:path*"],
};
