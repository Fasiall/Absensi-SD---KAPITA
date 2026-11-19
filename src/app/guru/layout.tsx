import type { ReactNode } from "react";
import { headers } from "next/headers";

import { AppShell } from "@/components/AppShell";
import { navFor } from "@/lib/nav";
import { requireStaff } from "@/lib/guards";

/**
 * Layout ini membaca cookie sesi (lewat `requireStaff`) dan header pathname,
 * jadi tidak mungkin menghasilkan UI instan saat navigasi. Opt-out validasi
 * instant navigation supaya dev overlay tidak melaporkan error yang memang
 * disengaja.
 */
export const instant = false;

/** Shell bersama untuk semua halaman guru: navigasi ditangani di satu tempat. */
export default async function GuruLayout({ children }: { children: ReactNode }) {
  const user = await requireStaff("/guru");
  const pathname = (await headers()).get("x-pathname") ?? "/guru/scan";

  return (
    <AppShell
      user={user}
      nav={navFor(user)}
      current={pathname}
      title="Absensi Guru"
      hideTitle
    >
      {children}
    </AppShell>
  );
}
