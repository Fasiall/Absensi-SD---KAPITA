import { NextResponse, type NextRequest } from "next/server";

/**
 * Menyediakan pathname aktif ke Server Components (mis. layout guru) lewat
 * header `x-pathname`. Next 16 tidak punya hook pathname di server.
 */
export function middleware(request: NextRequest) {
  const headers = new Headers(request.headers);
  headers.set("x-pathname", request.nextUrl.pathname);
  return NextResponse.next({ request: { headers } });
}

export const config = {
  matcher: ["/guru/:path*", "/cetak/:path*", "/admin/:path*", "/akun/:path*"],
};
